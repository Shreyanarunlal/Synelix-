"""Train and persist the Synelix model bundle.

Run with ``python -m synelix_ml.train``.  Produces:

* ``models/synelix_models.joblib`` - the bundle the API loads at start-up
* ``models/training_report.json`` - held-out metrics and learned importances

Four models are trained:

1. **Placement classifier** - gradient boosting, probability-calibrated, gives
   the headline placement probability.
2. **CTC regressor** - gradient boosting on the placed cohort, predicts the
   expected offer in LPA.  The tier band is derived from this prediction so
   the tier and the salary range can never disagree.
3. **Cohort model** - k-means over the scaled feature space, used to pick the
   roadmap archetype that fits a student.
4. **Job matcher** - TF-IDF over the job requirement corpus, used for
   content-based company matching.

The permutation importances computed here are what the dashboard shows as the
per-factor weights, so the "Coding & DSA: 32%" style breakdown reflects the
trained model rather than a constant in the UI.
"""

from __future__ import annotations

import json
from typing import Dict

import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.cluster import KMeans
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.inspection import permutation_importance
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    classification_report,
    mean_absolute_error,
    r2_score,
    roc_auc_score,
    root_mean_squared_error,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from . import dataset
from .config import (
    BUNDLE_PATH,
    CATEGORICAL_FEATURES,
    FEATURE_ORDER,
    METRICS_PATH,
    NUMERIC_FEATURES,
    RANDOM_SEED,
)
from .roles import JOB_CORPUS

import joblib

NUMERIC_COLUMNS = list(NUMERIC_FEATURES.keys())

# Maps each raw feature onto the factor the dashboard reports it under.
FACTOR_OF_FEATURE = {
    "dsa_solved": "Coding & DSA",
    "aptitude_score": "Aptitude & Logic",
    "cgpa": "Academic CGPA",
    "backlogs": "Academic CGPA",
    "projects_count": "Projects & Proof of Work",
    "hackathons_won": "Projects & Proof of Work",
    "internships_months": "Internship Experience",
    "certifications_count": "Certifications",
    "communication_score": "Communication",
    "department": "Department Context",
}

# The signal (from features.signal_scores) that scores each dashboard factor.
FACTOR_SIGNAL = {
    "Coding & DSA": "dsa",
    "Aptitude & Logic": "aptitude",
    "Academic CGPA": "cgpa",
    "Projects & Proof of Work": "projects",
    "Internship Experience": "internships",
    "Certifications": "certifications",
    "Communication": "communication",
}


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_COLUMNS),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ],
        remainder="drop",
    )


