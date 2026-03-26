import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAgents, useTasks } from "@/hooks/useSupabaseData";
import rinAvatar from "@/assets/rin-avatar.jpg";
import hinataAvatar from "@/assets/hinata-avatar.jpg";
import mikasaAvatar from "@/assets/mikasa-avatar.jpg";
import { agentPhaseMap, agentRoleMap, nextPhaseForAgent, phaseStatusMap, phases } from "@/lib/agents";

const agentAvatarMap: Record<string, string> = {
  Rin: rinAvatar,
  Hinata: hinataAvatar,
  Mikasa: mikasaAvatar,
};

const statusClass = (s: string) =>
  s === "busy" || s === "working" ? "status-active" : "status-idle";

const AgentProfiles = () => {
  const { agents, updateAgent } = useAgents();
  const { tasks, updateTask } = useTasks(5000);
  const [expanded, setExpanded] = useState<string | null>(null);

  const runAgent = async (agentId: string) => {
    const agent = agents.find((item) => item.id === agentId);
    if (!agent) return;

    const ownedPhases = agentPhaseMap[agent.name] || [];
    const task = tasks.find((item) => item.assigned_to === agent.name && item.pipeline_phase < 8 && ownedPhases.includes(item.pipeline_phase));

    if (!task) {
      toast.message(`${agent.name} has nothing queued in their phases right now.`);
      return;
    }

    const nextPhase = nextPhaseForAgent(agent.name, task.pipeline_phase);
    const { error } = await updateTask(task.id, {
      pipeline_phase: nextPhase,
      status: phaseStatusMap[nextPhase],
    });

    if (error) {
      toast.error(error.message || `${agent.name} could not run the task.`);
      return;
    }

    await updateAgent(agent.id, {
      current_task_id: nextPhase === 8 ? null : task.id,
      last_activity: new Date().toISOString(),
      status: nextPhase === 8 ? "idle" : nextPhase >= 4 ? "working" : "busy",
    });

    toast.success(`${agent.name} moved "${task.title}" to ${phases.find((phase) => phase.id === nextPhase)?.name}.`);
  };

  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-xs font-mono">
        No agents configured. Agents will appear here once added to the database.
      </div>
    );
  }

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
            <img
              src={agentAvatarMap[agent.name] || rinAvatar}
              alt={agent.name}
              className="w-12 h-12 rounded-full object-cover"
              loading="lazy"
              width={48}
              height={48}
            />
            <div>
              <h3 className="text-lg font-bold">{agent.name}</h3>
              <p className="text-xs text-muted-foreground">{agentRoleMap[agent.name] || agent.status}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className={`status-dot ${statusClass(agent.status)} ${agent.status !== "idle" ? "animate-pulse-status" : ""}`} />
            <span className="text-xs font-mono capitalize text-muted-foreground">{agent.status}</span>
            {agent.last_activity && (
              <span className="text-xs text-muted-foreground ml-auto font-mono">
                {new Date(agent.last_activity).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
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
                    <span className="text-muted-foreground font-mono">Current Task</span>
                    <span className="text-foreground font-mono">{agent.current_task_id ? "Assigned" : "None"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-mono">Status</span>
                    <span className="text-foreground font-mono capitalize">{agent.status}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-mono">Handles</span>
                    <span className="text-foreground font-mono">
                      {(agentPhaseMap[agent.name] || []).map((phase) => phases.find((item) => item.id === phase)?.name).join(", ")}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs font-mono"
                    onClick={(event) => {
                      event.stopPropagation();
                      void runAgent(agent.id);
                    }}
                  >
                    Run {agent.name}
                  </Button>
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
