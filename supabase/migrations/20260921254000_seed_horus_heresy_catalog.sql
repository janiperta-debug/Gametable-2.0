-- Broad current Warhammer: The Horus Heresy faction catalog.
-- The current edition treats each of the 18 Space Marine Legions as a separate
-- faction. Other major forces are represented separately so GameTable can later
-- expand into Legion/sub-faction detail without flattening the catalog.

insert into public.mini_factions (system_id, name, subfaction)
values
  ('the_horus_heresy', 'Dark Angels', null),
  ('the_horus_heresy', 'Emperor’s Children', null),
  ('the_horus_heresy', 'Iron Warriors', null),
  ('the_horus_heresy', 'White Scars', null),
  ('the_horus_heresy', 'Space Wolves', null),
  ('the_horus_heresy', 'Imperial Fists', null),
  ('the_horus_heresy', 'Night Lords', null),
  ('the_horus_heresy', 'Blood Angels', null),
  ('the_horus_heresy', 'Iron Hands', null),
  ('the_horus_heresy', 'World Eaters', null),
  ('the_horus_heresy', 'Ultramarines', null),
  ('the_horus_heresy', 'Death Guard', null),
  ('the_horus_heresy', 'Thousand Sons', null),
  ('the_horus_heresy', 'Sons of Horus', null),
  ('the_horus_heresy', 'Word Bearers', null),
  ('the_horus_heresy', 'Salamanders', null),
  ('the_horus_heresy', 'Raven Guard', null),
  ('the_horus_heresy', 'Alpha Legion', null),
  ('the_horus_heresy', 'Solar Auxilia', null),
  ('the_horus_heresy', 'Mechanicum', null),
  ('the_horus_heresy', 'Legio Custodes', null),
  ('the_horus_heresy', 'Sisters of Silence', null),
  ('the_horus_heresy', 'Divisio Assassinorum', null),
  ('the_horus_heresy', 'Agents of the Emperor', null),
  ('the_horus_heresy', 'Knights', null),
  ('the_horus_heresy', 'Titan Legions', null),
  ('the_horus_heresy', 'Daemons of the Ruinstorm', null),
  ('the_horus_heresy', 'Imperialis Militia', null),
  ('the_horus_heresy', 'Blackshields', null)
on conflict (system_id, name, subfaction) do nothing;

insert into public.mini_units (faction_id, name, unit_type, model_count_min, model_count_max)
select f.id, f.name, 'team', 1, 1
from public.mini_factions f
where f.system_id = 'the_horus_heresy'
  and not exists (
    select 1 from public.mini_units u
    where u.faction_id = f.id and u.name = f.name
  );