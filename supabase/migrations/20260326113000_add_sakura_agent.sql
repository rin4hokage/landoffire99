CREATE OR REPLACE FUNCTION public.seed_default_agents_for_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.agents (id, user_id, name, status)
  VALUES
    (gen_random_uuid(), target_user_id, 'Rin', 'idle'),
    (gen_random_uuid(), target_user_id, 'Sakura', 'idle'),
    (gen_random_uuid(), target_user_id, 'Hinata', 'idle'),
    (gen_random_uuid(), target_user_id, 'Mikasa', 'idle')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN SELECT id FROM auth.users LOOP
    PERFORM public.seed_default_agents_for_user(auth_user.id);
  END LOOP;
END;
$$;
