// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js"

Deno.serve(async (req) => {
  if (req.method === "POST") {
    try {

      const { user } = await req.json()

      const supabase = createClient(
        Deno.env.get("EXPO_PUBLIC_SUPABASE_URL")!,
        Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")!,
      )

      // Insert a new calendar entry for the user
      const { data, error } = await supabase
        .from("calendars")
        .insert({
          user_id: user.id,
          name: "Default",
          description: "Default calendar",
          color: "#85c1e9",
          is_primary: true,
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.error("Error inserting calendar:", error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        })
      }

      return new Response(JSON.stringify({ message: 'Default calendar created', data}), {
        headers: { "Content-Type": "application/json" },
        status: 201,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      })
    }
  } else {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { "Content-Type": "application/json" },
      status: 405,
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/calendar-signup' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
