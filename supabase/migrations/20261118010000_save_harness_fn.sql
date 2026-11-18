-- Atomic save/replace of a harness and all its parts. Called only by the server (service role)
-- after it has authenticated the user and run the leak scan.
create function public.save_harness(
  p_user_id text,
  p_name text,
  p_description text,
  p_source text,
  p_composed_from uuid[],
  p_parts jsonb,
  p_replace boolean
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.harnesses where user_id = p_user_id and name = p_name for update;
  if v_id is not null and not p_replace then
    raise exception 'HARNESS_EXISTS' using errcode = 'P0001';
  end if;

  if v_id is null then
    insert into public.harnesses (user_id, name, description, source, composed_from)
    values (p_user_id, p_name, p_description, p_source, coalesce(p_composed_from, '{}'))
    returning id into v_id;
  else
    update public.harnesses
      set description = p_description, source = p_source, composed_from = coalesce(p_composed_from, '{}')
      where id = v_id;
    delete from public.harness_parts where harness_id = v_id;
  end if;

  insert into public.harness_parts (harness_id, user_id, kind, name, content, position)
  select v_id, p_user_id, e ->> 'kind', e ->> 'name', e -> 'content', (o - 1)::int
  from jsonb_array_elements(p_parts) with ordinality as t(e, o);

  return v_id;
end
$$;

revoke execute on function public.save_harness(text, text, text, text, uuid[], jsonb, boolean) from public, anon, authenticated;
grant execute on function public.save_harness(text, text, text, text, uuid[], jsonb, boolean) to service_role;
