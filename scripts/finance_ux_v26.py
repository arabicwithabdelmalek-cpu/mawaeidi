from pathlib import Path
import re

index_path = Path('index.html')
sw_path = Path('sw.js')
text = index_path.read_text(encoding='utf-8')

old_view = '''    <section id="financeView" class="finance-view" aria-labelledby="financeHeading" hidden>
      <div class="finance-toolbar">
        <div>
          <h2 id="financeHeading">الملخص المالي</h2>
          <p>اعرف قيمة أرصدتك الجارية، وما استحق، وما تم تحصيله دون حساب يدوي.</p>
        </div>
        <label class="finance-period" for="financeMonth">
          <span>كشف شهر</span>
          <input id="financeMonth" type="month" onchange="changeFinanceMonth(this.value)">
        </label>
      </div>

      <div class="finance-summary" id="financeSummary" aria-live="polite"></div>
      <div class="finance-explainer"><strong>قيمة الأرصدة الجارية</strong> هي قيمة الباقات الحالية كلها، أما <strong>المستحق الآن</strong> فهو ما حان موعد تحصيله فقط.</div>

      <div class="finance-layout">
        <section class="finance-panel" aria-labelledby="agreementsHeading">
          <header class="finance-panel-head">
            <div>
              <h3 id="agreementsHeading">المتابعة المالية</h3>
              <span id="financeAgreementCount">0 اتفاق</span>
            </div>
            <button type="button" class="finance-panel-action" onclick="openFinanceAgreement()">＋ حساب مستقل</button>
          </header>
          <div class="finance-groups" id="financeAgreements"></div>
        </section>

        <aside class="finance-panel" aria-labelledby="paymentsHeading">
          <header class="finance-panel-head">
            <div>
              <h3 id="paymentsHeading">كشف الشهر</h3>
              <span id="financeReportPeriodLabel">الحركة المالية خلال الفترة</span>
            </div>
            <button type="button" class="finance-panel-action" onclick="openFinancePayment()">＋ تسجيل دفعة</button>
          </header>
          <div class="finance-month-report" id="financeMonthReport"></div>
          <div class="finance-list" id="financePayments"></div>
        </aside>
      </div>
    </section>'''

new_view = '''    <section id="financeView" class="finance-view finance-view-v2" aria-labelledby="financeHeading" hidden>
      <div class="finance-toolbar finance-toolbar-v2">
        <div class="finance-toolbar-copy">
          <span class="finance-eyebrow">المالية</span>
          <h2 id="financeHeading">صورة واضحة لحساباتك</h2>
          <p>اعرف ما لديك الآن، وما يستحق التحصيل، ثم راجع كل شهر في مكانه بدون خلط بين الرصيد الجاري والحركة الشهرية.</p>
        </div>
        <div class="finance-quick-actions" aria-label="إجراءات مالية سريعة">
          <button type="button" class="finance-action-primary" onclick="openFinancePayment()">＋ تسجيل دفعة</button>
          <button type="button" class="finance-action-secondary" onclick="openFinanceAgreement()">＋ حساب مالي</button>
        </div>
      </div>

      <section class="finance-current-section" aria-labelledby="financeCurrentHeading">
        <header class="finance-section-intro">
          <div>
            <span class="finance-section-kicker">الوضع الحالي</span>
            <h3 id="financeCurrentHeading">أين تقف حساباتك الآن؟</h3>
            <p>هذه الأرقام لحظية ولا تتغيّر عند التنقل بين الشهور في كشف الشهر.</p>
          </div>
          <span class="finance-live-badge">يتحدّث تلقائيًا</span>
        </header>
        <div class="finance-summary finance-summary-current" id="financeSummary" aria-live="polite"></div>
        <div class="finance-explainer finance-explainer-v2"><strong>قيمة الحسابات الجارية</strong> هي قيمة الباقات والحسابات النشطة حاليًا، <strong>المستحق الآن</strong> هو ما حان تحصيله، و<strong>قريب التحصيل</strong> ما اقترب موعده.</div>
      </section>

      <div class="finance-layout finance-layout-v2">
        <section class="finance-panel finance-accounts-panel" aria-labelledby="agreementsHeading">
          <header class="finance-panel-head finance-panel-head-v2">
            <div>
              <span class="finance-section-kicker">المتابعة</span>
              <h3 id="agreementsHeading">الحسابات المالية</h3>
              <span id="financeAgreementCount">0 حساب</span>
            </div>
            <button type="button" class="finance-panel-action" onclick="openFinanceAgreement()">＋ حساب مالي</button>
          </header>
          <div class="finance-groups" id="financeAgreements"></div>
        </section>

        <aside class="finance-panel finance-month-panel" aria-labelledby="paymentsHeading">
          <header class="finance-panel-head finance-panel-head-v2 finance-month-head">
            <div>
              <span class="finance-section-kicker">التقرير الشهري</span>
              <h3 id="paymentsHeading">كشف الشهر</h3>
              <span id="financeReportPeriodLabel">الحركة المالية خلال الفترة</span>
            </div>
            <label class="finance-period finance-period-inline" for="financeMonth">
              <span>الشهر</span>
              <input id="financeMonth" type="month" onchange="changeFinanceMonth(this.value)">
            </label>
          </header>
          <div class="finance-month-report" id="financeMonthReport"></div>
          <div class="finance-payments-head"><div><strong>دفعات الشهر</strong><span>المبالغ المسجلة فعليًا</span></div><button type="button" onclick="openFinancePayment()">＋ دفعة</button></div>
          <div class="finance-list" id="financePayments"></div>
        </aside>
      </div>
    </section>'''

