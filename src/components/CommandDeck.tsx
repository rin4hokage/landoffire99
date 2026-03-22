import { Zap, CheckCircle, Wifi, AlertCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { agents, projects, activityFeed } from "@/data/mockData";
import { Progress } from "@/components/ui/progress";

const kpis = [
  { label: "Tasks in Progress", value: 4, icon: Zap },
  { label: "Completed This Week", value: 23, icon: CheckCircle },
  { label: "Agents Online", value: "3/3", icon: Wifi },
  { label: "Awaiting Input", value: 1, icon: AlertCircle },
  { label: "Upcoming Deadlines", value: 2, icon: Clock },
];

const statusClass = (s: string) =>
  s === "active" ? "status-active" : s === "idle" ? "status-idle" : "status-offline";

const CommandDeck = () => (
  <div className="space-y-6">
    {/* KPI Row */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="kpi-card"
        >
          <div className="flex items-center gap-2 mb-2">
            <kpi.icon size={16} className="text-primary" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{kpi.label}</span>
          </div>
          <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
        </motion.div>
      ))}
    </div>

    {/* Projects + Agent Status */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 glass-card p-4 space-y-3">
        <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Active Projects</h3>
        <div className="space-y-2">
          {projects.map((p) => (
            <div key={p.name} className="glass-card-hover p-3 cursor-pointer">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-semibold text-sm">{p.name}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{p.tasks} tasks</span>
              </div>
              <Progress value={p.progress} className="h-1.5" />
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-1">
                  {p.agents.map((a) => (
                    <span key={a} className="text-xs text-muted-foreground">{a}</span>
                  ))}
                </div>
                <span className="text-xs font-mono text-primary">{p.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 glass-card p-4 space-y-3">
        <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Agent Status</h3>
        <div className="space-y-2">
          {agents.map((a) => (
            <div key={a.id} className="glass-card-hover p-3 cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-xl">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{a.name}</span>
                    <span className={`status-dot ${statusClass(a.status)} ${a.status === "active" ? "animate-pulse-status" : ""}`} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{a.currentTask || "No active task"}</p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{a.lastSeen}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Activity Feed */}
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Recent Activity</h3>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {activityFeed.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 p-2 rounded hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm">{item.emoji}</span>
            <span className="text-xs font-semibold text-foreground">{item.agent}</span>
            <span className="text-xs text-muted-foreground flex-1">{item.action}</span>
            <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{item.timestamp}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

export default CommandDeck;
