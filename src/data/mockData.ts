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
    status: "idle",
    currentTask: null,
    tasksCompletedThisWeek: 0,
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
    status: "idle",
    currentTask: null,
    tasksCompletedThisWeek: 0,
    lastSeen: "Just now",
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
    tasksCompletedThisWeek: 0,
    lastSeen: "Just now",
    skills: ["Data Analysis", "Web Scraping", "Research", "Reporting"],
    accuracy: 91,
  },
];

export const projects: { name: string; color: string; tasks: number; progress: number; agents: string[]; status: "active" | "maintenance" }[] = [];

export const initialTasks: Task[] = [];

export const initialLogEntries: LogEntry[] = [];

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

export const calendarEvents: CalendarEvent[] = [];

export const activityFeed: { agent: string; emoji: string; action: string; timestamp: string }[] = [];

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
