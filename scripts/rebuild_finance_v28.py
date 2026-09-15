from pathlib import Path
import re

INDEX = Path('index.html')
text = INDEX.read_text(encoding='utf-8')

new_html = r'''    <section id="financeView" class="finance-view finance-v3" aria-labelledby="financeHeading" hidden>
      <header class="finance-v3-hero">
        <div class="finance-v3-hero-copy">
          <span class="finance-v3-kicker">المالية</span>
          <h2 id="financeHeading">مالية الحصص</h2>
          <p>كل شهر يحسب الحصص التي تمت فيه وقيمتها، أما الاستحقاق والتحصيل فلهما تاريخ مستقل.</p>
        </div>
        <div class="finance-v3-actions" aria-label="إجراءات مالية سريعة">
          <button type="button" class="finance-v3-primary" onclick="openFinancePayment()">＋ تسجيل تحصيل</button>
          <button type="button" class="finance-v3-secondary" onclick="openFinanceAgreement()">＋ حساب مالي</button>
        </div>
      </header>

      <section class="finance-v3-month-shell" aria-labelledby="financeMonthTitle">
        <div class="finance-v3-month-head">
          <div class="finance-v3-month-copy">
            <span>عرض الشهر</span>
            <strong id="financeMonthTitle">—</strong>
            <small id="financeMonthSubtitle">—</small>
          </div>
          <div class="finance-v3-month-controls">
            <button type="button" onclick="financeMoveMonth(-1)" aria-label="الشهر السابق">›</button>
            <button type="button" class="current" onclick="financeGoCurrentMonth()">هذا الشهر</button>
            <button type="button" onclick="financeMoveMonth(1)" aria-label="الشهر التالي">‹</button>
          </div>
        </div>
        <div class="finance-v3-month-tabs" id="financeMonthTabs" aria-label="التنقل بين الشهور"></div>
        <input id="financeMonth" type="month" hidden onchange="changeFinanceMonth(this.value)">
      </section>

      <section class="finance-v3-summary-section" aria-labelledby="financeMonthSummaryHeading">
        <div class="finance-v3-section-head compact">
          <div>
            <span class="finance-v3-section-kicker">ملخص الشهر</span>
            <h3 id="financeMonthSummaryHeading">قيمة الحصص والتسوية</h3>
          </div>
        </div>
        <div class="finance-v3-summary" id="financeMonthSummary" aria-live="polite"></div>
      </section>

      <section class="finance-v3-accounts-section" aria-labelledby="financeAccountsHeading">
        <div class="finance-v3-section-head">
          <div>
            <span class="finance-v3-section-kicker">الحصص</span>
            <h3 id="financeAccountsHeading">الحسابات في هذا الشهر</h3>
            <p>القيمة تظهر في شهر الحصة نفسها حتى لو قبضت الفلوس في شهر آخر.</p>
          </div>
          <span class="finance-v3-count" id="financeAccountCount">0 حساب</span>
        </div>
        <div class="finance-v3-account-list" id="financeMonthAccounts"></div>
      </section>

      <div class="finance-v3-bottom-grid">
        <section class="finance-v3-panel finance-v3-dues" aria-labelledby="financeDuesHeading">
          <div class="finance-v3-panel-head">
            <div>
              <span class="finance-v3-section-kicker">الاستحقاقات</span>
              <h3 id="financeDuesHeading">مستحقات تحتاج تحصيل</h3>
              <p>تظل ظاهرة هنا حتى لو كان جزء منها يخص شهرًا قديمًا.</p>
            </div>
          </div>
          <div class="finance-v3-due-list" id="financeOpenDues"></div>
        </section>

        <section class="finance-v3-panel finance-v3-cash" aria-labelledby="financeCashHeading">
          <div class="finance-v3-panel-head">
            <div>
              <span class="finance-v3-section-kicker">التحصيل النقدي</span>
              <h3 id="financeCashHeading">الفلوس التي قبضتها في الشهر</h3>
              <p>هذا تاريخ دخول الفلوس فعلًا، وليس شهر الحصص التي تخصها.</p>
            </div>
            <button type="button" onclick="openFinancePayment()">＋ تحصيل</button>
          </div>
          <div class="finance-v3-cash-list" id="financeCashList"></div>
        </section>
      </div>
    </section>'''

start = text.find('    <section id="financeView"')
if start < 0:
    raise SystemExit('finance section start not found')
backdrop = text.find('\n<div class="backdrop"', start)
if backdrop < 0:
    raise SystemExit('backdrop marker not found')
end_start = text.rfind('\n    </section>', start, backdrop)
if end_start < 0:
    raise SystemExit('finance section end not found')
end = end_start + len('\n    </section>')
text = text[:start] + new_html + text[end:]

