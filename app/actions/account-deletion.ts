"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export type AccountResponsibilityKind = "group" | "event" | "league"

export interface AccountResponsibility {
  id: string
  name: string
  kind: AccountResponsibilityKind
  detail?: string
  eligibleUsers: Array<{ id: string; display_name: string | null; username: string | null }>
}

export async function getAccountDeletionPlan(): Promise<{
  responsibilities: AccountResponsibility[]
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { responsibilities: [], error: "Kirjaudu sisään jatkaaksesi." }

  const { data, error } = await supabase.rpc("get_account_deletion_responsibilities")
  if (error) return { responsibilities: [], error: error.message }

  const groups = (data?.groups ?? []) as Array<{ id: string; name: string }>
  const events = (data?.events ?? []) as Array<{ id: string; name: string; starts_at: string }>
  const leagues = (data?.leagues ?? []) as Array<{ id: string; name: string }>
  const responsibilities: AccountResponsibility[] = []

  for (const group of groups) {
    const { data: memberships, error: memberError } = await supabase
      .from("group_memberships")
      .select("user_id, profile:profiles!group_memberships_user_id_fkey(id, display_name, username)")
      .eq("group_id", group.id)
      .eq("status", "active")
      .neq("user_id", user.id)
    if (memberError) return { responsibilities: [], error: memberError.message }
    const eligibleUsers = (memberships ?? [])
      .map((row: any) => Array.isArray(row.profile) ? row.profile[0] : row.profile)
      .filter(Boolean)
    responsibilities.push({ id: group.id, name: group.name, kind: "group", eligibleUsers })
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .neq("id", user.id)
    .order("display_name")
  if (profilesError) return { responsibilities: [], error: profilesError.message }

  for (const event of events) {
    responsibilities.push({
      id: event.id,
      name: event.name,
      kind: "event",
      detail: event.starts_at ? new Date(event.starts_at).toLocaleString("fi-FI") : undefined,
      eligibleUsers: profiles ?? [],
    })
  }
  for (const league of leagues) {
    responsibilities.push({ id: league.id, name: league.name, kind: "league", eligibleUsers: profiles ?? [] })
  }

  return { responsibilities }
}

export async function transferAccountResponsibility(
  kind: AccountResponsibilityKind,
  entityId: string,
  targetUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: "Kirjaudu sisään jatkaaksesi." }

  const { error } = await supabase.rpc("transfer_account_responsibility", {
    p_kind: kind,
    p_entity_id: entityId,
    p_target_user_id: targetUserId,
  })
  if (error) return { success: false, error: error.message }

  revalidatePath("/profile")
  revalidatePath("/groups")
  revalidatePath("/events")
  return { success: true }
}

/**
 * Recreate a community cover through the service role so it no longer belongs
 * to the departing user. A temporary copy is kept until the original path has
 * been restored and its owner_id has been verified as null.
 */
async function releaseGroupCoverOwnership(
  service: ReturnType<typeof createServiceClient>,
  path: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const bucket = service.storage.from("group-covers")
  const tempPath = `__account-deletion-transfer/${randomUUID()}/${path.split("/").pop() || "cover"}`

  const { error: copyError } = await bucket.copy(path, tempPath)
  if (copyError) {
    return { success: false, error: "Väliaikaisen kansikuvakopion luominen epäonnistui: " + copyError.message }
  }

  const { error: removeError } = await bucket.remove([path])
  if (removeError) {
    await bucket.remove([tempPath])
    return { success: false, error: "Alkuperäisen kansikuvan vapauttaminen epäonnistui: " + removeError.message }
  }

  const { error: moveError } = await bucket.move(tempPath, path)
  if (moveError) {
    // Best-effort recovery: restore the original public path from the temp copy.
    const { error: restoreError } = await bucket.copy(tempPath, path)
    if (!restoreError) {
      await bucket.remove([tempPath])
      return { success: false, error: "Kansikuvan palautus onnistui, mutta omistajuuden siirto epäonnistui: " + moveError.message }
    }
    return {
      success: false,
      error: "Kansikuvan siirto epäonnistui ja automaattinen palautus ei onnistunut. Väliaikainen kopio säilytettiin palautusta varten. Siirto: "
        + moveError.message + ". Palautus: " + restoreError.message,
    }
  }

  const { data: object, error: verifyError } = await service
    .schema("storage")
    .from("objects")
    .select("owner_id")
    .eq("bucket_id", "group-covers")
    .eq("name", path)
    .maybeSingle()

  if (verifyError || !object || object.owner_id !== null) {
    return {
      success: false,
      error: verifyError
        ? "Kansikuvan omistajuuden tarkistus epäonnistui: " + verifyError.message
        : "Kansikuvan omistajuus ei vapautunut odotetusti. Tilin poisto keskeytettiin.",
    }
  }

  return { success: true }
}

export async function deleteOwnAccount(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: "Kirjaudu sisään jatkaaksesi." }

  const { data: responsibilityData, error: responsibilityError } = await supabase.rpc("get_account_deletion_responsibilities")
  if (responsibilityError) return { success: false, error: responsibilityError.message }
  if ((responsibilityData?.groups?.length ?? 0) + (responsibilityData?.events?.length ?? 0) + (responsibilityData?.leagues?.length ?? 0) > 0) {
    return { success: false, error: "Siirrä ensin kaikki ryhmien, tapahtumien ja liigojen vastuut." }
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !sessionData.session?.access_token) {
    return { success: false, error: "Kirjautumisistunnon tarkistus epäonnistui. Kirjaudu uudelleen sisään." }
  }

  const service = createServiceClient()

  // Supabase Auth refuses to delete users who still own Storage objects.
  // Personal avatars are removed; community covers are retained without ownership.
  const { data: ownedObjects, error: objectError } = await service
    .schema("storage")
    .from("objects")
    .select("bucket_id, name")
    .eq("owner_id", user.id)

  if (objectError) return { success: false, error: "Tallennettujen tiedostojen tarkistus epäonnistui: " + objectError.message }

  for (const object of ownedObjects ?? []) {
    if (object.bucket_id === "avatars") {
      const { error } = await service.storage.from("avatars").remove([object.name])
      if (error) return { success: false, error: "Profiilikuvan poistaminen epäonnistui: " + error.message }
      continue
    }

    if (object.bucket_id === "group-covers") {
      const result = await releaseGroupCoverOwnership(service, object.name)
      if (!result.success) return { success: false, error: result.error }
      continue
    }

    return {
      success: false,
      error: "Tilillä on tiedostoja, joiden säilytystapaa ei tunnisteta (" + object.bucket_id + "). Poisto keskeytettiin turvallisuussyistä.",
    }
  }

  const { error: preparationError } = await supabase.rpc("prepare_account_deletion")
  if (preparationError) return { success: false, error: preparationError.message }

  // Revoke refresh tokens on every device immediately before deleting the user.
  // Already-issued access JWTs remain valid until their normal expiry.
  const { error: signOutError } = await service.auth.admin.signOut(sessionData.session.access_token)
  if (signOutError) return { success: false, error: "Kaikkien istuntojen päättäminen epäonnistui: " + signOutError.message }

  const { error: deletionError } = await service.auth.admin.deleteUser(user.id)
  if (deletionError) return { success: false, error: deletionError.message }

  await supabase.auth.signOut()
  revalidatePath("/")
  return { success: true }
}
