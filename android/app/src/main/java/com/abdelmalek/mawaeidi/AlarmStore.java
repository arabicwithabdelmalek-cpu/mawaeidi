package com.abdelmalek.mawaeidi;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

final class AlarmStore {
    private static final String PREFS = "mawaeidi_native_alarms";
    private static final String KEY_ALARMS = "alarms";
    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_USER = "user_id";

    private AlarmStore() {}

    private static SharedPreferences preferences(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static synchronized JSONArray getAlarms(Context context) {
        String raw = preferences(context).getString(KEY_ALARMS, "[]");
        try {
            return new JSONArray(raw == null ? "[]" : raw);
        } catch (JSONException ignored) {
            return new JSONArray();
        }
    }

    static synchronized void replaceAlarms(Context context, JSONArray alarms) {
        preferences(context).edit().putString(KEY_ALARMS, alarms.toString()).apply();
    }

    static synchronized void addAlarm(Context context, JSONObject alarm) {
        JSONArray current = getAlarms(context);
        JSONArray next = new JSONArray();
        String id = alarm.optString("id", "");
        for (int index = 0; index < current.length(); index++) {
            JSONObject item = current.optJSONObject(index);
            if (item != null && !id.equals(item.optString("id", ""))) next.put(item);
        }
        next.put(alarm);
        replaceAlarms(context, next);
    }

    static synchronized void removeAlarm(Context context, String id) {
        JSONArray current = getAlarms(context);
        JSONArray next = new JSONArray();
        for (int index = 0; index < current.length(); index++) {
            JSONObject item = current.optJSONObject(index);
            if (item != null && !id.equals(item.optString("id", ""))) next.put(item);
        }
        replaceAlarms(context, next);
    }

    static boolean isEnabled(Context context) {
        return preferences(context).getBoolean(KEY_ENABLED, false);
    }

    static void setEnabled(Context context, boolean enabled, String userId) {
        SharedPreferences.Editor editor = preferences(context).edit().putBoolean(KEY_ENABLED, enabled);
        if (userId != null) editor.putString(KEY_USER, userId);
        editor.apply();
    }

    static int pendingCount(Context context) {
        JSONArray alarms = getAlarms(context);
        long now = System.currentTimeMillis();
        int count = 0;
        for (int index = 0; index < alarms.length(); index++) {
            JSONObject item = alarms.optJSONObject(index);
            if (item != null && item.optLong("fireAt", 0L) > now) count++;
        }
        return count;
    }
}
