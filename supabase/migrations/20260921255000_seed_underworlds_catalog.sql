-- Broad Warhammer Underworlds warband catalog from the current official
-- February 2026 rules update. Warbands are modeled as factions for now;
-- fighter-level entries can be added later.

insert into public.mini_factions (system_id, name, subfaction)
values
  ('warhammer_underworlds', 'Blackpowder’s Buccaneers', null),
  ('warhammer_underworlds', 'Borgit’s Beastgrabbaz', null),
  ('warhammer_underworlds', 'The Crimson Court', null),
  ('warhammer_underworlds', 'Elathain’s Soulraid', null),
  ('warhammer_underworlds', 'The Emberwatch', null),
  ('warhammer_underworlds', 'The Exiled Dead', null),
  ('warhammer_underworlds', 'Gorechosen of Dromm', null),
  ('warhammer_underworlds', 'Grandfather’s Gardeners', null),
  ('warhammer_underworlds', 'Grinkrak’s Looncourt', null),
  ('warhammer_underworlds', 'The Grymwatch', null),
  ('warhammer_underworlds', 'Hexbane’s Hunters', null),
  ('warhammer_underworlds', 'Hrothgorn’s Mantrappers', null),
  ('warhammer_underworlds', 'The Jaws of Itzl', null),
  ('warhammer_underworlds', 'Kainan’s Reapers', null),
  ('warhammer_underworlds', 'Knives of the Crone', null),
  ('warhammer_underworlds', 'Kamandora’s Blades', null),
  ('warhammer_underworlds', 'Da Kunnin’ Krew', null),
  ('warhammer_underworlds', 'Kurnoth’s Heralds', null),
  ('warhammer_underworlds', 'Mollog’s Mob', null),
  ('warhammer_underworlds', 'Morgok’s Krushas', null),
  ('warhammer_underworlds', 'Rippa’s Snarlfangs', null),
  ('warhammer_underworlds', 'The Shadeborn', null),
  ('warhammer_underworlds', 'The Skinnerkin', null),
  ('warhammer_underworlds', 'The Sons of Velmorn', null),
  ('warhammer_underworlds', 'The Starblood Stalkers', null),
  ('warhammer_underworlds', 'The Thricefold Discord', null),
  ('warhammer_underworlds', 'The Wurmspat', null),
  ('warhammer_underworlds', 'Xandire’s Truthseekers', null),
  ('warhammer_underworlds', 'Ylthari’s Guardians', null),
  ('warhammer_underworlds', 'Zarbag’s Gitz', null),
  ('warhammer_underworlds', 'Zikkit’s Tunnelpack', null),
  ('warhammer_underworlds', 'Brethren of the Bolt', null),
  ('warhammer_underworlds', 'Cyreni’s Razors', null),
  ('warhammer_underworlds', 'Daggok’s Stab-ladz', null),
  ('warhammer_underworlds', 'The Farstriders', null),
  ('warhammer_underworlds', 'Ironsoul’s Condemnors', null),
  ('warhammer_underworlds', 'The Sepulchral Guard', null),
  ('warhammer_underworlds', 'Spiteclaw’s Swarm', null),
  ('warhammer_underworlds', 'Zondara’s Gravebreakers', null)
on conflict (system_id, name, subfaction) do nothing;

insert into public.mini_units (faction_id, name, unit_type, model_count_min, model_count_max)
select f.id, f.name, 'team', 1, 1
from public.mini_factions f
where f.system_id = 'warhammer_underworlds'
  and not exists (
    select 1 from public.mini_units u
    where u.faction_id = f.id and u.name = f.name
  );