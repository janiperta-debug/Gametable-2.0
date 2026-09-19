create policy "Users can mark messages as read"
on public.messages
for update
to authenticated
using (
  exists (
    select 1
    from public.conversations
    where id = messages.conversation_id
      and auth.uid() = any(participants)
  )
)
with check (
  exists (
    select 1
    from public.conversations
    where id = messages.conversation_id
      and auth.uid() = any(participants)
  )
);
