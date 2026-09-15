from pathlib import Path
import re

index = Path('index.html')
text = index.read_text(encoding='utf-8')

if 'finance-fix-v30' in text:
    raise SystemExit('finance v30 fix already present')
if 'finance-simple-v29' not in text:
    raise SystemExit('finance v29 not found')

# 1) Add a completely separate current-dues section, independent from the selected month.
summary_marker = '''      <section class="fin29-summary-shell" aria-labelledby="financeSimpleSummaryHeading">'''
ready_section = '''      <section class="fin29-ready-shell" aria-labelledby="financeSimpleReadyHeading">
        <div class="fin29-section-head">
          <div>
            <span>الوضع الحالي</span>
            <h3 id="financeSimpleReadyHeading">جاهز للقبض الآن</h3>
          </div>
          <span class="fin29-ready-count" id="financeSimpleReadyCount">—</span>
        </div>
        <div class="fin30-ready-list" id="financeSimpleReadyList"></div>
      </section>

'''
if summary_marker not in text:
    raise SystemExit('summary section marker not found')
text = text.replace(summary_marker, ready_section + summary_marker, 1)

# Remove the ready count from the monthly summary header so the month report stays month-only.
text = text.replace('          <span class="fin29-ready-count" id="financeSimpleReadyCount">—</span>\n', '', 1)

# 2) Visual styling for the isolated ready-to-collect area.
css = r'''
<style id="finance-fix-v30">
/* Finance v30 — keep selected-month data separate from current collection status */
.fin29-ready-shell{overflow:hidden;border:1px solid #E4D5B4;border-radius:12px;background:#FFFCF7;box-shadow:0 5px 16px rgba(87,65,25,.045)}
.fin29-ready-shell .fin29-section-head{background:#FFF9ED;border-bottom-color:#EEDFC1}
.fin30-ready-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;padding:12px;background:#FFFCF7}
.fin30-ready-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 13px;border:1px solid #E8D9B9;border-radius:10px;background:#fff}
.fin30-ready-copy{min-width:0}.fin30-ready-copy small{display:block;color:#8A7449;font-size:7.5px;font-weight:800}.fin30-ready-copy strong{display:block;margin-top:2px;color:#2A4150;font-size:12px;font-weight:900}.fin30-ready-copy span{display:block;margin-top:3px;color:#75633C;font-size:8px;font-weight:800}
.fin30-ready-money{display:flex;align-items:center;gap:9px;flex:0 0 auto}.fin30-ready-money strong{color:#6E5320;font-size:12px;font-weight:900;direction:ltr}.fin30-ready-money button{min-height:32px;padding:6px 9px;border:1px solid #B98B38;border-radius:8px;background:#B98B38;color:#fff;font:inherit;font-size:8px;font-weight:900;cursor:pointer}
.fin30-ready-empty{grid-column:1/-1;padding:17px 12px;text-align:center;color:#8A7A59;font-size:9px}.fin30-ready-empty strong{display:block;margin-bottom:2px;color:#6E6044;font-size:10px}
@media(max-width:850px){.fin30-ready-list{grid-template-columns:1fr}}
@media(max-width:560px){.fin30-ready-card{align-items:stretch;flex-direction:column}.fin30-ready-money{justify-content:space-between}.fin30-ready-money button{min-width:112px}}
</style>
'''
text = text.replace('</head>', css + '\n</head>', 1)

# 3) Month cards must NEVER inherit the current global due state.
# Always show package remaining sessions based on the package itself.
text = text.replace('${!dues.length&&remaining>0?', '${remaining>0?')

# Replace the status + embedded due block with month-only status.
pattern = re.compile(r"  let status='';\n  if\(!dues\.length\)\{.*?\n  const dueBlock=.*?;\n  const canStart=", re.S)
replacement = '''  let status='';
  if(future)status=`<div class="fin29-status future">هذه أرقام متوقعة حسب جدول ${esc(monthLabel(period))}.</div>`;
  else if(value>0&&row.settledValue>=value-.01)status=`<div class="fin29-status paid">✓ تم قبض حساب حصص ${esc(monthLabel(period))}.</div>`;
  else if(value>0&&row.settledValue>0)status=`<div class="fin29-status">تم قبض <strong>${esc(formatMoney(row.settledValue,agreement.currency))}</strong> من قيمة حصص هذا الشهر.</div>`;
  else if(agreement.billingModel==='monthly'&&mode==='current')status=`<div class="fin29-status wait">${agreement.paymentTiming==='advance'?'حساب هذا الشهر مقدم.':'حساب هذا الشهر مؤخر.'}</div>`;
  const canStart='''
text, n = pattern.subn(replacement, text, count=1)
if n != 1:
    raise SystemExit(f'failed to replace mixed month/due status block: {n}')

