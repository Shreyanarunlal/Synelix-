"""Tests for the Synelix ML layer.

Run with: python -m pytest tests -q   (from the ml-service directory)

These assert behaviour that has to hold for the product to be trustworthy -
monotonicity, bounded outputs, honest handling of missing input - rather than
pinning exact numbers, which would break on every retrain.
"""

from __future__ import annotations

import pytest

from synelix_ml import dataset, matching, resume, roadmap, service, skillgap
from synelix_ml.features import coerce_profile, signal_scores
from synelix_ml.roles import JOB_CORPUS, ROLE_BENCHMARKS

pytestmark = pytest.mark.filterwarnings("ignore::UserWarning")


STRONG = {
    "cgpa": 9.1, "dsa_solved": 420, "aptitude_score": 94, "projects_count": 5,
    "internships_months": 6, "certifications_count": 4, "hackathons_won": 3,
    "communication_score": 90, "backlogs": 0, "department": "Computer Science",
    "targetRole": "Full Stack Developer",
    "skills": [
        {"name": "Java", "level": 92}, {"name": "React.js", "level": 88},
        {"name": "Spring Boot", "level": 85}, {"name": "PostgreSQL", "level": 82},
        {"name": "Docker", "level": 78},
    ],
    "projects": [{"title": "Task Queue", "tech": "Java Spring Boot Redis Kafka",
                  "description": "async scheduler handling concurrent jobs"}],
}

WEAK = {
    "cgpa": 5.9, "dsa_solved": 25, "aptitude_score": 42, "projects_count": 0,
    "internships_months": 0, "certifications_count": 0, "hackathons_won": 0,
    "communication_score": 45, "backlogs": 3, "department": "Mechanical Engineering",
    "targetRole": "Full Stack Developer", "skills": [],
}


@pytest.fixture(scope="module")
def models():
    if not service.is_ready():
        pytest.skip("Model bundle not trained; run python -m synelix_ml.train")
    return service.load_bundle()


# ---------------------------------------------------------------- features

def test_missing_fields_fall_back_to_documented_defaults():
    clean = coerce_profile({})
    assert 0 <= clean["cgpa"] <= 10
    assert clean["department"] in {"Computer Science"}


def test_out_of_range_values_are_clipped_not_rejected():
    clean = coerce_profile({"cgpa": 47.0, "aptitude_score": -12, "dsa_solved": 99999})
    assert clean["cgpa"] == 10.0
    assert clean["aptitude_score"] == 0
    assert clean["dsa_solved"] == 1200


def test_free_text_department_maps_onto_a_known_category():
    assert coerce_profile({"department": "CSE"})["department"] == "Computer Science"
    assert coerce_profile({"department": "mech"})["department"] == "Mechanical Engineering"
    assert coerce_profile({"department": "Artificial Intelligence"})["department"] \
        == "AI & Data Science"


def test_backlogs_lower_academic_standing():
    clean = signal_scores({**STRONG, "backlogs": 0})
    with_backlogs = signal_scores({**STRONG, "backlogs": 2})
    assert with_backlogs["academic_standing"] < clean["academic_standing"]


# ---------------------------------------------------------------- dataset

def test_generated_dataset_is_plausible():
    frame = dataset.generate(n=2000, seed=1)
    rate = frame["placed"].mean()
    assert 0.6 < rate < 0.9, f"placement rate {rate:.2f} is not campus-realistic"

    placed = frame[frame["placed"] == 1]
    assert 5.0 < placed["ctc_lpa"].median() < 14.0


def test_stronger_students_are_placed_more_often():
    frame = dataset.generate(n=4000, seed=2)
    top = frame[frame["cgpa"] >= 8.5]["placed"].mean()
    bottom = frame[frame["cgpa"] <= 6.5]["placed"].mean()
    assert top > bottom


def test_placement_is_not_deterministic():
    # If the logit saturated, the label would be a step function and the
    # classifier would have nothing to learn.
    frame = dataset.generate(n=3000, seed=3)
    mid = frame[(frame["cgpa"] > 7.0) & (frame["cgpa"] < 8.0)]["placed"]
    assert 0.05 < mid.mean() < 0.95


# ---------------------------------------------------------------- prediction

