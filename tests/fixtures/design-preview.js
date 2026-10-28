/* Synthetic, offline-only review fixture. No account credentials or network calls. */
const previewStudents = [
  ['سليم','علي','أذربيجان','حالي','متوسط','فردي'],
  ['مريم','حسن','تركيا','حالي','مبتدئ','فردي'],
  ['يوسف','أحمد','ألمانيا','جديد','مبتدئ','مجموعة'],
  ['ليلى','إبراهيم','ماليزيا','حالي','متقدم','فردي'],
  ['عمر','خالد','المملكة المتحدة','متوقف مؤقتًا','متوسط','مجموعة'],
  ['سارة','محمد','أذربيجان','حالي','متوسط','فردي']
].map((r,i)=>({id:`preview-student-${i}`,user_id:'design-preview',username:`student${i+1}`,first_name:r[0],last_name:r[1],country:r[2],status:r[3],current_level:r[4],study_type:r[5],course_book:i%2?'العربية بين يديك — الكتاب الأول':'العربية بين يديك — الكتاب الثاني',institute:'دروس خاصة',communication_language:'العربية',created_at:new Date(Date.now()-i*86400000).toISOString(),joined_on:'2026-10-01',photo_path:'',deleted_at:null}));
const previewWriteError = {message:'هذه معاينة للتصميم؛ الحفظ وتعديلات الحساب غير متاحة.'};
window.supabase = {createClient(){
  return {
    from(table){
      let writing=false, single=false;
      const chain={};
      for(const key of ['select','eq','gt','lt','is','not','order','limit','in','range'])chain[key]=()=>chain;
      for(const key of ['insert','update','upsert','delete'])chain[key]=()=>{writing=true;return chain};
      chain.single=chain.maybeSingle=()=>{single=true;return chain};
      chain.then=(resolve,reject)=>Promise.resolve({data:writing?null:table==='mawaeidi_students'?previewStudents:single?null:[],error:writing?previewWriteError:null}).then(resolve,reject);
      return chain;
    },
    auth:{onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},getSession:async()=>({data:{session:null},error:null}),signInWithPassword:async()=>({data:{},error:previewWriteError}),updateUser:async()=>({data:{},error:previewWriteError}),resetPasswordForEmail:async()=>({error:previewWriteError}),signOut:async()=>({error:previewWriteError})},
    storage:{from:()=>({download:async()=>({error:{message:'not found'}}),createSignedUrls:async()=>({data:[],error:null}),upload:async()=>({error:previewWriteError}),remove:async()=>({error:previewWriteError})})},
    channel(){const c={on:()=>c,subscribe:()=>c};return c},removeChannel(){},rpc:async()=>({data:[],error:null})
  };
}};
function initDesignPreview(){
  currentUser={id:'design-preview',email:'preview@example.com',user_metadata:{full_name:'حساب تجريبي'}};
  cloudReady=true;
  const day=todayName();
  lessons=normalizeLessons([
    {id:'preview-lesson-1',name:'سليم علي',subject:'محادثة عربية',type:'teach',studentType:'individual',lessonSource:'private',duration:60,platform:'Zoom',studentTimeZone:'Asia/Baku',schedules:[{day,time:'18:00'},{day:days[(days.indexOf(day)+2)%7],time:'18:00'}]},
    {id:'preview-lesson-2',name:'مجموعة المستوى الأول',subject:'العربية بين يديك',type:'teach',studentType:'group',groupStudents:['مريم','يوسف','سارة'],lessonSource:'center',centerName:'مركز العربية',duration:45,platform:'Google Meet',schedules:[{day,time:'19:30'},{day:days[(days.indexOf(day)+3)%7],time:'17:00'}]},
    {id:'preview-lesson-3',name:'ورشة الخط العربي',subject:'خط النسخ',type:'learn',studentType:'individual',lessonSource:'private',duration:90,platform:'حضوري',schedules:[{day,time:'21:00'},{day:days[(days.indexOf(day)+5)%7],time:'16:00'}]}
  ]);
  worldClockSettings={userId:currentUser.id,base:'Africa/Cairo',zones:['Asia/Baku','Europe/Istanbul','Europe/London'],revision:1};
  // These replacement hooks exist only in this generated copy.
  requestAutoRefresh=()=>{};refreshFromCloud=async()=>{};refreshWorldClockFromCloud=async()=>{};registerAppWorker=async()=>null;
  render();hideAuth();setSync('saved','معاينة تجريبية');
  const banner=document.createElement('div');banner.className='design-preview-banner';banner.textContent='معاينة التصميم · بيانات تجريبية · الحفظ غير متاح';
  banner.style.cssText='padding:8px 16px;background:#f2eadc;color:#6d5531;text-align:center;font:700 12px Cairo, sans-serif';
  document.querySelector('.app').prepend(banner);
  if(new URLSearchParams(location.search).has('signin'))showAuth();
}
