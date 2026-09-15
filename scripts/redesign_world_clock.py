from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')

# Replace the first-generation world clock styles with a richer dashboard.
css_start = '.world-clock-tool{display:grid;gap:12px}'
css_end = '.world-convert-result.error{border-inline-start-color:var(--danger);background:var(--danger-bg);color:var(--danger);font-size:11px}'
start = text.find(css_start)
end = text.find(css_end, start)
if start < 0 or end < 0:
    raise SystemExit('world clock css block not found')
end += len(css_end)
new_css = r'''.world-clock-tool{display:grid;gap:14px}.world-clock-hero{position:relative;min-height:235px;overflow:hidden;border-radius:18px;background:linear-gradient(135deg,#163C55 0%,#245D78 52%,#2F7892 100%);color:#fff;box-shadow:0 16px 38px rgba(26,70,95,.18)}.world-clock-hero::after{content:"";position:absolute;inset:auto -9% -47% auto;width:360px;height:360px;border:1px solid rgba(255,255,255,.12);border-radius:50%;box-shadow:0 0 0 42px rgba(255,255,255,.025),0 0 0 84px rgba(255,255,255,.02)}.world-map-art{position:absolute;inset:0;opacity:.78;pointer-events:none}.world-map-art svg{width:100%;height:100%;display:block}.world-hero-content{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1fr) 170px;align-items:center;gap:22px;min-height:235px;padding:28px 31px}.world-hero-copy{max-width:530px}.world-hero-kicker{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.1);font-size:10px;font-weight:800}.world-hero-kicker::before{content:"";width:7px;height:7px;border-radius:50%;background:#F0C75E;box-shadow:0 0 0 4px rgba(240,199,94,.15)}.world-hero-copy h3{margin:14px 0 5px;font-size:24px;line-height:1.3;color:#fff}.world-hero-copy p{max-width:430px;margin:0;color:rgba(255,255,255,.72);font-size:11px;line-height:1.8}.world-home-live{display:flex;align-items:baseline;gap:12px;margin-top:17px}.world-home-time{font-size:36px;font-weight:900;letter-spacing:-1.2px;direction:ltr}.world-home-meta{font-size:10px;line-height:1.75;color:rgba(255,255,255,.72)}.world-analog-clock{--hour-angle:0deg;--minute-angle:0deg;position:relative;width:145px;height:145px;margin:auto;border:1px solid rgba(255,255,255,.28);border-radius:50%;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.16) 0 4%,transparent 5%),rgba(255,255,255,.07);box-shadow:inset 0 0 0 8px rgba(255,255,255,.03),0 15px 35px rgba(5,31,47,.18);backdrop-filter:blur(5px)}.world-analog-clock::before,.world-analog-clock::after{content:"";position:absolute;left:50%;bottom:50%;border-radius:999px;background:#fff;transform-origin:50% 100%}.world-analog-clock::before{width:4px;height:38px;transform:translateX(-50%) rotate(var(--hour-angle));opacity:.9}.world-analog-clock::after{width:2px;height:51px;transform:translateX(-50%) rotate(var(--minute-angle));background:#F3CE69}.world-clock-center{position:absolute;z-index:3;left:50%;top:50%;width:9px;height:9px;border:2px solid #fff;border-radius:50%;background:#F3CE69;transform:translate(-50%,-50%)}.world-clock-tick{position:absolute;left:50%;top:7px;width:2px;height:7px;border-radius:2px;background:rgba(255,255,255,.56);transform-origin:50% 65.5px}.world-dashboard-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(300px,.92fr);gap:12px}.world-clock-section{padding:16px;border:1px solid var(--line);border-radius:13px;background:#fff}.world-clock-section>header{display:flex;align-items:start;justify-content:space-between;gap:10px;margin-bottom:13px}.world-clock-section h3{margin:0;color:var(--primary);font-size:15px}.world-clock-section p{margin:3px 0 0;color:var(--muted);font-size:10px;line-height:1.65}.world-section-badge{display:inline-flex;align-items:center;min-height:27px;padding:4px 8px;border-radius:999px;background:#EEF4F7;color:#587589;font-size:9px;font-weight:800;white-space:nowrap}.world-zone-add{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px}.world-zone-add button,.world-convert-actions button{min-height:39px;padding:8px 13px;border:0;border-radius:8px;background:var(--primary);color:#fff;font-size:11px;font-weight:800}.world-search-hint{margin:5px 2px 10px;color:#7A8993;font-size:9px;line-height:1.55}.world-clock-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.world-clock-empty{grid-column:1/-1;padding:18px;border:1px dashed #C8D5DD;border-radius:10px;background:#F8FAFB;color:#71828C;text-align:center;font-size:10px;line-height:1.75}.world-clock-card{position:relative;min-width:0;padding:12px 12px 11px;border:1px solid #DCE5EA;border-radius:11px;background:linear-gradient(180deg,#FCFDFD,#F6F9FA);transition:transform .16s ease,box-shadow .16s ease}.world-clock-card:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(25,61,82,.08)}.world-clock-card-top{display:flex;align-items:start;justify-content:space-between;gap:8px}.world-clock-card small,.world-clock-card span{display:block;color:var(--muted);font-size:9px}.world-clock-card strong{display:block;overflow:hidden;margin:3px 0;color:var(--ink);font-size:11px;line-height:1.5;text-overflow:ellipsis;white-space:nowrap}.world-clock-time{margin-top:12px;color:var(--primary);font-size:22px;font-weight:900;direction:ltr}.world-zone-state{display:inline-flex!important;align-items:center;gap:5px;margin-top:5px;padding:4px 6px;border-radius:999px;background:#EEF4F7;color:#557589!important;font-size:8px!important;font-weight:800}.world-zone-state::before{content:"";width:5px;height:5px;border-radius:50%;background:#7795A7}.world-zone-state.work{background:#EDF7EF;color:#497652!important}.world-zone-state.work::before{background:#61A06B}.world-zone-state.evening{background:#FFF5E5;color:#93642B!important}.world-zone-state.evening::before{background:#D7A24B}.world-zone-state.night{background:#EFF0F6;color:#626886!important}.world-zone-state.night::before{background:#73799A}.world-remove{position:absolute;top:7px;left:7px;width:24px;height:24px;padding:0;border:0;border-radius:50%;background:transparent;color:#8796A0;font-size:17px}.world-remove:hover{background:#fff;color:var(--danger);box-shadow:0 2px 7px rgba(0,0,0,.06)}.world-convert-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.world-convert-actions{display:flex;gap:7px;margin-top:10px}.world-convert-actions .secondary{border:1px solid var(--line);background:#fff;color:var(--primary)}.world-convert-result{display:grid;grid-template-columns:1fr auto;align-items:center;gap:4px 14px;margin-top:11px;padding:13px 14px;border:1px solid #D6E2E8;border-radius:10px;background:linear-gradient(135deg,#F1F7F9,#EAF2F5)}.world-convert-result small,.world-convert-result span{color:#667984;font-size:10px;line-height:1.55}.world-convert-result small{font-weight:800}.world-convert-result strong{grid-row:1/3;grid-column:2;color:var(--primary);font-size:20px;direction:ltr;text-align:left;white-space:nowrap}.world-convert-result.error{display:block;border-color:#E8C6C6;background:var(--danger-bg);color:var(--danger);font-size:11px}.world-timeline-section{overflow:hidden}.world-timeline-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:10px}.world-timeline-legend{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.world-timeline-legend span{display:inline-flex;align-items:center;gap:4px;color:#75858F;font-size:8px}.world-timeline-legend i{width:8px;height:8px;border-radius:2px;background:#EEF1F3}.world-timeline-legend .work i{background:#DDEFE1}.world-timeline-legend .evening i{background:#FCEACB}.world-timeline-scroll{overflow-x:auto;padding-bottom:4px;scrollbar-width:thin}.world-timeline{min-width:800px;display:grid;gap:4px}.world-timeline-row{display:grid;grid-template-columns:125px repeat(24,minmax(25px,1fr));gap:2px;align-items:stretch}.world-timeline-label{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:5px 8px;border-radius:7px;background:#F5F8F9}.world-timeline-label strong{overflow:hidden;color:#425C6D;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.world-timeline-label small{color:#87959E;font-size:7px}.world-hour-cell{height:31px;padding:0;border:0;border-radius:5px;background:#EEF1F3;color:#75838B;font-size:8px;font-weight:800;cursor:pointer;transition:transform .1s ease,box-shadow .1s ease}.world-hour-cell.work{background:#E2F1E5;color:#4C7856}.world-hour-cell.evening{background:#FCECCF;color:#906A32}.world-hour-cell.night{background:#ECEEF4;color:#666C86}.world-hour-cell.selected{position:relative;z-index:1;box-shadow:0 0 0 2px var(--primary);transform:scale(1.04)}.world-hour-cell:hover{box-shadow:0 0 0 1px #8BA9BA}.world-timeline-axis .world-hour-cell{height:22px;background:transparent;color:#83919A;cursor:default;font-size:7px}.world-timeline-axis .world-hour-cell:hover{box-shadow:none}.world-timeline-note{margin-top:8px;color:#7B8992;font-size:9px;line-height:1.6}.world-timeline-note b{color:#516C7C}#toolDialog:has(.world-clock-tool){width:min(980px,calc(100vw - 26px));max-width:980px}.tool-body:has(.world-clock-tool){padding:15px;background:#F5F7F8}'''
text = text[:start] + new_css + text[end:]

