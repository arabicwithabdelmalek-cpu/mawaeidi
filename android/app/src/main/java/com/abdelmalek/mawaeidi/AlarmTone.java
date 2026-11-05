package com.abdelmalek.mawaeidi;

import android.content.Context;
import android.content.SharedPreferences;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;

// Saved only on the device: does not affect other users or synced lesson data.
final class AlarmTone {
    private static final String PREFS = "mawaeidi_alarm_tone_v1";
    private static final String KEY_URI = "alarm_sound_uri";

    private AlarmTone() {}

    static Uri defaultUri() {
        return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
    }

    static Uri selectedUri(Context context) {
        String saved = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_URI, "");
        if (saved == null || saved.isEmpty()) return defaultUri();
        Uri uri = Uri.parse(saved);
        if (!"content".equalsIgnoreCase(uri.getScheme()) && !"android.resource".equalsIgnoreCase(uri.getScheme())) {
            return defaultUri();
        }
        return uri;
    }

    static void save(Context context, Uri uri) {
        String value = uri == null || uri.equals(defaultUri()) ? "" : uri.toString();
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_URI, value).apply();
    }

    static String title(Context context) {
        String saved = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_URI, "");
        if (saved == null || saved.isEmpty()) return "نغمة المنبّه الافتراضية";
        try {
            Ringtone tone = RingtoneManager.getRingtone(context, selectedUri(context));
            if (tone != null) {
                String name = tone.getTitle(context);
                if (name != null && !name.trim().isEmpty()) return name;
            }
        } catch (Exception ignored) {}
        return "نغمة مختارة من الهاتف";
    }
}
