-- Abuse limits that work on serverless: counters live in Postgres, not in function memory.
--
-- usage_counters holds one row per (subject, kind, fixed window). hangar_rate_check bumps the
-- current window's row with a single atomic upsert and says whether the caller is still under
-- the limit. Subjects:
--   kind 'mcp_request' -> the api_tokens.id (as text): 120 requests per minute per token.
--   kind 'save'        -> the Clerk user id: 60 saves/composes per hour per user. Keyed by user,
--                         not token, because one user can hold up to 10 tokens and the website's
--                         compose action has no token at all; a per-token key would let both
--                         multiply the quota.
-- Limits and windows are fixed here, so a caller can't widen them.

create table public.usage_counters (
  subject text not null,
  kind text not null check (kind in ('mcp_request', 'save')),
  window_start timestamptz not null,
  count int not null default 1,
  primary key (subject, kind, window_start)
);

-- Server-only table: RLS on and no policies, so anon/authenticated see nothing.
alter table public.usage_counters enable row level security;
revoke all on public.usage_counters from anon, authenticated;

create function public.hangar_rate_check(p_subject text, p_kind text) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit int;
  v_window interval;
  v_start timestamptz;
  v_count int;
begin
  case p_kind
    when 'mcp_request' then v_limit := 120; v_window := interval '1 minute';
    when 'save' then v_limit := 60; v_window := interval '1 hour';
    else raise exception 'unknown rate limit kind: %', p_kind using errcode = '22023';
  end case;
  if p_subject is null or p_subject = '' then
    raise exception 'rate limit subject is required' using errcode = '22023';
  end if;

  -- Fixed windows aligned to the Unix epoch, so the app can compute when one resets.
  v_start := date_bin(v_window, now(), timestamptz '1970-01-01 00:00:00+00');

  insert into public.usage_counters as u (subject, kind, window_start, count)
  values (p_subject, p_kind, v_start, 1)
  on conflict (subject, kind, window_start) do update set count = u.count + 1
  returning u.count into v_count;

  -- Opportunistic cleanup (about 1 call in 100): drop windows that ended over an hour ago,
  -- so the table stays small without a cron job.
  if random() < 0.01 then
    delete from public.usage_counters where window_start < now() - interval '2 hours';
  end if;

  return v_count <= v_limit;
end
$$;

-- Bytes the user's harness parts take on disk (pg_column_size counts compressed/TOASTed size).
-- p_exclude_harness_id leaves out one harness, so replacing a harness is measured as
-- "everything else + the new version" rather than double-counting the old one.
create function public.user_storage_bytes(p_user_id text, p_exclude_harness_id uuid default null) returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(pg_column_size(p.content)), 0)::bigint
  from public.harness_parts p
  where p.user_id = p_user_id
    and (p_exclude_harness_id is null or p.harness_id <> p_exclude_harness_id);
$$;

revoke execute on function public.hangar_rate_check(text, text) from public, anon, authenticated;
grant execute on function public.hangar_rate_check(text, text) to service_role;
revoke execute on function public.user_storage_bytes(text, uuid) from public, anon, authenticated;
grant execute on function public.user_storage_bytes(text, uuid) to service_role;
