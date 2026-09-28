"""Target-role benchmarks and the company/job corpus used for matching.

Every benchmark skill carries a ``sources`` map naming the evidence in a
student's profile that the platform uses to score that skill.  This is what
turns skill-gap analysis from a hard-coded table into something derived from
the student's actual record.
"""

from __future__ import annotations

# ``sources`` are weighted contributions from normalised profile signals;
# ``declared`` names self-reported skills that reinforce the estimate.
ROLE_BENCHMARKS = {
    "Full Stack Developer": [
        {"skill": "Frontend (React/Vue)", "required": 85,
         "sources": {"projects": 0.6, "certifications": 0.4},
         "declared": ["React.js", "React", "Vue", "JavaScript", "TypeScript"]},
        {"skill": "Backend (Node/Spring)", "required": 85,
         "sources": {"projects": 0.6, "internships": 0.4},
         "declared": ["Node.js", "Spring Boot", "Express", "Django"]},
        {"skill": "DSA & Problem Solving", "required": 80,
         "sources": {"dsa": 1.0},
         "declared": ["Data Structures & Algorithms", "DSA"]},
        {"skill": "Database & SQL", "required": 80,
         "sources": {"projects": 0.5, "cgpa": 0.5},
         "declared": ["PostgreSQL", "MySQL", "SQL", "MongoDB"]},
        {"skill": "System Design", "required": 75,
         "sources": {"internships": 0.5, "projects": 0.3, "cgpa": 0.2},
         "declared": ["System Design"]},
        {"skill": "DevOps & Cloud", "required": 70,
         "sources": {"certifications": 0.7, "projects": 0.3},
         "declared": ["Docker", "Kubernetes", "AWS", "GCP", "Azure"]},
        {"skill": "Aptitude & Reasoning", "required": 75,
         "sources": {"aptitude": 1.0},
         "declared": ["Quantitative Aptitude"]},
    ],
    "SDE-1 (Product Tier 1)": [
        {"skill": "DSA & Problem Solving", "required": 95,
         "sources": {"dsa": 1.0},
         "declared": ["Data Structures & Algorithms", "DSA"]},
        {"skill": "Core CS (OS/DBMS/CN)", "required": 90,
         "sources": {"cgpa": 0.7, "aptitude": 0.3}, "declared": []},
        {"skill": "System Design (LLD/HLD)", "required": 85,
         "sources": {"internships": 0.5, "projects": 0.5},
         "declared": ["System Design"]},
        {"skill": "Coding Speed & Accuracy", "required": 90,
         "sources": {"dsa": 0.7, "aptitude": 0.3}, "declared": []},
        {"skill": "Database & Concurrency", "required": 85,
         "sources": {"projects": 0.6, "cgpa": 0.4},
         "declared": ["PostgreSQL", "MySQL", "SQL", "Redis", "Kafka"]},
        {"skill": "Aptitude & Logic", "required": 85,
         "sources": {"aptitude": 1.0}, "declared": []},
    ],
    "Data Scientist & AI Engineer": [
        {"skill": "Python & Data Wrangling", "required": 90,
         "sources": {"projects": 0.6, "certifications": 0.4},
         "declared": ["Python", "Pandas", "NumPy"]},
        {"skill": "Machine Learning / Scikit", "required": 85,
         "sources": {"projects": 0.5, "certifications": 0.5},
         "declared": ["Machine Learning", "Scikit-learn", "XGBoost"]},
        {"skill": "Math & Statistics", "required": 85,
         "sources": {"cgpa": 0.6, "aptitude": 0.4}, "declared": []},
        {"skill": "Deep Learning / PyTorch", "required": 80,
         "sources": {"projects": 0.5, "certifications": 0.5},
         "declared": ["PyTorch", "TensorFlow", "Deep Learning", "NLP"]},
        {"skill": "SQL & Data Warehousing", "required": 80,
         "sources": {"projects": 0.5, "cgpa": 0.5},
         "declared": ["SQL", "PostgreSQL", "BigQuery"]},
        {"skill": "Model Deployment & API", "required": 75,
         "sources": {"internships": 0.6, "projects": 0.4},
         "declared": ["FastAPI", "Flask", "Docker", "MLOps"]},
    ],
    "Cloud & DevOps Engineer": [
        {"skill": "Linux & Bash Scripting", "required": 90,
         "sources": {"projects": 0.5, "certifications": 0.5},
         "declared": ["Linux", "Bash", "Shell"]},
        {"skill": "Cloud Platforms (AWS/GCP)", "required": 85,
         "sources": {"certifications": 0.7, "internships": 0.3},
         "declared": ["AWS", "GCP", "Azure"]},
        {"skill": "Containerization (Docker)", "required": 85,
         "sources": {"projects": 0.6, "certifications": 0.4},
         "declared": ["Docker"]},
        {"skill": "Kubernetes & Orchestration", "required": 80,
         "sources": {"certifications": 0.6, "internships": 0.4},
         "declared": ["Kubernetes", "Helm"]},
        {"skill": "CI/CD & Infrastructure as Code", "required": 80,
         "sources": {"projects": 0.5, "internships": 0.5},
         "declared": ["CI/CD", "Jenkins", "GitHub Actions", "Terraform"]},
        {"skill": "Networking & Security", "required": 75,
         "sources": {"cgpa": 0.6, "certifications": 0.4}, "declared": []},
    ],
}

