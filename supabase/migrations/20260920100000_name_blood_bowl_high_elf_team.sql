-- Keep the canonical Blood Bowl High Elf team aligned with the
-- authoritative current team name and preserve the race/team type as a
-- searchable keyword.
update public.mini_units u
set
  name = 'Caledor Dragons',
  keywords = array['High Elf']
from public.mini_factions f
where u.faction_id = f.id
  and f.system_id = 'blood_bowl'
  and f.name = 'High Elf'
  and u.name = 'High Elf';
