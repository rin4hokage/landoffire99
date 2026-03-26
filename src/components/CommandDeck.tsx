import { useState } from "react";
import { Zap, CheckCircle, Wifi, AlertCircle, Clock, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProjects, useDashboardStats, useAgents } from "@/hooks/useSupabaseData";
import rinAvatar from "@/assets/rin-avatar.jpg";
import hinataAvatar from "@/assets/hinata-avatar.jpg";
import mikasaAvatar from "@/assets/mikasa-avatar.jpg";

const agentAvatarMap: Record<string, string> = {
  Rin: rinAvatar,
  Hinata: hinataAvatar,
  Mikasa: mikasaAvatar,
};

const projectColorOptions = ["#10b981", "#06b6d4", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899"];

const statusClass = (s: string) =>
  s === "busy" || s === "working" ? "status-active" : "status-idle";

const CommandDeck = () => {
  const stats = useDashboardStats();
  const { projects, addProject, updateProject } = useProjects();
  const { agents } = useAgents();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "", color: "#10b981" });

  const kpis = [
    { label: "Tasks in Progress", value: stats.tasksInProgress, icon: Zap },
    { label: "Completed This Week", value: stats.completedThisWeek, icon: CheckCircle },
    { label: "Agents Online", value: `${stats.agentsOnline}/${stats.totalAgents}`, icon: Wifi },
    { label: "Awaiting Input", value: stats.awaitingInput, icon: AlertCircle },
    { label: "Upcoming Deadlines", value: 0, icon: Clock },
  ];

  const handleAddProject = async () => {
    if (!newProject.name.trim()) return;
    await addProject({
      name: newProject.name.trim(),
      description: newProject.description.trim(),
      color: newProject.color,
      status: "active",
    });
    setNewProject({ name: "", description: "", color: "#10b981" });
    setShowAddForm(false);
  };

  const activeProjects = projects.filter((p) => p.status === "active");

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kpi-card">
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Active Projects</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(!showAddForm)} className="text-primary hover:text-primary/80 h-7 gap-1 text-xs font-mono">
              <Plus size={14} /> Add Project
            </Button>
          </div>

          {showAddForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card p-3 space-y-3">
              <Input placeholder="Project name..." value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} className="bg-muted/30 border-border text-sm h-8" />
              <Textarea placeholder="Project description..." value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} className="bg-muted/30 border-border text-sm min-h-[60px] resize-none" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">Color:</span>
                {projectColorOptions.map((c) => (
                  <button key={c} onClick={() => setNewProject({ ...newProject, color: c })} className={`w-5 h-5 rounded-full transition-all ${newProject.color === c ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" : ""}`} style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddProject} className="h-7 text-xs font-mono px-4">Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)} className="h-7 text-xs font-mono text-muted-foreground">Cancel</Button>
              </div>
            </motion.div>
          )}

          <div className="space-y-2">
            {activeProjects.length === 0 && !showAddForm && (
              <div className="text-center py-8 text-muted-foreground text-xs font-mono">No active projects. Click "Add Project" to get started.</div>
            )}
            {activeProjects.map((p) => (
              <div key={p.id} className="glass-card-hover p-3">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="font-semibold text-sm">{p.name}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => updateProject(p.id, { status: "completed" })} className="h-6 text-[10px] font-mono text-muted-foreground hover:text-destructive">
                    Archive
                  </Button>
                </div>
                {p.description && <p className="text-xs text-muted-foreground mb-2 ml-4">{p.description}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 glass-card p-4 space-y-3">
          <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Agent Status</h3>
          <div className="space-y-2">
            {agents.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-xs font-mono">No agents configured.</div>
            )}
            {agents.map((a) => (
              <div key={a.id} className="glass-card-hover p-3">
                <div className="flex items-center gap-3">
                  <img src={agentAvatarMap[a.name] || rinAvatar} alt={a.name} className="w-8 h-8 rounded-full object-cover" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{a.name}</span>
                      <span className={`status-dot ${statusClass(a.status)} ${a.status !== "idle" ? "animate-pulse-status" : ""}`} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate capitalize">{a.status}</p>
                  </div>
                  {a.last_activity && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(a.last_activity).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandDeck;
