"""Personalised learning-roadmap generation.

The roadmap is assembled from the student's own detected gaps rather than
served from a fixed template: the gaps are ordered by severity, expanded into
concrete tasks from a per-skill task bank, and packed into two-week phases.
The k-means cohort decides how much remedial groundwork comes first and how
early interview preparation starts.
"""

from __future__ import annotations

from typing import Any, Dict, List

# Concrete, checkable tasks per benchmark skill.  Ordered easiest first so a
# phase reads as a progression.
TASK_BANK: Dict[str, List[str]] = {
    "DSA & Problem Solving": [
        "Solve 25 medium Array, Two-Pointer and Sliding Window problems",
        "Complete HashMap, Prefix Sum and Stack pattern sets",
        "Work through Binary Tree and BST traversal problems including LCA",
        "Cover Graph BFS/DFS, topological sort and Dijkstra",
        "Finish 1D and 2D Dynamic Programming: knapsack and subsequence patterns",
    ],
    "Coding Speed & Accuracy": [
        "Enter two timed contests per week and review every missed problem",
        "Re-solve past problems under a 25-minute cap to build speed",
    ],
    "Core CS (OS/DBMS/CN)": [
        "Revise process scheduling, deadlocks and virtual memory",
        "Revise ACID properties, indexing, normalisation and query plans",
        "Revise the TCP handshake, HTTP semantics and DNS resolution",
    ],
    "System Design": [
        "Study caching strategies, load balancing and database sharding",
        "Write a design document for your capstone with capacity estimates",
        "Present one high-level design end to end in a mock session",
    ],
    "System Design (LLD/HLD)": [
        "Implement Factory, Observer, Strategy and Singleton patterns in Java",
        "Design a thread-safe rate limiter with a bounded thread pool",
        "Complete two high-level design walkthroughs (URL shortener, news feed)",
    ],
    "Database & SQL": [
        "Practise multi-table joins, window functions and CTEs",
        "Add the right indexes to a slow query and measure the improvement",
    ],
    "Database & Concurrency": [
        "Implement optimistic locking and connection pooling in a service",
        "Load-test the service and record throughput and p99 latency",
    ],
    "Frontend (React/Vue)": [
        "Rebuild one project with React hooks, context and route-level splitting",
        "Add accessible forms with validation and loading and error states",
    ],
    "Backend (Node/Spring)": [
        "Add JWT authentication and role-based authorisation to a backend",
        "Introduce an asynchronous queue (Kafka or RabbitMQ) for a slow path",
    ],
    "DevOps & Cloud": [
        "Write a multi-stage Dockerfile and cut the image below 200 MB",
        "Deploy the containerised backend to AWS ECS or EC2 with a live URL",
        "Add a GitHub Actions pipeline that runs tests and publishes the image",
    ],
    "Containerization (Docker)": [
        "Write multi-stage Dockerfiles for two services and compose them",
        "Add health checks and resource limits to every container",
    ],
    "Kubernetes & Orchestration": [
        "Deploy a multi-container pod with services and an ingress controller",
        "Configure liveness and readiness probes plus a horizontal pod autoscaler",
    ],
    "CI/CD & Infrastructure as Code": [
        "Build a GitHub Actions workflow running unit tests on every pull request",
        "Provision one environment with Terraform and commit the state backend",
    ],
    "Cloud Platforms (AWS/GCP)": [
        "Complete an AWS Cloud Practitioner or GCP Associate certification",
        "Build one VPC-backed deployment with least-privilege IAM roles",
    ],
    "Linux & Bash Scripting": [
        "Automate a deployment in Bash with logging, traps and exit codes",
        "Practise text processing with grep, awk, sed and process inspection",
    ],
    "Networking & Security": [
        "Revise the OSI model, TLS handshakes and certificate chains",
        "Work through the OWASP Top 10 against a deliberately vulnerable app",
    ],
    "Aptitude & Reasoning": [
        "Practise Time and Work, Speed and Distance, Profit and Loss",
        "Practise Data Interpretation and Syllogisms under timed conditions",
    ],
    "Aptitude & Logic": [
        "Practise Time and Work, Speed and Distance, Profit and Loss",
        "Practise Data Interpretation, Syllogisms and critical reasoning puzzles",
    ],
    "Python & Data Wrangling": [
        "Clean and reshape a messy real-world dataset end to end with pandas",
        "Document the pipeline and publish the notebook",
    ],
    "Machine Learning / Scikit": [
        "Train and tune Random Forest and gradient boosting with cross-validation",
        "Report precision, recall, ROC-AUC and a calibration curve",
    ],
    "Math & Statistics": [
        "Revise Bayes theorem, conditional probability and distributions",
        "Revise hypothesis testing, confidence intervals and linear algebra",
    ],
    "Deep Learning / PyTorch": [
        "Train a CNN on an image dataset and report the evaluation metrics",
        "Fine-tune a small transformer and compare it against your baseline",
    ],
    "SQL & Data Warehousing": [
        "Model a star schema and write analytical queries over it",
        "Practise window functions and incremental loading patterns",
    ],
    "Model Deployment & API": [
        "Serve a trained model behind FastAPI with request validation",
        "Containerise it and add health, readiness and metrics endpoints",
    ],
}

