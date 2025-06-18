import { supabase } from "@/lib/supabase";

export async function fetchUserCalendars() {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  console.log("CalendarService: Fetching calendars for user:", userId);

  if (!userId) {
    throw new Error("User not found");
  }

  // Fetch owned calendars
  const { data: ownedCalendars, error: ownedCalendarsError } = await supabase
    .from("calendars")
    .select("*")
    .eq("user_id", userId);

  console.log("CalendarService: Owned calendars:", ownedCalendars);

  if (ownedCalendarsError) {
    console.error(
      "CalendarService: Error fetching owned calendars:",
      ownedCalendarsError
    );
    throw new Error("Error fetching owned calendars");
  }

  // Fetch shared calendars with their permissions
  const { data: sharedCalendars, error: sharedCalendarsError } = await supabase
    .from("calendar_shares")
    .select(
      `
      permission,
      calendar:calendar_id (
        id,
        name,
        color,
        is_primary,
        user_id,
        created_at
      )
    `
    )
    .eq("shared_with", userId);

  console.log("CalendarService: Shared calendars:", sharedCalendars);

  if (sharedCalendarsError) {
    console.error(
      "CalendarService: Error fetching shared calendars:",
      sharedCalendarsError
    );
    throw new Error("Error fetching shared calendars");
  }

  // Process owned calendars
  const editableCalendars = (ownedCalendars || []).map((calendar) => ({
    ...calendar,
    permission: "edit" as const,
  }));

  // Process shared calendars
  const sharedCalendarsList = (sharedCalendars || [])
    .filter((share) => share.calendar) // Filter out any null calendars
    .map((share) => ({
      ...share.calendar,
      permission: share.permission,
    }));

  console.log("CalendarService: Processed calendars:", {
    editableCalendars,
    sharedCalendarsList,
  });

  // Combine and sort calendars by permission
  const result = {
    editableCalendars: [
      ...editableCalendars,
      ...sharedCalendarsList.filter((c) => c.permission === "edit"),
    ],
    viewableCalendars: sharedCalendarsList.filter(
      (c) => c.permission === "view"
    ),
    copyableCalendars: sharedCalendarsList.filter(
      (c) => c.permission === "copy"
    ),
  };

  console.log("CalendarService: Final result:", result);
  return result;
}