old_mobile = '.world-convert-grid{grid-template-columns:1fr}.world-clock-time{font-size:17px}.world-zone-add{grid-template-columns:1fr}.world-zone-add button{width:100%}'
new_mobile = '.world-hero-content{grid-template-columns:1fr;min-height:0;padding:21px}.world-analog-clock{display:none}.world-home-time{font-size:31px}.world-clock-hero{min-height:205px}.world-dashboard-grid{grid-template-columns:1fr}.world-clock-cards{grid-template-columns:1fr}.world-convert-grid{grid-template-columns:1fr}.world-convert-result{grid-template-columns:1fr}.world-convert-result strong{grid-row:auto;grid-column:auto;text-align:right}.world-clock-time{font-size:20px}.world-zone-add{grid-template-columns:1fr}.world-zone-add button{width:100%}.world-timeline-row{grid-template-columns:105px repeat(24,minmax(25px,1fr))}'
if old_mobile in text:
    text = text.replace(old_mobile, new_mobile, 1)
else:
    raise SystemExit('world clock mobile css marker not found')

# Upgrade the card renderer and add timeline helpers.
start = text.find('function renderWorldClockCards(){')
end = text.find('function addWorldClockZone(){', start)
if start < 0 or end < 0:
    raise SystemExit('renderWorldClockCards block not found')
