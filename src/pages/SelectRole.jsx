// src/pages/SelectRole.jsx
import { useState } from "react";
import { AlertCircle, GraduationCap, School, Building2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function SelectRole() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated, user, homeFor } = useAuth();

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Set when arriving from the registration form; absent when an already
  // signed-in user opens this page directly.
  const pendingSignup = location.state?.pendingSignup;

  const choose = async (role, path) => {
    if (pendingSignup) {
      setBusy(true);
      setError("");
      try {
        const created = await register(
          pendingSignup.name,
          pendingSignup.email,
          pendingSignup.password,
          role
        );
        navigate(homeFor(created.role), { replace: true });
      } catch (err) {
        setError(err.message || "Could not create the account.");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (isAuthenticated) {
      // Roles are fixed at registration, so send them to their own portal
      // rather than letting the click imply they can switch.
      navigate(homeFor(user.role), { replace: true });
      return;
    }

    navigate("/login", { state: { from: path } });
  };

  const roles = [
    {
      title: "Student",
      badge: "Placement Readiness",
      icon: GraduationCap,
      description:
        "Predict placement probability, evaluate skill-gaps against Tier-1 firms, follow custom roadmaps, and optimize your resume.",
      path: "/student",
      role: "STUDENT",
    },
    {
      title: "Company",
      badge: "Talent Acquisition",
      icon: Building2,
      description:
        "Search pre-screened campus candidates with AI readiness scoring, verified skills, and streamlined interview shortlisting.",
      path: "/company",
      role: "COMPANY",
    },
    {
      title: "Institution",
      badge: "Placement & Training Cell",
      icon: School,
      description:
        "Monitor university-wide placement statistics, department readiness, campus drives, and generate automated AI audit reports.",
      path: "/institution",
      role: "INSTITUTION",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:border-black transition"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="uppercase tracking-[0.35em] text-slate-400 font-bold text-xs">
            SELECT PORTAL
          </p>

          <h1 className="mt-4 text-5xl md:text-6xl font-black text-slate-900">
            Choose Your Experience
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Experience Synelix tailored to your role in the placement ecosystem.
          </p>
        </motion.div>

        {error && (
          <div className="mx-auto mt-8 flex max-w-xl items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-xs font-medium text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {roles.map((role, index) => {
            const Icon = role.icon;

            return (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                whileHover={{
                  y: -10,
                  scale: 1.02,
                }}
                onClick={() => !busy && choose(role.role, role.path)}
                className="cursor-pointer rounded-[36px] bg-white p-10 shadow-lg transition-all duration-300 hover:shadow-2xl border border-slate-100 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white">
                      <Icon size={28} />
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                      {role.badge}
                    </span>
                  </div>

                  <h2 className="mt-8 text-3xl font-bold text-slate-900">
                    {role.title}
                  </h2>

                  <p className="mt-4 leading-relaxed text-sm text-slate-600">
                    {role.description}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  className="mt-10 w-full rounded-2xl bg-black py-4 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy ? "Creating account..." : `Launch ${role.title} Portal →`}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SelectRole;