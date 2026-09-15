from pathlib import Path

path=Path('index.html')
text=path.read_text(encoding='utf-8')

# Persist a user-selectable base timezone for the world clock only.
old='const WORLD_CLOCK_ZONES_KEY="mawaeidi-world-clock-zones-v1";\nconst SCHEDULE_TIMEZONE="Africa/Cairo";'
new='const WORLD_CLOCK_ZONES_KEY="mawaeidi-world-clock-zones-v1";\nconst WORLD_CLOCK_BASE_KEY="mawaeidi-world-clock-base-v1";\nconst SCHEDULE_TIMEZONE="Africa/Cairo";'
if old not in text: raise SystemExit('world clock constants marker not found')
text=text.replace(old,new,1)

# Replace world clock visual CSS as one isolated block.
css_start=text.find('.world-clock-tool{')
css_end=text.find('\n.backdrop{',css_start)
if css_start<0 or css_end<0: raise SystemExit('world clock CSS boundaries not found')
world_css=r'''.world-clock-tool{display:grid;gap:18px}
.world-clock-hero{position:relative;z-index:1;min-height:270px;overflow:hidden;border:1px solid rgba(255,255,255,.08);border-radius:20px;background:linear-gradient(135deg,#153B55 0%,#245D78 50%,#337F98 100%);color:#fff;box-shadow:0 8px 22px rgba(20,61,84,.11);isolation:isolate}
.world-clock-hero::after{content:"";position:absolute;inset:auto -8% -54% auto;width:390px;height:390px;border:1px solid rgba(255,255,255,.10);border-radius:50%;box-shadow:0 0 0 48px rgba(255,255,255,.018),0 0 0 96px rgba(255,255,255,.014);pointer-events:none}
.world-map-art{position:absolute;inset:-4% -1%;z-index:0;opacity:.82;pointer-events:none}.world-map-art svg{width:100%;height:100%;display:block}.world-map-grid{fill:none;stroke:rgba(255,255,255,.085);stroke-width:1.2}.world-map-land{fill:rgba(255,255,255,.115);stroke:rgba(255,255,255,.06);stroke-width:1}.world-map-land.soft{fill:rgba(255,255,255,.075)}
.world-hero-content{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1fr) 190px;align-items:center;gap:28px;min-height:270px;padding:29px 34px}.world-hero-copy{max-width:650px}.world-hero-kicker{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.09);font-size:10px;font-weight:800}.world-hero-kicker::before{content:"";width:7px;height:7px;border-radius:50%;background:#F0C75E;box-shadow:0 0 0 4px rgba(240,199,94,.14)}.world-hero-copy h3{margin:13px 0 5px;font-size:25px;line-height:1.3;color:#fff}.world-hero-copy p{max-width:520px;margin:0;color:rgba(255,255,255,.72);font-size:11px;line-height:1.85}
.world-base-control{display:grid;grid-template-columns:auto minmax(220px,330px);align-items:center;gap:9px;width:max-content;max-width:100%;margin-top:16px;padding:7px 8px 7px 10px;border:1px solid rgba(255,255,255,.16);border-radius:11px;background:rgba(8,38,55,.17);backdrop-filter:blur(8px)}.world-base-control label{color:rgba(255,255,255,.72);font-size:9px;font-weight:800;white-space:nowrap}.world-base-control input{height:35px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.12);color:#fff;font-size:10px;font-weight:700}.world-base-control input::placeholder{color:rgba(255,255,255,.55)}.world-base-hint{grid-column:1/-1;color:rgba(255,255,255,.6);font-size:8px;line-height:1.5}
.world-home-live{display:flex;align-items:baseline;gap:12px;margin-top:14px}.world-home-time{font-size:39px;font-weight:900;letter-spacing:-1.2px;direction:ltr}.world-home-meta{font-size:10px;line-height:1.75;color:rgba(255,255,255,.72)}
.world-analog-clock{--hour-angle:0deg;--minute-angle:0deg;position:relative;width:164px;height:164px;margin:auto;border:1px solid rgba(255,255,255,.32);border-radius:50%;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.13) 0 4%,transparent 4.5%),linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.045));box-shadow:inset 0 0 0 7px rgba(255,255,255,.026),inset 0 0 28px rgba(255,255,255,.035),0 10px 24px rgba(4,29,44,.16);backdrop-filter:blur(7px)}.world-analog-clock::before,.world-analog-clock::after{content:"";position:absolute;z-index:4;left:50%;bottom:50%;border-radius:999px;transform-origin:50% 100%}.world-analog-clock::before{width:4px;height:29%;background:#F7FAFC;transform:translateX(-50%) rotate(var(--hour-angle));box-shadow:0 0 6px rgba(0,0,0,.1)}.world-analog-clock::after{width:2px;height:39%;background:#F3CE69;transform:translateX(-50%) rotate(var(--minute-angle));box-shadow:0 0 5px rgba(243,206,105,.2)}.world-clock-center{position:absolute;z-index:6;left:50%;top:50%;width:10px;height:10px;border:2px solid #fff;border-radius:50%;background:#F3CE69;transform:translate(-50%,-50%);box-shadow:0 2px 6px rgba(0,0,0,.18)}.world-clock-tick{position:absolute;z-index:2;width:2px;height:2px;border-radius:50%;background:rgba(255,255,255,.42);transform:translate(-50%,-50%)}.world-clock-tick.major{width:2px;height:7px;border-radius:2px;background:rgba(255,255,255,.64);transform:translate(-50%,-50%)}.world-clock-number{position:absolute;z-index:3;color:rgba(255,255,255,.88);font-family:Arial,sans-serif;font-size:10px;font-weight:700;line-height:1;transform:translate(-50%,-50%);text-shadow:0 1px 3px rgba(0,0,0,.18);direction:ltr}
.world-dashboard-grid{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(320px,.92fr);gap:14px}.world-clock-section{padding:17px;border:1px solid var(--line);border-radius:14px;background:#fff;box-shadow:0 4px 14px rgba(17,42,64,.025)}.world-clock-section>header{display:flex;align-items:start;justify-content:space-between;gap:10px;margin-bottom:14px}.world-clock-section h3{margin:0;color:var(--primary);font-size:15px}.world-clock-section p{margin:3px 0 0;color:var(--muted);font-size:10px;line-height:1.7}.world-section-badge{display:inline-flex;align-items:center;min-height:27px;padding:4px 8px;border-radius:999px;background:#EEF4F7;color:#587589;font-size:9px;font-weight:800;white-space:nowrap}
.world-zone-add{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px}.world-zone-add button,.world-convert-actions button{min-height:40px;padding:8px 14px;border:0;border-radius:9px;background:var(--primary);color:#fff;font-size:11px;font-weight:800}.world-search-hint{margin:6px 2px 11px;color:#7A8993;font-size:9px;line-height:1.55}.world-clock-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.world-clock-empty{grid-column:1/-1;padding:18px;border:1px dashed #C8D5DD;border-radius:10px;background:#F8FAFB;color:#71828C;text-align:center;font-size:10px;line-height:1.75}.world-clock-card{position:relative;min-width:0;padding:13px 13px 12px;border:1px solid #DCE5EA;border-radius:11px;background:linear-gradient(180deg,#FCFDFD,#F6F9FA);transition:transform .16s ease,box-shadow .16s ease}.world-clock-card:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(25,61,82,.08)}.world-clock-card-top{display:flex;align-items:start;justify-content:space-between;gap:8px}.world-clock-card small,.world-clock-card span{display:block;color:var(--muted);font-size:9px}.world-clock-card strong{display:block;overflow:hidden;margin:3px 0;color:var(--ink);font-size:11px;line-height:1.5;text-overflow:ellipsis;white-space:nowrap}.world-clock-time{margin-top:12px;color:var(--primary);font-size:22px;font-weight:900;direction:ltr}.world-zone-state{display:inline-flex!important;align-items:center;gap:5px;margin-top:5px;padding:4px 6px;border-radius:999px;background:#EEF4F7;color:#557589!important;font-size:8px!important;font-weight:800}.world-zone-state::before{content:"";width:5px;height:5px;border-radius:50%;background:#7795A7}.world-zone-state.work{background:#EDF7EF;color:#497652!important}.world-zone-state.work::before{background:#61A06B}.world-zone-state.evening{background:#FFF5E5;color:#93642B!important}.world-zone-state.evening::before{background:#D7A24B}.world-zone-state.night{background:#EFF0F6;color:#626886!important}.world-zone-state.night::before{background:#73799A}.world-remove{position:absolute;top:7px;left:7px;width:24px;height:24px;padding:0;border:0;border-radius:50%;background:transparent;color:#8796A0;font-size:17px}.world-remove:hover{background:#fff;color:var(--danger);box-shadow:0 2px 7px rgba(0,0,0,.06)}
.world-converter-section{background:linear-gradient(180deg,#fff,#FBFCFD)}.world-convert-shell{display:grid;gap:11px}.world-convert-when{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:11px;border:1px solid #E0E8ED;border-radius:11px;background:#F8FAFB}.world-convert-route{display:grid;grid-template-columns:minmax(0,1fr) 42px minmax(0,1fr);align-items:end;gap:8px}.world-zone-picker{padding:10px;border:1px solid #DCE5EA;border-radius:11px;background:#fff}.world-zone-picker .field{gap:5px}.world-zone-picker label,.world-convert-when label{font-size:9px;font-weight:800;color:#5C7180}.world-swap-zone{width:42px;height:42px;padding:0;border:1px solid #CAD8E0;border-radius:50%;background:#F4F8FA;color:var(--primary);font-size:18px;font-weight:900;cursor:pointer;transition:transform .15s ease,background .15s ease}.world-swap-zone:hover{transform:rotate(180deg);background:#EAF2F6}.world-convert-actions{display:flex;gap:7px;align-items:center}.world-convert-actions .secondary{border:1px solid var(--line);background:#fff;color:var(--primary)}.world-convert-result{margin-top:1px;padding:14px;border:1px solid #D6E2E8;border-radius:12px;background:linear-gradient(135deg,#F3F8FA,#EAF2F5)}.world-result-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.world-result-head>span{color:#587184;font-size:9px;font-weight:900}.world-result-head>small{color:#6F8492;font-size:9px}.world-result-times{display:grid;grid-template-columns:minmax(0,1fr) 28px minmax(0,1fr);align-items:center;gap:8px}.world-result-time-card{min-width:0;padding:10px;border:1px solid rgba(90,128,150,.14);border-radius:10px;background:rgba(255,255,255,.72)}.world-result-time-card small{display:block;overflow:hidden;color:#667984;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.world-result-time-card strong{display:block;margin-top:3px;color:var(--primary);font-size:22px;font-weight:900;direction:ltr}.world-result-arrow{text-align:center;color:#7891A1;font-size:19px;font-weight:900}.world-result-meta{margin-top:9px;color:#687C89;font-size:9px;line-height:1.65}.world-result-warning{margin-top:8px;padding:7px 9px;border-radius:8px;background:#FFF5E7;color:#91631F;font-size:9px;font-weight:700}.world-convert-result.error{display:block;border-color:#E8C6C6;background:var(--danger-bg);color:var(--danger);font-size:11px}
.world-timeline-section{overflow:hidden}.world-timeline-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:11px}.world-timeline-legend{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.world-timeline-legend span{display:inline-flex;align-items:center;gap:4px;color:#75858F;font-size:8px}.world-timeline-legend i{width:8px;height:8px;border-radius:2px;background:#EEF1F3}.world-timeline-legend .work i{background:#DDEFE1}.world-timeline-legend .evening i{background:#FCEACB}.world-timeline-scroll{overflow-x:auto;padding-bottom:6px;scrollbar-width:thin}.world-timeline{min-width:1080px;display:grid;gap:4px}.world-timeline-row{display:grid;grid-template-columns:145px repeat(24,minmax(34px,1fr));gap:2px;align-items:stretch}.world-timeline-label{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:5px 8px;border-radius:7px;background:#F5F8F9}.world-timeline-label strong{overflow:hidden;color:#425C6D;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.world-timeline-label small{color:#87959E;font-size:7px}.world-hour-cell{height:33px;padding:0 2px;border:0;border-radius:5px;background:#EEF1F3;color:#75838B;font-size:8px;font-weight:800;cursor:pointer;white-space:nowrap;transition:transform .1s ease,box-shadow .1s ease}.world-hour-cell.work{background:#E2F1E5;color:#4C7856}.world-hour-cell.evening{background:#FCECCF;color:#906A32}.world-hour-cell.night{background:#ECEEF4;color:#666C86}.world-hour-cell.selected{position:relative;z-index:1;box-shadow:0 0 0 2px var(--primary);transform:scale(1.04)}.world-hour-cell:hover{box-shadow:0 0 0 1px #8BA9BA}.world-timeline-axis .world-hour-cell{height:25px;background:transparent;color:#7B8992;cursor:default;font-size:8px}.world-timeline-axis .world-hour-cell:hover{box-shadow:none}.world-timeline-note{margin-top:8px;color:#7B8992;font-size:9px;line-height:1.6}.world-timeline-note b{color:#516C7C}
.world-clock-page{padding:22px 0 34px}.world-clock-page[hidden]{display:none!important}.world-clock-page .world-clock-tool{width:100%;max-width:none;margin:0}
@media(max-width:760px){.world-clock-tool{gap:12px}.world-clock-hero{min-height:0}.world-hero-content{grid-template-columns:1fr!important;min-height:0!important;padding:20px!important}.world-analog-clock{display:block!important;width:122px!important;height:122px!important;margin:5px auto 0!important}.world-base-control{grid-template-columns:1fr;width:100%;max-width:none}.world-base-control label{white-space:normal}.world-dashboard-grid{grid-template-columns:1fr}.world-clock-cards{grid-template-columns:1fr}.world-zone-add{grid-template-columns:1fr}.world-convert-when,.world-convert-route{grid-template-columns:1fr}.world-swap-zone{justify-self:center;transform:rotate(90deg)}.world-swap-zone:hover{transform:rotate(270deg)}.world-result-times{grid-template-columns:1fr}.world-result-arrow{transform:rotate(90deg)}.world-timeline-row{grid-template-columns:112px repeat(24,minmax(35px,1fr))}.world-home-time{font-size:32px}.world-clock-page{padding:14px 0 26px}}
'''
text=text[:css_start]+world_css+text[css_end:]

