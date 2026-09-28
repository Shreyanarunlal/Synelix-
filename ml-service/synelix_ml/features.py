"""Feature engineering shared by training and serving.

Keeping this in one module is what guarantees the vector a model sees at
request time is built exactly the way it was built during training.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, List

import pandas as pd

from .config import CATEGORICAL_FEATURES, DEPARTMENTS, FEATURE_ORDER, NUMERIC_FEATURES

# Defaults stand in for fields a partially completed profile has not filled in
# yet, so the predictor degrades gracefully instead of failing.
PROFILE_DEFAULTS: Dict[str, Any] = {
    "cgpa": 7.5,
    "dsa_solved": 150,
    "aptitude_score": 70,
    "projects_count": 2,
    "internships_months": 0,
    "certifications_count": 1,
    "hackathons_won": 0,
    "communication_score": 70,
    "backlogs": 0,
    "department": "Computer Science",
}

# Sensible bounds; anything outside is clipped rather than rejected so a typo
# in one field cannot produce a nonsensical prediction.
BOUNDS: Dict[str, tuple] = {
    "cgpa": (0.0, 10.0),
    "dsa_solved": (0, 1200),
    "aptitude_score": (0, 100),
    "projects_count": (0, 20),
    "internships_months": (0, 36),
    "certifications_count": (0, 20),
    "hackathons_won": (0, 15),
    "communication_score": (0, 100),
    "backlogs": (0, 20),
}


def coerce_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Fill in missing fields, clip out-of-range values, normalise department."""
    clean: Dict[str, Any] = {}
    for key, default in PROFILE_DEFAULTS.items():
        value = profile.get(key)
        if value is None:
            value = default
        if key in BOUNDS:
            low, high = BOUNDS[key]
            try:
                value = float(value)
            except (TypeError, ValueError):
                value = float(default)
            value = max(low, min(high, value))
            if key != "cgpa":
                value = int(round(value))
        clean[key] = value

    department = str(clean.get("department") or "").strip()
    clean["department"] = _closest_department(department)
    return clean


def _closest_department(name: str) -> str:
    """Map a free-text department onto one of the known training categories."""
    if not name:
        return "Computer Science"
    lowered = name.lower()
    for dept in DEPARTMENTS:
        if dept.lower() == lowered:
            return dept
    aliases = {
        "Computer Science": ["computer", "cse", "cs&e", "software"],
        "AI & Data Science": ["ai", "artificial", "data science", "machine learning", "ml"],
        "Information Technology": ["information", "it"],
        "Electronics & Communication": ["electronics", "ece", "communication"],
        "Electrical Engineering": ["electrical", "eee"],
        "Mechanical Engineering": ["mechanical", "mech", "production"],
    }
    for dept, keys in aliases.items():
        if any(key in lowered for key in keys):
            return dept
    return "Computer Science"


def to_frame(profiles: Iterable[Dict[str, Any]]) -> pd.DataFrame:
    """Build the model input matrix, with columns in the trained order."""
    rows = [coerce_profile(p) for p in profiles]
    frame = pd.DataFrame(rows)
    for column in FEATURE_ORDER:
        if column not in frame.columns:
            frame[column] = PROFILE_DEFAULTS[column]
    return frame[FEATURE_ORDER]


def signal_scores(profile: Dict[str, Any]) -> Dict[str, float]:
    """Normalise each numeric signal onto a 0-100 readiness scale.

    These are the per-factor scores shown in the dashboard's factor breakdown
    and the inputs the skill-gap estimator reads.
    """
    clean = coerce_profile(profile)
    scores = {
        "cgpa": _pct(clean["cgpa"], NUMERIC_FEATURES["cgpa"]),
        "dsa": _pct(clean["dsa_solved"], NUMERIC_FEATURES["dsa_solved"]),
        "aptitude": _pct(clean["aptitude_score"], NUMERIC_FEATURES["aptitude_score"]),
        "projects": _pct(clean["projects_count"], NUMERIC_FEATURES["projects_count"]),
        "internships": _pct(clean["internships_months"], NUMERIC_FEATURES["internships_months"]),
        "certifications": _pct(clean["certifications_count"], NUMERIC_FEATURES["certifications_count"]),
        "hackathons": _pct(clean["hackathons_won"], NUMERIC_FEATURES["hackathons_won"]),
        "communication": _pct(clean["communication_score"], NUMERIC_FEATURES["communication_score"]),
    }
    # Backlogs are the only signal where more is worse.
    scores["academic_standing"] = max(0.0, 100.0 - (clean["backlogs"] * 20.0))
    return scores


def _pct(value: float, ceiling: float) -> float:
    if ceiling <= 0:
        return 0.0
    return max(0.0, min(100.0, (float(value) / ceiling) * 100.0))


def declared_skill_levels(profile: Dict[str, Any]) -> Dict[str, float]:
    """Index the student's self-reported skills by lowercase name."""
    levels: Dict[str, float] = {}
    for entry in profile.get("skills") or []:
        if isinstance(entry, dict):
            name = str(entry.get("name") or "").strip().lower()
            level = entry.get("level")
        else:
            name, level = str(entry).strip().lower(), None
        if not name:
            continue
        try:
            levels[name] = float(level) if level is not None else 70.0
        except (TypeError, ValueError):
            levels[name] = 70.0
    return levels


def profile_text(profile: Dict[str, Any]) -> str:
    """Flatten a profile into the bag of words the job matcher vectorises."""
    parts: List[str] = []
    for entry in profile.get("skills") or []:
        if isinstance(entry, dict):
            parts.append(str(entry.get("name") or ""))
        else:
            parts.append(str(entry))
    for project in profile.get("projects") or []:
        if isinstance(project, dict):
            parts.append(str(project.get("title") or ""))
            parts.append(str(project.get("tech") or ""))
            parts.append(str(project.get("description") or ""))
        else:
            parts.append(str(project))
    for cert in profile.get("certifications") or []:
        if isinstance(cert, dict):
            parts.append(str(cert.get("name") or ""))
        else:
            parts.append(str(cert))
    parts.append(str(profile.get("targetRole") or profile.get("target_role") or ""))
    parts.append(str(profile.get("department") or ""))
    return " ".join(p for p in parts if p).lower()
