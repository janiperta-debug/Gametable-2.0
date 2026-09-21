-- Broad current Warhammer: The Old World army catalog.
-- The current edition has nine returning legacy factions plus Grand Cathay;
-- keep this first pass at army level and expand units later.

insert into public.mini_factions (system_id, name, subfaction)
values
  ('the_old_world', 'Kingdom of Bretonnia', null),
  ('the_old_world', 'Empire of Man', null),
  ('the_old_world', 'Dwarfen Mountain Holds', null),
  ('the_old_world', 'Wood Elf Realms', null),
  ('the_old_world', 'High Elf Kingdoms', null),
  ('the_old_world', 'Tomb Kings of Khemri', null),
  ('the_old_world', 'Orc & Goblin Tribes', null),
  ('the_old_world', 'Warriors of Chaos', null),
  ('the_old_world', 'Beastmen Brayherds', null),
  ('the_old_world', 'Grand Cathay', null)
on conflict (system_id, name, subfaction) do nothing;

insert into public.mini_units (faction_id, name, unit_type, model_count_min, model_count_max)
select f.id, f.name, 'team', 1, 1
from public.mini_factions f
where f.system_id = 'the_old_world'
  and not exists (
    select 1 from public.mini_units u
    where u.faction_id = f.id and u.name = f.name
  );