# Replace saved zones logic and add base timezone persistence.
start=text.find('function savedWorldClockZones(){')
end=text.find('function worldClockState(',start)
if start<0 or end<0: raise SystemExit('saved world zones functions not found')
storage_js=r'''function savedWorldClockBase(){
  try{const zone=localStorage.getItem(WORLD_CLOCK_BASE_KEY);return validTimeZone(zone)?zone:SCHEDULE_TIMEZONE}catch{return SCHEDULE_TIMEZONE}
}
function rememberWorldClockBase(zone){try{if(validTimeZone(zone))localStorage.setItem(WORLD_CLOCK_BASE_KEY,zone)}catch{}}
function savedWorldClockZones(){
  const base=savedWorldClockBase();
  try{
    const raw=localStorage.getItem(WORLD_CLOCK_ZONES_KEY);if(raw===null)return [...new Set([base,"Asia/Baku"].filter(validTimeZone))];
    const stored=JSON.parse(raw),zones=(Array.isArray(stored)?stored:[]).filter(validTimeZone);return [...new Set([base,...zones])].slice(0,10);
  }catch{return [...new Set([base,"Asia/Baku"].filter(validTimeZone))]}
}
function rememberWorldClockZones(zones){
  const base=savedWorldClockBase();
  try{localStorage.setItem(WORLD_CLOCK_ZONES_KEY,JSON.stringify([...new Set((zones||[]).filter(validTimeZone).filter(zone=>zone!==base))].slice(0,9)))}catch{}
}
'''
text=text[:start]+storage_js+text[end:]

