package com.abdelmalek.mawaeidi;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(
    name = "MawaeidiAlarm",
    permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) }
)
public class MawaeidiAlarmPlugin extends Plugin {
    private static final int MAX_ALARMS = 500;
    private static final long MAX_FUTURE_MILLIS = 370L * 24L * 60L * 60L * 1000L;

    @PluginMethod
    public void getState(PluginCall call) {
        call.resolve(stateObject());
    }

    @PluginMethod
    public void getAppInfo(PluginCall call) {
        JSObject info = new JSObject();
        info.put("packageName", getContext().getPackageName());
        info.put("versionName", BuildConfig.VERSION_NAME);
        info.put("versionCode", BuildConfig.VERSION_CODE);
        call.resolve(info);
    }

    @PluginMethod
    public void setEnabled(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        String userId = safeText(call.getString("userId", ""), 120);
        if (!enabled) {
            AlarmScheduler.cancelStored(getContext());
            AlarmStore.replaceAlarms(getContext(), new JSONArray());
        }
        AlarmStore.setEnabled(getContext(), enabled, userId);
        call.resolve(stateObject());
    }

    @PluginMethod
    public void replaceAlarms(PluginCall call) {
        JSArray source = call.getArray("alarms", new JSArray());
        JSONArray sanitized = new JSONArray();
        long now = System.currentTimeMillis();
        try {
            JSONArray incoming = new JSONArray(source.toString());
            int limit = Math.min(incoming.length(), MAX_ALARMS);
            for (int index = 0; index < limit; index++) {
                JSONObject item = incoming.optJSONObject(index);
                JSONObject alarm = sanitizeAlarm(item, now);
                if (alarm != null) sanitized.put(alarm);
            }
        } catch (Exception error) {
            call.reject("صيغة المنبّهات غير صالحة.", "invalid_alarms", error);
            return;
        }

        AlarmScheduler.cancelStored(getContext());
        AlarmStore.replaceAlarms(getContext(), sanitized);
        int scheduled = AlarmStore.isEnabled(getContext()) ? AlarmScheduler.scheduleAll(getContext(), sanitized) : 0;
        JSObject result = stateObject();
        result.put("scheduledCount", scheduled);
        call.resolve(result);
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        AlarmScheduler.cancelStored(getContext());
        AlarmStore.replaceAlarms(getContext(), new JSONArray());
        call.resolve(stateObject());
    }

    @PluginMethod
    public void testAlarm(PluginCall call) {
        int delay = Math.max(2, Math.min(30, call.getInt("delaySeconds", 3)));
        long fireAt = System.currentTimeMillis() + delay * 1000L;
        try {
            JSONObject alarm = new JSONObject();
            alarm.put("id", "native-test|" + fireAt);
            alarm.put("fireAt", fireAt);
            alarm.put("startsAt", fireAt);
            alarm.put("occurrenceTime", "");
            alarm.put("leadMinutes", 0);
            alarm.put("title", "اختبار منبّه مواعيدي");
            alarm.put("lessonName", "المنبّه يعمل بصوت واهتزاز");
            alarm.put("body", "جرّب زر الإيقاف أو الغفوة لمدة 5 دقائق.");
            AlarmStore.addAlarm(getContext(), alarm);
            boolean scheduled = AlarmScheduler.schedule(getContext(), alarm);
            JSObject result = stateObject();
            result.put("scheduled", scheduled);
            result.put("fireAt", fireAt);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("تعذّر إنشاء المنبّه التجريبي.", "test_alarm_failed", error);
        }
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) { call.resolve(stateObject()); return; }
        openSettings(call, new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, packageUri()));
    }

    @PluginMethod
    public void openFullScreenSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) { call.resolve(stateObject()); return; }
        openSettings(call, new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, packageUri()));
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
        openSettings(call, intent);
    }

    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        openSettings(call, new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
    }

    @PluginMethod
    public void openExternalUrl(PluginCall call) {
        Uri uri = Uri.parse(call.getString("url", ""));
        String path = uri.getPath();
        boolean trusted = "https".equalsIgnoreCase(uri.getScheme())
            && "github.com".equalsIgnoreCase(uri.getHost())
            && path != null
            && path.startsWith("/arabicwithabdelmalek-cpu/mawaeidi/releases/");
        if (!trusted) {
            call.reject("رابط التحديث غير موثوق.", "untrusted_update_url");
            return;
        }
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject result = new JSObject();
            result.put("opened", true);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("تعذّر فتح رابط التحديث.", "update_url_unavailable", error);
        }
    }

    private void openSettings(PluginCall call, Intent intent) {
        try {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve(stateObject());
        } catch (Exception error) {
            call.reject("تعذّر فتح إعدادات الهاتف.", "settings_unavailable", error);
        }
    }

    private JSObject stateObject() {
        JSObject state = new JSObject();
        state.put("enabled", AlarmStore.isEnabled(getContext()));
        state.put("notificationsAllowed", notificationsAllowed());
        state.put("exactAlarmAllowed", AlarmScheduler.canScheduleExact(getContext()));
        state.put("fullScreenAllowed", fullScreenAllowed());
        state.put("batteryOptimizationIgnored", batteryOptimizationIgnored());
        state.put("pendingCount", AlarmStore.pendingCount(getContext()));
        return state;
    }

    private boolean notificationsAllowed() {
        if (!NotificationManagerCompat.from(getContext()).areNotificationsEnabled()) return false;
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
            || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean fullScreenAllowed() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return true;
        NotificationManager manager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        return manager != null && manager.canUseFullScreenIntent();
    }

    private boolean batteryOptimizationIgnored() {
        PowerManager manager = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        return manager != null && manager.isIgnoringBatteryOptimizations(getContext().getPackageName());
    }

    private Uri packageUri() {
        return Uri.parse("package:" + getContext().getPackageName());
    }

    private JSONObject sanitizeAlarm(JSONObject source, long now) throws Exception {
        if (source == null) return null;
        String id = safeText(source.optString("id", ""), 220);
        long fireAt = source.optLong("fireAt", 0L);
        if (id.isEmpty() || fireAt <= now + 5000L || fireAt > now + MAX_FUTURE_MILLIS) return null;
        JSONObject alarm = new JSONObject();
        alarm.put("id", id);
        alarm.put("fireAt", fireAt);
        alarm.put("startsAt", source.optLong("startsAt", fireAt));
        alarm.put("lessonId", safeText(source.optString("lessonId", ""), 120));
        alarm.put("occurrenceDate", safeText(source.optString("occurrenceDate", ""), 10));
        alarm.put("occurrenceTime", safeText(source.optString("occurrenceTime", ""), 5));
        alarm.put("leadMinutes", Math.max(0, Math.min(1440, source.optInt("leadMinutes", 0))));
        alarm.put("title", safeText(source.optString("title", "حان موعد الحصة"), 100));
        alarm.put("lessonName", safeText(source.optString("lessonName", "حصة"), 160));
        alarm.put("body", safeText(source.optString("body", ""), 240));
        return alarm;
    }

    private String safeText(String value, int maxLength) {
        if (value == null) return "";
        String clean = value.replaceAll("[\\p{Cntrl}&&[^\\n\\t]]", "").trim();
        return clean.length() <= maxLength ? clean : clean.substring(0, maxLength);
    }
}
