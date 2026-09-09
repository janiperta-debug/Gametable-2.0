with pathfinder as (
  select id
  from public.rpg_catalog
  where source = 'rpggeek' and source_id = 56388
), daggerheart as (
  select id
  from public.rpg_catalog
  where source = 'rpggeek' and source_id = 103027
)
insert into public.rpg_catalog_items (rpg_id, game_id)
select p.id, g.id
from pathfinder p
join public.games g
  on g.category = 'rpg'
 and g.bgg_id in (406940, 420678, 406941, 418545)
on conflict do nothing;

with daggerheart as (
  select id
  from public.rpg_catalog
  where source = 'rpggeek' and source_id = 103027
)
insert into public.rpg_catalog_items (rpg_id, game_id)
select d.id, g.id
from daggerheart d
join public.games g
  on g.category = 'rpg'
 and g.bgg_id = 446984
on conflict do nothing;
