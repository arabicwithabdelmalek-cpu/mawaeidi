from pathlib import Path
import re

index = Path('index.html')
text = index.read_text(encoding='utf-8')

start = text.find('  const content=`<div class="world-clock-tool">')
end = text.find('  const mount=document.getElementById("worldClockPageMount")', start)
if start == -1 or end == -1:
    raise SystemExit('Could not locate world clock content block')

new_content = r'''  const content=`<div class="world-clock-tool world-clock-tool-v2">
    <section class="world-clock-hero world-clock-hero-v2">
      <div class="world-hero-content world-hero-content-v2">
        <div class="world-hero-copy world-hero-copy-v2">
          <div class="world-hero-topline"><span class="world-hero-kicker" id="worldHeroKicker">التوقيت الأساسي · مصر</span><button type="button" class="world-base-change" onclick="document.getElementById('worldBaseZone')?.focus()">تغيير</button></div>
          <h3>الساعة العالمية</h3>
          <p>اعرف وقت طلابك، وقارن بين البلدان، وحوّل مواعيد الدروس بدون حساب فرق الساعات يدويًا.</p>
          <div class="world-base-control world-base-control-v2"><label for="worldBaseZone">التوقيت الأساسي</label><input id="worldBaseZone" list="worldTimeZoneOptions" autocomplete="off" placeholder="مصر — القاهرة" oninput="worldBaseInputChanged(this)" onchange="changeWorldClockBase()"><div class="world-base-hint" id="worldBaseHint">مصر هي الافتراضي · التغيير هنا لا يغيّر توقيت جدول حصصك.</div></div>
        </div>
        <div class="world-hero-now">
          <div class="world-analog-clock" id="worldAnalogClock" aria-label="الساعة الآن">${ticks}${numbers}<span class="world-clock-center"></span></div>
          <div class="world-now-copy"><span class="world-now-label">الوقت الآن</span><div class="world-home-time" id="worldHomeTime">—</div><div class="world-home-meta" id="worldHomeMeta">—</div></div>
        </div>
      </div>
    </section>

    <section class="world-clock-section world-timeline-section world-timeline-featured">
      <div class="world-timeline-head"><div><div class="world-timeline-title-row"><span class="world-feature-tag">نظرة سريعة</span><h3>مقارنة اليوم بصريًا</h3></div><p>شاهد نفس اللحظة عند كل بلد بنظام 12 ساعة، واضغط أي ساعة لاستخدامها مباشرة في المحول.</p></div><div class="world-timeline-tools"><span class="world-format-badge">12 ساعة</span><div class="world-timeline-legend"><span><i></i>ليل</span><span class="work"><i></i>وقت مناسب</span><span class="evening"><i></i>مساء</span></div></div></div>
      <div class="world-timeline-scroll"><div class="world-timeline" id="worldTimeline"></div></div>
      <div class="world-timeline-note"><b>ملاحظة:</b> الألوان للمساعدة البصرية فقط؛ التحويل يعتمد على المنطقة الزمنية الحقيقية وتاريخ الموعد.</div>
    </section>

    <div class="world-dashboard-grid world-dashboard-grid-v2">
      <section class="world-clock-section"><header><div><h3>بلاد الطلاب</h3><p>احفظ المناطق التي تتعامل معها لتراها دائمًا مقارنة بالتوقيت الأساسي.</p></div><span class="world-section-badge">يتحدث تلقائيًا</span></header><div class="world-zone-add"><input id="worldZoneSearch" list="worldTimeZoneOptions" placeholder="ابحث باسم الدولة أو المدينة" autocomplete="off" oninput="worldZoneInputChanged(this)"><button type="button" onclick="addWorldClockZone()">＋ إضافة بلد</button></div><div class="world-search-hint" id="worldZoneSearchHint">إذا كانت الدولة متعددة التوقيت فاختر المدينة أو المنطقة المناسبة من القائمة.</div><datalist id="worldTimeZoneOptions"></datalist><div class="world-clock-cards" id="worldClockCards"></div></section>
      <section class="world-clock-section world-converter-section"><header><div><h3>تحويل موعد</h3><p>حدّد الموعد أولًا، ثم اختر التوقيتين وشاهد النتيجة بوضوح.</p></div><span class="world-section-badge">DST تلقائي</span></header><div class="world-convert-shell"><div class="world-convert-when"><div class="field"><label for="worldConvertDate">التاريخ</label><input id="worldConvertDate" type="date" onchange="convertWorldTime()"></div><div class="field"><label for="worldConvertTime">الساعة</label><input id="worldConvertTime" type="time" oninput="convertWorldTime()"></div></div><div class="world-convert-route"><div class="world-zone-picker"><div class="field"><label for="worldFromZone">من توقيت</label><input id="worldFromZone" list="worldTimeZoneOptions" autocomplete="off" oninput="worldZoneInputChanged(this)" onchange="convertWorldTime()"></div></div><button type="button" class="world-swap-zone" onclick="swapWorldConverter()" title="عكس الاتجاه" aria-label="عكس اتجاه التحويل">⇄</button><div class="world-zone-picker"><div class="field"><label for="worldToZone">إلى توقيت</label><input id="worldToZone" list="worldTimeZoneOptions" autocomplete="off" oninput="worldZoneInputChanged(this)" onchange="convertWorldTime()"></div></div></div><div class="world-convert-actions"><button type="button" onclick="convertWorldTime()">تحويل الموعد</button><button type="button" class="secondary" onclick="setWorldConverterNow()">الآن</button></div><div class="world-convert-result" id="worldConvertResult" aria-live="polite"></div></div></section>
    </div>
  </div>`;
'''
text = text[:start] + new_content + text[end:]

