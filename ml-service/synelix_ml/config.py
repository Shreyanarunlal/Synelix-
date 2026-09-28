"""Paths, constants and tunables shared by training and serving."""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATASET_CSV = DATA_DIR / "placement_dataset.csv"
BUNDLE_PATH = MODEL_DIR / "synelix_models.joblib"
METRICS_PATH = MODEL_DIR / "training_report.json"

RANDOM_SEED = 42
DATASET_SIZE = 9000

# Numeric features fed to every model, with the ceiling used to normalise
# each one onto a 0-100 readiness scale.
NUMERIC_FEATURES = {
    "cgpa": 10.0,
    "dsa_solved": 450.0,
    "aptitude_score": 100.0,
    "projects_count": 5.0,
    "internships_months": 6.0,
    "certifications_count": 4.0,
    "hackathons_won": 3.0,
    "communication_score": 100.0,
    "backlogs": 6.0,
}

CATEGORICAL_FEATURES = ["department"]

FEATURE_ORDER = list(NUMERIC_FEATURES.keys()) + CATEGORICAL_FEATURES

DEPARTMENTS = [
    "Computer Science",
    "AI & Data Science",
    "Information Technology",
    "Electronics & Communication",
    "Electrical Engineering",
    "Mechanical Engineering",
]

# Placement tiers, ordered from strongest to weakest, with the CTC band
# (in lakhs per annum) each one represents.
TIERS = [
    {
        "tier": "Tier-1 Global Tech (Rs 22 - 44 LPA)",
        "level": "Dream Tier-1",
        "min_ctc": 22.0,
        "max_ctc": 44.0,
        "badge": "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    {
        "tier": "Product & High-Growth Unicorns (Rs 12 - 22 LPA)",
        "level": "Product Tier-2",
        "min_ctc": 12.0,
        "max_ctc": 22.0,
        "badge": "bg-purple-100 text-purple-800 border-purple-200",
    },
    {
        "tier": "IT Product & Fintech (Rs 7.5 - 12 LPA)",
        "level": "Core Product",
        "min_ctc": 7.5,
        "max_ctc": 12.0,
        "badge": "bg-amber-100 text-amber-800 border-amber-200",
    },
    {
        "tier": "Service & Core (Rs 4.5 - 7.5 LPA)",
        "level": "Tier 3 / Mid-tier",
        "min_ctc": 4.5,
        "max_ctc": 7.5,
        "badge": "bg-blue-100 text-blue-800 border-blue-200",
    },
]

TIER_LABELS = [t["tier"] for t in TIERS]


def tier_for_ctc(ctc: float) -> str:
    """Map a predicted CTC onto the tier band that contains it."""
    for tier in TIERS:
        if ctc >= tier["min_ctc"]:
            return tier["tier"]
    return TIERS[-1]["tier"]


def tier_meta(tier_label: str) -> dict:
    for tier in TIERS:
        if tier["tier"] == tier_label:
            return tier
    return TIERS[-1]
