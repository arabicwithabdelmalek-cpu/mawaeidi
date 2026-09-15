from pathlib import Path
import re

index = Path('index.html')
text = index.read_text(encoding='utf-8')
original = text

# Add small reusable helpers for flags and per-city analog clocks.
helper_anchor = re.compile(r'function worldHour12Label\(hour\)\{[^\n]+\}\n')
helpers = r'''function worldFlagEmoji(code){
  const value=String(code||"").toUpperCase();
  if(!/^[A-Z]{2}$/.test(value))return "🌐";
  return String.fromCodePoint(...[...value].map(char=>127397+char.charCodeAt(0)));
}
function worldMiniClockMarkup(date,zone,label=""){
  const parts=zonedParts(date,zone),minute=parts.minute+parts.second/60,hour=(parts.hour%12)+minute/60;
  const numbers=Array.from({length:12},(_,index)=>{
    const number=index+1,angle=number*30*Math.PI/180,x=50+38*Math.sin(angle),y=50-38*Math.cos(angle);
    return `<span class="world-mini-number" style="left:${x}%;top:${y}%">${number}</span>`;
  }).join("");
  return `<div class="world-mini-clock" style="--mini-hour:${hour*30}deg;--mini-minute:${minute*6}deg" role="img" aria-label="ساعة ${esc(label||timeZoneShortLabel(zone)||zone)}">${numbers}<i class="world-mini-center"></i></div>`;
}
'''
if 'function worldMiniClockMarkup(' not in text:
    match = helper_anchor.search(text)
    if not match:
        raise SystemExit('worldHour12Label anchor not found')
    text = text[:match.end()] + helpers + text[match.end():]

new_render = r'''function renderWorldClockCards(){
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
    const country=entry?.country||timeZoneShortLabel(zone)||zone,city=entry?.city&&normalizeZoneSearch(entry.city)!==normalizeZoneSearch(country)?entry.city:"",flag=worldFlagEmoji(entry?.code),clockLabel=city?`${country}، ${city}`:country;
    return `<article class="world-clock-card world-city-clock-card"><button type="button" class="world-remove" aria-label="إزالة ${esc(entry?.label||zone)}" onclick="removeWorldClockZone('${esc(zone)}')">×</button><div class="world-city-clock-layout">${worldMiniClockMarkup(now,zone,clockLabel)}<div class="world-city-clock-info"><div class="world-city-title"><span class="world-country-flag" aria-hidden="true">${flag}</span><div><strong>${esc(country)}</strong>${city?`<small>${esc(city)}</small>`:""}</div></div><div class="world-clock-time">${esc(formattedTimeInZone(now,zone))}</div><div class="world-clock-date">${esc(dateText)}</div><div class="world-city-clock-meta"><span class="world-zone-state ${state.className}">${esc(state.label)}</span><span class="world-offset-chip">${esc(worldOffsetText(now,zone,base))}</span></div></div></div></article>`;
  }).join(""):`<div class="world-clock-empty">أضف بلد الطالب أو مدينته، وسيظهر هنا بساعة مستقلة ووقت رقمي مقارنة بالتوقيت الأساسي.</div>`;
  renderWorldTimeline();
}
'''
pattern = re.compile(r'function renderWorldClockCards\(\)\{.*?\n\}\nfunction worldBaseInputChanged', re.S)
match = pattern.search(text)
if not match:
    raise SystemExit('renderWorldClockCards block not found')
text = text[:match.start()] + new_render + 'function worldBaseInputChanged' + text[match.end():]

