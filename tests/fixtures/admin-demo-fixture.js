/* Isolated visual-test fixture; never loaded by production admin.html. */
(()=>{
const now=Date.now(),date=m=>new Date(now-m*60000).toISOString();
const names=["مدير تجريبي","معلم تجريبي ١","معلم تجريبي ٢","عضو تجريبي ٣","عضو تجريبي ٤"];
const users=names.map((name,i)=>({id:"demo-"+i,name,email:"demo"+i+"@example.invalid",is_owner:i===0,is_admin:i===0,created_at:date(43200+i*120),last_sign_in_at:i===4?null:date(i*30+2)}));
const sessions=Array.from({length:23},(_,i)=>({id:"visit-"+i,user_id:"demo-"+(i%4),started_at:date(i*160+2),last_seen_at:date(i*160+1),active_seconds:240+i*36,client_type:i%3===0?"android":"web"}));
let authorized=true;const callbacks=[];
const ok=data=>Promise.resolve({data,error:null});
const denied=()=>Promise.resolve({data:null,error:{code:"42501",message:"demo_read_only"}});
const releaseFetch=window.fetch.bind(window);window.fetch=(url,opts)=>String(url)==="https://api.github.com/repos/arabicwithabdelmalek-cpu/mawaeidi/releases?per_page=30"?Promise.resolve({ok:true,json:async()=>[{tag_name:"v2.0.0-beta.19",draft:false,assets:[{name:"Mawaeidi-2.0.0-beta.19.apk",digest:"sha256:"+"a".repeat(64),browser_download_url:"https://github.com/arabicwithabdelmalek-cpu/mawaeidi/releases/download/v2.0.0-beta.19/Mawaeidi-2.0.0-beta.19.apk"}]}]}):releaseFetch(url,opts);
window.__demoSignOut=()=>{authorized=false;callbacks.forEach(cb=>cb("SIGNED_OUT",null))};
window.supabase={createClient:()=>({
auth:{getUser:()=>ok({user:authorized?users[0]:null}),onAuthStateChange:cb=>{callbacks.push(cb);return {data:{subscription:{unsubscribe(){}}}}}},
rpc:(name,args)=>!authorized?denied():name==="mawaeidi_admin_usage"?ok({users,sessions}):name==="mawaeidi_admin_usage_versions"?ok(sessions.map(s=>({...s,app_version:s.client_type==="android"?(s.user_id==="demo-0"?"2.0.0-beta.19":s.user_id==="demo-1"?"2.0.0-beta.18":null):null}))):name==="mawaeidi_admin_credentials"&&args?.p_action==="list"?ok([]):name==="mawaeidi_admin_support_history"?ok([]):denied(),
functions:{invoke:(_name,opts)=>authorized&&opts?.body?.action==="list"?ok({users}):denied()},
from:()=>({select:()=>ok([])})
})};
})();