def train() -> Dict:
    frame = dataset.load_or_build()
    X = frame[FEATURE_ORDER]
    y_placed = frame["placed"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_placed, test_size=0.2, random_state=RANDOM_SEED, stratify=y_placed
    )

    # ---------------------------------------------------------------- model 1
    base_clf = Pipeline([
        ("prep", build_preprocessor()),
        ("gb", GradientBoostingClassifier(
            n_estimators=300,
            learning_rate=0.06,
            max_depth=3,
            subsample=0.9,
            random_state=RANDOM_SEED,
        )),
    ])
    # Isotonic calibration on a held-out split keeps the reported probability
    # interpretable - it is shown to students as a percentage, so it has to
    # mean what it says.
    placement_clf = CalibratedClassifierCV(base_clf, method="isotonic", cv=4)
    placement_clf.fit(X_train, y_train)

    proba = placement_clf.predict_proba(X_test)[:, 1]
    preds = (proba >= 0.5).astype(int)
    classification_metrics = {
        "accuracy": round(float(accuracy_score(y_test, preds)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, proba)), 4),
        "brier_score": round(float(brier_score_loss(y_test, proba)), 4),
        "report": classification_report(
            y_test, preds, target_names=["not placed", "placed"], output_dict=True
        ),
    }

    # ---------------------------------------------------------------- model 2
    placed = frame[frame["placed"] == 1]
    Xc = placed[FEATURE_ORDER]
    yc = placed["ctc_lpa"]
    Xc_train, Xc_test, yc_train, yc_test = train_test_split(
        Xc, yc, test_size=0.2, random_state=RANDOM_SEED
    )
    ctc_reg = Pipeline([
        ("prep", build_preprocessor()),
        ("gb", GradientBoostingRegressor(
            n_estimators=350,
            learning_rate=0.06,
            max_depth=3,
            subsample=0.9,
            random_state=RANDOM_SEED,
        )),
    ])
    ctc_reg.fit(Xc_train, yc_train)
    ctc_pred = ctc_reg.predict(Xc_test)
    regression_metrics = {
        "mae_lpa": round(float(mean_absolute_error(yc_test, ctc_pred)), 3),
        "rmse_lpa": round(float(root_mean_squared_error(yc_test, ctc_pred)), 3),
        "r2": round(float(r2_score(yc_test, ctc_pred)), 4),
        "train_rows": int(len(Xc_train)),
    }

    # ---------------------------------------------------------------- model 3
    cohort_model = Pipeline([
        ("prep", build_preprocessor()),
        ("km", KMeans(n_clusters=4, n_init=10, random_state=RANDOM_SEED)),
    ])
    cohort_model.fit(X)
    cohort_labels = cohort_model.predict(X)
    cohort_profiles = _describe_cohorts(frame, cohort_labels)

    # ---------------------------------------------------------------- model 4
    job_vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    job_matrix = job_vectorizer.fit_transform(
        [f"{j['role']} {' '.join(j['tags'])} {j['requirements']}" for j in JOB_CORPUS]
    )

    # --------------------------------------------------------- explainability
    importances = _permutation_importances(placement_clf, X_test, y_test)
    factor_weights = _factor_weights(importances)

    bundle = {
        "version": 1,
        "feature_order": FEATURE_ORDER,
        "placement_clf": placement_clf,
        "ctc_reg": ctc_reg,
        "cohort_model": cohort_model,
        "cohort_profiles": cohort_profiles,
        "job_vectorizer": job_vectorizer,
        "job_matrix": job_matrix,
        "job_ids": [j["id"] for j in JOB_CORPUS],
        "factor_weights": factor_weights,
        "feature_importances": importances,
    }
    joblib.dump(bundle, BUNDLE_PATH)

    report = {
        "dataset_rows": int(len(frame)),
        "placement_rate": round(float(frame["placed"].mean()), 4),
        "placement_classifier": classification_metrics,
        "ctc_regressor": regression_metrics,
        "factor_weights": factor_weights,
        "feature_importances": importances,
        "cohort_profiles": cohort_profiles,
        "jobs_indexed": len(JOB_CORPUS),
    }
    METRICS_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def _permutation_importances(model, X_test, y_test) -> Dict[str, float]:
    """Permutation importance on the held-out split, normalised to sum to 1."""
    result = permutation_importance(
        model, X_test, y_test,
        n_repeats=6,
        random_state=RANDOM_SEED,
        scoring="roc_auc",
    )
    raw = {
        feature: max(0.0, float(value))
        for feature, value in zip(FEATURE_ORDER, result.importances_mean)
    }
    total = sum(raw.values()) or 1.0
    return {feature: round(value / total, 5) for feature, value in raw.items()}


def _factor_weights(importances: Dict[str, float]) -> Dict[str, float]:
    """Roll per-feature importance up to the factors the dashboard shows."""
    grouped: Dict[str, float] = {}
    for feature, weight in importances.items():
        factor = FACTOR_OF_FEATURE.get(feature)
        if factor is None or factor == "Department Context":
            continue
        grouped[factor] = grouped.get(factor, 0.0) + weight
    total = sum(grouped.values()) or 1.0
    return {factor: round(weight / total, 4) for factor, weight in
            sorted(grouped.items(), key=lambda kv: kv[1], reverse=True)}


