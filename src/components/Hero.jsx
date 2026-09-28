// src/components/Hero.jsx
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative min-h-screen overflow-hidden pt-36"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            x: [0, 80, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-20 top-20 h-72 w-72 rounded-full bg-blue-400/10 blur-[120px]"
        />

        <motion.div
          animate={{
            x: [0, -70, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute right-20 bottom-20 h-96 w-96 rounded-full bg-indigo-300/20 blur-[140px]"
        />

        <motion.div
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
          }}
          className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[180px]"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 text-center">
        {/* Glass Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-2.5 shadow-md backdrop-blur-xl text-xs font-bold text-slate-800"
        >
          <Sparkles size={14} className="text-blue-600" />
          <span>AI-Powered Placement Prediction Platform</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.4,
            duration: 0.8,
          }}
          className="mt-8 text-6xl font-black leading-tight tracking-tight text-slate-900 md:text-8xl"
        >
          Sync Your Skills.
          <br />
          <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
            Secure Your Future.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.7,
            duration: 0.8,
          }}
          className="mx-auto mt-8 max-w-3xl text-lg md:text-xl leading-relaxed text-slate-600 font-medium"
        >
          A unified AI ecosystem evaluating employability, detecting skill gaps, predicting campus placement probability, and matching top engineering talent with recruiters.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 1,
            duration: 0.8,
          }}
          className="mt-12 flex flex-wrap justify-center gap-5"
        >
          <Link
            to="/select-role"
            className="group flex items-center gap-2 rounded-full bg-black px-8 py-4 text-base font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-2xl"
          >
            <span>Launch Platform</span>
            <ArrowRight
              className="transition-transform duration-300 group-hover:translate-x-1"
              size={18}
            />
          </Link>

          <a
            href="#features"
            className="rounded-full border border-slate-300 bg-white/80 px-8 py-4 text-base font-bold text-slate-800 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-white"
          >
            Explore Features
          </a>
        </motion.div>

        {/* Floating Glass Cards */}
        <Link to="/student">
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 5,
            }}
            className="absolute left-8 top-96 hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl backdrop-blur-xl lg:block text-left transition hover:scale-105 cursor-pointer"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              ATS Resume Score
            </p>
            <h2 className="mt-1 text-4xl font-black text-slate-900">
              91%
            </h2>
            <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              ATS Verified
            </span>
          </motion.div>
        </Link>

        <Link to="/student">
          <motion.div
            animate={{
              y: [0, 12, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 6,
            }}
            className="absolute right-10 top-96 hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl backdrop-blur-xl lg:block text-left transition hover:scale-105 cursor-pointer"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              AI Placement Probability
            </p>
            <h2 className="mt-1 text-4xl font-black text-blue-600">
              94%
            </h2>
            <span className="mt-2 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
              Tier-1 Product Fit
            </span>
          </motion.div>
        </Link>
      </div>
    </motion.section>
  );
}

export default Hero;