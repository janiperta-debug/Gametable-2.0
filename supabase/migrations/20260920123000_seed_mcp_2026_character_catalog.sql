-- Update the MCP ingestion source to the official 2026 Timeline PDF
-- and seed its current character catalog.

insert into public.mini_systems (id, name, edition, code)
values ('marvel_crisis_protocol', 'Marvel: Crisis Protocol', '2026', 'marvel_crisis_protocol')
on conflict (id) do update set
  name = excluded.name,
  edition = excluded.edition,
  code = excluded.code;

insert into public.mini_factions (system_id, name, subfaction)
values ('marvel_crisis_protocol', 'Characters', null)
on conflict do nothing;

update public.mini_catalog_sources
set
  source_type = 'pdf',
  source_url = 'https://cdn.svc.asmodee.net/production-amgcom/uploads/2026/01/OP_CrisisProtocol_2026_Timeline_20251219.pdf',
  updated_at = now()
where code = 'marvel-crisis-protocol-atomic-mass-games';

with character_data(name, affiliations) as (
  values
  ('She-Hulk', ARRAY['A-Force', 'S.H.I.E.L.D.']),
  ('Black Widow', ARRAY['A-Force', 'Avengers', 'Mighty Avengers', 'S.H.I.E.L.D.']),
  ('Black Widow, Agent of S.H.I.E.L.D.', ARRAY['A-Force', 'Avengers', 'S.H.I.E.L.D.']),
  ('Captain Marvel', ARRAY['A-Force', 'Avengers']),
  ('Captain Marvel, Cosmic Avenger', ARRAY['A-Force', 'Avengers']),
  ('Gwenpool', ARRAY['A-Force', 'Criminal Syndicate']),
  ('Rescue', ARRAY['A-Force', 'S.H.I.E.L.D.']),
  ('The Black Widow', ARRAY['A-Force', 'S.H.I.E.L.D.']),
  ('The Mighty Thor', ARRAY['A-Force', 'Asgard']),
  ('Loki, Prince of Lies', ARRAY['Asgard', 'Criminal Syndicate']),
  ('Thor, Prince of Asgard', ARRAY['Asgard']),
  ('Heimdall, The All-Seeing', ARRAY['Asgard']),
  ('Loki, God of Mischief', ARRAY['Asgard', 'Cabal']),
  ('Thor, Hero of Midgard', ARRAY['Asgard']),
  ('Valkyrie & Elendil', ARRAY['Asgard']),
  ('Warriors Three', ARRAY['Asgard']),
  ('Captain America (Steve Rogers)', ARRAY['Avengers']),
  ('Captain America, First Avenger', ARRAY['Avengers', 'S.H.I.E.L.D.']),
  ('Hulkbuster', ARRAY['Avengers']),
  ('Black Panther', ARRAY['Avengers']),
  ('Black Panther, Chosen of Bast', ARRAY['Avengers', 'Defenders', 'Mighty Avengers']),
  ('Cable', ARRAY['Avengers', 'X-Force']),
  ('Kang the Conqueror', ARRAY['Cabal']),
  ('Red Skull', ARRAY['Cabal', 'Hydra']),
  ('Red Skull, Master of the World', ARRAY['Cabal', 'Hydra']),
  ('Baron Mordo', ARRAY['Cabal', 'Convocation']),
  ('Baron Helmut Zemo', ARRAY['Cabal', 'Hydra']),
  ('Baron Zemo', ARRAY['Cabal', 'Hydra']),
  ('Cassandra Nova', ARRAY['Cabal', 'Sentinels']),
  ('Crossbones', ARRAY['Cabal', 'Criminal Syndicate', 'Hydra']),
  ('Crossbones, Merciless Merc', ARRAY['Cabal', 'Criminal Syndicate', 'Hydra']),
  ('Iron Monger', ARRAY['Cabal', 'Criminal Syndicate']),
  ('Killmonger', ARRAY['Cabal', 'Criminal Syndicate']),
  ('M.O.D.O.K.', ARRAY['Cabal', 'Criminal Syndicate']),
  ('Red Skull, Master of Hydra', ARRAY['Cabal', 'Hydra']),
  ('Sabretooth', ARRAY['Cabal', 'X-Force']),
  ('Ultron', ARRAY['Cabal']),
  ('Ancient One', ARRAY['Convocation', 'Defenders']),
  ('Clea', ARRAY['Convocation', 'Defenders']),
  ('Doctor Strange', ARRAY['Convocation', 'Defenders']),
  ('Doctor Strange, Sorcerer Supreme', ARRAY['Convocation', 'Defenders']),
  ('Doctor Voodoo', ARRAY['Convocation']),
  ('Magik', ARRAY['Convocation']),
  ('Wong', ARRAY['Convocation']),
  ('M.O.D.O.K. Scientist Supreme', ARRAY['Criminal Syndicate', 'Hydra']),
  ('Shadowland Daredevil', ARRAY['Criminal Syndicate']),
  ('Echo', ARRAY['Criminal Syndicate', 'Defenders']),
  ('Killmonger, Usurper', ARRAY['Criminal Syndicate']),
  ('Prowler', ARRAY['Criminal Syndicate', 'Spider-Foes']),
  ('Shocker', ARRAY['Criminal Syndicate', 'Spider-Foes']),
  ('Dormammu', ARRAY['Dark Dimension']),
  ('Daredevil', ARRAY['Defenders', 'Web Warriors']),
  ('Amazing Spider-Man', ARRAY['Defenders', 'Web Warriors']),
  ('Adam Warlock', ARRAY['Guardians of the Galaxy']),
  ('Agent Venom', ARRAY['Guardians of the Galaxy', 'S.H.I.E.L.D.', 'Web Warriors']),
  ('Cosmic Ghost Rider', ARRAY['Guardians of the Galaxy']),
  ('Drax', ARRAY['Guardians of the Galaxy']),
  ('Groot', ARRAY['Guardians of the Galaxy']),
  ('Moondragon', ARRAY['Guardians of the Galaxy']),
  ('Quasar', ARRAY['Guardians of the Galaxy']),
  ('Rocket Raccoon', ARRAY['Guardians of the Galaxy']),
  ('Winter Soldier, Operative', ARRAY['Hydra', 'S.H.I.E.L.D.']),
  ('Spectrum', ARRAY['Mighty Avengers']),
  ('Sentinel Prime MK4', ARRAY['Sentinels']),
  ('Sentinel MK4', ARRAY['Sentinels']),
  ('Invincible Iron Man', ARRAY['S.H.I.E.L.D.']),
  ('Hawkeye', ARRAY['S.H.I.E.L.D.']),
  ('Iron Man', ARRAY['S.H.I.E.L.D.']),
  ('Nick Fury Sr. & The Howling Commandos', ARRAY['S.H.I.E.L.D.']),
  ('Spectacular Spider-Man', ARRAY['S.H.I.E.L.D.']),
  ('Steve Rogers, Captain America', ARRAY['S.H.I.E.L.D.']),
  ('The Original Human Torch', ARRAY['S.H.I.E.L.D.']),
  ('Winter Soldier', ARRAY['S.H.I.E.L.D.']),
  ('Doc Ock, Sinister Scientist', ARRAY['Spider-Foes']),
  ('Doctor Octopus', ARRAY['Spider-Foes']),
  ('Venom', ARRAY['Spider-Foes', 'Web Warriors']),
  ('Cyclops', ARRAY['Uncanny X-Men']),
  ('Angel', ARRAY['Uncanny X-Men']),
  ('Bishop', ARRAY['Uncanny X-Men', 'X-Force']),
  ('Spider-Man (Miles Morales)', ARRAY['Web Warriors']),
  ('Ghost-Spider', ARRAY['Web Warriors']),
  ('Gwenom', ARRAY['Web Warriors']),
  ('Silk', ARRAY['Web Warriors']),
  ('Spider-Ham', ARRAY['Web Warriors']),
  ('Spider-Man (Peter Parker)', ARRAY['Web Warriors']),
  ('Spider-Man 2099', ARRAY['Web Warriors']),
  ('Spider-Man Noir', ARRAY['Web Warriors']),
  ('Ultimate Spider-Man', ARRAY['Web Warriors']),
  ('Archangel', ARRAY['X-Force']),
  ('Wolverine', ARRAY['X-Force']),
  ('X-23', ARRAY['X-Force']),
  ('Iron Lad', ARRAY['Unaffiliated'])
)
insert into public.mini_units (faction_id, name, unit_type, keywords)
select f.id, d.name, 'character', d.affiliations
from character_data d
join public.mini_factions f
  on f.system_id = 'marvel_crisis_protocol'
 and f.name = 'Characters'
where not exists (
  select 1 from public.mini_units u
  where u.faction_id = f.id and u.name = d.name
);