DEFAULT_ROLE = "Full Stack Developer"

# Remediation copy keyed by benchmark skill, surfaced with each detected gap.
REMEDIATION = {
    "Frontend (React/Vue)": "Rebuild one project with React hooks, context and route-level code splitting, then publish it with a live URL.",
    "Backend (Node/Spring)": "Add Spring Security with JWT and an asynchronous queue (Kafka or RabbitMQ) to an existing backend.",
    "DSA & Problem Solving": "Work through medium-difficulty Dynamic Programming and Graph sets until the solved count clears the Tier-1 cut-off.",
    "Database & SQL": "Practise multi-table joins, window functions and index design on a dataset with more than a million rows.",
    "System Design": "Study distributed caching, load balancing and database sharding, then write a design document for your capstone.",
    "System Design (LLD/HLD)": "Implement the Factory, Observer and Singleton patterns plus a bounded thread pool in Java.",
    "DevOps & Cloud": "Write a multi-stage Dockerfile for the Spring Boot backend and deploy it to AWS ECS or EC2.",
    "Aptitude & Reasoning": "Run timed mock tests on Data Interpretation and Syllogisms twice a week.",
    "Aptitude & Logic": "Run timed mock tests on Data Interpretation and Syllogisms twice a week.",
    "Core CS (OS/DBMS/CN)": "Revise ACID properties, indexing strategies, process scheduling and the TCP handshake.",
    "Coding Speed & Accuracy": "Complete full-length timed contests, targeting three accepted solutions in ninety minutes.",
    "Database & Concurrency": "Implement optimistic locking and connection pooling, and measure throughput under load.",
    "Python & Data Wrangling": "Clean and reshape a messy real-world dataset end to end with pandas, then document the pipeline.",
    "Machine Learning / Scikit": "Master ensemble methods (Random Forest, XGBoost) and tune them with cross-validated search.",
    "Math & Statistics": "Revise Bayes theorem, hypothesis testing and linear algebra foundations.",
    "Deep Learning / PyTorch": "Train a CNN and a small transformer in PyTorch and report the evaluation metrics.",
    "SQL & Data Warehousing": "Model a star schema and write analytical queries over it.",
    "Model Deployment & API": "Serve a trained model behind FastAPI, containerise it and add health and metrics endpoints.",
    "Linux & Bash Scripting": "Automate a deployment with a Bash script covering logging, traps and exit codes.",
    "Cloud Platforms (AWS/GCP)": "Complete a cloud practitioner certification and build one VPC-backed deployment.",
    "Containerization (Docker)": "Write multi-stage Dockerfiles and cut image size below 200 MB.",
    "Kubernetes & Orchestration": "Deploy multi-container pods with services and an ingress controller.",
    "CI/CD & Infrastructure as Code": "Build a GitHub Actions workflow that runs unit tests and publishes an image on merge.",
    "Networking & Security": "Revise the OSI model, TLS handshakes, the OWASP Top 10 and least-privilege IAM design.",
}

