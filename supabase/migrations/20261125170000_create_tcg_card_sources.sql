-- Multi-source identity layer for the shared TCG catalogue.
-- Keep tcg_cards.external_id intact for backward compatibility.

create table if not exists public.tcg_card_sources (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.tcg_cards(id) on delete cascade,
  tcg_system text not null,
  source_key text not null,
  external_id text not null,
  source_url text,
  source_metadata jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tcg_card_sources_system_check check (tcg_system = any (array[
    'mtg'::text, 'pokemon'::text, 'yugioh'::text, 'lorcana'::text, 'fab'::text, 'onepiece'::text
  ])),
  constraint tcg_card_sources_identity_unique unique (tcg_system, source_key, external_id)
);

create index if not exists tcg_card_sources_card_id_idx on public.tcg_card_sources (card_id);
create index if not exists tcg_card_sources_provider_lookup_idx on public.tcg_card_sources (tcg_system, source_key, external_id);

comment on table public.tcg_card_sources is 'Maps GameTable catalogue cards to one or more external TCG data-source identities.';
comment on column public.tcg_card_sources.source_key is 'Stable internal provider key such as scryfall, pokemontcg, lorcast, goagain, apitcg or optcgapi.';

-- Preserve old IDs without guessing their original provider.
insert into public.tcg_card_sources (card_id, tcg_system, source_key, external_id, source_metadata)
select id, tcg_system, 'legacy_unknown', external_id,
       jsonb_build_object('origin', 'backfilled_from_tcg_cards.external_id')
from public.tcg_cards
on conflict (tcg_system, source_key, external_id) do nothing;

alter table public.tcg_card_sources enable row level security;
create policy "Anyone can view tcg_card_sources" on public.tcg_card_sources for select to public using (true);
revoke insert, update, delete on public.tcg_card_sources from anon, authenticated;
grant select on public.tcg_card_sources to anon, authenticated;
