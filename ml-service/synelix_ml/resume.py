"""ATS resume analysis.

Scores a resume the way an applicant tracking system roughly does: keyword
coverage against the target role's vocabulary, structural completeness
(expected sections present), and impact (quantified achievements and strong
action verbs).  When no resume text is supplied the analyser says so instead
of inventing a score.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List

from .roles import DEFAULT_ROLE, ROLE_BENCHMARKS

# Role vocabularies the keyword score is measured against.
ROLE_KEYWORDS: Dict[str, List[str]] = {
    "Full Stack Developer": [
        "java", "python", "javascript", "typescript", "react", "node", "spring boot",
        "rest api", "sql", "postgresql", "mongodb", "docker", "git", "microservices",
        "ci/cd", "unit testing", "agile", "html", "css", "redis",
    ],
    "SDE-1 (Product Tier 1)": [
        "java", "c++", "python", "data structures", "algorithms", "dynamic programming",
        "system design", "low level design", "object oriented", "multithreading",
        "concurrency", "sql", "distributed systems", "scalability", "git", "unit testing",
    ],
    "Data Scientist & AI Engineer": [
        "python", "pandas", "numpy", "scikit-learn", "machine learning", "deep learning",
        "pytorch", "tensorflow", "nlp", "statistics", "hypothesis testing", "sql",
        "data visualization", "feature engineering", "model deployment", "fastapi",
    ],
    "Cloud & DevOps Engineer": [
        "linux", "bash", "docker", "kubernetes", "terraform", "ansible", "aws", "gcp",
        "azure", "ci/cd", "jenkins", "github actions", "monitoring", "prometheus",
        "networking", "iam", "infrastructure as code",
    ],
}

EXPECTED_SECTIONS = [
    ("contact", ["email", "@", "phone", "linkedin", "github"]),
    ("education", ["education", "b.tech", "b.e", "bachelor", "cgpa", "university", "college"]),
    ("skills", ["skills", "technical skills", "technologies"]),
    ("experience", ["experience", "internship", "intern", "worked"]),
    ("projects", ["projects", "project"]),
]

ACTION_VERBS = [
    "architected", "built", "designed", "developed", "implemented", "optimised",
    "optimized", "reduced", "improved", "led", "automated", "migrated", "scaled",
    "delivered", "launched", "engineered", "integrated", "refactored",
]

# Matches quantified impact: percentages, multipliers, latency and volume figures.
METRIC_PATTERN = re.compile(
    r"(\d+(?:\.\d+)?\s*%|\d+(?:\.\d+)?\s*x\b|\b\d{3,}\+?\b|\d+(?:\.\d+)?\s*(?:ms|s|k|m|gb|mb|rps|qps|lpa))",
    re.IGNORECASE,
)

WEAK_PHRASES = [
    "responsible for", "worked on", "helped with", "involved in",
    "familiar with", "basic knowledge", "team player", "hard working",
]


def analyse(resume_text: str | None, target_role: str | None = None,
            file_name: str | None = None) -> Dict[str, Any]:
    role = _resolve_role(target_role)
    keywords = ROLE_KEYWORDS.get(role, ROLE_KEYWORDS[DEFAULT_ROLE])
    text = (resume_text or "").strip()

    if not text:
        return {
            "analysed": False,
            "targetRole": role,
            "fileName": file_name,
            "message": ("No resume text was supplied, so no score was produced. "
                        "Upload or paste the resume content to run the ATS analysis."),
            "overallScore": None,
            "formatScore": None,
            "keywordScore": None,
            "impactScore": None,
            "skillsFound": [],
            "missingKeywords": keywords[:8],
            "recommendations": [
                "Paste the resume text or upload the file to run a real ATS scan.",
            ],
        }

    lowered = text.lower()

    found = [kw for kw in keywords if kw in lowered]
    missing = [kw for kw in keywords if kw not in lowered]
    keyword_score = int(round(100 * len(found) / len(keywords))) if keywords else 0

    format_score, format_notes = _format_score(lowered, text)
    impact_score, impact_notes = _impact_score(lowered)

    # Keyword coverage is what an ATS filters on, so it carries the most weight.
    overall = int(round(0.45 * keyword_score + 0.25 * format_score + 0.30 * impact_score))

    recommendations = _recommendations(missing, format_notes, impact_notes, keyword_score)

    return {
        "analysed": True,
        "targetRole": role,
        "fileName": file_name,
        "overallScore": overall,
        "formatScore": format_score,
        "keywordScore": keyword_score,
        "impactScore": impact_score,
        "skillsFound": [_title(k) for k in found],
        "missingKeywords": [_title(k) for k in missing[:10]],
        "recommendations": recommendations,
        "wordCount": len(text.split()),
    }


def _resolve_role(target_role: str | None) -> str:
    if not target_role:
        return DEFAULT_ROLE
    for role in ROLE_BENCHMARKS:
        if role.lower() == target_role.strip().lower():
            return role
    return DEFAULT_ROLE


def _format_score(lowered: str, original: str) -> tuple:
    """Structural completeness: expected sections and a sane length."""
    present = 0
    missing_sections: List[str] = []
    for name, markers in EXPECTED_SECTIONS:
        if any(marker in lowered for marker in markers):
            present += 1
        else:
            missing_sections.append(name)

    section_score = 100 * present / len(EXPECTED_SECTIONS)

    words = len(original.split())
    if 250 <= words <= 900:
        length_score = 100.0
    elif words < 250:
        length_score = max(30.0, 100.0 * words / 250)
    else:
        length_score = max(50.0, 100.0 - (words - 900) / 20)

    score = int(round(0.7 * section_score + 0.3 * length_score))
    return score, missing_sections


def _impact_score(lowered: str) -> tuple:
    """Quantified achievements and strong verbs, minus filler phrasing."""
    metrics = len(METRIC_PATTERN.findall(lowered))
    verbs = sum(1 for verb in ACTION_VERBS if verb in lowered)
    weak = [phrase for phrase in WEAK_PHRASES if phrase in lowered]

    metric_score = min(100.0, metrics * 14.0)
    verb_score = min(100.0, verbs * 12.0)
    penalty = min(25.0, len(weak) * 8.0)

    score = int(round(max(0.0, 0.55 * metric_score + 0.45 * verb_score - penalty)))
    return score, {"metrics": metrics, "verbs": verbs, "weak_phrases": weak}


def _recommendations(missing: List[str], missing_sections: List[str],
                     impact_notes: Dict[str, Any], keyword_score: int) -> List[str]:
    tips: List[str] = []

    if missing:
        tips.append("Add the missing role keywords an ATS filters on: "
                    + ", ".join(_title(k) for k in missing[:5]) + ".")
    if missing_sections:
        tips.append("Add the missing sections: " + ", ".join(missing_sections) + ".")
    if impact_notes["metrics"] < 4:
        tips.append("Quantify more achievements - name the number "
                    "(for example, reduced API latency by 35%).")
    if impact_notes["verbs"] < 5:
        tips.append("Open each bullet with a strong action verb such as "
                    "architected, automated or reduced.")
    if impact_notes["weak_phrases"]:
        tips.append("Replace filler phrasing (" +
                    ", ".join(impact_notes["weak_phrases"][:3]) +
                    ") with what you actually built and what changed.")
    if keyword_score >= 80 and not tips:
        tips.append("Keyword coverage is strong. Tailor the top third of the "
                    "resume to each company's job description before applying.")

    return tips or ["This resume already clears the main ATS checks."]


def _title(keyword: str) -> str:
    special = {
        "sql": "SQL", "rest api": "REST APIs", "ci/cd": "CI/CD", "aws": "AWS",
        "gcp": "GCP", "nlp": "NLP", "html": "HTML", "css": "CSS", "iam": "IAM",
        "c++": "C++", "qps": "QPS", "api": "API",
    }
    if keyword in special:
        return special[keyword]
    return " ".join(word.capitalize() for word in keyword.split())