css = r'''
<style id="finance-rebuild-v28">
/* Finance rebuild v28 — month-first accounting */
.finance-v3{--fin-navy:#193F5B;--fin-blue:#2E6782;--fin-green:#3E7A67;--fin-green-soft:#EAF4F0;--fin-gold:#B98B38;--fin-gold-soft:#FBF2DE;--fin-red:#9A5050;--fin-red-soft:#FCEEEE;--fin-line:#D8E2E8;--fin-surface:#FCFDFD;display:grid;gap:14px;margin-top:16px;animation:page-in .35s ease both}
.finance-v3-hero{display:flex;align-items:center;justify-content:space-between;gap:22px;padding:20px 22px;border:1px solid #CFDCE4;border-radius:13px;background:linear-gradient(130deg,#F8FBFC 0%,#FFFFFF 56%,#F2F7F9 100%);box-shadow:0 8px 24px rgba(17,42,64,.055)}
.finance-v3-hero-copy{max-width:760px}.finance-v3-kicker,.finance-v3-section-kicker{display:inline-flex;align-items:center;min-height:23px;padding:3px 9px;border-radius:999px;background:#EAF1F5;color:#537084;font-size:8.5px;font-weight:900}
.finance-v3-hero h2{margin:8px 0 2px;color:var(--fin-navy);font-size:25px;font-weight:900}.finance-v3-hero p{margin:0;color:#687A86;font-size:11px;line-height:1.8}
.finance-v3-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.finance-v3-actions button,.finance-v3-panel-head button{min-height:40px;padding:9px 13px;border-radius:9px;font:inherit;font-size:10px;font-weight:900;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease,background .15s ease}
.finance-v3-primary{border:1px solid var(--fin-navy);background:var(--fin-navy);color:#fff;box-shadow:0 5px 13px rgba(25,63,91,.13)}.finance-v3-primary:hover{background:#123249;transform:translateY(-1px)}
.finance-v3-secondary,.finance-v3-panel-head button{border:1px solid #B8C8D3;background:#fff;color:var(--fin-navy)}.finance-v3-secondary:hover,.finance-v3-panel-head button:hover{border-color:#93ACBC;background:#F8FBFC;transform:translateY(-1px)}

.finance-v3-month-shell,.finance-v3-summary-section,.finance-v3-accounts-section,.finance-v3-panel{overflow:hidden;border:1px solid var(--fin-line);border-radius:12px;background:#fff;box-shadow:0 5px 16px rgba(17,42,64,.04)}
.finance-v3-month-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 16px;border-bottom:1px solid #E2E9ED;background:#FBFCFD}.finance-v3-month-copy{display:grid;gap:2px}.finance-v3-month-copy>span{color:#7B8B95;font-size:8.5px;font-weight:800}.finance-v3-month-copy strong{color:var(--fin-navy);font-size:17px;font-weight:900}.finance-v3-month-copy small{color:#7B8B95;font-size:9px}
.finance-v3-month-controls{display:flex;align-items:center;gap:5px;padding:3px;border:1px solid #D6E0E6;border-radius:9px;background:#F3F6F8}.finance-v3-month-controls button{min-width:34px;height:32px;padding:0 9px;border:0;border-radius:7px;background:transparent;color:#637985;font:inherit;font-size:12px;font-weight:900;cursor:pointer}.finance-v3-month-controls button:hover{background:#fff;color:var(--fin-navy)}.finance-v3-month-controls .current{min-width:76px;border:1px solid #CBD8DF;background:#fff;color:var(--fin-navy);font-size:9px}
.finance-v3-month-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:11px 13px;background:#F8FAFB}.finance-v3-month-tab{display:grid;gap:2px;min-height:55px;padding:9px 10px;border:1px solid #DCE5EA;border-radius:9px;background:#fff;color:#637783;text-align:right;cursor:pointer}.finance-v3-month-tab:hover{border-color:#AFC2CE}.finance-v3-month-tab small{font-size:8px;font-weight:800;color:#8A98A1}.finance-v3-month-tab strong{font-size:11px;font-weight:900;color:#526B7B}.finance-v3-month-tab.active{border-color:#9CB5C5;background:#EDF4F7;box-shadow:inset 0 0 0 1px rgba(25,63,91,.04)}.finance-v3-month-tab.active strong{color:var(--fin-navy)}

.finance-v3-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:14px 16px;border-bottom:1px solid #E2E9ED;background:#FBFCFD}.finance-v3-section-head.compact{padding-bottom:11px}.finance-v3-section-head h3,.finance-v3-panel-head h3{margin:5px 0 0;color:var(--fin-navy);font-size:16px}.finance-v3-section-head p,.finance-v3-panel-head p{margin:3px 0 0;color:#788993;font-size:9px;line-height:1.65}.finance-v3-count{display:inline-flex;align-items:center;justify-content:center;min-height:28px;padding:5px 9px;border-radius:999px;background:#EEF3F6;color:#5F7481;font-size:8.5px;font-weight:900;white-space:nowrap}
.finance-v3-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(275px,1fr));gap:10px;padding:12px}.finance-v3-summary-card{overflow:hidden;border:1px solid #D8E3E8;border-radius:10px;background:#fff}.finance-v3-summary-card.primary{border-color:#B9CEDA;box-shadow:0 4px 12px rgba(25,63,91,.065)}.finance-v3-summary-head{display:flex;align-items:center;justify-content:space-between;padding:9px 11px;border-bottom:1px solid #E2E9ED;background:#F5F8FA}.finance-v3-summary-head strong{font-size:11px}.finance-v3-summary-code{padding:3px 7px;border-radius:6px;background:var(--fin-navy);color:#fff;font-size:8px;font-weight:900;direction:ltr}.finance-v3-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.finance-v3-metric{min-height:72px;padding:10px 11px;border-bottom:1px solid #E4EAEE}.finance-v3-metric:nth-child(odd){border-inline-end:1px solid #E4EAEE}.finance-v3-metric:nth-last-child(-n+2){border-bottom:0}.finance-v3-metric small{display:block;color:#7B8A93;font-size:8.5px;font-weight:800}.finance-v3-metric strong{display:block;margin-top:5px;color:var(--fin-navy);font-size:16px;font-weight:900;direction:ltr;text-align:right}.finance-v3-metric.settled strong{color:var(--fin-green)}.finance-v3-metric.open strong{color:var(--fin-red)}.finance-v3-metric.cash strong{color:#6B5A2D}
.finance-v3-empty{padding:24px 14px;text-align:center;color:#7C8B95;font-size:10px;line-height:1.8}.finance-v3-empty strong{display:block;margin-bottom:3px;color:#536A78;font-size:11px}

.finance-v3-account-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:12px;background:#FCFDFD}.finance-v3-account{position:relative;overflow:hidden;padding:13px 14px;border:1px solid #D9E3E8;border-inline-start:4px solid var(--account-color,var(--fin-blue));border-radius:10px;background:#fff;box-shadow:0 2px 8px rgba(17,42,64,.025)}.finance-v3-account-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.finance-v3-account-name{font-size:13px;font-weight:900;color:#20313E}.finance-v3-account-sub{margin-top:3px;color:#7A8992;font-size:8.5px;line-height:1.55}.finance-v3-status{display:inline-flex;align-items:center;min-height:23px;padding:3px 7px;border:1px solid #CCD8DF;border-radius:999px;background:#F4F7F9;color:#657985;font-size:8px;font-weight:900;white-space:nowrap}.finance-v3-status.due{border-color:#E4C0C0;background:var(--fin-red-soft);color:var(--fin-red)}.finance-v3-status.settled{border-color:#BFD9CF;background:var(--fin-green-soft);color:var(--fin-green)}.finance-v3-status.planned{border-color:#D9C48E;background:var(--fin-gold-soft);color:#826321}.finance-v3-status.needs-cycle{border-color:#E2C29A;background:#FFF3E3;color:#8A5A24}
.finance-v3-account-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}.finance-v3-account-tags span{padding:4px 7px;border-radius:999px;background:#F0F4F6;color:#5E7380;font-size:8px;font-weight:800}.finance-v3-account-tags .timing{background:#EEF5F1;color:#4F7767}
.finance-v3-account-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px}.finance-v3-account-metric{padding:9px 10px;border:1px solid #E0E7EB;border-radius:8px;background:#F9FBFC}.finance-v3-account-metric small{display:block;color:#839099;font-size:7.5px;font-weight:800}.finance-v3-account-metric strong{display:block;margin-top:3px;color:#2B4658;font-size:12px;font-weight:900}.finance-v3-account-metric strong.money{direction:ltr;text-align:right}.finance-v3-account-metric.settled strong{color:var(--fin-green)}
.finance-v3-account-note{margin-top:8px;color:#667A86;font-size:8.5px;line-height:1.65}.finance-v3-account-note b{color:#314D60}.finance-v3-progress{margin-top:9px;padding:9px 10px;border-radius:8px;background:#F4F7F9}.finance-v3-progress-top{display:flex;justify-content:space-between;gap:10px;color:#5C7180;font-size:8.5px;font-weight:900}.finance-v3-progress-track{height:6px;margin-top:6px;overflow:hidden;border-radius:999px;background:#DDE6EB}.finance-v3-progress-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,#397862,#66A18D)}
.finance-v3-account-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px}.finance-v3-account-actions button{min-height:33px;padding:6px 9px;border:1px solid #C7D4DC;border-radius:7px;background:#fff;color:#5B6F7B;font:inherit;font-size:8.5px;font-weight:900;cursor:pointer}.finance-v3-account-actions .main{border-color:var(--fin-navy);background:var(--fin-navy);color:#fff}.finance-v3-account-actions .warning{border-color:#DEC49C;background:#FFF8EC;color:#815E28}

.finance-v3-bottom-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:start}.finance-v3-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:14px 15px;border-bottom:1px solid #E2E9ED;background:#FBFCFD}.finance-v3-due-list,.finance-v3-cash-list{display:grid;gap:8px;padding:11px}.finance-v3-due,.finance-v3-cash-item{padding:11px 12px;border:1px solid #DDE5E9;border-radius:9px;background:#fff}.finance-v3-due-top,.finance-v3-cash-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.finance-v3-due-name,.finance-v3-cash-name{color:#263A48;font-size:11px;font-weight:900}.finance-v3-due-amount{color:var(--fin-red);font-size:12px;font-weight:900;direction:ltr;white-space:nowrap}.finance-v3-cash-amount{color:var(--fin-green);font-size:12px;font-weight:900;direction:ltr;white-space:nowrap}.finance-v3-due-meta,.finance-v3-cash-meta{margin-top:3px;color:#7B8991;font-size:8px;line-height:1.6}.finance-v3-due-months{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px}.finance-v3-due-months span{padding:4px 6px;border-radius:6px;background:#F4F7F9;color:#596F7C;font-size:7.5px;font-weight:800}.finance-v3-due-actions{display:flex;gap:6px;margin-top:8px}.finance-v3-due-actions button{min-height:31px;padding:6px 8px;border:1px solid var(--fin-navy);border-radius:7px;background:var(--fin-navy);color:#fff;font:inherit;font-size:8px;font-weight:900;cursor:pointer}.finance-v3-cash-item .payment-remove{margin-top:5px}

@media(max-width:1000px){.finance-v3-account-list,.finance-v3-bottom-grid{grid-template-columns:1fr}}
@media(max-width:760px){.finance-v3{gap:11px;margin-top:12px}.finance-v3-hero{align-items:stretch;flex-direction:column;padding:15px}.finance-v3-hero h2{font-size:21px}.finance-v3-actions{display:grid;grid-template-columns:1fr 1fr}.finance-v3-actions button{width:100%}.finance-v3-month-head{align-items:stretch;flex-direction:column}.finance-v3-month-controls{align-self:stretch;justify-content:space-between}.finance-v3-month-tabs{gap:6px;padding:9px}.finance-v3-month-tab{min-height:52px;padding:8px}.finance-v3-summary{grid-template-columns:1fr;padding:9px}.finance-v3-account-list{padding:9px}.finance-v3-account-metrics{grid-template-columns:1fr}.finance-v3-section-head{padding:12px 13px}.finance-v3-bottom-grid{gap:11px}}
@media(max-width:430px){.finance-v3-actions{grid-template-columns:1fr}.finance-v3-month-tab small{font-size:7px}.finance-v3-month-tab strong{font-size:10px}.finance-v3-summary-grid{grid-template-columns:1fr}.finance-v3-metric{border-inline-end:0!important;border-bottom:1px solid #E4EAEE!important}.finance-v3-metric:last-child{border-bottom:0!important}}
</style>
'''
if 'id="finance-rebuild-v28"' in text:
    raise SystemExit('finance v28 style already present')
