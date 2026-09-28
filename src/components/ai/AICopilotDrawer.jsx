// src/components/ai/AICopilotDrawer.jsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { copilotApi } from "../../services/api";
import {
  Brain,
  Sparkles,
  X,
  Send,
  Bot,
  User,
} from "lucide-react";

const INITIAL_MESSAGES = [
  {
    id: "m1",
    sender: "ai",
    text: "Hello! I am your **Synelix AI Copilot**. I analyze placement readiness, evaluate skill gaps, and guide students and recruiters towards optimal hiring outcomes.\n\nHow can I help you today?",
    timestamp: "Just now",
  },
];

const QUICK_PROMPTS = [
  "How can I boost my AI Placement Probability above 95%?",
  "What are the most tested DSA topics for Amazon & Google?",
  "Analyze my current skill gaps for Full Stack Developer",
  "Give me a high-impact bullet point for my resume",
];

export default function AICopilotDrawer({ isOpen, onClose, userRole = "student" }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const msgIdCounter = useRef(10);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    msgIdCounter.current += 1;
    const userMessage = {
      id: `msg-${msgIdCounter.current}`,
      sender: "user",
      text: query,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    copilotApi.chat(query, userRole)
      .then((res) => {
        if (res && res.reply) {
          msgIdCounter.current += 1;
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${msgIdCounter.current}`,
              sender: "ai",
              text: res.reply,
              timestamp: "Just now",
            },
          ]);
          setIsTyping(false);
          return;
        }
        throw new Error("Local fallback");
      })
      .catch(() => {
        let replyText = "";
        const q = query.toLowerCase();

        if (q.includes("boost") || q.includes("raise") || q.includes("probability") || q.includes("score")) {
          replyText = `### 🚀 Action Plan to Reach 95%+ Placement Readiness:

1. **DSA Target (Highest Weight 32%)**: Solve 50 more LeetCode Medium problems specifically in **Dynamic Programming** and **Graphs**. Currently at 345 solved; reaching 400 unlocks Tier-1 product cutoffs.
2. **Aptitude Mastery (20%)**: Practice timed mock tests in *Syllogisms* and *Data Interpretation* to push aptitude from 88% to 95%.
3. **Capstone Deployment (15%)**: Containerize your distributed task queue with Docker and deploy to AWS with a live URL & GitHub CI badge.
4. **ATS Polish**: Add keywords like **Microservices**, **Kafka**, and **JUnit** to pass company parsers effortlessly.`;
        } else if (q.includes("dsa") || q.includes("amazon") || q.includes("google") || q.includes("coding")) {
          replyText = `### 💡 Top Tested DSA Patterns for Tier-1 Companies:

- **Amazon**: Focus heavily on **Binary Trees / BFS**, **Priority Queues / Heaps**, and **Two-Pointer / Sliding Window** questions, along with the 14 Leadership Principles.
- **Google**: Emphasizes **Graph Traversals (Dijkstra/Topological Sort)**, **Dynamic Programming**, and clean modular code with edge-case handling.
- **Microsoft**: Frequent focus on **String manipulation**, **HashMaps / Trie**, and **Low-Level Design (LLD)**.

*Tip: Complete 3 timed mock sessions this week on Synelix's Assessment module.*`;
        } else if (q.includes("skill gap") || q.includes("skills") || q.includes("full stack")) {
          replyText = `### 📊 Skill Gap Assessment:

Based on the **Full Stack Developer Benchmark**:
- ✅ **Strengths**: Java (90%), React.js (88%), DSA (86%), SQL (80%).
- ⚠️ **Deficit Areas**:
  - **System Design**: Current 68% vs Target 75% *(Gap: -7%)*
  - **DevOps / Docker**: Current 65% vs Target 70% *(Gap: -5%)*

**Recommended next step**: Follow **Week 5 & 6** of your Synelix Roadmap to complete low-level architectural patterns and containerization.`;
        } else if (q.includes("resume") || q.includes("bullet") || q.includes("ats")) {
          replyText = `### 📄 High-Impact ATS Resume Bullet Template (XYZ Formula):

**Before**: "Built a distributed backend for task processing using Java and Redis."
**After (Synelix Optimized)**:
> *"Architected a high-throughput asynchronous task queue using **Java 21**, **Spring Boot**, and **Redis**, processing **10,000+ concurrent jobs** with **99.95% uptime** and reducing task latency by **35%**."*

Notice the inclusion of quantifiable metrics, active action verbs, and highlighted technologies that ATS parsers look for.`;
        } else {
          replyText = `### 🧠 Synelix AI Recommendation:

I've registered your question regarding **"${query}"**.

For candidates preparing for upcoming campus drives:
- Keep your **GitHub proof of work** updated.
- Verify your certifications on your Synelix student dossier.
- Use our **Interactive Placement Predictor** to simulate how adding an internship or 50 more DSA questions moves your salary band from Tier-2 to Tier-1!

Is there a specific company or technical assessment you'd like me to simulate?`;
        }

        msgIdCounter.current += 1;
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${msgIdCounter.current}`,
            sender: "ai",
            text: replyText,
            timestamp: "Just now",
          },
        ]);
        setIsTyping(false);
      });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 z-50 flex h-screen w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner">
                  <Brain className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-white">Synelix AI Copilot</h3>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-xs text-slate-400">
                    {userRole === "company"
                      ? "Recruitment & Candidate Match Intelligence"
                      : userRole === "institution"
                      ? "Institutional Placement Analytics Advisor"
                      : "Real-time Career & Placement Intelligence"}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
                aria-label="Close Copilot"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Chips */}
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Suggested Prompts
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:border-black hover:text-black transition"
                  >
                    <Sparkles size={12} className="text-blue-600" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${
                    m.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      m.sender === "user"
                        ? "bg-black text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {m.sender === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-3xl px-5 py-4 text-sm leading-relaxed ${
                      m.sender === "user"
                        ? "bg-black text-white rounded-tr-xs"
                        : "bg-slate-100 text-slate-800 rounded-tl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-line prose prose-sm max-w-none">
                      {m.text}
                    </div>
                    <span
                      className={`mt-2 block text-[10px] ${
                        m.sender === "user" ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Bot size={16} />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-3xl bg-slate-100 px-5 py-3 text-slate-500 text-xs">
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-2 font-medium">Synelix AI is analyzing...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="border-t border-slate-200 bg-white p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about placement probability, skill gaps, or interview questions..."
                  className="flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm text-slate-800 outline-none transition focus:border-black focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black text-white transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                >
                  <Send size={18} />
                </button>
              </form>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Powered by Synelix AI Placement Models</span>
                <span>Press Enter ↵ to send</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
