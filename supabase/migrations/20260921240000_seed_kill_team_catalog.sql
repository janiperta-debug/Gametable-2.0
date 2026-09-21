-- Seed the first broad Kill Team catalog pass from current official Warhammer Community material.
-- Images remain optional; team-level records are enough to make the system useful
-- while operative-level detail is expanded later.

insert into public.mini_factions (system_id, name, subfaction)
values
  ('kill_team', 'Angels of Death', null),
  ('kill_team', 'Blades of Khaine', null),
  ('kill_team', 'Blooded', null),
  ('kill_team', 'Brood Brothers', null),
  ('kill_team', 'Chaos Cult', null),
  ('kill_team', 'Corsair Voidscarred', null),
  ('kill_team', 'Death Korps', null),
  ('kill_team', 'Fellgor Ravagers', null),
  ('kill_team', 'Hearthkyn Salvagers', null),
  ('kill_team', 'Hierotek Circle', null),
  ('kill_team', 'Imperial Navy Breachers', null),
  ('kill_team', 'Kasrkin', null),
  ('kill_team', 'Kommandos', null),
  ('kill_team', 'Mandrakes', null),
  ('kill_team', 'Nemesis Claw', null),
  ('kill_team', 'Novitiates', null),
  ('kill_team', 'Pathfinders', null),
  ('kill_team', 'Phobos Strike Team', null),
  ('kill_team', 'Plague Marines', null),
  ('kill_team', 'Ratlings', null),
  ('kill_team', 'Raveners', null),
  ('kill_team', 'Sanctifiers', null),
  ('kill_team', 'Scout Squad', null),
  ('kill_team', 'Tempestus Aquilons', null),
  ('kill_team', 'Vespid Stingwings', null),
  ('kill_team', 'Wrecka Krew', null),
  ('kill_team', 'Hernkyn Yaegirs', null),
  ('kill_team', 'Hand of the Archon', null),
  ('kill_team', 'Hunter Clade', null),
  ('kill_team', 'Exaction Squad', null),
  ('kill_team', 'Gellerpox Infected', null),
  ('kill_team', 'Elucidian Starstriders', null),
  ('kill_team', 'Farstalker Kinband', null),
  ('kill_team', 'Goremongers', null),
  ('kill_team', 'Battleclade', null),
  ('kill_team', 'Murderwing', null),
  ('kill_team', 'Celestian Insidiants', null),
  ('kill_team', 'XV26 Stealth Battlesuits', null),
  ('kill_team', 'Wolf Scouts', null),
  ('kill_team', 'Exodite', null),
  ('kill_team', 'Spectre Squad', null)
on conflict (system_id, name, subfaction) do nothing;

insert into public.mini_units (faction_id, name, unit_type, model_count_min, model_count_max)
select f.id, f.name, 'team', 1, 1
from public.mini_factions f
where f.system_id = 'kill_team'
  and not exists (
    select 1 from public.mini_units u
    where u.faction_id = f.id
      and u.name = f.name
  );
