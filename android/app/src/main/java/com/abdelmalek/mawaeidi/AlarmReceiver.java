package com.abdelmalek.mawaeidi;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;
import org.json.JSONObject;

public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String raw = intent == null ? null : intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_JSON);
        if (raw == null || raw.isEmpty()) return;
        try {
            JSONObject alarm = new JSONObject(raw);
            AlarmStore.removeAlarm(context, alarm.optString("id", ""));
            ContextCompat.startForegroundService(context, AlarmRingService.startIntent(context, raw));
        } catch (Exception ignored) {}
    }
}