def test_prediction_is_bounded_and_well_formed(models):
    result = service.predict(STRONG)
    assert 0 <= result["probability"] <= 100
    assert result["minCtc"] < result["maxCtc"]
    assert result["tier"] and result["tierLevel"]
    assert result["modelSource"] == "synelix-ml"


def test_stronger_profile_scores_higher(models):
    assert service.predict(STRONG)["probability"] > service.predict(WEAK)["probability"]


def test_more_solved_problems_never_lowers_the_score(models):
    base = service.predict({**STRONG, "dsa_solved": 200})["probability"]
    more = service.predict({**STRONG, "dsa_solved": 400})["probability"]
    assert more >= base


def test_factor_weights_sum_to_one(models):
    insights = service.predict(STRONG)["factorInsights"]
    assert insights
    assert sum(i["weightValue"] for i in insights) == pytest.approx(1.0, abs=0.01)


def test_what_if_levers_are_ranked_by_their_real_effect(models):
    levers = service.predict(WEAK)["whatIf"]
    assert levers
    gains = [lever["gain"] for lever in levers]
    assert gains == sorted(gains, reverse=True)


def test_what_if_matches_an_actual_re_score(models):
    """The advertised gain must be what the model really does, not an estimate."""
    result = service.predict(WEAK)
    lever = next(l for l in result["whatIf"] if l["field"] == "dsa_solved")

    changed = {**WEAK, "dsa_solved": WEAK["dsa_solved"] + lever["delta"]}
    assert service.predict(changed)["probability"] == lever["newProbability"]


def test_an_empty_profile_still_scores(models):
    result = service.predict({})
    assert 0 <= result["probability"] <= 100


# ---------------------------------------------------------------- skill gap

def test_skill_gap_covers_every_benchmark_for_the_role():
    result = skillgap.analyse(STRONG, "SDE-1 (Product Tier 1)")
    assert result["targetRole"] == "SDE-1 (Product Tier 1)"
    assert len(result["benchmarks"]) == len(ROLE_BENCHMARKS["SDE-1 (Product Tier 1)"])


def test_skill_gap_levels_are_derived_from_the_profile_not_fixed():
    low = skillgap.analyse({**STRONG, "dsa_solved": 40})
    high = skillgap.analyse({**STRONG, "dsa_solved": 440})

    def dsa_level(result):
        return next(b["studentCurrent"] for b in result["benchmarks"]
                    if b["skill"] == "DSA & Problem Solving")

    assert dsa_level(high) > dsa_level(low)


def test_deficits_are_ordered_worst_first():
    gaps = skillgap.analyse(WEAK)["deficits"]
    assert gaps
    assert [g["gap"] for g in gaps] == sorted(g["gap"] for g in gaps)


def test_declared_skills_cannot_erase_a_gap_on_their_own():
    """A claimed skill is damped against evidence rather than taken at face value."""
    claimed = {**WEAK, "skills": [{"name": "System Design", "level": 100}]}
    level = next(b["studentCurrent"] for b in skillgap.analyse(claimed)["benchmarks"]
                 if b["skill"] == "System Design")
    assert level < 100


def test_unknown_role_falls_back_to_the_default():
    assert skillgap.analyse(STRONG, "Underwater Basket Weaver")["targetRole"] \
        == "Full Stack Developer"


# ---------------------------------------------------------------- matching

def test_match_scores_are_bounded_and_sorted(models):
    results = service.match_jobs(STRONG, limit=12)
    assert results
    scores = [job["matchScore"] for job in results]
    assert scores == sorted(scores, reverse=True)
    assert all(5 <= score <= 99 for score in scores)


def test_a_weak_profile_misses_tier_one_cut_offs(models):
    results = {job["name"]: job for job in service.match_jobs(WEAK, limit=12)}
    assert results["Google"]["unmetCriteria"]
    assert results["Google"]["status"] == "Eligibility Gap"


def test_a_qualified_candidate_is_never_labelled_a_stretch(models):
    for job in service.match_jobs(STRONG, limit=12):
        if not job["unmetCriteria"]:
            assert "Stretch" not in job["status"]


def test_strong_profile_outranks_weak_profile_on_the_same_job(models):
    strong = {j["id"]: j["matchScore"] for j in service.match_jobs(STRONG, limit=12)}
    weak = {j["id"]: j["matchScore"] for j in service.match_jobs(WEAK, limit=12)}
    for job_id in strong:
        assert strong[job_id] >= weak[job_id]


