from pathlib import Path

index = Path('index.html')
sw = Path('sw.js')
text = index.read_text(encoding='utf-8')

old_currency = '''<select id="lessonFinanceCurrency">
              <option value="EGP">الجنيه المصري (EGP)</option>
              <option value="USD" selected>الدولار الأمريكي (USD)</option>'''
new_currency = '''<select id="lessonFinanceCurrency">
              <option value="EGP" selected>الجنيه المصري (EGP)</option>
              <option value="USD">الدولار الأمريكي (USD)</option>'''
if old_currency not in text:
    raise SystemExit('lesson currency anchor not found')
text = text.replace(old_currency, new_currency, 1)

old_monthly = '''const count=monthSessionCount(agreement,selectedFinanceMonth),expected=count*agreement.amount,paid=targetPaid(agreement.id,"month",selectedFinanceMonth),manual=Boolean(monthCountRecord(agreement.id,selectedFinanceMonth));
    amountText=`${formatMoney(agreement.amount,agreement.currency)} / حصة`;
    progress=`<div class="agreement-progress">
      <div class="agreement-progress-top"><span>${count} حصة في ${esc(monthLabel(selectedFinanceMonth))}</span><span>${manual?"عدد مُراجع":"حسب حالات الحصص"}</span></div>'''
new_monthly = '''const currentFinanceMonth=currentDateKey().slice(0,7),count=monthSessionCount(agreement,currentFinanceMonth),expected=count*agreement.amount,paid=targetPaid(agreement.id,"month",currentFinanceMonth),manual=Boolean(monthCountRecord(agreement.id,currentFinanceMonth));
    amountText=`${formatMoney(agreement.amount,agreement.currency)} / حصة`;
    progress=`<div class="agreement-progress">
      <div class="agreement-progress-top"><span>${count} حصة في ${esc(monthLabel(currentFinanceMonth))}</span><span>${manual?"عدد مُراجع":"حسب حالات الحصص"}</span></div>'''
if old_monthly not in text:
    raise SystemExit('monthly agreement anchor not found')
text = text.replace(old_monthly, new_monthly, 1)

old_explainer = '''<div class="finance-explainer finance-explainer-v2"><strong>قيمة الحسابات الجارية</strong> هي قيمة الباقات والحسابات النشطة حاليًا، <strong>المستحق الآن</strong> هو ما حان تحصيله، و<strong>قريب التحصيل</strong> ما اقترب موعده.</div>'''
new_explainer = '''<div class="finance-explainer finance-explainer-v2"><strong>مهم:</strong> قيمة الحسابات الجارية ليست هي المبلغ المطلوب تحصيله الآن؛ راقب «المستحق الآن» للتحصيل الفعلي.</div>'''
if old_explainer not in text:
    raise SystemExit('finance explainer anchor not found')
text = text.replace(old_explainer, new_explainer, 1)

