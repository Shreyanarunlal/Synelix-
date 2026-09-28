# Synelix ML Service

The AI/ML layer: placement prediction, skill-gap detection, job matching,
personalised roadmap generation and ATS resume analysis.

Runs as a standalone FastAPI service. The Spring Boot backend is the expected
caller and falls back to its own heuristic scorer when this service is not
running.

## Setup

```bash
pip install -r requirements.txt
python -m synelix_ml.dataset     # optional: inspect the generated corpus
python -m synelix_ml.train       # trains and persists all four models
python -m uvicorn app:app --port 8000
```

Interactive API docs at `http://localhost:8000/docs`.

## Tests

```bash
python -m pytest tests -q
```

## Models

`train.py` produces `models/synelix_models.joblib` containing:

1. **Placement classifier** — `GradientBoostingClassifier` inside a
   `CalibratedClassifierCV` (isotonic, 4-fold). Calibration matters because the
   output is shown to a student as a percentage, so it has to mean what it
   says.
2. **CTC regressor** — `GradientBoostingRegressor` trained on the placed
   cohort. The tier band is derived from this prediction, so the tier and the
   salary range can never disagree.
3. **Cohort model** — k-means over the scaled feature space. Clusters are named
   by rank (placement rate) and diagnosed by their weakest axis, which is what
   decides how much remedial groundwork a roadmap opens with.
4. **Job matcher** — TF-IDF over the job requirement corpus.

`models/training_report.json` carries the held-out metrics and the learned
importances.

## Training data

See the module docstring in `synelix_ml/dataset.py` for the full generative
process. In short: the corpus is **simulated from a documented statistical
model**, because no public dataset carries every signal the platform collects.
Placement labels are generated with a weighting the models never see, so
reported accuracy reflects real generalisation — over a simulation. The
top-level README says the same thing more plainly.

Swap `data/placement_dataset.csv` for a real institutional export with the same
columns and the pipeline trains unchanged.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness and whether the bundle is loaded |
| GET | `/model-info` | Learned weights, importances, held-out metrics |
| POST | `/predict` | Probability, expected CTC, tier, factor breakdown, what-if |
| POST | `/skill-gap` | Benchmark comparison and ranked deficits |
| POST | `/match-jobs` | Content-based matching with eligibility and band fit |
| POST | `/roadmap` | Phased plan built from the student's own gaps |
| POST | `/resume/analyze` | ATS scoring over real resume text |
| GET | `/tiers` | The tier bands and their CTC ranges |

All request and response shapes are in `synelix_ml/schemas.py`. Every profile
field is optional; missing values fall back to documented defaults and
out-of-range values are clipped rather than rejected, so a partially completed
profile still scores.