# Make offset wording relative to the selected world-clock base timezone.
start=text.find('function worldOffsetText(')
end=text.find('function todayName()',start)
if start<0 or end<0: raise SystemExit('worldOffsetText boundaries not found')
offset_js=r'''function worldOffsetText(date,zone,baseZone=savedWorldClockBase()){
  const diff=zoneOffsetMinutes(date,zone)-zoneOffsetMinutes(date,baseZone),baseLabel=timeZoneShortLabel(baseZone)||"التوقيت الأساسي";
  if(!diff)return `نفس توقيت ${baseLabel}`;
  const sign=diff>0?"+":"−",abs=Math.abs(diff),hours=Math.floor(abs/60),minutes=abs%60;
  return `${sign}${hours}${minutes?`:${String(minutes).padStart(2,"0")}`:""} عن ${baseLabel}`;
}
function worldDifferenceText(date,fromZone,toZone){
  const diff=zoneOffsetMinutes(date,toZone)-zoneOffsetMinutes(date,fromZone);if(!diff)return "نفس التوقيت";
  const abs=Math.abs(diff),hours=Math.floor(abs/60),minutes=abs%60,amount=`${hours}${minutes?`:${String(minutes).padStart(2,"0")}`:""}`;
  return diff>0?`التوقيت الثاني أمام بـ ${amount}`:`التوقيت الثاني متأخر بـ ${amount}`;
}
function worldHour12Label(hour){const value=((Number(hour)%24)+24)%24,h=value%12||12;return `${h} ${value<12?"ص":"م"}`}
'''
text=text[:start]+offset_js+text[end:]

