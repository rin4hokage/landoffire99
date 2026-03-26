import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTasks, useProjects, useAgents } from "@/hooks/useSupabaseData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const columns = [
  { id: "todo", label: "To Do" },
  { id: "doing", label: "Doing" },
  { id: "needs_input", label: "Needs Input" },
  { id: "done", label: "Done" },
];

const columnBorderColors: Record<string, string> = {
  todo: "#6b7280",
  doing: "#10b981",
  needs_input: "#f59e0b",
  done: "#06b6d4",
};

const statusCycle: Record<string, string> = {
  todo: "doing",
  doing: "needs_input",
  needs_input: "done",
  done: "todo",
};

const TaskBoard = () => {
  const { tasks, addTask, updateTask } = useTasks(5000);
  const { projects } = useProjects();
  const { agents } = useAgents();
  const [newTask, setNewTask] = useState({ title: "", description: "", assigned_to: "unassigned", project_id: "none" });

  // Build project name lookup
  const projectNameMap: Record<string, string> = {};
  projects.forEach((p) => { projectNameMap[p.id] = p.name; });

  const createTask = async () => {
    if (!newTask.title.trim()) return;

    const { error } = await addTask({
      title: newTask.title,
      description: newTask.description || null,
      assigned_to: newTask.assigned_to !== "unassigned" ? newTask.assigned_to : null,
      project_id: newTask.project_id && newTask.project_id !== "none" ? newTask.project_id : null,
      status: "todo",
    });

    if (error) {
      toast.error(error.message || "Task could not be saved.");
      return;
    }

    toast.success("Task saved.");
    setNewTask({ title: "", description: "", assigned_to: "unassigned", project_id: "none" });
  };

  const cycleStatus = async (taskId: string, currentStatus: string) => {
    const next = statusCycle[currentStatus] || "todo";
    const { error } = await updateTask(taskId, { status: next });

    if (error) {
      toast.error(error.message || "Task status could not be updated.");
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Create Task Form */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Task title..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && createTask()}
            className="bg-muted/30 border-border text-sm h-8 flex-1 min-w-[150px]"
          />
          <Input
            placeholder="Description..."
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="bg-muted/30 border-border text-sm h-8 w-[180px]"
          />
          <Select value={newTask.assigned_to} onValueChange={(v) => setNewTask({ ...newTask, assigned_to: v })}>
            <SelectTrigger className="bg-muted/30 border-border text-sm h-8 w-[150px]">
              <SelectValue placeholder="Assign agent..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.name}>{agent.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={newTask.project_id} onValueChange={(v) => setNewTask({ ...newTask, project_id: v })}>
            <SelectTrigger className="bg-muted/30 border-border text-sm h-8 w-[160px]">
              <SelectValue placeholder="Project..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Project</SelectItem>
              {projects.filter((p) => p.status === "active").map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={createTask} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm h-8 px-4">
            + Task
          </Button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="glass-card p-3 min-h-[300px] flex flex-col"
              style={{ borderTop: `2px solid ${columnBorderColors[col.id]}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{col.label}</h3>
                <span className="text-xs font-mono text-muted-foreground">{colTasks.length}</span>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                <AnimatePresence>
                  {colTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => cycleStatus(task.id, task.status)}
                      className="glass-card-hover p-3 cursor-pointer"
                    >
                      <span className="text-sm font-semibold leading-tight block mb-1">{task.title}</span>
                      {task.description && (
                        <p className="text-[10px] text-muted-foreground mb-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {task.project_id && projectNameMap[task.project_id] && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono text-muted-foreground bg-muted/50">
                            {projectNameMap[task.project_id]}
                          </span>
                        )}
                        {task.assigned_to && (
                          <span className="text-[10px] text-muted-foreground">-&gt; {task.assigned_to}</span>
                        )}
                      </div>
                      <p className="text-[9px] text-muted-foreground/50 mt-1 font-mono">
                        {new Date(task.created_at).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskBoard;
