import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAgents, useProjects, useTasks } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { nextPhaseForAgent, phases, phaseStatusMap } from "@/lib/agents";

const phaseBorderColors = [
  "#6b7280",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#f97316",
  "#22d3ee",
];

const PipelineView = () => {
  const { tasks, updateTask } = useTasks(5000);
  const { agents, updateAgent } = useAgents();
  const { projects } = useProjects();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);

  const projectNameMap: Record<string, string> = {};
  projects.forEach((project) => {
    projectNameMap[project.id] = project.name;
  });

  const handleDragStart = (taskId: string) => setDraggedTaskId(taskId);

  const moveTaskToPhase = async (taskId: string, phaseId: number) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const { error } = await updateTask(task.id, {
      pipeline_phase: phaseId,
      status: phaseStatusMap[phaseId],
    });

    if (error) {
      toast.error(error.message || "Task could not move to the new phase.");
      return;
    }

    const assignedAgent = task.assigned_to ? agents.find((agent) => agent.name === task.assigned_to) : null;
    if (assignedAgent) {
      await updateAgent(assignedAgent.id, {
        current_task_id: phaseId === 8 ? null : task.id,
        last_activity: new Date().toISOString(),
        status: phaseId === 8 ? "idle" : phaseId >= 4 ? "working" : "busy",
      });
    }

    toast.success(`Moved "${task.title}" to ${phases.find((phase) => phase.id === phaseId)?.name}.`);
    setDraggedTaskId(null);
  };

  const handleDrop = async (phaseId: number) => {
    if (!draggedTaskId) return;
    await moveTaskToPhase(draggedTaskId, phaseId);
  };

  const autoAdvanceTask = async (taskId: string, currentPhase: number) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const nextPhase = task.assigned_to
      ? nextPhaseForAgent(task.assigned_to, currentPhase)
      : Math.min(currentPhase + 1, 8);
    await moveTaskToPhase(taskId, nextPhase);
  };

  const visiblePhases = showCompleted ? phases : phases.filter((phase) => phase.id !== 8);

  const assignedTasks = tasks.filter((task) => task.assigned_to);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="glass-card p-3 flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          8-Phase Execution Pipeline
        </h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-completed"
            checked={showCompleted}
            onCheckedChange={(value) => setShowCompleted(!!value)}
          />
          <label htmlFor="show-completed" className="text-xs font-mono text-muted-foreground cursor-pointer">
            Show Close phase
          </label>
        </div>
      </div>

      <div
        className="grid gap-3 flex-1 overflow-x-auto"
        style={{ gridTemplateColumns: `repeat(${visiblePhases.length}, minmax(170px, 1fr))` }}
      >
        {visiblePhases.map((phase) => {
          const phaseTasks = assignedTasks.filter((task) => task.pipeline_phase === phase.id);

          return (
            <div
              key={phase.id}
              className="glass-card p-3 min-h-[300px] flex flex-col transition-shadow duration-300"
              style={{ borderTop: `2px solid ${phaseBorderColors[phase.id - 1]}` }}
              onDragOver={(event) => event.preventDefault()}
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
                  {phaseTasks.length}
                </span>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                <AnimatePresence>
                  {phaseTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      className="glass-card-hover p-3 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: phaseBorderColors[phase.id - 1] }}
                        />
                        <span className="text-sm font-semibold leading-tight truncate">{task.title}</span>
                      </div>

                      {task.description && (
                        <p className="text-[10px] text-muted-foreground mb-2">{task.description}</p>
                      )}

                      <div className="flex items-center gap-1 mb-2 flex-wrap">
                        {task.assigned_to && (
                          <span className="text-[10px] text-muted-foreground">{task.assigned_to}</span>
                        )}
                        {task.project_id && projectNameMap[task.project_id] && (
                          <span className="text-[10px] text-muted-foreground">
                            | {projectNameMap[task.project_id]}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-muted-foreground font-mono block">
                        Status: {task.status}
                      </span>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-[10px] px-3 font-mono"
                          onClick={(event) => {
                            event.stopPropagation();
                            void autoAdvanceTask(task.id, task.pipeline_phase);
                          }}
                          disabled={task.pipeline_phase >= 8}
                        >
                          {task.pipeline_phase >= 8 ? "Closed" : `Run ${task.assigned_to}`}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {phaseTasks.length === 0 && (
                  <div className="text-[10px] text-muted-foreground/50 font-mono text-center py-8">
                    No assigned tasks
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
