const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {Script,createContext}=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const index=read("index.html");
const app=read("app-main.js");
const order=read("day-order.js");
const css=read("ipad-pwa.css");
const ipad=read("ipad-pwa.js");
const worker=read("sw.js");
assert.match(index,/viewport-fit=cover/);
assert.match(index,/\.\/ipad-pwa\.css\?v=1/);
assert.match(index,/\.\/ipad-pwa\.js\?v=1/);
assert.ok(index.indexOf("ipad-pwa.js?v=1")<index.indexOf("app-main.js?v=9"),
  "iPad enhancement must load before core render");
assert.match(app,/window\.mawaeidiIPadRenderAgenda\?\.\(occ\)/);
assert.match(app,/navigator\.platform==="MacIntel"&&navigator\.maxTouchPoints>1/);
assert.match(order,/window\.mawaeidiIPadArrangeAgenda\?\.\(\)/);
assert.match(worker,/CACHE_NAME=CACHE_PREFIX\+"v84"/);
assert.match(worker,/ipad-pwa\.css\?v=1/);
assert.match(worker,/ipad-pwa\.js\?v=1/);
assert.match(ipad,/sessionStatusButtonMarkup\(item\)/);
assert.match(ipad,/openQuickAdd\(day,"18:00"\)/);
assert.match(ipad,/openEdit\(lesson\.id\)/);
assert.match(ipad,/week-date|weekDateForDay/);
assert.match(ipad,/orderedDays\(\)/);
assert.match(ipad,/mawaeidi-ipad-install-dismiss-v1/);
assert.match(css,/html\.mawaeidi-ipad \.ipad-week-agenda/);
assert.match(css,/html\.mawaeidi-ipad #weekView\.ipad-week-agenda-active/);
assert.match(css,/html\.mawaeidi-ipad #studentsView/);
assert.ok(!/(^|\n)\s*body\s*\{/.test(css),"iPad styles must be device-scoped");
// On a desktop, loading the iPad add-on must not mutate the document or add a renderer.
let touched=false;
const desktop={
  navigator:{userAgent:"Mozilla/5.0 (Windows NT 10.0; Win64; x64)",platform:"Win32",maxTouchPoints:0},
  document:{documentElement:{classList:{add(){touched=true}}}},
  window:{},
};
createContext(desktop);
new Script(ipad,{filename:"ipad-pwa.js"}).runInContext(desktop);
assert.equal(touched,false);
assert.equal(desktop.window.mawaeidiIPadRenderAgenda,undefined);
// Modern iPadOS advertises MacIntel with multi-touch. Renderer must activate there.
let classAdded="";
const tablet={
  navigator:{userAgent:"Mozilla/5.0 (Macintosh; Intel Mac OS X)",platform:"MacIntel",maxTouchPoints:5,standalone:true},
  document:{
    documentElement:{classList:{add(k){classAdded=k}}},
    readyState:"loading",
    addEventListener(name,callback){this.ready=callback}
  },
  window:{matchMedia(){return{matches:true,addEventListener(){}}}}
};
createContext(tablet);
new Script(ipad,{filename:"ipad-pwa.js"}).runInContext(tablet);
assert.equal(classAdded,"mawaeidi-ipad");
assert.equal(typeof tablet.window.mawaeidiIPadRenderAgenda,"function");
assert.equal(typeof tablet.window.mawaeidiIPadArrangeAgenda,"function");
console.log("iPad PWA checks passed: desktop isolation, modern iPad detection, agenda data and offline assets.");
