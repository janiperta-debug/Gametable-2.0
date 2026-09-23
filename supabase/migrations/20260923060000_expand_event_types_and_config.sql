-- Expand Events into a generic event-form model.
-- Categories/game genres remain independent from event type.
alter table public.events
  add column if not exists event_config jsonb not null default '{}'::jsonb;

alter table public.events
  drop constraint if exists events_event_type_check;

update public.events
set event_type = case event_type
  when 'board_game_night' then 'game_night'
  when 'rpg_session' then 'campaign'
  when 'tournament' then 'tournament'
  when 'custom' then 'game_night'
  else event_type
end;

alter table public.events
  add constraint events_event_type_check
  check (event_type is null or event_type = any (array[
    'game_night'::text,
    'campaign'::text,
    'tournament'::text,
    'league'::text
  ]));
