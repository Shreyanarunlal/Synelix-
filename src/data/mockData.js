// src/data/mockData.js
// Centralized mock data and AI scoring algorithms for Synelix

export const INITIAL_STUDENT_PROFILE = {
  id: "STU-2026-089",
  name: "Arjun Karthik",
  email: "arjun.karthik@college.edu",
  phone: "+91 98765 43210",
  avatar: "AK",
  college: "National Institute of Technology",
  department: "Computer Science & Engineering",
  graduationYear: 2026,
  cgpa: 8.7,
  targetRole: "Full Stack Developer",
  dsaSolved: 345,
  aptitudeScore: 88,
  projectsCount: 4,
  internshipsMonths: 3,
  certificationsCount: 3,
  hackathonsWon: 2,
  skills: [
    { name: "Java", level: 90, category: "Languages" },
    { name: "Python", level: 85, category: "Languages" },
    { name: "React.js", level: 88, category: "Frontend" },
    { name: "Node.js", level: 82, category: "Backend" },
    { name: "Spring Boot", level: 78, category: "Backend" },
    { name: "PostgreSQL", level: 80, category: "Database" },
    { name: "Docker", level: 65, category: "DevOps" },
    { name: "Data Structures & Algorithms", level: 86, category: "Core CS" },
    { name: "System Design", level: 68, category: "Core CS" },
    { name: "Quantitative Aptitude", level: 84, category: "Aptitude" },
  ],
  verifiedProjects: [
    {
      title: "Synelix AI Career Portal",
      tech: "React, Tailwind, Node, Python",
      description: "AI-driven placement prediction & automated skill-gap analysis engine for universities.",
      stars: 42,
      liveUrl: "https://synelix.ai",
      verified: true,
    },
    {
      title: "Distributed Task Queue",
      tech: "Java, Spring Boot, Redis, RabbitMQ",
      description: "Asynchronous task scheduler handling 10k+ concurrent requests with fault tolerance.",
      stars: 28,
      verified: true,
    },
    {
      title: "Algorithmic Code Visualizer",
      tech: "TypeScript, Canvas API, Web Workers",
      description: "Interactive graph and dynamic programming algorithm visualizer.",
      stars: 64,
      verified: true,
    },
  ],
  certifications: [
    { name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", date: "Jan 2026" },
    { name: "Meta Front-End Developer Professional", issuer: "Coursera", date: "Nov 2025" },
    { name: "Algorithmic Toolbox Honors", issuer: "UC San Diego", date: "Aug 2025" },
  ],
  resumeATS: {
    score: 91,
    formatScore: 95,
    keywordScore: 88,
    impactScore: 90,
    skillsFound: ["Java", "Python", "React", "Spring Boot", "Docker", "SQL", "Git", "REST APIs"],
    missingKeywords: ["Microservices", "Kubernetes", "CI/CD Pipeline", "Unit Testing / JUnit"],
    recommendations: [
      "Quantify project impact with metrics (e.g., 'reduced latency by 35%').",
      "Add Docker and CI/CD actions under technical skills.",
      "Expand System Design section to highlight concurrency handling.",
    ],
  },
};

// AI Role Benchmarks for Skill Gap Analysis
export const ROLE_BENCHMARKS = {
  "Full Stack Developer": [
    { skill: "Frontend (React/Vue)", required: 85, studentCurrent: 88 },
    { skill: "Backend (Node/Spring)", required: 85, studentCurrent: 80 },
    { skill: "DSA & Problem Solving", required: 80, studentCurrent: 86 },
    { skill: "Database & SQL", required: 80, studentCurrent: 80 },
    { skill: "System Design", required: 75, studentCurrent: 68 },
    { skill: "DevOps & Cloud", required: 70, studentCurrent: 65 },
    { skill: "Aptitude & Reasoning", required: 75, studentCurrent: 84 },
  ],
  "SDE-1 (Product Tier 1)": [
    { skill: "DSA & Problem Solving", required: 95, studentCurrent: 86 },
    { skill: "Core CS (OS/DBMS/CN)", required: 90, studentCurrent: 82 },
    { skill: "System Design (LLD/HLD)", required: 85, studentCurrent: 68 },
    { skill: "Coding Speed & Accuracy", required: 90, studentCurrent: 85 },
    { skill: "Database & Concurrency", required: 85, studentCurrent: 80 },
    { skill: "Aptitude & Logic", required: 85, studentCurrent: 88 },
  ],
  "Data Scientist & AI Engineer": [
    { skill: "Python & Data Wrangling", required: 90, studentCurrent: 85 },
    { skill: "Machine Learning / Scikit", required: 85, studentCurrent: 70 },
    { skill: "Math & Statistics", required: 85, studentCurrent: 75 },
    { skill: "Deep Learning / PyTorch", required: 80, studentCurrent: 60 },
    { skill: "SQL & Data Warehousing", required: 80, studentCurrent: 80 },
    { skill: "Model Deployment & API", required: 75, studentCurrent: 72 },
  ],
  "Cloud & DevOps Engineer": [
    { skill: "Linux & Bash Scripting", required: 90, studentCurrent: 75 },
    { skill: "Cloud Platforms (AWS/GCP)", required: 85, studentCurrent: 70 },
    { skill: "Containerization (Docker)", required: 85, studentCurrent: 65 },
    { skill: "Kubernetes & Orchestration", required: 80, studentCurrent: 55 },
    { skill: "CI/CD & Infrastructure as Code", required: 80, studentCurrent: 60 },
    { skill: "Networking & Security", required: 75, studentCurrent: 70 },
  ],
};

// AI Placement Prediction Engine
export function calculatePlacementPrediction({
  cgpa = 8.7,
  dsaSolved = 345,
  aptitudeScore = 88,
  projectsCount = 4,
  internshipsMonths = 3,
  certificationsCount = 3,
}) {
  // Normalize factors into 0-100 scale
  const cgpaScore = Math.min(100, Math.max(0, (cgpa / 10) * 100));
  const dsaScore = Math.min(100, Math.max(0, (dsaSolved / 450) * 100));
  const aptScore = Math.min(100, Math.max(0, aptitudeScore));
  const projectScore = Math.min(100, Math.max(0, (projectsCount / 5) * 100));
  const internScore = Math.min(100, Math.max(0, (internshipsMonths / 6) * 100));
  const certScore = Math.min(100, Math.max(0, (certificationsCount / 4) * 100));

  // Weighted formula derived from industry recruitment statistics
  const rawProbability =
    cgpaScore * 0.18 +
    dsaScore * 0.32 +
    aptScore * 0.20 +
    projectScore * 0.15 +
    internScore * 0.10 +
    certScore * 0.05;

  const probability = Math.round(Math.min(99, Math.max(30, rawProbability)));

  let tier = "Service & Core (₹4.5 - ₹7.5 LPA)";
  let minCtc = 4.5;
  let maxCtc = 7.5;
  let tierLevel = "Tier 3 / Mid-tier";
  let badgeColor = "bg-blue-100 text-blue-800 border-blue-200";

  if (probability >= 90) {
    tier = "Tier-1 Global Tech (₹22 - ₹44 LPA)";
    minCtc = 22;
    maxCtc = 44;
    tierLevel = "Dream Tier-1";
    badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
  } else if (probability >= 78) {
    tier = "Product & High-Growth Unicorns (₹12 - ₹22 LPA)";
    minCtc = 12;
    maxCtc = 22;
    tierLevel = "Product Tier-2";
    badgeColor = "bg-purple-100 text-purple-800 border-purple-200";
  } else if (probability >= 65) {
    tier = "IT Product & Fintech (₹7.5 - ₹12 LPA)";
    minCtc = 7.5;
    maxCtc = 12;
    tierLevel = "Core Product";
    badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
  }

  // Key factors insights
  const factorInsights = [
    {
      factor: "Coding & DSA",
      weight: "32%",
      score: Math.round(dsaScore),
      status: dsaScore >= 80 ? "Excellent" : dsaScore >= 60 ? "Good" : "Needs Focus",
    },
    {
      factor: "Aptitude & Logic",
      weight: "20%",
      score: Math.round(aptScore),
      status: aptScore >= 80 ? "Excellent" : aptScore >= 65 ? "Average" : "At Risk",
    },
    {
      factor: "Academic CGPA",
      weight: "18%",
      score: Math.round(cgpaScore),
      status: cgpaScore >= 80 ? "Eligible for 98% Companies" : "Standard Cutoff Met",
    },
    {
      factor: "Projects & Proof of Work",
      weight: "15%",
      score: Math.round(projectScore),
      status: projectScore >= 75 ? "Strong Portfolio" : "Add Live Hosted Apps",
    },
    {
      factor: "Internship Experience",
      weight: "10%",
      score: Math.round(internScore),
      status: internScore > 0 ? `${internshipsMonths} Months Verified` : "No Formal Internship Yet",
    },
  ];

  return {
    probability,
    tier,
    tierLevel,
    minCtc,
    maxCtc,
    badgeColor,
    factorInsights,
  };
}

// Personalized Learning Roadmap
export const DEFAULT_ROADMAP = [
  {
    week: "Week 1 - 2",
    phase: "Foundation & Core DSA",
    status: "completed",
    tasks: [
      { id: "t1", title: "Master Array & Two-Pointer Patterns (25 LeetCode Mediums)", done: true },
      { id: "t2", title: "HashMaps, Sliding Window & Prefix Sums", done: true },
      { id: "t3", title: "Quantitative Aptitude: Time & Work, Speed & Distance", done: true },
    ],
    badge: "100% Done",
  },
  {
    week: "Week 3 - 4",
    phase: "Advanced Trees, Graphs & Dynamic Programming",
    status: "in-progress",
    tasks: [
      { id: "t4", title: "Binary Trees & BST Traversals, Lowest Common Ancestor", done: true },
      { id: "t5", title: "Graph BFS / DFS & Dijkstra's Algorithm", done: true },
      { id: "t6", title: "Dynamic Programming: Knapsack & 1D/2D Subsequence patterns", done: false },
      { id: "t7", title: "Aptitude: Syllogisms, Critical Reasoning & Puzzles", done: false },
    ],
    badge: "50% Done",
  },
  {
    week: "Week 5 - 6",
    phase: "System Design & Architecture Proof of Work",
    status: "upcoming",
    tasks: [
      { id: "t8", title: "Low-Level Design: Object-Oriented Principles (SOLID) & Design Patterns", done: false },
      { id: "t9", title: "High-Level Design: Caching, Database Sharding & Load Balancing", done: false },
      { id: "t10", title: "Deploy capstone Full-Stack project on AWS with Docker & CI/CD", done: false },
    ],
    badge: "Upcoming",
  },
  {
    week: "Week 7 - 8",
    phase: "Mock Interviews & ATS Optimization",
    status: "upcoming",
    tasks: [
      { id: "t11", title: "AI Behavioral & HR Interview Simulator (STAR method)", done: false },
      { id: "t12", title: "2 Full-length Timed Company Placement Mock Tests", done: false },
      { id: "t13", title: "Final ATS Resume Audit & One-click Recruiter Showcase", done: false },
    ],
    badge: "Upcoming",
  },
];

// Matched Companies
export const MATCHED_COMPANIES = [
  {
    id: "c1",
    name: "Google",
    role: "Software Engineer (University Grad)",
    tier: "Tier-1 Global",
    matchScore: 92,
    ctc: "₹38.5 LPA",
    location: "Bengaluru / Hyderabad",
    logoText: "G",
    logoBg: "bg-red-500",
    hiringSeason: "Aug - Oct 2026",
    status: "Eligible & Recommended",
    tags: ["DSA Mastery", "System Design", "Algorithms"],
    requirements: "CGPA 8.0+, 300+ DSA problems, 2+ Full Stack projects",
  },
  {
    id: "c2",
    name: "Microsoft",
    role: "Software Engineering Intern / FTE",
    tier: "Tier-1 Global",
    matchScore: 94,
    ctc: "₹42.0 LPA",
    location: "Hyderabad / Noida",
    logoText: "MS",
    logoBg: "bg-blue-600",
    hiringSeason: "July - Sept 2026",
    status: "High Probability Match",
    tags: ["Data Structures", "OOP", "Azure"],
    requirements: "CGPA 8.0+, Strong problem solving, Object-oriented design",
  },
  {
    id: "c3",
    name: "Amazon",
    role: "SDE-1",
    tier: "Tier-1 Global",
    matchScore: 89,
    ctc: "₹34.0 LPA",
    location: "Bengaluru / Chennai",
    logoText: "AZ",
    logoBg: "bg-amber-600",
    hiringSeason: "Aug - Nov 2026",
    status: "Ready for Mock Round",
    tags: ["Leadership Principles", "DSA", "Distributed Systems"],
    requirements: "Proficiency in Java/C++, 14 Leadership Principles mastery",
  },
  {
    id: "c4",
    name: "Goldman Sachs",
    role: "Analyst - Engineering",
    tier: "Fintech Tier-1",
    matchScore: 88,
    ctc: "₹28.0 LPA",
    location: "Bengaluru",
    logoText: "GS",
    logoBg: "bg-sky-700",
    hiringSeason: "Aug - Sept 2026",
    status: "Eligible",
    tags: ["Math / Probability", "DSA", "Databases"],
    requirements: "Strong quantitative aptitude, CS fundamentals, fast coding",
  },
  {
    id: "c5",
    name: "Swiggy / Zomato",
    role: "Backend Engineer (SDE-1)",
    tier: "Unicorn",
    matchScore: 95,
    ctc: "₹22.0 LPA",
    location: "Remote / Bengaluru",
    logoText: "SZ",
    logoBg: "bg-orange-500",
    hiringSeason: "Immediate",
    status: "Direct Shortlist Ready",
    tags: ["Node.js", "Redis", "Kafka", "Microservices"],
    requirements: "Proven backend projects, concurrency understanding",
  },
  {
    id: "c6",
    name: "TCS Digital",
    role: "System Engineer / Digital Specialist",
    tier: "Tier-2 Product / Digital",
    matchScore: 98,
    ctc: "₹9.5 LPA",
    location: "Pan India",
    logoText: "TCS",
    logoBg: "bg-slate-800",
    hiringSeason: "Sept 2026",
    status: "Guaranteed Clear",
    tags: ["Advanced Coding", "Aptitude", "Agile"],
    requirements: "Digital assessment test clearance, no backlogs",
  },
];

// Recruiter Talent Pool Mock Data
export const CANDIDATES_POOL = [
  {
    id: "STU-001",
    name: "Arjun Karthik",
    email: "arjun.karthik@college.edu",
    college: "NIT Trichy",
    department: "Computer Science",
    cgpa: 8.7,
    aiScore: 94,
    dsaSolved: 345,
    aptitude: 92,
    topSkills: ["Java", "React", "Spring Boot", "Docker", "DSA"],
    status: "Shortlisted",
    roleMatch: "Full Stack / SDE-1",
    tier: "Tier-1 Product",
    location: "Bengaluru",
    resumeLink: "#",
    github: "github.com/shriarjun",
    shortlisted: true,
  },
  {
    id: "STU-002",
    name: "Priya Menon",
    email: "priya.m@college.edu",
    college: "IIT Madras",
    department: "AI & Data Science",
    cgpa: 9.3,
    aiScore: 96,
    dsaSolved: 420,
    aptitude: 95,
    topSkills: ["Python", "PyTorch", "NLP", "FastAPI", "SQL"],
    status: "Interview Scheduled",
    roleMatch: "AI / ML Engineer",
    tier: "Tier-1 Product",
    location: "Chennai",
    resumeLink: "#",
    github: "github.com/priyam",
    shortlisted: true,
  },
  {
    id: "STU-003",
    name: "Rahul Sharma",
    email: "rahul.s@college.edu",
    college: "BITS Pilani",
    department: "Information Technology",
    cgpa: 8.1,
    aiScore: 86,
    dsaSolved: 280,
    aptitude: 84,
    topSkills: ["Golang", "Kubernetes", "AWS", "Docker", "DevOps"],
    status: "Available",
    roleMatch: "Cloud / DevOps",
    tier: "Tier-2 Product",
    location: "Hyderabad",
    resumeLink: "#",
    github: "github.com/rahuls",
    shortlisted: false,
  },
  {
    id: "STU-004",
    name: "Anjali Rao",
    email: "anjali.r@college.edu",
    college: "Anna University",
    department: "Electronics & Comm",
    cgpa: 8.9,
    aiScore: 91,
    dsaSolved: 310,
    aptitude: 94,
    topSkills: ["C++", "Embedded Systems", "DSA", "IoT", "Linux"],
    status: "Available",
    roleMatch: "Firmware / Systems SDE",
    tier: "Tier-1 Product",
    location: "Bengaluru",
    resumeLink: "#",
    github: "github.com/anjalir",
    shortlisted: false,
  },
  {
    id: "STU-005",
    name: "Karan Verma",
    email: "karan.v@college.edu",
    college: "Vellore Institute of Tech",
    department: "Computer Science",
    cgpa: 7.9,
    aiScore: 82,
    dsaSolved: 210,
    aptitude: 80,
    topSkills: ["JavaScript", "React", "Node.js", "MongoDB", "Express"],
    status: "Available",
    roleMatch: "Frontend Engineer",
    tier: "High-Growth Startup",
    location: "Pune",
    resumeLink: "#",
    github: "github.com/karanv",
    shortlisted: false,
  },
  {
    id: "STU-006",
    name: "Sneha Patel",
    email: "sneha.p@college.edu",
    college: "PSG Tech",
    department: "Computer Science",
    cgpa: 9.1,
    aiScore: 93,
    dsaSolved: 390,
    aptitude: 89,
    topSkills: ["Java", "Distributed Systems", "PostgreSQL", "Kafka"],
    status: "Shortlisted",
    roleMatch: "Backend Engineer",
    tier: "Tier-1 Product",
    location: "Bengaluru",
    resumeLink: "#",
    github: "github.com/snehap",
    shortlisted: true,
  },
  {
    id: "STU-007",
    name: "Vikram Sundaram",
    email: "vikram.s@college.edu",
    college: "NIT Trichy",
    department: "Electrical Engineering",
    cgpa: 7.6,
    aiScore: 78,
    dsaSolved: 180,
    aptitude: 86,
    topSkills: ["Python", "SQL", "Tableau", "PowerBI", "Analytics"],
    status: "Available",
    roleMatch: "Data Analyst",
    tier: "IT Services / Consulting",
    location: "Mumbai",
    resumeLink: "#",
    github: "github.com/vikrams",
    shortlisted: false,
  },
];

// Institutional Department Statistics
export const INSTITUTION_DEPARTMENTS = [
  { name: "Computer Science", totalStudents: 740, placed: 695, rate: "93.9%", avgPackage: "₹14.2 LPA", aiReadiness: 94 },
  { name: "AI & Data Science", totalStudents: 380, placed: 352, rate: "92.6%", avgPackage: "₹15.8 LPA", aiReadiness: 96 },
  { name: "Information Tech", totalStudents: 490, placed: 440, rate: "89.8%", avgPackage: "₹11.5 LPA", aiReadiness: 88 },
  { name: "Electronics & Comm", totalStudents: 520, placed: 445, rate: "85.5%", avgPackage: "₹9.2 LPA", aiReadiness: 84 },
  { name: "Mechanical Eng.", totalStudents: 328, placed: 242, rate: "73.7%", avgPackage: "₹6.8 LPA", aiReadiness: 76 },
];

// Upcoming Campus Drives
export const UPCOMING_DRIVES = [
  { company: "Google", date: "12 Oct 2026", role: "Software Engineer", package: "₹38 LPA", eligibleCount: 214, status: "Registrations Open" },
  { company: "Microsoft", date: "18 Oct 2026", role: "Product Engineer", package: "₹42 LPA", eligibleCount: 186, status: "Shortlisting" },
  { company: "Amazon", date: "24 Oct 2026", role: "Backend Developer", package: "₹34 LPA", eligibleCount: 290, status: "Test Scheduled" },
  { company: "Goldman Sachs", date: "02 Nov 2026", role: "Analyst", package: "₹28 LPA", eligibleCount: 175, status: "Upcoming" },
  { company: "TCS Digital", date: "10 Nov 2026", role: "Digital Engineer", package: "₹9.5 LPA", eligibleCount: 650, status: "Upcoming" },
];
