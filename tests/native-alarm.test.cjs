const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

const config=JSON.parse(read("capacitor.config.json"));
assert.equal(config.appId,"com.abdelmalek.mawaeidi");
assert.equal(config.webDir,"mobile-dist");
assert.equal(config.server,undefined,"The production app must bundle local assets instead of loading the live website");

const index=read("index.html");
assert.match(index,/native-bridge\.js/);
assert.match(index,/mobile-app\.css/);

const app=read("app-main.js");
assert.match(app,/function nativeAlarmPayload\(/);
assert.match(app,/NATIVE_ALARM_HORIZON_DAYS=42/);
assert.match(app,/window\.MawaeidiNative\.syncFromApp/);
assert.match(app,/function nativeOccurrenceCanAlert/);

const bridge=read("native-bridge.js");
for(const method of ["getAlarmState","enableAlarms","disableAlarms","syncFromApp","testAlarm"]){
  assert.match(bridge,new RegExp(`\\b${method}\\b`));
}

const manifest=read("android/app/src/main/AndroidManifest.xml");
for(const permission of [
  "SCHEDULE_EXACT_ALARM",
  "USE_FULL_SCREEN_INTENT",
  "POST_NOTIFICATIONS",
  "RECEIVE_BOOT_COMPLETED",
  "FOREGROUND_SERVICE_MEDIA_PLAYBACK"
]) assert.match(manifest,new RegExp(permission));
for(const component of ["AlarmActivity","AlarmRingService","AlarmReceiver","BootReceiver"]){
  assert.match(manifest,new RegExp(component));
}

const plugin=read("android/app/src/main/java/com/abdelmalek/mawaeidi/MawaeidiAlarmPlugin.java");
assert.match(plugin,/replaceAlarms/);
assert.match(plugin,/canUseFullScreenIntent/);
assert.match(plugin,/ACTION_REQUEST_SCHEDULE_EXACT_ALARM/);

const service=read("android/app/src/main/java/com/abdelmalek/mawaeidi/AlarmRingService.java");
assert.match(service,/setLooping\(true\)/);
assert.match(service,/setFullScreenIntent/);
assert.match(service,/MAX_RING_MILLIS/);

console.log("Native alarm architecture checks passed.");
