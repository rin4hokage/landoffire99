CREATE TABLE IF NOT EXISTS public.storefront_site_config (
  id TEXT NOT NULL PRIMARY KEY,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.storefront_site_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Storefront site config is viewable by everyone" ON public.storefront_site_config;
CREATE POLICY "Storefront site config is viewable by everyone"
ON public.storefront_site_config
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Storefront site config is insertable by everyone" ON public.storefront_site_config;
CREATE POLICY "Storefront site config is insertable by everyone"
ON public.storefront_site_config
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Storefront site config is updateable by everyone" ON public.storefront_site_config;
CREATE POLICY "Storefront site config is updateable by everyone"
ON public.storefront_site_config
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Storefront site config is deletable by everyone" ON public.storefront_site_config;
CREATE POLICY "Storefront site config is deletable by everyone"
ON public.storefront_site_config
FOR DELETE
TO anon, authenticated
USING (true);

CREATE TABLE IF NOT EXISTS public.storefront_contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS storefront_contact_messages_submitted_at_idx
  ON public.storefront_contact_messages (submitted_at DESC);

ALTER TABLE public.storefront_contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Storefront contact messages are viewable by everyone" ON public.storefront_contact_messages;
CREATE POLICY "Storefront contact messages are viewable by everyone"
ON public.storefront_contact_messages
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Storefront contact messages are insertable by everyone" ON public.storefront_contact_messages;
CREATE POLICY "Storefront contact messages are insertable by everyone"
ON public.storefront_contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
