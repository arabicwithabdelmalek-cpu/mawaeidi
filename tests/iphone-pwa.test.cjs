const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Script, createContext } = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = p => fs.readFileSync(path.join(root,p),"utf8");
const html=read("index.html"),app=read("app-main.js"),css=read("iphone-pwa.css"),
  js=read("iphone-pwa.js"),sw=read("sw.js"),server=read("supabase/functions/mawaeidi-push-test/index.ts");

assert.match(html,/iphone-pwa\.js\?v=1/);
assert.match(html,/iphone-pwa\.css\?v=1/);
assert.ok(html.indexOf("iphone-pwa.js?v=1")<html.indexOf("app-main.js?v=9"));
assert.match(sw,/CACHE_NAME=CACHE_PREFIX\+"v84"/);
assert.match(sw,/iphone-pwa\.css\?v=1/);
assert.match(sw,/iphone-pwa\.js\?v=1/);
assert.match(app,/async function testNotificationFromServer\(/);
assert.match(app,/\/functions\/v1\/mawaeidi-push-test/);
assert.match(app,/session\.access_token/);
assert.match(app,/getSubscription\(\)/);
assert.match(app,/notificationServerTest/);
assert.match(app,/على iPhone تحتاج iOS 16\.4/);
assert.match(css,/html\.mawaeidi-iphone \.iphone-pwa-hint/);
assert.match(js,/mawaeidi-iphone/);
assert.match(js,/navigator\.standalone===true/);
assert.match(js,/إضافة إلى الشاشة الرئيسية/);
assert.match(server,/db\.auth\.getUser\(token\)/);
assert.match(server,/\.eq\("user_id", user\.id\)/);
assert.match(server,/\.eq\("endpoint", endpoint\)/);
assert.match(server,/mawaeidi_notification_log/);
assert.match(server,/claimError\?\.code === "23505"/);
assert.match(server,/permittedPushHost\(endpoint\)/);
assert.match(server,/vault\.decrypted_secrets/);
assert.match(server,/mawaeidi_vapid_private_key/);
assert.doesNotMatch(app,/mawaeidi_vapid_private_key/);
assert.match(server,/webpush\.sendNotification/);
assert.match(server,/return result\(401, "Sign in first"\)/);
assert.match(server,/ALLOWED_ORIGIN/);

const desktop={
  navigator:{userAgent:"Mozilla/5.0 (Windows NT 10.0; Win64; x64)",standalone:false},
  window:{matchMedia:()=>({matches:false})},
  document:{documentElement:{classList:{add(){throw Error("desktop touched")}}}}
};
createContext(desktop);
new Script(js,{filename:"iphone-pwa.js"}).runInContext(desktop);

let iphoneClass="";
const iphone={
  navigator:{userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",standalone:true},
  window:{matchMedia:()=>({matches:true}),addEventListener(){}},
  document:{
    documentElement:{classList:{add(value){iphoneClass=value}}},
    readyState:"loading",
    addEventListener(){}
  }
};
createContext(iphone);
new Script(js,{filename:"iphone-pwa.js"}).runInContext(iphone);
assert.equal(iphoneClass,"mawaeidi-iphone");

const start=app.indexOf("function notificationSettingsMarkup(");
const end=app.indexOf("\nasync function readNotificationState()",start);
assert.ok(start>0 && end>start);
const render=new Function("helpers","const {normalizeNotificationLeads,notificationLeadChoices,esc}=helpers;\n"+
  app.slice(start,end)+"\nreturn notificationSettingsMarkup;")({
    normalizeNotificationLeads:x=>x,
    notificationLeadChoices:()=>"",
    esc:x=>String(x)
  });
const notInstalled=render({supported:false,configured:true,requiresInstall:true,leads:[60,15]});
assert.match(notInstalled,/إضافة إلى الشاشة الرئيسية/);
assert.doesNotMatch(notInstalled,/لا يدعم تنبيهات الويب/);
const enabled=render({supported:true,configured:true,requiresInstall:false,permission:"granted",enabled:true,leads:[60,15]});
assert.match(enabled,/notificationServerTest/);
assert.match(enabled,/ليس منبّهًا مستمر الرنين/);
console.log("iPhone PWA onboarding, device support, and server-push security checks passed.");