text = text.replace('</head>', css + '\n</head>', 1)

js = r'''

/* Finance rebuild v28 — month-first accounting */
function financeMonthShift(period,delta){
  const base=validMonthKey(period)?period:currentDateKey().slice(0,7),[year,month]=base.split('-').map(Number),date=new Date(Date.UTC(year,month-1+Number(delta||0),1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}`;
}
function financeMoveMonth(delta){selectedFinanceMonth=financeMonthShift(selectedFinanceMonth,delta);renderFinance()}
function financeGoCurrentMonth(){selectedFinanceMonth=currentDateKey().slice(0,7);renderFinance()}
function financeMonthRelation(period){
  const current=currentDateKey().slice(0,7);
  if(period===current)return 'هذا الشهر';
  if(period===financeMonthShift(current,-1))return 'الشهر الماضي';
  if(period===financeMonthShift(current,1))return 'الشهر القادم';
  return period<current?'شهر سابق':'شهر قادم';
}
function financeActualSessionsBetween(agreement,fromDate,toDate){
  if(!agreement||!validDateKey(fromDate)||!validDateKey(toDate)||fromDate>toDate)return 0;
  const end=minDateKey(toDate,currentDateKey());
  if(end<fromDate)return 0;
  let total=0,cursor=new Date(`${fromDate}T12:00:00Z`),last=new Date(`${end}T12:00:00Z`),guard=0;
  while(cursor<=last&&guard<3700){
    const key=cursor.toISOString().slice(0,10);total+=agreementSessionCountOnDate(agreement,key,true);cursor.setUTCDate(cursor.getUTCDate()+1);guard++;
  }
  return total;
}
function financeAgreementMonthWindow(agreement,period){
  const bounds=monthBounds(period),start=maxDateKey(bounds.start,agreement.startDate||bounds.start);
  return start>bounds.end?null:{start,end:bounds.end};
}
function financeCyclePortionForMonth(agreement,cycle,period){
  const bounds=monthBounds(period),cycleStart=maxDateKey(cycle.startDate,agreement.startDate||cycle.startDate),cycleEnd=cycle.endDate||bounds.end;
  if(cycleStart>bounds.end||cycleEnd<bounds.start)return null;
  const start=maxDateKey(bounds.start,cycleStart),end=minDateKey(bounds.end,cycleEnd),target=Math.max(1,Number(cycle.targetSessions||agreement.packageSize||1)),rate=Number(cycle.amount||agreement.amount||0)/target;
  if(start>end)return null;
  const beforeEnd=addDaysToDateKey(start,-1),actualBefore=beforeEnd>=cycleStart?financeActualSessionsBetween(agreement,cycleStart,beforeEnd):0,actualThrough=financeActualSessionsBetween(agreement,cycleStart,end);
  const plannedBefore=beforeEnd>=cycleStart?scheduledSessionsBetween(agreement,cycleStart,beforeEnd):0,plannedThrough=scheduledSessionsBetween(agreement,cycleStart,end);
  const actualCount=Math.max(0,Math.min(target,actualThrough)-Math.min(target,actualBefore)),plannedCount=Math.max(0,Math.min(target,plannedThrough)-Math.min(target,plannedBefore));
  const actualValue=actualCount*rate,plannedValue=plannedCount*rate,paid=targetPaid(agreement.id,'cycle',cycle.id),earnedBefore=Math.min(target,actualBefore)*rate;
  const settled=Math.min(actualValue,Math.max(0,paid-earnedBefore)),dueDate=financeTargetDueDate(agreement,'cycle',cycle.id),due=Boolean(dueDate&&dueDate<=currentDateKey());
  return {cycle,start,end,actualCount,plannedCount,actualValue,plannedValue,settled,due,dueDate,dueValue:due?Math.max(0,actualValue-settled):0,rate};
}
function financeAgreementMonthData(agreement,period){
  const window=financeAgreementMonthWindow(agreement,period),currentMonth=currentDateKey().slice(0,7),future=period>currentMonth;
  const base={agreement,period,actualCount:0,plannedCount:0,workValue:0,expectedValue:0,settledValue:0,openValue:0,dueValue:0,unassignedCount:0,status:'empty',statusText:'لا توجد حصص',rate:0};
  if(!window)return base;
  const manual=monthCountRecord(agreement.id,period),autoActual=financeActualSessionsBetween(agreement,window.start,window.end),planned=monthSessionCount(agreement,period),actual=manual&&period<=currentMonth?manual.count:autoActual;
  if(agreement.billingModel==='monthly'){
    const rate=Number(agreement.amount||0),workValue=actual*rate,expectedValue=planned*rate,paid=targetPaid(agreement.id,'month',period),settled=Math.min(workValue,paid),dueDate=financeTargetDueDate(agreement,'month',period),due=Boolean(dueDate&&dueDate<=currentDateKey()),targetOutstanding=due?Math.max(0,expectedValue-paid):0;
    let status='running',statusText='حساب جارٍ';
    if(future){status='planned';statusText='مخطط للشهر القادم'}
    else if(!actual&&!planned){status='empty';statusText='لا توجد حصص'}
    else if(workValue>0&&settled>=workValue-.01){status='settled';statusText=paid>workValue?'مدفوع مقدمًا':'تمت التسوية'}
    else if(targetOutstanding>0){status='due';statusText=agreement.paymentTiming==='advance'?'مستحق مقدمًا':'مستحق للتحصيل'}
    return {...base,actualCount:actual,plannedCount:planned,workValue,expectedValue,settledValue:settled,openValue:Math.max(0,workValue-settled),dueValue:targetOutstanding,status,statusText,rate,paid,targetOutstanding};
  }
  const defaultRate=Number(agreement.packageSize||0)>0?Number(agreement.amount||0)/Number(agreement.packageSize):0,cycles=agreementCycles(agreement.id).slice().sort((a,b)=>a.startDate.localeCompare(b.startDate)),portions=cycles.map(cycle=>financeCyclePortionForMonth(agreement,cycle,period)).filter(Boolean);
  const coveredActual=portions.reduce((sum,item)=>sum+item.actualCount,0),coveredPlanned=portions.reduce((sum,item)=>sum+item.plannedCount,0),unassignedCount=Math.max(0,actual-coveredActual),unassignedPlanned=Math.max(0,planned-coveredPlanned);
  const workValue=portions.reduce((sum,item)=>sum+item.actualValue,0)+unassignedCount*defaultRate,expectedValue=portions.reduce((sum,item)=>sum+item.plannedValue,0)+unassignedPlanned*defaultRate,settled=portions.reduce((sum,item)=>sum+item.settled,0),dueValue=portions.reduce((sum,item)=>sum+item.dueValue,0);
  let status='running',statusText='ضمن باقة جارية';
  if(future){status='planned';statusText='مخطط للشهر القادم'}
  else if(!actual&&!planned){status='empty';statusText='لا توجد حصص'}
  else if(unassignedCount>0){status='needs-cycle';statusText='ابدأ رصيدًا جديدًا'}
  else if(workValue>0&&settled>=workValue-.01){status='settled';statusText='تمت التسوية'}
  else if(dueValue>0){status='due';statusText='مستحق للتحصيل'}
  return {...base,actualCount:actual,plannedCount:planned,workValue,expectedValue,settledValue:settled,openValue:Math.max(0,workValue-settled),dueValue,unassignedCount,status,statusText,rate:defaultRate,portions};
}
function financeMonthOverview(period){
  const accounts=finance.agreements.filter(item=>item.direction==='income'&&item.startDate<=monthBounds(period).end),rows=accounts.map(agreement=>financeAgreementMonthData(agreement,period)),currencies=new Map();
  const ensure=code=>{if(!currencies.has(code))currencies.set(code,{currency:code,work:0,settled:0,open:0,cash:0,expected:0});return currencies.get(code)};
  rows.forEach(row=>{const item=ensure(row.agreement.currency);item.work+=row.workValue;item.settled+=row.settledValue;item.open+=row.openValue;item.expected+=row.expectedValue});
  finance.payments.filter(payment=>payment.date.slice(0,7)===period).forEach(payment=>{const agreement=finance.agreements.find(item=>item.id===payment.agreementId);if(agreement?.direction==='income')ensure(payment.currency).cash+=payment.amount});
  const actualCount=rows.reduce((sum,row)=>sum+row.actualCount,0),plannedCount=rows.reduce((sum,row)=>sum+row.plannedCount,0);
  return {rows,currencies:[...currencies.values()].sort((a,b)=>a.currency==='EGP'?-1:b.currency==='EGP'?1:a.currency.localeCompare(b.currency)),actualCount,plannedCount};
}
function financeRenderMonthTabs(){
  const box=document.getElementById('financeMonthTabs');if(!box)return;
  const periods=[financeMonthShift(selectedFinanceMonth,-1),selectedFinanceMonth,financeMonthShift(selectedFinanceMonth,1)];
  box.innerHTML=periods.map(period=>`<button type="button" class="finance-v3-month-tab${period===selectedFinanceMonth?' active':''}" onclick="changeFinanceMonth('${period}')"><small>${esc(financeMonthRelation(period))}</small><strong>${esc(monthLabel(period))}</strong></button>`).join('');
}
function financeRenderSummary(overview){
  const box=document.getElementById('financeMonthSummary');if(!box)return;
  if(!overview.currencies.length){box.innerHTML='<div class="finance-v3-empty"><strong>لا توجد حسابات لهذا الشهر</strong>أضف حسابًا ماليًا واربطه بحصصك، وسيبدأ التقسيم الشهري تلقائيًا.</div>';return}
  box.innerHTML=overview.currencies.map(row=>`<article class="finance-v3-summary-card${row.currency==='EGP'?' primary':''}"><header class="finance-v3-summary-head"><strong>${esc(currencyLabel(row.currency))}</strong><span class="finance-v3-summary-code">${esc(row.currency)}</span></header><div class="finance-v3-summary-grid"><div class="finance-v3-metric"><small>قيمة حصص الشهر</small><strong>${esc(formatMoney(row.work,row.currency))}</strong></div><div class="finance-v3-metric settled"><small>تمت تسويته من الشهر</small><strong>${esc(formatMoney(row.settled,row.currency))}</strong></div><div class="finance-v3-metric open"><small>غير مسوّى من قيمة الشهر</small><strong>${esc(formatMoney(row.open,row.currency))}</strong></div><div class="finance-v3-metric cash"><small>قبضته فعليًا خلال الشهر</small><strong>${esc(formatMoney(row.cash,row.currency))}</strong></div></div></article>`).join('');
}
function financeLinkedLessonsText(agreement){
  const linked=agreementLessons(agreement);if(!linked.length)return 'غير مرتبط بحصة';
  const names=linked.slice(0,2).map(item=>item.name||'بدون اسم');return linked.length>2?`${names.join('، ')} +${linked.length-2}`:names.join('، ');
}
function financeAccountMonthMarkup(data){
  const a=data.agreement,color=financeSourceColor(a),future=data.period>currentDateKey().slice(0,7),countLabel=future?`${data.plannedCount} مجدولة`:(data.plannedCount>data.actualCount?`${data.actualCount} تمت من ${data.plannedCount}`:`${data.actualCount} حصة`),value=data.workValue||(!future?0:data.expectedValue),valueLabel=future?'القيمة المتوقعة':'قيمة الشهر';
  let progress='';
  if(a.billingModel==='package'){
    const cycle=openAgreementCycle(a.id)||agreementCycles(a.id)[0],count=cycle?cycleSessionCount(a,cycle):0,target=cycle?.targetSessions||a.packageSize,pct=Math.min(100,target?count/target*100:0);
    progress=`<div class="finance-v3-progress"><div class="finance-v3-progress-top"><span>الرصيد الجاري</span><span>${count} / ${target} حصة</span></div><div class="finance-v3-progress-track"><div class="finance-v3-progress-fill" style="width:${pct}%"></div></div></div>`;
  }
  const rateText=a.billingModel==='package'?`${formatMoney(data.rate,a.currency)} للحصة`:`${formatMoney(a.amount,a.currency)} للحصة`;
  const note=future?`المتوقع حسب جدول ${esc(monthLabel(data.period))}.`:`${data.actualCount?`تم احتساب ${data.actualCount} حصة في ${esc(monthLabel(data.period))}.`:'لا توجد حصص محتسبة حتى الآن.'}${data.plannedCount>data.actualCount?` والمتبقي في الجدول ${data.plannedCount-data.actualCount} حصة.`:''}`;
  const currentCycle=a.billingModel==='package'?(openAgreementCycle(a.id)||agreementCycles(a.id)[0]):null,canStart=Boolean(currentCycle&&cycleSessionCount(a,currentCycle)>=currentCycle.targetSessions);
  const mainAction=data.dueValue>0?`<button type="button" class="main" onclick="openFinancePayment('${a.id}')">تسجيل التحصيل</button>`:'';
  const cycleAction=canStart?`<button type="button" class="warning" onclick="startNewPackageCycle('${a.id}')">بدء الرصيد التالي</button>`:'';
  return `<article class="finance-v3-account" style="--account-color:${color}"><div class="finance-v3-account-top"><div><div class="finance-v3-account-name">${esc(a.name||'حساب بدون اسم')}</div><div class="finance-v3-account-sub">${esc(financeLinkedLessonsText(a))}</div></div><span class="finance-v3-status ${data.status}">${esc(data.statusText)}</span></div><div class="finance-v3-account-tags"><span>${esc(a.billingModel==='package'?`باقة ${a.packageSize} حصة`:'شهري بالحصة')}</span><span class="timing">${esc(timingLabel(a.paymentTiming))}</span><span>${esc(rateText)}</span></div><div class="finance-v3-account-metrics"><div class="finance-v3-account-metric"><small>حصص الشهر</small><strong>${esc(countLabel)}</strong></div><div class="finance-v3-account-metric"><small>${esc(valueLabel)}</small><strong class="money">${esc(formatMoney(value,a.currency))}</strong></div><div class="finance-v3-account-metric settled"><small>المسوّى من الشهر</small><strong class="money">${esc(formatMoney(data.settledValue,a.currency))}</strong></div></div>${progress}<div class="finance-v3-account-note">${note}</div><div class="finance-v3-account-actions">${mainAction}${cycleAction}<button type="button" onclick="openFinanceAgreement('${a.id}')">تفاصيل الحساب</button></div></article>`;
}
function financeRenderAccounts(overview){
  const box=document.getElementById('financeMonthAccounts'),count=document.getElementById('financeAccountCount');if(!box)return;
  const visible=overview.rows.filter(row=>row.actualCount>0||row.plannedCount>0||row.workValue>0||row.expectedValue>0);
  if(count)count.textContent=`${visible.length} حساب${visible.length===1?'':'ات'}`;
  box.innerHTML=visible.length?visible.map(financeAccountMonthMarkup).join(''):'<div class="finance-v3-empty"><strong>لا توجد حصص في هذا الشهر</strong>انتقل إلى شهر آخر أو أضف حسابًا ماليًا مرتبطًا بحصصك.</div>';
}
function financeDueMonthChips(target){
  const a=target.agreement;
  if(target.targetType==='month')return `<span>${esc(monthLabel(target.targetKey))} · ${monthSessionCount(a,target.targetKey)} حصة</span>`;
  const cycle=target.cycle;if(!cycle)return '';
  const end=cycleCompletionDate(a,cycle)||cycle.endDate||currentDateKey(),periods=monthKeysBetween(cycle.startDate.slice(0,7),end.slice(0,7));
  return periods.map(period=>{const portion=financeCyclePortionForMonth(a,cycle,period);return portion&&portion.actualCount?`<span>${esc(monthLabel(period))}: ${portion.actualCount} حصة · ${esc(formatMoney(portion.actualValue,a.currency))}</span>`:''}).join('');
}
function financeRenderDues(){
  const box=document.getElementById('financeOpenDues');if(!box)return;
  const targets=finance.agreements.filter(item=>item.direction==='income').flatMap(agreement=>agreementDueTargets(agreement).map(target=>({...target,agreement}))).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  if(!targets.length){box.innerHTML='<div class="finance-v3-empty"><strong>لا توجد مستحقات مفتوحة</strong>أي مبلغ يستحق ولم يُحصّل سيظل ظاهرًا هنا تلقائيًا.</div>';return}
  box.innerHTML=targets.map(target=>`<article class="finance-v3-due"><div class="finance-v3-due-top"><div><div class="finance-v3-due-name">${esc(target.agreement.name||'حساب مالي')}</div><div class="finance-v3-due-meta">استحق ${esc(financeDateLabel(target.dueDate))} · ${esc(timingLabel(target.agreement.paymentTiming))}</div></div><div class="finance-v3-due-amount">${esc(formatMoney(target.remaining,target.agreement.currency))}</div></div><div class="finance-v3-due-months">${financeDueMonthChips(target)}</div><div class="finance-v3-due-actions"><button type="button" onclick="openFinancePayment('${target.agreement.id}')">تسجيل التحصيل</button></div></article>`).join('');
}
function financeCashTargetLabel(payment,agreement){
  if(payment.targetType==='month'&&validMonthKey(payment.targetKey))return `يخص ${monthLabel(payment.targetKey)}`;
  const cycle=finance.cycles.find(item=>item.id===payment.targetKey&&item.agreementId===agreement.id);if(!cycle)return 'رصيد حصص';
  const end=cycleCompletionDate(agreement,cycle)||cycle.endDate||currentDateKey(),periods=monthKeysBetween(cycle.startDate.slice(0,7),end.slice(0,7));
  return periods.length?`رصيد امتد عبر ${periods.map(monthLabel).join('، ')}`:'رصيد حصص';
}
function financeRenderCash(){
  const box=document.getElementById('financeCashList');if(!box)return;
  const payments=finance.payments.filter(item=>item.date.slice(0,7)===selectedFinanceMonth).map(payment=>({payment,agreement:finance.agreements.find(item=>item.id===payment.agreementId)})).filter(item=>item.agreement?.direction==='income').sort((a,b)=>b.payment.date.localeCompare(a.payment.date)||b.payment.createdAt.localeCompare(a.payment.createdAt));
  if(!payments.length){box.innerHTML='<div class="finance-v3-empty"><strong>لا يوجد تحصيل نقدي مسجل</strong>يمكن أن تكون قيمة حصص الشهر موجودة حتى لو لم تقبضها بعد.</div>';return}
  box.innerHTML=payments.map(({payment,agreement})=>`<article class="finance-v3-cash-item"><div class="finance-v3-cash-top"><div><div class="finance-v3-cash-name">${esc(agreement.name||'حساب مالي')}</div><div class="finance-v3-cash-meta">${esc(financeDateLabel(payment.date))} · ${esc(paymentMethodLabel(payment.method))}<br>${esc(financeCashTargetLabel(payment,agreement))}</div></div><div class="finance-v3-cash-amount">${esc(formatMoney(payment.amount,payment.currency))}</div></div>${payment.note?`<div class="finance-v3-cash-meta">${esc(payment.note)}</div>`:''}<button type="button" class="payment-remove" onclick="deleteFinancePayment('${payment.id}')">حذف التحصيل</button></article>`).join('');
}
renderFinance=function(){
  if(currentSection!=='finance'&&!document.getElementById('financeView'))return;
  if(!validMonthKey(selectedFinanceMonth))selectedFinanceMonth=currentDateKey().slice(0,7);
  const hiddenMonth=document.getElementById('financeMonth');if(hiddenMonth)hiddenMonth.value=selectedFinanceMonth;
  const overview=financeMonthOverview(selectedFinanceMonth),title=document.getElementById('financeMonthTitle'),subtitle=document.getElementById('financeMonthSubtitle');
  if(title)title.textContent=monthLabel(selectedFinanceMonth);
  if(subtitle){
    const relation=financeMonthRelation(selectedFinanceMonth),counts=selectedFinanceMonth>currentDateKey().slice(0,7)?`${overview.plannedCount} حصة مجدولة`:`${overview.actualCount} حصة تمت${overview.plannedCount>overview.actualCount?` من ${overview.plannedCount} مجدولة`:''}`;
    subtitle.textContent=`${relation} · ${counts}`;
  }
  financeRenderMonthTabs();financeRenderSummary(overview);financeRenderAccounts(overview);financeRenderDues();financeRenderCash();
};
'''

if 'Finance rebuild v28 — month-first accounting' in text:
    raise SystemExit('finance v28 js already present')
last_script = text.rfind('</script>')
if last_script < 0:
    raise SystemExit('script end not found')
text = text[:last_script] + js + '\n' + text[last_script:]
text = text.replace('currentSection==="finance"?"＋ تسجيل دفعة":"＋ إضافة حصة"','currentSection==="finance"?"＋ تسجيل تحصيل":"＋ إضافة حصة"')
INDEX.write_text(text, encoding='utf-8')

sw = Path('sw.js')
sw_text = sw.read_text(encoding='utf-8')
sw_text = re.sub(r'const CACHE_NAME="mawaeidi-shell-v\d+";', 'const CACHE_NAME="mawaeidi-shell-v28";', sw_text, count=1)
sw.write_text(sw_text, encoding='utf-8')
