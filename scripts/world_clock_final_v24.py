from pathlib import Path
import re

index = Path('index.html')
text = index.read_text(encoding='utf-8')
original = text

# 1) Remove the persistent explanatory sentence under the base timezone.
text = text.replace(
    '<div class="world-base-hint" id="worldBaseHint">مصر هي الافتراضي · التغيير هنا لا يغيّر توقيت جدول حصصك.</div>',
    '<div class="world-base-hint" id="worldBaseHint"></div>'
)
text = text.replace(
    'setTimeZoneInput(input,result.entry.zone);if(hint)hint.textContent="يؤثر هذا الاختيار على الساعة العالمية والمقارنة فقط؛ جدول الحصص يظل بتوقيت مصر.";',
    'setTimeZoneInput(input,result.entry.zone);if(hint)hint.textContent="";'
)

# 2) Timeline axis should be an axis, not a duplicate Egypt row.
old_header = 'const header=`<div class="world-timeline-row world-timeline-axis"><div class="world-timeline-label"><strong>${esc(baseLabel)}</strong><small>التوقيت الأساسي · ${esc(baseDate)}</small></div>${Array.from({length:24},(_,hour)=>`<button type="button" class="world-hour-cell" tabindex="-1">${esc(worldHour12Label(hour))}</button>`).join("")}</div>`;'
new_header = 'const header=`<div class="world-timeline-row world-timeline-axis"><div class="world-timeline-label"><strong>الوقت</strong><small>نظام 12 ساعة</small></div>${Array.from({length:24},(_,hour)=>`<button type="button" class="world-hour-cell" tabindex="-1">${esc(worldHour12Label(hour))}</button>`).join("")}</div>`;'
if old_header not in text:
    raise SystemExit('Timeline header anchor not found')
text = text.replace(old_header, new_header, 1)

# 3) Arabic city labels + real flag images (emoji fallback).
helper_anchor = 'function worldFlagEmoji(code){\n'
if helper_anchor not in text:
    raise SystemExit('Flag helper anchor not found')
helpers = '''const WORLD_CITY_ARABIC={
  "Cairo":"القاهرة","Baku":"باكو","Bishkek":"بيشكك","Tashkent":"طشقند","Moscow":"موسكو","Istanbul":"إسطنبول","Riyadh":"الرياض","Dubai":"دبي","Doha":"الدوحة","Kuwait":"الكويت","Amman":"عمّان","Beirut":"بيروت","Damascus":"دمشق","Baghdad":"بغداد","Jerusalem":"القدس","Gaza":"غزة","London":"لندن","Paris":"باريس","Berlin":"برلين","Rome":"روما","Madrid":"مدريد","New York":"نيويورك","Los Angeles":"لوس أنجلوس","Toronto":"تورونتو","Vancouver":"فانكوفر","Almaty":"ألماتي","Astana":"أستانا","Dushanbe":"دوشنبه","Ashgabat":"عشق آباد","Kabul":"كابل","Karachi":"كراتشي","Dhaka":"دكا","Jakarta":"جاكرتا","Tokyo":"طوكيو","Seoul":"سيول","Beijing":"بكين","Shanghai":"شنغهاي","Kuala Lumpur":"كوالالمبور","Singapore":"سنغافورة","Sydney":"سيدني","Melbourne":"ملبورن"
};
function worldCityArabicName(city,zone=""){
  const raw=String(city||"").trim(),fallback=(String(zone||"").split("/").at(-1)||"").replace(/_/g," ");
  return WORLD_CITY_ARABIC[raw]||WORLD_CITY_ARABIC[fallback]||raw||fallback;
}
function worldFlagMarkup(code,country=""){
  const value=String(code||"").toUpperCase();
  if(!/^[A-Z]{2}$/.test(value))return '<span class="world-flag-fallback">🌐</span>';
  const lower=value.toLowerCase(),label=country?`علم ${country}`:"علم الدولة";
  return `<img class="world-country-flag-img" src="https://flagcdn.com/32x24/${lower}.png" srcset="https://flagcdn.com/64x48/${lower}.png 2x" width="24" height="18" alt="${esc(label)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="world-flag-fallback" hidden>🌐</span>`;
}
'''
text = text.replace(helper_anchor, helpers + helper_anchor, 1)

