import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emailLayout, heading, p, callout, button } from "../_shared/email.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "kasper@gamestormers.dk";
const COOLDOWN_MINUTES = 10;

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const message = payload.record;

    if (!message) {
      return new Response(JSON.stringify({ error: "No record in payload" }), { status: 400 });
    }

    const eventId: string = message.event_id;
    const senderId: string = message.user_id;
    const content: string = message.content ?? "";
    const preview = content.length > 200 ? content.slice(0, 200) + "…" : content;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check 10-minute cooldown per event
    const cooldownCutoff = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000).toISOString();
    const { data: logRow } = await supabase
      .from("chat_notification_log")
      .select("last_sent")
      .eq("event_id", eventId)
      .single();

    if (logRow && logRow.last_sent > cooldownCutoff) {
      return new Response(JSON.stringify({ skipped: "cooldown" }), { status: 200 });
    }

    const [{ data: senderProfile }, { data: event }] = await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", senderId).single(),
      supabase.from("events").select("title").eq("id", eventId).single(),
    ]);

    const senderName = senderProfile?.full_name ?? "A volunteer";
    const eventTitle = event?.title ?? "an event";

    const [{ data: signups, error: signupsError }, { data: optouts }, { data: admins }] = await Promise.all([
      supabase.from("signups").select("profiles(id, email), shifts!inner(event_id)").eq("shifts.event_id", eventId),
      supabase.from("chat_notification_optouts").select("user_id").eq("event_id", eventId),
      supabase.from("profiles").select("id, email").eq("is_admin", true).eq("status", "approved"),
    ]);
    if (signupsError) throw signupsError;

    const optedOut = new Set((optouts ?? []).map((r: any) => r.user_id));

    const emails = new Set<string>();
    for (const signup of signups ?? []) {
      const profile = (signup as any).profiles;
      if (profile?.email && !optedOut.has(profile.id)) emails.add(profile.email);
    }
    for (const admin of admins ?? []) {
      if (admin.email && !optedOut.has(admin.id)) emails.add(admin.email);
    }

    if (senderProfile?.email) emails.delete(senderProfile.email);

    if (emails.size === 0) {
      return new Response(JSON.stringify({ skipped: "no_recipients" }), { status: 200 });
    }

    const html = emailLayout(
      heading(`New message in ${eventTitle}`) +
      p(`<strong>${senderName}</strong> posted in the event chat:`) +
      callout(preview.replace(/\n/g, "<br>")) +
      button("Open event chat", `https://nordisk.gamestormers.dk/#event/${eventId}`) +
      p("You're receiving this because you are signed up for this event.", true)
    );

    await Promise.allSettled(
      [...emails].map((email) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: email,
            subject: `${senderName} posted in ${eventTitle} — Nordisk Dans`,
            html,
          }),
        })
      )
    );

    await supabase
      .from("chat_notification_log")
      .upsert({ event_id: eventId, last_sent: new Date().toISOString() }, { onConflict: "event_id" });

    return new Response(JSON.stringify({ sent: emails.size }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
