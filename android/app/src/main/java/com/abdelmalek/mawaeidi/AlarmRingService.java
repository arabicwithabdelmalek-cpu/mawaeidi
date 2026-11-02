package com.abdelmalek.mawaeidi;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import org.json.JSONObject;

public class AlarmRingService extends Service {
    static final int NOTIFICATION_ID = 7124;
    private static final String CHANNEL_ID = "mawaeidi_lesson_alarm_v1";
    private static final String ACTION_START = "com.abdelmalek.mawaeidi.ALARM_RING";
    private static final long MAX_RING_MILLIS = 5 * 60 * 1000L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private MediaPlayer player;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;

    static Intent startIntent(Context context, String alarmJson) {
        return new Intent(context, AlarmRingService.class)
            .setAction(ACTION_START)
            .putExtra(AlarmScheduler.EXTRA_ALARM_JSON, alarmJson);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String raw = intent == null ? "" : intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_JSON);
        try {
            JSONObject alarm = new JSONObject(raw == null ? "{}" : raw);
            startForeground(NOTIFICATION_ID, buildNotification(alarm, raw));
            acquireWakeLock();
            startSound();
            startVibration();
            handler.removeCallbacksAndMessages(null);
            handler.postDelayed(this::stopSelf, MAX_RING_MILLIS);
        } catch (Exception error) {
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    private Notification buildNotification(JSONObject alarm, String raw) {
        String id = alarm.optString("id", "alarm");
        String title = alarm.optString("title", "حان موعد الحصة");
        String lessonName = alarm.optString("lessonName", "حصة");
        String body = alarm.optString("body", "افتح مواعيدي لمعرفة التفاصيل.");

        Intent fullScreen = new Intent(this, AlarmActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP)
            .putExtra(AlarmScheduler.EXTRA_ALARM_JSON, raw);
        PendingIntent fullScreenIntent = PendingIntent.getActivity(
            this,
            AlarmScheduler.requestCode(id + "|screen"),
            fullScreen,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        PendingIntent stopIntent = actionIntent(AlarmActionReceiver.ACTION_STOP, raw, id + "|stop");
        PendingIntent snoozeIntent = actionIntent(AlarmActionReceiver.ACTION_SNOOZE, raw, id + "|snooze");

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_alarm_notification)
            .setColor(Color.parseColor("#2F6F8F"))
            .setContentTitle(title)
            .setContentText(lessonName)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(lessonName + "\n" + body))
            .setSubText("مواعيدي")
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setContentIntent(fullScreenIntent)
            .setFullScreenIntent(fullScreenIntent, true)
            .addAction(R.drawable.ic_alarm_notification, "غفوة 5 دقائق", snoozeIntent)
            .addAction(R.drawable.ic_alarm_notification, "إيقاف", stopIntent)
            .build();
    }

    private PendingIntent actionIntent(String action, String raw, String key) {
        Intent intent = new Intent(this, AlarmActionReceiver.class)
            .setAction(action)
            .setData(Uri.parse("mawaeidi://alarm-action/" + Uri.encode(key)))
            .putExtra(AlarmScheduler.EXTRA_ALARM_JSON, raw);
        return PendingIntent.getBroadcast(
            this,
            AlarmScheduler.requestCode(key),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "منبّهات الحصص", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("منبّه مواعيدي عند اقتراب الحصة");
        channel.setSound(null, null);
        channel.enableVibration(false);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        channel.setBypassDnd(false);
        manager.createNotificationChannel(channel);
    }

    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager == null) return;
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Mawaeidi:LessonAlarm");
        wakeLock.acquire(MAX_RING_MILLIS + 15000L);
    }

    private void startSound() {
        try {
            audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            AudioAttributes attributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            if (audioManager != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                    .setAudioAttributes(attributes)
                    .build();
                audioManager.requestAudioFocus(focusRequest);
            }
            Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (sound == null) sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            player = new MediaPlayer();
            player.setAudioAttributes(attributes);
            player.setDataSource(this, sound);
            player.setLooping(true);
            player.prepare();
            player.start();
        } catch (Exception ignored) {}
    }

    private void startVibration() {
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) return;
        long[] pattern = { 0, 700, 350, 700, 900 };
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
        } else {
            vibrator.vibrate(pattern, 0);
        }
    }

    private void cleanUp() {
        handler.removeCallbacksAndMessages(null);
        if (player != null) {
            try { player.stop(); } catch (Exception ignored) {}
            player.release();
            player = null;
        }
        if (vibrator != null) vibrator.cancel();
        if (audioManager != null && focusRequest != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioManager.abandonAudioFocusRequest(focusRequest);
        }
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
    }

    @Override
    public void onDestroy() {
        cleanUp();
        stopForeground(true);
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) { return null; }
}
