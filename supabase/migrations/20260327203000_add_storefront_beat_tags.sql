CREATE TABLE IF NOT EXISTS public.storefront_beat_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  beat_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT storefront_beat_tags_beat_id_tag_key UNIQUE (beat_id, tag)
);

ALTER TABLE public.storefront_beat_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Storefront beat tags are viewable by everyone" ON public.storefront_beat_tags;
CREATE POLICY "Storefront beat tags are viewable by everyone"
ON public.storefront_beat_tags
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Storefront beat tags are insertable by everyone" ON public.storefront_beat_tags;
CREATE POLICY "Storefront beat tags are insertable by everyone"
ON public.storefront_beat_tags
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Storefront beat tags are updateable by everyone" ON public.storefront_beat_tags;
CREATE POLICY "Storefront beat tags are updateable by everyone"
ON public.storefront_beat_tags
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Storefront beat tags are deletable by everyone" ON public.storefront_beat_tags;
CREATE POLICY "Storefront beat tags are deletable by everyone"
ON public.storefront_beat_tags
FOR DELETE
TO anon, authenticated
USING (true);
