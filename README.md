# Synelix

**Sync Your Skills. Secure Your Future.**
AI-powered placement prediction and career-readiness platform.

Synelix brings assessment, readiness analysis, personalised development and
recruiter discovery into one platform, for three kinds of user: students
preparing for campus placements, recruiters searching for candidates, and the
Training & Placement cell monitoring a cohort.

---

## Architecture

```
React + Vite (5173)          Student / Recruiter / Institution portals
        |
        |  REST + JWT
        v
Spring Boot 4 (8080)         Auth, profiles, search, analytics, persistence
        |
        |  REST (with heuristic fallback)
        v
FastAPI + scikit-learn (8000)  Prediction, skill-gap, matching, roadmap, ATS
        |
        v
H2 (default) / PostgreSQL     Students, skills, predictions, drives, shortlists
```

The three services run independently. **If the ML service is down the platform
keeps working**: Spring Boot falls back to a transparent weighted scorer and
labels every affected response `"modelSource": "heuristic-fallback"`, so a
degraded score is never presented as a model score.

| Layer | Stack | Directory |
|---|---|---|
| Frontend | React 19, Vite, Tailwind 4, Recharts, Framer Motion | `src/` |
| Backend | Java 17, Spring Boot 4.1, Spring Security, JPA | `backend/` |
| ML | Python 3.13, scikit-learn, pandas, FastAPI | `ml-service/` |

---

## Running it

Three terminals. The order matters only in that the ML service should be
trained before the backend first calls it.

### 1. ML service

```bash
cd ml-service
pip install -r requirements.txt
python -m synelix_ml.train          # generates the dataset and trains the models
python -m uvicorn app:app --port 8000
```

`train` prints the held-out metrics and writes `models/synelix_models.joblib`
plus `models/training_report.json`. It takes about a minute.

### 2. Backend

```bash
cd backend
mvn spring-boot:run
```

Starts on `http://localhost:8080` with a file-backed H2 database at
`backend/data/synelix.mv.db`, and seeds a 60-student demo cohort on first run.

For PostgreSQL instead:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

### 3. Frontend

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Demo logins

The seeder creates one account per role. Password for all three:
`synelix123`.

| Role | Email |
|---|---|
| Student | `student@synelix.dev` |
| Recruiter | `recruiter@synelix.dev` |
| Placement cell | `tpo@synelix.dev` |

The login page has one-click buttons for each; they perform a real sign-in.

---

## The ML layer

Four models, all trained in `ml-service/synelix_ml/train.py`.

| Model | Purpose | Held-out performance |
|---|---|---|
| Gradient-boosted classifier (isotonic-calibrated) | Placement probability | Accuracy 0.78, ROC-AUC 0.80, Brier 0.15 |
| Gradient-boosted regressor | Expected CTC in LPA | MAE ₹1.43 LPA, R² 0.85 |
| k-means (k=4) | Student cohort / archetype | 4 cohorts, placement rates 41% – 98% |
| TF-IDF vectoriser | Job requirement matching | 12 indexed roles |

Run `python -m synelix_ml.train` to reproduce these; the exact figures move a
little between runs of the data generator.

### About the training data

**The training corpus is simulated, and the code says so.** No public dataset
carries every signal Synelix collects, so `synelix_ml/dataset.py` generates
9,000 students from an explicit, documented statistical model rather than
quietly inventing numbers:

1. A latent aptitude score is drawn per student, offset by department.
2. Observable features (CGPA, problems solved, aptitude, projects,
   internships, certifications, hackathons, communication, backlogs) are drawn
   as noisy non-linear functions of that latent score, so they correlate with
   each other without any one being a perfect proxy.
3. Placement is a Bernoulli draw whose log-odds use a *different* weighting
   that the models never see, plus independent noise — so the classifier has a
   real signal to recover instead of an identity to memorise.
4. CTC for placed students is log-normal in the same talent score.

The simulated cohort lands at a 73% placement rate with a median offer of
₹7.8 LPA and a long tail into Tier-1 packages, which is what a mid-tier
engineering college actually reports. Point the same pipeline at a real
institutional export and it trains unchanged.

Because of step 3 the reported accuracy is genuine generalisation — but
generalisation over a simulation. Treat the numbers as a working demonstration
of the pipeline, not as evidence about real students.

### What each endpoint does

| Endpoint | Behaviour |
|---|---|
| `POST /predict` | Calibrated probability, expected CTC, tier band, per-factor breakdown, and **what-if analysis** |
| `POST /skill-gap` | Scores each benchmark skill from profile evidence, returns ranked deficits |
| `POST /match-jobs` | Blends requirement coverage, eligibility cut-offs and salary-band fit |
| `POST /roadmap` | Builds a phased plan from the student's own detected gaps |
| `POST /resume/analyze` | ATS scoring over real resume text |
| `GET /model-info` | Learned weights, feature importances, held-out metrics |

