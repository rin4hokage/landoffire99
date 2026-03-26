DELETE FROM public.comms;
DELETE FROM public.activity_logs;
UPDATE public.agents
SET
  current_task_id = NULL,
  status = 'idle',
  last_activity = now();

DELETE FROM public.tasks;