# Replace world timeline functions so the selected base drives the comparison and labels use 12-hour format.
start=text.find('function worldTimelineReferenceInstant(){')
end=text.find('function renderWorldClockCards(){',start)
if start<0 or end<0: raise SystemExit('world timeline block not found')
timeline_js=r'''function worldTimelineReferenceInstant(){
  const date=document.getElementById("worldConvertDate")?.value,time=document.getElementById("worldConvertTime")?.value,from=resolvedZoneFromInput(document.getElementById("worldFromZone"));
  if(validDateKey(date)&&TIME_RE.test(String(time))&&from.entry){const instant=wallTimeToInstant(date,time,from.entry.zone);if(instant)return instant}
  return new Date();
}
function selectWorldTimelineHour(time){
  const date=document.getElementById("worldConvertDate"),clock=document.getElementById("worldConvertTime"),from=document.getElementById("worldFromZone");
  if(!date||!clock||!from)return;const base=savedWorldClockBase(),reference=worldTimelineReferenceInstant();date.value=dateKeyInZone(reference,base);clock.value=time;setTimeZoneInput(from,base);convertWorldTime();
}
function renderWorldTimeline(){
  const box=document.getElementById("worldTimeline");if(!box)return;
  const base=savedWorldClockBase(),reference=worldTimelineReferenceInstant(),baseDate=dateKeyInZone(reference,base),selectedHour=zonedParts(reference,base).hour,zones=savedWorldClockZones();
  const baseLabel=timeZoneShortLabel(base)||base;
  const header=`<div class="world-timeline-row world-timeline-axis"><div class="world-timeline-label"><strong>${esc(baseLabel)}</strong><small>التوقيت الأساسي · ${esc(baseDate)}</small></div>${Array.from({length:24},(_,hour)=>`<button type="button" class="world-hour-cell" tabindex="-1">${esc(worldHour12Label(hour))}</button>`).join("")}</div>`;
  const rows=zones.map(zone=>{
    const entry=timeZoneEntry(zone),label=entry?.label||zone;
    const cells=Array.from({length:24},(_,hour)=>{
      const baseTime=`${String(hour).padStart(2,"0")}:00`,instant=wallTimeToInstant(baseDate,baseTime,base);if(!instant)return "";
      const p=zonedParts(instant,zone),state=worldClockState(p.hour),selected=hour===selectedHour?" selected":"";
      return `<button type="button" class="world-hour-cell ${state.className}${selected}" title="${esc(label)} · ${esc(worldHour12Label(p.hour))}" onclick="selectWorldTimelineHour('${baseTime}')">${esc(worldHour12Label(p.hour))}</button>`;
    }).join("");
    return `<div class="world-timeline-row"><div class="world-timeline-label"><strong>${esc(zone===base?baseLabel:label)}</strong><small>${zone===base?"التوقيت الأساسي":esc(worldOffsetText(reference,zone,base))}</small></div>${cells}</div>`;
  }).join("");
  box.innerHTML=header+rows;
}
'''
text=text[:start]+timeline_js+text[end:]