Three design decisions worth calling out:

**Factor weights are learned, not written down.** The "Coding & DSA: 22%"
figures in the dashboard come from permutation importance measured on the
held-out split, rolled up per factor. Retraining changes them.

**What-if analysis actually re-runs the model.** Each suggestion
("Solve 50 more DSA problems → 84%, +4.4 points") is produced by re-scoring the
modified profile, not by reading a coefficient. A test asserts the advertised
number matches a real re-score.

**Matching uses requirement coverage, not cosine similarity.** Plain cosine was
tried first and rejected: a student profile is a short document, so its cosine
against every job is near zero except where a rare term happens to collide —
which ranked Google *below* an IT-services role for a candidate who cleared
every Google cut-off. Coverage asks the question a recruiter asks — how much of
what this role needs can this student evidence? — and behaves correctly.

Declared skills are damped rather than trusted: claiming "System Design: 100"
with no supporting projects or certifications will not close the gap.

---

## The backend

### Security

- JWT bearer tokens (HS256), BCrypt password hashing.
- Role-based route authorisation: students and the placement cell reach
  `/api/students/**`, recruiters and the placement cell reach
  `/api/companies/**`, only the placement cell reaches `/api/institution/**`.
- A student is pinned to their own token subject. Passing another student's
  address in `?email=` is **rejected**, not silently honoured; only an
  institution account may look up an arbitrary student.
- Login returns the same message for an unknown email and a wrong password, so
  the endpoint cannot be used to enumerate accounts.
- 401 for unauthenticated, 403 for authenticated-but-forbidden, so the SPA can
  tell "sign in again" from "not your portal".

Set `SYNELIX_JWT_SECRET` (32+ characters) in any real deployment. The default
in `application.properties` is a development placeholder.

### Data

Everything the dashboards show is aggregated from the database at request time
— placement rate, per-department readiness, average package, drive eligibility.
None of it is a fixed snapshot.

Campus-drive eligibility is computed by running the published cut-offs against
the real cohort, rather than the caller asserting a number.

The seeder generates its cohort from a fixed seed, then scores every student
through the real prediction path, so their readiness figures come from the
model rather than being typed in.

---

## Tests

```bash
cd backend && mvn test          # 37 tests
cd ml-service && python -m pytest tests -q   # 35 tests
```

The backend suite runs with the ML service deliberately disabled, which is the
harder case: every endpoint must still respond using its labelled fallback. It
covers authentication, the role boundaries above, validation, prediction,
skill-gap, roadmap persistence, recruiter search and shortlisting, institution
analytics and drive scheduling.

The ML suite asserts properties that must hold for the product to be
trustworthy — monotonicity, bounded outputs, ranked what-if gains matching real
re-scores, honest handling of missing input — rather than pinning exact numbers
that would break on every retrain.

---

## Honest limitations

- **The training data is synthetic.** See above. The pipeline is real; the
  students are not.
- **The AI Copilot is rule-based, not a language model.** It routes intents and
  answers from the student's stored record and the model's real output. It says
  so in its own `source` field rather than implying generative AI.
- **Resume analysis needs real text.** With no resume supplied it reports that
  and returns no score, instead of inventing one.
- **Company matching returns nothing when the ML service is down**, rather than
  fabricating match scores — a match score is the entire point of that endpoint.
- The job corpus (12 employers) is a fixed reference list in
  `ml-service/synelix_ml/roles.py`, not a live job feed.

---

## Layout

```
synelix/
├── src/                        React frontend
│   ├── pages/                  Home, Login, Register, SelectRole, 3 dashboards
│   ├── components/             Layout, dashboard widgets, AI copilot drawer
│   ├── context/                Auth provider and shared context
│   ├── hooks/                  useAuth, useApiResource
│   └── services/api.js         REST client (JWT, typed errors, no silent mocks)
│
├── backend/                    Spring Boot
│   └── src/main/java/synelix_backend/
│       ├── config/             Security, CORS, data seeder
│       ├── security/           JWT service and filter
│       ├── ml/                 ML client (timeouts + circuit breaker) and payloads
│       ├── controller/         REST endpoints
│       ├── service/            Business logic and fallback scorers
│       ├── entity/ repository/ JPA model
│       └── dto/ exception/     Request/response shapes, global error handling
│
└── ml-service/                 Python ML
    ├── app.py                  FastAPI
    ├── synelix_ml/
    │   ├── dataset.py          Documented synthetic data generator
    │   ├── features.py         Shared feature engineering
    │   ├── train.py            Trains and persists all four models
    │   ├── service.py          Inference, explanations, what-if
    │   ├── skillgap.py matching.py roadmap.py resume.py
    │   └── roles.py            Role benchmarks and job corpus
    └── tests/
```
