import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTasks, useProjects, useAgents } from "@/hooks/useSupabaseData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const { agents, updateAgent } = useAgents();
  const [newTask, setNewTask] = useState({ title: "", description: "", assigned_to: "unassigned", project_id: "none", due_date: "" });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Build project name lookup
  const projectNameMap: Record<string, string> = {};
  projects.forEach((p) => { projectNameMap[p.id] = p.name; });

  const createTask = async () => {
    if (!newTask.title.trim()) return;

    const { data, error } = await addTask({
      title: newTask.title,
      description: newTask.description || null,
      assigned_to: newTask.assigned_to !== "unassigned" ? newTask.assigned_to : null,
      project_id: newTask.project_id && newTask.project_id !== "none" ? newTask.project_id : null,
      due_date: newTask.due_date || null,
      status: "todo",
      pipeline_phase: newTask.assigned_to !== "unassigned" ? 2 : 1,
    });

    if (error) {
      toast.error(error.message || "Task could not be saved.");
      return;
    }

    const selectedAgent = agents.find((agent) => agent.name === newTask.assigned_to);
    if (selectedAgent && data) {
      await updateAgent(selectedAgent.id, {
        current_task_id: data.id,
        last_activity: new Date().toISOString(),
        status: "working",
      });
    }

    toast.success("Task saved.");
    setNewTask({ title: "", description: "", assigned_to: "unassigned", project_id: "none", due_date: "" });
  };

  const cycleStatus = async (taskId: string, currentStatus: string) => {
    if (currentStatus === "done") return;

    const next = statusCycle[currentStatus] || "todo";
    const { error } = await updateTask(taskId, { status: next });

    if (error) {
      toast.error(error.message || "Task status could not be updated.");
    }
  };

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;

  const getExpiryLabel = (taskUpdatedAt: string) => {
    const expiryTime = new Date(taskUpdatedAt).getTime() + 24 * 60 * 60 * 1000;
    const remainingMs = expiryTime - Date.now();
    if (remainingMs <= 0) return "Removing soon";

    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    return `Expires in ${hours}h ${minutes}m`;
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Create Task Form */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(260px,1.2fr)_minmax(320px,1fr)_150px_160px_170px_auto] gap-3 items-start">
          <Input
            placeholder="Task title..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && createTask()}
            className="bg-muted/30 border-border text-sm h-12 w-full"
          />
          <Textarea
            placeholder="Description..."
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="bg-muted/30 border-border text-sm min-h-[96px] w-full resize-y"
          />
          <Select value={newTask.assigned_to} onValueChange={(v) => setNewTask({ ...newTask, assigned_to: v })}>
            <SelectTrigger className="bg-muted/30 border-border text-sm h-12 w-full">
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
            <SelectTrigger className="bg-muted/30 border-border text-sm h-12 w-full">
              <SelectValue placeholder="Project..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Project</SelectItem>
              {projects.filter((p) => p.status === "active").map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={newTask.due_date}
            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
            className="bg-muted/30 border-border text-sm h-12 w-full"
          />
          <Button onClick={createTask} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm h-12 px-5 self-stretch">
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
                      onClick={() => {
                        if (task.status !== "done") {
                          void cycleStatus(task.id, task.status);
                        } else {
                          setSelectedTaskId(task.id);
                        }
                      }}
                      onDoubleClick={() => setSelectedTaskId(task.id)}
                      className={`glass-card-hover p-3 ${task.status === "done" ? "cursor-default opacity-80" : "cursor-pointer"}`}
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
                      {task.due_date && (
                        <p className="text-[9px] text-muted-foreground mt-1 font-mono">
                          Due {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                      {task.status === "done" && (
                        <p className="text-[9px] text-primary/70 mt-1 font-mono">
                          {getExpiryLabel(task.updated_at)}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>
              {selectedTask?.assigned_to || "Unassigned"} {selectedTask?.project_id && projectNameMap[selectedTask.project_id] ? `| ${projectNameMap[selectedTask.project_id]}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/20 p-4">
              <p className="text-sm leading-6 whitespace-pre-wrap">
                {selectedTask?.description || "No description provided."}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-muted-foreground">
              <span>Status: {selectedTask?.status}</span>
              <span>Created: {selectedTask ? new Date(selectedTask.created_at).toLocaleString() : ""}</span>
              {selectedTask?.due_date && (
                <span>Due: {new Date(selectedTask.due_date).toLocaleDateString()}</span>
              )}
              {selectedTask?.status === "done" && selectedTask.updated_at && (
                <span>{getExpiryLabel(selectedTask.updated_at)}</span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskBoard;
