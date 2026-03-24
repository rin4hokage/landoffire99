export interface Agent {
  id: string;
  name: string;
  emoji: string;
  type: string;
  role: string;
  status: "active" | "idle" | "offline";
  currentTask: string | null;
  tasksCompletedThisWeek: number;
  lastSeen: string;
  skills: string[];
  accuracy: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  project: string;
  description: string;
  assigned_to: string[];
  priority: "urgent" | "high" | "medium" | "low";
  column: "todo" | "doing" | "needs_input" | "done";
  due_date: string | null;
  subtasks: SubTask[];
  created_at: string;
  updated_at: string;
}

export interface LogEntry {
  id: string;
  agent: string;
  agentEmoji: string;
  category: "observation" | "general" | "task_update" | "error" | "question";
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Message {
  id: string;
  from: string;
  fromEmoji: string;
  to: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Thread {
  id: string;
  name: string;
  emoji: string;
  type: "direct" | "group";
  messages: Message[];
  unreadCount: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: "deadline" | "cron" | "unavailable";
  date: string;
  assignedTo: string[];
}

export const agents: Agent[] = [
  {
    id: "rin",
    name: "Rin",
    emoji: "🥷",
    type: "Main Agent",
    role: "Lead Orchestrator",
    status: "active",
    currentTask: "Coordinating Akatsuki dashboard build",
    tasksCompletedThisWeek: 12,
    lastSeen: "Just now",
    skills: ["Orchestration", "Planning", "Delegation", "Analysis", "Communication"],
    accuracy: 97,
  },
  {
    id: "sub-1",
    name: "Hinata",
    emoji: "🔧",
    type: "Builder",
    role: "Code Agent",
    status: "active",
    currentTask: "Building website UI components",
    tasksCompletedThisWeek: 8,
    lastSeen: "2 min ago",
    skills: ["React", "TypeScript", "UI/UX", "API Integration", "Testing"],
    accuracy: 94,
  },
  {
    id: "sub-2",
    name: "Mikasa",
    emoji: "📊",
    type: "Analyst",
    role: "Research Agent",
    status: "idle",
    currentTask: null,
    tasksCompletedThisWeek: 3,
    lastSeen: "15 min ago",
    skills: ["Data Analysis", "Web Scraping", "Research", "Reporting"],
    accuracy: 91,
  },
];

export const projects = [
  { name: "Website Builder", color: "#10b981", tasks: 6, progress: 45, agents: ["Rin", "Hinata"], status: "active" as const },
  { name: "Betting Research", color: "#06b6d4", tasks: 4, progress: 20, agents: ["Rin", "Mikasa"], status: "active" as const },
  { name: "Infrastructure", color: "#f59e0b", tasks: 3, progress: 70, agents: ["Rin", "Hinata"], status: "active" as const },
  { name: "System", color: "#6b7280", tasks: 2, progress: 90, agents: ["Rin"], status: "maintenance" as const },
];

export const initialTasks: Task[] = [];

export const initialLogEntries: LogEntry[] = [
  { id: "log-01", agent: "Rin", agentEmoji: "🥷", category: "observation", message: "Analyzing betting system architecture. Identified 3 potential API providers with real-time odds data.", timestamp: "2 min ago", read: false },
  { id: "log-02", agent: "Hinata", agentEmoji: "🔧", category: "task_update", message: "Website UI components 60% complete. Header, footer, and navigation done. Working on hero section.", timestamp: "5 min ago", read: false },
  { id: "log-03", agent: "Rin", agentEmoji: "🥷", category: "question", message: "Hinata needs clarification on third-party API requirements for the betting data pipeline.", timestamp: "12 min ago", read: true },
  { id: "log-04", agent: "Mikasa", agentEmoji: "📊", category: "observation", message: "Fetched competitor betting data from 47 sources. Compiling analysis report.", timestamp: "18 min ago", read: true },
  { id: "log-05", agent: "Rin", agentEmoji: "🥷", category: "general", message: "All agents synced. Task board updated with latest assignments. No blockers detected.", timestamp: "25 min ago", read: true },
  { id: "log-06", agent: "Hinata", agentEmoji: "🔧", category: "task_update", message: "CI/CD pipeline configuration started. Using GitHub Actions with Docker.", timestamp: "30 min ago", read: true },
  { id: "log-07", agent: "Mikasa", agentEmoji: "📊", category: "general", message: "Research phase for website builders complete. Recommending Next.js + Supabase stack.", timestamp: "45 min ago", read: true },
  { id: "log-08", agent: "Rin", agentEmoji: "🥷", category: "task_update", message: "Moved 'Set up project repository' to Done. All repos initialized with proper configs.", timestamp: "1 hr ago", read: true },
  { id: "log-09", agent: "Hinata", agentEmoji: "🔧", category: "error", message: "Build failed on landing page component — missing dependency. Resolved by adding framer-motion.", timestamp: "1.5 hr ago", read: true },
  { id: "log-10", agent: "Rin", agentEmoji: "🥷", category: "observation", message: "Detected potential bottleneck in task pipeline. Mikasa idle for 15 min. Reassigning.", timestamp: "2 hr ago", read: true },
  { id: "log-11", agent: "Mikasa", agentEmoji: "📊", category: "task_update", message: "Competitor analysis: 12 platforms reviewed, 5 with relevant API access. Report draft ready.", timestamp: "3 hr ago", read: true },
  { id: "log-12", agent: "Rin", agentEmoji: "🥷", category: "general", message: "Morning sync complete. 3 agents online, 5 tasks in progress, 0 blockers.", timestamp: "4 hr ago", read: true },
];

export const initialThreads: Thread[] = [
  {
    id: "thread-rin",
    name: "Rin",
    emoji: "🥷",
    type: "direct",
    unreadCount: 0,
    messages: [],
  },
  {
    id: "thread-sub1",
    name: "Hinata",
    emoji: "🔧",
    type: "direct",
    unreadCount: 0,
    messages: [],
  },
  {
    id: "thread-sub2",
    name: "Mikasa",
    emoji: "📊",
    type: "direct",
    unreadCount: 0,
    messages: [],
  },
  {
    id: "thread-group",
    name: "All Agents",
    emoji: "⚡",
    type: "group",
    unreadCount: 0,
    messages: [],
  },
];

export const calendarEvents: CalendarEvent[] = [
  { id: "ev-1", title: "Akatsuki Dashboard Due", type: "deadline", date: "2026-03-25", assignedTo: ["Rin", "Hinata"] },
  { id: "ev-2", title: "API Integration Complete", type: "deadline", date: "2026-03-26", assignedTo: ["Mikasa"] },
  { id: "ev-3", title: "Landing Page Design", type: "deadline", date: "2026-03-24", assignedTo: ["Hinata"] },
  { id: "ev-4", title: "Daily Data Sync", type: "cron", date: "2026-03-22", assignedTo: ["Rin"] },
  { id: "ev-5", title: "Daily Data Sync", type: "cron", date: "2026-03-23", assignedTo: ["Rin"] },
  { id: "ev-6", title: "Daily Data Sync", type: "cron", date: "2026-03-24", assignedTo: ["Rin"] },
  { id: "ev-7", title: "Weekly Report Generation", type: "cron", date: "2026-03-28", assignedTo: ["Mikasa"] },
  { id: "ev-8", title: "DB Schema Review", type: "deadline", date: "2026-03-26", assignedTo: ["Rin", "Hinata"] },
  { id: "ev-9", title: "Competitor Report Due", type: "deadline", date: "2026-03-30", assignedTo: ["Mikasa"] },
  { id: "ev-10", title: "Mikasa Maintenance", type: "unavailable", date: "2026-03-27", assignedTo: ["Mikasa"] },
];

export const activityFeed = [
  { agent: "Rin", emoji: "🥷", action: "Updated task board with 3 new assignments", timestamp: "2 min ago" },
  { agent: "Hinata", emoji: "🔧", action: "Completed: Navigation component for website", timestamp: "5 min ago" },
  { agent: "Mikasa", emoji: "📊", action: "Finished: Data collection from 47 sources", timestamp: "18 min ago" },
  { agent: "Rin", emoji: "🥷", action: "Started: Betting system architecture analysis", timestamp: "25 min ago" },
  { agent: "Hinata", emoji: "🔧", action: "Started: CI/CD pipeline configuration", timestamp: "30 min ago" },
  { agent: "Rin", emoji: "🥷", action: "Moved 'Set up project repository' to Done", timestamp: "1 hr ago" },
  { agent: "Hinata", emoji: "🔧", action: "Resolved: Build error on landing page", timestamp: "1.5 hr ago" },
  { agent: "Mikasa", emoji: "📊", action: "Completed: Competitor analysis (12 platforms)", timestamp: "3 hr ago" },
];

export const projectColors: Record<string, string> = {
  "Website Builder": "#10b981",
  "Betting Research": "#06b6d4",
  "Infrastructure": "#f59e0b",
  "System": "#6b7280",
};

export const priorityColors: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f59e0b",
  medium: "#eab308",
  low: "#6b7280",
};

export const categoryColors: Record<string, string> = {
  observation: "#10b981",
  general: "#6b7280",
  task_update: "#f59e0b",
  error: "#ef4444",
  question: "#06b6d4",
};
