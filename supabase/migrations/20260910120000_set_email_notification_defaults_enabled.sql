-- WP-005B: email notification preferences are enabled by default.
-- Existing users who have not explicitly disabled a preference are normalized to enabled.
alter table public.profiles
  alter column email_notification_types
  set default '{"event_rsvp": true, "new_message": true, "badge_earned": true, "friend_request": true, "admin_broadcast": true}'::jsonb;

update public.profiles
set email_notification_types = jsonb_build_object(
  'friend_request', coalesce((email_notification_types->>'friend_request')::boolean, true),
  'badge_earned', coalesce((email_notification_types->>'badge_earned')::boolean, true),
  'event_rsvp', coalesce((email_notification_types->>'event_rsvp')::boolean, true),
  'new_message', coalesce((email_notification_types->>'new_message')::boolean, true),
  'admin_broadcast', coalesce((email_notification_types->>'admin_broadcast')::boolean, true)
);
