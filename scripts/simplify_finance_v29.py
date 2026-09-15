from pathlib import Path

index = Path('index.html')
text = index.read_text(encoding='utf-8')

if 'finance-simple-v29' in text:
    raise SystemExit('finance v29 already present')

new_html = r'''    <section id="financeView" class="finance-simple-v29" aria-labelledby="financeHeading" hidden>
      <header class="fin29-head">
        <div>
          <span class="fin29-kicker">المالية</span>
          <h2 id="financeHeading">حساب الحصص</h2>
          <p>اختَر الشهر، وسترى عدد الحصص وقيمتها لكل طالب. الموقع يتولى الحسابات في الخلفية.</p>
        </div>
        <div class="fin29-head-actions">
          <button type="button" class="fin29-primary" onclick="openSimpleFinancePayment()">＋ تسجيل قبض</button>
          <button type="button" class="fin29-secondary" onclick="openFinanceAgreement()">⚙ إعداد حساب</button>
        </div>
      </header>

      <nav class="fin29-month-nav" aria-label="التنقل بين الشهور">
        <button type="button" class="fin29-arrow" onclick="financeSimpleMoveMonth(-1)" aria-label="الشهر السابق">›</button>
        <div class="fin29-month-tabs" id="financeSimpleMonthTabs"></div>
        <button type="button" class="fin29-arrow" onclick="financeSimpleMoveMonth(1)" aria-label="الشهر التالي">‹</button>
      </nav>
      <input id="financeMonth" type="month" hidden onchange="changeFinanceMonth(this.value)">

      <section class="fin29-accounts-shell" aria-labelledby="financeSimpleAccountsHeading">
        <div class="fin29-section-head">
          <div>
            <span id="financeSimpleMonthEyebrow">—</span>
            <h3 id="financeSimpleAccountsHeading">الحصص</h3>
          </div>
          <span class="fin29-count" id="financeSimpleAccountCount">0</span>
        </div>
        <div class="fin29-account-list" id="financeSimpleAccounts"></div>
      </section>

      <section class="fin29-summary-shell" aria-labelledby="financeSimpleSummaryHeading">
        <div class="fin29-section-head">
          <div>
            <span>ملخص الشهر</span>
            <h3 id="financeSimpleSummaryHeading">—</h3>
          </div>
          <span class="fin29-ready-count" id="financeSimpleReadyCount">—</span>
        </div>
        <div class="fin29-summary-list" id="financeSimpleSummary"></div>
      </section>
    </section>'''

start = text.find('    <section id="financeView"')
if start < 0:
    raise SystemExit('financeView start not found')
backdrop = text.find('\n<div class="backdrop"', start)
if backdrop < 0:
    raise SystemExit('backdrop marker not found')
end_start = text.rfind('\n    </section>', start, backdrop)
if end_start < 0:
    raise SystemExit('financeView end not found')
end = end_start + len('\n    </section>')
text = text[:start] + new_html + text[end:]

