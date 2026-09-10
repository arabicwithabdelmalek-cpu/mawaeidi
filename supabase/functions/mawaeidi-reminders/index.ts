import { createClient } from "npm:@supabase/supabase-js@2.115.0";
import postgres from "npm:postgres@3.4.7";
import webpush from "npm:web-push@3.6.7";
import {
  displayTime,
  lessonReminderLeads,
  matchingLessons,
  normalizeReminderLeads,
  REMINDER_LEAD_OPTIONS,
  reminderCandidates,
  timeParts,
  validLessons
} from "./core.ts";

type SubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  timezone: string;
  lead_minutes: number;
  lead_minutes_list: number[] | null;
};

type RuntimeConfig = {
  reminder_cron_secret: string | null;
  vapid_public_key: string | null;
  vapid_private_key: string | null;
  vapid_subject: string | null;
  app_url: string | null;
};

type SqlClient = ReturnType<typeof postgres>;

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function supabaseServerKey(): string {
  const dictionary = Deno.env.get("SUPABASE_SECRET_KEYS")?.trim();
  if (!dictionary) return env("SUPABASE_SERVICE_ROLE_KEY");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(dictionary) as Record<string, unknown>;
  } catch {
    throw new Error("SUPABASE_SECRET_KEYS is not valid JSON");
  }
  const value = parsed.default;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("SUPABASE_SECRET_KEYS has no default key");
  }
  return value.trim();
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function secureEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function loadRuntimeConfig(sql: SqlClient): Promise<Required<RuntimeConfig>> {
  const rows = await sql<RuntimeConfig[]>`
    select
      max(decrypted_secret) filter (where name = 'mawaeidi_reminder_cron_secret') as reminder_cron_secret,
      max(decrypted_secret) filter (where name = 'mawaeidi_vapid_public_key') as vapid_public_key,
      max(decrypted_secret) filter (where name = 'mawaeidi_vapid_private_key') as vapid_private_key,
      max(decrypted_secret) filter (where name = 'mawaeidi_vapid_subject') as vapid_subject,
      max(decrypted_secret) filter (where name = 'mawaeidi_app_url') as app_url
    from vault.decrypted_secrets
    where name in (
      'mawaeidi_reminder_cron_secret',
      'mawaeidi_vapid_public_key',
      'mawaeidi_vapid_private_key',
      'mawaeidi_vapid_subject',
      'mawaeidi_app_url'
    )
  `;
  const config = rows[0];
  if (
    !config?.reminder_cron_secret
    || !config.vapid_public_key
    || !config.vapid_private_key
    || !config.vapid_subject
    || !config.app_url
  ) {
    throw new Error("Reminder configuration is incomplete");
  }
  return config as Required<RuntimeConfig>;
}

async function claimReminder(
  sql: SqlClient,
  subscriptionId: string,
  lessonId: string,
  occurrenceAt: Date,
  leadMinutes: number
): Promise<string | null> {
  const rows = await sql<{ id: string }[]>`
    insert into public.mawaeidi_notification_log (
      subscription_id,
      lesson_id,
      occurrence_at,
      lead_minutes
    )
    values (
      ${subscriptionId}::uuid,
      ${lessonId},
      ${occurrenceAt.toISOString()}::timestamptz,
      ${leadMinutes}
    )
    on conflict (subscription_id, lesson_id, occurrence_at, lead_minutes)
    do update set
      status = 'pending',
      attempt_count = public.mawaeidi_notification_log.attempt_count + 1,
      claimed_at = now(),
      sent_at = null,
      last_error = null
    where public.mawaeidi_notification_log.status = 'failed'
       or (
         public.mawaeidi_notification_log.status = 'pending'
         and public.mawaeidi_notification_log.claimed_at < now() - interval '3 minutes'
       )
    returning id::text
  `;
  return rows[0]?.id || null;
}

async function markReminderSent(sql: SqlClient, claimId: string): Promise<void> {
  await sql`
    update public.mawaeidi_notification_log
    set status = 'sent', sent_at = now(), last_error = null
    where id = ${claimId}::bigint
  `;
}

async function markReminderFailed(sql: SqlClient, claimId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  await sql`
    update public.mawaeidi_notification_log
    set status = 'failed', last_error = ${message.slice(0, 1000)}
    where id = ${claimId}::bigint
  `;
}

