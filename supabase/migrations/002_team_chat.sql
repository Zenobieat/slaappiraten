-- Ploegchat (Kajuit): alleen ingelogde spelers lezen en sturen, live via Realtime.
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  player_id uuid not null default auth.uid() references public.profiles on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists messages_created_at_idx on public.messages (created_at desc);
alter table public.messages enable row level security;
drop policy if exists "ploeg leest" on public.messages;
drop policy if exists "eigen bericht sturen" on public.messages;
drop policy if exists "eigen bericht wissen" on public.messages;
create policy "ploeg leest" on public.messages for select to authenticated using (true);
create policy "eigen bericht sturen" on public.messages for insert to authenticated with check (player_id = auth.uid());
create policy "eigen bericht wissen" on public.messages for delete to authenticated using (player_id = auth.uid() or public.is_admin());
revoke all on public.messages from anon;
grant select, insert, delete on public.messages to authenticated;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
