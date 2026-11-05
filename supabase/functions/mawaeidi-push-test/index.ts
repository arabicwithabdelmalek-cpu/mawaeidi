import { createClient } from "npm:@supabase/supabase-js@2.115.0";
import postgres from "npm:postgres@3.4.7";
import webpush from "npm:web-push@3.6.7";

const ALLOWED_ORIGIN = "https://arabicwithabdelmalek-cpu.github.io";
const TEST_LESSON_ID = "__push_delivery_test__";

function headers(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization,apikey,x-client-info,content-type",
    "Vary": "Origin",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  };
}

function result(status: number, message: string): Response {
  return new Response(JSON.stringify({ message }), { status, headers: headers() });
}

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error("Missing server configuration");
  return value;
}

function serviceKey(): string {
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS")?.trim();
  if (!keys) return env("SUPABASE_SERVICE_ROLE_KEY");
  const map = JSON.parse(keys) as Record<string, unknown>;
  if (typeof map.default !== "string" || !map.default) throw new Error("Missing service key");
  return map.default;
}

function permittedPushHost(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    const host = url.hostname.toLowerCase();
    return host.endsWith(".push.apple.com")
      || host === "fcm.googleapis.com"
      || host === "updates.push.services.mozilla.com"
      || host.endsWith(".notify.windows.com");
  } catch {
    return false;
  }
}

// Genuine end-to-end Web Push test; authenticated and limited to one device/minute.
// Pushes only to a subscription already owned by the signed-in account.
Deno.serve(async request => {
  if (request.method === "OPTIONS") {
    return request.headers.get("origin") === ALLOWED_ORIGIN
      ? new Response(null, { status: 204, headers: headers() })
      : new Response(null, { status: 403 });
  }
  if (request.method !== "POST") return result(405, "Method not allowed");
  if (request.headers.get("origin") && request.headers.get("origin") !== ALLOWED_ORIGIN) {
    return result(403, "Origin is not allowed");
  }
  const authHeader = request.headers.get("authorization") ?? "";
  const token = /^Bearer\s+(.+)$/i.exec(authHeader)?.[1] || "";
  if (!token || token.length > 8192) return result(401, "Sign in first");

  let sql: ReturnType<typeof postgres> | undefined;
  try {
    const db = createClient(env("SUPABASE_URL"), serviceKey(), {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return result(401, "Sign in first");

    const raw = await request.text();
    if (raw.length > 4096) return result(413, "Invalid request");
    let endpoint: unknown;
    try { endpoint = (JSON.parse(raw) as { endpoint?: unknown }).endpoint; }
    catch { return result(400, "Invalid request"); }
    if (typeof endpoint !== "string" || endpoint.length > 2048 || !permittedPushHost(endpoint)) {
      return result(400, "Invalid push endpoint");
    }

    const { data: subscription, error: lookupError } = await db
      .from("mawaeidi_push_subscriptions")
      .select("id,endpoint,p256dh,auth_key")
      .eq("user_id", user.id)
      .eq("endpoint", endpoint)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!subscription) return result(404, "Enable notifications on this device first");

    const occurrenceAt = new Date(Math.floor(Date.now() / 60000) * 60000).toISOString();
    const { data: claim, error: claimError } = await db
      .from("mawaeidi_notification_log")
      .insert({
        subscription_id: subscription.id,
        lesson_id: TEST_LESSON_ID,
        occurrence_at: occurrenceAt,
        lead_minutes: 5,
        status: "pending"
      })
      .select("id")
      .single();
    if (claimError?.code === "23505") return result(429, "Wait one minute before testing again");
    if (claimError || !claim) throw claimError || new Error("Unable to log push test");

    try {
      sql = postgres(env("SUPABASE_DB_URL"), {
        prepare: false, max: 1, idle_timeout: 5, connect_timeout: 10
      });
      const secrets = await sql.unsafe(
        "select max(decrypted_secret) filter (where name='mawaeidi_vapid_public_key') as public_key, "
        + "max(decrypted_secret) filter (where name='mawaeidi_vapid_private_key') as private_key, "
        + "max(decrypted_secret) filter (where name='mawaeidi_vapid_subject') as subject "
        + "from vault.decrypted_secrets where name in "
        + "('mawaeidi_vapid_public_key','mawaeidi_vapid_private_key','mawaeidi_vapid_subject')"
      ) as { public_key: string|null; private_key: string|null; subject: string|null }[];
      const keys = secrets[0];
      if (!keys?.public_key || !keys.private_key || !keys.subject) throw new Error("Missing VAPID configuration");

      webpush.setVapidDetails(keys.subject, keys.public_key, keys.private_key);
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth_key }
      }, JSON.stringify({
        title: "اختبار تنبيهات مواعيدي",
        body: "وصل إشعار تجريبي من خادم مواعيدي إلى هاتفك.",
        url: "https://arabicwithabdelmalek-cpu.github.io/mawaeidi/",
        tag: "mawaeidi-push-test-" + Date.now()
      }), { TTL: 120, urgency: "high", timeout: 10000 });

      await db.from("mawaeidi_notification_log")
        .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
        .eq("id", claim.id);
      return result(200, "Push accepted by the provider");
    } catch (error) {
      const status = Number((error as { statusCode?: unknown })?.statusCode);
      await db.from("mawaeidi_notification_log").update({
        status: "failed",
        last_error: (error instanceof Error ? error.message : String(error)).slice(0, 1000)
      }).eq("id", claim.id);
      if (status === 404 || status === 410) {
        await db.from("mawaeidi_push_subscriptions")
          .delete().eq("user_id", user.id).eq("id", subscription.id);
        return result(410, "Subscription expired; enable notifications again");
      }
      console.error("Web Push delivery test failed", error instanceof Error ? error.name : "unknown");
      return result(502, "Unable to deliver test notification");
    }
  } catch (error) {
    console.error("Web Push test failed", error instanceof Error ? error.name : "unknown");
    return result(500, "Push test temporarily unavailable");
  } finally {
    if (sql) await sql.end({ timeout: 2 }).catch(() => undefined);
  }
});
