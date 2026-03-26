import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTasks } from "@/hooks/useSupabaseData";
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

const priorityColors: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f59e0b",
  medium: "#eab308",
  low: "#6b7280",
};

const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

const statusCycle: Record<string, string> = {
  todo: "doing",
  doing: "needs_input",
  needs_input: "done",
  done: "todo",
};

const TaskBoard = () => {
  const { tasks, addTask, updateTask } = useTasks(5000);
  const [newTask, setNewTask] = useState({ title: "", project: "", assignee: "Rin", priority: "medium", due_date: "" });

  const createTask = async () => {
    if (!newTask.title.trim()) return;
    await addTask({
      title: newTask.title,
      project: newTask.project || "",
      assignee: newTask.assignee,
      priority: newTask.priority,
      status: "todo",
      due_date: newTask.due_date || null,
      description: "",
    });
    setNewTask({ title: "", project: "", assignee: "Rin", priority: "medium", due_date: "" });
  };

  const cycleStatus = async (taskId: string, currentStatus: string) => {
    const next = statusCycle[currentStatus] || "todo";
    await updateTask(taskId, { status: next });
  };

  const sortedTasks = (colTasks: typeof tasks) =>
    [...colTasks].sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

  return (
    <div className="flex flex-col gap-4 h-full">
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
            placeholder="Project..."
            value={newTask.project}
            onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
            className="bg-muted/30 border-border text-sm h-8 w-[140px]"
          />
          <Select value={newTask.assignee} onValueChange={(v) => setNewTask({ ...newTask, assignee: v })}>
            <SelectTrigger className="bg-muted/30 border-border text-sm h-8 w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Rin">🥷 Rin</SelectItem>
              <SelectItem value="Hinata">🔧 Hinata</SelectItem>
              <SelectItem value="Mikasa">📊 Mikasa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
            <SelectTrigger className="bg-muted/30 border-border text-sm h-8 w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">🔴 Urgent</SelectItem>
              <SelectItem value="high">🟠 High</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="low">⚪ Low</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={newTask.due_date}
            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
            className="bg-muted/30 border-border text-sm h-8 w-[140px]"
          />
          <Button onClick={createTask} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm h-8 px-4">
            Create
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 overflow-x-auto">
        {columns.map((col) => {
          const colTasks = sortedTasks(tasks.filter((t) => t.status === col.id));
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
                      <div className="flex items-start gap-2 mb-1.5">
                        <span className="priority-dot mt-1" style={{ backgroundColor: priorityColors[task.priority] || "#6b7280" }} />
                        <span className="text-sm font-semibold leading-tight">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.project && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono text-muted-foreground bg-muted/50">
                            {task.project}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-[10px] text-muted-foreground">{task.assignee}</span>
                      </div>
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