# Remove the old inline due block from the returned month card.
old_tail = '''</div></div>${dueBlock}</article>`;'''
new_tail = '''</div></div></article>`;'''
if old_tail not in text:
    raise SystemExit('month card due tail not found')
text = text.replace(old_tail, new_tail, 1)

# The old label counted linked lesson definitions, not actual sessions. Make it truthful.
old_link = "${linked.length?` · ${linked.length} حصة مرتبطة بالجدول`:''}"
new_link = "${linked.length?' · مرتبط بالجدول':''}"
if old_link not in text:
    raise SystemExit('misleading linked-session label not found')
text = text.replace(old_link, new_link, 1)

# 4) Monthly cards should be included only because of selected-month activity, never because of today's dues.
old_shown = "const shown=rows.filter(row=>row.actualCount>0||row.plannedCount>0||financeSimpleDueTargets(row.agreement).length||row.settledValue>0);"
new_shown = "const shown=rows.filter(row=>row.actualCount>0||row.plannedCount>0||row.workValue>0||row.expectedValue>0||row.settledValue>0);"
if old_shown not in text:
    raise SystemExit('shown filter not found')
text = text.replace(old_shown, new_shown, 1)

# 5) Render current dues in their own section.
ready_js = r'''
function financeSimpleRenderReady(){
  const box=document.getElementById('financeSimpleReadyList'),count=document.getElementById('financeSimpleReadyCount');if(!box)return;
  const items=finance.agreements.filter(item=>item.direction==='income'&&item.active).flatMap(agreement=>financeSimpleDueTargets(agreement));
  const accounts=new Set(items.map(item=>item.agreement.id)).size;
  if(count){count.textContent=accounts?`${accounts} حساب`:'لا يوجد';count.classList.toggle('has-due',items.length>0)}
  if(!items.length){box.innerHTML='<div class="fin30-ready-empty"><strong>لا يوجد شيء جاهز للقبض الآن</strong>عندما تكتمل باقة أو يحين موعد حساب شهري سيظهر هنا، بغض النظر عن الشهر المفتوح بالأعلى.</div>';return}
  box.innerHTML=items.map(target=>`<article class="fin30-ready-card"><div class="fin30-ready-copy"><small>${esc(financeSimpleTargetLabel(target))}</small><strong>${esc(target.agreement.name||'بدون اسم')}</strong><span>هذا حساب جاهز للقبض الآن، وليس جزءًا من عرض الشهر المختار.</span></div><div class="fin30-ready-money"><strong>${esc(formatMoney(target.remaining,target.agreement.currency))}</strong><button type="button" onclick="openSimpleFinancePayment('${target.agreement.id}','${target.targetType}','${target.targetKey}')">سجل أني قبضت</button></div></article>`).join('');
}
'''
marker = 'function financeSimpleRenderSummary(rows,period){'
if marker not in text:
    raise SystemExit('summary renderer marker not found')
text = text.replace(marker, ready_js + '\n' + marker, 1)

# Make the summary renderer month-only: no global due lookup / badge calculation.
old_header = "const box=document.getElementById('financeSimpleSummary'),heading=document.getElementById('financeSimpleSummaryHeading'),ready=document.getElementById('financeSimpleReadyCount');if(!box)return;"
new_header = "const box=document.getElementById('financeSimpleSummary'),heading=document.getElementById('financeSimpleSummaryHeading');if(!box)return;"
if old_header not in text:
    raise SystemExit('summary header not found')
text = text.replace(old_header, new_header, 1)

text, n1 = re.subn(r"\n  const allDues=finance\.agreements\.filter\(item=>item\.direction==='income'&&item\.active\)\.flatMap\(agreement=>financeSimpleDueTargets\(agreement\)\);\n  const readyAccounts=new Set\(allDues\.map\(item=>item\.agreement\.id\)\)\.size;\n  if\(ready\)\{ready\.textContent=.*?\}\n", "\n", text, count=1)
if n1 != 1:
    raise SystemExit(f'global due summary lines not removed: {n1}')

old_call = '  financeSimpleRenderSummary(rows,period);\n}'
new_call = '  financeSimpleRenderReady();\n  financeSimpleRenderSummary(rows,period);\n}'
if old_call not in text:
    raise SystemExit('renderFinance summary call not found')
text = text.replace(old_call, new_call, 1)

index.write_text(text, encoding='utf-8')

sw = Path('sw.js')
sw_text = sw.read_text(encoding='utf-8')
if 'mawaeidi-shell-v29' in sw_text:
    sw_text = sw_text.replace('mawaeidi-shell-v29','mawaeidi-shell-v30')
elif 'mawaeidi-shell-v30' not in sw_text:
    raise SystemExit('unexpected service worker cache version')
sw.write_text(sw_text, encoding='utf-8')

print('finance month/current scope separation v30 applied')
