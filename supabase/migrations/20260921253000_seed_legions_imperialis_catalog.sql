-- Broad Legions Imperialis faction catalog.
-- Official Warhammer Community identifies Legiones Astartes and Solar Auxilia
-- as the primary army lists, with Knight Households and Titan Legions as
-- strategic assets; later releases add the Taghmata Omnissiah.

insert into public.mini_factions (system_id, name, subfaction)
values
  ('legions_imperialis', 'Legiones Astartes', null),
  ('legions_imperialis', 'Solar Auxilia', null),
  ('legions_imperialis', 'Titan Legions', null),
  ('legions_imperialis', 'Knight Households', null),
  ('legions_imperialis', 'Taghmata Omnissiah', null)
on conflict (system_id, name, subfaction) do nothing;

insert into public.mini_units (faction_id, name, unit_type, model_count_min, model_count_max)
select f.id, f.name, 'team', 1, 1
from public.mini_factions f
where f.system_id = 'legions_imperialis'
  and not exists (
    select 1 from public.mini_units u
    where u.faction_id = f.id and u.name = f.name
  );