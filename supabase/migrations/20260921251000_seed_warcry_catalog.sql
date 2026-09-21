-- Broad Warcry warband catalog based on official Warhammer Community material.
-- Keep this pass at warband level; fighter-level entries can be expanded later.

insert into public.mini_factions (system_id, name, subfaction)
values
  ('warcry', 'Horns of Hashut', null),
  ('warcry', 'Rotmire Creed', null),
  ('warcry', 'Untamed Beasts', null),
  ('warcry', 'Iron Golem', null),
  ('warcry', 'Corvus Cabal', null),
  ('warcry', 'Cypher Lords', null),
  ('warcry', 'Splintered Fang', null),
  ('warcry', 'Unmade', null),
  ('warcry', 'Scions of Flame', null),
  ('warcry', 'Spire Tyrants', null),
  ('warcry', 'Tarantulos Brood', null),
  ('warcry', 'Darkoath Savagers', null),
  ('warcry', 'Khainite Shadowstalkers', null),
  ('warcry', 'Hunters of Huanchi', null),
  ('warcry', 'Jade Obelisk', null),
  ('warcry', 'Questor Soulsworn', null),
  ('warcry', 'Royal Beastflayers', null),
  ('warcry', 'Crimson Court', null),
  ('warcry', 'Xandire’s Truthseekers', null),
  ('warcry', 'Wildercorps Hunters', null),
  ('warcry', 'Haskel Hexbane’s Hunters', null),
  ('warcry', 'Askurgan Trueblades', null),
  ('warcry', 'Gnarlspirit Pack', null),
  ('warcry', 'Gorechosen of Dromm', null)
on conflict (system_id, name, subfaction) do nothing;

insert into public.mini_units (faction_id, name, unit_type, model_count_min, model_count_max)
select f.id, f.name, 'team', 1, 1
from public.mini_factions f
where f.system_id = 'warcry'
  and not exists (
    select 1 from public.mini_units u
    where u.faction_id = f.id and u.name = f.name
  );