new_render = r'''function worldClockState(hour){
  if(hour>=8&&hour<18)return {label:"وقت عمل",className:"work"};
  if(hour>=18&&hour<23)return {label:"مساء",className:"evening"};
  return {label:"ليل / مبكر",className:"night"};
}
function utcOffsetText(date,zone){
  const offset=zoneOffsetMinutes(date,zone),sign=offset>=0?"+":"−",abs=Math.abs(offset),hours=Math.floor(abs/60),minutes=abs%60;
  return `UTC${sign}${hours}${minutes?":"+String(minutes).padStart(2,"0"):""}`;
}
function worldTimelineReferenceInstant(){
  const date=document.getElementById("worldConvertDate")?.value,time=document.getElementById("worldConvertTime")?.value,from=resolvedZoneFromInput(document.getElementById("worldFromZone"));
  if(validDateKey(date)&&TIME_RE.test(String(time))&&from.entry){const instant=wallTimeToInstant(date,time,from.entry.zone);if(instant)return instant}
  return new Date();
}
function selectWorldTimelineHour(time){
  const date=document.getElementById("worldConvertDate"),clock=document.getElementById("worldConvertTime"),from=document.getElementById("worldFromZone");
  if(!date||!clock||!from)return;const reference=worldTimelineReferenceInstant();date.value=dateKeyInZone(reference,SCHEDULE_TIMEZONE);clock.value=time;setTimeZoneInput(from,SCHEDULE_TIMEZONE);convertWorldTime();
}
function renderWorldTimeline(){
  const box=document.getElementById("worldTimeline");if(!box)return;
  const reference=worldTimelineReferenceInstant(),baseDate=dateKeyInZone(reference,SCHEDULE_TIMEZONE),selectedHour=zonedParts(reference,SCHEDULE_TIMEZONE).hour,zones=savedWorldClockZones();
  const header=`<div class="world-timeline-row world-timeline-axis"><div class="world-timeline-label"><strong>توقيت مصر</strong><small>${esc(baseDate)}</small></div>${Array.from({length:24},(_,hour)=>`<button type="button" class="world-hour-cell" tabindex="-1">${String(hour).padStart(2,"0")}</button>`).join("")}</div>`;
  const rows=zones.map(zone=>{
    const entry=timeZoneEntry(zone),label=entry?.label||zone;
    const cells=Array.from({length:24},(_,hour)=>{
      const cairoTime=`${String(hour).padStart(2,"0")}:00`,instant=wallTimeToInstant(baseDate,cairoTime,SCHEDULE_TIMEZONE);if(!instant)return "";
      const p=zonedParts(instant,zone),state=worldClockState(p.hour),selected=hour===selectedHour?" selected":"";
      return `<button type="button" class="world-hour-cell ${state.className}${selected}" title="${esc(label)} · ${esc(fmt(`${String(p.hour).padStart(2,"0")}:00`))}" onclick="selectWorldTimelineHour('${cairoTime}')">${String(p.hour).padStart(2,"0")}</button>`;
    }).join("");
    return `<div class="world-timeline-row"><div class="world-timeline-label"><strong>${esc(zone===SCHEDULE_TIMEZONE?"مصر":label)}</strong><small>${esc(worldOffsetText(reference,zone))}</small></div>${cells}</div>`;
  }).join("");
  box.innerHTML=header+rows;
}
function renderWorldClockCards(){
  const box=document.getElementById("worldClockCards");if(!box)return;const now=new Date(),zones=savedWorldClockZones(),homeParts=zonedParts(now,SCHEDULE_TIMEZONE),homeState=worldClockState(homeParts.hour);
  const heroTime=document.getElementById("worldHomeTime"),heroMeta=document.getElementById("worldHomeMeta"),clock=document.getElementById("worldAnalogClock");
  if(heroTime)heroTime.textContent=formattedTimeInZone(now,SCHEDULE_TIMEZONE);
  if(heroMeta){const dateKey=dateKeyInZone(now,SCHEDULE_TIMEZONE),dateText=new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"});heroMeta.innerHTML=`${esc(dateText)}<br>${esc(utcOffsetText(now,SCHEDULE_TIMEZONE))} · ${esc(homeState.label)}`}
  if(clock){const minute=homeParts.minute,hour=(homeParts.hour%12)+minute/60;clock.style.setProperty("--minute-angle",`${minute*6}deg`);clock.style.setProperty("--hour-angle",`${hour*30}deg`)}
  const otherZones=zones.filter(zone=>zone!==SCHEDULE_TIMEZONE);
  box.innerHTML=otherZones.length?otherZones.map(zone=>{
    const entry=timeZoneEntry(zone),parts=zonedParts(now,zone),state=worldClockState(parts.hour),dateKey=dateKeyInZone(now,zone),dateText=new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"short",timeZone:"UTC"});
    return `<article class="world-clock-card"><button type="button" class="world-remove" aria-label="إزالة ${esc(entry?.label||zone)}" onclick="removeWorldClockZone('${esc(zone)}')">×</button><div class="world-clock-card-top"><div><small>الوقت الآن</small><strong>${esc(entry?.label||zone)}</strong><span>${esc(dateText)} · ${esc(worldOffsetText(now,zone))}</span></div></div><div class="world-clock-time">${esc(formattedTimeInZone(now,zone))}</div><span class="world-zone-state ${state.className}">${esc(state.label)}</span></article>`;
  }).join(""):'<div class="world-clock-empty">أضف بلد الطالب أو مدينته، وسيظهر توقيته هنا بشكل دائم بجوار مصر.</div>';
  renderWorldTimeline();
}
'''
text = text[:start] + new_render + text[end:]

