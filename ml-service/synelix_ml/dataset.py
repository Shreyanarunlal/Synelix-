"""Synthetic campus-placement dataset generator.

There is no public dataset that carries every signal Synelix collects, so the
training corpus is simulated from an explicit statistical model instead of
being silently invented.  The generative process is:

1.  Each student draws a latent *aptitude* z ~ N(0, 1) per department, with
    department means offset to reproduce the placement spread a real T&P cell
    sees across branches.
2.  Observable features (CGPA, DSA count, aptitude score, ...) are drawn as
    noisy, non-linear functions of z, so they are correlated with each other
    the way they are in practice but none of them is a perfect proxy.
3.  Placement is a Bernoulli draw whose log-odds are a *different* weighted
    combination of the observables plus independent noise, so the models have
    a genuine signal to recover rather than an identity to memorise.
4.  CTC for placed students is drawn from a log-normal centred on that same
    readiness score, which is what the regressor learns.

Because step 3 uses weights the models never see, reported accuracy reflects
real generalisation over this process - but it is generalisation over a
simulation, and the README says so.  Swap in a real institutional export and
the same pipeline trains unchanged.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .config import DATASET_CSV, DATASET_SIZE, DEPARTMENTS, RANDOM_SEED, tier_for_ctc

# Department-level offsets on the latent aptitude scale and the relative size
# of each cohort, tuned to mirror a mid-size engineering college.
DEPARTMENT_PROFILE = {
    "Computer Science":            {"offset": 0.45, "share": 0.26, "ctc_mult": 1.15},
    "AI & Data Science":           {"offset": 0.40, "share": 0.14, "ctc_mult": 1.18},
    "Information Technology":      {"offset": 0.20, "share": 0.18, "ctc_mult": 1.02},
    "Electronics & Communication": {"offset": -0.05, "share": 0.18, "ctc_mult": 0.88},
    "Electrical Engineering":      {"offset": -0.20, "share": 0.12, "ctc_mult": 0.80},
    "Mechanical Engineering":      {"offset": -0.45, "share": 0.12, "ctc_mult": 0.72},
}

# Log-odds weights for the placement outcome.  These are the ground truth the
# classifier has to rediscover from the observables.
PLACEMENT_WEIGHTS = {
    "cgpa": 1.35,
    "dsa_solved": 1.70,
    "aptitude_score": 1.15,
    "projects_count": 0.85,
    "internships_months": 0.80,
    "certifications_count": 0.35,
    "hackathons_won": 0.30,
    "communication_score": 0.95,
    "backlogs": -1.40,
}

# The weighted feature sum is rescaled to unit variance before it enters the
# logit, so ``PLACEMENT_SLOPE`` sets how sharply readiness separates outcomes.
# Left unscaled the sigmoid saturates and placement becomes a step function,
# which would make the classification problem trivial and the predicted
# probabilities useless as a dashboard number.
PLACEMENT_SLOPE = 1.70
PLACEMENT_NOISE = 0.70
# Chosen so the simulated cohort lands near a 78% placement rate, which is
# what a mid-tier engineering college reports.
PLACEMENT_INTERCEPT = 1.55

# CTC is log-normal in the same latent talent score, calibrated so the median
# placed student lands around Rs 8 LPA with a long tail into Tier-1 offers.
CTC_LOG_INTERCEPT = 1.95
CTC_LOG_SLOPE = 0.45


def generate(n: int = DATASET_SIZE, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Generate ``n`` labelled student records."""
    rng = np.random.default_rng(seed)

    departments = rng.choice(
        DEPARTMENTS,
        size=n,
        p=_normalised_shares(),
    )
    offsets = np.array([DEPARTMENT_PROFILE[d]["offset"] for d in departments])
    ctc_mult = np.array([DEPARTMENT_PROFILE[d]["ctc_mult"] for d in departments])

    # Step 1: latent aptitude.
    z = rng.normal(0.0, 1.0, size=n) + offsets

    # Step 2: observables as noisy non-linear functions of z.
    cgpa = np.clip(7.1 + 0.85 * z + rng.normal(0, 0.55, n), 5.0, 10.0)

    dsa_mean = np.exp(4.55 + 0.62 * z)
    dsa_solved = np.clip(rng.normal(dsa_mean, dsa_mean * 0.28), 0, 900).astype(int)

    aptitude_score = np.clip(
        66 + 11.5 * z + rng.normal(0, 8.5, n), 25, 100
    ).astype(int)

    projects_count = np.clip(
        rng.poisson(np.clip(1.6 + 0.85 * z, 0.25, None)), 0, 12
    ).astype(int)

    # Internships are gated: weaker students often get none at all.
    internship_chance = _sigmoid(0.9 * z - 0.15)
    has_internship = rng.random(n) < internship_chance
    internships_months = np.where(
        has_internship,
        np.clip(rng.poisson(np.clip(2.0 + 0.9 * z, 0.5, None)), 1, 12),
        0,
    ).astype(int)

    certifications_count = np.clip(
        rng.poisson(np.clip(1.2 + 0.55 * z, 0.2, None)), 0, 10
    ).astype(int)

    hackathons_won = np.clip(
        rng.poisson(np.clip(0.35 + 0.35 * z, 0.05, None)), 0, 8
    ).astype(int)

    communication_score = np.clip(
        68 + 8.0 * z + rng.normal(0, 11.0, n), 25, 100
    ).astype(int)

    # Backlogs concentrate in the lower tail.
    backlog_rate = np.clip(0.75 - 0.55 * z, 0.02, 3.2)
    backlogs = np.clip(rng.poisson(backlog_rate), 0, 8).astype(int)

    frame = pd.DataFrame({
        "cgpa": np.round(cgpa, 2),
        "dsa_solved": dsa_solved,
        "aptitude_score": aptitude_score,
        "projects_count": projects_count,
        "internships_months": internships_months,
        "certifications_count": certifications_count,
        "hackathons_won": hackathons_won,
        "communication_score": communication_score,
        "backlogs": backlogs,
        "department": departments,
    })

    # Step 3: placement outcome from a standardised weighted combination.
    # ``talent`` is the market-value score; it drives both the hire decision
    # and, independently of the hiring noise, the offer size.
    standardised = _standardise(frame[list(PLACEMENT_WEIGHTS.keys())])
    talent = sum(
        PLACEMENT_WEIGHTS[col] * standardised[col] for col in PLACEMENT_WEIGHTS
    )
    talent_z = (talent - talent.mean()) / talent.std(ddof=0)

    logits = PLACEMENT_INTERCEPT + PLACEMENT_SLOPE * talent_z
    # Unobserved factors: interview nerves, referrals, plain luck.
    logits += rng.normal(0, PLACEMENT_NOISE, n)
    placed_prob = _sigmoid(logits)
    frame["placed"] = (rng.random(n) < placed_prob).astype(int)

    # Step 4: CTC for placed students, log-normal in the talent score.
    ctc = np.exp(CTC_LOG_INTERCEPT + CTC_LOG_SLOPE * talent_z)
    ctc = ctc * ctc_mult * np.exp(rng.normal(0, 0.18, n))
    ctc = np.clip(ctc, 3.2, 52.0)
    frame["ctc_lpa"] = np.where(frame["placed"] == 1, np.round(ctc, 2), 0.0)
    frame["tier"] = [
        tier_for_ctc(value) if placed else ""
        for value, placed in zip(frame["ctc_lpa"], frame["placed"])
    ]

    return frame


