// src/pages/Login.jsx
import { useState } from "react";
import { ArrowRight, Lock, Mail, GraduationCap, Building2, School, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/** Seeded demo accounts, so the one-click buttons sign in for real. */
const DEMO_ACCOUNTS = {
  STUDENT: { email: "student@synelix.dev", password: "synelix123" },
  COMPANY: { email: "recruiter@synelix.dev", password: "synelix123" },
  INSTITUTION: { email: "tpo@synelix.dev", password: "synelix123" },
};

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { login, homeFor } = useAuth();

  const signIn = async (emailValue, passwordValue) => {
    setError("");
    setBusy(true);
    try {
      const user = await login(emailValue, passwordValue);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      setError(err.message || "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    signIn(email, password);
  };

  const handleDemo = (role) => {
    const account = DEMO_ACCOUNTS[role];
    setEmail(account.email);
    setPassword(account.password);
    signIn(account.email, account.password);
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-white">
      {/* Background Glow */}
      <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-200/40 blur-[180px]" />

      {/* Left Side (Branding Banner) */}
      <div className="relative hidden w-1/2 items-center justify-center bg-black p-16 lg:flex">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="max-w-md text-white"
        >
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black font-black text-sm">
              S
            </div>
            <span className="text-2xl font-black tracking-tight">Synelix</span>
          </Link>

          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-slate-400 font-bold">
            CAREER INTELLIGENCE PLATFORM
          </p>

          <h1 className="text-5xl font-black leading-tight">
            Sync Your Skills.
            <br />
            Secure Your Future.
          </h1>

          <p className="mt-8 text-base leading-relaxed text-slate-400">
            Predict your campus placement probability, bridge skill gaps with customized roadmaps, and connect directly with hiring companies.
          </p>
        </motion.div>
      </div>

      {/* Right Side (Form) */}
      <div className="relative flex flex-1 items-center justify-center px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-4xl font-black text-slate-900">
              Sign In
            </h2>
            <Link to="/" className="text-xs font-bold text-slate-500 hover:text-black">
              ← Home
            </Link>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Access your Synelix AI placement workspace.
          </p>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Quick 1-Click Demo Login
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemo("STUDENT")}
                disabled={busy}
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white border border-slate-200 p-2.5 text-xs font-bold text-slate-800 transition hover:border-black hover:shadow-xs disabled:opacity-50"
              >
                <GraduationCap size={16} />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemo("COMPANY")}
                disabled={busy}
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white border border-slate-200 p-2.5 text-xs font-bold text-slate-800 transition hover:border-black hover:shadow-xs disabled:opacity-50"
              >
                <Building2 size={16} />
                <span>Recruiter</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemo("INSTITUTION")}
                disabled={busy}
                className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white border border-slate-200 p-2.5 text-xs font-bold text-slate-800 transition hover:border-black hover:shadow-xs disabled:opacity-50"
              >
                <School size={16} />
                <span>College</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
              <p className="text-xs font-medium text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail
                className="absolute left-5 top-4 text-slate-400"
                size={18}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Institutional or company email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-xs font-medium outline-none transition focus:border-black focus:bg-white"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock
                className="absolute left-5 top-4 text-slate-400"
                size={18}
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-xs font-medium outline-none transition focus:border-black focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-4 text-sm font-bold text-white transition hover:scale-[1.02] hover:bg-slate-800 shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              <span>{busy ? "Signing in..." : "Continue to Platform"}</span>
              <ArrowRight
                className="transition group-hover:translate-x-1"
                size={16}
              />
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-black hover:underline"
            >
              Create one now
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;