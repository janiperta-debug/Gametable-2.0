-- Event invitation notifications are now created by the inviteToEvent server action.
-- The previous DB trigger inserted an in-app notification directly, which bypassed
-- the shared notification/email preference and delivery pipeline.

drop trigger if exists trg_event_invitation_notification on public.event_participants;
drop function if exists public.create_event_invitation_notification();
