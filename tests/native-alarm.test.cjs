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
for(const method of ["getAlarmState","enableAlarms","disableAlarms","syncFromApp","testAlarm","getAppInfo","checkForUpdates","openUpdate"]){
  assert.match(bridge,new RegExp(`\\b${method}\\b`));
}
assert.match(bridge,/api\.github\.com\/repos\/arabicwithabdelmalek-cpu\/mawaeidi\/releases/);
assert.match(bridge,/nativeUpdateBanner/);

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
assert.match(plugin,/getAppInfo/);
assert.match(plugin,/openExternalUrl/);
assert.match(plugin,/untrusted_update_url/);

const gradle=read("android/app/build.gradle");
for(const variable of ["MAWAEIDI_VERSION_CODE","MAWAEIDI_VERSION_NAME","MAWAEIDI_KEYSTORE_PATH","MAWAEIDI_KEYSTORE_PASSWORD","MAWAEIDI_KEY_ALIAS","MAWAEIDI_KEY_PASSWORD"]){
  assert.match(gradle,new RegExp(variable));
}
assert.match(gradle,/signingConfigs/);

const releaseWorkflow=read(".github/workflows/android-release.yml");
assert.match(releaseWorkflow,/assembleRelease/);
assert.match(releaseWorkflow,/apksigner/);
assert.match(releaseWorkflow,/gh release create/);
assert.match(releaseWorkflow,/secrets\.MAWAEIDI_KEYSTORE_BASE64/);
assert.match(releaseWorkflow,/release\/android-version\.json/);

const releaseManifest=JSON.parse(read("release/android-version.json"));
assert.match(releaseManifest.version,/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
assert.equal(typeof releaseManifest.notes,"string");
assert.equal(typeof releaseManifest.prerelease,"boolean");

const mobileCss=read("mobile-app.css");
assert.match(mobileCss,/native-update-banner/);
assert.match(mobileCss,/native-agenda-day/);
assert.match(mobileCss,/native-week-agenda-active/);
assert.match(index,/id="nativeWeekControls"/);
assert.match(index,/id="nativeWeekAgenda"/);
assert.match(index,/id="nativeWeekOptionsButton"/);
assert.match(index,/id="weekTimeToolbar"/);
assert.match(app,/function renderNativeWeekAgenda\(/);
assert.match(app,/function setNativeWeekLayout\(/);
assert.match(app,/nativeWeekLayout==="agenda"/);
assert.match(app,/sessionStatusButtonMarkup\(occurrence\)/);
assert.match(app,/openQuickAdd\(day,"18:00"\)/);
assert.match(app,/const nativeWeek=renderNativeWeekChrome\(\)/);

const service=read("android/app/src/main/java/com/abdelmalek/mawaeidi/AlarmRingService.java");
assert.match(service,/setLooping\(true\)/);
assert.match(service,/setFullScreenIntent/);
assert.match(service,/MAX_RING_MILLIS/);

console.log("Native alarm architecture checks passed.");
