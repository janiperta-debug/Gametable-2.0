insert into public.mini_catalog_sources
  (code, name, system_code, publisher, source_type, source_url)
values
  ('age-of-sigmar-warhammer-community','Warhammer Age of Sigmar — Warhammer Community','aos_3e','Games Workshop','html','https://www.warhammer-community.com/en-gb/downloads/warhammer-age-of-sigmar/'),
  ('star-wars-legion-atomic-mass-games','Star Wars: Legion — Atomic Mass Games','sw_legion','Atomic Mass Games','html','https://www.atomicmassgames.com/swlegiondocs/')
on conflict (code) do update set
  name=excluded.name, system_code=excluded.system_code, publisher=excluded.publisher,
  source_type=excluded.source_type, source_url=excluded.source_url, updated_at=now();

update public.mini_systems set edition='2026', name='Age of Sigmar' where id='aos_3e';
update public.mini_systems set edition='2026', name='Star Wars: Legion' where id='sw_legion';

-- Seed the current minimal catalog from the official source adapters.
-- The source-specific adapters remain the authoritative place for future refreshes.
