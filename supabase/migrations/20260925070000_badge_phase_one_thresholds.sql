-- Phase 1: synchronize live badge thresholds with lib/badge-definitions.ts.
-- Preserve user_badges and XP history; do not silently revoke earned achievements.
-- Portal Keeper is intentionally unchanged until real import-event tracking exists.
update public.badge_definitions as b
set requirement_value = thresholds.requirement_value
from (values
  ('apprentice-curator', 10),
  ('master-curator', 50),
  ('grand-curator', 250),
  ('bond-forger', 5),
  ('circle-builder', 25),
  ('fellowship-master', 100),
  ('first-gathering', 10),
  ('regular-host', 50),
  ('grand-orchestrator', 200),
  ('eager-newcomer', 10),
  ('reliable-ally', 50),
  ('legendary-companion', 200)
) as thresholds(id, requirement_value)
where b.id = thresholds.id;