css = r'''
<style id="finance-simple-v29">
/* Finance v29 — deliberately simple, month first */
.finance-simple-v29{--f29-navy:#193F5B;--f29-blue:#2E6782;--f29-green:#397866;--f29-green-bg:#EAF4F0;--f29-gold:#9A742B;--f29-gold-bg:#FAF2E1;--f29-red:#965050;--f29-red-bg:#FCEEEE;--f29-line:#D8E2E8;display:grid;gap:13px;margin-top:16px;animation:page-in .3s ease both}
.fin29-head,.fin29-accounts-shell,.fin29-summary-shell,.fin29-month-nav{border:1px solid var(--f29-line);border-radius:12px;background:#fff;box-shadow:0 5px 16px rgba(17,42,64,.04)}
.fin29-head{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 20px;background:linear-gradient(135deg,#F9FBFC 0%,#FFFFFF 58%,#F2F7F9 100%)}
.fin29-kicker{display:inline-flex;padding:3px 9px;border-radius:999px;background:#EAF1F5;color:#587384;font-size:8.5px;font-weight:900}.fin29-head h2{margin:7px 0 2px;color:var(--f29-navy);font-size:23px}.fin29-head p{margin:0;color:#72828C;font-size:10px;line-height:1.7}
.fin29-head-actions{display:flex;gap:7px;flex-wrap:wrap}.fin29-head-actions button,.fin29-card-actions button,.fin29-due-line button{min-height:36px;padding:8px 11px;border-radius:8px;font:inherit;font-size:9px;font-weight:900;cursor:pointer}.fin29-primary{border:1px solid var(--f29-navy);background:var(--f29-navy);color:#fff}.fin29-secondary{border:1px solid #B9C9D3;background:#fff;color:var(--f29-navy)}
.fin29-month-nav{display:grid;grid-template-columns:38px minmax(0,1fr) 38px;align-items:stretch;gap:8px;padding:9px;background:#F8FAFB}.fin29-arrow{border:1px solid #D5E0E6;border-radius:9px;background:#fff;color:var(--f29-navy);font:inherit;font-size:19px;font-weight:900;cursor:pointer}.fin29-arrow:hover{background:#EFF5F7}.fin29-month-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.fin29-month-tab{min-height:54px;padding:8px 10px;border:1px solid #DCE5EA;border-radius:9px;background:#fff;text-align:center;cursor:pointer}.fin29-month-tab small{display:block;color:#89969E;font-size:7.5px;font-weight:800}.fin29-month-tab strong{display:block;margin-top:2px;color:#587080;font-size:11px;font-weight:900}.fin29-month-tab.active{border-color:#91AFC1;background:#EAF2F6;box-shadow:inset 0 0 0 1px rgba(25,63,91,.04)}.fin29-month-tab.active strong{color:var(--f29-navy)}
.fin29-accounts-shell,.fin29-summary-shell{overflow:hidden}.fin29-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border-bottom:1px solid #E2E9ED;background:#FBFCFD}.fin29-section-head span{color:#7A8A94;font-size:8.5px;font-weight:800}.fin29-section-head h3{margin:3px 0 0;color:var(--f29-navy);font-size:15px}.fin29-count,.fin29-ready-count{display:inline-flex;align-items:center;justify-content:center;min-height:27px;padding:4px 9px;border-radius:999px;background:#EEF3F6;color:#5D7482!important;font-size:8.5px!important;font-weight:900!important;white-space:nowrap}.fin29-ready-count.has-due{background:var(--f29-gold-bg);color:#7B5C20!important}
.fin29-account-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:12px;background:#FCFDFD}.fin29-account{overflow:hidden;border:1px solid #D9E3E8;border-inline-start:4px solid var(--fin29-source,#5E8298);border-radius:10px;background:#fff}.fin29-account-main{padding:13px 14px}.fin29-account-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.fin29-name{font-size:13px;font-weight:900;color:#223641}.fin29-type{margin-top:2px;color:#7A8992;font-size:8px}.fin29-edit{padding:4px 7px;border:0;border-radius:7px;background:#F0F4F6;color:#627987;font:inherit;font-size:8px;font-weight:800;cursor:pointer}.fin29-month-value{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-top:11px;padding:10px 11px;border:1px solid #E0E7EB;border-radius:9px;background:#F8FAFB}.fin29-month-value span{color:#607682;font-size:9px;font-weight:800}.fin29-month-value strong{color:var(--f29-navy);font-size:16px;font-weight:900;direction:ltr}.fin29-preview{margin-top:5px;color:#849199;font-size:8px}
.fin29-package{margin-top:10px;padding:10px 11px;border:1px solid #E2E8EC;border-radius:9px;background:#fff}.fin29-package-head{display:flex;justify-content:space-between;gap:10px;color:#536B79;font-size:8.5px;font-weight:800}.fin29-package-head strong{color:#27495E;font-size:10px}.fin29-progress{height:7px;margin-top:8px;border-radius:999px;background:#E6ECEF;overflow:hidden}.fin29-progress>i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#4C8B7D,#78AA9E)}.fin29-package-months{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.fin29-package-months span{padding:3px 6px;border-radius:999px;background:#F0F4F6;color:#637985;font-size:7.5px;font-weight:800}
.fin29-status{margin-top:10px;padding:9px 10px;border-radius:8px;background:#F3F6F8;color:#5E7380;font-size:8.5px;font-weight:800}.fin29-status strong{color:#2B4A5E}.fin29-status.paid{background:var(--f29-green-bg);color:#4D7563}.fin29-status.paid strong{color:var(--f29-green)}.fin29-status.wait{background:#EEF4F7;color:#527287}.fin29-status.future{background:var(--f29-gold-bg);color:#7B632C}
.fin29-dues{border-top:1px solid #E2E9ED;background:#FFFCF7}.fin29-due-line{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;border-top:1px solid #F0E5CF}.fin29-due-line:first-child{border-top:0}.fin29-due-copy{display:grid;gap:1px}.fin29-due-copy small{color:#8A7449;font-size:7.5px;font-weight:800}.fin29-due-copy strong{color:#6E5320;font-size:11px}.fin29-due-line button{min-height:31px;border:1px solid #B98B38;background:#B98B38;color:#fff;padding:6px 9px}
.fin29-card-actions{display:flex;gap:6px;margin-top:9px}.fin29-card-actions button{min-height:31px;border:1px solid #C5D2DA;background:#fff;color:#5A7280;padding:6px 8px;font-size:8px}.fin29-card-actions .next{border-color:#B7D3C8;background:#EDF6F2;color:#44715E}
.fin29-empty{grid-column:1/-1;padding:26px 15px;text-align:center;color:#7C8B95;font-size:10px}.fin29-empty strong{display:block;margin-bottom:3px;color:#526A78;font-size:11px}
.fin29-summary-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;padding:12px}.fin29-summary-card{overflow:hidden;border:1px solid #D9E3E8;border-radius:10px;background:#fff}.fin29-summary-card-head{display:flex;align-items:center;justify-content:space-between;padding:9px 11px;border-bottom:1px solid #E3E9ED;background:#F6F9FA}.fin29-summary-card-head strong{font-size:10px;color:#385365}.fin29-summary-code{padding:3px 6px;border-radius:6px;background:var(--f29-navy);color:#fff!important;font-size:7.5px!important;direction:ltr}.fin29-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.fin29-summary-metric{padding:10px 11px;border-bottom:1px solid #E4EAEE}.fin29-summary-metric:nth-child(odd){border-inline-end:1px solid #E4EAEE}.fin29-summary-metric:nth-last-child(-n+2){border-bottom:0}.fin29-summary-metric small{display:block;color:#819099;font-size:7.5px;font-weight:800}.fin29-summary-metric strong{display:block;margin-top:4px;color:#294A5E;font-size:14px;font-weight:900;direction:ltr;text-align:right}.fin29-summary-metric.received strong{color:var(--f29-green)}.fin29-summary-metric.open strong{color:var(--f29-red)}.fin29-summary-metric.cash strong{color:#7C6027}
@media(max-width:850px){.fin29-account-list{grid-template-columns:1fr}.fin29-head{align-items:stretch;flex-direction:column}.fin29-head-actions{display:grid;grid-template-columns:1fr 1fr}.fin29-head-actions button{width:100%}}
@media(max-width:560px){.finance-simple-v29{gap:10px}.fin29-head{padding:15px}.fin29-head h2{font-size:20px}.fin29-month-nav{grid-template-columns:31px minmax(0,1fr) 31px;padding:7px;gap:5px}.fin29-month-tabs{gap:5px}.fin29-month-tab{padding:7px 4px;min-height:49px}.fin29-month-tab strong{font-size:9.5px}.fin29-account-list,.fin29-summary-list{padding:9px}.fin29-account-main{padding:11px}.fin29-month-value{align-items:flex-start;flex-direction:column;gap:3px}.fin29-head-actions{grid-template-columns:1fr}.fin29-summary-grid{grid-template-columns:1fr}.fin29-summary-metric{border-inline-end:0!important;border-bottom:1px solid #E4EAEE!important}.fin29-summary-metric:last-child{border-bottom:0!important}.fin29-due-line{align-items:stretch;flex-direction:column}.fin29-due-line button{width:100%}}
</style>
'''
text = text.replace('</head>', css + '\n</head>', 1)

