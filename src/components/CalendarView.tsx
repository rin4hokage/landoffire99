import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Repeat, Clock } from "lucide-react";
import { calendarEvents, type CalendarEvent } from "@/data/mockData";

const eventColors: Record<string, string> = {
  deadline: "#10b981",
  cron: "#06b6d4",
  unavailable: "#6b7280",
};

const kpis = [
  { label: "Tasks Due This Week", value: 3, icon: CalendarDays },
  { label: "Scheduled Runs", value: 4, icon: Repeat },
  { label: "Next Deadline", value: "Mar 24", icon: Clock },
];

const CalendarView = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2, 1)); // March 2026

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const getEventsForDay = (day: number): CalendarEvent[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return calendarEvents.filter((e) => e.date === dateStr);
  };

  const today = 22; // March 22, 2026

  const upcomingEvents = calendarEvents
    .filter((e) => {
      const d = new Date(e.date);
      const now = new Date(2026, 2, 22);
      const week = new Date(2026, 2, 29);
      return d >= now && d <= week;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Calendar */}
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
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-[10px] font-mono text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {blanks.map((b) => <div key={`b-${b}`} />)}
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
                  {events.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="text-[8px] px-1 py-0.5 rounded truncate"
                      style={{ backgroundColor: `${eventColors[ev.type]}20`, color: eventColors[ev.type] }}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {events.length > 2 && <div className="text-[8px] text-muted-foreground">+{events.length - 2} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Upcoming (7 days)</h3>
        <div className="space-y-2">
          {upcomingEvents.map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/20 transition-colors">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: eventColors[ev.type] }} />
              <span className="text-xs font-semibold flex-1">{ev.title}</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <div className="flex gap-1">
                {ev.assignedTo.map((a) => <span key={a} className="text-[10px] text-muted-foreground">{a}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
