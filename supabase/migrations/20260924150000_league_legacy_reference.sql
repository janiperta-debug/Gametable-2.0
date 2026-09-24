-- Retain the source event when converting an old event-based league.
alter table public.leagues add column if not exists legacy_event_id uuid unique references public.events(id) on delete set null;
