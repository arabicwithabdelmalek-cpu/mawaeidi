from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')

# 1) Remove world clock from tools menu.
menu_block = '''            <button type="button" class="data-action" onclick="openWorldClock()">
              <strong>الساعة العالمية</strong>
              <small>اعرف وقت الطالب وحوّل المواعيد بين الدول</small>
            </button>
            <div class="data-separator" aria-hidden="true"></div>
'''
if menu_block not in text:
    raise SystemExit('world clock tools menu block not found')
text = text.replace(menu_block, '', 1)

# 2) Promote world clock to the main workspace navigation, in the requested order.
old_nav = '''    <nav class="workspace-switch" aria-label="أقسام مواعيدي">
      <button type="button" id="scheduleSectionButton" class="active" aria-pressed="true" aria-controls="scheduleWorkspace" onclick="setSection('schedule',this)">المواعيد</button>
      <button type="button" id="financeSectionButton" aria-pressed="false" aria-controls="financeView" onclick="setSection('finance',this)">المالية</button>
    </nav>
'''
new_nav = '''    <nav class="workspace-switch" aria-label="أقسام مواعيدي">
      <button type="button" id="scheduleSectionButton" class="active" aria-pressed="true" aria-controls="scheduleWorkspace" onclick="setSection('schedule',this)">المواعيد</button>
      <button type="button" id="worldClockSectionButton" aria-pressed="false" aria-controls="worldClockView" onclick="setSection('world',this)">الساعة العالمية</button>
      <button type="button" id="financeSectionButton" aria-pressed="false" aria-controls="financeView" onclick="setSection('finance',this)">المالية</button>
    </nav>
'''
if old_nav not in text:
    raise SystemExit('workspace navigation block not found')
text = text.replace(old_nav, new_nav, 1)

# 3) Add a dedicated world clock workspace between schedule and finance.
marker = '''    <section id="financeView" class="finance-view" aria-labelledby="financeHeading" hidden>'''
world_section = '''    <section id="worldClockView" class="world-clock-page" aria-label="الساعة العالمية" hidden>
      <div id="worldClockPageMount"></div>
    </section>

'''
if marker not in text:
    raise SystemExit('finance view marker not found')
text = text.replace(marker, world_section + marker, 1)

# 4) Add page-specific spacing without changing the clock dashboard design itself.
css_marker = '.backdrop{position:fixed;'
page_css = '''.world-clock-page{padding:22px 0 34px}.world-clock-page[hidden]{display:none!important}.world-clock-page .world-clock-tool{width:100%;max-width:none;margin:0}.world-clock-page .world-clock-dashboard{margin:0}\n\n'''
if css_marker not in text:
    raise SystemExit('CSS insertion marker not found')
text = text.replace(css_marker, page_css + css_marker, 1)

# 5) Turn section switching into a 3-way navigation.
start = text.find('function handlePrimaryAction(){')
end = text.find('function changeFinanceMonth(', start)
if start < 0 or end < 0:
    raise SystemExit('section chrome functions not found')
section_js = '''function handlePrimaryAction(){
  if(currentSection==="finance")openFinancePayment();
  else if(currentSection==="schedule")openNew();
}
function updateSectionChrome(){
  document.getElementById("scheduleWorkspace").hidden=currentSection!=="schedule";
  document.getElementById("worldClockView").hidden=currentSection!=="world";
  document.getElementById("financeView").hidden=currentSection!=="finance";
  document.querySelectorAll(".workspace-switch button").forEach(item=>{
    const active=(currentSection==="schedule"&&item.id==="scheduleSectionButton")||(currentSection==="world"&&item.id==="worldClockSectionButton")||(currentSection==="finance"&&item.id==="financeSectionButton");
    item.classList.toggle("active",active);item.setAttribute("aria-pressed",String(active));
  });
  const primary=document.getElementById("primaryActionButton");
  primary.hidden=currentSection==="world";
  if(currentSection!=="world")primary.textContent=currentSection==="finance"?"＋ تسجيل دفعة":"＋ إضافة حصة";
  if(currentSection!=="world"&&worldClockInterval){clearInterval(worldClockInterval);worldClockInterval=null}
}
function setSection(section,button){
  currentSection=["schedule","world","finance"].includes(section)?section:"schedule";
  updateSectionChrome();
  if(currentSection==="finance")renderFinance();
  if(currentSection==="world")openWorldClock();
}
'''
text = text[:start] + section_js + text[end:]

# 6) Reuse the existing world clock dashboard, but mount it in its workspace instead of a modal.
fn_start = text.find('function openWorldClock(){')
fn_end = text.find('function lessonTimeZoneInputChanged()', fn_start)
if fn_start < 0 or fn_end < 0:
    raise SystemExit('openWorldClock function not found')
old_fn = text[fn_start:fn_end]
old_fn = old_fn.replace('function openWorldClock(){\n  closeDataMenu();', 'function openWorldClock(){\n  closeDataMenu();\n  currentSection="world";updateSectionChrome();', 1)
needle = 'openToolDialog("الساعة العالمية","المواعيد محسوبة بالمناطق الزمنية الحقيقية، وليس بفرق ساعات ثابت.",content);populateTimeZoneDatalist("worldTimeZoneOptions");'
replacement = 'const mount=document.getElementById("worldClockPageMount");if(!mount)return;mount.innerHTML=content;populateTimeZoneDatalist("worldTimeZoneOptions");'
if needle not in old_fn:
    raise SystemExit('world clock modal mount call not found')
old_fn = old_fn.replace(needle, replacement, 1)
text = text[:fn_start] + old_fn + text[fn_end:]

# Keep mobile spacing compact.
mobile_marker = '  .world-convert-grid{grid-template-columns:1fr}'
if mobile_marker in text:
    text = text.replace(mobile_marker, '  .world-clock-page{padding:14px 0 26px}\n  ' + mobile_marker, 1)

path.write_text(text, encoding='utf-8')

sw = Path('sw.js')
sw_text = sw.read_text(encoding='utf-8')
if 'mawaeidi-shell-v15' not in sw_text:
    raise SystemExit('expected PWA cache v15 not found')
sw.write_text(sw_text.replace('mawaeidi-shell-v15', 'mawaeidi-shell-v16', 1), encoding='utf-8')
