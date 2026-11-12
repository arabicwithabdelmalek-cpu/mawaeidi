const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const dashboard=require("../smart-today-dashboard.js");

const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const html=read("index.html"),app=read("app-main.js"),worker=read("sw.js"),css=read("smart-today-dashboard.css");

const state=dashboard.buildDayState([
  {timeMinutes:540,duration:60,status:"completed",displayTime:"٩:٠٠ ص"},
  {timeMinutes:600,duration:60,status:"ongoing",displayTime:"١٠:٠٠ ص"},
  {timeMinutes:720,duration:45,status:"upcoming",displayTime:"١٢:٠٠ م"},
  {timeMinutes:840,duration:60,status:"cancelled_unpaid",displayTime:"٢:٠٠ م"}
],630);

assert.equal(state.total,3);
assert.equal(state.remaining,2);
assert.equal(state.completed,1);
assert.equal(state.ongoing,1);
assert.equal(state.next.status,"ongoing");
assert.equal(state.title,"باقي لك حصتان");
assert.match(dashboard.countdownLabel(state.next,630),/جارية الآن/);
assert.match(dashboard.countdownLabel(state.next,630),/٣٠ دقيقة/);
assert.equal(dashboard.countdownLabel({timeMinutes:720,duration:45,status:"upcoming"},630),"تبدأ بعد ساعة و٣٠ دقيقة");

const empty=dashboard.buildDayState([],630);
assert.equal(empty.total,0);
assert.equal(empty.title,"يوم هادئ بلا حصص");

assert.match(html,/smart-today-dashboard\.css\?v=1/);
assert.match(html,/smart-today-dashboard\.js\?v=1/);
assert.ok(html.indexOf("smart-today-dashboard.js?v=1")<html.indexOf("app-main.js?v=9"));
assert.match(html,/id="todayOverviewTitle"/);
assert.match(app,/function completeDashboardOccurrence\(/);
assert.match(app,/document\.body\.classList\.add\("auth-locked"\)/);
assert.match(css,/body\.auth-locked/);
assert.match(worker,/CACHE_NAME=CACHE_PREFIX\+"v84"/);
assert.match(worker,/smart-today-dashboard\.css\?v=1/);
assert.match(worker,/smart-today-dashboard\.js\?v=1/);

console.log("Smart daily dashboard model, integration, and mobile auth lock checks passed.");
