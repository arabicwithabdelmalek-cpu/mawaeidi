(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.MawaeidiSmartToday=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const INACTIVE_STATUSES=new Set(["cancelled_unpaid","cancelled_counted","rescheduled"]);
  const DONE_STATUSES=new Set(["completed","free"]);
  const REMAINING_STATUSES=new Set(["upcoming","ongoing"]);
  const arabicNumber=new Intl.NumberFormat("ar-EG");

  function safeMinutes(value){
    const number=Number(value);
    return Number.isFinite(number)?Math.max(0,Math.round(number)):0;
  }

  function formatDuration(minutes){
    const total=safeMinutes(minutes);
    if(total<60)return `${arabicNumber.format(total)} دقيقة`;
    const hours=Math.floor(total/60),rest=total%60;
    const hourText=hours===1?"ساعة":hours===2?"ساعتان":`${arabicNumber.format(hours)} ساعات`;
    return rest?`${hourText} و${arabicNumber.format(rest)} دقيقة`:hourText;
  }

  function remainingTitle(count){
    const value=safeMinutes(count);
    if(value===0)return "أنجزت حصص اليوم";
    if(value===1)return "باقي لك حصة واحدة";
    if(value===2)return "باقي لك حصتان";
    return `باقي لك ${arabicNumber.format(value)} حصص`;
  }

  function buildDayState(items,nowMinutes){
    const now=safeMinutes(nowMinutes);
    const normalized=(Array.isArray(items)?items:[]).map((item,index)=>({
      ...item,
      index,
      timeMinutes:safeMinutes(item?.timeMinutes),
      duration:Math.max(1,safeMinutes(item?.duration)||60),
      status:String(item?.status||"upcoming")
    }));
    const active=normalized.filter(item=>!INACTIVE_STATUSES.has(item.status));
    const remaining=active.filter(item=>REMAINING_STATUSES.has(item.status));
    const completed=active.filter(item=>DONE_STATUSES.has(item.status));
    const ongoing=remaining.filter(item=>item.status==="ongoing");
    const upcoming=remaining.filter(item=>item.status==="upcoming")
      .sort((a,b)=>a.timeMinutes-b.timeMinutes||a.index-b.index);
    const next=(ongoing.sort((a,b)=>a.timeMinutes-b.timeMinutes||a.index-b.index)[0]||upcoming[0]||null);
    let title="يوم هادئ بلا حصص";
    let note="يمكنك إضافة موعد جديد أو مراجعة جدول الأسبوع.";
    if(active.length){
      title=remainingTitle(remaining.length);
      if(ongoing.length)note="لديك حصة جارية الآن؛ يمكنك تحديث حالتها مباشرة.";
      else if(next)note=`الحصة التالية الساعة ${String(next.displayTime||next.time||"").trim()}.`;
      else note=completed.length?"رائع، انتهيت من جدول اليوم.":"لا توجد حصص متبقية اليوم.";
    }
    return {
      total:active.length,
      remaining:remaining.length,
      completed:completed.length,
      ongoing:ongoing.length,
      next,
      title,
      note,
      now
    };
  }

  function countdownLabel(item,nowMinutes){
    if(!item)return "";
    const now=safeMinutes(nowMinutes),start=safeMinutes(item.timeMinutes),duration=Math.max(1,safeMinutes(item.duration)||60);
    if(item.status==="ongoing"||now>=start&&now<start+duration){
      const left=Math.max(1,start+duration-now);
      return `جارية الآن · يتبقى ${formatDuration(left)}`;
    }
    const wait=start-now;
    if(wait<=1)return "تبدأ الآن";
    return `تبدأ بعد ${formatDuration(wait)}`;
  }

  return Object.freeze({buildDayState,countdownLabel,formatDuration});
});
