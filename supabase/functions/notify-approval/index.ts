import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emailLayout, heading, p, button, APP_URL } from "../_shared/email.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "kasper@gamestormers.dk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }
  const adminCheck = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: callerProfile } = await adminCheck.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!callerProfile?.is_admin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  try {
    const { email, full_name } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), { status: 400, headers: corsHeaders });
    }

    const firstName = (full_name || "Volunteer").split(" ")[0];

    const html = emailLayout(
      heading("Welcome to the team!") +
      p(`Hi ${firstName},`) +
      p("Great news — your application to volunteer at <strong>Nordisk Dans</strong> has been approved. We're really happy to have you with us.") +
      p("You can now log in, browse upcoming events and sign up for shifts.") +
      button("Open the volunteer platform") +
      p("See you on the dance floor,<br><strong>The Nordisk Dans team</strong>", true)
    );

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: "You're in — welcome to Nordisk Dans!",
        html,
      }),
    });

    return new Response(JSON.stringify({ sent: true }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
