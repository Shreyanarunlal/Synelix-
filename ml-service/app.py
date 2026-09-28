"""Synelix ML service.

FastAPI wrapper around the trained model bundle.  The Spring Boot backend is
the only expected caller; it falls back to its own heuristic scorer when this
service is unreachable, so the platform degrades rather than breaking.

Run with:  uvicorn app:app --port 8000 --reload
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from synelix_ml import __version__, service
from synelix_ml.schemas import (
    HealthResponse,
    MatchRequest,
    ResumeRequest,
    RoadmapRequest,
    SkillGapRequest,
    StudentProfile,
)
from synelix_ml.service import ModelsUnavailable

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("synelix.ml")

@asynccontextmanager
async def lifespan(_: FastAPI):
    """Load the bundle at start-up so the first request is not the slow one."""
    try:
        service.load_bundle()
        log.info("Model bundle loaded")
    except ModelsUnavailable as exc:
        log.warning("%s", exc)
    yield


app = FastAPI(
    title="Synelix ML Service",
    description=(
        "Placement prediction, skill-gap detection, job matching and "
        "personalised roadmap generation."
    ),
    version=__version__,
    lifespan=lifespan,
)

# The Spring Boot backend calls this service server-side; the browser origins
# are allowed so the API docs and any direct debugging still work.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _guard():
    if not service.is_ready():
        raise HTTPException(
            status_code=503,
            detail="Models not trained yet. Run: python -m synelix_ml.train",
        )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        modelsLoaded=service.is_ready(),
        version=__version__,
    )


@app.get("/model-info")
def model_info():
    _guard()
    return service.model_info()


@app.post("/predict")
def predict(profile: StudentProfile):
    """Placement probability, expected CTC, tier, factor breakdown, what-if."""
    _guard()
    return service.predict(profile.to_features())


@app.post("/skill-gap")
def skill_gap(request: SkillGapRequest):
    """Benchmark comparison and ranked deficits for a target role."""
    _guard()
    return service.skill_gap(request.profile.to_features(), request.targetRole)


@app.post("/match-jobs")
def match_jobs(request: MatchRequest):
    """Content-based company matching, blended with eligibility and band fit."""
    _guard()
    return service.match_jobs(request.profile.to_features(), request.limit)


@app.post("/roadmap")
def roadmap(request: RoadmapRequest):
    """Phased learning plan built from the student's own detected gaps."""
    _guard()
    return service.build_roadmap(
        request.profile.to_features(), request.targetRole, request.completed
    )


@app.post("/resume/analyze")
def analyze_resume(request: ResumeRequest):
    """ATS scoring over real resume text; reports honestly when text is absent."""
    return service.analyse_resume(request.resumeText, request.targetRole, request.fileName)


@app.get("/tiers")
def tiers():
    return service.tiers()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
