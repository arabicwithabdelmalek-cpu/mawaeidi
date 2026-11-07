const CACHE_PREFIX="mawaeidi-shell-";
const CACHE_NAME=CACHE_PREFIX+"v83";
const APP_SHELL=[
  "./",
  "./index.html",
  "./students/index.html",
  "./students/student-registry.css?v=14",
  "./backup-manager.js?v=1",
  "./app-main.js?v=8",
  "./iphone-pwa.js?v=1",
  "./iphone-pwa.css?v=1",
  "./ipad-pwa.js?v=1",
  "./ipad-pwa.css?v=1",
  "./students/student-registry.js?v=16",
  "./account.js?v=3",
  "./activity-tracker.js?v=3",
  "./account-page.js?v=6",
  "./day-order.js?v=3",
  "./header-refinement.css?v=4",
  "./icons/logo-cutout.svg?v=1",
  "./manifest.webmanifest",
  "./icons/huruf-background.png",
  "./icons/kufi-quote.png",
  "./icons/favicon-32.png?v=2",
  "./icons/icon-192.png?v=2",
  "./icons/icon-512.png?v=2",
  "./icons/apple-touch-icon.png?v=2"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==="navigate"){
    const homePath=new URL("./",self.registration.scope).pathname;
    const indexPath=new URL("./index.html",self.registration.scope).pathname;
    const studentsPath=new URL("./students/index.html",self.registration.scope).pathname;
    const studentsDirectoryPath=new URL("./students/",self.registration.scope).pathname;
    const fallback=(url.pathname===studentsPath||url.pathname===studentsDirectoryPath)?"./students/index.html":
      (url.pathname===homePath||url.pathname===indexPath)?"./index.html":null;

    // Never cache admin.html (or another route) under the main site's offline
    // fallback. A manager visiting the admin page must not replace index.html.
    if(!fallback)return;
    event.respondWith((async()=>{
      try{
        const response=await fetch(request,{cache:"no-cache"});
        if(response.ok){
          try{
            const cache=await caches.open(CACHE_NAME);
            await cache.put(fallback,response.clone());
          }catch{/* Network response is usable even if offline caching fails. */}
        }
        return response;
      }catch{
        return await caches.match(fallback)||Response.error();
      }
    })());
    return;
  }

  if(APP_SHELL.some(path=>new URL(path,self.registration.scope).href===url.href)){
    // Network-first for versioned assets avoids flashing an older application
    // build on the first load after publishing an update.
    event.respondWith((async()=>{
      try{
        const response=await fetch(request,{cache:"no-cache"});
        if(response.ok){
          try{
            const cache=await caches.open(CACHE_NAME);
            await cache.put(request,response.clone());
          }catch{/* Ignore quota/cache errors without dropping fresh content. */}
        }
        return response;
      }catch{
        return await caches.match(request)||Response.error();
      }
    })());
  }
});

self.addEventListener("push",event=>{
  let data={};
  try{data=event.data?.json()||{}}catch{data={body:event.data?.text()||"لديك حصة قريبة."}}
  const title=data.title||"موعد حصة قريب";
  const options={
    body:data.body||"افتح مواعيدي لمراجعة التفاصيل.",
    icon:"./icons/icon-192.png?v=2",
    badge:"./icons/icon-192.png?v=2",
    lang:"ar",
    dir:"rtl",
    tag:data.tag||"mawaeidi-reminder",
    renotify:Boolean(data.tag),
    silent:false,
    vibrate:[220,120,220],
    requireInteraction:true,
    timestamp:Number(data.timestamp)||Date.now(),
    data:{url:data.url||"./"},
    actions:[{action:"open",title:"فتح الجدول"}]
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||"./",self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({type:"window",includeUncontrolled:true}).then(async clients=>{
      const existing=clients.find(client=>client.url.startsWith(self.registration.scope));
      if(existing){
        if("navigate" in existing&&existing.url!==target)await existing.navigate(target);
        return existing.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});

