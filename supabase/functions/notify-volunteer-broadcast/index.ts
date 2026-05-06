import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emailLayout, heading, p, callout, button } from "../_shared/email.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "volunteers@gamestormers.dk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
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
    const { emails, subject, message, sender_name } = await req.json();
    if (!emails?.length || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: emails, subject, message" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const fromLabel = sender_name || "The Turkis team";

    const html = emailLayout(
      heading(subject) +
      p(`A message from <strong>${fromLabel}</strong>:`) +
      callout(message.replace(/\n/g, "<br>")) +
      button("Open volunteer platform") +
      p("This message was sent to Turkis volunteers.", true)
    );

    await Promise.allSettled(
      emails.map((email: string) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: FROM_EMAIL, to: email, subject, html }),
        })
      )
    );

    return new Response(JSON.stringify({ sent: emails.length }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