# Replace clock card rendering to use the selected base timezone.
start=text.find('function renderWorldClockCards(){')
end=text.find('function addWorldClockZone(){',start)
if start<0 or end<0: raise SystemExit('renderWorldClockCards block not found')
render_js=r'''function renderWorldClockCards(){
  const box=document.getElementById("worldClockCards");if(!box)return;
  const now=new Date(),base=savedWorldClockBase(),zones=savedWorldClockZones(),homeParts=zonedParts(now,base),homeState=worldClockState(homeParts.hour),baseLabel=timeZoneShortLabel(base)||base;
  const heroTime=document.getElementById("worldHomeTime"),heroMeta=document.getElementById("worldHomeMeta"),clock=document.getElementById("worldAnalogClock"),kicker=document.getElementById("worldHeroKicker");
  if(kicker)kicker.textContent=`التوقيت الأساسي · ${baseLabel}`;
  if(heroTime)heroTime.textContent=formattedTimeInZone(now,base);
  if(heroMeta){const dateKey=dateKeyInZone(now,base),dateText=new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"});heroMeta.innerHTML=`${esc(dateText)}<br>${esc(utcOffsetText(now,base))} · ${esc(homeState.label)}`}
  if(clock){const minute=homeParts.minute,hour=(homeParts.hour%12)+minute/60;clock.style.setProperty("--minute-angle",`${minute*6}deg`);clock.style.setProperty("--hour-angle",`${hour*30}deg`);clock.setAttribute("aria-label",`ساعة ${baseLabel} الآن`)}
  const otherZones=zones.filter(zone=>zone!==base);
  box.innerHTML=otherZones.length?otherZones.map(zone=>{
    const entry=timeZoneEntry(zone),parts=zonedParts(now,zone),state=worldClockState(parts.hour),dateKey=dateKeyInZone(now,zone),dateText=new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"short",timeZone:"UTC"});
    return `<article class="world-clock-card"><button type="button" class="world-remove" aria-label="إزالة ${esc(entry?.label||zone)}" onclick="removeWorldClockZone('${esc(zone)}')">×</button><div class="world-clock-card-top"><div><small>الوقت الآن</small><strong>${esc(entry?.label||zone)}</strong><span>${esc(dateText)} · ${esc(worldOffsetText(now,zone,base))}</span></div></div><div class="world-clock-time">${esc(formattedTimeInZone(now,zone))}</div><span class="world-zone-state ${state.className}">${esc(state.label)}</span></article>`;
  }).join(""):`<div class="world-clock-empty">أضف بلد الطالب أو مدينته، وسيظهر توقيته هنا مقارنة بالتوقيت الأساسي.</div>`;
  renderWorldTimeline();
}
'''
text=text[:start]+render_js+text[end:]

