import { useState } from "react";
import { motion } from "framer-motion";
import { initialLogEntries, categoryColors, type LogEntry } from "@/data/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AILog = () => {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");

  const filtered = initialLogEntries.filter((e) => {
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (agentFilter !== "all" && e.agent !== agentFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
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
            <SelectItem value="Rin">🥷 Rin</SelectItem>
            <SelectItem value="Sub-Agent-1">🔧 Sub-Agent-1</SelectItem>
            <SelectItem value="Sub-Agent-2">📊 Sub-Agent-2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Log entries */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {filtered.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`glass-card p-3 flex items-start gap-3 ${!entry.read ? "border-l-2 border-l-primary" : ""}`}
          >
            <span className="text-lg flex-shrink-0">{entry.agentEmoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-semibold">{entry.agent}</span>
                <span
                  className="category-badge"
                  style={{ backgroundColor: `${categoryColors[entry.category]}20`, color: categoryColors[entry.category] }}
                >
                  {entry.category.replace("_", " ")}
                </span>
                {!entry.read && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{entry.message}</p>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap flex-shrink-0">{entry.timestamp}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AILog;
