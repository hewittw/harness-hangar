-- One row per user once their account has been given the preinstalled basics.
-- Server-only (service role): RLS on, no policies, no grants to anon/authenticated.
create table public.user_flags (
  user_id text primary key,
  seeded_at timestamptz not null default now()
);
alter table public.user_flags enable row level security;
revoke all on public.user_flags from anon, authenticated;
