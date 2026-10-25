/* Dashboard structure only. Keep the scheduling state, forms, and persistence untouched. */
(function(){
  const workspace=document.getElementById("scheduleWorkspace");
  const hero=workspace?.querySelector(".hero");
  if(!workspace||!hero)return;
  const intro=document.createElement("section");
  intro.className="dashboard-intro";
  intro.setAttribute("aria-label","لوحة المواعيد");
  intro.innerHTML='<div class="dashboard-intro-copy"><div class="dashboard-eyebrow" id="dashboardDate">لوحة المواعيد</div><h2>جدول مواعيدك</h2><p>خطط ليومك بسهولة، وخلي كل حصة في وقتها.</p></div><div class="dashboard-intro-actions"></div>';
  hero.before(intro);
  const primary=document.getElementById("primaryActionButton");
  if(primary)intro.querySelector(".dashboard-intro-actions").appendChild(primary);
  const updateDate=()=>{
    const el=document.getElementById("dashboardDate");
    if(!el)return;
    try{
      el.textContent=new Intl.DateTimeFormat("ar-EG",{
        weekday:"long",day:"numeric",month:"long",timeZone:"Africa/Cairo"
      }).format(new Date());
    }catch{el.textContent="لوحة المواعيد";}
  };
  updateDate();
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")updateDate();});

  const quote=hero.querySelector(".hero-copy");
  if(quote){
    quote.innerHTML='<span class="dashboard-note-kicker">الوقت أمانة</span><h3 class="dashboard-note-title">مساحة أهدى ليوم أكثر تنظيمًا.</h3><p class="dashboard-note-caption">مواعيدك الأساسية قدامك، وباقي التفاصيل وقت ما تحتاجها.</p>';
  }

  const bars=document.getElementById("weekBars");
  if(bars&&bars.parentElement&&!bars.closest(".insights-more")){
    const insights=document.createElement("details");
    insights.className="insights-more";
    const label=document.createElement("summary");
    label.textContent="توزيع الحصص على أيام الأسبوع";
    bars.before(insights);
    insights.append(label,bars);
  }

  const week=document.getElementById("weekView");
  const toolbar=week?.querySelector(".week-time-toolbar");
  const summary=week?.querySelector(".week-smart-summary");
  if(week&&toolbar&&summary&&!toolbar.closest(".week-advanced")){
    const advanced=document.createElement("details");
    advanced.className="week-advanced";
    const label=document.createElement("summary");
    label.textContent="خيارات عرض الجدول";
    summary.after(advanced);
    advanced.append(label,toolbar);
  }
})();