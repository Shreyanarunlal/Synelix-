"""Company and job matching.

The match score blends three independent views of fit:

* **Requirement coverage** - the share of the job's requirement vocabulary,
  IDF-weighted so rare and specific terms count for more, that the student's
  skills, projects and certifications actually evidence.  Plain cosine
  similarity was tried first and rejected: a student profile is a short
  document, so its cosine against every job is close to zero except where a
  rare term happens to collide, which ranked a Tier-1 employer below an IT
  services role for a candidate who cleared every Tier-1 cut-off.  Coverage
  answers the question a recruiter actually asks - how much of what this role
  needs can this student show? - and is bounded in [0, 1] by construction.
* **Eligibility** - how far the student clears (or misses) the published CGPA,
  DSA and aptitude cut-offs.  Missing a hard cut-off is penalised sharply,
  because no amount of skill overlap gets a resume past a filter.
* **Band fit** - how close the student's ML-predicted CTC is to the job's
  offer, so a strong candidate is not shown only entry-level roles and a
  developing candidate is not shown only unreachable ones.
"""

from __future__ import annotations

from typing import Any, Dict, List

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from .features import coerce_profile, profile_text
from .roles import JOB_CORPUS

COVERAGE_WEIGHT = 0.35
ELIGIBILITY_WEIGHT = 0.45
BAND_WEIGHT = 0.20

# No campus candidate evidences a whole job description, so raw coverage tops
# out well below 1.  Covering 35% of a role's IDF-weighted requirement
# vocabulary is treated as full marks; above that the term saturates.
COVERAGE_CEILING = 0.35

# A student is treated as over-qualified once the model expects an offer this
# many times the job's own band.
OVERQUALIFIED_RATIO = 1.6


def match(profile: Dict[str, Any], vectorizer, job_matrix, job_ids: List[str],
          predicted_ctc: float, limit: int = 8) -> List[Dict[str, Any]]:
    clean = coerce_profile(profile)
    text = profile_text(profile)

    has_content = bool(text.strip())
    if has_content:
        # Binary presence over the same vocabulary the jobs were fitted on, so
        # coverage is measured with identical tokenisation and n-grams.
        presence = (vectorizer.transform([text]) > 0).astype(float).toarray()[0]
        similarities = cosine_similarity(vectorizer.transform([text]), job_matrix)[0]
    else:
        presence = np.zeros(job_matrix.shape[1])
        similarities = np.zeros(len(job_ids))

    results: List[Dict[str, Any]] = []
    for index, job_id in enumerate(job_ids):
        job = _job(job_id)
        if job is None:
            continue

        job_weights = np.asarray(job_matrix[index].todense()).ravel()
        coverage = _coverage(job_weights, presence) if has_content else 0.0

        eligibility, unmet = _eligibility(clean, job)
        band = _band_fit(predicted_ctc, job["ctc_value"])

        coverage_scaled = min(1.0, coverage / COVERAGE_CEILING)
        score = (COVERAGE_WEIGHT * coverage_scaled
                 + ELIGIBILITY_WEIGHT * eligibility
                 + BAND_WEIGHT * band)
        match_score = int(round(max(5.0, min(99.0, score * 100))))

        overqualified = (
            not unmet and job["ctc_value"] > 0
            and predicted_ctc / job["ctc_value"] >= OVERQUALIFIED_RATIO
        )

        results.append({
            "id": job["id"],
            "name": job["name"],
            "role": job["role"],
            "tier": job["tier"],
            "matchScore": match_score,
            "ctc": job["ctc"],
            "ctcValue": job["ctc_value"],
            "location": job["location"],
            "logoText": job["logo_text"],
            "logoBg": job["logo_bg"],
            "hiringSeason": job["hiring_season"],
            "tags": job["tags"],
            "requirements": _requirement_line(job),
            "status": _status(match_score, unmet, overqualified),
            "unmetCriteria": unmet,
            "coverage": round(coverage, 4),
            "contentSimilarity": round(float(similarities[index]), 4),
            "eligibilityScore": round(eligibility, 3),
            "bandFit": round(band, 3),
        })

    results.sort(key=lambda item: item["matchScore"], reverse=True)
    return results[:limit]


def _coverage(job_weights: np.ndarray, presence: np.ndarray) -> float:
    """IDF-weighted share of a job's requirement terms the profile evidences."""
    total = float(job_weights.sum())
    if total <= 0:
        return 0.0
    return float(np.dot(job_weights, presence) / total)


def _job(job_id: str) -> Dict[str, Any] | None:
    for job in JOB_CORPUS:
        if job["id"] == job_id:
            return job
    return None


def _eligibility(profile: Dict[str, Any], job: Dict[str, Any]) -> tuple:
    """Score the published cut-offs, and name the ones the student misses."""
    checks = [
        ("CGPA", profile["cgpa"], job["min_cgpa"], 2.0),
        ("DSA problems", profile["dsa_solved"], job["min_dsa"], 150.0),
        ("Aptitude", profile["aptitude_score"], job["min_aptitude"], 25.0),
    ]

    scores: List[float] = []
    unmet: List[str] = []
    for label, actual, required, span in checks:
        headroom = (actual - required) / span
        if headroom >= 0:
            # Clearing a bar comfortably helps, but with diminishing returns.
            scores.append(min(1.0, 0.75 + 0.25 * min(1.0, headroom)))
        else:
            # Missing a hard filter costs sharply.
            scores.append(max(0.0, 0.75 * (1 + headroom * 1.6)))
            unmet.append(f"{label}: {_fmt(actual)} vs {_fmt(required)} required")

    return float(np.mean(scores)), unmet


def _band_fit(predicted_ctc: float, job_ctc: float) -> float:
    """1.0 when the predicted offer matches the job's band, decaying either way."""
    if job_ctc <= 0:
        return 0.5
    ratio = predicted_ctc / job_ctc
    # A student predicted well above the band still fits (they would simply be
    # over-qualified), so overshoot is penalised much less than undershoot.
    if ratio >= 1.0:
        return float(max(0.55, 1.0 - 0.12 * (ratio - 1.0)))
    return float(max(0.0, ratio ** 1.5))


def _status(match_score: int, unmet: List[str], overqualified: bool) -> str:
    # Status describes *why* a job sits where it does, so a missed cut-off and
    # a low skill overlap never read the same. A candidate who clears every
    # bar is never called a stretch - at worst the role is below their band.
    if unmet:
        return "Eligibility Gap" if len(unmet) > 1 else "Borderline - One Cut-off Missed"
    if overqualified:
        return "Safe Backup - Below Your Band"
    if match_score >= 88:
        return "Direct Shortlist Ready"
    if match_score >= 78:
        return "High Probability Match"
    if match_score >= 65:
        return "Eligible & Recommended"
    return "Eligible - Build Skill Overlap"


def _requirement_line(job: Dict[str, Any]) -> str:
    return (f"CGPA {job['min_cgpa']}+, {job['min_dsa']}+ DSA problems, "
            f"aptitude {job['min_aptitude']}+")


def _fmt(value: float) -> str:
    return f"{value:.1f}" if isinstance(value, float) and value % 1 else str(int(value))
