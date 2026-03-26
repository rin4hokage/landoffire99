import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const TASK_RETENTION_HOURS = 24;
const LOG_RETENTION_HOURS = 48;

export interface DbTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  pipeline_phase: number;
  project_id: string | null;
  assigned_to: string | null;
  due_date: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface DbProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;
  due_date: string | null;
  created_at: string;
}

export interface DbComm {
  id: string;
  user_id: string;
  task_id: string | null;
  sender: string;
  message: string;
  created_at: string;
}

export interface DbActivityLog {
  id: string;
  user_id: string;
  task_id: string | null;
  agent_name: string;
  category: string;
  message: string;
  created_at: string;
}

export interface DbAgent {
  id: string;
  user_id: string;
  name: string;
  status: string;
  current_task_id: string | null;
  last_activity: string | null;
  created_at: string;
}

export interface DbScheduledRun {
  id: string;
  user_id: string;
  title: string;
  cron_expression: string;
  next_run_at: string | null;
  active: boolean;
  created_at: string;
}

export function useTasks(pollInterval = 5000) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DbTask[]>([]);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      return;
    }

    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      const now = Date.now();
      const expiredTasks = (data as DbTask[]).filter((task) => {
        if (task.status !== "done") return false;
        const completedAt = new Date(task.updated_at).getTime();
        return now - completedAt >= TASK_RETENTION_HOURS * 60 * 60 * 1000;
      });

      if (expiredTasks.length > 0) {
        await Promise.all(
          expiredTasks.map((task) => supabase.from("tasks").delete().eq("id", task.id))
        );
      }

      setTasks(
        (data as DbTask[]).filter((task) => !expiredTasks.some((expiredTask) => expiredTask.id === task.id))
      );
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, pollInterval);
    return () => clearInterval(interval);
  }, [fetchTasks, pollInterval]);

  const addTask = async (task: Partial<DbTask>) => {
    if (!user) return { data: null, error: new Error("You must be signed in to create tasks.") };

    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...task, user_id: user.id } as never)
      .select()
      .single();
    if (data && !error) setTasks((prev) => [data as DbTask, ...prev]);
    return { data, error };
  };

  const updateTask = async (id: string, updates: Partial<DbTask>) => {
    const { error } = await supabase.from("tasks").update(updates as never).eq("id", id);
    if (!error) setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    return { error };
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return { tasks, fetchTasks, addTask, updateTask, deleteTask };
}

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<DbProject[]>([]);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      return;
    }

    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProjects(data as DbProject[]);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (project: Partial<DbProject>) => {
    if (!user) return { data: null, error: new Error("You must be signed in to create projects.") };

    const { data, error } = await supabase
      .from("projects")
      .insert({ ...project, user_id: user.id } as never)
      .select()
      .single();
    if (data && !error) setProjects((prev) => [data as DbProject, ...prev]);
    return { data, error };
  };

  const updateProject = async (id: string, updates: Partial<DbProject>) => {
    const { error } = await supabase.from("projects").update(updates as never).eq("id", id);
    if (!error) setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    return { error };
  };

  return { projects, fetchProjects, addProject, updateProject };
}

export function useComms(taskId: string | null, pollInterval = 3000) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DbComm[]>([]);

  const fetchMessages = useCallback(async () => {
    if (!user || !taskId) { setMessages([]); return; }
    const { data } = await supabase
      .from("comms")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as DbComm[]);
  }, [taskId, user]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, pollInterval);
    return () => clearInterval(interval);
  }, [fetchMessages, pollInterval]);

  const sendMessage = async (message: string, activeTaskId: string, sender = "EJ") => {
    if (!user) return { data: null, error: new Error("You must be signed in to send messages.") };

    const { data, error } = await supabase
      .from("comms")
      .insert({ task_id: activeTaskId, user_id: user.id, sender, message } as never)
      .select()
      .single();
    if (data && !error) setMessages((prev) => [...prev, data as DbComm]);
    return { data, error };
  };

  return { messages, fetchMessages, sendMessage };
}

