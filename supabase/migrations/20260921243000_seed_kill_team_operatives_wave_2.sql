-- Add verified operative-level Kill Team data for four official team rule sets.
-- Sources: official Warhammer Community Kill Team team-rule PDFs.

with team_data(team_name, operatives) as (
  values
    ('Angels of Death', array[
      'Space Marine Captain',
      'Assault Intercessor Sergeant',
      'Intercessor Sergeant',
      'Assault Intercessor Warrior',
      'Assault Intercessor Grenadier',
      'Intercessor Warrior',
      'Intercessor Gunner',
      'Eliminator Sniper',
      'Heavy Intercessor Gunner'
    ]),
    ('Tempestus Aquilons', array[
      'Tempestus Aquilon Tempestor',
      'Grenadier',
      'Gunfighter',
      'Gunner - Melta Carbine',
      'Gunner - Plasma Carbine',
      'Marksman',
      'Precursor',
      'Servo-Sentry',
      'Trooper'
    ]),
    ('Vespid Stingwings', array[
      'Vespid Stingwing Strain Leader',
      'Vespid Stingwing Oversight Drone',
      'Longsting',
      'Shadestrain',
      'Skyblast',
      'Swarmguard',
      'Warrior'
    ]),
    ('Death Korps', array[
      'Death Korps Watchmaster',
      'Bruiser',
      'Confidant',
      'Gunner - Flamer',
      'Gunner - Grenade Launcher',
      'Gunner - Meltagun',
      'Gunner - Plasma Gun',
      'Medic',
      'Sapper',
      'Sniper',
      'Spotter',
      'Trooper',
      'Veteran',
      'Vox-Operator',
      'Zealot'
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