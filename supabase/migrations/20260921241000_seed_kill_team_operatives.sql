-- Add verified operative-level Kill Team data for two official team rule sets.
-- This is the second catalog layer: team -> individual operatives.

with team_data(team_name, operatives) as (
  values
    ('Kasrkin', array[
      'Kasrkin Sergeant',
      'Combat Medic',
      'Demo-Trooper',
      'Gunner - Flamer',
      'Gunner - Grenade Launcher',
      'Gunner - Hot-shot Volley Gun',
      'Gunner - Meltagun',
      'Gunner - Plasma Gun',
      'Recon-Trooper',
      'Sharpshooter',
      'Trooper',
      'Vox-Trooper'
    ]),
    ('Kommandos', array[
      'Boss Nob',
      'Breacha Boy',
      'Burna Boy',
      'Comms Boy',
      'Dakka Boy',
      'Grot',
      'Rokkit Boy',
      'Slasha Boy',
      'Snipa Boy',
      'Bomb Squig'
    ])
)
insert into public.mini_units (faction_id, name, unit_type, model_count_min, model_count_max)
select f.id, op.name, 'operative', 1, 1
from team_data t
join public.mini_factions f
  on f.system_id = 'kill_team'
 and f.name = t.team_name
cross join lateral unnest(t.operatives) as op(name)
where not exists (
  select 1
  from public.mini_units u
  where u.faction_id = f.id
    and u.name = op.name
);