old_card_line = 'const country=entry?.country||timeZoneShortLabel(zone)||zone,city=entry?.city&&normalizeZoneSearch(entry.city)!==normalizeZoneSearch(country)?entry.city:"",flag=worldFlagEmoji(entry?.code),clockLabel=city?`${country}، ${city}`:country;'
new_card_line = 'const country=entry?.country||timeZoneShortLabel(zone)||zone,rawCity=entry?.city&&normalizeZoneSearch(entry.city)!==normalizeZoneSearch(country)?entry.city:"",city=worldCityArabicName(rawCity,zone),flag=worldFlagMarkup(entry?.code,country),clockLabel=city?`${country}، ${city}`:country;'
if old_card_line not in text:
    raise SystemExit('City card data anchor not found')
text = text.replace(old_card_line, new_card_line, 1)

old_flag_markup = '<span class="world-country-flag" aria-hidden="true">${flag}</span>'
new_flag_markup = '<span class="world-country-flag">${flag}</span>'
if old_flag_markup not in text:
    raise SystemExit('Country flag markup anchor not found')
text = text.replace(old_flag_markup, new_flag_markup, 1)

# 4) Final visual polish after all earlier world-clock styles.
v24_css = r'''
<style id="world-clock-final-v24">
/* World clock final polish v24 */
.world-clock-page{
  --world-navy:#1B4E66;
  --world-navy-deep:#12394D;
  --world-blue:#2B6B80;
  --world-gold:#DDB04A;
  --world-surface:#FCFDFD;
  --world-border:#D6E1E6;
  --world-muted:#6F818C;
}
.world-clock-hero-v2{
  background:linear-gradient(125deg,#12394D 0%,#1A5169 54%,#2D7085 100%)!important;
  border-color:rgba(255,255,255,.10)!important;
  box-shadow:0 8px 20px rgba(18,57,77,.10)!important;
}
.world-clock-hero-v2::after{opacity:.34!important}
.world-hero-content-v2{
  grid-template-columns:minmax(0,640px) 330px!important;
  justify-content:space-between!important;
  gap:42px!important;
  width:100%!important;
  max-width:1160px!important;
  min-height:182px!important;
  margin-inline:auto!important;
  padding:20px 26px!important;
}
.world-hero-copy-v2{max-width:620px!important}
.world-hero-copy-v2 h3{font-size:26px!important;margin-top:10px!important}
.world-hero-copy-v2>p{color:rgba(255,255,255,.76)!important;max-width:590px!important}
.world-hero-kicker{background:rgba(255,255,255,.075)!important;border-color:rgba(255,255,255,.16)!important}
.world-hero-kicker::before{background:var(--world-gold)!important;box-shadow:0 0 0 4px rgba(221,176,74,.13)!important}
.world-base-change{background:rgba(255,255,255,.075)!important;border-color:rgba(255,255,255,.16)!important}
.world-base-change:hover{background:rgba(255,255,255,.13)!important}
.world-base-control-v2{background:rgba(255,255,255,.065)!important;border-color:rgba(255,255,255,.15)!important;margin-top:12px!important}
.world-base-control-v2 input{background:rgba(255,255,255,.085)!important;border-color:rgba(255,255,255,.16)!important}
.world-base-hint:empty{display:none!important}
.world-hero-now{min-width:320px!important;gap:16px!important}
.world-hero-now .world-analog-clock{width:120px!important;height:120px!important;flex-basis:120px!important;border-color:rgba(255,255,255,.27)!important;box-shadow:inset 0 0 0 5px rgba(255,255,255,.025),inset 0 0 20px rgba(255,255,255,.025),0 7px 16px rgba(4,29,44,.12)!important}
.world-hero-now .world-home-time{font-size:36px!important}
.world-now-label,.world-home-meta{color:rgba(255,255,255,.70)!important}
.world-clock-center{background:var(--world-gold)!important}
.world-analog-clock::after{background:var(--world-gold)!important}

.world-clock-section{background:var(--world-surface)!important;border-color:var(--world-border)!important;box-shadow:0 4px 12px rgba(18,57,77,.035)!important}
.world-clock-section h3{color:var(--world-navy)!important}
.world-clock-section p{color:var(--world-muted)!important}
.world-section-badge{background:#EFF4F6!important;color:#587184!important}
.world-zone-add button,.world-convert-actions button{background:var(--world-navy)!important}
.world-zone-add button:hover,.world-convert-actions button:hover{background:#153F54!important}

.world-timeline-featured{border-color:#D3DFE5!important;background:linear-gradient(180deg,#FFFFFF 0%,#FAFCFD 100%)!important;box-shadow:0 6px 18px rgba(18,57,77,.045)!important}
.world-timeline-featured::before{background:linear-gradient(90deg,transparent,#2A657A 30%,#2A657A 70%,transparent)!important;opacity:.27!important}
.world-timeline-label{background:#F2F5F7!important}
.world-timeline-label strong{color:#425E6E!important}
.world-timeline-label small{color:#8997A0!important}
.world-hour-cell{background:#EEF2F4!important;color:#73828C!important}
.world-hour-cell.work{background:#E4F0E7!important;color:#4C7156!important}
.world-hour-cell.evening{background:#F4E7CD!important;color:#866326!important}
.world-hour-cell.night{background:#EDF0F4!important;color:#686F82!important}
.world-hour-cell.selected{background:var(--world-gold)!important;color:#3F3420!important;box-shadow:0 0 0 2px rgba(190,145,47,.25)!important;transform:scale(1.035)!important}
.world-timeline-legend i{background:#EDF0F4!important}.world-timeline-legend .work i{background:#E4F0E7!important}.world-timeline-legend .evening i{background:#F4E7CD!important}

.world-city-clock-card{border-color:#D8E2E7!important;background:linear-gradient(145deg,#FFFFFF 0%,#F8FAFB 100%)!important;box-shadow:0 4px 12px rgba(18,57,77,.04)!important}
.world-city-clock-card:hover{border-color:#C1D1DA!important;box-shadow:0 8px 18px rgba(18,57,77,.075)!important}
.world-city-title strong{color:#243A47!important}
.world-city-title small,.world-clock-date{color:#80909A!important}
.world-city-clock-card .world-clock-time{color:var(--world-navy)!important}
.world-offset-chip{border-color:#DFE7EB!important;background:#F3F6F8!important;color:#627783!important}
.world-mini-clock{border-color:#D8E2E7!important;background:radial-gradient(circle at 50% 50%,#FFFFFF 0 64%,#F6F8F9 65% 100%)!important;box-shadow:inset 0 0 0 4px rgba(27,78,102,.02),0 5px 12px rgba(18,57,77,.055)!important}
.world-mini-clock::after{background:#C99B34!important}
.world-mini-center{background:#DDB04A!important}
.world-country-flag{display:inline-flex;align-items:center;justify-content:center;width:26px;min-width:26px;height:20px;overflow:hidden;border:1px solid #DDE5E9;border-radius:4px;background:#fff;box-shadow:0 1px 3px rgba(18,57,77,.06);filter:none!important}
.world-country-flag-img{display:block;width:24px;height:18px;object-fit:cover;border-radius:3px}
.world-flag-fallback{display:inline-flex;align-items:center;justify-content:center;width:24px;height:18px;font-size:14px;line-height:1}
.world-flag-fallback[hidden]{display:none!important}

.world-converter-section{background:#FCFDFD!important}
.world-convert-when{background:#F7F9FA!important;border-color:#DDE5E9!important}
.world-zone-picker{border-color:#DCE5E9!important}
.world-convert-result{border-color:#D6E1E6!important;background:linear-gradient(135deg,#F4F8FA,#EEF3F5)!important}
.world-result-time-card{background:rgba(255,255,255,.82)!important}

@media(max-width:1000px){
  .world-hero-content-v2{max-width:none!important;grid-template-columns:minmax(0,1fr) 300px!important;gap:24px!important;padding:20px 24px!important}
  .world-hero-now{min-width:300px!important}
}
@media(max-width:760px){
  .world-hero-content-v2{grid-template-columns:1fr!important;gap:15px!important;min-height:0!important;padding:17px!important}
  .world-hero-now{min-width:0!important}
  .world-hero-now .world-analog-clock{width:100px!important;height:100px!important;flex-basis:auto!important}
  .world-hero-now .world-home-time{font-size:30px!important}
}
</style>
'''
if 'id="world-clock-final-v24"' not in text:
    if '</head>' not in text:
        raise SystemExit('head close tag not found')
    text = text.replace('</head>', v24_css + '\n</head>', 1)

if text == original:
    raise SystemExit('No index.html changes made')

index.write_text(text, encoding='utf-8')

sw = Path('sw.js')
sw_text = sw.read_text(encoding='utf-8')
if 'mawaeidi-shell-v23' not in sw_text:
    raise SystemExit('Expected v23 cache not found')
sw.write_text(sw_text.replace('mawaeidi-shell-v23','mawaeidi-shell-v24',1), encoding='utf-8')
