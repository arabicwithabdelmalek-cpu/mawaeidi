import { createClient } from "npm:@supabase/supabase-js@2.115.0";

const SITE_ORIGIN = "https://arabicwithabdelmalek-cpu.github.io";
const SITE_URL = "https://arabicwithabdelmalek-cpu.github.io/mawaeidi/";
const cors = {
  "Access-Control-Allow-Origin": SITE_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
  "Cache-Control": "no-store",
};
const respond = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
const validPassword = (value: unknown) => typeof value === "string" &&
  value.length >= 10 && value.length <= 128 && !/\s/.test(value);
const validUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return respond(405, { error: "method_not_allowed" });
  const origin = req.headers.get("origin");
  if (origin && origin !== SITE_ORIGIN) return respond(403, { error: "origin_not_allowed" });

  const authorization = req.headers.get("authorization") || "";
  const tokenMatch = /^Bearer\s+(\S+)$/i.exec(authorization);
  if (!tokenMatch) return respond(401, { error: "sign_in_required" });

  const baseUrl = Deno.env.get("SUPABASE_URL");
  let adminKey = "";
  try {
    const secrets = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    adminKey = secrets.default || "";
  } catch { /* Legacy key fallback */ }
  adminKey ||= Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!baseUrl || !adminKey) return respond(503, { error: "service_unavailable" });

  // This client is intentionally server-only. NEVER embed adminKey in the frontend.
  const supabaseAdmin = createClient(baseUrl, adminKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Auth verifies the caller's signed access token with the Auth server.
    const { data: identity, error: identityError } =
      await supabaseAdmin.auth.getUser(tokenMatch[1]);
    if (identityError || !identity.user?.id || identity.user.is_anonymous) {
      return respond(401, { error: "invalid_session" });
    }

    // Direct database membership check; never trust client flags, email, or user metadata.
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("mawaeidi_usage_admins")
      .select("user_id").eq("user_id", identity.user.id).maybeSingle();
    if (membershipError) return respond(503, { error: "permission_check_failed" });
    if (!membership) return respond(403, { error: "admin_only" });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respond(400, { error: "invalid_request" });
    }
    const action = text((body as Record<string, unknown>).action);

    if (action === "list") {
      const result: Array<Record<string, unknown>> = [];
      for (let page = 1; page <= 10; page++) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({page, perPage:100});
        if (error) return respond(502, { error: "users_unavailable" });
        const batch = data.users || [];
        for (const user of batch) result.push({
          id: user.id,
          email: user.email || "",
          name: typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name.slice(0, 100) : "",
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at || null,
          email_confirmed_at: user.email_confirmed_at || null,
          is_owner: user.id === identity.user.id,
        });
        if (batch.length < 100) break;
      }
      return respond(200, { users: result });
    }

    if (action === "create") {
      const email = text((body as Record<string, unknown>).email).toLowerCase();
      const password = (body as Record<string, unknown>).password;
      const name = text((body as Record<string, unknown>).name);
      if (!validEmail(email)) return respond(400, { error: "invalid_email" });
      if (!validPassword(password)) return respond(400, { error: "weak_password" });
      if (name.length > 100) return respond(400, { error: "name_too_long" });
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email, password: password as string, email_confirm: true,
        user_metadata: { full_name: name },
      });
      if (error) {
        // Don't echo credentials or underlying error messages.
        if (/already|registered|exists|duplicate/i.test(error.message))
          return respond(409, { error: "email_exists" });
        return respond(400, { error: "create_failed" });
      }
      return respond(200, { ok: true, user: {
        id: data.user?.id || "", email, name,
        created_at: data.user?.created_at || new Date().toISOString(),
      } });
    }

    if (action === "set_password") {
      const id = text((body as Record<string, unknown>).user_id);
      const password = (body as Record<string, unknown>).password;
      if (!validUuid(id)) return respond(400, { error: "invalid_user" });
      if (!validPassword(password)) return respond(400, { error: "weak_password" });
      const { data: target, error: targetError } =
        await supabaseAdmin.auth.admin.getUserById(id);
      if (targetError || !target.user) return respond(404, { error: "user_not_found" });
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        id, { password: password as string }
      );
      if (error) return respond(400, { error: "password_change_failed" });
      return respond(200, { ok: true });
    }

    return respond(400, { error: "unsupported_action" });
  } catch {
    return respond(500, { error: "unexpected_error" });
  }
});