if old_view not in text:
    raise SystemExit('finance view anchor not found')
text = text.replace(old_view, new_view, 1)

finance_css = r'''
<style id="finance-ux-v26">
/* Finance UX v26: separate current state from monthly reporting */
.finance-view-v2{display:grid;gap:14px}
.finance-toolbar-v2{align-items:center;margin-bottom:0;padding:19px 21px;border-top-width:1px;border-color:#D6E1E7;background:linear-gradient(135deg,#F8FBFC 0%,#FFFFFF 58%,#F4F8FA 100%);box-shadow:0 7px 22px rgba(17,42,64,.055)}
.finance-toolbar-copy{max-width:720px}.finance-eyebrow,.finance-section-kicker{display:inline-flex;align-items:center;min-height:23px;padding:3px 8px;border-radius:999px;background:#EAF1F5;color:#557183;font-size:8.5px;font-weight:900;line-height:1}
.finance-toolbar-v2 h2{margin-top:7px;font-size:23px}.finance-toolbar-v2 p{max-width:690px;font-size:11px}
.finance-quick-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-start}
.finance-quick-actions button{min-height:40px;padding:9px 13px;border-radius:9px;font:inherit;font-size:10px;font-weight:900;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease,background .15s ease}
.finance-action-primary{border:1px solid var(--primary);background:var(--primary);color:#fff;box-shadow:0 5px 12px rgba(35,75,110,.12)}
.finance-action-primary:hover{background:#1D405E;transform:translateY(-1px)}
.finance-action-secondary{border:1px solid #B8C8D3;background:#fff;color:var(--primary)}
.finance-action-secondary:hover{border-color:#91AABA;background:#F8FBFC;transform:translateY(-1px)}

.finance-current-section{overflow:hidden;border:1px solid #D6E1E7;border-radius:11px;background:#fff;box-shadow:0 6px 18px rgba(17,42,64,.045)}
.finance-section-intro{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:15px 17px 12px;border-bottom:1px solid #E1E8EC;background:#FBFCFD}
.finance-section-intro h3{margin:5px 0 0;color:var(--primary);font-size:17px}.finance-section-intro p{margin:4px 0 0;color:var(--muted);font-size:9.5px;line-height:1.65}
.finance-live-badge{display:inline-flex;align-items:center;gap:6px;min-height:28px;padding:5px 9px;border:1px solid #CDE0D3;border-radius:999px;background:#EFF8F1;color:#4F7658;font-size:8.5px;font-weight:900;white-space:nowrap}.finance-live-badge::before{content:"";width:6px;height:6px;border-radius:50%;background:#5D9569;box-shadow:0 0 0 3px rgba(93,149,105,.10)}
.finance-summary-current{margin:0;padding:13px;background:#fff}
.finance-summary-current .currency-summary{border-color:#D9E3E8;box-shadow:0 3px 10px rgba(17,42,64,.035)}
.finance-summary-current .currency-summary.primary-currency{border-color:#B9CDD8;box-shadow:0 5px 14px rgba(35,75,110,.075)}
.finance-summary-current .currency-summary-head{padding:10px 12px;background:#F5F8FA}
.finance-summary-current .currency-summary-head small{font-size:8px}
.finance-summary-current .currency-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}
.finance-summary-current .currency-metric{min-height:76px;border-bottom:0!important;border-inline-end:1px solid var(--line)!important;padding:11px 12px}
.finance-summary-current .currency-metric:last-child{border-inline-end:0!important}
.finance-summary-current .currency-metric small{font-size:9px}.finance-summary-current .currency-metric strong{font-size:18px}
.finance-explainer-v2{margin:0;padding:9px 13px;border:0;border-top:1px solid #E3EAEE;border-radius:0;background:#F7FAFB;font-size:9px}

.finance-layout-v2{grid-template-columns:minmax(0,1.28fr) minmax(330px,.72fr);gap:14px}
.finance-layout-v2 .finance-panel{border-top-width:1px;border-color:#D7E1E6;box-shadow:0 6px 18px rgba(17,42,64,.045)}
.finance-panel-head-v2{align-items:flex-start;padding:14px 15px;background:#FBFCFD}.finance-panel-head-v2 h3{margin-top:5px;color:var(--primary);font-size:16px}.finance-panel-head-v2>div>span:not(.finance-section-kicker){display:block;margin-top:3px}
.finance-panel-head-v2 .finance-panel-action{align-self:center}
.finance-month-head{align-items:center}.finance-period-inline{min-width:145px;gap:4px}.finance-period-inline span{color:#72818C;font-size:8.5px;font-weight:800}.finance-period-inline input{height:36px;padding:6px 8px;border-color:#CCD8DF;background:#fff;font-size:10px}
.finance-month-report{padding:12px 13px 3px}
.finance-payments-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px;padding:12px 13px 9px;border-top:1px solid var(--line)}
.finance-payments-head>div{display:grid;gap:2px}.finance-payments-head strong{color:var(--ink);font-size:11px}.finance-payments-head span{color:var(--muted);font-size:8.5px}.finance-payments-head button{min-height:32px;padding:6px 9px;border:1px solid #BCCCD7;border-radius:8px;background:#fff;color:var(--primary);font:inherit;font-size:9px;font-weight:900;cursor:pointer}
.finance-month-panel .finance-list{padding-top:2px}

.finance-groups{background:#FCFDFD}.finance-group{padding:0 13px 13px}.finance-group:first-child{padding-top:13px}.finance-group-head{margin-bottom:7px}.finance-group-title{font-size:11px}.finance-group-count{min-width:23px;height:23px}
.agreement-card{box-shadow:0 2px 8px rgba(17,42,64,.025)}.agreement-card:hover{box-shadow:0 5px 14px rgba(17,42,64,.06)}

@media(max-width:1000px){
  .finance-layout-v2{grid-template-columns:1fr}
  .finance-month-panel{order:2}
}
@media(max-width:760px){
  .finance-view-v2{gap:11px;margin-top:12px}
  .finance-toolbar-v2{padding:15px;align-items:stretch}
  .finance-toolbar-v2 h2{font-size:20px}.finance-toolbar-v2 p{font-size:10px}
  .finance-quick-actions{display:grid;grid-template-columns:1fr 1fr;width:100%}.finance-quick-actions button{width:100%;min-height:39px}
  .finance-section-intro{padding:13px;flex-direction:column}.finance-live-badge{align-self:flex-start}
  .finance-summary-current{padding:10px}.finance-summary-current .currency-metrics{grid-template-columns:1fr}
  .finance-summary-current .currency-metric{min-height:0;border-inline-end:0!important;border-bottom:1px solid var(--line)!important;padding:10px 11px}.finance-summary-current .currency-metric:last-child{border-bottom:0!important}
  .finance-panel-head-v2{padding:13px;gap:10px}.finance-month-head{align-items:stretch;flex-direction:column}.finance-period-inline{width:100%;min-width:0}.finance-period-inline input{width:100%}
  .finance-payments-head{padding-inline:11px}.finance-groups{padding-bottom:1px}.finance-group{padding-inline:10px}
}
@media(max-width:420px){.finance-quick-actions{grid-template-columns:1fr}.finance-toolbar-v2 h2{font-size:19px}}
</style>
'''
if 'id="finance-ux-v26"' not in text:
    text = text.replace('</head>', finance_css + '\n</head>', 1)

