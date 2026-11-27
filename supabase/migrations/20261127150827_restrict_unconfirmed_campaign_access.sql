create or replace function public.user_can_access_event(p_event_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $function$
  select exists (
    select 1
      from public.events e
     where e.id = p_event_id
       and (
         e.host_id = p_user_id
         or (
           (e.event_type is distinct from 'campaign' or e.campaign_status = 'confirmed')
           and (
             e.privacy = 'public'
             or (
               e.privacy = 'friends'
               and exists (
                 select 1
                   from public.friendships f
                  where f.status = 'accepted'
                    and ((f.requester_id = e.host_id and f.addressee_id = p_user_id)
                      or (f.requester_id = p_user_id and f.addressee_id = e.host_id))
               )
             )
           )
         )
         or exists (
           select 1
             from public.event_participants ep
            where ep.event_id = e.id
              and ep.user_id = p_user_id
              and (
                e.privacy = 'private'
                or (
                  e.event_type = 'campaign'
                  and e.campaign_status is distinct from 'confirmed'
                  and ep.status in ('invited', 'attending', 'maybe')
                )
              )
         )
       )
  );
$function$;
