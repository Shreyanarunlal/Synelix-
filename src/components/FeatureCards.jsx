// src/components/FeatureCards.jsx
import { motion } from "framer-motion";
import {
  GraduationCap,
  Building2,
  School,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const cards = [
  {
    icon: GraduationCap,
    title: "For Students",
    description:
      "Predict placement probability, evaluate skill-gaps against Tier-1 companies, follow a custom learning roadmap, and audit your resume with AI ATS analysis.",
    bg: "bg-white",
    path: "/student",
    buttonText: "Open Student Portal",
  },
  {
    icon: School,
    title: "For Institutions",
    description:
      "Track campus-wide placement stats, view department readiness distributions, manage corporate drives, and generate exportable AI placement audit reports.",
    bg: "bg-slate-50",
    path: "/institution",
    buttonText: "Open T&P Dashboard",
  },
  {
    icon: Building2,
    title: "For Companies",
    description:
      "Search, filter, and shortlist AI-ranked campus candidates by verified skills, CGPA, and DSA benchmarks. Accelerate your hiring cycles.",
    bg: "bg-slate-900 text-white",
    path: "/company",
    buttonText: "Open Recruiter Portal",
  },
];

function FeatureCards() {
  return (
    <section className="bg-white py-36">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="uppercase tracking-[0.35em] text-slate-500 font-bold text-xs">
            ONE UNIFIED ECOSYSTEM
          </p>

          <h2 className="mt-4 text-5xl font-black text-slate-900 md:text-6xl">
            Three Experiences.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-600">
            Tailored AI-driven interfaces for every stakeholder in campus recruitment.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.15,
                }}
                whileHover={{
                  y: -10,
                  scale: 1.02,
                }}
                className={`${card.bg} group flex flex-col justify-between rounded-[36px] p-10 shadow-xl transition-all duration-500 border border-slate-100`}
              >
                <div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100/90 text-black group-hover:rotate-6 transition">
                    <Icon size={32} />
                  </div>

                  <h3 className="mt-8 text-3xl font-bold">
                    {card.title}
                  </h3>

                  <p className="mt-4 text-sm leading-relaxed opacity-85">
                    {card.description}
                  </p>
                </div>

                <Link
                  to={card.path}
                  className="mt-10 inline-flex items-center gap-2 font-bold text-sm transition hover:gap-3"
                >
                  <span>{card.buttonText}</span>
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeatureCards;