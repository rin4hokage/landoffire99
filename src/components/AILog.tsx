import { useState } from "react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActivityLogs } from "@/hooks/useSupabaseData";
import { agentInitialMap } from "@/lib/agentMeta";

const categoryColors: Record<string, string> = {
  observation: "#10b981",
  general: "#6b7280",
  task_update: "#f59e0b",
  error: "#ef4444",
  question: "#06b6d4",
};

const AILog = () => {
  const { logs } = useActivityLogs();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");

  const filtered = logs.filter((entry) => {
    if (categoryFilter !== "all" && entry.category !== categoryFilter) return false;
    if (agentFilter !== "all" && entry.agent_name !== agentFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 bg-muted/30 border-border text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="observation">Observation</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="task_update">Task Update</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="question">Question</SelectItem>
          </SelectContent>
        </Select>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-40 bg-muted/30 border-border text-sm"><SelectValue placeholder="Agent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            <SelectItem value="Rin">Rin</SelectItem>
            <SelectItem value="Sakura">Sakura</SelectItem>
            <SelectItem value="Hinata">Hinata</SelectItem>
            <SelectItem value="Mikasa">Mikasa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-xs font-mono">
            No activity yet. Run an agent to create the first log entry.
          </div>
        )}
        {filtered.map((entry, index) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="glass-card p-3 flex items-start gap-3 border-l-2 border-l-primary"
          >
            <span className="text-sm flex h-7 w-7 items-center justify-center rounded-full bg-muted/40 font-mono">
              {agentInitialMap[entry.agent_name] || "?"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-semibold">{entry.agent_name}</span>
                <span
                  className="category-badge"
                  style={{ backgroundColor: `${categoryColors[entry.category] || "#6b7280"}20`, color: categoryColors[entry.category] || "#6b7280" }}
                >
                  {entry.category.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{entry.message}</p>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap flex-shrink-0">
              {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AILog;
