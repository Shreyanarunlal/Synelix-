"""Model bundle loading and the inference orchestration behind the API."""

from __future__ import annotations

import copy
import threading
from typing import Any, Dict, List

import joblib

from . import matching, resume as resume_module, roadmap as roadmap_module, skillgap
from .config import BUNDLE_PATH, METRICS_PATH, TIERS, tier_for_ctc, tier_meta
from .features import coerce_profile, signal_scores
from .train import FACTOR_SIGNAL

_lock = threading.Lock()
_bundle: Dict[str, Any] | None = None

# Counterfactuals the predictor evaluates to tell a student which single
# change moves their probability most.  Each is (label, field, delta).
WHAT_IF_LEVERS = [
    ("Solve 50 more DSA problems", "dsa_solved", 50),
    ("Raise aptitude score by 10 points", "aptitude_score", 10),
    ("Ship one more verified project", "projects_count", 1),
    ("Add 3 months of internship experience", "internships_months", 3),
    ("Raise CGPA by 0.3", "cgpa", 0.3),
    ("Complete one more certification", "certifications_count", 1),
]


class ModelsUnavailable(RuntimeError):
    """Raised when the bundle has not been trained yet."""


def load_bundle(force: bool = False) -> Dict[str, Any]:
    global _bundle
    with _lock:
        if _bundle is None or force:
            if not BUNDLE_PATH.exists():
                raise ModelsUnavailable(
                    f"No trained model bundle at {BUNDLE_PATH}. "
                    "Run: python -m synelix_ml.train"
                )
            _bundle = joblib.load(BUNDLE_PATH)
        return _bundle


def is_ready() -> bool:
    try:
        load_bundle()
        return True
    except ModelsUnavailable:
        return False


def model_info() -> Dict[str, Any]:
    bundle = load_bundle()
    info = {
        "bundleVersion": bundle.get("version"),
        "features": bundle.get("feature_order"),
        "factorWeights": bundle.get("factor_weights"),
        "featureImportances": bundle.get("feature_importances"),
        "cohorts": bundle.get("cohort_profiles"),
        "jobsIndexed": len(bundle.get("job_ids", [])),
    }
    if METRICS_PATH.exists():
        import json
        report = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
        info["metrics"] = {
            "datasetRows": report.get("dataset_rows"),
            "placementClassifier": {
                k: v for k, v in report.get("placement_classifier", {}).items()
                if k != "report"
            },
            "ctcRegressor": report.get("ctc_regressor"),
        }
    return info


# --------------------------------------------------------------------------
# Placement prediction
# --------------------------------------------------------------------------

def predict(profile: Dict[str, Any]) -> Dict[str, Any]:
    bundle = load_bundle()
    clean = coerce_profile(profile)

    probability_raw = _probability(bundle, clean)
    probability = int(round(probability_raw * 100))

    expected_ctc = float(bundle["ctc_reg"].predict(_frame(clean))[0])
    expected_ctc = max(3.0, min(52.0, expected_ctc))

    tier_label = tier_for_ctc(expected_ctc)
    meta = tier_meta(tier_label)

    cohort_id = int(bundle["cohort_model"].predict(_frame(clean))[0])
    cohort = bundle["cohort_profiles"].get(str(cohort_id), {})

    return {
        "probability": probability,
        "confidence": round(probability_raw, 4),
        "tier": meta["tier"],
        "tierLevel": meta["level"],
        "minCtc": meta["min_ctc"],
        "maxCtc": meta["max_ctc"],
        "expectedCtc": round(expected_ctc, 2),
        "badgeColor": meta["badge"],
        "factorInsights": _factor_insights(bundle, clean),
        "whatIf": _what_if(bundle, clean, probability_raw),
        "cohort": cohort,
        "recommendations": _headline_recommendation(bundle, clean, probability),
        "modelSource": "synelix-ml",
    }


def _frame(clean: Dict[str, Any]):
    from .features import to_frame
    return to_frame([clean])


def _probability(bundle: Dict[str, Any], clean: Dict[str, Any]) -> float:
    return float(bundle["placement_clf"].predict_proba(_frame(clean))[0, 1])


