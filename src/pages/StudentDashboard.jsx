// src/pages/StudentDashboard.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import StatCard from "../components/dashboard/StatCard";
import { useApiResource } from "../hooks/useApiResource";
import { predictionApi, roadmapApi, studentApi } from "../services/api";
import {
  Brain,
  Sparkles,
  BookOpen,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  FileText,
  Building2,
  Sliders,
  RefreshCw,
  ChevronRight,
  Compass,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from "recharts";

/** Target roles the ML service has benchmarks for. */
const TARGET_ROLES = [
  "Full Stack Developer",
  "SDE-1 (Product Tier 1)",
  "Data Scientist & AI Engineer",
  "Cloud & DevOps Engineer",
];

/** Neutral prediction shown until the model responds. */
const PENDING_PREDICTION = {
  probability: 0,
  tier: "Calculating...",
  tierLevel: "Calculating",
  minCtc: 0,
  maxCtc: 0,
  badgeColor: "bg-slate-100 text-slate-600 border-slate-200",
  factorInsights: [],
  whatIf: [],
  recommendations: "",
  modelSource: null,
};

/** Rendered while the profile request is in flight, so the layout never jumps. */
const EMPTY_PROFILE = {
  name: "",
  email: "",
  college: "",
  department: "",
  graduationYear: "",
  cgpa: 0,
  dsaSolved: 0,
  aptitudeScore: 0,
  projectsCount: 0,
  internshipsMonths: 0,
  certificationsCount: 0,
  targetRole: "Full Stack Developer",
  placementProbability: 0,
  skills: [],
};

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // --- profile -----------------------------------------------------------
  const { data: profile, error: profileError } = useApiResource(
    () => studentApi.getProfile(),
    [],
    { initialData: EMPTY_PROFILE }
  );

  const profileReady = Boolean(profile && profile.email);

  // --- predictor ---------------------------------------------------------
  // The sliders default to the student own record and only hold an override
  // once they actually move one. Deriving rather than copying into state via
  // an effect means the panel is never briefly null, and "Reset to Profile"
  // is just clearing the override.
  const profileParams = useMemo(
    () => ({
      cgpa: profile?.cgpa ?? 0,
      dsaSolved: profile?.dsaSolved ?? 0,
      aptitudeScore: profile?.aptitudeScore ?? 0,
      projectsCount: profile?.projectsCount ?? 0,
      internshipsMonths: profile?.internshipsMonths ?? 0,
      certificationsCount: profile?.certificationsCount ?? 0,
    }),
    [profile]
  );

  const [predictorOverride, setPredictorOverride] = useState(null);
  const predictorState = predictorOverride ?? profileParams;
  const setPredictorState = setPredictorOverride;

  const [predictionData, setPredictionData] = useState(null);
  const [predicting, setPredicting] = useState(false);

  // Neutral placeholder so the layout renders before the first score.
  const prediction = predictionData ?? PENDING_PREDICTION;

  // Every slider move re-scores against the trained model. Debounced, so
  // dragging does not fire one request per pixel.
  useEffect(() => {
    if (!profileReady) return undefined;

    const timer = setTimeout(() => {
      setPredicting(true);
      predictionApi
        .evaluate(predictorState)
        .then(setPredictionData)
        .catch(() => {
          /* keep the last good score; the banner reports the outage */
        })
        .finally(() => setPredicting(false));
    }, 350);

    return () => clearTimeout(timer);
  }, [predictorState, profileReady]);

  // --- skill gap ---------------------------------------------------------
  // Same pattern: the profile supplies the default, the dropdown supplies an
  // override, so no effect has to copy one into the other.
  const [roleOverride, setRoleOverride] = useState(null);
  const targetRole =
    roleOverride ?? profile?.targetRole ?? "Full Stack Developer";
  const setTargetRole = setRoleOverride;

  const { data: skillGap } = useApiResource(
    () => studentApi.getSkillGap(targetRole),
    [targetRole],
    { skip: !profileReady }
  );

  const skillGapData = useMemo(
    () => (skillGap && skillGap.benchmarks) || [],
    [skillGap]
  );

  // --- roadmap -----------------------------------------------------------
  const { data: roadmapData, setData: setRoadmapData } = useApiResource(
    () => roadmapApi.getRoadmap(targetRole),
    [targetRole],
    { skip: !profileReady }
  );

  const roadmap = useMemo(
    () => (roadmapData && roadmapData.phases) || [],
    [roadmapData]
  );

  // The overview panel shows whichever phase is in progress, falling back to
  // the first incomplete one, rather than a fixed index.
  const currentPhaseIndex = useMemo(() => {
    if (roadmap.length === 0) return -1;
    const inProgress = roadmap.findIndex((p) => p.status === "in-progress");
    if (inProgress !== -1) return inProgress;
    const upcoming = roadmap.findIndex((p) => p.status !== "completed");
    return upcoming !== -1 ? upcoming : 0;
  }, [roadmap]);

  const currentPhase = currentPhaseIndex >= 0 ? roadmap[currentPhaseIndex] : null;

  const handleToggleTask = useCallback(
    (phaseIndex, taskId) => {
      const current = roadmapData?.phases?.[phaseIndex]?.tasks?.find(
        (t) => t.id === taskId
      );
      const nextDone = !(current?.done ?? false);

      // Flip locally first, then persist: a checklist is the one place where
      // waiting on a round trip reads as broken.
      setRoadmapData((prev) => {
        if (!prev?.phases) return prev;
        const phases = prev.phases.map((phase, index) => {
          if (index !== phaseIndex) return phase;
          const tasks = phase.tasks.map((task) =>
            task.id === taskId ? { ...task, done: nextDone } : task
          );
          const doneCount = tasks.filter((t) => t.done).length;
          const percent = Math.round((doneCount / tasks.length) * 100);
          return {
            ...phase,
            tasks,
            badge: percent === 100 ? "100% Done" : percent + "% Done",
            status:
              percent === 100
                ? "completed"
                : doneCount > 0
                ? "in-progress"
                : "upcoming",
          };
        });
        return { ...prev, phases };
      });

      roadmapApi.toggleTask(taskId, nextDone).catch(() => {
        /* stays optimistic; the next load reconciles from the server */
      });
    },
    [roadmapData, setRoadmapData]
  );

  // --- resume ------------------------------------------------------------
  const [isScanningResume, setIsScanningResume] = useState(false);
  const [scanCompleteMessage, setScanCompleteMessage] = useState("");
  const [resumeAnalysis, setResumeAnalysis] = useState(null);
  const [resumeText, setResumeText] = useState("");

  const handleSimulateResumeScan = useCallback(() => {
    setIsScanningResume(true);
    setScanCompleteMessage("");

    studentApi
      .analyzeResume(resumeText, "resume.pdf", targetRole)
      .then((result) => {
        setResumeAnalysis(result);
        setScanCompleteMessage(
          result.analysed
            ? "ATS analysis complete: " +
                result.overallScore +
                "/100 overall, " +
                result.keywordScore +
                "% keyword coverage for " +
                result.targetRole +
                "."
            : result.message
        );
      })
      .catch((err) => setScanCompleteMessage(err.message))
      .finally(() => setIsScanningResume(false));
  }, [resumeText, targetRole]);

  // --- matched companies -------------------------------------------------
  const { data: matchedCompanies } = useApiResource(
    () => studentApi.getMatchedCompanies(8),
    [],
    { initialData: [], skip: !profileReady }
  );

  const [appliedCompanies, setAppliedCompanies] = useState({});

  const handleApplyCompany = (companyId) => {
    setAppliedCompanies((prev) => ({
      ...prev,
      [companyId]: true,
    }));
  };

  return (
    <DashboardLayout
      role="student"
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {profileError && (
        <div className="mb-6 flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-bold text-amber-900">
              Could not load your profile
            </p>
            <p className="mt-1 text-xs font-medium text-amber-800">
              {profileError.message}
            </p>
          </div>
        </div>
      )}

      {/* Top Banner Greeting */}
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                Verified Student Profile
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">
                {profile.college}
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
              Welcome back, {profile.name} 👋
            </h1>

            <p className="mt-2 text-slate-600">
              Department of {profile.department} • Class of {profile.graduationYear}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-3 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Placement Probability
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <span className="text-3xl font-black text-slate-900">
                  {prediction.probability}%
                </span>
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            <button
              onClick={() => setActiveTab("predictor")}
              className="flex items-center gap-2 rounded-2xl bg-black px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 hover:scale-105"
            >
              <Sliders size={18} className="text-blue-400" />
              <span>Simulate Predictor</span>
            </button>
          </div>
        </div>

        {/* Tab Quick Selector Pills */}
        <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
          {[
            { id: "overview", label: "Readiness Overview" },
            { id: "predictor", label: "AI Placement Predictor" },
            { id: "skill-gap", label: "Skill-Gap Analysis" },
            { id: "roadmap", label: "Personalized Roadmap" },
            { id: "resume-ats", label: "AI Resume & ATS" },
            { id: "companies", label: "Matched Companies" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === tab.id
                  ? "bg-black text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Top KPI Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="AI Placement Readiness"
              value={`${prediction.probability}%`}
              subtitle={prediction.tierLevel}
              icon={Brain}
            />
            <StatCard
              title="Projected CTC Band"
              value={`₹${prediction.minCtc} - ₹${prediction.maxCtc} LPA`}
              subtitle={prediction.tier}
              icon={Briefcase}
            />
            <StatCard
              title="DSA Questions Solved"
              value={predictorState.dsaSolved}
              subtitle={
                predictorState.dsaSolved >= 300
                  ? "Clears Tier-1 cut-offs"
                  : `${Math.max(0, 300 - predictorState.dsaSolved)} short of Tier-1 cut-offs`
              }
              icon={BookOpen}
            />
            <StatCard
              title="ATS Resume Score"
              value={
                resumeAnalysis && resumeAnalysis.analysed
                  ? `${resumeAnalysis.overallScore} / 100`
                  : "Not scanned"
              }
              subtitle={
                resumeAnalysis && resumeAnalysis.analysed
                  ? `${resumeAnalysis.keywordScore}% keyword coverage`
                  : "Run the ATS scan to get a score"
              }
              icon={FileText}
            />
          </div>

          {/* Highlights & AI Action Card */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* AI Insights Card */}
            <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl lg:col-span-2">
              <div className="flex items-center gap-3 text-blue-400">
                <Sparkles size={24} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  AI Placement Recommendation
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-black text-white md:text-3xl">
                You qualify for {prediction.tierLevel} Campus Drives
              </h2>

              <p className="mt-3 text-slate-300 leading-relaxed">
                With a CGPA of {predictorState.cgpa} and {predictorState.dsaSolved} DSA problems solved, you are well above the average cutoff for top hiring drives like <strong>Microsoft</strong>, <strong>Google</strong>, and <strong>Swiggy</strong>.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs">
                  <span className="text-xs text-slate-400">Critical Next Focus</span>
                  <p className="mt-1 font-bold text-white">System Design (LLD)</p>
                  <p className="text-xs text-slate-400">Current: 68% (Target: 75%)</p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs">
                  <span className="text-xs text-slate-400">Top Matched Role</span>
                  <p className="mt-1 font-bold text-white">{targetRole}</p>
                  <p className="text-xs text-slate-400">92% Compatibility</p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs">
                  <span className="text-xs text-slate-400">Next Upcoming Drive</span>
                  <p className="mt-1 font-bold text-white">Google SWE</p>
                  <p className="text-xs text-slate-400">Oct 12 • ₹38.5 LPA</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={() => setActiveTab("skill-gap")}
                  className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:scale-105"
                >
                  <span>View Skill Gap Radar</span>
                  <ArrowUpRight size={16} />
                </button>
                <button
                  onClick={() => setActiveTab("roadmap")}
                  className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Continue Roadmap (Week 3)
                </button>
              </div>
            </div>

            {/* Target Tier Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Target Tier Fit
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold border ${prediction.badgeColor}`}>
                    {prediction.tierLevel}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  {prediction.tier}
                </h3>

                <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                  Based on machine learning models trained on 15,000+ campus hiring records across Tier-1 institutions.
                </p>

                <div className="mt-6 space-y-3">
                  {prediction.factorInsights.slice(0, 3).map((f) => (
                    <div key={f.factor} className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                      <span className="font-medium text-slate-700">{f.factor}</span>
                      <span className="font-bold text-slate-900">{f.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab("companies")}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3.5 text-xs font-bold text-slate-900 transition hover:bg-slate-200"
              >
                <span>Explore 6 Matched Companies</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Quick Skill Overview & Active Roadmap Milestone */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Top Verified Skills */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Technical Skill Proficiency</h3>
                  <p className="text-xs text-slate-500">Verified via assessments & code repository scans</p>
                </div>
                <button
                  onClick={() => setActiveTab("skill-gap")}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Analyze Gaps →
                </button>
              </div>

              <div className="space-y-4">
                {(profile.skills || []).slice(0, 5).map((s) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-700">{s.name}</span>
                      <span className="text-slate-900">{s.level}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-black transition-all duration-500"
                        style={{ width: `${s.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Roadmap Progress */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Active Learning Roadmap</h3>
                  <p className="text-xs text-slate-500">
                    {currentPhase
                      ? `${currentPhase.week} • ${currentPhase.phase}`
                      : "Building your plan..."}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("roadmap")}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Full Roadmap →
                </button>
              </div>

              <div className="space-y-3">
                {(currentPhase?.tasks || []).map((task) => (
                  <label
                    key={task.id}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-xs font-medium cursor-pointer transition ${
                      task.done
                        ? "border-emerald-200 bg-emerald-50/50 text-slate-800"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => handleToggleTask(currentPhaseIndex, task.id)}
                      className="mt-0.5 h-4 w-4 rounded accent-black"
                    />
                    <span className={task.done ? "line-through text-slate-400" : ""}>
                      {task.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: AI PLACEMENT PREDICTOR */}
      {activeTab === "predictor" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Section Header */}
          <div className="rounded-3xl bg-slate-900 p-8 text-white">
            <div className="flex items-center gap-3 text-blue-400">
              <Brain size={28} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Interactive Machine Learning Engine
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-black text-white">
              AI Placement Probability Predictor
            </h2>
            <p className="mt-2 text-slate-300 max-w-3xl leading-relaxed text-sm">
              Adjust your academic metrics, problem-solving count, aptitude rating, and projects below. The Synelix neural model dynamically computes your likelihood of clearing Tier-1, Tier-2, or Service placement drives.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Interactive Parameter Controls (2 Cols) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-bold text-lg text-slate-900">Adjust Simulation Parameters</h3>
                <button
                  onClick={() =>
                    setPredictorOverride(null)
                  }
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-black"
                >
                  <RefreshCw size={14} />
                  <span>Reset to Profile</span>
                </button>
              </div>

              {/* Slider 1: CGPA */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-800">
                    Academic CGPA (Out of 10)
                  </span>
                  <span className="rounded-lg bg-black px-2.5 py-1 text-xs font-bold text-white">
                    {predictorState.cgpa.toFixed(1)} / 10.0
                  </span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="10.0"
                  step="0.1"
                  value={predictorState.cgpa}
                  onChange={(e) =>
                    setPredictorState({ ...predictorState, cgpa: parseFloat(e.target.value) })
                  }
                  className="w-full accent-black cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>5.0 (Minimum Pass)</span>
                  <span>7.5 (Standard Cutoff)</span>
                  <span>10.0 (Gold Medalist)</span>
                </div>
              </div>

              {/* Slider 2: DSA Solved */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-800">
                    Coding & DSA Problems Solved (LeetCode / GFG)
                  </span>
                  <span className="rounded-lg bg-black px-2.5 py-1 text-xs font-bold text-white">
                    {predictorState.dsaSolved} Problems
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="600"
                  step="10"
                  value={predictorState.dsaSolved}
                  onChange={(e) =>
                    setPredictorState({ ...predictorState, dsaSolved: parseInt(e.target.value) })
                  }
                  className="w-full accent-black cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>0 (Beginner)</span>
                  <span>250 (Mid-level)</span>
                  <span>450+ (Tier-1 Product Ready)</span>
                </div>
              </div>

              {/* Slider 3: Aptitude Score */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-800">
                    Aptitude & Logical Assessment Score (%)
                  </span>
                  <span className="rounded-lg bg-black px-2.5 py-1 text-xs font-bold text-white">
                    {predictorState.aptitudeScore}%
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="1"
                  value={predictorState.aptitudeScore}
                  onChange={(e) =>
                    setPredictorState({ ...predictorState, aptitudeScore: parseInt(e.target.value) })
                  }
                  className="w-full accent-black cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>40% (Fail)</span>
                  <span>75% (Eligible)</span>
                  <span>95%+ (Top 1% Percentile)</span>
                </div>
              </div>

              {/* Row: Projects, Internships, Certifications */}
              <div className="grid gap-6 sm:grid-cols-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Verified Projects
                  </label>
                  <select
                    value={predictorState.projectsCount}
                    onChange={(e) =>
                      setPredictorState({
                        ...predictorState,
                        projectsCount: parseInt(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 outline-none focus:border-black"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} Major Projects
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Internship Experience
                  </label>
                  <select
                    value={predictorState.internshipsMonths}
                    onChange={(e) =>
                      setPredictorState({
                        ...predictorState,
                        internshipsMonths: parseInt(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 outline-none focus:border-black"
                  >
                    {[0, 2, 3, 6, 12].map((m) => (
                      <option key={m} value={m}>
                        {m === 0 ? "No Internship" : `${m} Months`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Cloud / Tech Certs
                  </label>
                  <select
                    value={predictorState.certificationsCount}
                    onChange={(e) =>
                      setPredictorState({
                        ...predictorState,
                        certificationsCount: parseInt(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 outline-none focus:border-black"
                  >
                    {[0, 1, 2, 3, 4, 5].map((c) => (
                      <option key={c} value={c}>
                        {c} Certifications
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Real-time Dynamic AI Prediction Output Gauge */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-8 shadow-md">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Predicted Placement Probability
                </span>

                <div className="mt-6 text-center">
                  <motion.div
                    key={prediction.probability}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-block"
                  >
                    <div className="text-7xl font-black text-slate-900">
                      {prediction.probability}%
                    </div>
                  </motion.div>

                  <div className="mt-3">
                    <span
                      className={`inline-block rounded-full px-4 py-1.5 text-xs font-bold border ${prediction.badgeColor}`}
                    >
                      {prediction.tierLevel}
                    </span>
                  </div>

                  <p className="mt-4 font-bold text-slate-800 text-sm">
                    {prediction.tier}
                  </p>

                  {/* Say which scorer produced this, so a fallback score is
                      never mistaken for a model score. */}
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {predicting ? (
                      <>
                        <RefreshCw size={11} className="animate-spin" />
                        <span>Recalculating</span>
                      </>
                    ) : prediction.modelSource === "synelix-ml" ? (
                      <>
                        <Brain size={11} />
                        <span>Scored by trained model</span>
                      </>
                    ) : prediction.modelSource ? (
                      <>
                        <AlertCircle size={11} className="text-amber-500" />
                        <span className="text-amber-600">
                          Fallback scorer - ML service offline
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Projected Salary:</span>
                    <span className="font-bold text-slate-900">
                      ₹{prediction.minCtc} - ₹{prediction.maxCtc} LPA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tier-1 Eligibility:</span>
                    <span className={`font-bold ${prediction.probability >= 80 ? "text-emerald-600" : "text-amber-600"}`}>
                      {prediction.probability >= 80 ? "High (94%)" : "Moderate (45%)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recruiter Filter Clearance:</span>
                    <span className="font-bold text-slate-900">Instant</span>
                  </div>
                </div>
              </div>

              {/* What-If Simulation Tip */}
              <div className="mt-8 rounded-2xl bg-blue-50 border border-blue-100 p-4 text-xs text-blue-900">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" />
                  AI Optimization Insight:
                </p>
                <p className="text-slate-700 leading-snug">
                  {predictorState.dsaSolved < 400
                    ? `Solving 55 more DSA problems can raise your probability by ~6% and push you into Google/Amazon cutoffs.`
                    : `Your DSA count is stellar. Focus on low-level system design and AWS containerization to secure the top salary tier.`}
                </p>
              </div>
            </div>
          </div>

          {/* Factor Breakdown Detailed Analysis */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
            <h3 className="font-bold text-xl text-slate-900 mb-2">
              Model Factor Weightage Breakdown
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              How the Synelix ML Model weighs each attribute during recruiter evaluation
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {prediction.factorInsights.map((factor) => (
                <div
                  key={factor.factor}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:shadow-xs"
                >
                  <div className="flex justify-between text-xs text-slate-400 font-semibold mb-2">
                    <span>{factor.weight} Weight</span>
                    <span>{factor.score}/100</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{factor.factor}</h4>
                  <p className="mt-2 text-xs font-semibold text-slate-600">{factor.status}</p>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200">
                    <div
                      className="h-1.5 rounded-full bg-black"
                      style={{ width: `${factor.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 3: SKILL-GAP ANALYSIS */}
      {activeTab === "skill-gap" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header & Role Selector */}
          <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xs md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Industry Alignment
              </span>
              <h2 className="mt-2 text-3xl font-black text-slate-900">
                Skill-Gap Radar & Industry Benchmark
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Compare your current skill levels against real hiring requirements for your target job role.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Target Role:
              </span>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-black"
              >
                {TARGET_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12">
            {/* Radar Chart (7 cols) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs lg:col-span-7">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    Skill Competency Radar
                  </h3>
                  <p className="text-xs text-slate-500">
                    Blue = Required by Employers | Black = Your Current Rating
                  </p>
                </div>
              </div>

              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={skillGapData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Required Benchmark"
                      dataKey="required"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.25}
                    />
                    <Radar
                      name="Your Current Rating"
                      dataKey="studentCurrent"
                      stroke="#000000"
                      fill="#000000"
                      fillOpacity={0.45}
                    />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gap Breakdown List (5 cols) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs lg:col-span-5 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Deficit & Priority Matrix
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  Recommended interventions for {targetRole}
                </p>

                <div className="space-y-3.5">
                  {skillGapData.map((item) => {
                    const gap = item.studentCurrent - item.required;
                    const isDeficit = gap < 0;
                    return (
                      <div
                        key={item.skill}
                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{item.skill}</p>
                          <p className="text-[11px] text-slate-500">
                            Current: {item.studentCurrent}% | Target: {item.required}%
                          </p>
                        </div>

                        <div className="text-right">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              isDeficit
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isDeficit ? `${gap}% Gap` : `+${gap}% Ahead`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <button
                  onClick={() => setActiveTab("roadmap")}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-3.5 text-xs font-bold text-white transition hover:scale-105"
                >
                  <Sparkles size={14} className="text-blue-400" />
                  <span>Generate AI Roadmap for {targetRole}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 4: PERSONALIZED LEARNING ROADMAP */}
      {activeTab === "roadmap" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="rounded-3xl bg-slate-900 p-8 text-white">
            <div className="flex items-center gap-2 text-blue-400">
              <Compass size={24} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Tailored 8-Week Path
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-black text-white">
              Personalized Placement Readiness Roadmap
            </h2>
            <p className="mt-2 text-slate-300 text-sm max-w-2xl leading-relaxed">
              Curated based on your gap analysis for <strong>{targetRole}</strong>. Completing milestones updates your verified profile score visible to hiring recruiters.
            </p>
          </div>

          <div className="space-y-6">
            {roadmap.map((phase, pIdx) => (
              <div
                key={phase.week}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-black px-3.5 py-1.5 text-xs font-bold text-white">
                      {phase.week}
                    </span>
                    <h3 className="font-bold text-lg text-slate-900">{phase.phase}</h3>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      phase.status === "completed"
                        ? "bg-emerald-100 text-emerald-800"
                        : phase.status === "in-progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {phase.badge}
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {phase.tasks.map((task) => (
                    <label
                      key={task.id}
                      className={`flex items-start gap-4 rounded-2xl border p-4 text-xs font-medium cursor-pointer transition ${
                        task.done
                          ? "border-emerald-200 bg-emerald-50/40 text-slate-800"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => handleToggleTask(pIdx, task.id)}
                        className="mt-0.5 h-4 w-4 rounded accent-black"
                      />
                      <div className="flex-1">
                        <span className={task.done ? "line-through text-slate-400 font-normal" : "font-semibold"}>
                          {task.title}
                        </span>
                      </div>
                      {task.done && (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Completed
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* TAB 5: AI RESUME & ATS SCANNER */}
      {activeTab === "resume-ats" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xs md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Automated Applicant Tracking System (ATS)
              </span>
              <h2 className="mt-2 text-3xl font-black text-slate-900">
                AI Resume Intelligence & Parser
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Synelix inspects your resume format, keyword density, and action impact to guarantee ATS clearance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSimulateResumeScan}
                disabled={isScanningResume}
                className="flex items-center gap-2 rounded-2xl bg-black px-6 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isScanningResume ? "animate-spin" : ""} />
                <span>{isScanningResume ? "Scanning ATS..." : "Re-Scan Resume"}</span>
              </button>
            </div>
          </div>

          {scanCompleteMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{scanCompleteMessage}</span>
            </div>
          )}

          {/* Resume input - the analyser scores real text, not a placeholder */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
            <h3 className="font-bold text-lg text-slate-900 mb-2">
              Paste Your Resume Text
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              The parser scores keyword coverage, structure and quantified impact
              against your target role. Nothing is scored until you provide the text.
            </p>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={8}
              placeholder="Paste the full text of your resume here, then press Re-Scan Resume."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-medium leading-relaxed outline-none transition focus:border-black focus:bg-white"
            />
            <p className="mt-2 text-[11px] text-slate-400">
              {resumeText.trim()
                ? resumeText.trim().split(/\s+/).length + " words ready to analyse"
                : "No text entered yet"}
            </p>
          </div>

          {/* ATS Metric Cards */}
          {resumeAnalysis && resumeAnalysis.analysed ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs text-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Overall ATS Score</span>
                <div className="mt-2 text-5xl font-black text-slate-900">
                  {resumeAnalysis.overallScore}%
                </div>
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                  {resumeAnalysis.overallScore >= 85
                    ? "Top 5% Ready"
                    : resumeAnalysis.overallScore >= 65
                    ? "Competitive"
                    : "Needs Work"}
                </span>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs text-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Format & Structure</span>
                <div className="mt-2 text-5xl font-black text-slate-900">
                  {resumeAnalysis.formatScore}%
                </div>
                <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-800">
                  {resumeAnalysis.formatScore >= 80 ? "Machine Readable" : "Sections Missing"}
                </span>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs text-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Keyword Alignment</span>
                <div className="mt-2 text-5xl font-black text-slate-900">
                  {resumeAnalysis.keywordScore}%
                </div>
                <span className="mt-2 inline-block rounded-full bg-purple-100 px-3 py-0.5 text-xs font-bold text-purple-800">
                  {resumeAnalysis.keywordScore >= 75 ? "High Match" : "Add Keywords"}
                </span>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs text-center">
                <span className="text-xs font-bold text-slate-400 uppercase">Quantified Impact</span>
                <div className="mt-2 text-5xl font-black text-slate-900">
                  {resumeAnalysis.impactScore}%
                </div>
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                  {resumeAnalysis.impactScore >= 70 ? "Metric Driven" : "Add Metrics"}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <FileText size={28} className="mx-auto text-slate-400" />
              <p className="mt-3 text-sm font-bold text-slate-700">
                No resume analysed yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Paste your resume above and run the scan to see real ATS scores.
              </p>
            </div>
          )}

          {/* Keywords Found vs Missing */}
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Identified Core Keywords (Passed ATS)
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Technologies and frameworks correctly extracted by parser
              </p>

              <div className="flex flex-wrap gap-2.5">
                {(resumeAnalysis?.skillsFound || []).map((k) => (
                  <span
                    key={k}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800"
                  >
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>{k}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Recommended Keywords to Add
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Boost match rate for Tier-1 companies by inserting these in project descriptions
              </p>

              <div className="flex flex-wrap gap-2.5">
                {(resumeAnalysis?.missingKeywords || []).map((k) => (
                  <span
                    key={k}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800"
                  >
                    <AlertCircle size={14} className="text-amber-600" />
                    <span>{k}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actionable Suggestions */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
            <h3 className="font-bold text-lg text-slate-900 mb-4">
              AI Improvement Checklist
            </h3>
            <div className="space-y-3">
              {(resumeAnalysis?.recommendations || []).map((rec, i) => (
                <div key={i} className="flex items-start gap-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-white font-bold text-[10px]">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed font-medium">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 6: MATCHED COMPANIES */}
      {activeTab === "companies" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="rounded-3xl bg-slate-900 p-8 text-white">
            <div className="flex items-center gap-2 text-blue-400">
              <Building2 size={24} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Verified Job & Campus Drive Matching
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-black text-white">
              AI Recommended Companies
            </h2>
            <p className="mt-2 text-slate-300 text-sm max-w-2xl leading-relaxed">
              Based on your current 94% placement probability, coding metrics, and resume ATS score.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(matchedCompanies || []).map((company) => {
              const isApplied = appliedCompanies[company.id];
              return (
                <div
                  key={company.id}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-7 shadow-xs transition hover:shadow-md hover:-translate-y-1"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl font-black text-white ${company.logoBg}`}
                        >
                          {company.logoText}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">{company.name}</h3>
                          <span className="text-xs font-semibold text-slate-500">
                            {company.tier}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                          {company.matchScore}% Match
                        </span>
                      </div>
                    </div>

                    <p className="mt-5 font-bold text-sm text-slate-800">{company.role}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Package: <span className="font-bold text-slate-900">{company.ctc}</span> • {company.location}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {company.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 rounded-2xl bg-slate-50 p-3 text-[11px] text-slate-600">
                      <span className="font-bold text-slate-800">Criteria:</span> {company.requirements}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">
                      Drive: {company.hiringSeason}
                    </span>

                    <button
                      onClick={() => handleApplyCompany(company.id)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                        isApplied
                          ? "bg-emerald-600 text-white"
                          : "bg-black text-white hover:bg-slate-800"
                      }`}
                    >
                      {isApplied ? "Applied / Ready" : "Simulate Apply"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}