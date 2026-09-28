// src/pages/Register.jsx
import { useState } from "react";
import { AlertCircle, ArrowRight, Lock, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Step 1 only collects the details. The account is created on the next
  // screen, once a role has been chosen, because the API needs one.
  const handleRegister = (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    navigate("/select-role", { state: { pendingSignup: { name, email, password } } });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-12">
      {/* Background Glow */}
      <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-200/40 blur-[180px]" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white font-black text-xs">
              S
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900">Synelix</span>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Step 1 of 2
          </span>
        </div>

        <h1 className="mt-6 text-3xl font-black text-slate-900">
          Create Account
        </h1>

        <p className="mt-2 text-xs text-slate-500">
          Start your AI-powered placement prediction & career journey.
        </p>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-xs font-medium text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="mt-8 space-y-4">
          {/* Name */}
          <div className="relative">
            <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-xs font-medium outline-none transition focus:border-black focus:bg-white"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="College / Work Email"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-xs font-medium outline-none transition focus:border-black focus:bg-white"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min. 8 characters)"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-xs font-medium outline-none transition focus:border-black focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-4 text-xs font-bold text-white shadow-md transition hover:scale-[1.02] hover:bg-slate-800"
          >
            <span>Proceed to Role Selection</span>
            <ArrowRight
              size={16}
              className="transition group-hover:translate-x-1"
            />
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link to="/login" className="font-bold text-black hover:underline">
            Sign In here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Register;