# Make the converter update the visual timeline as well.
start = text.find('function convertWorldTime(){')
end = text.find('function swapWorldConverter(){', start)
if start < 0 or end < 0:
    raise SystemExit('convertWorldTime block not found')
new_convert = r'''function convertWorldTime(){
  const date=document.getElementById("worldConvertDate")?.value,time=document.getElementById("worldConvertTime")?.value,fromResult=resolvedZoneFromInput(document.getElementById("worldFromZone")),toResult=resolvedZoneFromInput(document.getElementById("worldToZone")),box=document.getElementById("worldConvertResult");if(!box)return;
  if(!validDateKey(date)||!TIME_RE.test(time)){box.className="world-convert-result error";box.textContent="اختر تاريخًا ووقتًا صحيحين.";return}
  if(!fromResult.entry||!toResult.entry){box.className="world-convert-result error";box.textContent="اختر منطقتين زمنيتين واضحتين من الاقتراحات؛ الدول متعددة التوقيت تحتاج تحديد المنطقة.";return}
  const instant=wallTimeToInstant(date,time,fromResult.entry.zone);if(!instant){box.className="world-convert-result error";box.textContent="تعذّر تحويل هذا الموعد.";return}
  const targetDate=dateKeyInZone(instant,toResult.entry.zone),targetTime=formattedTimeInZone(instant,toResult.entry.zone),dateText=new Date(`${targetDate}T12:00:00Z`).toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"});
  box.className="world-convert-result";box.innerHTML=`<div><small>${esc(fromResult.entry.label)} ← ${esc(toResult.entry.label)}</small><span>${esc(dateText)}${esc(dayShiftLabel(date,targetDate))}</span></div><strong>${esc(fmt(time))} ← ${esc(targetTime)}</strong>`;renderWorldTimeline();
}
'''
text = text[:start] + new_convert + text[end:]

