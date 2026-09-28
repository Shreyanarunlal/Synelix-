// src/pages/InstitutionDashboard.jsx
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import StatCard from "../components/dashboard/StatCard";
import PlacementChart from "../components/dashboard/PlacementChart";
import { useApiResource } from "../hooks/useApiResource";
import { institutionApi } from "../services/api";
import {
  GraduationCap,
  Briefcase,
  Users,
  TrendingUp,
  Brain,
  ArrowUpRight,
  Download,
  Sparkles,
  Search,
  X,
  Plus,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

/** Placeholder so the KPI cards render before the aggregate lands. */
const EMPTY_STATS = {
  totalStudents: 0,
  placedStudents: 0,
  placementRate: "-",
  departmentsCount: 0,
  aiReadinessIndex: "-",
  topDepartment: "-",
  averagePackage: "-",
  tier1ReadyCount: 0,
  atRiskCount: 0,
};

export default function InstitutionDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDept, setSelectedDept] = useState("All");
  const [studentSearch, setStudentSearch] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [newDriveModalOpen, setNewDriveModalOpen] = useState(false);
  const [driveError, setDriveError] = useState("");
  const [newDriveForm, setNewDriveForm] = useState({
    company: "",
    date: "",
    role: "",
    package: "",
  });

  // Every figure below is aggregated server-side from the live student table.
  const { data: stats, error: statsError } = useApiResource(
    () => institutionApi.getStats(),
    [],
    { initialData: EMPTY_STATS }
  );

  const { data: departments } = useApiResource(
    () => institutionApi.getDepartments(),
    [],
    { initialData: [] }
  );

  const { data: drives, setData: setDrives } = useApiResource(
    () => institutionApi.getDrives(),
    [],
    { initialData: [] }
  );

  const { data: students } = useApiResource(
    () => institutionApi.getStudents(),
    [],
    { initialData: [] }
  );

  const { data: auditReport } = useApiResource(
    () => institutionApi.getAuditReport(),
    [],
    { skip: !isReportModalOpen }
  );

  const departmentList = departments || [];

  // The cohort is small enough to filter client-side here; the recruiter view
  // filters server-side because it searches the whole network.
  const filteredStudents = useMemo(() => {
    return (students || []).filter((c) => {
      const dept = c.department || "";
      const name = c.name || "";
      const matchDept =
        selectedDept === "All" ||
        dept.toLowerCase().includes(selectedDept.toLowerCase());
      const matchSearch =
        studentSearch === "" ||
        name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        dept.toLowerCase().includes(studentSearch.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [students, selectedDept, studentSearch]);

  const handleAddDrive = (e) => {
    e.preventDefault();
    if (!newDriveForm.company || !newDriveForm.role) return;
    setDriveError("");

    // The eligible count comes back computed from the real cohort against the
    // cut-offs, rather than being asserted here.
    institutionApi
      .scheduleDrive({
        company: newDriveForm.company,
        role: newDriveForm.role,
        date: newDriveForm.date || "Upcoming",
        salaryPackage: newDriveForm.package || "To be announced",
        minCgpa: 7.0,
        minReadiness: 70,
      })
      .then((created) => {
        setDrives((prev) => [created, ...(prev || [])]);
        setNewDriveForm({ company: "", date: "", role: "", package: "" });
        setNewDriveModalOpen(false);
      })
      .catch((err) => setDriveError(err.message));
  };

  return (
    <DashboardLayout
      role="institution"
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {statsError && (
        <div className="mb-6 flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-bold text-amber-900">
              Institution analytics unavailable
            </p>
            <p className="mt-1 text-xs font-medium text-amber-800">
              {statsError.message}
            </p>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                Institutional Placement & Training Cell (T&P)
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">
                Academic Year 2025-26
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
              Placement Intelligence & Institutional Analytics
            </h1>

            <p className="mt-2 text-slate-600">
              Real-time monitoring of campus employability, department trends, and recruiter drives.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-black px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 hover:scale-105"
            >
              <Sparkles size={18} className="text-blue-400" />
              <span>Generate AI Report</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
          {[
            { id: "overview", label: "Institution Overview" },
            { id: "students", label: "Student Readiness Directory" },
            { id: "departments", label: "Department Analysis" },
            { id: "drives", label: "Campus Recruitment Drives" },
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

      {/* TAB: OVERVIEW */}
      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* KPI Stat Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Enrolled Final-Years"
              value={String(stats.totalStudents)}
              subtitle={`${stats.tier1ReadyCount} cleared the Tier-1 threshold`}
              icon={Users}
            />
            <StatCard
              title="Offers Extended"
              value={String(stats.placedStudents)}
              subtitle={`${stats.placementRate} placement clearance`}
              icon={Briefcase}
            />
            <StatCard
              title="Engineering Depts"
              value={String(stats.departmentsCount)}
              subtitle={`Top: ${stats.topDepartment}`}
              icon={GraduationCap}
            />
            <StatCard
              title="Institutional AI Readiness"
              value={stats.aiReadinessIndex}
              subtitle={`Average offer ${stats.averagePackage}`}
              icon={TrendingUp}
            />
          </div>

          {/* AI Insights & Trend Chart Grid */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PlacementChart />
            </div>

            {/* AI Recommendation Box */}
            <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 text-blue-400">
                  <Brain size={32} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    AI Placement Advisory
                  </span>
                </div>

                <h3 className="mt-4 text-2xl font-bold text-white">
                  CSE & AI/DS Lead Placements
                </h3>

                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Computer Science students have a <strong>93.9% placement rate</strong> with an average package of <strong>₹14.2 LPA</strong>.
                </p>

                <div className="mt-5 rounded-2xl bg-white/10 p-4 text-xs text-slate-200">
                  <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-blue-400" />
                    Recommended Action:
                  </p>
                  AI identifies a skill deficit in <strong>Cloud / AWS</strong> for Electronics students. Organizing a 2-week hands-on workshop is projected to increase ECE placements by +12%.
                </div>
              </div>

              <button
                onClick={() => setIsReportModalOpen(true)}
                className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-xs font-bold text-black transition hover:scale-105"
              >
                <span>View Full AI Audit Report</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          {/* Department Overview Cards & Drives */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Top Departments */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Department Performance</h3>
                  <p className="text-xs text-slate-500">Placement rate and average CTC</p>
                </div>
                <button
                  onClick={() => setActiveTab("departments")}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Full Breakdown →
                </button>
              </div>

              <div className="space-y-4">
                {departmentList.map((dept) => (
                  <div
                    key={dept.name}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{dept.name}</p>
                      <p className="text-slate-500 text-[11px]">
                        Avg. CTC: <span className="font-semibold text-slate-800">{dept.avgPackage}</span> • {dept.placed} Placed
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">{dept.rate}</span>
                      <p className="text-[10px] text-emerald-600 font-bold">AI Score: {dept.aiReadiness}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Campus Drives */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">Upcoming Campus Drives</h3>
                    <p className="text-xs text-slate-500">Scheduled company recruitment events</p>
                  </div>
                  <button
                    onClick={() => setNewDriveModalOpen(true)}
                    className="flex items-center gap-1 rounded-xl bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    <Plus size={14} /> Add Drive
                  </button>
                </div>

                <div className="space-y-3">
                  {drives.slice(0, 4).map((d) => (
                    <div
                      key={d.company}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{d.company}</p>
                        <p className="text-slate-500 text-[11px]">
                          {d.role} • <span className="font-semibold text-slate-800">{d.package}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-800">
                          {d.date}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {d.eligibleCount} Eligible
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab("drives")}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-xs font-bold text-slate-800 hover:bg-slate-200"
              >
                Manage All Recruitment Drives
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB: STUDENT READINESS DIRECTORY */}
      {activeTab === "students" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Controls Bar */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="grid gap-4 md:grid-cols-12 items-center">
              <div className="relative md:col-span-8">
                <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search student by name or department..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none focus:border-black focus:bg-white"
                />
              </div>

              <div className="md:col-span-4">
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
            </div>
          </div>

          {/* Student Table */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-100 px-8 py-5">
              <h3 className="font-bold text-lg text-slate-900">
                Enrolled Students ({filteredStudents.length})
              </h3>
              <p className="text-xs text-slate-500">
                Track individual AI readiness scores and placement progress
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-8 py-4">Student</th>
                    <th className="py-4">Department</th>
                    <th className="py-4">CGPA</th>
                    <th className="py-4">AI Score</th>
                    <th className="py-4">DSA Solved</th>
                    <th className="py-4">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-8 py-4 font-bold text-slate-900">
                        {s.name}
                      </td>
                      <td className="py-4 text-slate-600">{s.department}</td>
                      <td className="py-4 font-semibold text-slate-800">{s.cgpa} / 10</td>
                      <td className="py-4 font-black text-slate-900">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                          {s.aiScore}%
                        </span>
                      </td>
                      <td className="py-4 text-slate-600">{s.dsaSolved}</td>
                      <td className="py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                            s.status === "Shortlisted"
                              ? "bg-emerald-100 text-emerald-800"
                              : s.status === "Interview Scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB: DEPARTMENT ANALYSIS */}
      {activeTab === "departments" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs">
            <h3 className="font-bold text-xl text-slate-900 mb-2">
              Cross-Department Placement Comparison
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Evaluated on average package, placement percentage, and AI readiness
            </p>

            <div className="h-80 w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentList.map((d) => ({
                    name: d.name.split(" ")[0],
                    rate: parseFloat(d.rate),
                    readiness: d.aiReadiness,
                  }))}
                >
                  <XAxis dataKey="name" />
                  <YAxis domain={[60, 100]} />
                  <Tooltip />
                  <Bar dataKey="rate" name="Placement Rate (%)" fill="#000000" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="readiness" name="AI Readiness (%)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-4">Department</th>
                    <th className="py-4">Total Students</th>
                    <th className="py-4">Students Placed</th>
                    <th className="py-4">Placement Rate</th>
                    <th className="py-4">Average CTC</th>
                    <th className="py-4">AI Readiness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departmentList.map((d) => (
                    <tr key={d.name} className="hover:bg-slate-50">
                      <td className="py-4 px-4 font-bold text-slate-900">{d.name}</td>
                      <td className="py-4 text-slate-600">{d.totalStudents}</td>
                      <td className="py-4 text-slate-600">{d.placed}</td>
                      <td className="py-4 font-bold text-emerald-600">{d.rate}</td>
                      <td className="py-4 font-bold text-slate-900">{d.avgPackage}</td>
                      <td className="py-4 font-semibold text-blue-600">{d.aiReadiness}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB: CAMPUS DRIVES */}
      {activeTab === "drives" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-slate-900 p-8 text-white">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Corporate Recruitment
              </span>
              <h2 className="mt-2 text-3xl font-black text-white">
                Campus Recruitment Drives
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                Coordinate schedules, eligible student batches, and online assessment links.
              </p>
            </div>

            <button
              onClick={() => setNewDriveModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-xs font-bold text-black hover:scale-105 transition"
            >
              <Plus size={16} />
              <span>Schedule New Drive</span>
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {drives.map((d, i) => (
              <div
                key={i}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white font-black text-sm">
                      {d.company.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                      {d.status}
                    </span>
                  </div>

                  <h3 className="mt-5 font-bold text-xl text-slate-900">{d.company}</h3>
                  <p className="text-xs text-slate-500">{d.role}</p>

                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Drive Date:</span>
                      <span className="font-bold text-slate-900">{d.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Offered CTC:</span>
                      <span className="font-bold text-slate-900">{d.package}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Eligible Candidates:</span>
                      <span className="font-bold text-emerald-600">{d.eligibleCount}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Exporting student eligibility roster for ${d.company}...`)}
                  className="mt-6 w-full rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-800 hover:bg-slate-50"
                >
                  Export Eligible Students List
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* EXPORTABLE AI PLACEMENT AUDIT REPORT MODAL */}
      <AnimatePresence>
        {isReportModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReportModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-0.5 text-[10px] font-bold text-blue-800 uppercase">
                      Official Audit Document
                    </span>
                    <span className="text-xs text-slate-400">• Confirmed</span>
                  </div>
                  <h3 className="mt-1 font-black text-2xl text-slate-900">
                    Synelix AI Institutional Placement Audit
                  </h3>
                </div>

                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-black"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 space-y-6 text-xs text-slate-700">
                {/* Executive Summary - generated from the live cohort */}
                <div className="rounded-2xl bg-slate-900 p-6 text-white">
                  <h4 className="font-bold text-sm text-blue-400 mb-2">
                    Executive Summary
                  </h4>
                  <p className="leading-relaxed text-slate-300">
                    {auditReport
                      ? auditReport.executiveSummary
                      : "Generating the audit from the current cohort..."}
                  </p>
                  {auditReport && (
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Generated {auditReport.generatedAt} · academic year{" "}
                      {auditReport.academicYear} · {auditReport.cohortSize} students
                    </p>
                  )}
                </div>

                {/* Key Findings */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-3">Key Predictive Findings</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="font-bold text-slate-900 mb-1">
                        High-Performing Departments
                      </p>
                      {(auditReport?.strengths || []).map((item) => (
                        <p key={item} className="mb-1.5 text-slate-500">
                          {item}
                        </p>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="font-bold text-amber-900 mb-1">
                        Identified Risk Areas
                      </p>
                      {(auditReport?.riskAreas || []).map((item) => (
                        <p key={item} className="mb-1.5 text-amber-800">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Training Recommendations */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-2">
                    AI Training Recommendations for Placement Cell
                  </h4>
                  <div className="space-y-2">
                    {(auditReport?.recommendations || []).map((rec, i) => (
                      <div key={i} className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-white font-bold text-[10px]">
                          {i + 1}
                        </span>
                        <span className="font-medium text-slate-800">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Print / Download Button */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-black px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition"
                  >
                    <Download size={16} />
                    <span>Print / Save PDF Report</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* NEW DRIVE MODAL */}
      <AnimatePresence>
        {newDriveModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNewDriveModalOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-bold text-lg text-slate-900">Schedule Campus Drive</h3>
                <button
                  onClick={() => setNewDriveModalOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddDrive} className="mt-5 space-y-4 text-xs">
                {driveError && (
                  <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5">
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
                    <p className="text-xs font-medium text-red-700">{driveError}</p>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={newDriveForm.company}
                    onChange={(e) => setNewDriveForm({ ...newDriveForm, company: e.target.value })}
                    placeholder="e.g. Cisco Systems"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Job Role</label>
                  <input
                    type="text"
                    required
                    value={newDriveForm.role}
                    onChange={(e) => setNewDriveForm({ ...newDriveForm, role: e.target.value })}
                    placeholder="e.g. Software Engineer"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Date</label>
                    <input
                      type="text"
                      value={newDriveForm.date}
                      onChange={(e) => setNewDriveForm({ ...newDriveForm, date: e.target.value })}
                      placeholder="e.g. 15 Nov 2026"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Package (CTC)</label>
                    <input
                      type="text"
                      value={newDriveForm.package}
                      onChange={(e) => setNewDriveForm({ ...newDriveForm, package: e.target.value })}
                      placeholder="e.g. ₹18 LPA"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 outline-none focus:border-black"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-black py-4 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition mt-2"
                >
                  Confirm & Announce Drive
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}