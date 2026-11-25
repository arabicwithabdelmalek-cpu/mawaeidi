import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
const auth='https://ep-withered-scene-bh3isds4.neonauth.c-10.eu-central-1.aws.neon.tech/neondb/auth';
const api='https://ep-withered-scene-bh3isds4.apirest.c-10.eu-central-1.aws.neon.tech/neondb/rest/v1';
const origin='https://arabicwithabdelmalek-cpu.github.io';
const nonce=randomUUID();
async function call(url,options={}) {
  const response=await fetch(url,{...options,headers:{Origin:origin,'Content-Type':'application/json',...(options.headers||{})},signal:AbortSignal.timeout(25000)});
  const body=await response.text();
  let data;try{data=JSON.parse(body)}catch{data=null}
  return {response,data};
}
function ok(r,label){assert.ok(r.response.ok,label+' HTTP '+r.response.status+' '+(r.data?.code||''));}
async function account(label) {
  const email='pilot-'+label+'-'+nonce+'@example.com';
  const password=randomBytes(24).toString('hex')+'aA1!';
  const signup=await call(auth+'/sign-up/email',{method:'POST',body:JSON.stringify({email,password,name:'Synthetic '+label})});
  ok(signup,'signup '+label);
  const signin=await call(auth+'/sign-in/email',{method:'POST',body:JSON.stringify({email,password})});
  ok(signin,'signin '+label);
  const cookies=signin.response.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
  const session=await call(auth+'/get-session',{headers:{Cookie:cookies}});
  ok(session,'session '+label);
  const token=session.response.headers.get('set-auth-jwt')||signin.response.headers.get('set-auth-jwt');
  assert.ok(token,'missing JWT');
  const id=session.data?.user?.id||signin.data?.user?.id;
  assert.match(id,/^[0-9a-f-]{36}$/i);
  return {id,token};
}
async function db(user,path,method='GET',body,prefer='return=representation'){
  return call(api+'/'+path,{method,headers:{Authorization:'Bearer '+user.token,Prefer:prefer},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
const a=await account('a'), b=await account('b');
console.log('PASS: two independent email/password sign-ins and JWT retrieval');
const lesson={id:nonce,name:'Synthetic lesson',duration:60,schedules:[{day:'Saturday',time:'10:00'}]};
let r=await db(a,'mawaeidi_data','POST',{user_id:a.id,lessons:[lesson]});ok(r,'save schedule');
r=await db(b,'mawaeidi_data?user_id=eq.'+a.id);ok(r,'cross-owner read');assert.deepEqual(r.data,[]);
r=await db(b,'mawaeidi_data?user_id=eq.'+a.id,'PATCH',{lessons:[]});ok(r,'cross-owner update');assert.deepEqual(r.data,[]);
r=await db(a,'mawaeidi_data?user_id=eq.'+a.id);ok(r,'own schedule');assert.deepEqual(r.data[0].lessons,[lesson]);
r=await db(b,'mawaeidi_data','POST',{user_id:a.id,lessons:[]});assert.ok([401,403].includes(r.response.status),'foreign owner insert must fail');
console.log('PASS: schedule save, cross-owner read/write/insert isolation');
r=await db(a,'mawaeidi_data?user_id=eq.'+a.id,'PATCH',{lessons:[]});ok(r,'archive lesson');
r=await db(a,'mawaeidi_trash?item_key=eq.'+nonce);ok(r,'read trash');assert.equal(r.data.length,1);const trash=r.data[0].id;
r=await db(a,'rpc/mawaeidi_restore_trashed_lesson','POST',{p_trash_id:trash});ok(r,'restore lesson');
r=await db(a,'mawaeidi_data?user_id=eq.'+a.id);ok(r,'read restored lesson');assert.deepEqual(r.data[0].lessons,[lesson]);
console.log('PASS: schedule archive and restore');
r=await db(a,'mawaeidi_students','POST',{user_id:a.id,username:'synthetic-'+nonce,first_name:'Test'});ok(r,'student insert');const student=r.data[0].id;
r=await db(b,'mawaeidi_students?id=eq.'+student);ok(r,'student isolation');assert.deepEqual(r.data,[]);
r=await db(a,'mawaeidi_student_followups','POST',{user_id:a.id,student_id:student,body:'Synthetic note'});ok(r,'follow-up');
r=await db(a,'mawaeidi_students?id=eq.'+student,'PATCH',{deleted_at:new Date().toISOString()});ok(r,'student trash');
r=await db(a,'mawaeidi_students?id=eq.'+student,'PATCH',{deleted_at:null});ok(r,'student restore');
r=await db(a,'mawaeidi_student_history?student_id=eq.'+student);ok(r,'student audit');assert.ok(r.data.some(x=>x.action==='restored'));
console.log('PASS: students, follow-ups, trash and audit');
r=await db(a,'rpc/mawaeidi_world_clock_initialize','POST',{p_base:'Africa/Cairo',p_zones:['Asia/Baku']});ok(r,'world clock initialize');
r=await db(a,'rpc/mawaeidi_world_clock_change','POST',{p_action:'add',p_zone:'Europe/London'});ok(r,'world clock add');
r=await db(a,'mawaeidi_world_clock_settings?user_id=eq.'+a.id);ok(r,'read clock');assert.ok(r.data[0].zones.includes('Europe/London'));
console.log('PASS: world clock initialize and update');
