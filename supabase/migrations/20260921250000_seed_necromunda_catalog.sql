-- Seed the broad Necromunda gang catalog from the current official Necromunda: Skirmish structure.
-- The official Warhammer Community preview confirms the current Gangs of the Underhive
-- and Gangs of the Outlands books and the gang groups they contain.
-- Images and fighter-level detail remain optional and can be expanded later.

insert into public.mini_factions (system_id, name, subfaction)
values
  ('necromunda', 'House Cawdor', null),
  ('necromunda', 'House Delaque', null),
  ('necromunda', 'House Escher', null),
  ('necromunda', 'House Goliath', null),
  ('necromunda', 'House Orlock', null),
  ('necromunda', 'House Van Saar', null),
  ('necromunda', 'Palanite Enforcers', null),
  ('necromunda', 'Venator Gangs', null),
  ('necromunda', 'Corpse Grinder Cults', null),
  ('necromunda', 'Outcast Gangs', null),
  ('necromunda', 'Free Ogryn Gangs', null),
  ('necromunda', 'Genestealer Cults', null),
  ('necromunda', 'Genestealer Corrupted Gangs', null),
  ('necromunda', 'Chaos Helot Cults', null),
  ('necromunda', 'Chaos Corrupted Gangs', null),
  ('necromunda', 'Malstrain', null),
  ('necromunda', 'Malstrain Corrupted Gangs', null),
  ('necromunda', 'Spyre Hunting Parties', null),
  ('necromunda', 'Ironhead Squat Prospectors', null),
  ('necromunda', 'Ash Waste Nomads', null)
on conflict (system_id, name, subfaction) do nothing;

insert into public.mini_units (faction_id, name, unit_type, model_count_min, model_count_max)
select f.id, f.name, 'team', 1, 1
from public.mini_factions f
where f.system_id = 'necromunda'
  and not exists (
    select 1
    from public.mini_units u
    where u.faction_id = f.id
      and u.name = f.name
  );
