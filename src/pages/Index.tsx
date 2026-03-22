import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, KanbanSquare, Users, ScrollText, MessageCircle, Calendar, Wifi } from "lucide-react";
import CommandDeck from "@/components/CommandDeck";
import TaskBoard from "@/components/TaskBoard";
import AgentProfiles from "@/components/AgentProfiles";
import AILog from "@/components/AILog";
import Comms from "@/components/Comms";
import CalendarView from "@/components/CalendarView";

const tabs = [
  { id: "command", label: "Command", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: KanbanSquare },
  { id: "agents", label: "Agents", icon: Users },
  { id: "log", label: "Log", icon: ScrollText },
  { id: "comms", label: "Comms", icon: MessageCircle },
  { id: "calendar", label: "Calendar", icon: Calendar },
];

const tabComponents: Record<string, React.FC> = {
  command: CommandDeck,
  tasks: TaskBoard,
  agents: AgentProfiles,
  log: AILog,
  comms: Comms,
  calendar: CalendarView,
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("command");
  const ActiveComponent = tabComponents[activeTab];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-[0.2em] text-foreground">AKATSUKI</h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <span className="hidden sm:flex items-center gap-1.5">
              <span className="status-dot status-active animate-pulse-status" />
              Online
            </span>
            <span className="hidden md:block">Agents: <span className="text-primary">3 Active</span></span>
            <span className="hidden lg:block">Last Sync: <span className="text-foreground">now</span></span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-border px-4 overflow-x-auto">
        <div className="max-w-screen-2xl mx-auto flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-mono transition-colors relative whitespace-nowrap ${
                activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={14} strokeWidth={1.5} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ duration: 0.2 }}
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-screen-2xl mx-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
