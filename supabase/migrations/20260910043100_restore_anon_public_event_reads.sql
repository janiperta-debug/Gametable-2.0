create policy "Anon can view public events"
  on public.events for select
  to anon
  using (privacy = 'public');
