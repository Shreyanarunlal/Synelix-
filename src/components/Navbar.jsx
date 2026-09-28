// src/components/Navbar.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ChevronDown } from "lucide-react";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 z-50 w-full px-4">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between rounded-full border transition-all duration-500 ease-out ${
          scrolled
            ? "mt-3 bg-white/90 border-slate-200 shadow-2xl backdrop-blur-xl px-8 py-3"
            : "mt-6 bg-white/70 border-white/60 backdrop-blur-md px-10 py-4 shadow-sm"
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white font-black text-sm">
            S
          </div>
          <span className="cursor-pointer text-2xl font-black tracking-tight text-slate-900 transition-transform duration-300 hover:scale-105">
            Synelix
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm font-semibold text-slate-600 transition hover:text-black"
          >
            Features
          </a>
          <a
            href="#how"
            className="text-sm font-semibold text-slate-600 transition hover:text-black"
          >
            How It Works
          </a>
          <a
            href="#ai"
            className="text-sm font-semibold text-slate-600 transition hover:text-black"
          >
            AI Engine
          </a>

          {/* Direct Portal Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPortalMenuOpen(!portalMenuOpen)}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 transition hover:text-black"
            >
              <span>Explore Portals</span>
              <ChevronDown size={14} />
            </button>

            {portalMenuOpen && (
              <div className="absolute left-0 mt-3 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
                <Link
                  to="/student"
                  onClick={() => setPortalMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  🎓 Student AI Portal
                </Link>
                <Link
                  to="/company"
                  onClick={() => setPortalMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  🏢 Recruiter / HR Portal
                </Link>
                <Link
                  to="/institution"
                  onClick={() => setPortalMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  🏛️ College T&P Dashboard
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden sm:inline-block text-xs font-bold text-slate-700 px-4 py-2 hover:text-black transition"
          >
            Sign In
          </Link>

          <Link
            to="/select-role"
            className="flex items-center gap-1.5 rounded-full bg-black px-6 py-2.5 text-xs font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-slate-800"
          >
            <Sparkles size={14} className="text-blue-400" />
            <span>Launch Portals</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;