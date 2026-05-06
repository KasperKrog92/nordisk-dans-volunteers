import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let targetUserId = user.id;
  const body = req.headers.get("content-type")?.includes("application/json")
    ? await req.json().catch(() => ({}))
    : {};

  if (body.target_user_id && body.target_user_id !== user.id) {
    const { data: callerProfile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!callerProfile?.is_admin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: CORS });
    }
    targetUserId = body.target_user_id;
  }

  await admin.from("signups").delete().eq("user_id", targetUserId);
  await admin.from("messages").delete().eq("user_id", targetUserId);
  await admin.from("volunteer_tags").delete().eq("user_id", targetUserId);
  await admin.from("profiles").delete().eq("id", targetUserId);

  const { error: deleteError } = await admin.auth.admin.deleteUser(targetUserId);
  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500, headers: CORS });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: CORS });
});