export function useAgents(pollInterval = 10000) {
  const { user } = useAuth();
  const [agents, setAgents] = useState<DbAgent[]>([]);

  const fetchAgents = useCallback(async () => {
    if (!user) {
      setAgents([]);
      return;
    }

    const { data } = await supabase
      .from("agents")
      .select("*");
    if (data) setAgents(data as DbAgent[]);
  }, [user]);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, pollInterval);
    return () => clearInterval(interval);
  }, [fetchAgents, pollInterval]);

  const updateAgent = async (id: string, updates: Partial<DbAgent>) => {
    const { error } = await supabase.from("agents").update(updates as never).eq("id", id);
    if (!error) setAgents((prev) => prev.map((agent) => (agent.id === id ? { ...agent, ...updates } : agent)));
    return { error };
  };

  return { agents, fetchAgents, updateAgent };
}

export function useDashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    tasksInProgress: 0,
    completedThisWeek: 0,
    agentsOnline: 0,
    totalAgents: 0,
    awaitingInput: 0,
  });

  const fetchStats = useCallback(async () => {
    if (!user) {
      setStats({
        tasksInProgress: 0,
        completedThisWeek: 0,
        agentsOnline: 0,
        totalAgents: 0,
        awaitingInput: 0,
      });
      return;
    }

    const [doingRes, doneRes, inputRes, agentsRes] = await Promise.all([
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "doing"),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "done")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "needs_input"),
      supabase.from("agents").select("*"),
    ]);

    const agentList = (agentsRes.data || []) as DbAgent[];
    setStats({
      tasksInProgress: doingRes.count || 0,
      completedThisWeek: doneRes.count || 0,
      agentsOnline: agentList.filter((a) => a.status !== "idle").length,
      totalAgents: agentList.length,
      awaitingInput: inputRes.count || 0,
    });
  }, [user]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return stats;
}

export function useScheduledRuns() {
  const { user } = useAuth();
  const [scheduledRuns, setScheduledRuns] = useState<DbScheduledRun[]>([]);

  const fetchScheduledRuns = useCallback(async () => {
    if (!user) {
      setScheduledRuns([]);
      return;
    }

    const { data } = await supabase
      .from("scheduled_runs")
      .select("*")
      .order("next_run_at", { ascending: true, nullsFirst: false });

    if (data) setScheduledRuns(data as DbScheduledRun[]);
  }, [user]);

  useEffect(() => {
    fetchScheduledRuns();
  }, [fetchScheduledRuns]);

  return { scheduledRuns, fetchScheduledRuns };
}

export function useActivityLogs(pollInterval = 5000) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DbActivityLog[]>([]);

  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLogs([]);
      return;
    }

    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) {
      const now = Date.now();
      const expiredLogs = (data as DbActivityLog[]).filter((entry) => {
        const createdAt = new Date(entry.created_at).getTime();
        return now - createdAt >= LOG_RETENTION_HOURS * 60 * 60 * 1000;
      });

      if (expiredLogs.length > 0) {
        await Promise.all(
          expiredLogs.map((entry) => supabase.from("activity_logs").delete().eq("id", entry.id))
        );
      }

      setLogs(
        (data as DbActivityLog[]).filter((entry) => !expiredLogs.some((expiredLog) => expiredLog.id === entry.id))
      );
    }
  }, [user]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, pollInterval);
    return () => clearInterval(interval);
  }, [fetchLogs, pollInterval]);

  const addLog = async (entry: Omit<DbActivityLog, "id" | "user_id" | "created_at">) => {
    if (!user) return { data: null, error: new Error("You must be signed in to write logs.") };

    const { data, error } = await supabase
      .from("activity_logs")
      .insert({ ...entry, user_id: user.id } as never)
      .select()
      .single();

    if (data && !error) setLogs((prev) => [data as DbActivityLog, ...prev]);
    return { data, error };
  };

  return { logs, fetchLogs, addLog };
}
