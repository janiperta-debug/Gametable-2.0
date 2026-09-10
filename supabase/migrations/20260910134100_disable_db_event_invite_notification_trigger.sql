-- Event invitations are now responsible for creating their own notification/email
-- through the application notification pipeline. The old DB trigger inserted a
-- notification directly and therefore bypassed email delivery.
drop trigger if exists trg_event_invitation_notification on public.event_participants;
drop function if exists public.create_event_invitation_notification();
