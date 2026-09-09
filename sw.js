const CACHE_NAME="mawaeidi-shell-v4";
const APP_SHELL=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==="navigate"){
    const fetched=fetch(request).then(response=>({response,copy:response.clone()}));
    event.respondWith(fetched.then(({response})=>response).catch(()=>caches.match("./index.html")));
    event.waitUntil(
      fetched
        .then(({copy})=>caches.open(CACHE_NAME).then(cache=>cache.put("./index.html",copy)))
        .catch(()=>undefined)
    );
    return;
  }

  if(APP_SHELL.some(path=>new URL(path,self.registration.scope).href===url.href)){
    const update=fetch(request).then(async response=>{
      if(response.ok){
        const cache=await caches.open(CACHE_NAME);
        await cache.put(request,response.clone());
      }
      return response;
    });
    event.waitUntil(update.then(()=>undefined).catch(()=>undefined));
    event.respondWith(caches.match(request).then(cached=>cached||update));
  }
});

self.addEventListener("push",event=>{
  let data={};
  try{data=event.data?.json()||{}}catch{data={body:event.data?.text()||"لديك حصة قريبة."}}
  const title=data.title||"موعد حصة قريب";
  const options={
    body:data.body||"افتح مواعيدي لمراجعة التفاصيل.",
    icon:"./icons/icon-192.png",
    badge:"./icons/icon-192.png",
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
