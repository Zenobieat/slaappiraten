-- Supporters + max 7 spelers per wedstrijd (veilig om opnieuw te draaien)
-- Update voor bestaande databases: supporters toestaan
alter table public.attendance drop constraint if exists attendance_status_check;
alter table public.attendance add constraint attendance_status_check check (status in ('yes','maybe','no','fan'));

-- Maximum 7 spelers per wedstrijd (5 op het veld + 2 wissels)
create or replace function public.max_seven() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'yes' and (tg_op = 'INSERT' or old.status is distinct from 'yes') then
    perform pg_advisory_xact_lock(hashtext(new.match_id));
    if (select count(*) from public.attendance where match_id = new.match_id and status = 'yes' and player_id <> new.player_id) >= 7 then
      raise exception 'Schip is vol';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists max_seven on public.attendance;
create trigger max_seven before insert or update on public.attendance
  for each row execute function public.max_seven();