def _factor_insights(bundle: Dict[str, Any], clean: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Per-factor score and the model's learned weight for that factor."""
    signals = signal_scores(clean)
    weights: Dict[str, float] = bundle.get("factor_weights", {})

    insights: List[Dict[str, Any]] = []
    for factor, weight in weights.items():
        signal_key = FACTOR_SIGNAL.get(factor)
        if signal_key is None:
            continue
        score = signals.get(signal_key, 0.0)
        insights.append({
            "factor": factor,
            "weight": f"{round(weight * 100)}%",
            "weightValue": round(weight, 4),
            "score": int(round(score)),
            "status": _factor_status(factor, score, clean),
        })
    return insights


def _factor_status(factor: str, score: float, clean: Dict[str, Any]) -> str:
    if factor == "Internship Experience":
        months = clean["internships_months"]
        if months <= 0:
            return "No formal internship yet"
        return f"{months} month{'s' if months != 1 else ''} verified"
    if factor == "Academic CGPA":
        if clean["backlogs"] > 0:
            return f"{clean['backlogs']} backlog(s) blocking eligibility"
        return "Eligible for most cut-offs" if score >= 80 else "Standard cut-off met"
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Good"
    if score >= 55:
        return "Average"
    return "Needs focus"


def _what_if(bundle: Dict[str, Any], clean: Dict[str, Any],
             baseline: float) -> List[Dict[str, Any]]:
    """Re-score the model under each single improvement, ranked by impact.

    This is the honest version of "how do I improve my chances": every number
    is the trained model's own response to that one change, not a guess.
    """
    results: List[Dict[str, Any]] = []
    for label, field, delta in WHAT_IF_LEVERS:
        candidate = copy.deepcopy(clean)
        candidate[field] = candidate.get(field, 0) + delta
        candidate = coerce_profile(candidate)

        # Skip a lever that the clipping bounds make a no-op (already maxed).
        if candidate[field] == clean[field]:
            continue

        new_probability = _probability(bundle, candidate)
        gain = (new_probability - baseline) * 100
        results.append({
            "action": label,
            "field": field,
            "delta": delta,
            "newProbability": int(round(new_probability * 100)),
            "gain": round(gain, 1),
        })

    results.sort(key=lambda item: item["gain"], reverse=True)
    return results


def _headline_recommendation(bundle: Dict[str, Any], clean: Dict[str, Any],
                             probability: int) -> str:
    levers = _what_if(bundle, clean, probability / 100.0)
    if levers and levers[0]["gain"] >= 0.5:
        best = levers[0]
        return (f"{best['action']} - the model puts your placement probability at "
                f"{best['newProbability']}% afterwards, a gain of {best['gain']:.1f} "
                f"percentage points. That is the single highest-leverage change "
                f"available on your profile right now.")
    if probability >= 90:
        return ("Your profile already clears Tier-1 thresholds. Shift your time to "
                "system design depth and mock interviews - the remaining variance "
                "is in interview conversion, not profile strength.")
    return ("No single change moves the needle much on its own. Work several "
            "factors in parallel and re-run the prediction as each one lands.")


# --------------------------------------------------------------------------
# Skill gap, matching, roadmap, resume
# --------------------------------------------------------------------------

def skill_gap(profile: Dict[str, Any], target_role: str | None = None) -> Dict[str, Any]:
    return skillgap.analyse(profile, target_role)


def match_jobs(profile: Dict[str, Any], limit: int = 8) -> List[Dict[str, Any]]:
    bundle = load_bundle()
    clean = coerce_profile(profile)
    predicted_ctc = float(bundle["ctc_reg"].predict(_frame(clean))[0])
    return matching.match(
        profile,
        bundle["job_vectorizer"],
        bundle["job_matrix"],
        bundle["job_ids"],
        predicted_ctc,
        limit=limit,
    )


def build_roadmap(profile: Dict[str, Any], target_role: str | None = None,
                  completed: Dict[str, bool] | None = None) -> Dict[str, Any]:
    bundle = load_bundle()
    clean = coerce_profile(profile)
    gaps = skillgap.analyse(profile, target_role)

    cohort_id = int(bundle["cohort_model"].predict(_frame(clean))[0])
    cohort = bundle["cohort_profiles"].get(str(cohort_id), {})

    phases = roadmap_module.generate(gaps, cohort, completed)
    total = sum(len(phase["tasks"]) for phase in phases)
    done = sum(1 for phase in phases for task in phase["tasks"] if task["done"])

    return {
        "targetRole": gaps["targetRole"],
        "cohort": cohort,
        "phases": phases,
        "totalTasks": total,
        "completedTasks": done,
        "progressPercent": int(round(100 * done / total)) if total else 0,
    }


def analyse_resume(resume_text: str | None, target_role: str | None = None,
                   file_name: str | None = None) -> Dict[str, Any]:
    return resume_module.analyse(resume_text, target_role, file_name)


def tiers() -> List[Dict[str, Any]]:
    return TIERS
