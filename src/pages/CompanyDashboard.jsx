// src/pages/CompanyDashboard.jsx
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import StatCard from "../components/dashboard/StatCard";
import { useApiResource } from "../hooks/useApiResource";
import { companyApi } from "../services/api";
import {
  Users,
  Search,
  CheckCircle2,
  Brain,
  Sparkles,
  X,
  Download,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
} from "recharts";

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState("candidates");
  const [searchSkill, setSearchSkill] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [minScore, setMinScore] = useState(80);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [pipelineSuccessMessage, setPipelineSuccessMessage] = useState("");

  // Filtering happens in the database, not in the browser: the recruiter view
  // is meant to search the whole cohort, which is not something to ship to the
  // client and filter there.
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchSkill), 300);
    return () => clearTimeout(timer);
  }, [searchSkill]);

  const {
    data: candidates,
    loading: candidatesLoading,
    error: candidatesError,
    setData: setCandidates,
  } = useApiResource(
    () => companyApi.getCandidates(debouncedSearch, selectedDept, minScore),
    [debouncedSearch, selectedDept, minScore],
    { initialData: [] }
  );

  const filteredCandidates = candidates || [];

  const handleToggleShortlist = useCallback(
    (id) => {
      companyApi
        .toggleShortlist(id)
        .then((result) => {
          setCandidates((prev) =>
            (prev || []).map((c) =>
              c.id === id
                ? {
                    ...c,
                    shortlisted: result.shortlisted,
                    status: result.shortlisted ? "Shortlisted" : "Available",
                  }
                : c
            )
          );
          setPipelineSuccessMessage(result.message);
          setTimeout(() => setPipelineSuccessMessage(""), 3000);
        })
        .catch((err) => {
          setPipelineSuccessMessage(err.message);
          setTimeout(() => setPipelineSuccessMessage(""), 4000);
        });
    },
    [setCandidates]
  );

  // Counted server-side so the badge reflects the whole shortlist, not just
  // the candidates matching the current filter.
  const { data: shortlisted } = useApiResource(
    () => companyApi.getShortlisted(),
    [pipelineSuccessMessage],
    { initialData: [] }
  );

  const shortlistedCount = (shortlisted || []).length;

  // Summary counters for the KPI row, computed from whatever the current
  // filters returned rather than from fixed numbers.
  const collegeCount = new Set(
    filteredCandidates.map((c) => c.college).filter(Boolean)
  ).size;

  const tierOneReady = filteredCandidates.filter(
    (c) => (c.aiScore ?? 0) > 90
  ).length;

  const medianReadiness = (() => {
    const scores = filteredCandidates
      .map((c) => c.aiScore)
      .filter((v) => typeof v === "number")
      .sort((a, b) => a - b);
    if (scores.length === 0) return null;
    const mid = Math.floor(scores.length / 2);
    return scores.length % 2
      ? scores[mid]
      : Math.round((scores[mid - 1] + scores[mid]) / 2);
  })();

  return (
    <DashboardLayout
      role="company"
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {candidatesError && (
        <div className="mb-6 flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-bold text-amber-900">
              Candidate search unavailable
            </p>
            <p className="mt-1 text-xs font-medium text-amber-800">
              {candidatesError.message}
            </p>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800">
                Recruiter & Talent Acquisition Suite
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">
                Verified Campus Network
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
              AI-Ranked Campus Candidates
            </h1>

            <p className="mt-2 text-slate-600">
              Filter top engineering talent across partnered universities with predictive employability scoring.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("shortlist")}
              className="flex items-center gap-2 rounded-2xl bg-black px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 hover:scale-105"
            >
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>View Shortlisted ({shortlistedCount})</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
          {[
            { id: "candidates", label: "Talent Directory" },
            { id: "shortlist", label: `Shortlisted Pipeline (${shortlistedCount})` },
            { id: "job-matcher", label: "Job Benchmark Matcher" },
            { id: "analytics", label: "Hiring Analytics" },
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

      {pipelineSuccessMessage && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{pipelineSuccessMessage}</span>
        </div>
      )}

      {/* TAB: TALENT DIRECTORY */}
      {activeTab === "candidates" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* KPI Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Candidates Matching"
              value={String(filteredCandidates.length)}
              subtitle={`Across ${collegeCount} partner ${
                collegeCount === 1 ? "college" : "colleges"
              }`}
              icon={Users}
            />
            <StatCard
              title="Tier-1 Ready (Score > 90%)"
              value={String(tierOneReady)}
              subtitle="Immediate high-yield fit"
              icon={Brain}
            />
            <StatCard
              title="Shortlisted by Your Team"
              value={String(shortlistedCount)}
              subtitle="In review / interview"
              icon={CheckCircle2}
            />
            <StatCard
              title="Median AI Readiness"
              value={medianReadiness === null ? "-" : `${medianReadiness}%`}
              subtitle="Across the current result set"
              icon={TrendingUp}
            />
          </div>

          {/* Filtering Bar */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="grid gap-4 md:grid-cols-12 items-center">
              {/* Search input */}
              <div className="relative md:col-span-5">
                <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchSkill}
                  onChange={(e) => setSearchSkill(e.target.value)}
                  placeholder="Search by skill (e.g. React, Java, Docker) or name..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none focus:border-black focus:bg-white"
                />
              </div>

              {/* Department Dropdown */}
              <div className="md:col-span-3">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-bold text-slate-800 outline-none focus:border-black"
                >
                  <option value="All">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics & Comm</option>
                </select>
              </div>

              {/* Min AI Score Slider */}
              <div className="md:col-span-4 flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                  Min AI Score:
                </span>
                <input
                  type="range"
                  min="60"
                  max="95"
                  step="1"
                  value={minScore}
                  onChange={(e) => setMinScore(parseInt(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
                <span className="rounded-xl bg-black px-3 py-1.5 text-xs font-bold text-white">
                  {minScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Candidates Directory Table */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-5">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Qualified Candidates{" "}
                  {candidatesLoading ? "" : `(${filteredCandidates.length})`}
                </h3>
                <p className="text-xs text-slate-500">
                  Pre-screened on academic record, DSA, and aptitude
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-8 py-4">Candidate</th>
                    <th className="py-4">College & Dept</th>
                    <th className="py-4">AI Score</th>
                    <th className="py-4">Coding & Aptitude</th>
                    <th className="py-4">Top Verified Skills</th>
                    <th className="py-4">Status</th>
                    <th className="px-8 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {candidatesLoading && filteredCandidates.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-8 py-12 text-center text-slate-400">
                        Searching the campus network...
                      </td>
                    </tr>
                  )}

                  {!candidatesLoading && filteredCandidates.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-8 py-12 text-center">
                        <p className="text-sm font-bold text-slate-700">
                          No candidates match these filters
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Try a lower AI score threshold, a different department,
                          or a broader skill term.
                        </p>
                      </td>
                    </tr>
                  )}

                  {filteredCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="transition hover:bg-slate-50/80 cursor-pointer"
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black text-white font-bold text-xs">
                            {candidate.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{candidate.name}</p>
                            <p className="text-[11px] text-slate-400">{candidate.roleMatch}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4">
                        <p className="font-medium text-slate-800">{candidate.college}</p>
                        <p className="text-[11px] text-slate-400">{candidate.department}</p>
                      </td>

                      <td className="py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-black text-slate-900">
                            {candidate.aiScore}%
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              candidate.aiScore >= 90
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {candidate.tier}
                          </span>
                        </div>
                      </td>

                      <td className="py-4">
                        <p className="font-bold text-slate-800">{candidate.dsaSolved} Solved</p>
                        <p className="text-[11px] text-slate-400">Aptitude: {candidate.aptitude}%</p>
                      </td>

                      <td className="py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {candidate.topSkills.map((s) => (
                            <span
                              key={s}
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                            candidate.status === "Shortlisted"
                              ? "bg-emerald-100 text-emerald-800"
                              : candidate.status === "Interview Scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {candidate.status}
                        </span>
                      </td>

                      <td
                        className="px-8 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCandidate(candidate)}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-black hover:text-black transition"
                          >
                            Dossier
                          </button>
                          <button
                            onClick={() => handleToggleShortlist(candidate.id)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                              candidate.shortlisted
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-black text-white hover:bg-slate-800"
                            }`}
                          >
                            {candidate.shortlisted ? "Shortlisted ✓" : "Shortlist"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB: SHORTLISTED PIPELINE */}
      {activeTab === "shortlist" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="rounded-3xl bg-slate-900 p-8 text-white">
            <div className="flex items-center gap-2 text-blue-400">
              <CheckCircle2 size={24} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Interview Funnel
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-black text-white">
              Shortlisted Talent Pipeline ({shortlistedCount})
            </h2>
            <p className="mt-2 text-slate-300 text-sm max-w-2xl leading-relaxed">
              These candidates have satisfied your AI hiring threshold. Advance them directly to technical screens or schedule campus interviews.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(shortlisted || [])
              .filter((c) => c.shortlisted)
              .map((candidate) => (
                <div
                  key={candidate.id}
                  className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white font-bold">
                        {candidate.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                        {candidate.aiScore}% Match
                      </span>
                    </div>

                    <h3 className="mt-5 font-bold text-lg text-slate-900">{candidate.name}</h3>
                    <p className="text-xs text-slate-500">
                      {candidate.college} • {candidate.department}
                    </p>

                    <div className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Target Role:</span>
                        <span className="font-bold text-slate-800">{candidate.roleMatch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">DSA Solved:</span>
                        <span className="font-bold text-slate-800">{candidate.dsaSolved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Aptitude Score:</span>
                        <span className="font-bold text-slate-800">{candidate.aptitude}%</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1">
                      {candidate.topSkills.map((s) => (
                        <span
                          key={s}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedCandidate(candidate)}
                      className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
                    >
                      View Dossier
                    </button>
                    <button
                      onClick={() => handleToggleShortlist(candidate.id)}
                      className="rounded-xl bg-red-50 text-red-600 px-3 py-2.5 text-xs font-bold hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* TAB: JOB BENCHMARK MATCHER */}
      {activeTab === "job-matcher" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="rounded-3xl bg-slate-900 p-8 text-white">
            <div className="flex items-center gap-2 text-blue-400">
              <Sparkles size={24} />
              <span className="text-xs font-bold uppercase tracking-widest">
                AI Job Requirement Alignment
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-black text-white">
              Instant Job Requirement Matcher
            </h2>
            <p className="mt-2 text-slate-300 text-sm max-w-2xl leading-relaxed">
              Define your hiring criteria below. Synelix matches and orders registered campus candidates by semantic similarity and verified competencies.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs space-y-5">
              <h3 className="font-bold text-lg text-slate-900">Role Requirements</h3>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Job Position Title
                </label>
                <input
                  type="text"
                  defaultValue="Software Development Engineer (SDE-1)"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Required Core Skills
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["Java", "Spring Boot", "React", "Docker", "SQL"].map((s) => (
                    <span
                      key={s}
                      className="rounded-lg bg-black text-white px-2.5 py-1 text-[11px] font-bold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Type skill and press enter..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Minimum CGPA Cutoff
                </label>
                <select className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 outline-none focus:border-black">
                  <option>8.0 and above</option>
                  <option>7.5 and above</option>
                  <option>7.0 and above</option>
                </select>
              </div>

              <button className="w-full rounded-2xl bg-black py-4 text-xs font-bold text-white shadow-md transition hover:bg-slate-800">
                Run AI Match Ranking
              </button>
            </div>

            {/* Top Match Results */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs lg:col-span-2 space-y-4">
              <h3 className="font-bold text-lg text-slate-900">
                AI Match Ranking for SDE-1
              </h3>

              <div className="space-y-3">
                {(candidates || []).slice(0, 4).map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-white hover:shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-black text-white text-xs font-black">
                        #{i + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500">
                          {c.college} • CGPA {c.cgpa}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-black text-slate-900 text-sm">
                        {c.aiScore}% Fit
                      </span>
                      <button
                        onClick={() => setSelectedCandidate(c)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:border-black"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB: HIRING ANALYTICS */}
      {activeTab === "analytics" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Candidate AI Readiness by Department
              </h3>
              <p className="text-xs text-slate-500 mb-6">Average score across partner institutions</p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { dept: "CSE", score: 94 },
                      { dept: "AI & DS", score: 96 },
                      { dept: "IT", score: 88 },
                      { dept: "ECE", score: 84 },
                      { dept: "Mech", score: 76 },
                    ]}
                  >
                    <XAxis dataKey="dept" />
                    <YAxis domain={[50, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#000000" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Candidate Hiring Tier Distribution
              </h3>
              <p className="text-xs text-slate-500 mb-6">Tier qualification based on neural assessment</p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Dream Tier-1", value: 38, fill: "#10b981" },
                        { name: "Product Tier-2", value: 32, fill: "#8b5cf6" },
                        { name: "IT Services / Core", value: 30, fill: "#3b82f6" },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* CANDIDATE DOSSIER MODAL */}
      <AnimatePresence>
        {selectedCandidate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCandidate(null)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white font-bold text-base">
                    {selectedCandidate.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-900">
                      {selectedCandidate.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedCandidate.college} • {selectedCandidate.department}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-black"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Dossier Body */}
              <div className="mt-6 space-y-6">
                {/* Score & Tier Banner */}
                <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-6 text-white">
                  <div>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      Synelix AI Assessment Score
                    </span>
                    <div className="mt-1 text-4xl font-black">{selectedCandidate.aiScore}%</div>
                    <span className="mt-1 inline-block text-xs font-semibold text-slate-300">
                      Category: {selectedCandidate.tier}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleShortlist(selectedCandidate.id)}
                    className={`rounded-2xl px-5 py-3 text-xs font-bold transition ${
                      selectedCandidate.shortlisted
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-black hover:scale-105"
                    }`}
                  >
                    {selectedCandidate.shortlisted ? "Shortlisted ✓" : "Shortlist Candidate"}
                  </button>
                </div>

                {/* Academic & Coding KPIs */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">CGPA</span>
                    <p className="mt-1 text-2xl font-black text-slate-900">
                      {selectedCandidate.cgpa} / 10
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      DSA Solved
                    </span>
                    <p className="mt-1 text-2xl font-black text-slate-900">
                      {selectedCandidate.dsaSolved}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      Aptitude Score
                    </span>
                    <p className="mt-1 text-2xl font-black text-slate-900">
                      {selectedCandidate.aptitude}%
                    </p>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-2">
                    Verified Competencies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.topSkills.map((s) => (
                      <span
                        key={s}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Proof of Work - this candidate's own record */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-2">
                    Verified Record
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs">
                      <div className="text-2xl font-black text-slate-900">
                        {selectedCandidate.projectsCount ?? 0}
                      </div>
                      <p className="mt-1 font-bold text-slate-500">Shipped projects</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs">
                      <div className="text-2xl font-black text-slate-900">
                        {selectedCandidate.dsaSolved ?? 0}
                      </div>
                      <p className="mt-1 font-bold text-slate-500">Problems solved</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs">
                      <div className="text-2xl font-black text-slate-900">
                        {selectedCandidate.internshipsMonths ?? 0}
                        <span className="text-sm font-bold text-slate-400"> mo</span>
                      </div>
                      <p className="mt-1 font-bold text-slate-500">Internship experience</p>
                    </div>
                    <div
                      className={`rounded-2xl border p-4 text-xs ${
                        selectedCandidate.backlogs
                          ? "border-amber-200 bg-amber-50"
                          : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <div
                        className={`text-2xl font-black ${
                          selectedCandidate.backlogs ? "text-amber-700" : "text-slate-900"
                        }`}
                      >
                        {selectedCandidate.backlogs ?? 0}
                      </div>
                      <p
                        className={`mt-1 font-bold ${
                          selectedCandidate.backlogs ? "text-amber-700" : "text-slate-500"
                        }`}
                      >
                        Active backlogs
                      </p>
                    </div>
                  </div>

                  {selectedCandidate.expectedCtc ? (
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      Model-predicted offer band:{" "}
                      <span className="font-bold text-slate-900">
                        around Rs {selectedCandidate.expectedCtc} LPA
                      </span>
                      {selectedCandidate.cohort
                        ? ` • cohort: ${selectedCandidate.cohort}`
                        : ""}
                    </p>
                  ) : null}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      alert(`Interview invitation dispatched to ${selectedCandidate.name}!`);
                      setSelectedCandidate(null);
                    }}
                    className="flex-1 rounded-2xl bg-black py-4 text-xs font-bold text-white shadow-md transition hover:scale-102"
                  >
                    Schedule Technical Screen
                  </button>

                  <button
                    onClick={() => {
                      alert("Downloading verified Synelix AI candidate dossier (PDF)...");
                    }}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-4 text-xs font-bold text-slate-800 hover:bg-slate-50"
                  >
                    <Download size={16} />
                    <span>Export Dossier</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}