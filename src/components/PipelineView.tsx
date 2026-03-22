import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projects, projectColors, agents } from "@/data/mockData";
import { Checkbox } from "@/components/ui/checkbox";

const phases = [
  { id: 1, name: "Context" },
  { id: 2, name: "Plan" },
  { id: 3, name: "Create" },
  { id: 4, name: "Build" },
  { id: 5, name: "Test" },
  { id: 6, name: "Heal" },
  { id: 7, name: "Retest" },
  { id: 8, name: "Close" },
];

interface PipelineProject {
  id: string;
  name: string;
  phase: number;
  status: "active" | "idle" | "stuck";
  agents: string[];
  timeInPhase: string;
  progress: number;
}

const initialPipelineProjects: PipelineProject[] = [
  { id: "pp-1", name: "Betting Research", phase: 1, status: "active", agents: ["Rin"], timeInPhase: "3 hours", progress: 80 },
  { id: "pp-2", name: "Website Builder", phase: 2, status: "active", agents: ["Sub-Agent-1", "Sub-Agent-2"], timeInPhase: "1 hour", progress: 35 },
  { id: "pp-3", name: "Website Builder", phase: 3, status: "active", agents: ["Sub-Agent-1", "Sub-Agent-2"], timeInPhase: "2 hours", progress: 95 },
  { id: "pp-4", name: "Betting Research", phase: 4, status: "idle", agents: ["Sub-Agent-1"], timeInPhase: "1 hour", progress: 40 },
  { id: "pp-5", name: "Infrastructure", phase: 3, status: "active", agents: ["Rin", "Sub-Agent-1"], timeInPhase: "45 min", progress: 60 },
  { id: "pp-6", name: "System", phase: 7, status: "stuck", agents: ["Rin"], timeInPhase: "30 min", progress: 50 },
];

const agentEmojiMap: Record<string, string> = {
  Rin: "🥷",
  "Sub-Agent-1": "🔧",
  "Sub-Agent-2": "📊",
};

const phaseBorderColors = [
  "#6b7280", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#f97316", "#22d3ee",
];

const PipelineView = () => {
  const [pipelineProjects, setPipelineProjects] = useState<PipelineProject[]>(initialPipelineProjects);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);

  const handleDragStart = (projectId: string) => setDraggedProject(projectId);

  const handleDrop = (phaseId: number) => {
    if (!draggedProject) return;
    setPipelineProjects((prev) =>
      prev.map((p) => (p.id === draggedProject ? { ...p, phase: phaseId, timeInPhase: "Just now", progress: 0 } : p))
    );
    setDraggedProject(null);
  };

  const visiblePhases = showCompleted ? phases : phases.filter((p) => p.id !== 8);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Controls */}
      <div className="glass-card p-3 flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          8-Phase Execution Pipeline
        </h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-completed"
            checked={showCompleted}
            onCheckedChange={(v) => setShowCompleted(!!v)}
          />
          <label htmlFor="show-completed" className="text-xs font-mono text-muted-foreground cursor-pointer">
            Show Close phase
          </label>
        </div>
      </div>

      {/* Pipeline Columns */}
      <div
        className="grid gap-3 flex-1 overflow-x-auto"
        style={{ gridTemplateColumns: `repeat(${visiblePhases.length}, minmax(160px, 1fr))` }}
      >
        {visiblePhases.map((phase) => {
          const phaseProjects = pipelineProjects.filter((p) => p.phase === phase.id);
          const hasActiveWork = phaseProjects.some((p) => p.status === "active");

          return (
            <div
              key={phase.id}
              className="glass-card p-3 min-h-[300px] flex flex-col transition-shadow duration-300"
              style={{
                borderTop: `2px solid ${phaseBorderColors[phase.id - 1]}`,
                boxShadow: hasActiveWork ? `0 0 12px ${phaseBorderColors[phase.id - 1]}15` : undefined,
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(phase.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  {phase.name} ({phase.id})
                </h3>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${phaseBorderColors[phase.id - 1]}20`,
                    color: phaseBorderColors[phase.id - 1],
                  }}
                >
                  {phaseProjects.length}
                </span>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                <AnimatePresence>
                  {phaseProjects.map((project) => {
                    const statusColor = project.status === "active" ? "#10b981" : project.status === "stuck" ? "#f59e0b" : "#6b7280";
                    return (
                      <motion.div
                        key={project.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        draggable
                        onDragStart={() => handleDragStart(project.id)}
                        className="glass-card-hover p-3 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: statusColor,
                              boxShadow: project.status === "active" ? `0 0 6px ${statusColor}` : undefined,
                            }}
                          />
                          <span className="text-sm font-semibold leading-tight truncate">{project.name}</span>
                        </div>

                        {/* Agents */}
                        <div className="flex items-center gap-1 mb-2 flex-wrap">
                          {project.agents.slice(0, 3).map((a) => (
                            <span
                              key={a}
                              className={`text-[10px] text-muted-foreground ${project.status === "active" ? "animate-pulse" : ""}`}
                            >
                              {agentEmojiMap[a] || "🤖"} {a.split("-")[0]}
                            </span>
                          ))}
                          {project.agents.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{project.agents.length - 3}</span>
                          )}
                        </div>

                        {/* Time in phase */}
                        <span className="text-[10px] text-muted-foreground font-mono block mb-2">
                          ⏱ {project.timeInPhase}
                        </span>

                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: phaseBorderColors[project.phase - 1] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{project.progress}%</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {phaseProjects.length === 0 && (
                  <div className="text-[10px] text-muted-foreground/50 font-mono text-center py-8">
                    No projects
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineView;
