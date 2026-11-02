(function initializeMawaeidiNativeBridge(){
  const capacitor=window.Capacitor;
  const platform=capacitor?.getPlatform?.()||"web";
  const native=Boolean(capacitor?.isNativePlatform?.()||platform==="android"||platform==="ios");
  let lastAlarmFingerprint="";
  let updateCheckPromise=null;
  const RELEASES_ENDPOINT="https://api.github.com/repos/arabicwithabdelmalek-cpu/mawaeidi/releases?per_page=10";
  const UPDATE_CACHE_KEY="mawaeidi-native-update-cache-v1";
  const UPDATE_DISMISS_KEY="mawaeidi-native-update-dismissed-v1";
  const UPDATE_CHECK_INTERVAL=6*60*60*1000;

  function plugin(){return window.Capacitor?.Plugins?.MawaeidiAlarm||null}
  async function invoke(method,options={}){
    const target=plugin();
    if(!native||!target||typeof target[method]!=="function")throw new Error("native_alarm_unavailable");
    return target[method](options);
  }
  function fingerprint(payload){
    const alarms=Array.isArray(payload?.alarms)?payload.alarms:[];
    return JSON.stringify([payload?.userId||"",payload?.enabled!==false,alarms.map(item=>[item.id,item.fireAt])]);
  }
  function normalizedVersion(value){return String(value||"").trim().replace(/^v/i,"").split("+")[0]}
  function versionParts(value){
    const match=normalizedVersion(value).match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
    if(!match)return null;
    return {core:match.slice(1,4).map(Number),pre:match[4]?match[4].split("."):[]};
  }
  function compareVersions(left,right){
    const a=versionParts(left),b=versionParts(right);
    if(!a||!b)return 0;
    for(let index=0;index<3;index++)if(a.core[index]!==b.core[index])return a.core[index]>b.core[index]?1:-1;
    if(!a.pre.length&&!b.pre.length)return 0;
    if(!a.pre.length)return 1;
    if(!b.pre.length)return -1;
    const length=Math.max(a.pre.length,b.pre.length);
    for(let index=0;index<length;index++){
      if(a.pre[index]===undefined)return -1;
      if(b.pre[index]===undefined)return 1;
      if(a.pre[index]===b.pre[index])continue;
      const aNumber=/^\d+$/.test(a.pre[index]),bNumber=/^\d+$/.test(b.pre[index]);
      if(aNumber&&bNumber)return Number(a.pre[index])>Number(b.pre[index])?1:-1;
      if(aNumber!==bNumber)return aNumber?-1:1;
      return a.pre[index]>b.pre[index]?1:-1;
    }
    return 0;
  }
  function trustedUpdateUrl(value){
    try{
      const url=new URL(value);
      return url.protocol==="https:"&&url.hostname==="github.com"&&url.pathname.startsWith("/arabicwithabdelmalek-cpu/mawaeidi/releases/");
    }catch{return false}
  }
  function releaseUpdate(releases,currentVersion){
    return (Array.isArray(releases)?releases:[])
      .filter(item=>item&&!item.draft&&versionParts(item.tag_name))
      .map(item=>{
        const asset=(Array.isArray(item.assets)?item.assets:[]).find(entry=>/\.apk$/i.test(entry?.name||"")&&trustedUpdateUrl(entry?.browser_download_url));
        return asset?{available:true,currentVersion,latestVersion:normalizedVersion(item.tag_name),downloadUrl:asset.browser_download_url,releaseUrl:item.html_url||asset.browser_download_url,name:asset.name}:null;
      })
      .filter(Boolean)
      .filter(item=>compareVersions(item.latestVersion,currentVersion)>0)
      .sort((a,b)=>compareVersions(b.latestVersion,a.latestVersion))[0]||{available:false,currentVersion};
  }
  function cachedUpdate(currentVersion,force){
    if(force)return null;
    try{
      const cache=JSON.parse(localStorage.getItem(UPDATE_CACHE_KEY)||"null");
      return cache&&cache.currentVersion===currentVersion&&Date.now()-cache.checkedAt<UPDATE_CHECK_INTERVAL?cache.update:null;
    }catch{return null}
  }
  function renderUpdateBanner(update,{force=false}={}){
    document.getElementById("nativeUpdateBanner")?.remove();
    if(!update?.available)return;
    if(!force&&localStorage.getItem(UPDATE_DISMISS_KEY)===update.latestVersion)return;
    const app=document.querySelector(".app"),header=app?.querySelector(".header");
    if(!app||!header)return;
    const banner=document.createElement("section");
    banner.id="nativeUpdateBanner";
    banner.className="native-update-banner";
    banner.setAttribute("role","status");
    const copy=document.createElement("div");
    const title=document.createElement("strong");
    title.textContent=`تحديث جديد: ${update.latestVersion}`;
    const detail=document.createElement("span");
    detail.textContent=`نسختك الحالية ${update.currentVersion}. حمّل النسخة الأحدث ثم ثبّتها فوق التطبيق.`;
    copy.append(title,detail);
    const actions=document.createElement("div");
    actions.className="native-update-actions";
    const download=document.createElement("button");
    download.type="button";
    download.className="native-update-download";
    download.textContent="تنزيل التحديث";
    download.addEventListener("click",async()=>{
      download.disabled=true;
      download.textContent="جارٍ فتح التنزيل…";
      try{await api.openUpdate(update)}
      catch(error){console.warn("تعذّر فتح تحديث مواعيدي.",error)}
      finally{download.disabled=false;download.textContent="تنزيل التحديث"}
    });
    const later=document.createElement("button");
    later.type="button";
    later.className="native-update-later";
    later.textContent="لاحقًا";
    later.addEventListener("click",()=>{localStorage.setItem(UPDATE_DISMISS_KEY,update.latestVersion);banner.remove()});
    actions.append(download,later);
    banner.append(copy,actions);
    header.insertAdjacentElement("afterend",banner);
  }

  if(native){
    document.documentElement.classList.add("native-app-root");
    document.body?.classList.add("native-app");
    document.documentElement.dataset.nativePlatform=platform;
  }

  const api={
    isNative:native,
    platform,
    async getAlarmState(){
      if(!native)return {available:false,enabled:false,pendingCount:0};
      try{return {available:true,...await invoke("getState")}}
      catch(error){console.warn("تعذّرت قراءة حالة منبّه التطبيق.",error);return {available:false,enabled:false,pendingCount:0,error:error?.message||"native_alarm_unavailable"}}
    },
    async enableAlarms(payload){
      await invoke("requestPermissions");
      await invoke("setEnabled",{enabled:true,userId:payload?.userId||""});
      lastAlarmFingerprint="";
      await this.syncFromApp(payload,{force:true});
      return this.getAlarmState();
    },
    async disableAlarms(){
      if(!native)return {enabled:false};
      await invoke("cancelAll");
      await invoke("setEnabled",{enabled:false});
      lastAlarmFingerprint="";
      return this.getAlarmState();
    },
    async syncFromApp(payload,{force=false}={}){
      if(!native)return {scheduled:false,reason:"web"};
      const state=await this.getAlarmState();
      if(!state.available||!state.enabled)return {scheduled:false,reason:"disabled",state};
      const nextFingerprint=fingerprint(payload);
      if(!force&&nextFingerprint===lastAlarmFingerprint)return {scheduled:false,reason:"unchanged",state};
      const result=await invoke("replaceAlarms",{
        userId:payload?.userId||"",
        generatedAt:Date.now(),
        alarms:Array.isArray(payload?.alarms)?payload.alarms:[]
      });
      lastAlarmFingerprint=nextFingerprint;
      return {scheduled:true,...result};
    },
    async testAlarm(){return invoke("testAlarm",{delaySeconds:3})},
    async getAppInfo(){return native?invoke("getAppInfo"):{packageName:"web",versionName:"web",versionCode:0}},
    async checkForUpdates({force=false,render=true}={}){
      if(!native||platform!=="android")return {available:false,reason:"unsupported_platform"};
      if(updateCheckPromise&&!force)return updateCheckPromise;
      updateCheckPromise=(async()=>{
        const info=await this.getAppInfo();
        const currentVersion=normalizedVersion(info?.versionName);
        const cached=cachedUpdate(currentVersion,force);
        if(cached){if(render)renderUpdateBanner(cached);return cached}
        const response=await fetch(RELEASES_ENDPOINT,{headers:{Accept:"application/vnd.github+json"},cache:"no-store"});
        if(!response.ok)throw new Error(`update_check_${response.status}`);
        const update=releaseUpdate(await response.json(),currentVersion);
        localStorage.setItem(UPDATE_CACHE_KEY,JSON.stringify({checkedAt:Date.now(),currentVersion,update}));
        if(render)renderUpdateBanner(update,{force});
        return update;
      })().catch(error=>({available:false,reason:"check_failed",error:error?.message||"update_check_failed"})).finally(()=>{updateCheckPromise=null});
      return updateCheckPromise;
    },
    async openUpdate(update){
      const url=update?.downloadUrl||update?.releaseUrl;
      if(!trustedUpdateUrl(url))throw new Error("untrusted_update_url");
      return invoke("openExternalUrl",{url});
    },
    async openExactAlarmSettings(){return invoke("openExactAlarmSettings")},
    async openFullScreenSettings(){return invoke("openFullScreenSettings")},
    async openNotificationSettings(){return invoke("openNotificationSettings")},
    async openBatterySettings(){return invoke("openBatterySettings")}
  };

  window.MawaeidiNative=api;
  if(native){
    document.addEventListener("visibilitychange",()=>{
      if(document.visibilityState==="visible"){
        window.dispatchEvent(new CustomEvent("mawaeidi-native-resume"));
        api.checkForUpdates().catch(()=>{});
      }
    });
    window.setTimeout(()=>api.checkForUpdates().catch(()=>{}),1800);
  }
})();
