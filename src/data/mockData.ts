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
    name: "Sub-Agent-1",
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
    name: "Sub-Agent-2",
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
  { name: "Website Builder", color: "#10b981", tasks: 6, progress: 45, agents: ["Rin", "Sub-Agent-1"], status: "active" as const },
  { name: "Betting Research", color: "#06b6d4", tasks: 4, progress: 20, agents: ["Rin", "Sub-Agent-2"], status: "active" as const },
  { name: "Infrastructure", color: "#f59e0b", tasks: 3, progress: 70, agents: ["Rin", "Sub-Agent-1"], status: "active" as const },
  { name: "System", color: "#6b7280", tasks: 2, progress: 90, agents: ["Rin"], status: "maintenance" as const },
];

export const initialTasks: Task[] = [
  { id: "task-001", title: "Build Akatsuki dashboard", project: "Infrastructure", description: "Create the command center UI", assigned_to: ["Rin", "Sub-Agent-1"], priority: "high", column: "doing", due_date: "2026-03-25", subtasks: [{ id: "s1", title: "Design Command Deck", completed: true }, { id: "s2", title: "Build Task Board", completed: false }, { id: "s3", title: "Build Agent Profiles", completed: false }], created_at: "2026-03-20T10:00:00Z", updated_at: "2026-03-22T14:30:00Z" },
  { id: "task-002", title: "API integration for betting data", project: "Betting Research", description: "Integrate with betting data APIs", assigned_to: ["Sub-Agent-2"], priority: "high", column: "doing", due_date: "2026-03-26", subtasks: [], created_at: "2026-03-19T08:00:00Z", updated_at: "2026-03-22T12:00:00Z" },
  { id: "task-003", title: "Website landing page design", project: "Website Builder", description: "Design the main landing page", assigned_to: ["Sub-Agent-1"], priority: "medium", column: "doing", due_date: "2026-03-24", subtasks: [{ id: "s4", title: "Hero section", completed: true }, { id: "s5", title: "Features section", completed: false }], created_at: "2026-03-18T09:00:00Z", updated_at: "2026-03-22T11:00:00Z" },
  { id: "task-004", title: "Set up CI/CD pipeline", project: "Infrastructure", description: "Configure deployment pipeline", assigned_to: ["Sub-Agent-1"], priority: "medium", column: "doing", due_date: "2026-03-27", subtasks: [], created_at: "2026-03-20T14:00:00Z", updated_at: "2026-03-22T10:00:00Z" },
  { id: "task-005", title: "Betting system architecture doc", project: "Betting Research", description: "Document the system architecture", assigned_to: ["Rin"], priority: "high", column: "todo", due_date: "2026-03-28", subtasks: [], created_at: "2026-03-22T08:00:00Z", updated_at: "2026-03-22T08:00:00Z" },
  { id: "task-006", title: "Design website mockups", project: "Website Builder", description: "Create high-fidelity mockups", assigned_to: ["Sub-Agent-1"], priority: "medium", column: "todo", due_date: "2026-03-29", subtasks: [], created_at: "2026-03-22T09:00:00Z", updated_at: "2026-03-22T09:00:00Z" },
  { id: "task-007", title: "Database schema design", project: "Infrastructure", description: "Design the database schema for all projects", assigned_to: ["Rin", "Sub-Agent-1"], priority: "high", column: "todo", due_date: "2026-03-26", subtasks: [], created_at: "2026-03-22T07:00:00Z", updated_at: "2026-03-22T07:00:00Z" },
  { id: "task-008", title: "Competitor analysis report", project: "Betting Research", description: "Analyze competitor betting platforms", assigned_to: ["Sub-Agent-2"], priority: "medium", column: "todo", due_date: "2026-03-30", subtasks: [], created_at: "2026-03-21T10:00:00Z", updated_at: "2026-03-21T10:00:00Z" },
  { id: "task-009", title: "User auth flow design", project: "Website Builder", description: "Design authentication user flows", assigned_to: ["Rin"], priority: "low", column: "todo", due_date: null, subtasks: [], created_at: "2026-03-21T14:00:00Z", updated_at: "2026-03-21T14:00:00Z" },
  { id: "task-010", title: "Clarify third-party API requirements", project: "Betting Research", description: "Need input on which APIs to use", assigned_to: ["Rin", "Sub-Agent-2"], priority: "urgent", column: "needs_input", due_date: "2026-03-23", subtasks: [], created_at: "2026-03-21T11:00:00Z", updated_at: "2026-03-22T13:00:00Z" },
  { id: "task-011", title: "Set up project repository", project: "Infrastructure", description: "Initialize Git repos and configs", assigned_to: ["Sub-Agent-1"], priority: "high", column: "done", due_date: "2026-03-19", subtasks: [], created_at: "2026-03-17T08:00:00Z", updated_at: "2026-03-19T16:00:00Z" },
  { id: "task-012", title: "Research website builders", project: "Website Builder", description: "Compare website builder technologies", assigned_to: ["Sub-Agent-2"], priority: "medium", column: "done", due_date: "2026-03-20", subtasks: [], created_at: "2026-03-17T09:00:00Z", updated_at: "2026-03-20T14:00:00Z" },
  { id: "task-013", title: "Initial agent setup", project: "System", description: "Configure and test all agents", assigned_to: ["Rin"], priority: "high", column: "done", due_date: "2026-03-18", subtasks: [], created_at: "2026-03-16T10:00:00Z", updated_at: "2026-03-18T12:00:00Z" },
  { id: "task-014", title: "Task board wireframe", project: "Infrastructure", description: "Wireframe the kanban board", assigned_to: ["Rin"], priority: "medium", column: "done", due_date: "2026-03-20", subtasks: [], created_at: "2026-03-18T08:00:00Z", updated_at: "2026-03-20T10:00:00Z" },
  { id: "task-015", title: "Collect betting data sources", project: "Betting Research", description: "Identify and catalog data sources", assigned_to: ["Sub-Agent-2"], priority: "high", column: "done", due_date: "2026-03-21", subtasks: [], created_at: "2026-03-18T11:00:00Z", updated_at: "2026-03-21T15:00:00Z" },
];

