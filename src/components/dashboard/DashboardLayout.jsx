import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AICopilotDrawer from "../ai/AICopilotDrawer";
import { Brain } from "lucide-react";

export default function DashboardLayout({
  children,
  role = "student",
  activeTab = "overview",
  onTabChange = () => {},
}) {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <Sidebar
        role={role}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* Main Content Area */}
      <div className="ml-72 flex min-h-screen flex-col">
        <Topbar
          role={role}
          activeTab={activeTab}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <main className="flex-1 p-8 lg:p-10">
          {children}
        </main>
      </div>

      {/* Floating AI Copilot Trigger */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-black px-5 py-3.5 text-sm font-bold text-white shadow-2xl transition hover:scale-105 hover:bg-slate-800"
        aria-label="Open AI Copilot"
      >
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
        </span>
        <Brain size={18} className="text-blue-400" />
        <span>Synelix AI</span>
      </button>

      {/* AI Copilot Drawer */}
      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        userRole={role}
      />
    </div>
  );
}