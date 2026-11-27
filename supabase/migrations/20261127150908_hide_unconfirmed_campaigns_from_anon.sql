drop policy if exists "Anon can view public events" on public.events;

create policy "Anon can view public events"
on public.events
for select
to anon
using (
  privacy = 'public'
  and (event_type is distinct from 'campaign' or campaign_status = 'confirmed')
);