Deno.serve(async request => {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let sql: SqlClient | null = null;
  try {
    sql = postgres(env("SUPABASE_DB_URL"), {
      prepare: false,
      max: 1,
      idle_timeout: 5,
      connect_timeout: 10
    });
    const config = await loadRuntimeConfig(sql);

    const suppliedSecret = request.headers.get("x-mawaeidi-cron-secret") || "";
    if (
      !suppliedSecret
      || !secureEqual(await sha256(suppliedSecret), await sha256(config.reminder_cron_secret))
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    const supabaseUrl = env("SUPABASE_URL");
    const serverKey = supabaseServerKey();
    const db = createClient(supabaseUrl, serverKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: subscriptions, error: subscriptionError } = await db
      .from("mawaeidi_push_subscriptions")
      .select("id,user_id,endpoint,p256dh,auth_key,timezone,lead_minutes,lead_minutes_list");
    if (subscriptionError) throw subscriptionError;

    const rows = (subscriptions || []) as SubscriptionRow[];
    if (!rows.length) return Response.json({ checked: 0, sent: 0, stale: 0, errors: 0 });

    webpush.setVapidDetails(config.vapid_subject, config.vapid_public_key, config.vapid_private_key);

    const userIds = [...new Set(rows.map(row => row.user_id))];
    const { data: schedules, error: scheduleError } = await db
      .from("mawaeidi_data")
      .select("user_id,lessons")
      .in("user_id", userIds);
    if (scheduleError) throw scheduleError;
    const lessonsByUser = new Map((schedules || []).map(row => [row.user_id, validLessons(row.lessons)]));

    const baseMinute = new Date(Math.floor(Date.now() / 60000) * 60000);
    let sent = 0;
    let stale = 0;
    let errors = 0;

    subscriptionsLoop: for (const subscription of rows) {
      const defaultLeads = normalizeReminderLeads(
        subscription.lead_minutes_list,
        [subscription.lead_minutes]
      );
      const userLessons = lessonsByUser.get(subscription.user_id) || [];

      for (const leadMinutes of REMINDER_LEAD_OPTIONS) {
        const candidateOccurrences = reminderCandidates(baseMinute, leadMinutes, 2).map(occurrenceAt => {
          const local = timeParts(occurrenceAt, subscription.timezone || "UTC");
          return { occurrenceAt, local };
        });

        for (const { occurrenceAt, local } of candidateOccurrences) {
          if (!local.day || !local.time) continue;
          const matches = matchingLessons(userLessons, local.day, local.time)
            .filter(lesson => lessonReminderLeads(lesson, defaultLeads).includes(leadMinutes));

          for (const lesson of matches) {
            const lessonId = typeof lesson.id === "string" && lesson.id ? lesson.id : "unknown";
            let claimId: string | null = null;
            try {
              claimId = await claimReminder(sql, subscription.id, lessonId, occurrenceAt, leadMinutes);
            } catch (claimError) {
              errors++;
              console.error("Unable to claim reminder", claimError);
              continue;
            }
            if (!claimId) continue;

            const name = typeof lesson.name === "string" && lesson.name.trim() ? lesson.name.trim() : "حصة";
            const platform = typeof lesson.platform === "string" && lesson.platform.trim()
              ? ` · ${lesson.platform.trim()}`
              : "";
            const remainingMinutes = Math.max(
              0,
              Math.round((occurrenceAt.getTime() - baseMinute.getTime()) / 60000)
            );
            const payload = JSON.stringify({
              title: remainingMinutes === 0
                ? "موعد الحصة الآن"
                : `حصة بعد ${remainingMinutes === 60 ? "ساعة" : remainingMinutes + " دقيقة"}`,
              body: `${name} · ${displayTime(local.time)}${platform}`,
              url: config.app_url,
              timestamp: occurrenceAt.getTime(),
              tag: `mawaeidi-${lessonId}-${occurrenceAt.toISOString()}-${leadMinutes}`
            });

            try {
              await webpush.sendNotification({
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth_key }
              }, payload, {
                TTL: Math.max(120, remainingMinutes * 60),
                urgency: "high",
                timeout: 10000
              });
              await markReminderSent(sql, claimId);
              sent++;
            } catch (error) {
              const statusCode = Number((error as { statusCode?: unknown })?.statusCode);
              if (statusCode === 404 || statusCode === 410) {
                const { error: deleteError } = await db
                  .from("mawaeidi_push_subscriptions")
                  .delete()
                  .eq("id", subscription.id);
                if (deleteError) {
                  await markReminderFailed(sql, claimId, deleteError);
                  errors++;
                } else {
                  stale++;
                }
                continue subscriptionsLoop;
              }

              await markReminderFailed(sql, claimId, error);
              errors++;
              console.error("Unable to send reminder", error);
            }
          }
        }
      }
    }

    const retentionCutoff = new Date(baseMinute.getTime() - 40 * 86400000).toISOString();
    await sql`
      delete from public.mawaeidi_notification_log
      where claimed_at < ${retentionCutoff}::timestamptz
    `;

    return Response.json({ checked: rows.length, sent, stale, errors });
  } catch (error) {
    console.error("Mawaeidi reminder run failed", error);
    return Response.json({ error: "Reminder run failed" }, { status: 500 });
  } finally {
    if (sql) await sql.end({ timeout: 2 }).catch(() => undefined);
  }
});
