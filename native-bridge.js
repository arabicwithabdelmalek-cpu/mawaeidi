(function initializeMawaeidiNativeBridge(){
  const capacitor=window.Capacitor;
  const platform=capacitor?.getPlatform?.()||"web";
  const native=Boolean(capacitor?.isNativePlatform?.()||platform==="android"||platform==="ios");
  let lastAlarmFingerprint="";

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
    async openExactAlarmSettings(){return invoke("openExactAlarmSettings")},
    async openFullScreenSettings(){return invoke("openFullScreenSettings")},
    async openNotificationSettings(){return invoke("openNotificationSettings")},
    async openBatterySettings(){return invoke("openBatterySettings")}
  };

  window.MawaeidiNative=api;
  if(native){
    document.addEventListener("visibilitychange",()=>{
      if(document.visibilityState==="visible")window.dispatchEvent(new CustomEvent("mawaeidi-native-resume"));
    });
  }
})();