# Insert base-timezone controls and converter-now helper before addWorldClockZone.
insert=text.find('function addWorldClockZone(){')
base_controls=r'''function worldBaseInputChanged(input){if(input.value!==input.dataset.zoneLabel){input.dataset.zone="";input.dataset.zoneLabel=""}}
function changeWorldClockBase(){
  const input=document.getElementById("worldBaseZone"),hint=document.getElementById("worldBaseHint"),result=resolvedZoneFromInput(input);if(!input)return;
  if(!result.entry){if(hint)hint.textContent=result.ambiguous?"هذه الدولة لها أكثر من منطقة زمنية؛ اختر المدينة أو المنطقة من القائمة.":"اختر دولة أو مدينة واضحة من الاقتراحات.";return}
  const previous=savedWorldClockBase(),previousZones=savedWorldClockZones();rememberWorldClockBase(result.entry.zone);
  const nextZones=previousZones.filter(zone=>zone!==result.entry.zone);if(previous!==result.entry.zone)nextZones.unshift(previous);rememberWorldClockZones(nextZones);
  setTimeZoneInput(input,result.entry.zone);if(hint)hint.textContent="يؤثر هذا الاختيار على الساعة العالمية والمقارنة فقط؛ جدول الحصص يظل بتوقيت مصر.";
  const from=document.getElementById("worldFromZone"),to=document.getElementById("worldToZone");setTimeZoneInput(from,result.entry.zone);const target=savedWorldClockZones().find(zone=>zone!==result.entry.zone)||SCHEDULE_TIMEZONE;setTimeZoneInput(to,target);
  const now=new Date(),date=document.getElementById("worldConvertDate"),time=document.getElementById("worldConvertTime");if(date)date.value=dateKeyInZone(now,result.entry.zone);if(time)time.value=timeKeyInZone(now,result.entry.zone);
  renderWorldClockCards();convertWorldTime();
}
function setWorldConverterNow(){
  const fromResult=resolvedZoneFromInput(document.getElementById("worldFromZone")),zone=fromResult.entry?.zone||savedWorldClockBase(),now=new Date(),date=document.getElementById("worldConvertDate"),time=document.getElementById("worldConvertTime");
  if(date)date.value=dateKeyInZone(now,zone);if(time)time.value=timeKeyInZone(now,zone);convertWorldTime();
}
'''
text=text[:insert]+base_controls+text[insert:]

# Replace converter output with a clearer two-time result.
start=text.find('function convertWorldTime(){')
end=text.find('function swapWorldConverter(){',start)
if start<0 or end<0: raise SystemExit('convertWorldTime block not found')
convert_js=r'''function convertWorldTime(){
  const date=document.getElementById("worldConvertDate")?.value,time=document.getElementById("worldConvertTime")?.value,fromResult=resolvedZoneFromInput(document.getElementById("worldFromZone")),toResult=resolvedZoneFromInput(document.getElementById("worldToZone")),box=document.getElementById("worldConvertResult");if(!box)return;
  if(!validDateKey(date)||!TIME_RE.test(time)){box.className="world-convert-result error";box.textContent="اختر تاريخًا ووقتًا صحيحين.";return}
  if(!fromResult.entry||!toResult.entry){box.className="world-convert-result error";box.textContent="اختر منطقتين زمنيتين واضحتين من الاقتراحات؛ الدول متعددة التوقيت تحتاج تحديد المدينة أو المنطقة.";return}
  const instant=wallTimeToInstant(date,time,fromResult.entry.zone);if(!instant){box.className="world-convert-result error";box.textContent="تعذّر تحويل هذا الموعد.";return}
  const targetDate=dateKeyInZone(instant,toResult.entry.zone),targetRaw=timeKeyInZone(instant,toResult.entry.zone),sourceLabel=timeZoneShortLabel(fromResult.entry.zone)||fromResult.entry.label,targetLabel=timeZoneShortLabel(toResult.entry.zone)||toResult.entry.label;
  const sourceDateText=new Date(`${date}T12:00:00Z`).toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"}),targetDateText=new Date(`${targetDate}T12:00:00Z`).toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"}),targetHour=Number(targetRaw.slice(0,2)),warning=targetHour<6||targetHour>=23;
  box.className="world-convert-result";box.innerHTML=`<div class="world-result-head"><span>النتيجة</span><small>${esc(worldDifferenceText(instant,fromResult.entry.zone,toResult.entry.zone))}</small></div><div class="world-result-times"><div class="world-result-time-card"><small>${esc(sourceLabel)}</small><strong>${esc(fmt(time))}</strong></div><div class="world-result-arrow">←</div><div class="world-result-time-card"><small>${esc(targetLabel)}</small><strong>${esc(fmt(targetRaw))}</strong></div></div><div class="world-result-meta">${esc(sourceDateText)} ← ${esc(targetDateText)}${esc(dayShiftLabel(date,targetDate))}</div>${warning?'<div class="world-result-warning">هذا الموعد يقع في وقت متأخر جدًا أو مبكر جدًا في المنطقة الثانية.</div>':""}`;
  renderWorldTimeline();
}
'''
text=text[:start]+convert_js+text[end:]