# Replace the simple modal layout with the new visual dashboard.
start = text.find('function openWorldClock(){')
end = text.find('function lessonTimeZoneInputChanged()', start)
if start < 0 or end < 0:
    raise SystemExit('openWorldClock block not found')
new_open = r'''function openWorldClock(){
  closeDataMenu();
  const ticks=Array.from({length:12},(_,index)=>`<i class="world-clock-tick" style="transform:translateX(-50%) rotate(${index*30}deg)"></i>`).join("");
  const content=`<div class="world-clock-tool">
    <section class="world-clock-hero">
      <div class="world-map-art" aria-hidden="true"><svg viewBox="0 0 900 260" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke="rgba(255,255,255,.09)" stroke-width="1"><ellipse cx="440" cy="132" rx="355" ry="110"/><ellipse cx="440" cy="132" rx="250" ry="110"/><ellipse cx="440" cy="132" rx="125" ry="110"/><path d="M85 132h710M105 88h670M105 176h670"/></g><g fill="rgba(255,255,255,.11)"><path d="M135 86l55-28 75 10 37 28-23 25-51-3-27 22-42-9-31-23z"/><path d="M278 143l35 13 19 41-18 50-26-8-12-43-18-28z"/><path d="M421 72l44-14 45 13 5 24-33 13-29-8-24 18-25-20z"/><path d="M476 116l38-9 26 24-10 50-29 42-30-16-8-52z"/><path d="M533 72l83-16 83 21 34 29-34 25-66-4-36 24-43-17-22-31z"/><path d="M690 177l44 5 22 26-19 24-42-7-17-27z"/></g></svg></div>
      <div class="world-hero-content"><div class="world-hero-copy"><span class="world-hero-kicker">التوقيت الأساسي · مصر</span><h3>العالم كله في توقيت واحد واضح</h3><p>راقب وقت طلابك، واختَر موعدًا مناسبًا، وحوّل أي حصة بدون حساب فرق الساعات يدويًا.</p><div class="world-home-live"><div class="world-home-time" id="worldHomeTime">—</div><div class="world-home-meta" id="worldHomeMeta">—</div></div></div><div class="world-analog-clock" id="worldAnalogClock" aria-label="ساعة مصر الآن">${ticks}<span class="world-clock-center"></span></div></div>
    </section>
    <div class="world-dashboard-grid">
      <section class="world-clock-section"><header><div><h3>بلاد الطلاب</h3><p>احفظ المناطق التي تتعامل معها لتراها دائمًا بجانب توقيت مصر.</p></div><span class="world-section-badge">يتحدث تلقائيًا</span></header><div class="world-zone-add"><input id="worldZoneSearch" list="worldTimeZoneOptions" placeholder="اكتب: أذربيجان، روسيا، باكو…" autocomplete="off" oninput="worldZoneInputChanged(this)"><button type="button" onclick="addWorldClockZone()">＋ إضافة بلد</button></div><div class="world-search-hint" id="worldZoneSearchHint">اكتب اسم الدولة بالعربي أو المدينة، ثم اختر النتيجة. الدول متعددة التوقيت تحتاج تحديد المدينة.</div><datalist id="worldTimeZoneOptions"></datalist><div class="world-clock-cards" id="worldClockCards"></div></section>
      <section class="world-clock-section"><header><div><h3>تحويل موعد</h3><p>اكتب الساعة كما قالها الطالب، أو ابدأ من توقيت مصر.</p></div><span class="world-section-badge">DST تلقائي</span></header><div class="world-convert-grid"><div class="field"><label for="worldConvertDate">التاريخ</label><input id="worldConvertDate" type="date" value="${currentDateKey()}" onchange="convertWorldTime()"></div><div class="field"><label for="worldConvertTime">الساعة</label><input id="worldConvertTime" type="time" value="${currentTimeKey()}" oninput="convertWorldTime()"></div><div class="field"><label for="worldFromZone">من توقيت</label><input id="worldFromZone" list="worldTimeZoneOptions" autocomplete="off" oninput="worldZoneInputChanged(this)" onchange="convertWorldTime()"></div><div class="field"><label for="worldToZone">إلى توقيت</label><input id="worldToZone" list="worldTimeZoneOptions" autocomplete="off" oninput="worldZoneInputChanged(this)" onchange="convertWorldTime()"></div></div><div class="world-convert-actions"><button type="button" onclick="convertWorldTime()">تحويل الموعد</button><button type="button" class="secondary" onclick="swapWorldConverter()">⇄ عكس الاتجاه</button></div><div class="world-convert-result" id="worldConvertResult" aria-live="polite"></div></section>
    </div>
    <section class="world-clock-section world-timeline-section"><div class="world-timeline-head"><div><h3>مقارنة اليوم بصريًا</h3><p>كل عمود هو نفس اللحظة في الدول المحفوظة؛ اضغط أي ساعة لتجربتها في المحول.</p></div><div class="world-timeline-legend"><span><i></i>ليل</span><span class="work"><i></i>وقت مناسب</span><span class="evening"><i></i>مساء</span></div></div><div class="world-timeline-scroll"><div class="world-timeline" id="worldTimeline"></div></div><div class="world-timeline-note"><b>ملاحظة:</b> الألوان للمساعدة البصرية فقط؛ التحويل نفسه يعتمد على المنطقة الزمنية الحقيقية وتاريخ الموعد.</div></section>
  </div>`;
  openToolDialog("الساعة العالمية","",content);populateTimeZoneDatalist("worldTimeZoneOptions");
  const target=savedWorldClockZones().find(zone=>zone!==SCHEDULE_TIMEZONE)||"Asia/Baku";setTimeZoneInput(document.getElementById("worldFromZone"),SCHEDULE_TIMEZONE);setTimeZoneInput(document.getElementById("worldToZone"),validTimeZone(target)?target:SCHEDULE_TIMEZONE);renderWorldClockCards();convertWorldTime();
  if(worldClockInterval)clearInterval(worldClockInterval);worldClockInterval=setInterval(renderWorldClockCards,30000);
}
'''
text = text[:start] + new_open + text[end:]

# New PWA shell so installed copies receive the redesign immediately.
sw = Path('sw.js')
sw_text = sw.read_text(encoding='utf-8')
if 'mawaeidi-shell-v14' not in sw_text:
    raise SystemExit('expected cache v14 not found')
sw.write_text(sw_text.replace('mawaeidi-shell-v14','mawaeidi-shell-v15',1), encoding='utf-8')

# Sanity markers.
for token in ['world-clock-hero','worldAnalogClock','renderWorldTimeline','world-dashboard-grid','mawaeidi-world-clock-zones-v1']:
    if token not in text:
        raise SystemExit(f'missing token: {token}')

path.write_text(text, encoding='utf-8')
