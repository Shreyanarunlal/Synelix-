// src/components/dashboard/Topbar.jsx
import { useState } from "react";
import { Bell, Search, Sparkles } from "lucide-react";

export default function Topbar({
  role = "student",
  onOpenCopilot = () => {},
  searchTerm = "",
  onSearchChange = () => {},
}) {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: "n1",
      title: "Placement Predictor Updated",
      desc: "AI calculated a +4% readiness surge following your latest DSA score.",
      time: "10m ago",
      unread: true,
    },
    {
      id: "n2",
      title: "Microsoft Drive Announced",
      desc: "Registrations opened for Software Engineering FTE (Batch 2026).",
      time: "1h ago",
      unread: true,
    },
    {
      id: "n3",
      title: "ATS Resume Verified",
      desc: "Your updated resume scored 91/100 on automated ATS inspection.",
      time: "3h ago",
      unread: false,
    },
  ];

  const roleTitles = {
    student: "Student Career Intelligence",
    company: "Recruiter & Talent Acquisition",
    institution: "Training & Placement Cell",
  };

  const roleSubtitles = {
    student: "Sync your skills. Predict and secure your dream placement.",
    company: "Discover, evaluate, and shortlist AI-verified campus talent.",
    institution: "Real-time analytics, placement predictions & institutional reports.",
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-8 py-5 backdrop-blur-md">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          {roleTitles[role]}
        </h2>
        <p className="text-xs font-medium text-slate-500">
          {roleSubtitles[role]}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search skills, companies, drives..."
            className="w-64 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 outline-none transition focus:border-black focus:bg-white focus:w-72"
          />
        </div>

        {/* AI Copilot Quick Launch */}
        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 hover:scale-105"
        >
          <Sparkles size={14} className="text-blue-400" />
          <span className="hidden sm:inline">Ask AI Copilot</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-600" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl z-40">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-sm text-slate-900">Notifications</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  2 New
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-xl p-3 text-xs transition ${
                      n.unread ? "bg-slate-50 border border-slate-100" : "opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">{n.title}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="mt-1 text-slate-600 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-sm shadow-inner">
            {role === "student" ? "AK" : role === "company" ? "HR" : "TP"}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-slate-900">
              {role === "student" ? "Arjun K." : role === "company" ? "Talent Acquisition" : "Placement Officer"}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">
              {role === "student" ? "NIT Trichy" : role === "company" ? "Verified Recruiter" : "Admin"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}