style = r'''
<style id="finance-polish-v27">
/* Finance v27 — calmer hierarchy, clearer states, current/month separation */
.finance-view-v2{
  --fin-blue:#234B6E;
  --fin-blue-soft:#EDF4F8;
  --fin-green:#2F766A;
  --fin-green-soft:#EAF5F1;
  --fin-amber:#9A6A24;
  --fin-amber-soft:#FBF2E2;
  --fin-red:#9A4B4B;
  --fin-red-soft:#FBEEEE;
  --fin-line:#D8E2E8;
}
.finance-toolbar-v2{
  position:relative;overflow:hidden;border-radius:12px!important;
  background:linear-gradient(135deg,#F8FBFC 0%,#FFFFFF 56%,#EEF5F8 100%)!important;
}
.finance-toolbar-v2::after{
  content:"";position:absolute;inset:auto -70px -95px auto;width:220px;height:220px;border-radius:50%;
  border:1px solid rgba(35,75,110,.055);box-shadow:0 0 0 34px rgba(35,75,110,.018),0 0 0 68px rgba(35,75,110,.012);pointer-events:none
}
.finance-toolbar-copy,.finance-quick-actions{position:relative;z-index:1}
.finance-eyebrow,.finance-section-kicker{background:#EAF2F6!important;color:#496A7D!important}
.finance-current-section{border-color:#C8D9E2!important;border-radius:12px!important}
.finance-section-intro{background:linear-gradient(180deg,#FBFDFE,#F7FAFB)!important}
.finance-live-badge{border-color:#C8DFD2!important;background:var(--fin-green-soft)!important;color:#4C755A!important}
.finance-summary-current{gap:11px!important}
.finance-summary-current .currency-summary{border-radius:11px!important;overflow:hidden}
.finance-summary-current .currency-summary.primary-currency{border-color:#ABC5D3!important}
.finance-summary-current .currency-summary-head{background:#F3F7F9!important}
.finance-summary-current .currency-code{background:var(--fin-blue)!important}
.finance-summary-current .currency-metric{background:#fff;transition:background .15s ease}
.finance-summary-current .currency-metric:first-child{background:linear-gradient(180deg,#FFFFFF,#F5F9FB)}
.finance-summary-current .currency-metric.due{background:linear-gradient(180deg,#FFFFFF,var(--fin-red-soft))}
.finance-summary-current .currency-metric.soon{background:linear-gradient(180deg,#FFFFFF,var(--fin-amber-soft))}
.finance-summary-current .currency-metric.due strong{color:var(--fin-red)!important}
.finance-summary-current .currency-metric.soon strong{color:var(--fin-amber)!important}
.finance-explainer-v2{color:#5C707D!important;background:#F6F9FA!important;border-top-color:#DFE7EB!important}
.finance-explainer-v2 strong{color:var(--fin-blue)!important}

.finance-layout-v2 .finance-panel{border-radius:12px!important;background:#FCFDFD!important}
.finance-panel-head-v2{border-bottom-color:#E0E8EC!important}
.finance-panel-action,.finance-payments-head button{border-color:#B7C9D4!important;color:var(--fin-blue)!important;background:#fff!important}
.finance-panel-action:hover,.finance-payments-head button:hover{background:#F4F8FA!important;border-color:#8EABBC!important}
.finance-group{padding-bottom:11px!important}
.finance-group-head{padding-inline:2px}
.finance-group.due .finance-group-title::before{background:var(--fin-red)!important}
.finance-group.soon .finance-group-title::before{background:#D39A3A!important}
.finance-group.ongoing .finance-group-title::before{background:#507C98!important}
.finance-group.paid .finance-group-title::before{background:var(--fin-green)!important}
.agreement-card{
  padding:12px 13px!important;border-color:var(--fin-line)!important;border-radius:11px!important;
  background:linear-gradient(145deg,#FFFFFF 0%,#FBFCFD 100%)!important
}
.agreement-card:hover{border-color:#BCCDD7!important;transform:translateY(-1px);transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}
.agreement-name{color:#203642;font-size:13.5px!important}.agreement-sub{color:#788993!important}
.agreement-amount{color:var(--fin-blue)!important;font-size:13px!important}
.agreement-tags{margin-top:7px!important;gap:4px!important}.agreement-tag{padding:3px 6px!important;background:#F0F4F6!important;color:#627783!important;font-size:8.5px!important}
.agreement-tag.advance{background:var(--fin-green-soft)!important;color:#4B7561!important}.agreement-tag.arrears{background:var(--fin-amber-soft)!important;color:#866024!important}
.agreement-progress{margin-top:9px!important;padding:9px 10px!important;background:#F5F8F9!important;border:1px solid #E2E9ED}
.agreement-track{background:#DFE7EB!important}.agreement-fill{background:linear-gradient(90deg,#4A897D,#75AA9E)!important}
.agreement-status-note{margin-top:7px!important;color:#637681!important}
.agreement-actions{margin-top:9px!important}.agreement-actions button,.agreement-more summary{min-height:32px!important}
.agreement-actions .main{background:var(--fin-blue)!important;border-color:var(--fin-blue)!important}.agreement-actions .main:hover{background:#1B405E!important}
.agreement-state.due{border-color:#E3BABA!important;background:var(--fin-red-soft)!important;color:var(--fin-red)!important}
.agreement-state.soon{border-color:#E5C996!important;background:var(--fin-amber-soft)!important;color:#8A6224!important}
.agreement-state.ongoing{border-color:#B7CDDB!important;background:#EEF5F9!important;color:#426E89!important}
.agreement-state.paid{border-color:#B7D8CD!important;background:var(--fin-green-soft)!important;color:var(--fin-green)!important}

.finance-month-report{background:#F8FAFB!important}
.month-report-card{border-color:var(--fin-line)!important;border-radius:10px!important}
.month-report-head{background:#F5F8FA;color:#425D6C}
.month-report-metric.received{background:var(--fin-green-soft)}
.month-report-metric.remaining{background:var(--fin-amber-soft)}
.month-report-metric.expense{background:var(--fin-red-soft)}
.month-report-metric.received strong{color:var(--fin-green)!important}.month-report-metric.remaining strong{color:var(--fin-amber)!important}.month-report-metric.expense strong{color:var(--fin-red)!important}
.payment-item{border-color:var(--fin-line)!important;border-radius:10px!important;box-shadow:0 2px 7px rgba(17,42,64,.025)}
.payment-amount{color:var(--fin-green)!important}.payment-amount.expense{color:var(--fin-red)!important}

@media(max-width:760px){
  .finance-toolbar-v2::after{display:none}
  .finance-summary-current .currency-metric:first-child,.finance-summary-current .currency-metric.due,.finance-summary-current .currency-metric.soon{background:#fff}
  .finance-summary-current .currency-metric.due{border-inline-start:3px solid #DFA6A6!important}
  .finance-summary-current .currency-metric.soon{border-inline-start:3px solid #E1BE80!important}
  .agreement-top{align-items:flex-start}.agreement-amount{font-size:12px!important}
}
</style>
'''
anchor = '</head>'
if 'finance-polish-v27' not in text:
    if anchor not in text:
        raise SystemExit('head anchor not found')
    text = text.replace(anchor, style + '\n' + anchor, 1)

index.write_text(text, encoding='utf-8')

sw_text = sw.read_text(encoding='utf-8')
import re
sw_text, count = re.subn(r'mawaeidi-shell-v\d+', 'mawaeidi-shell-v27', sw_text, count=1)
if count != 1:
    raise SystemExit('cache anchor not found')
sw.write_text(sw_text, encoding='utf-8')
