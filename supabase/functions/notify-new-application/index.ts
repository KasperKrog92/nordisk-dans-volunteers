import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emailLayout, heading, p, infoTable, button } from "../_shared/email.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "kkandersen01@gmail.com";

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const profile = payload.record;

    if (!profile || (profile.status !== "pending" && profile.status !== "approved")) {
      return new Response(JSON.stringify({ skipped: "irrelevant_status" }), { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: admins } = await supabase
      .from("profiles")
      .select("email")
      .eq("is_admin", true)
      .eq("status", "approved");

    const adminEmails = (admins ?? []).map((a: any) => a.email).filter(Boolean);
    if (adminEmails.length === 0) {
      return new Response(JSON.stringify({ skipped: "no_admins" }), { status: 200 });
    }

    const applicantName = profile.full_name || profile.email || "Unknown";
    const isPending = profile.status === "pending";

    const subject = isPending
      ? `New volunteer application — ${applicantName}`
      : `New volunteer joined — ${applicantName}`;

    const html = isPending
      ? emailLayout(
          heading("New volunteer application") +
          p("Someone has applied to join the Nordisk Dans volunteer team and is waiting for your review.") +
          infoTable([
            ["Name", applicantName],
            ["Email", profile.email || "—"],
          ]) +
          button("Review in admin panel", "https://kasperkrog92.github.io/nordisk-dans-volunteers/#admin")
        )
      : emailLayout(
          heading("New volunteer signed up") +
          p(`<strong>${applicantName}</strong> has signed up directly via open registration and has been automatically approved.`) +
          infoTable([
            ["Name", applicantName],
            ["Email", profile.email || "—"],
          ]) +
          button("View in admin panel", "https://kasperkrog92.github.io/nordisk-dans-volunteers/#admin")
        );

    await Promise.allSettled(
      adminEmails.map((email: string) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: FROM_EMAIL, to: email, subject, html }),
        })
      )
    );

    return new Response(JSON.stringify({ sent: adminEmails.length }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
