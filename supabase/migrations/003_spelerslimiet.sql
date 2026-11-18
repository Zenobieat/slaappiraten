-- Spelerslimiet instelbaar door de kapitein + live updates voor aanwezigheden.
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
drop policy if exists "lezen" on public.settings;
drop policy if exists "kapitein" on public.settings;
create policy "lezen" on public.settings for select using (true);
create policy "kapitein" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.settings to anon, authenticated;
grant insert, update, delete on public.settings to authenticated;
insert into public.settings (key, value) values ('max_players', '7') on conflict (key) do nothing;

create or replace function public.max_players() returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::int from public.settings where key = 'max_players'), 7);
$$;

create or replace function public.max_seven() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'yes' and (tg_op = 'INSERT' or old.status is distinct from 'yes') then
    perform pg_advisory_xact_lock(hashtext(new.match_id));
    if (select count(*) from public.attendance where match_id = new.match_id and status = 'yes' and player_id <> new.player_id) >= public.max_players() then
      raise exception 'Schip is vol';
    end if;
  end if;
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'settings') then
    alter publication supabase_realtime add table public.settings;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'attendance') then
    alter publication supabase_realtime add table public.attendance;
  end if;
end $$;
