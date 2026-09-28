// src/components/CTA.jsx
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function CTA() {
  return (
    <section className="bg-black py-40 text-white">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl font-black md:text-7xl"
        >
          Ready to sync skills and
          <br />
          secure your future?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="mx-auto mt-8 max-w-2xl text-lg text-slate-400"
        >
          Join thousands of students, partner institutions, and hiring companies leveraging artificial intelligence for seamless campus placements.
        </motion.p>

        <Link to="/select-role" className="inline-block">
          <motion.div
            whileHover={{
              scale: 1.05,
              y: -3,
            }}
            className="group mt-12 inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-base font-bold text-black transition shadow-xl"
          >
            <span>Get Started Now</span>
            <ArrowRight
              className="transition group-hover:translate-x-1"
              size={20}
            />
          </motion.div>
        </Link>
      </div>
    </section>
  );
}

export default CTA;