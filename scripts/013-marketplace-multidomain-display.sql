-- Marketplace multi-domain display support.
-- Keeps existing board-game rows intact while allowing TCG and miniature metadata.

alter table public.marketplace_listings
  add column if not exists source_title text,
  add column if not exists source_image_url text,
  add column if not exists source_subtitle text;

create index if not exists marketplace_listings_source_type_status_idx
  on public.marketplace_listings(source_type, status, created_at desc);

comment on column public.marketplace_listings.source_title is
  'Snapshot title for non-board-game marketplace sources.';
comment on column public.marketplace_listings.source_image_url is
  'Snapshot image URL for non-board-game marketplace sources.';
comment on column public.marketplace_listings.source_subtitle is
  'Snapshot subtitle for non-board-game marketplace sources.';