# Put EGP first without changing calculations.
text = text.replace('return [...currencies].sort().map(currency=>{', 'return [...currencies].sort((a,b)=>a==="EGP"?-1:b==="EGP"?1:a.localeCompare(b)).map(currency=>{', 1)

summary_pattern = re.compile(r'function renderFinanceSummary\(\)\{.*?\n\}\nfunction renderFinanceMonthReport\(\)\{', re.S)
summary_replacement = '''function renderFinanceSummary(){
  const box=document.getElementById("financeSummary");
  if(!box)return;
  const rows=financeSummaryData(currentDateKey().slice(0,7));
  if(!rows.length){
    box.innerHTML='<div class="finance-empty-summary">لا توجد حسابات مالية بعد. أضف حسابًا ماليًا أو اربطه بإحدى الحصص ليظهر الوضع الحالي هنا تلقائيًا.</div>';
    return;
  }
  box.innerHTML=rows.map(row=>`<article class="currency-summary${row.currency==="EGP"?" primary-currency":""}">
    <header class="currency-summary-head"><div><strong>${esc(currencyLabel(row.currency))}</strong><small>الوضع الحالي الآن</small></div><span class="currency-code">${esc(row.currency)}</span></header>
    <div class="currency-metrics">
      <div class="currency-metric"><small>قيمة الحسابات الجارية</small><strong>${esc(formatMoney(row.currentValue,row.currency))}</strong></div>
      <div class="currency-metric due"><small>مستحق للتحصيل الآن</small><strong>${esc(formatMoney(row.dueNow,row.currency))}</strong></div>
      <div class="currency-metric soon"><small>قريب التحصيل</small><strong>${esc(formatMoney(row.soon,row.currency))}</strong></div>
    </div>
  </article>`).join("");
}
function renderFinanceMonthReport(){'''
text, count = summary_pattern.subn(summary_replacement, text, count=1)
if count != 1:
    raise SystemExit('renderFinanceSummary anchor not found')

