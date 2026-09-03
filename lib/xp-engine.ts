import "server-only"

import { createServiceClient } from "@/lib/supabase/service"
import { createClient } from "@/lib/supabase/server"

export type XPAwardResult = {
  applied: boolean
  event_id: string | null
  new_xp: number
  new_level: number
}

export async function awardTrustedXP(
  userId: string,
  reason: string,
  amount: number,
  referenceId: string | null,
  eventKey: string,
): Promise<XPAwardResult> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc("award_xp_trusted", {
    p_target_user: userId,
    p_reason: reason,
    p_amount: amount,
    p_reference_id: referenceId,
    p_event_key: eventKey,
  })
  if (error || !data?.[0]) {
    throw new Error(error?.message || "Failed to award trusted XP")
  }

  return data[0] as XPAwardResult
}

export async function awardCategoryImportXP(userId: string, category: "board_game" | "rpg" | "tcg" | "miniatures") {
  const client = await createClient()
  const { data: { user }, error: authError } = await client.auth.getUser()
  if (authError || !user || user.id !== userId) throw new Error("Unauthorized")
  const { data, error } = await createServiceClient().rpc("award_category_import_xp", {
    p_target_user: userId,
    p_category: category,
  })
  if (error || !data?.[0]) throw new Error(error?.message || "Failed to award import XP")
  return data[0] as XPAwardResult
}
