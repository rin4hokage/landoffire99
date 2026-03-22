import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { agents } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";

const statusClass = (s: string) =>
  s === "active" ? "status-active" : s === "idle" ? "status-idle" : "status-offline";

const AgentProfiles = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent, i) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card-hover p-5 cursor-pointer"
          onClick={() => setExpanded(expanded === agent.id ? null : agent.id)}
        >
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{agent.emoji}</span>
            <div>
              <h3 className="text-lg font-bold">{agent.name}</h3>
              <p className="text-xs text-muted-foreground">{agent.type} · {agent.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className={`status-dot ${statusClass(agent.status)} ${agent.status === "active" ? "animate-pulse-status" : ""}`} />
            <span className="text-xs font-mono capitalize text-muted-foreground">{agent.status}</span>
            <span className="text-xs text-muted-foreground ml-auto font-mono">{agent.lastSeen}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="glass-card p-2 text-center">
              <span className="text-lg font-bold text-primary">{agent.tasksCompletedThisWeek}</span>
              <p className="text-[10px] text-muted-foreground font-mono">Tasks / Week</p>
            </div>
            <div className="glass-card p-2 text-center">
              <span className="text-lg font-bold text-primary">{agent.accuracy}%</span>
              <p className="text-[10px] text-muted-foreground font-mono">Accuracy</p>
            </div>
          </div>

          {agent.currentTask && (
            <div className="mb-3">
              <span className="text-[10px] text-muted-foreground font-mono uppercase">Current Task</span>
              <p className="text-xs text-foreground">{agent.currentTask}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-1 mb-3">
            {agent.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-[10px] bg-muted/50 text-muted-foreground border-none">
                {skill}
              </Badge>
            ))}
          </div>

          <button className="flex items-center gap-1 text-xs text-primary font-mono">
            {expanded === agent.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded === agent.id ? "Hide Details" : "View Details"}
          </button>

          <AnimatePresence>
            {expanded === agent.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3 pt-3 border-t border-border"
              >
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-mono">Total Tasks Completed</span>
                    <span className="text-foreground font-mono">{agent.tasksCompletedThisWeek * 4}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-mono">Avg Response Time</span>
                    <span className="text-foreground font-mono">{agent.id === "rin" ? "< 1s" : "2-5s"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-mono">Uptime (7d)</span>
                    <span className="text-foreground font-mono">{agent.status === "active" ? "99.8%" : "94.2%"}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

export default AgentProfiles;
