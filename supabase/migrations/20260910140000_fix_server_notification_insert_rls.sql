-- WP-005B: allow authenticated server-side notification flows to create
-- notifications for another user while keeping the notifications table RLS intact.
create or replace function public.create_notification_server(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_data jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, type, title, body, data, read)
  values (p_user_id, p_type, p_title, p_body, coalesce(p_data, '{}'::jsonb), false)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_notification_server(uuid, text, text, text, jsonb) from public;
grant execute on function public.create_notification_server(uuid, text, text, text, jsonb) to authenticated, service_role;
