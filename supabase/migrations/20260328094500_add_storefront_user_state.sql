CREATE TABLE IF NOT EXISTS public.storefront_user_state (
  user_id UUID NOT NULL PRIMARY KEY,
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  favorites TEXT[] NOT NULL DEFAULT '{}'::text[],
  playlist TEXT[] NOT NULL DEFAULT '{}'::text[],
  orders JSONB NOT NULL DEFAULT '[]'::jsonb,
  promo_codes TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.storefront_user_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Storefront user state is viewable by owner" ON public.storefront_user_state;
CREATE POLICY "Storefront user state is viewable by owner"
ON public.storefront_user_state
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Storefront user state is insertable by owner" ON public.storefront_user_state;
CREATE POLICY "Storefront user state is insertable by owner"
ON public.storefront_user_state
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Storefront user state is updateable by owner" ON public.storefront_user_state;
CREATE POLICY "Storefront user state is updateable by owner"
ON public.storefront_user_state
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Storefront user state is deletable by owner" ON public.storefront_user_state;
CREATE POLICY "Storefront user state is deletable by owner"
ON public.storefront_user_state
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
