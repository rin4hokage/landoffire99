import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DbTask {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  project: string;
  assignee: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProject {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  status: string;
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

export interface DbAgent {
  id: string;
  user_id: string;
  name: string;
  status: string;
  current_task_id: string | null;
  last_activity: string | null;
  created_at: string;
}

export function useTasks(pollInterval = 5000) {
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTasks(data as DbTask[]);
  }, [user]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, pollInterval);
    return () => clearInterval(interval);
  }, [fetchTasks, pollInterval]);

  const addTask = async (task: Partial<DbTask>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...task, user_id: user.id } as any)
      .select()
      .single();
    if (data && !error) setTasks((prev) => [data as DbTask, ...prev]);
    return { data, error };
  };

  const updateTask = async (id: string, updates: Partial<DbTask>) => {
    const { error } = await supabase.from("tasks").update(updates as any).eq("id", id);
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
  const [projects, setProjects] = useState<DbProject[]>([]);
  const { user } = useAuth();

  const fetchProjects = useCallback(async () => {
    if (!user) return;
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
    if (!user) return;
    const { data, error } = await supabase
      .from("projects")
      .insert({ ...project, user_id: user.id } as any)
      .select()
      .single();
    if (data && !error) setProjects((prev) => [data as DbProject, ...prev]);
    return { data, error };
  };

  const updateProject = async (id: string, updates: Partial<DbProject>) => {
    const { error } = await supabase.from("projects").update(updates as any).eq("id", id);
    if (!error) setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  return { projects, fetchProjects, addProject, updateProject };
}

export function useComms(taskId: string | null, pollInterval = 3000) {
  const [messages, setMessages] = useState<DbComm[]>([]);
  const { user } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!user || !taskId) { setMessages([]); return; }
    const { data } = await supabase
      .from("comms")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data as DbComm[]);
  }, [user, taskId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, pollInterval);
    return () => clearInterval(interval);
  }, [fetchMessages, pollInterval]);

  const sendMessage = async (message: string, taskId: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("comms")
      .insert({ user_id: user.id, task_id: taskId, sender: "EJ", message } as any)
      .select()
      .single();
    if (data && !error) setMessages((prev) => [...prev, data as DbComm]);
    return { data, error };
  };

  return { messages, fetchMessages, sendMessage };
}

export function useAgents(pollInterval = 10000) {
  const [agents, setAgents] = useState<DbAgent[]>([]);
  const { user } = useAuth();

  const fetchAgents = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("agents")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setAgents(data as DbAgent[]);
  }, [user]);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, pollInterval);
    return () => clearInterval(interval);
  }, [fetchAgents, pollInterval]);

  return { agents, fetchAgents };
}

export function useDashboardStats() {
  const [stats, setStats] = useState({
    tasksInProgress: 0,
    completedThisWeek: 0,
    agentsOnline: 0,
    totalAgents: 0,
    awaitingInput: 0,
  });
  const { user } = useAuth();

  const fetchStats = useCallback(async () => {
    if (!user) return;

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
