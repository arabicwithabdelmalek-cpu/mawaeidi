/* Mawaeidi weekday display order: no lesson data or actual dates are changed. */
(()=>{
'use strict';
const DAYS=['الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت','الأحد'];
const KEY='mawaeidi-week-day-order-v1:';
const valid=a=>Array.isArray(a)&&a.length===7&&new Set(a).size===7&&a.every(day=>DAYS.includes(day));
const storageKey=()=>KEY+(typeof currentUser!=='undefined'&&currentUser?.id||'guest');
function order(){try{const a=JSON.parse(localStorage.getItem(storageKey()));return valid(a)?a:[...DAYS]}catch{return [...DAYS]}}
function arrange(){
 const grid=document.getElementById('weekGrid');if(!grid)return;
 const arrangement=order();
 grid.querySelectorAll('.week-grid-row').forEach(row=>{
   const cells=[...row.children];if(cells.length!==8)return;
   const byDay=new Map();
   cells.slice(1).forEach(cell=>{
     const day=cell.dataset.weekDay||cell.querySelector('.week-day-label > span')?.textContent?.trim();
     if(DAYS.includes(day))byDay.set(day,cell);
   });
   if(byDay.size===7)row.replaceChildren(cells[0],...arrangement.map(day=>byDay.get(day)));
 });
}
function save(a){
 if(!valid(a))return false;
 try{localStorage.setItem(storageKey(),JSON.stringify(a))}catch{return false}
 arrange();return true;
}
let draft=[];
function listHTML(){return draft.map((day,i)=>`<div class="day-order-row" data-day="${day}" draggable="true"><button type="button" class="day-order-grip" title="اسحب لتغيير موضع اليوم" aria-label="اسحب ${day}">⠿</button><span class="day-order-number">${i+1}</span><strong>${day}</strong><span class="day-order-arrows"><button type="button" data-move="up" aria-label="تحريك ${day} لأعلى" ${i===0?'disabled':''}>↑</button><button type="button" data-move="down" aria-label="تحريك ${day} لأسفل" ${i===6?'disabled':''}>↓</button></span></div>`).join('')}
function paint(){const node=document.getElementById('dayOrderList');if(node)node.innerHTML=listHTML()}
function message(value){const node=document.getElementById('dayOrderStatus');if(node)node.textContent=value}
function store(){message(save(draft)?'تم حفظ الترتيب على هذا الجهاز.':'تعذّر حفظ الترتيب في المتصفح.');paint()}
function move(from,to){if(!draft.includes(from)||!draft.includes(to)||from===to)return;draft.splice(draft.indexOf(from),1);draft.splice(draft.indexOf(to),0,from);store()}
function openEditor(){
 draft=order();
 openToolDialog('ترتيب أيام الأسبوع','اسحب الأيام أو استخدم السهمين. يتغير ترتيب العرض فقط، من غير نقل أي حصة أو تعديل تاريخها.',`<div id="dayOrderList" class="day-order-list" aria-label="الأيام بالترتيب"></div><div id="dayOrderStatus" class="day-order-status" role="status" aria-live="polite"></div><div class="day-order-footer"><button type="button" id="dayOrderReset" class="day-order-reset">الترتيب الأصلي</button><button type="button" id="dayOrderDone" class="day-order-done">تم</button></div>`);
 paint();const list=document.getElementById('dayOrderList');
 list.addEventListener('click',e=>{const btn=e.target.closest('button[data-move]');if(!btn)return;const from=btn.closest('[data-day]')?.dataset.day,i=draft.indexOf(from),n=i+(btn.dataset.move==='up'?-1:1);if(i>=0&&n>=0&&n<7)move(from,draft[n])});
 let dragging=null;
 const clear=()=>list.querySelectorAll('.day-order-target,.day-order-dragging').forEach(el=>el.classList.remove('day-order-target','day-order-dragging'));
 list.addEventListener('dragstart',e=>{const row=e.target.closest('.day-order-row');if(!row)return;dragging=row.dataset.day;row.classList.add('day-order-dragging');if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragging)}});
 list.addEventListener('dragover',e=>{if(!dragging)return;const row=e.target.closest('.day-order-row');if(!row)return;e.preventDefault();clear();row.classList.add('day-order-target')});
 list.addEventListener('drop',e=>{if(!dragging)return;e.preventDefault();const to=e.target.closest('.day-order-row')?.dataset.day;const from=dragging;dragging=null;clear();if(to)move(from,to)});
 list.addEventListener('dragend',()=>{dragging=null;clear()});
 // Pointer gestures work on touchscreens; arrows remain available for accessibility.
 let touch=null;
 list.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;const grip=e.target.closest('.day-order-grip');if(!grip)return;touch={id:e.pointerId,from:grip.closest('.day-order-row').dataset.day,to:null};grip.setPointerCapture?.(e.pointerId)});
 list.addEventListener('pointermove',e=>{if(!touch||touch.id!==e.pointerId)return;const row=document.elementFromPoint(e.clientX,e.clientY)?.closest('.day-order-row');clear();if(row&&list.contains(row)){row.classList.add('day-order-target');touch.to=row.dataset.day}});
 const finish=e=>{if(!touch||touch.id!==e.pointerId)return;const {from,to}=touch;touch=null;clear();if(e.type!=='pointercancel'&&to)move(from,to)};
 list.addEventListener('pointerup',finish);list.addEventListener('pointercancel',finish);
 document.getElementById('dayOrderReset').addEventListener('click',()=>{draft=[...DAYS];store()});
 document.getElementById('dayOrderDone').addEventListener('click',()=>closeToolDialog());
}
function setup(){
 const nav=document.querySelector('#weekView .week-navigation');if(!nav||document.getElementById('dayOrderOpen'))return;
 const style=document.createElement('style');style.id='dayOrderStyles';style.textContent=`
.week-navigation .day-order-open{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#EAF2F7;color:var(--primary);border-color:#91B0C5;font-weight:800;white-space:nowrap}
.day-order-list{display:grid;gap:8px;margin:12px 0}.day-order-row{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid var(--line);border-radius:11px;background:white}.day-order-row.day-order-target{background:#EAF2F7;border-color:var(--primary);box-shadow:inset 0 0 0 1px var(--primary)}.day-order-row.day-order-dragging{opacity:.55}.day-order-grip{flex:0 0 38px;height:40px;touch-action:none;cursor:grab;font-size:22px;color:var(--primary);background:#F5F8FA;border:1px solid var(--line);border-radius:8px}.day-order-row strong{flex:1;font-size:14px}.day-order-number{display:grid;place-items:center;width:25px;height:25px;background:#EAF0F4;border-radius:7px;font-size:11px;color:var(--primary)}.day-order-arrows{display:flex;gap:5px}.day-order-arrows button{width:36px;height:36px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--primary);font-size:17px}.day-order-arrows button:disabled{opacity:.3}.day-order-status{min-height:19px;color:var(--teach);font-size:11px}.day-order-footer{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:13px;border-top:1px solid var(--line)}.day-order-footer button{padding:10px 14px;border-radius:8px;font-weight:800}.day-order-reset{background:#fff;border:1px solid var(--line);color:var(--muted)}.day-order-done{background:var(--primary);color:#fff;border:0}
@media(max-width:760px){.week-navigation{flex-wrap:wrap}.week-navigation .day-order-open{flex:1 0 100%;min-height:37px}.day-order-row{gap:6px;padding:8px}.day-order-row strong{font-size:13px}}
`;document.head.appendChild(style);
 const btn=document.createElement('button');btn.id='dayOrderOpen';btn.type='button';btn.className='day-order-open';btn.textContent='☷ ترتيب الأيام';btn.setAttribute('aria-label','تغيير ترتيب أعمدة أيام الجدول');btn.addEventListener('click',openEditor);nav.appendChild(btn);
}
// Keep the canonical days array intact: date arithmetic and individual lesson drag/drop are untouched.
const original=window.renderWeek;
if(typeof original==='function')window.renderWeek=function(...args){const result=original.apply(this,args);setup();arrange();return result};
setup();arrange();
})();