import { supabase } from "@/lib/supabase";

export async function fetchUserCalendars() {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    throw new Error("User not found");
  }

  const { data: ownedCalendars, error: ownedCalendarsError } = await supabase
    .from("calendars")
    .select("*")
    .eq("user_id", userId);

  const { data: sharedCalendars, error: sharedCalendarsError } = await supabase
    .from("calendar_shares")
    .select("permission, calendar:calendar_id((*))")
    .eq("shared_with", userId);

  if (ownedCalendarsError || sharedCalendarsError) {
    throw new Error("Error fetching calendars");
  }

  const allCalendars = [...(ownedCalendars || []), ...(sharedCalendars || [])];

  return {
    editableCalendars: allCalendars.filter((c) => c.permission === "edit"),
    viewableCalendars: allCalendars.filter((c) => c.permission === "view"),
    copyableCalendars: allCalendars.filter((c) => c.permission === "copy"),
  };
}
