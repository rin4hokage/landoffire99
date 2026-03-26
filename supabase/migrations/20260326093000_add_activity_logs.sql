CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id BIGINT REFERENCES public.tasks(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'task_update',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.activity_logs;

CREATE POLICY "Users can view own activity logs" ON public.activity_logs
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs" ON public.activity_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