export const initialLogEntries: LogEntry[] = [
  { id: "log-01", agent: "Rin", agentEmoji: "🥷", category: "observation", message: "Analyzing betting system architecture. Identified 3 potential API providers with real-time odds data.", timestamp: "2 min ago", read: false },
  { id: "log-02", agent: "Sub-Agent-1", agentEmoji: "🔧", category: "task_update", message: "Website UI components 60% complete. Header, footer, and navigation done. Working on hero section.", timestamp: "5 min ago", read: false },
  { id: "log-03", agent: "Rin", agentEmoji: "🥷", category: "question", message: "Sub-Agent-1 needs clarification on third-party API requirements for the betting data pipeline.", timestamp: "12 min ago", read: true },
  { id: "log-04", agent: "Sub-Agent-2", agentEmoji: "📊", category: "observation", message: "Fetched competitor betting data from 47 sources. Compiling analysis report.", timestamp: "18 min ago", read: true },
  { id: "log-05", agent: "Rin", agentEmoji: "🥷", category: "general", message: "All agents synced. Task board updated with latest assignments. No blockers detected.", timestamp: "25 min ago", read: true },
  { id: "log-06", agent: "Sub-Agent-1", agentEmoji: "🔧", category: "task_update", message: "CI/CD pipeline configuration started. Using GitHub Actions with Docker.", timestamp: "30 min ago", read: true },
  { id: "log-07", agent: "Sub-Agent-2", agentEmoji: "📊", category: "general", message: "Research phase for website builders complete. Recommending Next.js + Supabase stack.", timestamp: "45 min ago", read: true },
  { id: "log-08", agent: "Rin", agentEmoji: "🥷", category: "task_update", message: "Moved 'Set up project repository' to Done. All repos initialized with proper configs.", timestamp: "1 hr ago", read: true },
  { id: "log-09", agent: "Sub-Agent-1", agentEmoji: "🔧", category: "error", message: "Build failed on landing page component — missing dependency. Resolved by adding framer-motion.", timestamp: "1.5 hr ago", read: true },
  { id: "log-10", agent: "Rin", agentEmoji: "🥷", category: "observation", message: "Detected potential bottleneck in task pipeline. Sub-Agent-2 idle for 15 min. Reassigning.", timestamp: "2 hr ago", read: true },
  { id: "log-11", agent: "Sub-Agent-2", agentEmoji: "📊", category: "task_update", message: "Competitor analysis: 12 platforms reviewed, 5 with relevant API access. Report draft ready.", timestamp: "3 hr ago", read: true },
  { id: "log-12", agent: "Rin", agentEmoji: "🥷", category: "general", message: "Morning sync complete. 3 agents online, 5 tasks in progress, 0 blockers.", timestamp: "4 hr ago", read: true },
];

