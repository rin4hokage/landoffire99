import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { initialTasks, projectColors, priorityColors, type Task } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const columns = [
  { id: "todo" as const, label: "To Do" },
  { id: "doing" as const, label: "Doing" },
  { id: "needs_input" as const, label: "Needs Input" },
  { id: "done" as const, label: "Done" },
];

const columnBorderColors: Record<string, string> = {
  todo: "#6b7280",
  doing: "#10b981",
  needs_input: "#f59e0b",
  done: "#06b6d4",
};

const TaskBoard = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: "", project: "Website Builder", description: "", assigned_to: "Rin", priority: "medium" as Task["priority"], due_date: "" });

  const handleDragStart = (taskId: string) => setDraggedTask(taskId);

  const handleDrop = (column: Task["column"]) => {
    if (!draggedTask) return;
    setTasks((prev) => prev.map((t) => (t.id === draggedTask ? { ...t, column } : t)));
    setDraggedTask(null);
  };

  const createTask = () => {
    if (!newTask.title.trim()) return;
    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      project: newTask.project,
      description: newTask.description,
      assigned_to: [newTask.assigned_to],
      priority: newTask.priority,
      column: "todo",
      due_date: newTask.due_date || null,
      subtasks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, task]);
    setNewTask({ title: "", project: "Website Builder", description: "", assigned_to: "Rin", priority: "medium", due_date: "" });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Kanban columns */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.column === col.id);
          return (
            <div
              key={col.id}
              className="glass-card p-3 min-h-[300px] flex flex-col"
              style={{ borderTop: `2px solid ${columnBorderColors[col.id]}` }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{col.label}</h3>
                <span className="text-xs font-mono text-muted-foreground">{colTasks.length}</span>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto">
                <AnimatePresence>
                  {colTasks.map((task) => (
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
                      <div className="flex items-start gap-2 mb-1.5">
                        <span className="priority-dot mt-1" style={{ backgroundColor: priorityColors[task.priority] }} />
                        <span className="text-sm font-semibold leading-tight">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: `${projectColors[task.project]}20`, color: projectColors[task.project] }}>
                          {task.project}
                        </span>
                        {task.due_date && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        {task.assigned_to.map((a) => (
                          <span key={a} className="text-[10px] text-muted-foreground">{a}</span>
                        ))}
                      </div>
                      {task.subtasks.length > 0 && (
                        <div className="mt-2">
                          <div className="h-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${(task.subtasks.filter((s) => s.completed).length / task.subtasks.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Panel */}
      <div className="glass-card p-4 w-full lg:w-72 space-y-3 flex-shrink-0">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Plus size={14} className="text-primary" /> New Task
        </h3>
        <Input placeholder="Task title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="bg-muted/30 border-border text-sm" />
        <Select value={newTask.project} onValueChange={(v) => setNewTask({ ...newTask, project: v })}>
          <SelectTrigger className="bg-muted/30 border-border text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.keys(projectColors).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Textarea placeholder="Description" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="bg-muted/30 border-border text-sm resize-none" rows={2} />
        <Select value={newTask.assigned_to} onValueChange={(v) => setNewTask({ ...newTask, assigned_to: v })}>
          <SelectTrigger className="bg-muted/30 border-border text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Rin">🥷 Rin</SelectItem>
            <SelectItem value="Sub-Agent-1">🔧 Sub-Agent-1</SelectItem>
            <SelectItem value="Sub-Agent-2">📊 Sub-Agent-2</SelectItem>
          </SelectContent>
        </Select>
        <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v as Task["priority"] })}>
          <SelectTrigger className="bg-muted/30 border-border text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="urgent">🔴 Urgent</SelectItem>
            <SelectItem value="high">🟠 High</SelectItem>
            <SelectItem value="medium">🟡 Medium</SelectItem>
            <SelectItem value="low">⚪ Low</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} className="bg-muted/30 border-border text-sm" />
        <Button onClick={createTask} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm">Create Task</Button>
      </div>
    </div>
  );
};

export default TaskBoard;
