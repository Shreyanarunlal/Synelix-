// src/components/dashboard/Sidebar.jsx
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Brain,
  Compass,
  FileCheck,
  Building2,
  Users,
  GraduationCap,
  Briefcase,
  BarChart3,
  Sparkles,
  ChevronDown,
  LogOut,
  Home,
  Layers,
  Search,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

export default function Sidebar({
  role = "student",
  activeTab = "overview",
  onTabChange = () => {},
  onOpenCopilot = () => {},
}) {
  const navigate = useNavigate();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Menus tailored for each role
  const studentMenu = [
    { id: "overview", label: "Readiness Overview", icon: LayoutDashboard },
    { id: "predictor", label: "AI Placement Predictor", icon: Brain, badge: "AI Core" },
    { id: "skill-gap", label: "Skill-Gap Analysis", icon: Layers },
    { id: "roadmap", label: "Personalized Roadmap", icon: Compass },
    { id: "resume-ats", label: "AI Resume & ATS", icon: FileCheck },
    { id: "companies", label: "Company Matches", icon: Building2 },
  ];

  const companyMenu = [
    { id: "overview", label: "Recruiter Dashboard", icon: LayoutDashboard },
    { id: "candidates", label: "Talent Directory", icon: Users, badge: "AI Ranked" },
    { id: "shortlist", label: "Shortlisted Pipeline", icon: CheckCircle2 },
    { id: "job-matcher", label: "Job Benchmark Matcher", icon: Search },
    { id: "analytics", label: "Hiring Analytics", icon: BarChart3 },
  ];

  const institutionMenu = [
    { id: "overview", label: "Institution Overview", icon: LayoutDashboard },
    { id: "students", label: "Student Readiness", icon: Users },
    { id: "departments", label: "Department Analysis", icon: GraduationCap },
    { id: "drives", label: "Campus Drives", icon: Briefcase },
    { id: "ai-reports", label: "AI Audit Reports", icon: Sparkles, badge: "Export" },
  ];

  const menu =
    role === "company"
      ? companyMenu
      : role === "institution"
      ? institutionMenu
      : studentMenu;

  const roleLabels = {
    student: { title: "Student Portal", icon: GraduationCap, badge: "Arjun K." },
    company: { title: "Recruiter Portal", icon: Building2, badge: "Tech Talent HR" },
    institution: { title: "College T&P Cell", icon: GraduationCap, badge: "Placement Cell" },
  };

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-72 flex-col border-r border-slate-200 bg-white">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-7 py-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white font-black shadow-md">
            S
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-slate-900">Synelix</span>
            <span className="block text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
              AI Career OS
            </span>
          </div>
        </Link>
      </div>

      {/* Role Switcher Pill */}
      <div className="relative px-5 pt-5 pb-3">
        <button
          onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-100"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white text-xs">
              {role === "student" ? "ST" : role === "company" ? "HR" : "TP"}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{roleLabels[role].title}</p>
              <p className="text-[11px] text-slate-500">{roleLabels[role].badge}</p>
            </div>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </button>

        {/* Dropdown Menu for fast switching */}
        {roleDropdownOpen && (
          <div className="absolute left-5 right-5 top-20 z-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Switch Portal View
            </p>
            <button
              onClick={() => {
                setRoleDropdownOpen(false);
                navigate("/student");
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                role === "student" ? "bg-black text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <GraduationCap size={16} />
              <span>Student AI Portal</span>
            </button>
            <button
              onClick={() => {
                setRoleDropdownOpen(false);
                navigate("/company");
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                role === "company" ? "bg-black text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Building2 size={16} />
              <span>Recruiter / HR Portal</span>
            </button>
            <button
              onClick={() => {
                setRoleDropdownOpen(false);
                navigate("/institution");
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                role === "institution" ? "bg-black text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <GraduationCap size={16} />
              <span>College T&P Dashboard</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2">
        <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Features
        </p>
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-black text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Icon
                  size={19}
                  className={isActive ? "text-white" : "text-slate-500 group-hover:text-black"}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Global AI Copilot CTA */}
        <div className="pt-4">
          <button
            onClick={onOpenCopilot}
            className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 hover:shadow-lg"
          >
            <Sparkles size={18} className="animate-spin text-white" />
            <span>Synelix AI Copilot</span>
          </button>
        </div>
      </nav>

      {/* Footer / Exit Links */}
      <div className="border-t border-slate-100 p-4 space-y-1 bg-slate-50/50">
        <Link
          to="/"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-black"
        >
          <Home size={16} />
          <span>Back to Home</span>
        </Link>
        <Link
          to="/login"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}