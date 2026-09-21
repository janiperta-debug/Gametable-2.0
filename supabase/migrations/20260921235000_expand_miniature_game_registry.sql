-- Expand the miniature-game registry with additional major systems.
-- These are catalog foundations: media is optional and detailed unit seeding
-- can be added source-by-source without blocking the system from appearing.

insert into public.mini_systems (id, name, code, edition)
values
  ('kill_team', 'Kill Team', 'kill_team', null),
  ('star_wars_shatterpoint', 'Star Wars: Shatterpoint', 'star_wars_shatterpoint', null),
  ('necromunda', 'Necromunda', 'necromunda', null),
  ('warcry', 'Warcry', 'warcry', null),
  ('middle_earth_sbg', 'Middle-earth Strategy Battle Game', 'middle_earth_sbg', null),
  ('the_old_world', 'Warhammer: The Old World', 'the_old_world', null),
  ('the_horus_heresy', 'The Horus Heresy', 'the_horus_heresy', null),
  ('legions_imperialis', 'Legions Imperialis', 'legions_imperialis', null),
  ('warhammer_underworlds', 'Warhammer Underworlds', 'warhammer_underworlds', null),
  ('adeptus_titanicus', 'Adeptus Titanicus', 'adeptus_titanicus', null),
  ('infinity', 'Infinity', 'infinity', null),
  ('malifaux', 'Malifaux', 'malifaux', null)
on conflict (id) do update set
  name = excluded.name,
  code = excluded.code,
  edition = excluded.edition;

insert into public.mini_catalog_sources
  (code, name, system_code, publisher, source_type, source_url)
values
  ('kill-team-warhammer-community', 'Kill Team — Warhammer Community', 'kill_team', 'Games Workshop', 'html', 'https://www.warhammer-community.com/en-gb/topics/kill-team/'),
  ('star-wars-shatterpoint-atomic-mass-games', 'Star Wars: Shatterpoint — Atomic Mass Games', 'star_wars_shatterpoint', 'Atomic Mass Games', 'html', 'https://www.atomicmassgames.com/shatterpoint/'),
  ('necromunda-warhammer-community', 'Necromunda — Warhammer Community', 'necromunda', 'Games Workshop', 'html', 'https://www.warhammer-community.com/en-gb/topics/necromunda/'),
  ('warcry-warhammer-community', 'Warcry — Warhammer Community', 'warcry', 'Games Workshop', 'html', 'https://www.warhammer-community.com/en-gb/topics/warcry/'),
  ('middle-earth-sbg-warhammer-community', 'Middle-earth Strategy Battle Game — Warhammer Community', 'middle_earth_sbg', 'Games Workshop', 'html', 'https://www.warhammer-community.com/en-gb/topics/middle-earth-strategy-battle-game/'),
  ('the-old-world-warhammer-community', 'Warhammer: The Old World — Warhammer Community', 'the_old_world', 'Games Workshop', 'html', 'https://www.warhammer-community.com/en-gb/topics/warhammer-the-old-world/'),
  ('the-horus-heresy-warhammer-community', 'The Horus Heresy — Warhammer Community', 'the_horus_heresy', 'Games Workshop', 'html', 'https://www.warhammer-community.com/en-gb/topics/the-horus-heresy/'),
  ('legions-imperialis-warhammer-community', 'Legions Imperialis — Warhammer Community', 'legions_imperialis', 'Games Workshop', 'html', 'https://www.warhammer-community.com/en-gb/topics/legions-imperialis/'),
  ('warhammer-underworlds-warhammer-community', 'Warhammer Underworlds — Warhammer Community', 'warhammer_underworlds', 'Games Workshop', 'html', 'https://www.warhammer-community.com/en-gb/topics/warhammer-underworlds/'),
  ('adeptus-titanicus-warhammer-community', 'Adeptus Titanicus — Warhammer Community', 'adeptus_titanicus', 'Games Workshop', 'html', 'https://www.warhammer-community.com/en-gb/topics/adeptus-titanicus/'),
  ('infinity-corvus-belli', 'Infinity — Corvus Belli', 'infinity', 'Corvus Belli', 'html', 'https://infinitytheuniverse.com/'),
  ('malifaux-wyrd-games', 'Malifaux — Wyrd Games', 'malifaux', 'Wyrd Games', 'html', 'https://www.wyrd-games.net/malifaux')
on conflict (code) do update set
  name = excluded.name,
  system_code = excluded.system_code,
  publisher = excluded.publisher,
  source_type = excluded.source_type,
  source_url = excluded.source_url,
  active = true,
  updated_at = now();