js = r'''

/* finance-simple-v29 */
function financeSimpleShift(period,delta){
  const [year,month]=period.split('-').map(Number),date=new Date(Date.UTC(year,month-1+Number(delta||0),1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}`;
}
function financeSimpleMoveMonth(delta){selectedFinanceMonth=financeSimpleShift(validMonthKey(selectedFinanceMonth)?selectedFinanceMonth:currentDateKey().slice(0,7),delta);renderFinance()}
function financeSimpleSetMonth(period){if(validMonthKey(period)){selectedFinanceMonth=period;renderFinance()}}
function changeFinanceMonth(value){selectedFinanceMonth=validMonthKey(value)?value:currentDateKey().slice(0,7);renderFinance()}
function financeSimpleMonthMode(period){const current=currentDateKey().slice(0,7);return period<current?'past':period>current?'future':'current'}
function financeSimpleTargetLabel(target){
  if(target.targetType==='month')return monthLabel(target.targetKey);
  const cycle=target.cycle||finance.cycles.find(item=>item.id===target.targetKey);
  return cycle?`باقة ${cycle.targetSessions} حصة`:'باقة حصص';
}
function financeSimpleDueTargets(agreement){return agreementDueTargets(agreement,currentDateKey()).filter(item=>item.remaining>0)}
function financeSimpleTargetRemaining(agreement,targetType,targetKey){
  if(targetType==='month'){
    const total=monthSessionCount(agreement,targetKey)*agreement.amount;
    return Math.max(0,total-targetPaid(agreement.id,'month',targetKey));
  }
  const cycle=finance.cycles.find(item=>item.id===targetKey&&item.agreementId===agreement.id);
  return cycle?Math.max(0,cycle.amount-targetPaid(agreement.id,'cycle',cycle.id)):0;
}
function financeSimpleRelevantCycle(agreement,period){
  if(agreement.billingModel!=='package')return null;
  const bounds=monthBounds(period),cycles=agreementCycles(agreement.id);
  return cycles.find(cycle=>{
    const completion=cycle.endDate||cycleCompletionDate(agreement,cycle)||currentDateKey();
    return cycle.startDate<=bounds.end&&completion>=bounds.start;
  })||openAgreementCycle(agreement.id)||cycles[0]||null;
}
function financeSimpleCycleMonths(agreement,cycle){
  if(!cycle)return [];
  const completion=cycle.endDate||cycleCompletionDate(agreement,cycle)||currentDateKey(),startPeriod=cycle.startDate.slice(0,7),endPeriod=completion.slice(0,7),months=monthKeysBetween(startPeriod,endPeriod);
  let used=0;const result=[];
  for(const period of months){
    if(used>=cycle.targetSessions)break;
    const bounds=monthBounds(period),from=maxDateKey(bounds.start,cycle.startDate,agreement.startDate),to=minDateKey(bounds.end,completion);
    if(from>to)continue;
    let count=scheduledSessionsBetween(agreement,from,to);
    count=Math.max(0,Math.min(count,cycle.targetSessions-used));
    if(count){result.push({period,count});used+=count}
  }
  return result;
}
function financeSimpleAccountCard(agreement,row,period){
  const mode=financeSimpleMonthMode(period),future=mode==='future',count=future?row.plannedCount:row.actualCount,value=future?row.expectedValue:row.workValue,dues=financeSimpleDueTargets(agreement),color=financeSourceColor(agreement),cycle=financeSimpleRelevantCycle(agreement,period),rate=row.rate||((agreement.billingModel==='package'&&agreement.packageSize)?agreement.amount/agreement.packageSize:agreement.amount),linked=agreementLessons(agreement);
  const countLabel=future?`${count} حصة متوقعة`:`${count} حصة`;
  const valueLabel=future?'القيمة المتوقعة':'قيمة حصص الشهر';
  let packageBlock='';
  if(agreement.billingModel==='package'&&cycle){
    const progress=Math.min(cycle.targetSessions,cycleSessionCount(agreement,cycle)),remaining=Math.max(0,cycle.targetSessions-progress),pct=cycle.targetSessions?Math.min(100,progress/cycle.targetSessions*100):0,parts=financeSimpleCycleMonths(agreement,cycle);
    packageBlock=`<div class="fin29-package"><div class="fin29-package-head"><span>الباقة: <strong>${cycle.targetSessions} حصة = ${esc(formatMoney(cycle.amount,agreement.currency))}</strong></span><span>${progress} / ${cycle.targetSessions}</span></div><div class="fin29-progress"><i style="width:${pct}%"></i></div>${parts.length?`<div class="fin29-package-months">${parts.map(part=>`<span>${esc(monthLabel(part.period))}: ${part.count} حصة</span>`).join('')}</div>`:''}${!dues.length&&remaining>0?`<div class="fin29-status wait">باقي <strong>${remaining} حصة</strong> حتى يصبح الحساب جاهزًا للقبض.</div>`:''}</div>`;
  }
  let status='';
  if(!dues.length){
    if(future)status=`<div class="fin29-status future">هذه أرقام متوقعة حسب جدول ${esc(monthLabel(period))}.</div>`;
    else if(value>0&&row.settledValue>=value-.01)status=`<div class="fin29-status paid">✓ تم قبض حساب حصص ${esc(monthLabel(period))}.</div>`;
    else if(value>0&&row.settledValue>0)status=`<div class="fin29-status">تم قبض <strong>${esc(formatMoney(row.settledValue,agreement.currency))}</strong> من قيمة حصص الشهر.</div>`;
    else if(agreement.billingModel==='monthly')status=`<div class="fin29-status wait">${agreement.paymentTiming==='advance'?'الحساب مقدم؛ يظهر زر القبض عند استحقاق الشهر.':'الحساب مؤخر؛ سيصبح جاهزًا للقبض عند نهاية الشهر.'}</div>`;
  }
  const dueBlock=dues.length?`<div class="fin29-dues">${dues.slice(0,3).map(target=>`<div class="fin29-due-line"><div class="fin29-due-copy"><small>جاهز للقبض الآن · ${esc(financeSimpleTargetLabel(target))}</small><strong>${esc(formatMoney(target.remaining,agreement.currency))}</strong></div><button type="button" onclick="openSimpleFinancePayment('${agreement.id}','${target.targetType}','${target.targetKey}')">سجل أني قبضت</button></div>`).join('')}${dues.length>3?`<div class="fin29-status">يوجد ${dues.length-3} حسابات أخرى جاهزة للقبض.</div>`:''}</div>`:'';
  const canStart=agreement.billingModel==='package'&&cycle&&cycleSessionCount(agreement,cycle)>=cycle.targetSessions;
  return `<article class="fin29-account" style="--fin29-source:${color}"><div class="fin29-account-main"><div class="fin29-account-top"><div><div class="fin29-name">${esc(agreement.name||'بدون اسم')}</div><div class="fin29-type">${esc(partyTypeLabel(agreement.partyType))}${linked.length?` · ${linked.length} حصة مرتبطة بالجدول`:''}</div></div><button class="fin29-edit" type="button" onclick="openFinanceAgreement('${agreement.id}')">تعديل</button></div><div class="fin29-month-value"><span>${countLabel} في ${esc(monthLabel(period))}</span><strong>${esc(formatMoney(value,agreement.currency))}</strong></div>${future&&row.actualCount===0?`<div class="fin29-preview">${valueLabel} · ${esc(formatMoney(rate,agreement.currency))} للحصة تقريبًا</div>`:`<div class="fin29-preview">${valueLabel}${rate?` · ${esc(formatMoney(rate,agreement.currency))} للحصة`:''}</div>`}${packageBlock}${status}<div class="fin29-card-actions">${agreement.billingModel==='monthly'?`<button type="button" onclick="openMonthCount('${agreement.id}')">مراجعة عدد الحصص</button>`:`<button type="button" onclick="openPackageCount('${agreement.id}')">مراجعة عدد الحصص</button>`}${canStart?`<button type="button" class="next" onclick="startNewPackageCycle('${agreement.id}')">بدء الباقة التالية</button>`:''}</div></div>${dueBlock}</article>`;
}
function financeSimpleRenderTabs(){
  const box=document.getElementById('financeSimpleMonthTabs');if(!box)return;
  const current=currentDateKey().slice(0,7),period=validMonthKey(selectedFinanceMonth)?selectedFinanceMonth:current;
  box.innerHTML=[-1,0,1].map(offset=>{const key=financeSimpleShift(period,offset),label=offset===0?(key===current?'هذا الشهر':'المحدد'):offset<0?'السابق':'التالي';return `<button type="button" class="fin29-month-tab${offset===0?' active':''}" onclick="financeSimpleSetMonth('${key}')"><small>${label}</small><strong>${esc(monthLabel(key))}</strong></button>`}).join('');
}
function financeSimpleSummaryRows(rows,period){
  const mode=financeSimpleMonthMode(period),currencies=new Map(),ensure=code=>{if(!currencies.has(code))currencies.set(code,{currency:code,value:0,received:0,cash:0});return currencies.get(code)};
  rows.forEach(row=>{const item=ensure(row.agreement.currency),value=mode==='future'?row.expectedValue:row.workValue;item.value+=value;item.received+=Math.min(value,row.settledValue||0)});
  finance.payments.filter(payment=>payment.date.slice(0,7)===period).forEach(payment=>{const agreement=finance.agreements.find(item=>item.id===payment.agreementId);if(agreement?.direction==='income')ensure(payment.currency).cash+=payment.amount});
  return [...currencies.values()].map(item=>({...item,open:Math.max(0,item.value-item.received)}));
}
function financeSimpleRenderSummary(rows,period){
  const box=document.getElementById('financeSimpleSummary'),heading=document.getElementById('financeSimpleSummaryHeading'),ready=document.getElementById('financeSimpleReadyCount');if(!box)return;
  if(heading)heading.textContent=monthLabel(period);
  const allDues=finance.agreements.filter(item=>item.direction==='income'&&item.active).flatMap(agreement=>financeSimpleDueTargets(agreement));
  const readyAccounts=new Set(allDues.map(item=>item.agreement.id)).size;
  if(ready){ready.textContent=readyAccounts?`${readyAccounts} حساب جاهز للقبض`:'لا يوجد حساب جاهز للقبض';ready.classList.toggle('has-due',readyAccounts>0)}
  const summaries=financeSimpleSummaryRows(rows,period),future=financeSimpleMonthMode(period)==='future';
  if(!summaries.length){box.innerHTML='<div class="fin29-empty"><strong>لا توجد أرقام لهذا الشهر</strong>أضف حسابًا ماليًا واربطه بالحصة.</div>';return}
  box.innerHTML=summaries.map(item=>`<article class="fin29-summary-card"><div class="fin29-summary-card-head"><strong>${esc(currencyLabel(item.currency))}</strong><span class="fin29-summary-code">${esc(item.currency)}</span></div><div class="fin29-summary-grid"><div class="fin29-summary-metric"><small>${future?'المتوقع حسب الجدول':'قيمة حصص الشهر'}</small><strong>${esc(formatMoney(item.value,item.currency))}</strong></div><div class="fin29-summary-metric received"><small>${future?'مقبوض مقدمًا':'تم قبض حسابها'}</small><strong>${esc(formatMoney(item.received,item.currency))}</strong></div><div class="fin29-summary-metric open"><small>${future?'غير مقبوض مقدمًا':'لسه ما اتحصلش'}</small><strong>${esc(formatMoney(item.open,item.currency))}</strong></div><div class="fin29-summary-metric cash"><small>قبضته خلال الشهر</small><strong>${esc(formatMoney(item.cash,item.currency))}</strong></div></div></article>`).join('');
}
function renderFinance(){
  const monthInput=document.getElementById('financeMonth');if(!monthInput)return;
  const current=currentDateKey().slice(0,7);if(!validMonthKey(selectedFinanceMonth))selectedFinanceMonth=current;monthInput.value=selectedFinanceMonth;
  financeSimpleRenderTabs();
  const period=selectedFinanceMonth,bounds=monthBounds(period),accounts=finance.agreements.filter(item=>item.direction==='income'&&item.startDate<=bounds.end).sort((a,b)=>a.name.localeCompare(b.name,'ar')),rows=accounts.map(agreement=>financeAgreementMonthData(agreement,period));
  const shown=rows.filter(row=>row.actualCount>0||row.plannedCount>0||financeSimpleDueTargets(row.agreement).length||row.settledValue>0);
  const eyebrow=document.getElementById('financeSimpleMonthEyebrow'),title=document.getElementById('financeSimpleAccountsHeading'),count=document.getElementById('financeSimpleAccountCount'),box=document.getElementById('financeSimpleAccounts');
  if(eyebrow)eyebrow.textContent=financeSimpleMonthMode(period)==='current'?'الشهر الحالي':financeSimpleMonthMode(period)==='past'?'شهر سابق':'شهر قادم';
  if(title)title.textContent=`حصص ${monthLabel(period)}`;
  if(count)count.textContent=`${shown.length} حساب`;
  if(box)box.innerHTML=shown.length?shown.map(row=>financeSimpleAccountCard(row.agreement,row,period)).join(''):'<div class="fin29-empty"><strong>لا توجد حصص مالية في هذا الشهر</strong>يمكنك الانتقال إلى شهر آخر أو إعداد حساب مالي للحصة.</div>';
  financeSimpleRenderSummary(rows,period);
}
function openSimpleFinancePayment(agreementId='',targetType='',targetKey=''){
  const all=finance.agreements.filter(item=>item.direction==='income'&&item.active).flatMap(agreement=>financeSimpleDueTargets(agreement));
  let target=all.find(item=>(!agreementId||item.agreement.id===agreementId)&&(!targetType||item.targetType===targetType)&&(!targetKey||item.targetKey===targetKey));
  if(!target){
    if(agreementId){openToolDialog('تسجيل قبض','لا يوجد مبلغ جاهز لهذا الحساب الآن','<div class="finance-form-note">الحساب لم يصل بعد إلى موعد القبض حسب نظامه الحالي.</div>');return}
    if(!all.length){openToolDialog('تسجيل قبض','لا يوجد مبلغ جاهز للقبض الآن','<div class="finance-form-note">عندما تكتمل باقة أو يحين موعد حساب شهري سيظهر هنا تلقائيًا.</div>');return}
    if(all.length>1){openToolDialog('ماذا قبضت؟','اختر الحساب الجاهز للقبض',`<div class="fin29-payment-picks">${all.map(item=>`<button type="button" onclick="openSimpleFinancePayment('${item.agreement.id}','${item.targetType}','${item.targetKey}')"><span>${esc(item.agreement.name)}</span><strong>${esc(formatMoney(item.remaining,item.agreement.currency))}</strong><small>${esc(financeSimpleTargetLabel(item))}</small></button>`).join('')}</div>`);return}
    target=all[0];
  }
  const agreement=target.agreement,methods=['vodafone_cash','instapay','bank','paypal','wise','cash','other'];
  openToolDialog('سجل أني قبضت',`${agreement.name} · ${financeSimpleTargetLabel(target)}`,`<div class="finance-form"><div class="finance-calculation"><div><small>المبلغ الجاهز للقبض</small><strong>${esc(formatMoney(target.remaining,agreement.currency))}</strong></div></div><div class="finance-form-grid"><div class="field"><label for="fin29PaidAmount">قبضت كام؟</label><input id="fin29PaidAmount" type="number" inputmode="decimal" min="0.01" step="0.01" value="${target.remaining}"></div><div class="field"><label for="fin29PaidDate">تاريخ القبض</label><input id="fin29PaidDate" type="date" value="${currentDateKey()}"></div><div class="field full"><label for="fin29PaidMethod">طريقة القبض</label><select id="fin29PaidMethod">${methods.map(method=>`<option value="${method}" ${agreement.paymentMethod===method?'selected':''}>${esc(paymentMethodLabel(method))}</option>`).join('')}</select></div></div><div class="finance-dialog-actions"><button type="button" class="save" onclick="saveSimpleFinancePayment('${agreement.id}','${target.targetType}','${target.targetKey}')">حفظ القبض</button><button type="button" class="cancel" onclick="closeToolDialog()">إلغاء</button></div></div>`);
}
async function saveSimpleFinancePayment(agreementId,targetType,targetKey){
  const agreement=finance.agreements.find(item=>item.id===agreementId);if(!agreement)return;
  const amount=Number(document.getElementById('fin29PaidAmount')?.value),date=document.getElementById('fin29PaidDate')?.value,method=document.getElementById('fin29PaidMethod')?.value,remaining=financeSimpleTargetRemaining(agreement,targetType,targetKey);
  if(!Number.isFinite(amount)||amount<=0){alert('اكتب المبلغ الذي قبضته.');return}
  if(amount>remaining+.01){alert(`المبلغ أكبر من المتبقي لهذا الحساب (${formatMoney(remaining,agreement.currency)}).`);return}
  if(!validDateKey(date)){alert('اختر تاريخ القبض.');return}
  const previous=cloneFinanceState();finance.payments.push({id:makeId(),agreementId,targetType,targetKey,amount:normalizeMoney(amount),currency:agreement.currency,date,method:FINANCE_METHODS.includes(method)?method:(agreement.paymentMethod||'bank'),note:'',createdAt:new Date().toISOString()});
  await commitFinance(previous);
}
function handlePrimaryAction(){if(currentSection==='finance')openSimpleFinancePayment();else if(currentSection==='schedule')openNew()}
function updateSectionChrome(){
  document.getElementById('scheduleWorkspace').hidden=currentSection!=='schedule';
  document.getElementById('worldClockView').hidden=currentSection!=='world';
  document.getElementById('financeView').hidden=currentSection!=='finance';
  document.querySelectorAll('.workspace-switch button').forEach(item=>{const active=(currentSection==='schedule'&&item.id==='scheduleSectionButton')||(currentSection==='world'&&item.id==='worldClockSectionButton')||(currentSection==='finance'&&item.id==='financeSectionButton');item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});
  const primary=document.getElementById('primaryActionButton');primary.hidden=currentSection==='world';if(currentSection!=='world')primary.textContent=currentSection==='finance'?'＋ تسجيل قبض':'＋ إضافة حصة';
  if(currentSection!=='world'&&worldClockInterval){clearInterval(worldClockInterval);worldClockInterval=null}
}
'''
script_end = text.rfind('</script>')
if script_end < 0:
    raise SystemExit('script end not found')
text = text[:script_end] + js + '\n' + text[script_end:]
index.write_text(text, encoding='utf-8')

sw = Path('sw.js')
sw_text = sw.read_text(encoding='utf-8')
if 'mawaeidi-shell-v28' in sw_text:
    sw_text = sw_text.replace('mawaeidi-shell-v28','mawaeidi-shell-v29')
elif 'mawaeidi-shell-v29' not in sw_text:
    raise SystemExit('unexpected service worker cache version')
sw.write_text(sw_text, encoding='utf-8')
print('finance v29 simplified')
