import { redirect } from "next/navigation"

// All four creation categories share the same event creation screen.
export default function LeagueCreateRedirect() {
  redirect("/events/create")
}
