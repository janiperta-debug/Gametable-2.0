create or replace function public.set_campaign_lifecycle_defaults()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if new.event_type = 'campaign' then
    new.campaign_status := coalesce(new.campaign_status, 'setup');
  else
    new.campaign_status := null;
    new.campaign_confirmed_at := null;
    new.campaign_confirmed_by := null;
  end if;
  return new;
end;
$function$;

create trigger trg_set_campaign_lifecycle_defaults
before insert or update of event_type
on public.events
for each row
execute function public.set_campaign_lifecycle_defaults();