# Archetype ladder, strongest cohort first.  Ranking by placement rate keeps
# the four names distinct; a two-axis rule collides once clusters split on a
# third axis such as internship history.
COHORT_LADDER = [
    "Interview-Ready Allrounder",
    "Near-Ready, One Gap",
    "Developing Profile",
    "Foundation Builder",
]

# Weakest-axis diagnosis, so the roadmap addresses the cluster's real deficit.
AXIS_FOCUS = {
    "dsa_solved": "daily problem-solving volume on core DSA patterns",
    "cgpa": "clearing the CGPA and backlog cut-offs that gate eligibility",
    "aptitude_score": "timed aptitude and logical-reasoning practice",
    "projects_count": "shipping verifiable projects with a live deployment",
    "internships_months": "converting an internship or open-source stint into experience",
    "communication_score": "structured communication and HR interview practice",
}


def _describe_cohorts(frame, labels) -> Dict[str, Dict]:
    """Name each k-means cluster by rank, and diagnose its weakest axis."""
    axes = list(AXIS_FOCUS.keys())
    means = frame[axes].mean()
    stds = frame[axes].std(ddof=0).replace(0, 1.0)

    stats = []
    for cluster in sorted(set(int(v) for v in labels)):
        members = frame[labels == cluster]
        z = {axis: float((members[axis].mean() - means[axis]) / stds[axis]) for axis in axes}
        stats.append((cluster, members, z, float(members["placed"].mean())))

    # Rank by placement rate so the ladder names stay meaningful and unique.
    stats.sort(key=lambda item: item[3], reverse=True)

    profiles: Dict[str, Dict] = {}
    for rank, (cluster, members, z, placement_rate) in enumerate(stats):
        weakest_axis = min(z, key=z.get)
        profiles[str(cluster)] = {
            "name": COHORT_LADDER[min(rank, len(COHORT_LADDER) - 1)],
            "focus": AXIS_FOCUS[weakest_axis],
            "weakest_axis": weakest_axis,
            "size": int(len(members)),
            "avg_cgpa": round(float(members["cgpa"].mean()), 2),
            "avg_dsa_solved": round(float(members["dsa_solved"].mean()), 1),
            "avg_aptitude": round(float(members["aptitude_score"].mean()), 1),
            "placement_rate": round(placement_rate, 3),
        }
    return profiles


if __name__ == "__main__":
    summary = train()
    clf = summary["placement_classifier"]
    reg = summary["ctc_regressor"]
    print(f"Trained on {summary['dataset_rows']} rows "
          f"(placement rate {summary['placement_rate'] * 100:.1f}%)")
    print()
    print("Placement classifier (held-out 20%):")
    print(f"  accuracy   {clf['accuracy']:.4f}")
    print(f"  ROC-AUC    {clf['roc_auc']:.4f}")
    print(f"  Brier      {clf['brier_score']:.4f}  (lower is better)")
    print()
    print("CTC regressor (held-out 20% of placed students):")
    print(f"  MAE        Rs {reg['mae_lpa']:.2f} LPA")
    print(f"  RMSE       Rs {reg['rmse_lpa']:.2f} LPA")
    print(f"  R-squared  {reg['r2']:.4f}")
    print()
    print("Learned factor weights shown in the dashboard:")
    for factor, weight in summary["factor_weights"].items():
        print(f"  {factor:<28} {weight * 100:5.1f}%")
    print()
    print("Student cohorts discovered by k-means:")
    for cluster, profile in summary["cohort_profiles"].items():
        print(f"  [{cluster}] {profile['name']:<30} "
              f"n={profile['size']:<5} placement={profile['placement_rate'] * 100:.1f}%")
    print()
    print(f"Bundle written to {BUNDLE_PATH}")
    print(f"Report written to {METRICS_PATH}")
