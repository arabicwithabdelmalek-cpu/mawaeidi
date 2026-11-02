package com.abdelmalek.mawaeidi;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONObject;

public class AlarmActionReceiver extends BroadcastReceiver {
    static final String ACTION_STOP = "com.abdelmalek.mawaeidi.ALARM_STOP";
    static final String ACTION_SNOOZE = "com.abdelmalek.mawaeidi.ALARM_SNOOZE";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? ACTION_STOP : intent.getAction();
        String raw = intent == null ? "" : intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_JSON);
        if (ACTION_SNOOZE.equals(action)) snooze(context, raw, 5);
        stop(context);
    }

    static void stop(Context context) {
        context.stopService(new Intent(context, AlarmRingService.class));
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.cancel(AlarmRingService.NOTIFICATION_ID);
    }

    static void snooze(Context context, String raw, int minutes) {
        try {
            JSONObject original = new JSONObject(raw == null ? "{}" : raw);
            long fireAt = System.currentTimeMillis() + Math.max(1, minutes) * 60000L;
            JSONObject snoozed = new JSONObject(original.toString());
            snoozed.put("id", original.optString("id", "alarm") + "|snooze|" + fireAt);
            snoozed.put("fireAt", fireAt);
            snoozed.put("leadMinutes", 0);
            snoozed.put("title", "انتهت الغفوة — حان وقت الحصة");
            AlarmStore.addAlarm(context, snoozed);
            AlarmScheduler.schedule(context, snoozed);
        } catch (Exception ignored) {}
    }
}