def test_coverage_rewards_relevant_evidence(models):
    bare = service.match_jobs({**STRONG, "skills": [], "projects": []}, limit=12)
    rich = service.match_jobs(STRONG, limit=12)
    bare_by_id = {j["id"]: j["coverage"] for j in bare}
    rich_by_id = {j["id"]: j["coverage"] for j in rich}
    assert max(rich_by_id.values()) > max(bare_by_id.values())


def test_every_indexed_job_can_be_returned(models):
    returned = {job["id"] for job in service.match_jobs(STRONG, limit=20)}
    assert returned == {job["id"] for job in JOB_CORPUS}


# ---------------------------------------------------------------- roadmap

def test_roadmap_targets_the_students_own_gaps(models):
    gaps = skillgap.analyse(WEAK)
    plan = roadmap.generate(gaps, {"name": "Foundation Builder"})
    titles = [task["title"] for phase in plan for task in phase["tasks"]]
    assert any("backlog" in title.lower() for title in titles)


def test_roadmap_always_ends_with_interview_preparation(models):
    plan = roadmap.generate(skillgap.analyse(STRONG), {"name": "Interview-Ready Allrounder"})
    last_phase_titles = " ".join(t["title"] for t in plan[-1]["tasks"]).lower()
    assert "mock" in last_phase_titles or "ats" in last_phase_titles


def test_roadmap_task_ids_are_unique():
    plan = roadmap.generate(skillgap.analyse(WEAK), {"name": "Foundation Builder"})
    ids = [task["id"] for phase in plan for task in phase["tasks"]]
    assert len(ids) == len(set(ids))


def test_phase_titles_are_unique():
    plan = roadmap.generate(skillgap.analyse(WEAK), {"name": "Foundation Builder"})
    titles = [phase["phase"] for phase in plan]
    assert len(titles) == len(set(titles))


def test_completed_state_survives_regeneration():
    gaps = skillgap.analyse(STRONG)
    plan = roadmap.generate(gaps, {"name": "Near-Ready, One Gap"}, completed={"t1": True})
    assert plan[0]["tasks"][0]["done"] is True


def test_a_student_with_no_gaps_still_gets_a_plan():
    no_gaps = {"targetRole": "Full Stack Developer", "benchmarks": [], "deficits": []}
    plan = roadmap.generate(no_gaps, {"name": "Interview-Ready Allrounder"})
    assert plan and any(phase["tasks"] for phase in plan)


# ---------------------------------------------------------------- resume

def test_resume_without_text_reports_honestly_instead_of_scoring():
    result = resume.analyse("", "Full Stack Developer")
    assert result["analysed"] is False
    assert result["overallScore"] is None


def test_a_detailed_resume_outscores_a_vague_one():
    good = """
    Arjun Karthik | arjun@college.edu | github.com/arjun | linkedin.com/in/arjun
    EDUCATION B.Tech Computer Science, CGPA 8.7, university
    TECHNICAL SKILLS Java Python JavaScript React Node Spring Boot REST API SQL
    PostgreSQL MongoDB Docker Git Microservices CI/CD Unit Testing Agile HTML CSS Redis
    EXPERIENCE Software Engineering Intern. Architected a queue processing 10000+ jobs,
    reduced latency by 35%, improved throughput 3x, automated deployment.
    PROJECTS Built a scheduler; optimised queries from 800ms to 120ms.
    """
    vague = "John Doe. Responsible for various tasks. Worked on projects. Team player."

    assert resume.analyse(good)["overallScore"] > resume.analyse(vague)["overallScore"]


def test_resume_scores_stay_in_range():
    result = resume.analyse("Java Python React Docker SQL. Reduced latency by 40%.")
    for key in ("overallScore", "formatScore", "keywordScore", "impactScore"):
        assert 0 <= result[key] <= 100


def test_resume_keywords_follow_the_target_role():
    text = "python pandas pytorch machine learning statistics sql"
    ds = resume.analyse(text, "Data Scientist & AI Engineer")
    fs = resume.analyse(text, "Full Stack Developer")
    assert ds["keywordScore"] > fs["keywordScore"]