# Clearer account language in status and empty state.
text = text.replace('الاتفاق مؤرشف، وتظل دفعاته السابقة محفوظة في السجل.', 'الحساب مؤرشف، وتظل دفعاته السابقة محفوظة في السجل.', 1)
text = text.replace('تم تحصيل قيمة الحساب الجاري بالكامل.', 'تم تحصيل الحساب الجاري بالكامل.', 1)
text = text.replace('تم دفع قيمة الحساب الجاري بالكامل.', 'تم دفع الحساب الجاري بالكامل.', 1)
text = text.replace('لا توجد اتفاقات مالية', 'لا توجد حسابات مالية', 1)
text = text.replace('أضف الحساب المالي من داخل الحصة؛ وسيظهر هنا ويتحدث تلقائيًا.', 'أضف حسابًا ماليًا من هنا أو من داخل الحصة؛ وسيظهر ويتحدّث تلقائيًا.', 1)

# New accounts default to EGP; existing records stay unchanged.
text = text.replace('currency:"USD",packageSize:8,paymentMethod:"paypal"', 'currency:"EGP",packageSize:8,paymentMethod:"paypal"', 1)
text = text.replace('document.getElementById("lessonFinanceCurrency").value="USD";', 'document.getElementById("lessonFinanceCurrency").value="EGP";', 1)

index_path.write_text(text, encoding='utf-8')

sw = sw_path.read_text(encoding='utf-8')
if 'mawaeidi-shell-v25' not in sw:
    raise SystemExit('expected sw cache v25 not found')
sw = sw.replace('mawaeidi-shell-v25', 'mawaeidi-shell-v26', 1)
sw_path.write_text(sw, encoding='utf-8')
print('finance UX v26 applied')
