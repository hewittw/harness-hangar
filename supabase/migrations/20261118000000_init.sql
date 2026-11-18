-- Hangar v1 schema. user_id is the Clerk user id (JWT "sub").

create table public.harnesses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  name text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 500),
  source text not null default 'upload' check (source in ('upload', 'compose')),
  composed_from uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.harness_parts (
  id uuid primary key default gen_random_uuid(),
  harness_id uuid not null references public.harnesses (id) on delete cascade,
  user_id text not null default (auth.jwt() ->> 'sub'),
  kind text not null check (kind in ('rule', 'skill', 'agent', 'mcp_server', 'permission', 'hook')),
  name text not null check (char_length(name) between 1 and 200),
  content jsonb not null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (harness_id, kind, name)
);
create index harness_parts_harness_id_idx on public.harness_parts (harness_id);
create index harness_parts_user_id_idx on public.harness_parts (user_id);

create table public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default (auth.jwt() ->> 'sub'),
  label text not null default 'Claude Code' check (char_length(label) between 1 and 60),
  token_hash text not null unique,
  token_prefix text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index api_tokens_user_id_idx on public.api_tokens (user_id);

alter table public.harnesses enable row level security;
alter table public.harness_parts enable row level security;
alter table public.api_tokens enable row level security;

create policy "own harnesses" on public.harnesses for all to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));

create policy "own parts" on public.harness_parts for all to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (
    user_id = (select auth.jwt() ->> 'sub')
    and exists (select 1 from public.harnesses h where h.id = harness_id and h.user_id = (select auth.jwt() ->> 'sub'))
  );

-- Browser can see and revoke its own tokens; it never sees the raw token (only the hash is stored).
create policy "own tokens read" on public.api_tokens for select to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));
create policy "own tokens insert" on public.api_tokens for insert to authenticated
  with check (user_id = (select auth.jwt() ->> 'sub'));
create policy "own tokens revoke" on public.api_tokens for update to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));
create policy "own tokens delete" on public.api_tokens for delete to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger harnesses_touch before update on public.harnesses
  for each row execute function public.touch_updated_at();
