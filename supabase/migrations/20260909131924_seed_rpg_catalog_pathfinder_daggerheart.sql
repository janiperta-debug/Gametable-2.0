insert into public.rpg_catalog (source, source_id, name)
values
  ('rpggeek', 56388, 'Pathfinder Roleplaying Game (2nd Edition)'),
  ('rpggeek', 103027, 'Daggerheart')
on conflict (source, source_id) do update
set name = excluded.name,
    updated_at = now();

insert into public.rpg_catalog_items (rpg_id, game_id)
select r.id, g.id
from public.rpg_catalog r
join public.games g
  on g.category = 'rpg'
 and g.bgg_id in (406940, 420678, 406941, 418545)
where r.source = 'rpggeek'
  and r.source_id = 56388
on conflict do nothing;

insert into public.rpg_catalog_items (rpg_id, game_id)
select r.id, g.id
from public.rpg_catalog r
join public.games g
  on g.category = 'rpg'
 and g.bgg_id = 446984
where r.source = 'rpggeek'
  and r.source_id = 103027
on conflict do nothing;
