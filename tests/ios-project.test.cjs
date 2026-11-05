const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const pkg = JSON.parse(read("package.json"));
assert.match(pkg.scripts["ios:project"], /cap add ios --packagemanager SPM/);
const config = JSON.parse(read("capacitor.config.json"));
assert.equal(config.appId, "com.abdelmalek.mawaeidi");
assert.equal(config.webDir, "mobile-dist");

const swift = read("ios-native/MawaeidiAlarmPlugin.swift");
for (const method of ["getState", "getAppInfo", "requestPermissions", "setEnabled",
    "replaceAlarms", "cancelAll", "testAlarm", "openNotificationSettings"]) {
  assert.match(swift, new RegExp("@objc public func " + method + "\\("));
}
assert.match(swift, /UNUserNotificationCenter/);
assert.match(swift, /UNCalendarNotificationTrigger/);
assert.match(swift, /maxScheduled = 55/);
assert.match(swift, /content\.sound = \.default/);
assert.match(swift, /func userNotificationCenter\(/);
assert.match(swift, /"exactAlarmAllowed": false/);
assert.match(swift, /"alarmMode": "local_notification"/);

const controller = read("ios-native/MawaeidiBridgeViewController.swift");
assert.match(controller, /registerPluginInstance\(MawaeidiAlarmPlugin\(\)\)/);
const projectScript = read("scripts/prepare-ios-project.mjs");
assert.match(projectScript, /MawaeidiBridgeViewController/);
assert.match(projectScript, /AppIcon\.appiconset/);
const registration = read("scripts/register-ios-plugin.rb");
assert.match(registration, /source_build_phase\.add_file_reference/);

const app = read("app-main.js");
assert.match(app, /function iosNotificationSettingsMarkup\(/);
assert.match(app, /platform==="ios"\?55:NATIVE_ALARM_LIMIT/);
assert.match(app, /إشعارات iOS المحلية وليست منبّهًا متكرر الرنين/);
const web = read("index.html");
assert.match(web, /native-bridge\.js/);
assert.match(web, /mobile-app\.css/);

const workflow = read(".github/workflows/ios-simulator.yml");
assert.match(workflow, /macos-26/);
assert.match(workflow, /CODE_SIGNING_ALLOWED=NO/);
assert.match(workflow, /npm run ios:project/);
assert.doesNotMatch(workflow, /secrets\.APPLE_/);
console.log("iOS native project checks passed.");
