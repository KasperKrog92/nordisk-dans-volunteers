import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emailLayout, heading, p, infoTable, button } from "../_shared/email.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "kasper@gamestormers.dk";
const MIN_SIGNUP_AGE_MINUTES = 10;

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const signup = payload.old_record;

    if (!signup) {
      return new Response(JSON.stringify({ error: "No old_record in payload" }), { status: 400 });
    }

    const ageMs = Date.now() - new Date(signup.signed_up_at).getTime();
    if (ageMs < MIN_SIGNUP_AGE_MINUTES * 60 * 1000) {
      return new Response(JSON.stringify({ skipped: "signup_too_recent" }), { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [
      { data: volunteerProfile, error: profileError },
      { data: shift, error: shiftError },
      { data: admins, error: adminsError },
    ] = await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", signup.user_id).single(),
      supabase.from("shifts").select("role_name, start_time, end_time, event_id, events(id, title)").eq("id", signup.shift_id).single(),
      supabase.from("profiles").select("email").eq("is_admin", true),
    ]);

    if (profileError) throw profileError;
    if (shiftError) throw shiftError;
    if (adminsError) throw adminsError;

    const adminEmails = (admins ?? []).map((a: any) => a.email).filter(Boolean);
    if (adminEmails.length === 0) {
      return new Response(JSON.stringify({ skipped: "no_admins" }), { status: 200 });
    }

    const volunteerName = volunteerProfile?.full_name ?? volunteerProfile?.email ?? "Unknown volunteer";
    const eventTitle = (shift as any).events?.title ?? "Unknown event";
    const eventId = (shift as any).events?.id ?? null;
    const shiftRole = (shift as any).role_name ?? "Unknown shift";
    const shiftTime = shift.start_time
      ? new Date(shift.start_time).toLocaleString("da-DK", { timeZone: "Europe/Copenhagen" })
      : "—";
    const adminEventUrl = eventId
      ? `https://kasperkrog92.github.io/nordisk-dans-volunteers/#admin-event/${eventId}`
      : `https://kasperkrog92.github.io/nordisk-dans-volunteers/`;

    const html = emailLayout(
      heading("Shift cancellation") +
      p(`<strong>${volunteerName}</strong> has cancelled their signup. You may want to find a replacement.`) +
      infoTable([
        ["Volunteer", volunteerName],
        ["Event", eventTitle],
        ["Shift", shiftRole],
        ["Shift start", shiftTime],
      ]) +
      button("View event in admin panel", adminEventUrl)
    );

    const results = await Promise.allSettled(
      adminEmails.map(async (email: string) => {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: email,
            subject: `Cancellation — ${volunteerName} · ${eventTitle}`,
            html,
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Resend rejected ${email}: ${res.status} ${body}`);
        }
        return email;
      })
    );

    const failures = results.filter(r => r.status === "rejected");
    if (failures.length) {
      failures.forEach(f => console.error((f as PromiseRejectedResult).reason));
    }

    return new Response(JSON.stringify({ sent: results.length - failures.length, failed: failures.length }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
