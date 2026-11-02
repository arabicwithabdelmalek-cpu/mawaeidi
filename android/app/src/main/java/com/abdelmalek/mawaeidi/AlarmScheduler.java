package com.abdelmalek.mawaeidi;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

final class AlarmScheduler {
    static final String ACTION_FIRE = "com.abdelmalek.mawaeidi.ALARM_FIRE";
    static final String EXTRA_ALARM_JSON = "alarm_json";

    private AlarmScheduler() {}

    static boolean canScheduleExact(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        return manager != null && manager.canScheduleExactAlarms();
    }

    static boolean schedule(Context context, JSONObject alarm) {
        long triggerAt = alarm.optLong("fireAt", 0L);
        String id = alarm.optString("id", "");
        if (id.isEmpty() || triggerAt <= System.currentTimeMillis()) return false;
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) return false;

        PendingIntent fireIntent = firePendingIntent(context, alarm, PendingIntent.FLAG_UPDATE_CURRENT);
        if (canScheduleExact(context)) {
            Intent openApp = new Intent(context, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent showIntent = PendingIntent.getActivity(
                context,
                requestCode(id + "|show"),
                openApp,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            manager.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerAt, showIntent), fireIntent);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, fireIntent);
        } else {
            manager.set(AlarmManager.RTC_WAKEUP, triggerAt, fireIntent);
        }
        return true;
    }

    static void cancel(Context context, JSONObject alarm) {
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) return;
        PendingIntent pendingIntent = firePendingIntent(context, alarm, PendingIntent.FLAG_NO_CREATE);
        if (pendingIntent != null) {
            manager.cancel(pendingIntent);
            pendingIntent.cancel();
        }
    }

    static void cancelStored(Context context) {
        JSONArray current = AlarmStore.getAlarms(context);
        for (int index = 0; index < current.length(); index++) {
            JSONObject alarm = current.optJSONObject(index);
            if (alarm != null) cancel(context, alarm);
        }
    }

    static int scheduleAll(Context context, JSONArray alarms) {
        int scheduled = 0;
        for (int index = 0; index < alarms.length(); index++) {
            JSONObject alarm = alarms.optJSONObject(index);
            if (alarm != null && schedule(context, alarm)) scheduled++;
        }
        return scheduled;
    }

    static void rescheduleStored(Context context) {
        JSONArray current = AlarmStore.getAlarms(context);
        JSONArray future = new JSONArray();
        long now = System.currentTimeMillis();
        for (int index = 0; index < current.length(); index++) {
            JSONObject alarm = current.optJSONObject(index);
            if (alarm != null && alarm.optLong("fireAt", 0L) > now) future.put(alarm);
        }
        AlarmStore.replaceAlarms(context, future);
        if (AlarmStore.isEnabled(context)) scheduleAll(context, future);
    }

    private static PendingIntent firePendingIntent(Context context, JSONObject alarm, int baseFlag) {
        String id = alarm.optString("id", "alarm");
        Intent intent = new Intent(context, AlarmReceiver.class)
            .setAction(ACTION_FIRE)
            .setData(Uri.parse("mawaeidi://alarm/" + Uri.encode(id)))
            .putExtra(EXTRA_ALARM_JSON, alarm.toString());
        return PendingIntent.getBroadcast(
            context,
            requestCode(id),
            intent,
            baseFlag | PendingIntent.FLAG_IMMUTABLE
        );
    }

    static int requestCode(String value) {
        return value == null ? 0 : value.hashCode() & 0x7fffffff;
    }
}