export const initialThreads: Thread[] = [
  {
    id: "thread-rin",
    name: "Rin",
    emoji: "🥷",
    type: "direct",
    unreadCount: 2,
    messages: [
      { id: "m1", from: "Rin", fromEmoji: "🥷", to: "You", text: "Dashboard build is progressing well. Command Deck and Task Board are priorities.", timestamp: "10 min ago", read: true },
      { id: "m2", from: "You", fromEmoji: "👤", to: "Rin", text: "Good. Start the website builder research. Assign to Sub-1.", timestamp: "8 min ago", read: true },
      { id: "m3", from: "Rin", fromEmoji: "🥷", to: "You", text: "Done. Sub-Agent-1 assigned to website builder research. Task #42 created on Kanban.", timestamp: "6 min ago", read: true },
      { id: "m4", from: "Rin", fromEmoji: "🥷", to: "You", text: "Tasks updated on dashboard. 3 new items in To Do.", timestamp: "2 min ago", read: false },
      { id: "m5", from: "Rin", fromEmoji: "🥷", to: "You", text: "Also need your input on the third-party API selection for betting data.", timestamp: "1 min ago", read: false },
    ],
  },
  {
    id: "thread-sub1",
    name: "Sub-Agent-1",
    emoji: "🔧",
    type: "direct",
    unreadCount: 0,
    messages: [
      { id: "m6", from: "Rin", fromEmoji: "🥷", to: "Sub-Agent-1", text: "You're assigned: Website builder research. See task #42 on Kanban.", timestamp: "30 min ago", read: true },
      { id: "m7", from: "Sub-Agent-1", fromEmoji: "🔧", to: "Rin", text: "Got it. Starting now. Will update in 30 mins.", timestamp: "28 min ago", read: true },
      { id: "m8", from: "Sub-Agent-1", fromEmoji: "🔧", to: "You", text: "UI components for the landing page are 60% done. Should I prioritize the hero section or the features grid?", timestamp: "15 min ago", read: true },
      { id: "m9", from: "You", fromEmoji: "👤", to: "Sub-Agent-1", text: "Hero section first. Make it impactful.", timestamp: "12 min ago", read: true },
    ],
  },
  {
    id: "thread-sub2",
    name: "Sub-Agent-2",
    emoji: "📊",
    type: "direct",
    unreadCount: 1,
    messages: [
      { id: "m10", from: "Sub-Agent-2", fromEmoji: "📊", to: "You", text: "Finished collecting data from 47 betting sources. Ready to compile the report.", timestamp: "20 min ago", read: true },
      { id: "m11", from: "You", fromEmoji: "👤", to: "Sub-Agent-2", text: "Great work. Compile and share key findings first.", timestamp: "18 min ago", read: true },
      { id: "m12", from: "Sub-Agent-2", fromEmoji: "📊", to: "You", text: "Key finding: Only 5 out of 47 sources offer reliable real-time API access. Detailed report incoming.", timestamp: "5 min ago", read: false },
    ],
  },
  {
    id: "thread-group",
    name: "All Agents",
    emoji: "⚡",
    type: "group",
    unreadCount: 0,
    messages: [
      { id: "m13", from: "Rin", fromEmoji: "🥷", to: "Group", text: "Morning sync: All systems operational. 3 agents online.", timestamp: "4 hr ago", read: true },
      { id: "m14", from: "Sub-Agent-1", fromEmoji: "🔧", to: "Group", text: "Confirmed online. Working on website components.", timestamp: "4 hr ago", read: true },
      { id: "m15", from: "Sub-Agent-2", fromEmoji: "📊", to: "Group", text: "Online. Starting competitor data collection.", timestamp: "4 hr ago", read: true },
    ],
  },
];

export const calendarEvents: CalendarEvent[] = [
  { id: "ev-1", title: "Akatsuki Dashboard Due", type: "deadline", date: "2026-03-25", assignedTo: ["Rin", "Sub-Agent-1"] },
  { id: "ev-2", title: "API Integration Complete", type: "deadline", date: "2026-03-26", assignedTo: ["Sub-Agent-2"] },
  { id: "ev-3", title: "Landing Page Design", type: "deadline", date: "2026-03-24", assignedTo: ["Sub-Agent-1"] },
  { id: "ev-4", title: "Daily Data Sync", type: "cron", date: "2026-03-22", assignedTo: ["Rin"] },
  { id: "ev-5", title: "Daily Data Sync", type: "cron", date: "2026-03-23", assignedTo: ["Rin"] },
  { id: "ev-6", title: "Daily Data Sync", type: "cron", date: "2026-03-24", assignedTo: ["Rin"] },
  { id: "ev-7", title: "Weekly Report Generation", type: "cron", date: "2026-03-28", assignedTo: ["Sub-Agent-2"] },
  { id: "ev-8", title: "DB Schema Review", type: "deadline", date: "2026-03-26", assignedTo: ["Rin", "Sub-Agent-1"] },
  { id: "ev-9", title: "Competitor Report Due", type: "deadline", date: "2026-03-30", assignedTo: ["Sub-Agent-2"] },
  { id: "ev-10", title: "Sub-Agent-2 Maintenance", type: "unavailable", date: "2026-03-27", assignedTo: ["Sub-Agent-2"] },
];

export const activityFeed = [
  { agent: "Rin", emoji: "🥷", action: "Updated task board with 3 new assignments", timestamp: "2 min ago" },
  { agent: "Sub-Agent-1", emoji: "🔧", action: "Completed: Navigation component for website", timestamp: "5 min ago" },
  { agent: "Sub-Agent-2", emoji: "📊", action: "Finished: Data collection from 47 sources", timestamp: "18 min ago" },
  { agent: "Rin", emoji: "🥷", action: "Started: Betting system architecture analysis", timestamp: "25 min ago" },
  { agent: "Sub-Agent-1", emoji: "🔧", action: "Started: CI/CD pipeline configuration", timestamp: "30 min ago" },
  { agent: "Rin", emoji: "🥷", action: "Moved 'Set up project repository' to Done", timestamp: "1 hr ago" },
  { agent: "Sub-Agent-1", emoji: "🔧", action: "Resolved: Build error on landing page", timestamp: "1.5 hr ago" },
  { agent: "Sub-Agent-2", emoji: "📊", action: "Completed: Competitor analysis (12 platforms)", timestamp: "3 hr ago" },
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