# Remove any old world map markup/CSS artifacts that may remain from previous iterations.
text = re.sub(r'<div class="world-map-(?:watermark|art)"[^>]*>.*?</div>', '', text, flags=re.S)

css = r'''
<style id="world-clock-hybrid-v22">
/* World clock hybrid: premium hero + timeline-first utility */
.world-clock-tool-v2{gap:14px}
.world-clock-hero-v2{min-height:0!important;border-radius:18px;box-shadow:0 10px 28px rgba(22,61,84,.10);background:linear-gradient(125deg,#163F58 0%,#1E5670 48%,#347F97 100%)}
.world-clock-hero-v2::after{content:"";position:absolute!important;inset:auto -92px -150px auto!important;width:320px!important;height:320px!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:50%!important;box-shadow:0 0 0 42px rgba(255,255,255,.012),0 0 0 84px rgba(255,255,255,.009)!important;opacity:.75;pointer-events:none}
.world-map-watermark,.world-map-art{display:none!important}
.world-hero-content-v2{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;justify-content:space-between!important;align-items:center!important;gap:36px!important;min-height:196px!important;padding:24px 30px!important}
.world-hero-copy-v2{max-width:700px!important}
.world-hero-topline{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.world-base-change{min-height:28px;padding:4px 10px;border:1px solid rgba(255,255,255,.17);border-radius:999px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.88);font:inherit;font-size:9px;font-weight:800;cursor:pointer}
.world-base-change:hover{background:rgba(255,255,255,.13)}
.world-hero-copy-v2 h3{margin:12px 0 4px!important;font-size:27px!important;line-height:1.25!important}
.world-hero-copy-v2>p{max-width:610px!important;font-size:11px!important;line-height:1.8!important}
.world-base-control-v2{grid-template-columns:auto minmax(230px,340px)!important;margin-top:14px!important;padding:6px 7px!important;border-radius:10px!important;background:rgba(5,31,45,.16)!important}
.world-base-control-v2 input{height:34px!important}
.world-base-control-v2 .world-base-hint{font-size:7.8px!important;opacity:.9}
.world-hero-now{position:relative;z-index:2;display:flex;align-items:center;gap:20px;min-width:340px;padding:10px 0}
.world-hero-now .world-analog-clock{width:132px!important;height:132px!important;flex:0 0 132px;margin:0!important;box-shadow:inset 0 0 0 6px rgba(255,255,255,.025),inset 0 0 24px rgba(255,255,255,.03),0 8px 18px rgba(4,29,44,.13)!important}
.world-now-copy{min-width:150px;text-align:right}
.world-now-label{display:inline-flex;margin-bottom:3px;color:rgba(255,255,255,.62);font-size:9px;font-weight:800}
.world-hero-now .world-home-time{margin:0!important;font-size:38px!important;line-height:1.1!important;white-space:nowrap}
.world-hero-now .world-home-meta{margin-top:6px!important;font-size:9px!important;line-height:1.65!important}

.world-timeline-featured{position:relative;padding:18px 18px 15px!important;border-color:#C9D9E2!important;background:linear-gradient(180deg,#FFFFFF 0%,#F7FAFB 100%)!important;box-shadow:0 8px 24px rgba(24,64,87,.055)!important}
.world-timeline-featured::before{content:"";position:absolute;top:0;right:18px;left:18px;height:3px;border-radius:0 0 6px 6px;background:linear-gradient(90deg,transparent,#2C6F8B 30%,#2C6F8B 70%,transparent);opacity:.38}
.world-timeline-title-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.world-timeline-title-row h3{font-size:16px!important}
.world-feature-tag,.world-format-badge{display:inline-flex;align-items:center;min-height:25px;padding:4px 8px;border-radius:999px;font-size:8px;font-weight:900;white-space:nowrap}
.world-feature-tag{background:#EAF2F6;color:#466C82}.world-format-badge{background:#173F58;color:#fff}
.world-timeline-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-start}
.world-timeline-head{align-items:center!important;margin-bottom:13px!important}
.world-timeline-featured .world-timeline{min-width:1050px}
.world-timeline-featured .world-timeline-label{padding:7px 9px;background:#F0F5F7}
.world-timeline-featured .world-timeline-label strong{font-size:9.5px}
.world-timeline-featured .world-hour-cell{height:36px;border-radius:6px;font-size:8.5px}
.world-timeline-featured .world-timeline-axis .world-hour-cell{height:27px}
.world-dashboard-grid-v2{gap:14px;margin-top:0}

@media(max-width:1000px){
  .world-hero-content-v2{grid-template-columns:minmax(0,1fr) 300px!important;gap:22px!important}
  .world-hero-now{min-width:300px;gap:14px}
  .world-hero-now .world-analog-clock{width:118px!important;height:118px!important;flex-basis:118px}
  .world-hero-now .world-home-time{font-size:34px!important}
}
@media(max-width:760px){
  .world-clock-tool-v2{gap:12px}
  .world-hero-content-v2{grid-template-columns:1fr!important;gap:16px!important;padding:18px!important}
  .world-hero-copy-v2 h3{font-size:23px!important}
  .world-base-control-v2{grid-template-columns:1fr!important;width:100%!important;max-width:none!important}
  .world-hero-now{display:grid;grid-template-columns:108px minmax(0,1fr);align-items:center;gap:14px;min-width:0;width:100%;padding-top:4px;border-top:1px solid rgba(255,255,255,.12)}
  .world-hero-now .world-analog-clock{display:block!important;width:104px!important;height:104px!important;flex-basis:auto;margin:10px 0 0!important}
  .world-now-copy{min-width:0}
  .world-hero-now .world-home-time{font-size:31px!important}
  .world-timeline-featured{padding:15px 13px 12px!important}
  .world-timeline-head{align-items:flex-start!important;flex-direction:column!important}
  .world-timeline-tools{width:100%;justify-content:space-between}
  .world-timeline-row{grid-template-columns:105px repeat(24,minmax(34px,1fr))!important}
}
</style>
'''
if 'id="world-clock-hybrid-v22"' in text:
    text = re.sub(r'<style id="world-clock-hybrid-v22">.*?</style>\s*', '', text, flags=re.S)
text = text.replace('</head>', css + '\n</head>', 1)
index.write_text(text, encoding='utf-8')

sw = Path('sw.js')
sw_text = sw.read_text(encoding='utf-8')
sw_text = re.sub(r'mawaeidi-shell-v\d+', 'mawaeidi-shell-v22', sw_text, count=1)
sw_text = sw_text.replace('  "./icons/world-map.svg",\n', '')
sw.write_text(sw_text, encoding='utf-8')

map_file = Path('icons/world-map.svg')
if map_file.exists():
    map_file.unlink()
