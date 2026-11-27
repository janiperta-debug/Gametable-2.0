alter table public.events
  add column if not exists campaign_status text,
  add column if not exists campaign_confirmed_at timestamptz,
  add column if not exists campaign_confirmed_by uuid references public.profiles(id) on delete set null;

update public.events
set campaign_status = 'setup'
where event_type = 'campaign' and campaign_status is null;

alter table public.events
  add constraint events_campaign_status_check
  check (
    (event_type = 'campaign' and campaign_status in ('setup', 'confirmed'))
    or
    (event_type is distinct from 'campaign' and campaign_status is null)
  );

create index if not exists events_confirmed_campaigns_idx
  on public.events (starts_at)
  where event_type = 'campaign' and campaign_status = 'confirmed';
