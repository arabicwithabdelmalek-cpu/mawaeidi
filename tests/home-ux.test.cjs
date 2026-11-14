const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const html=read("index.html");
const css=read("schedule-home-refinement.css");
const headerCss=read("header-refinement.css");
const sw=read("sw.js");

assert.match(html,/schedule-home-refinement\.css\?v=1/);
assert.match(html,/header-refinement\.css\?v=5/);
assert.ok(html.indexOf('id="nextCard"')<html.indexOf('class="hero-copy"'),"next lesson must precede the decorative quote");
assert.ok(html.indexOf('class="tabs" role="group"')<html.indexOf('class="filters" role="group"'),"view choice must precede type filters");
assert.match(html,/aria-label="طريقة عرض المواعيد"/);
assert.match(html,/aria-label="تصفية الحصص حسب النوع"/);

assert.match(css,/#scheduleWorkspace \.hero/);
assert.match(css,/@media \(max-width:760px\)/);
assert.match(css,/@media \(max-width:520px\)/);
assert.match(css,/@media \(prefers-reduced-motion:reduce\)/);
assert.doesNotMatch(css,/#scheduleWorkspace \.hero-copy\s*\{[^}]*display\s*:\s*none/s);
assert.match(headerCss,/min-height:44px/);
assert.match(sw,/CACHE_NAME=CACHE_PREFIX\+"v84"/);
assert.match(sw,/schedule-home-refinement\.css\?v=1/);

console.log("Mawaeidi schedule home hierarchy checks passed.");