# Replace the entire world clock page builder.
start=text.find('function openWorldClock(){')
end=text.find('function lessonTimeZoneInputChanged()',start)
if start<0 or end<0: raise SystemExit('openWorldClock boundaries not found')
open_js=r'''function openWorldClock(){
  closeDataMenu();currentSection="world";updateSectionChrome();
  const ticks=Array.from({length:60},(_,index)=>{const angle=index*6*Math.PI/180,r=index%5===0?45.5:46.5,x=50+r*Math.sin(angle),y=50-r*Math.cos(angle);return `<i class="world-clock-tick${index%5===0?" major":""}" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%"></i>`}).join("");
  const numbers=Array.from({length:12},(_,index)=>{const number=index+1,angle=number*30*Math.PI/180,r=37.5,x=50+r*Math.sin(angle),y=50-r*Math.cos(angle);return `<span class="world-clock-number" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%">${number}</span>`}).join("");
  const content=`<div class="world-clock-tool">
    <section class="world-clock-hero">
      <div class="world-map-art" aria-hidden="true"><svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice"><g class="world-map-grid"><ellipse cx="600" cy="210" rx="535" ry="168"/><ellipse cx="600" cy="210" rx="390" ry="168"/><ellipse cx="600" cy="210" rx="205" ry="168"/><path d="M65 210H1135M92 146H1108M92 274H1108"/><path d="M255 57C213 120 205 293 255 363M945 57C987 120 995 293 945 363"/></g><g><path class="world-map-land" d="M125 135C157 102 198 78 246 77c34-1 62 10 90 18l48-9 55 25-19 28-46 5-27 22-35-4-28 23-38-3-20 20-43-16-39-20-28-31 29-20z"/><path class="world-map-land soft" d="M312 205c27 8 52 24 67 47l8 41-20 34-18 50-28-13-17-43-20-35 5-39-18-22 21-20z"/><path class="world-map-land" d="M515 122l38-20 52 3 27 18 24-8 25 19-16 25-36 4-22 24-39-10-36 9-26-20 29-44z"/><path class="world-map-land" d="M568 185l50-13 46 20 30 42-10 57-34 55-38 38-31-25-9-52-25-43 8-45 13-34z"/><path class="world-map-land" d="M656 121l50-25 72 6 43-17 91 11 56 28 74 4 54 35-29 29-60-6-48 19-39-14-34 18-47-16-40 16-45-24-31-39-46 3-21-28z"/><path class="world-map-land soft" d="M934 292l52-12 58 14 21 28-21 25-49-2-41 18-28-23-13-28 21-20z"/><path class="world-map-land soft" d="M417 82l25-22 38 4 12 21-18 18-42-3-15-18z"/></g></svg></div>
      <div class="world-hero-content"><div class="world-hero-copy"><span class="world-hero-kicker" id="worldHeroKicker">التوقيت الأساسي · مصر</span><h3>العالم كله في توقيت واحد واضح</h3><p>راقب وقت طلابك، واختَر موعدًا مناسبًا، وحوّل أي حصة بدون حساب فرق الساعات يدويًا.</p><div class="world-base-control"><label for="worldBaseZone">التوقيت الأساسي</label><input id="worldBaseZone" list="worldTimeZoneOptions" autocomplete="off" placeholder="مصر — القاهرة" oninput="worldBaseInputChanged(this)" onchange="changeWorldClockBase()"><div class="world-base-hint" id="worldBaseHint">مصر هي الافتراضي. يمكنك تغييره للساعة العالمية فقط، بدون تغيير توقيت جدول حصصك.</div></div><div class="world-home-live"><div class="world-home-time" id="worldHomeTime">—</div><div class="world-home-meta" id="worldHomeMeta">—</div></div></div><div class="world-analog-clock" id="worldAnalogClock" aria-label="الساعة الآن">${ticks}${numbers}<span class="world-clock-center"></span></div></div>
    </section>
    <div class="world-dashboard-grid">
      <section class="world-clock-section"><header><div><h3>بلاد الطلاب</h3><p>احفظ المناطق التي تتعامل معها لتراها دائمًا مقارنة بالتوقيت الأساسي.</p></div><span class="world-section-badge">يتحدث تلقائيًا</span></header><div class="world-zone-add"><input id="worldZoneSearch" list="worldTimeZoneOptions" placeholder="ابحث باسم الدولة أو المدينة" autocomplete="off" oninput="worldZoneInputChanged(this)"><button type="button" onclick="addWorldClockZone()">＋ إضافة بلد</button></div><div class="world-search-hint" id="worldZoneSearchHint">إذا كانت الدولة متعددة التوقيت فاختر المدينة أو المنطقة المناسبة من القائمة.</div><datalist id="worldTimeZoneOptions"></datalist><div class="world-clock-cards" id="worldClockCards"></div></section>
      <section class="world-clock-section world-converter-section"><header><div><h3>تحويل موعد</h3><p>حدّد الموعد أولًا، ثم اختر التوقيتين وشاهد النتيجة بوضوح.</p></div><span class="world-section-badge">DST تلقائي</span></header><div class="world-convert-shell"><div class="world-convert-when"><div class="field"><label for="worldConvertDate">التاريخ</label><input id="worldConvertDate" type="date" onchange="convertWorldTime()"></div><div class="field"><label for="worldConvertTime">الساعة</label><input id="worldConvertTime" type="time" oninput="convertWorldTime()"></div></div><div class="world-convert-route"><div class="world-zone-picker"><div class="field"><label for="worldFromZone">من توقيت</label><input id="worldFromZone" list="worldTimeZoneOptions" autocomplete="off" oninput="worldZoneInputChanged(this)" onchange="convertWorldTime()"></div></div><button type="button" class="world-swap-zone" onclick="swapWorldConverter()" title="عكس الاتجاه" aria-label="عكس اتجاه التحويل">⇄</button><div class="world-zone-picker"><div class="field"><label for="worldToZone">إلى توقيت</label><input id="worldToZone" list="worldTimeZoneOptions" autocomplete="off" oninput="worldZoneInputChanged(this)" onchange="convertWorldTime()"></div></div></div><div class="world-convert-actions"><button type="button" onclick="convertWorldTime()">تحويل الموعد</button><button type="button" class="secondary" onclick="setWorldConverterNow()">الآن</button></div><div class="world-convert-result" id="worldConvertResult" aria-live="polite"></div></div></section>
    </div>
    <section class="world-clock-section world-timeline-section"><div class="world-timeline-head"><div><h3>مقارنة اليوم بصريًا</h3><p>كل عمود هو نفس اللحظة، والساعات معروضة بنظام 12 ساعة. اضغط أي ساعة لتجربتها في المحول.</p></div><div class="world-timeline-legend"><span><i></i>ليل</span><span class="work"><i></i>وقت مناسب</span><span class="evening"><i></i>مساء</span></div></div><div class="world-timeline-scroll"><div class="world-timeline" id="worldTimeline"></div></div><div class="world-timeline-note"><b>ملاحظة:</b> الألوان للمساعدة البصرية فقط؛ التحويل يعتمد على المنطقة الزمنية الحقيقية وتاريخ الموعد.</div></section>
  </div>`;
  const mount=document.getElementById("worldClockPageMount");if(!mount)return;mount.innerHTML=content;populateTimeZoneDatalist("worldTimeZoneOptions");
  const base=savedWorldClockBase();setTimeZoneInput(document.getElementById("worldBaseZone"),base);setTimeZoneInput(document.getElementById("worldFromZone"),base);const target=savedWorldClockZones().find(zone=>zone!==base)||SCHEDULE_TIMEZONE;setTimeZoneInput(document.getElementById("worldToZone"),validTimeZone(target)?target:base);
  const now=new Date();document.getElementById("worldConvertDate").value=dateKeyInZone(now,base);document.getElementById("worldConvertTime").value=timeKeyInZone(now,base);renderWorldClockCards();convertWorldTime();
  if(worldClockInterval)clearInterval(worldClockInterval);worldClockInterval=setInterval(renderWorldClockCards,30000);
}
'''
text=text[:start]+open_js+text[end:]

path.write_text(text,encoding='utf-8')

sw=Path('sw.js')
sw_text=sw.read_text(encoding='utf-8')
if 'mawaeidi-shell-v16' not in sw_text: raise SystemExit('expected PWA cache v16 not found')
sw.write_text(sw_text.replace('mawaeidi-shell-v16','mawaeidi-shell-v17',1),encoding='utf-8')
