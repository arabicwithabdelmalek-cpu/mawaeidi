/* iPhone Home Screen flow. No images, account changes, or Android behavior. */
(()=>{
  "use strict";
  if(!/iphone|ipod/i.test(navigator.userAgent||""))return;
  document.documentElement.classList.add("mawaeidi-iphone");
  const dismissedKey="mawaeidi-iphone-onboarding-dismiss-v1";
  const standalone=()=>navigator.standalone===true||
    window.matchMedia?.("(display-mode: standalone)")?.matches;
  const hasNotifications=()=>"Notification" in window&&Notification.permission==="granted";

  function paint(){
    const header=document.querySelector(".app > .header");
    if(!header)return;
    const present=document.getElementById("iphonePwaHint");
    const installed=standalone();
    if((installed&&hasNotifications())||(!installed&&localStorage.getItem(dismissedKey)==="1")){
      present?.remove();
      return;
    }
    if(present&&present.dataset.installed===String(installed))return;
    present?.remove();
    const hint=document.createElement("aside");
    hint.id="iphonePwaHint";
    hint.className="iphone-pwa-hint";
    hint.dataset.installed=String(installed);
    hint.setAttribute("aria-label",installed?"تفعيل تنبيهات الحصص":"تثبيت مواعيدي على الآيفون");
    hint.innerHTML=installed
      ?'<div class="iphone-pwa-hint-copy"><strong>فعّل تنبيهات الحصص</strong>'+
       '<span>اختار مواعيد التنبيه، واسمح للإشعارات من الآيفون ليصلك التنبيه والتطبيق مقفول.</span></div>'+
       '<button type="button" class="iphone-pwa-hint-action">إعداد التنبيهات</button>'
      :'<div class="iphone-pwa-hint-copy"><strong>مواعيدي كتطبيق على iPhone</strong>'+
       '<span>من Safari: مشاركة ← إضافة إلى الشاشة الرئيسية ← فتح كتطبيق. من غير اشتراك ولا تحميل IPA.</span></div>'+
       '<button type="button" class="iphone-pwa-hint-action">طريقة التثبيت</button>'+
       '<button type="button" class="iphone-pwa-hint-dismiss" aria-label="إخفاء رسالة التثبيت">×</button>';
    header.insertAdjacentElement("afterend",hint);
    hint.querySelector(".iphone-pwa-hint-action").addEventListener("click",()=>{
      if(installed){
        if(typeof openNotificationSettings==="function")openNotificationSettings();
      }else if(typeof installApp==="function")installApp();
    });
    hint.querySelector(".iphone-pwa-hint-dismiss")?.addEventListener("click",()=>{
      try{localStorage.setItem(dismissedKey,"1")}catch{}
      hint.remove();
    });
  }
  function safePaint(){try{paint()}catch(error){console.warn("iPhone setup hint unavailable",error)}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",safePaint,{once:true});
  else safePaint();
  window.matchMedia?.("(display-mode: standalone)")?.addEventListener?.("change",safePaint);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)safePaint()});
  window.addEventListener("pageshow",safePaint);
})();