# Closing phase, appended for every student regardless of their gaps.
INTERVIEW_PHASE_TASKS = [
    "Run behavioural and HR interview practice using the STAR method",
    "Complete two full-length timed company placement mock tests",
    "Run a final ATS resume audit and publish your recruiter showcase profile",
]

# Remedial groundwork, prepended only for the weakest cohort.
FOUNDATION_TASKS = [
    "Clear all pending backlogs - they gate eligibility at most companies",
    "Rebuild programming fundamentals: recursion, complexity analysis, OOP",
]

TASKS_PER_PHASE = 3


def generate(skill_gap: Dict[str, Any], cohort: Dict[str, Any] | None,
             completed: Dict[str, bool] | None = None) -> List[Dict[str, Any]]:
    """Build the phased roadmap for one student.

    ``completed`` maps task ids to their done state so progress survives
    regeneration when the student's profile changes.
    """
    completed = completed or {}
    cohort_name = (cohort or {}).get("name", "Developing Profile")

    tasks: List[str] = []
    if cohort_name == "Foundation Builder":
        tasks.extend(FOUNDATION_TASKS)

    # Severest gap first, so the highest-leverage work is scheduled earliest.
    for deficit in skill_gap.get("deficits", []):
        for task in TASK_BANK.get(deficit["skill"], []):
            if task not in tasks:
                tasks.append(task)

    if not tasks:
        # No gaps left: the student is benchmark-ready, so the roadmap becomes
        # pure interview conversion work.
        tasks.append("Maintain your benchmark level with weekly timed contests")
        tasks.append("Run one system design mock per week with a peer")

    tasks.extend(INTERVIEW_PHASE_TASKS)

    phases: List[Dict[str, Any]] = []
    counter = 1
    seen_titles: Dict[str, int] = {}
    for index in range(0, len(tasks), TASKS_PER_PHASE):
        chunk = tasks[index:index + TASKS_PER_PHASE]
        phase_number = len(phases) + 1
        start_week = (phase_number - 1) * 2 + 1

        phase_tasks = []
        for title in chunk:
            task_id = f"t{counter}"
            counter += 1
            phase_tasks.append({
                "id": task_id,
                "title": title,
                "done": bool(completed.get(task_id, False)),
            })

        done_count = sum(1 for t in phase_tasks if t["done"])
        percent = int(round(100 * done_count / len(phase_tasks))) if phase_tasks else 0

        if percent == 100:
            status, badge = "completed", "100% Done"
        elif done_count > 0:
            status, badge = "in-progress", f"{percent}% Done"
        elif phase_number == 1:
            status, badge = "in-progress", "Current Phase"
        else:
            status, badge = "upcoming", "Upcoming"

        # A theme can span more than one phase; number the repeats so two
        # phases never carry an identical heading.
        title = _phase_title(chunk, phase_number, len(tasks))
        seen_titles[title] = seen_titles.get(title, 0) + 1
        if seen_titles[title] > 1:
            title = f"{title} (Part {seen_titles[title]})"

        phases.append({
            "week": f"Week {start_week} - {start_week + 1}",
            "phase": title,
            "tasks": phase_tasks,
            "status": status,
            "badge": badge,
        })

    return phases


def _phase_title(chunk: List[str], phase_number: int, total_tasks: int) -> str:
    """Name a phase after the theme of the tasks it actually contains."""
    joined = " ".join(chunk).lower()
    themes = [
        (("leetcode", "dynamic programming", "graph", "binary tree", "pattern", "contest"),
         "Core DSA & Problem Solving"),
        (("design document", "design patterns", "sharding", "load balancing", "thread-safe"),
         "System Design & Architecture"),
        (("docker", "kubernetes", "terraform", "github actions", "aws", "deploy"),
         "Cloud, Containers & Deployment"),
        (("aptitude", "syllogism", "data interpretation", "reasoning"),
         "Aptitude & Logical Reasoning"),
        (("pandas", "pytorch", "model", "random forest", "hypothesis"),
         "Applied Machine Learning"),
        (("star method", "mock test", "ats resume", "recruiter"),
         "Mock Interviews & ATS Optimisation"),
        (("backlog", "fundamentals", "recursion"),
         "Foundations & Eligibility Clearance"),
        (("react", "hooks", "jwt", "queue", "sql", "join", "index"),
         "Full Stack Engineering Depth"),
    ]
    for keywords, title in themes:
        if any(keyword in joined for keyword in keywords):
            return title
    return f"Phase {phase_number} Focus"
