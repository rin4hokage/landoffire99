import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Repeat, Clock } from "lucide-react";
import { useProjects, useScheduledRuns, useTasks } from "@/hooks/useSupabaseData";

interface CalendarEvent {
  id: string;
  title: string;
  type: "deadline" | "cron";
  date: string;
  assignedTo: string[];
}

const eventColors: Record<string, string> = {
  deadline: "#10b981",
  cron: "#06b6d4",
  unavailable: "#6b7280",
};

const CalendarView = () => {
  const { tasks } = useTasks(5000);
  const { projects } = useProjects();
  const { scheduledRuns } = useScheduledRuns();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarEvents: CalendarEvent[] = [
    ...tasks
      .filter((task) => task.due_date)
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        type: "deadline" as const,
        date: task.due_date!,
        assignedTo: task.assigned_to ? [task.assigned_to] : [],
      })),
    ...projects
      .filter((project) => project.due_date)
      .map((project) => ({
        id: `project-${project.id}`,
        title: `${project.name} (project)`,
        type: "deadline" as const,
        date: project.due_date!,
        assignedTo: [],
      })),
    ...scheduledRuns
      .filter((run) => run.active && run.next_run_at)
      .map((run) => ({
        id: `cron-${run.id}`,
        title: run.title,
        type: "cron" as const,
        date: run.next_run_at!.slice(0, 10),
        assignedTo: [],
      })),
  ];

  const now = new Date();
  const week = new Date(now);
  week.setDate(now.getDate() + 7);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const getEventsForDay = (day: number): CalendarEvent[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return calendarEvents.filter((event) => event.date === dateStr);
  };

  const today =
    now.getFullYear() === year && now.getMonth() === month
      ? now.getDate()
      : -1;

  const upcomingEvents = calendarEvents
    .filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= week;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const nextScheduledRun = scheduledRuns
    .filter((run) => run.active && run.next_run_at)
    .sort((a, b) => (a.next_run_at || "").localeCompare(b.next_run_at || ""))[0];

  const kpis = [
    {
      label: "Tasks Due This Week",
      value: tasks.filter((task) => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= now && dueDate <= week;
      }).length,
      icon: CalendarDays,
    },
    {
      label: "Scheduled Runs",
      value: scheduledRuns.filter((run) => run.active).length,
      icon: Repeat,
    },
    {
      label: "Next Run",
      value: nextScheduledRun?.next_run_at
        ? new Date(nextScheduledRun.next_run_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "None",
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="kpi-card">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon size={16} className="text-primary" strokeWidth={1.5} />
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{kpi.label}</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
          </motion.div>
        ))}
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1 hover:bg-muted/30 rounded transition-colors">
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
          <span className="font-mono text-sm text-foreground">
            {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1 hover:bg-muted/30 rounded transition-colors">
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
            <div key={dayName} className="text-center text-[10px] font-mono text-muted-foreground py-1">{dayName}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {blanks.map((blank) => <div key={`b-${blank}`} />)}
          {days.map((day) => {
            const events = getEventsForDay(day);
            const isToday = day === today;

            return (
              <div
                key={day}
                className={`p-1 min-h-[60px] rounded text-xs ${isToday ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/20"} transition-colors`}
              >
                <span className={`font-mono text-[10px] ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>{day}</span>
                <div className="space-y-0.5 mt-0.5">
                  {events.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="text-[8px] px-1 py-0.5 rounded truncate"
                      style={{ backgroundColor: `${eventColors[event.type]}20`, color: eventColors[event.type] }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {events.length > 2 && <div className="text-[8px] text-muted-foreground">+{events.length - 2} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-4 space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Upcoming (7 days)</h3>
        <div className="space-y-2">
          {upcomingEvents.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-xs font-mono">No deadlines or scheduled runs in the next 7 days.</div>
          )}
          {upcomingEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/20 transition-colors">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: eventColors[event.type] }} />
              <span className="text-xs font-semibold flex-1">{event.title}</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <div className="flex gap-1">
                {event.assignedTo.map((assignee) => (
                  <span key={assignee} className="text-[10px] text-muted-foreground">{assignee}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
