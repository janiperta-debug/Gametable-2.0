-- Keep the source-backed Blood Bowl catalog row when the acceptance import
-- left an older placeholder row with no provenance metadata.
delete from public.mini_units u
using public.mini_factions f
where u.faction_id = f.id
  and f.system_id = 'blood_bowl'
  and u.datasheet is null
  and exists (
    select 1
    from public.mini_units source_unit
    where source_unit.faction_id = u.faction_id
      and source_unit.name = u.name
      and source_unit.datasheet is not null
  );