# Job corpus for content-based matching.  ``requirements`` is the free text
# the TF-IDF matcher vectorises; the numeric cut-offs gate eligibility.
JOB_CORPUS = [
    {
        "id": "c1", "name": "Google", "role": "Software Engineer (University Grad)",
        "tier": "Tier-1 Global", "ctc": "Rs 38.5 LPA", "ctc_value": 38.5,
        "location": "Bengaluru / Hyderabad", "logo_text": "G", "logo_bg": "bg-red-500",
        "hiring_season": "Aug - Oct 2026",
        "tags": ["DSA Mastery", "System Design", "Algorithms"],
        "requirements": "advanced data structures algorithms graph traversal dynamic programming system design distributed systems java cpp python clean modular code",
        "min_cgpa": 8.0, "min_dsa": 300, "min_aptitude": 85,
    },
    {
        "id": "c2", "name": "Microsoft", "role": "Software Engineering Intern / FTE",
        "tier": "Tier-1 Global", "ctc": "Rs 42.0 LPA", "ctc_value": 42.0,
        "location": "Hyderabad / Noida", "logo_text": "MS", "logo_bg": "bg-blue-600",
        "hiring_season": "July - Sept 2026",
        "tags": ["Data Structures", "OOP", "Azure"],
        "requirements": "data structures object oriented programming low level design azure cloud csharp java problem solving string manipulation hashmap trie",
        "min_cgpa": 8.0, "min_dsa": 280, "min_aptitude": 82,
    },
    {
        "id": "c3", "name": "Amazon", "role": "SDE-1",
        "tier": "Tier-1 Global", "ctc": "Rs 34.0 LPA", "ctc_value": 34.0,
        "location": "Bengaluru / Chennai", "logo_text": "AZ", "logo_bg": "bg-amber-600",
        "hiring_season": "Aug - Nov 2026",
        "tags": ["Leadership Principles", "DSA", "Distributed Systems"],
        "requirements": "java cpp data structures trees binary search heaps priority queue distributed systems scalability leadership principles ownership bias for action",
        "min_cgpa": 7.5, "min_dsa": 280, "min_aptitude": 80,
    },
    {
        "id": "c4", "name": "Goldman Sachs", "role": "Analyst - Engineering",
        "tier": "Fintech Tier-1", "ctc": "Rs 28.0 LPA", "ctc_value": 28.0,
        "location": "Bengaluru", "logo_text": "GS", "logo_bg": "bg-sky-700",
        "hiring_season": "Aug - Sept 2026",
        "tags": ["Math / Probability", "DSA", "Databases"],
        "requirements": "quantitative aptitude probability statistics mathematics data structures algorithms databases sql fast coding java python risk modelling",
        "min_cgpa": 8.0, "min_dsa": 220, "min_aptitude": 88,
    },
    {
        "id": "c5", "name": "Swiggy / Zomato", "role": "Backend Engineer (SDE-1)",
        "tier": "Unicorn", "ctc": "Rs 22.0 LPA", "ctc_value": 22.0,
        "location": "Remote / Bengaluru", "logo_text": "SZ", "logo_bg": "bg-orange-500",
        "hiring_season": "Immediate",
        "tags": ["Node.js", "Redis", "Kafka", "Microservices"],
        "requirements": "backend engineering node js golang redis kafka microservices rest api concurrency caching postgresql docker high throughput systems",
        "min_cgpa": 7.0, "min_dsa": 180, "min_aptitude": 70,
    },
    {
        "id": "c6", "name": "Flipkart", "role": "SDE-1 (Platform)",
        "tier": "Unicorn", "ctc": "Rs 24.0 LPA", "ctc_value": 24.0,
        "location": "Bengaluru", "logo_text": "FK", "logo_bg": "bg-indigo-600",
        "hiring_season": "Sept - Nov 2026",
        "tags": ["Java", "Microservices", "System Design"],
        "requirements": "java spring boot microservices system design caching message queues kubernetes docker data structures algorithms scalability e commerce platform",
        "min_cgpa": 7.5, "min_dsa": 250, "min_aptitude": 78,
    },
    {
        "id": "c7", "name": "Nvidia", "role": "Deep Learning Engineer (Campus)",
        "tier": "Tier-1 Global", "ctc": "Rs 36.0 LPA", "ctc_value": 36.0,
        "location": "Pune / Bengaluru", "logo_text": "NV", "logo_bg": "bg-green-600",
        "hiring_season": "Sept 2026",
        "tags": ["PyTorch", "CUDA", "Deep Learning"],
        "requirements": "deep learning pytorch tensorflow cuda gpu computing linear algebra machine learning computer vision nlp python numpy model optimisation",
        "min_cgpa": 8.2, "min_dsa": 200, "min_aptitude": 80,
    },
    {
        "id": "c8", "name": "Fractal Analytics", "role": "Data Scientist",
        "tier": "Analytics Tier-1", "ctc": "Rs 18.0 LPA", "ctc_value": 18.0,
        "location": "Mumbai / Bengaluru", "logo_text": "FR", "logo_bg": "bg-fuchsia-600",
        "hiring_season": "Oct 2026",
        "tags": ["Python", "Statistics", "SQL"],
        "requirements": "python pandas numpy scikit learn machine learning statistics hypothesis testing sql data warehousing visualisation business analytics",
        "min_cgpa": 7.5, "min_dsa": 120, "min_aptitude": 82,
    },
    {
        "id": "c9", "name": "Red Hat", "role": "Associate Site Reliability Engineer",
        "tier": "Tier-2 Product", "ctc": "Rs 16.0 LPA", "ctc_value": 16.0,
        "location": "Bengaluru / Pune", "logo_text": "RH", "logo_bg": "bg-rose-600",
        "hiring_season": "Oct - Dec 2026",
        "tags": ["Linux", "Kubernetes", "CI/CD"],
        "requirements": "linux bash scripting kubernetes docker containers ansible terraform ci cd pipelines observability monitoring networking security cloud aws",
        "min_cgpa": 7.0, "min_dsa": 150, "min_aptitude": 72,
    },
    {
        "id": "c10", "name": "Zoho", "role": "Member Technical Staff",
        "tier": "Tier-2 Product", "ctc": "Rs 10.5 LPA", "ctc_value": 10.5,
        "location": "Chennai", "logo_text": "ZO", "logo_bg": "bg-teal-600",
        "hiring_season": "Aug 2026",
        "tags": ["Java", "Problem Solving", "Databases"],
        "requirements": "java problem solving object oriented programming databases sql web application development javascript logical reasoning debugging",
        "min_cgpa": 6.5, "min_dsa": 120, "min_aptitude": 70,
    },
    {
        "id": "c11", "name": "TCS Digital", "role": "System Engineer / Digital Specialist",
        "tier": "Tier-2 Product / Digital", "ctc": "Rs 9.5 LPA", "ctc_value": 9.5,
        "location": "Pan India", "logo_text": "TCS", "logo_bg": "bg-slate-800",
        "hiring_season": "Sept 2026",
        "tags": ["Advanced Coding", "Aptitude", "Agile"],
        "requirements": "advanced coding aptitude quantitative reasoning verbal ability agile methodology java python sql software engineering fundamentals",
        "min_cgpa": 6.0, "min_dsa": 80, "min_aptitude": 65,
    },
    {
        "id": "c12", "name": "Infosys Power Programmer", "role": "Specialist Programmer",
        "tier": "IT Services Premium", "ctc": "Rs 9.0 LPA", "ctc_value": 9.0,
        "location": "Pan India", "logo_text": "IN", "logo_bg": "bg-cyan-700",
        "hiring_season": "Nov 2026",
        "tags": ["Coding", "Full Stack", "Cloud"],
        "requirements": "competitive coding full stack development java spring angular react cloud fundamentals sql problem solving design patterns",
        "min_cgpa": 6.5, "min_dsa": 100, "min_aptitude": 68,
    },
]


def job_by_id(job_id: str):
    for job in JOB_CORPUS:
        if job["id"] == job_id:
            return job
    return None
