-- Align Manor achievement requirements with the established 35/70/95 progression.
-- Badge awards no longer grant XP. Historical XP and user_badges remain untouched.
update public.badge_definitions as b
set requirement_value = v.requirement_value
from (values
  ('ground-floor-master',35),
  ('second-floor-master',70),
  ('basement-lord',95)
) as v(id,requirement_value)
where b.id=v.id;

update public.badge_definitions set xp_reward=0 where xp_reward is distinct from 0;
