"use strict";
const assert=require("node:assert/strict"),http=require("node:http"),fs=require("node:fs/promises"),path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".png":"image/png",".svg":"image/svg+xml",".json":"application/json",".webmanifest":"application/manifest+json"};
// Serve actual production HTML, CSS and JS, with only the entry point replaced in this
// ephemeral local HTTP server. No test hooks are shipped in the application itself.
const server=http.createServer(async(req,res)=>{
  try{
    const name=new URL(req.url,"http://127.0.0.1").pathname;
    const target=path.resolve(root,"."+ (name==="/"?"/index.html":name));
    if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return}
    let bytes=await fs.readFile(target);
    if(name==="/app-main.js"){
      const source=bytes.toString("utf8");
      assert.match(source,/initApp\(\);\s*$/);
      bytes=source.replace(/initApp\(\);\s*$/, 'window.__homeFixture=(rows)=>{lessons=normalizeLessons(rows);currentUser={id:"fixture-only"};cloudReady=true;render();hideAuth();};');
    }
    res.writeHead(200,{"Content-Type":types[path.extname(target)]||"application/octet-stream","Cache-Control":"no-store"});res.end(bytes);
  }catch{res.writeHead(404).end()}
});
const day="الخميس",lesson=(id,time,duration,type,name,extra={})=>({id,name,type,subject:"اللغة العربية للناطقين بغيرها",platform:"Zoom",duration,schedules:[{day,time}],...extra});
const fixtures=[
 lesson("ongoing","09:00",60,"teach","اسم الطالب التجريبي الطويل جدًا للاختبار"),
 lesson("next","10:45",45,"learn","درس الدراسة"),
 lesson("later","13:00",60,"teach","حصة خاصة",{lessonSource:"center",centerName:"مركز تجريبي",studentTimeZone:"Asia/Baku"}),
 lesson("cancelled","12:00",60,"teach","موعد ملغى",{sessionRecords:[{id:"cancelled-record",kind:"base",date:"2026-11-26",time:"12:00",status:"cancelled_unpaid"}]})
];
async function visible(page,selector){
  try{await page.locator(selector).waitFor({state:"visible",timeout:4000})}
  catch(error){
    const info=await page.evaluate(sel=>{
      const element=document.querySelector(sel),ancestors=[];
      for(let el=element;el;el=el.parentElement){
        const style=getComputedStyle(el),r=el.getBoundingClientRect();
        ancestors.push({tag:el.tagName,id:el.id,classes:el.className,hidden:el.hidden,display:style.display,visibility:style.visibility,width:r.width,height:r.height});
      }
      return {selector:sel,matches:document.querySelectorAll(sel).length,ancestors,body:document.body.className,viewport:innerWidth};
    },selector);
    throw new Error("Visibility failure: "+JSON.stringify(info),{cause:error});
  }
}
async function noOverflow(page){
  const problems=await page.evaluate(()=>{
    const width=document.documentElement.clientWidth,errors=[];
    if(document.documentElement.scrollWidth>width+2)errors.push("document horizontal overflow");
    for(const el of document.querySelectorAll("#todayView .daily-overview,#todayView .daily-metric,#todayView .timeline-row,#todayView .lesson,#todayView .daily-lesson-title,#todayView .daily-lesson-actions, #nextCard,#nextCard button,#scheduleWorkspace .home-hero-story,#scheduleWorkspace .home-hero-art,.workspace-switch,.workspace-switch button")){
      if(!el.getClientRects().length)continue;
      const r=el.getBoundingClientRect();
      if(r.left< -2||r.right>width+2)errors.push(el.className+" outside viewport: "+r.left+" / "+r.right);
      if(el.scrollWidth>el.clientWidth+3)errors.push(el.className+" internal overflow");
    }
    return errors;
  });
  assert.deepEqual(problems,[]);
}
(async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const origin="http://127.0.0.1:"+server.address().port;
  const browser=await chromium.launch({headless:true});
  try{
    for(const width of [320,375,390,768,1024,1440]){
      const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:"block",reducedMotion:"reduce"});
      // Block every external request, including authentication and telemetry.
      await context.route("**/*",route=>route.request().url().startsWith(origin+"/")?route.continue():route.abort());
      const page=await context.newPage(),errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      await page.clock.setFixedTime(new Date("2026-11-26T07:30:00Z"));
      await page.goto(origin+"/",{waitUntil:"load"});
      await page.evaluate(rows=>window.__homeFixture(rows),fixtures);
      await page.evaluate(()=>document.fonts.ready);
      assert.deepEqual(errors,[],"Unexpected errors during fixture setup");
      await visible(page,"#todayView .daily-overview");await visible(page,"#nextCard .next-edit");
      await visible(page,".home-hero-art");
      assert.ok(await page.locator(".home-hero-art").evaluate(img=>img.complete&&img.naturalWidth>0));
      assert.equal(await page.locator(".workspace-nav-icon").count(),3);
      assert.match(await page.locator("#homeHeroDate").textContent(),/الخميس/);
      assert.equal(await page.locator("#dailyTotal").textContent(),"3");
      assert.match(await page.locator("#nextCard .label").textContent(),/الجارية/);
      assert.equal(await page.locator("#nextRemainingTime").textContent(),"30 د");
      assert.equal(await page.locator("#todayView .timeline-row").count(),4);
      assert.equal(await page.locator("#todayView .is-ongoing").count(),1);
      await noOverflow(page);
      await page.locator("#nextCard .next-edit").click();
      await visible(page,"#drawerTitle");assert.equal(await page.locator("#drawerTitle").textContent(),"تعديل الحصة");
      await page.evaluate(()=>closeDrawer());
      await page.evaluate(()=>window.__homeFixture([]));
      await visible(page,"#nextCard .next-add");await visible(page,"#todayView .daily-empty");
      await page.locator(".daily-empty-art").evaluate(img=>img.decode());
      assert.ok(await page.locator(".daily-empty-art").evaluate(img=>img.naturalWidth>0));
      await noOverflow(page);
      await page.locator("#nextCard .next-week").click();
      await visible(page,"#weekView");
      await page.locator('.tab[aria-controls="todayView"]').click();
      await visible(page,"#todayView");
      assert.deepEqual(errors,[]);
      console.log("Home browser smoke passed at "+width+"px (actual layout, fixture metrics, edit action, empty state, weekly navigation).");
      await context.close();
    }
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
