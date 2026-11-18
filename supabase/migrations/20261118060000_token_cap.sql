-- Enforce the 10-active-token cap in the database, not just in the app.
-- Users can insert their own api_tokens rows through RLS, so the cap must hold for direct inserts too.
-- The advisory lock serializes concurrent inserts for the same user so they can't race past the count.
create function public.enforce_token_cap() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('api_tokens:' || new.user_id));
  if (select count(*) from public.api_tokens where user_id = new.user_id and revoked_at is null) >= 10 then
    raise exception 'TOKEN_LIMIT' using errcode = 'P0001';
  end if;
  return new;
end
$$;

revoke execute on function public.enforce_token_cap() from public, anon, authenticated;

create trigger api_tokens_cap before insert on public.api_tokens
  for each row execute function public.enforce_token_cap();
