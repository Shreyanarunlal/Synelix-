"""Skill-gap detection.

A student's level in each benchmark skill is *estimated from evidence* rather
than asked for directly: the weighted profile signals behind that skill
(``sources`` in roles.py) set a baseline, and any self-reported skill that the
benchmark recognises pulls the estimate toward the declared level.  Declared
skills are damped, not trusted outright, so a student cannot lift a gap to
zero just by claiming a skill they have no project or certification for.
"""

from __future__ import annotations

from typing import Any, Dict, List

from .features import declared_skill_levels, signal_scores
from .roles import DEFAULT_ROLE, REMEDIATION, ROLE_BENCHMARKS

# How much weight a self-reported level carries against evidence-derived score.
DECLARED_WEIGHT = 0.45

PRIORITY_BANDS = [
    (15, "High Priority"),
    (7, "Medium Priority"),
    (0, "Low Priority"),
]


def resolve_role(target_role: str | None) -> str:
    if not target_role:
        return DEFAULT_ROLE
    for role in ROLE_BENCHMARKS:
        if role.lower() == target_role.strip().lower():
            return role
    # Fall back on a loose contains match before defaulting.
    lowered = target_role.lower()
    for role in ROLE_BENCHMARKS:
        if role.lower() in lowered or lowered in role.lower():
            return role
    return DEFAULT_ROLE


def analyse(profile: Dict[str, Any], target_role: str | None = None) -> Dict[str, Any]:
    role = resolve_role(target_role or profile.get("targetRole") or profile.get("target_role"))
    signals = signal_scores(profile)
    declared = declared_skill_levels(profile)

    benchmarks: List[Dict[str, Any]] = []
    deficits: List[Dict[str, Any]] = []

    for entry in ROLE_BENCHMARKS[role]:
        evidence = _evidence_score(entry["sources"], signals)
        declared_level = _declared_level(entry.get("declared", []), declared)

        if declared_level is None:
            current = evidence
        else:
            current = (1 - DECLARED_WEIGHT) * evidence + DECLARED_WEIGHT * declared_level

        current = int(round(max(0.0, min(100.0, current))))
        required = int(entry["required"])
        benchmarks.append({
            "skill": entry["skill"],
            "required": required,
            "studentCurrent": current,
        })

        gap = current - required
        if gap < 0:
            deficits.append({
                "skill": entry["skill"],
                "gap": gap,
                "priority": _priority(abs(gap)),
                "recommendation": REMEDIATION.get(
                    entry["skill"],
                    f"Close the {abs(gap)} point gap in {entry['skill']} before applying.",
                ),
            })

    deficits.sort(key=lambda item: item["gap"])

    strengths = [b for b in benchmarks if b["studentCurrent"] >= b["required"]]
    readiness = _readiness(benchmarks)

    return {
        "targetRole": role,
        "benchmarks": benchmarks,
        "deficits": deficits,
        "strengths": [s["skill"] for s in strengths],
        "roleReadiness": readiness,
        "summary": _summary(role, readiness, deficits),
    }


def _evidence_score(sources: Dict[str, float], signals: Dict[str, float]) -> float:
    """Weighted blend of the profile signals that back a benchmark skill."""
    total_weight = sum(sources.values()) or 1.0
    score = sum(signals.get(name, 0.0) * weight for name, weight in sources.items())
    return score / total_weight


def _declared_level(declared_names: List[str], declared: Dict[str, float]) -> float | None:
    """Best self-reported level among the skills that map to this benchmark."""
    levels = [declared[name.lower()] for name in declared_names if name.lower() in declared]
    return max(levels) if levels else None


def _priority(gap_size: float) -> str:
    for threshold, label in PRIORITY_BANDS:
        if gap_size >= threshold:
            return label
    return "Low Priority"


def _readiness(benchmarks: List[Dict[str, Any]]) -> int:
    """Share of the role bar the student currently clears, capped per skill.

    Capping each ratio at 1.0 stops a single over-performing skill from
    masking a serious gap elsewhere.
    """
    if not benchmarks:
        return 0
    ratios = [
        min(1.0, b["studentCurrent"] / b["required"]) if b["required"] else 1.0
        for b in benchmarks
    ]
    return int(round(100 * sum(ratios) / len(ratios)))


def _summary(role: str, readiness: int, deficits: List[Dict[str, Any]]) -> str:
    if not deficits:
        return (f"You clear every benchmark for {role}. Hold this level and shift "
                f"your time to mock interviews and company-specific preparation.")
    top = deficits[0]
    count = len(deficits)
    plural = "gap" if count == 1 else "gaps"
    return (f"You meet {readiness}% of the {role} benchmark across all skills, with "
            f"{count} {plural} remaining. The largest is {top['skill']} at "
            f"{abs(top['gap'])} points below the bar.")
