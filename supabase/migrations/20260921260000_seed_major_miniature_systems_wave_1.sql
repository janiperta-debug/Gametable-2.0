-- Seed broad faction/affiliation coverage for four major miniature systems.
-- Detailed model/character entries can be added later without changing the system registry.

insert into public.mini_factions (system_id, name, subfaction)
values
  ('middle_earth_sbg', 'Rohan', null),
  ('middle_earth_sbg', 'Minas Tirith', null),
  ('middle_earth_sbg', 'Fiefdoms of Gondor', null),
  ('middle_earth_sbg', 'Rivendell', null),
  ('middle_earth_sbg', 'Lothlórien', null),
  ('middle_earth_sbg', 'Erebor', null),
  ('middle_earth_sbg', 'Iron Hills', null),
  ('middle_earth_sbg', 'Thranduil’s Halls', null),
  ('middle_earth_sbg', 'Moria', null),
  ('middle_earth_sbg', 'Mordor', null),
  ('middle_earth_sbg', 'Isengard', null),
  ('middle_earth_sbg', 'Angmar', null),
  ('middle_earth_sbg', 'Dol Guldur', null),
  ('middle_earth_sbg', 'Easterlings', null),
  ('middle_earth_sbg', 'Harad', null),
  ('middle_earth_sbg', 'Corsairs of Umbar', null),
  ('middle_earth_sbg', 'Lake-town', null),
  ('middle_earth_sbg', 'Dale', null),
  ('middle_earth_sbg', 'Goblin-town', null),
  ('middle_earth_sbg', 'Azog’s Hunters', null),
  ('malifaux', 'The Guild', null),
  ('malifaux', 'Arcanists', null),
  ('malifaux', 'Resurrectionists', null),
  ('malifaux', 'Neverborn', null),
  ('malifaux', 'Outcasts', null),
  ('malifaux', 'Bayou', null),
  ('malifaux', 'Ten Thunders', null),
  ('malifaux', 'Explorer’s Society', null),
  ('star_wars_shatterpoint', 'Galactic Republic', null),
  ('star_wars_shatterpoint', 'Separatist Alliance', null),
  ('star_wars_shatterpoint', 'Galactic Empire', null),
  ('star_wars_shatterpoint', 'Rebel Alliance', null),
  ('star_wars_shatterpoint', 'Shadow Collective', null),
  ('star_wars_shatterpoint', 'Mandalorians', null),
  ('infinity', 'PanOceania', null),
  ('infinity', 'Yu Jing', null),
  ('infinity', 'Ariadna', null),
  ('infinity', 'Haqqislam', null),
  ('infinity', 'Nomads', null),
  ('infinity', 'Combined Army', null),
  ('infinity', 'ALEPH', null),
  ('infinity', 'O-12', null)
on conflict (system_id, name, subfaction) do nothing;

insert into public.mini_units (faction_id, name, unit_type, model_count_min, model_count_max)
select f.id, f.name, 'team', 1, 1
from public.mini_factions f
where f.system_id in ('middle_earth_sbg', 'malifaux', 'star_wars_shatterpoint', 'infinity')
  and not exists (
    select 1
    from public.mini_units u
    where u.faction_id = f.id
      and u.name = f.name
  );
