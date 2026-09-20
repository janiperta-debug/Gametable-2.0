-- Accept the first verified Blood Bowl staging batch into the canonical
-- miniatures catalog. MCP product-level records remain pending until
-- miniature-level contents are available from an authoritative source.

insert into public.mini_systems (id, name, code, edition)
values ('blood_bowl', 'Blood Bowl', 'blood_bowl', '2026')
on conflict (id) do update set
  name = excluded.name,
  code = excluded.code,
  edition = excluded.edition;

insert into public.mini_factions (system_id, name, subfaction)
select 'blood_bowl', c.name, null
from public.mini_catalog_candidates c
where c.system_code = 'blood_bowl'
  and c.status = 'accepted'
on conflict (system_id, name, subfaction) do nothing;

insert into public.mini_units (
  faction_id,
  name,
  unit_type,
  base_points,
  model_count_min,
  model_count_max
)
select
  f.id,
  c.name,
  'team',
  null,
  1,
  1
from public.mini_catalog_candidates c
join public.mini_factions f
  on f.system_id = 'blood_bowl'
 and f.name = c.name
 and f.subfaction is null
where c.system_code = 'blood_bowl'
  and c.status = 'accepted'
  and not exists (
    select 1
    from public.mini_units u
    where u.faction_id = f.id
      and u.name = c.name
  );