css_marker = '/* WORLD CLOCK CITY CLOCKS + COLOR PASS V23 */'
css = r'''
/* WORLD CLOCK CITY CLOCKS + COLOR PASS V23 */
.world-clock-page{
  --world-navy:#174A67;
  --world-navy-deep:#10384F;
  --world-blue:#2E708C;
  --world-gold:#F2C75C;
  --world-surface:#FCFDFE;
  --world-border:#D8E3E9;
  --world-muted:#738694;
}
.world-clock-hero{background:linear-gradient(125deg,var(--world-navy-deep) 0%,var(--world-navy) 52%,var(--world-blue) 100%);border-color:rgba(255,255,255,.11);box-shadow:0 10px 26px rgba(16,56,79,.11)}
.world-clock-hero::after{opacity:.55}.world-hero-kicker::before{background:var(--world-gold);box-shadow:0 0 0 4px rgba(242,199,92,.13)}
.world-base-control{background:rgba(7,39,57,.13);border-color:rgba(255,255,255,.14)}
.world-clock-section{border-color:var(--world-border);background:var(--world-surface);box-shadow:0 5px 16px rgba(16,56,79,.035)}
.world-clock-section h3{color:var(--world-navy)}.world-clock-section p{color:var(--world-muted)}
.world-section-badge{background:#EEF4F7;color:#55778B}.world-zone-add button,.world-convert-actions button{background:var(--world-navy)}
.world-clock-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
.world-city-clock-card{padding:15px;border-color:#D7E2E8;border-radius:14px;background:linear-gradient(145deg,#FFFFFF 0%,#F7FAFB 100%);box-shadow:0 5px 14px rgba(20,65,90,.045)}
.world-city-clock-card:hover{transform:translateY(-2px);border-color:#BFD0DA;box-shadow:0 10px 24px rgba(20,65,90,.09)}
.world-city-clock-layout{display:grid;grid-template-columns:94px minmax(0,1fr);align-items:center;gap:15px;min-height:112px;direction:ltr}
.world-city-clock-info{min-width:0;text-align:right;direction:rtl}
.world-city-title{display:flex;align-items:center;justify-content:flex-start;gap:7px;padding-left:27px}.world-city-title>div{min-width:0}
.world-city-title strong{display:block;overflow:hidden;margin:0;color:#243745;font-size:13px;font-weight:900;line-height:1.45;text-overflow:ellipsis;white-space:nowrap}
.world-city-title small{display:block;margin-top:1px;color:#82919B;font-size:8px;line-height:1.4}
.world-country-flag{flex:0 0 auto;font-size:20px;line-height:1;filter:saturate(.9)}
.world-clock-date{margin-top:1px;color:#7B8B95;font-size:8px;line-height:1.6}
.world-city-clock-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:7px}
.world-offset-chip{display:inline-flex!important;align-items:center;min-height:23px;padding:3px 7px;border:1px solid #E0E8EC;border-radius:999px;background:#F4F7F9;color:#637987!important;font-size:8px!important;font-weight:800;white-space:nowrap}
.world-city-clock-card .world-clock-time{margin-top:6px;color:var(--world-navy);font-size:24px;line-height:1;font-weight:900}
.world-city-clock-card .world-zone-state{margin-top:0}
.world-mini-clock{--mini-hour:0deg;--mini-minute:0deg;position:relative;width:88px;height:88px;border:1px solid #D7E1E7;border-radius:50%;background:radial-gradient(circle at 50% 50%,#fff 0 64%,#F5F8FA 65% 100%);box-shadow:inset 0 0 0 4px rgba(23,74,103,.025),0 6px 16px rgba(20,65,90,.07);direction:ltr}
.world-mini-clock::before,.world-mini-clock::after{content:"";position:absolute;z-index:4;left:50%;bottom:50%;border-radius:999px;transform-origin:50% 100%}
.world-mini-clock::before{width:3px;height:27%;background:#2D3E49;transform:translateX(-50%) rotate(var(--mini-hour));box-shadow:0 1px 2px rgba(0,0,0,.08)}
.world-mini-clock::after{width:2px;height:36%;background:#D4A93F;transform:translateX(-50%) rotate(var(--mini-minute));box-shadow:0 1px 2px rgba(212,169,63,.2)}
.world-mini-center{position:absolute;z-index:6;left:50%;top:50%;width:7px;height:7px;border:2px solid #fff;border-radius:50%;background:#D4A93F;transform:translate(-50%,-50%);box-shadow:0 1px 3px rgba(0,0,0,.18)}
.world-mini-number{position:absolute;z-index:2;color:#66737B;font-family:Arial,sans-serif;font-size:7px;font-weight:700;line-height:1;transform:translate(-50%,-50%)}
.world-remove{top:8px;left:8px;color:#8A9AA4}.world-remove:hover{background:#FFF3F1}
.world-timeline-section{border-color:#D6E2E8;background:linear-gradient(180deg,#FFFFFF 0%,#F8FAFB 100%)}
.world-timeline-label{background:#F1F5F7}.world-hour-cell{background:#EEF2F4;color:#74838D}.world-hour-cell.work{background:#DFF1E5;color:#486F52}.world-hour-cell.evening{background:#FCECCF;color:#896528}.world-hour-cell.night{background:#ECEFF4;color:#676E83}
.world-hour-cell.selected{background:var(--world-gold)!important;color:#493C1F!important;box-shadow:0 0 0 2px rgba(212,169,63,.35);transform:scale(1.04)}
.world-converter-section{background:linear-gradient(180deg,#FFFFFF,#F9FBFC)}.world-convert-result{border-color:#D5E1E7;background:linear-gradient(135deg,#F3F8FA,#EDF3F6)}
@media(max-width:900px){.world-clock-cards{grid-template-columns:1fr}.world-city-clock-layout{grid-template-columns:90px minmax(0,1fr)}}
@media(max-width:520px){.world-city-clock-card{padding:13px}.world-city-clock-layout{grid-template-columns:78px minmax(0,1fr);gap:11px}.world-mini-clock{width:74px;height:74px}.world-mini-number{font-size:6px}.world-city-clock-card .world-clock-time{font-size:22px}.world-country-flag{font-size:18px}}
'''
if css_marker not in text:
    style_close = text.find('</style>')
    if style_close < 0:
        raise SystemExit('style close not found')
    text = text[:style_close] + css + '\n' + text[style_close:]

if text == original:
    raise SystemExit('No changes made')
index.write_text(text, encoding='utf-8')

sw = Path('sw.js')
sw_text = sw.read_text(encoding='utf-8')
sw_text = re.sub(r'mawaeidi-shell-v\d+', 'mawaeidi-shell-v23', sw_text, count=1)
sw.write_text(sw_text, encoding='utf-8')