def _normalised_shares() -> np.ndarray:
    shares = np.array([DEPARTMENT_PROFILE[d]["share"] for d in DEPARTMENTS])
    return shares / shares.sum()


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))


def _standardise(frame: pd.DataFrame) -> pd.DataFrame:
    return (frame - frame.mean()) / frame.std(ddof=0)


def build_and_save(n: int = DATASET_SIZE, seed: int = RANDOM_SEED) -> pd.DataFrame:
    frame = generate(n, seed)
    frame.to_csv(DATASET_CSV, index=False)
    return frame


def load_or_build(n: int = DATASET_SIZE, seed: int = RANDOM_SEED) -> pd.DataFrame:
    """Reuse the CSV on disk if present, otherwise generate it."""
    if DATASET_CSV.exists():
        return pd.read_csv(DATASET_CSV)
    return build_and_save(n, seed)


if __name__ == "__main__":
    df = build_and_save()
    rate = df["placed"].mean() * 100
    placed = df[df["placed"] == 1]
    print(f"Wrote {len(df)} rows to {DATASET_CSV}")
    print(f"Overall placement rate: {rate:.1f}%")
    print(f"Median CTC of placed students: Rs {placed['ctc_lpa'].median():.2f} LPA")
    print("\nPlacement rate by department:")
    print((df.groupby("department")["placed"].mean() * 100).round(1).to_string())
