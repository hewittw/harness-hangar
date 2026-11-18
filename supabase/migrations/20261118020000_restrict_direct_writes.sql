-- Harness rows may only be written by the server (service role), which validates and leak-scans them.
-- Signed-in users can read their own rows and delete their own harnesses (parts cascade), nothing else.

drop policy "own harnesses" on public.harnesses;
drop policy "own parts" on public.harness_parts;

create policy "own harnesses read" on public.harnesses for select to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));
create policy "own harnesses delete" on public.harnesses for delete to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

create policy "own parts read" on public.harness_parts for select to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

revoke insert, update on public.harnesses from anon, authenticated;
revoke insert, update, delete on public.harness_parts from anon, authenticated;

-- Tokens: users may create and revoke their own, but never rewrite a token's hash or owner.
drop policy "own tokens revoke" on public.api_tokens;
create policy "own tokens revoke" on public.api_tokens for update to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));
revoke update on public.api_tokens from anon, authenticated;
grant update (revoked_at, label) on public.api_tokens to authenticated;
