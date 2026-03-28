create table if not exists public.beat_reviews (
  id uuid primary key default gen_random_uuid(),
  beat_id text not null,
  user_id uuid,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.beat_reviews enable row level security;

drop policy if exists "Beat reviews are viewable by everyone" on public.beat_reviews;
create policy "Beat reviews are viewable by everyone"
on public.beat_reviews
for select
to anon, authenticated
using (true);

drop policy if exists "Beat reviews are insertable by authenticated users" on public.beat_reviews;
create policy "Beat reviews are insertable by authenticated users"
on public.beat_reviews
for insert
to authenticated
with check (auth.uid() = user_id);

create table if not exists public.beat_sales (
  id uuid primary key default gen_random_uuid(),
  beat_id text not null,
  user_id uuid,
  license_type text not null,
  price integer not null,
  license_key text not null unique,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.beat_sales enable row level security;

drop policy if exists "Beat sales are viewable by owner" on public.beat_sales;
create policy "Beat sales are viewable by owner"
on public.beat_sales
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Beat sales are insertable by owner" on public.beat_sales;
create policy "Beat sales are insertable by owner"
on public.beat_sales
for insert
to authenticated
with check (auth.uid() = user_id);

create table if not exists public.email_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'homepage',
  created_at timestamptz not null default now()
);

alter table public.email_signups enable row level security;

drop policy if exists "Email signups are insertable by everyone" on public.email_signups;
create policy "Email signups are insertable by everyone"
on public.email_signups
for insert
to anon, authenticated
with check (true);
