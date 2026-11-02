package com.abdelmalek.mawaeidi;

import android.app.Activity;
import android.graphics.Color;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import org.json.JSONObject;

public class AlarmActivity extends Activity {
    private String alarmJson = "{}";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(Color.parseColor("#F3F6F8"));
        getWindow().setNavigationBarColor(Color.parseColor("#F3F6F8"));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }
        setVolumeControlStream(AudioManager.STREAM_ALARM);
        setContentView(R.layout.activity_alarm);
        bindAlarm();
    }

    private void bindAlarm() {
        alarmJson = getIntent().getStringExtra(AlarmScheduler.EXTRA_ALARM_JSON);
        if (alarmJson == null) alarmJson = "{}";
        try {
            JSONObject alarm = new JSONObject(alarmJson);
            ((TextView) findViewById(R.id.alarm_time)).setText(formatTime(alarm.optString("occurrenceTime", "")));
            ((TextView) findViewById(R.id.alarm_title)).setText(alarm.optString("title", "حان موعد الحصة"));
            ((TextView) findViewById(R.id.alarm_lesson_name)).setText(alarm.optString("lessonName", "حصة"));
            String body = alarm.optString("body", "");
            TextView bodyView = findViewById(R.id.alarm_body);
            bodyView.setText(body);
            bodyView.setVisibility(body.isEmpty() ? View.GONE : View.VISIBLE);
        } catch (Exception ignored) {}

        Button stop = findViewById(R.id.alarm_stop);
        Button snooze = findViewById(R.id.alarm_snooze);
        stop.setOnClickListener(view -> {
            AlarmActionReceiver.stop(this);
            finishAndRemoveTask();
        });
        snooze.setOnClickListener(view -> {
            AlarmActionReceiver.snooze(this, alarmJson, 5);
            AlarmActionReceiver.stop(this);
            finishAndRemoveTask();
        });
    }

    private String formatTime(String value) {
        if (value == null || !value.matches("^(?:[01]\\d|2[0-3]):[0-5]\\d$")) return "الآن";
        String[] parts = value.split(":");
        int hour = Integer.parseInt(parts[0]);
        String suffix = hour >= 12 ? "م" : "ص";
        int displayHour = hour % 12;
        if (displayHour == 0) displayHour = 12;
        return displayHour + ":" + parts[1] + " " + suffix;
    }

    @Override
    public void onBackPressed() {
        moveTaskToBack(true);
    }
}
