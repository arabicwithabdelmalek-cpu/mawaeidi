
const days=["الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت","الأحد"];
const LEGACY_STORAGE_KEY="mawaeidi_arabic_v7";
const MIGRATION_KEY_PREFIX="mawaeidi_cloud_migration_";
const SUPABASE_URL="https://nvefdkkjkyalpsrgoffj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_t0pqtkV0-3Wj0htl-eGR9w_BsifiUDE";
const STUDENTS_TABLE="mawaeidi_students";
const STUDENT_PHOTO_BUCKET="mawaeidi-student-photos";
const STUDENT_PHOTO_SIGNED_SECONDS=60*60;
const TIME_RE=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
const SOURCE_COLORS=["#4F7693","#4F7B75","#687B8B","#9A7749","#806E86","#6F8063","#8B6262","#5E718D"];
const PRIVATE_SOURCE_COLOR="#9B7449";
const BACKUP_FORMAT="mawaeidi-backup";
const BACKUP_VERSION=3;
const MAX_BACKUP_BYTES=window.MawaeidiBackup?.limits.maxArchiveBytes||256*1024*1024;
const MAX_BACKUP_LESSONS=2000;
const MAX_SESSION_RECORDS=5000;
const AUTO_REFRESH_THROTTLE_MS=15000;
const HISTORY_TABLE="mawaeidi_history";
const PUSH_SUBSCRIPTIONS_TABLE="mawaeidi_push_subscriptions";
const VAPID_PUBLIC_KEY="BCV1YqoeembJvO664BNkaJbrK_wMZGl5I1EQv1EgjeJO30kWIdEtQswrebKG7qt1jSKVQ0GtqLPipzHI1XGzFc8";
const DEFAULT_NOTIFICATION_LEAD=15;
const DEFAULT_NOTIFICATION_LEADS=[60,15];
const NOTIFICATION_LEAD_OPTIONS=[5,10,15,30,60];
const MAX_NOTIFICATION_LEADS=3;
const NOTIFICATION_LEAD_KEY="mawaeidi-notification-lead-v1";
const NOTIFICATION_LEADS_KEY="mawaeidi-notification-leads-v2";
const WEEK_TIME_MODE_KEY="mawaeidi-week-time-mode-v1";
const WEEK_DENSITY_KEY="mawaeidi-week-density-v1";
const WORLD_CLOCK_ZONES_KEY="mawaeidi-world-clock-zones-v1";
const WORLD_CLOCK_BASE_KEY="mawaeidi-world-clock-base-v1";
const WORLD_CLOCK_SETTINGS_TABLE="mawaeidi_world_clock_settings";
const WORLD_CLOCK_LEGACY_OWNER_KEY="mawaeidi-world-clock-v1-owner";
const SCHEDULE_TIMEZONE="Africa/Cairo";
const SESSION_RECORD_STATUSES=["default","completed","cancelled_unpaid","cancelled_counted","free","rescheduled"];
const TIMEZONE_COUNTRY_MAP={"Europe/Andorra":"AD","Asia/Dubai":"AE","Asia/Kabul":"AF","America/Antigua":"AG","America/Anguilla":"AI","Europe/Tirane":"AL","Asia/Yerevan":"AM","Africa/Luanda":"AO","Antarctica/McMurdo":"AQ","Antarctica/Casey":"AQ","Antarctica/Davis":"AQ","Antarctica/DumontDUrville":"AQ","Antarctica/Mawson":"AQ","Antarctica/Palmer":"AQ","Antarctica/Rothera":"AQ","Antarctica/Syowa":"AQ","Antarctica/Troll":"AQ","Antarctica/Vostok":"AQ","America/Argentina/Buenos_Aires":"AR","America/Argentina/Cordoba":"AR","America/Argentina/Salta":"AR","America/Argentina/Jujuy":"AR","America/Argentina/Tucuman":"AR","America/Argentina/Catamarca":"AR","America/Argentina/La_Rioja":"AR","America/Argentina/San_Juan":"AR","America/Argentina/Mendoza":"AR","America/Argentina/San_Luis":"AR","America/Argentina/Rio_Gallegos":"AR","America/Argentina/Ushuaia":"AR","Pacific/Pago_Pago":"AS","Europe/Vienna":"AT","Australia/Lord_Howe":"AU","Antarctica/Macquarie":"AU","Australia/Hobart":"AU","Australia/Melbourne":"AU","Australia/Sydney":"AU","Australia/Broken_Hill":"AU","Australia/Brisbane":"AU","Australia/Lindeman":"AU","Australia/Adelaide":"AU","Australia/Darwin":"AU","Australia/Perth":"AU","Australia/Eucla":"AU","America/Aruba":"AW","Europe/Mariehamn":"AX","Asia/Baku":"AZ","Europe/Sarajevo":"BA","America/Barbados":"BB","Asia/Dhaka":"BD","Europe/Brussels":"BE","Africa/Ouagadougou":"BF","Europe/Sofia":"BG","Asia/Bahrain":"BH","Africa/Bujumbura":"BI","Africa/Porto-Novo":"BJ","America/St_Barthelemy":"BL","Atlantic/Bermuda":"BM","Asia/Brunei":"BN","America/La_Paz":"BO","America/Kralendijk":"BQ","America/Noronha":"BR","America/Belem":"BR","America/Fortaleza":"BR","America/Recife":"BR","America/Araguaina":"BR","America/Maceio":"BR","America/Bahia":"BR","America/Sao_Paulo":"BR","America/Campo_Grande":"BR","America/Cuiaba":"BR","America/Santarem":"BR","America/Porto_Velho":"BR","America/Boa_Vista":"BR","America/Manaus":"BR","America/Eirunepe":"BR","America/Rio_Branco":"BR","America/Nassau":"BS","Asia/Thimphu":"BT","Africa/Gaborone":"BW","Europe/Minsk":"BY","America/Belize":"BZ","America/St_Johns":"CA","America/Halifax":"CA","America/Glace_Bay":"CA","America/Moncton":"CA","America/Goose_Bay":"CA","America/Blanc-Sablon":"CA","America/Toronto":"CA","America/Iqaluit":"CA","America/Atikokan":"CA","America/Winnipeg":"CA","America/Resolute":"CA","America/Rankin_Inlet":"CA","America/Regina":"CA","America/Swift_Current":"CA","America/Edmonton":"CA","America/Cambridge_Bay":"CA","America/Inuvik":"CA","America/Vancouver":"CA","America/Creston":"CA","America/Dawson_Creek":"CA","America/Fort_Nelson":"CA","America/Whitehorse":"CA","America/Dawson":"CA","Indian/Cocos":"CC","Africa/Kinshasa":"CD","Africa/Lubumbashi":"CD","Africa/Bangui":"CF","Africa/Brazzaville":"CG","Europe/Zurich":"CH","Africa/Abidjan":"CI","Pacific/Rarotonga":"CK","America/Santiago":"CL","America/Coyhaique":"CL","America/Punta_Arenas":"CL","Pacific/Easter":"CL","Africa/Douala":"CM","Asia/Shanghai":"CN","Asia/Urumqi":"CN","America/Bogota":"CO","America/Costa_Rica":"CR","America/Havana":"CU","Atlantic/Cape_Verde":"CV","America/Curacao":"CW","Indian/Christmas":"CX","Asia/Nicosia":"CY","Asia/Famagusta":"CY","Europe/Prague":"CZ","Europe/Berlin":"DE","Europe/Busingen":"DE","Africa/Djibouti":"DJ","Europe/Copenhagen":"DK","America/Dominica":"DM","America/Santo_Domingo":"DO","Africa/Algiers":"DZ","America/Guayaquil":"EC","Pacific/Galapagos":"EC","Europe/Tallinn":"EE","Africa/Cairo":"EG","Africa/El_Aaiun":"EH","Africa/Asmara":"ER","Europe/Madrid":"ES","Africa/Ceuta":"ES","Atlantic/Canary":"ES","Africa/Addis_Ababa":"ET","Europe/Helsinki":"FI","Pacific/Fiji":"FJ","Atlantic/Stanley":"FK","Pacific/Chuuk":"FM","Pacific/Pohnpei":"FM","Pacific/Kosrae":"FM","Atlantic/Faroe":"FO","Europe/Paris":"FR","Africa/Libreville":"GA","Europe/London":"GB","America/Grenada":"GD","Asia/Tbilisi":"GE","America/Cayenne":"GF","Europe/Guernsey":"GG","Africa/Accra":"GH","Europe/Gibraltar":"GI","America/Nuuk":"GL","America/Danmarkshavn":"GL","America/Scoresbysund":"GL","America/Thule":"GL","Africa/Banjul":"GM","Africa/Conakry":"GN","America/Guadeloupe":"GP","Africa/Malabo":"GQ","Europe/Athens":"GR","Atlantic/South_Georgia":"GS","America/Guatemala":"GT","Pacific/Guam":"GU","Africa/Bissau":"GW","America/Guyana":"GY","Asia/Hong_Kong":"HK","America/Tegucigalpa":"HN","Europe/Zagreb":"HR","America/Port-au-Prince":"HT","Europe/Budapest":"HU","Asia/Jakarta":"ID","Asia/Pontianak":"ID","Asia/Makassar":"ID","Asia/Jayapura":"ID","Europe/Dublin":"IE","Asia/Jerusalem":"IL","Europe/Isle_of_Man":"IM","Asia/Kolkata":"IN","Indian/Chagos":"IO","Asia/Baghdad":"IQ","Asia/Tehran":"IR","Atlantic/Reykjavik":"IS","Europe/Rome":"IT","Europe/Jersey":"JE","America/Jamaica":"JM","Asia/Amman":"JO","Asia/Tokyo":"JP","Africa/Nairobi":"KE","Asia/Bishkek":"KG","Asia/Phnom_Penh":"KH","Pacific/Tarawa":"KI","Pacific/Kanton":"KI","Pacific/Kiritimati":"KI","Indian/Comoro":"KM","America/St_Kitts":"KN","Asia/Pyongyang":"KP","Asia/Seoul":"KR","Asia/Kuwait":"KW","America/Cayman":"KY","Asia/Almaty":"KZ","Asia/Qyzylorda":"KZ","Asia/Qostanay":"KZ","Asia/Aqtobe":"KZ","Asia/Aqtau":"KZ","Asia/Atyrau":"KZ","Asia/Oral":"KZ","Asia/Vientiane":"LA","Asia/Beirut":"LB","America/St_Lucia":"LC","Europe/Vaduz":"LI","Asia/Colombo":"LK","Africa/Monrovia":"LR","Africa/Maseru":"LS","Europe/Vilnius":"LT","Europe/Luxembourg":"LU","Europe/Riga":"LV","Africa/Tripoli":"LY","Africa/Casablanca":"MA","Europe/Monaco":"MC","Europe/Chisinau":"MD","Europe/Podgorica":"ME","America/Marigot":"MF","Indian/Antananarivo":"MG","Pacific/Majuro":"MH","Pacific/Kwajalein":"MH","Europe/Skopje":"MK","Africa/Bamako":"ML","Asia/Yangon":"MM","Asia/Ulaanbaatar":"MN","Asia/Hovd":"MN","Asia/Macau":"MO","Pacific/Saipan":"MP","America/Martinique":"MQ","Africa/Nouakchott":"MR","America/Montserrat":"MS","Europe/Malta":"MT","Indian/Mauritius":"MU","Indian/Maldives":"MV","Africa/Blantyre":"MW","America/Mexico_City":"MX","America/Cancun":"MX","America/Merida":"MX","America/Monterrey":"MX","America/Matamoros":"MX","America/Chihuahua":"MX","America/Ciudad_Juarez":"MX","America/Ojinaga":"MX","America/Mazatlan":"MX","America/Bahia_Banderas":"MX","America/Hermosillo":"MX","America/Tijuana":"MX","Asia/Kuala_Lumpur":"MY","Asia/Kuching":"MY","Africa/Maputo":"MZ","Africa/Windhoek":"NA","Pacific/Noumea":"NC","Africa/Niamey":"NE","Pacific/Norfolk":"NF","Africa/Lagos":"NG","America/Managua":"NI","Europe/Amsterdam":"NL","Europe/Oslo":"NO","Asia/Kathmandu":"NP","Pacific/Nauru":"NR","Pacific/Niue":"NU","Pacific/Auckland":"NZ","Pacific/Chatham":"NZ","Asia/Muscat":"OM","America/Panama":"PA","America/Lima":"PE","Pacific/Tahiti":"PF","Pacific/Marquesas":"PF","Pacific/Gambier":"PF","Pacific/Port_Moresby":"PG","Pacific/Bougainville":"PG","Asia/Manila":"PH","Asia/Karachi":"PK","Europe/Warsaw":"PL","America/Miquelon":"PM","Pacific/Pitcairn":"PN","America/Puerto_Rico":"PR","Asia/Gaza":"PS","Asia/Hebron":"PS","Europe/Lisbon":"PT","Atlantic/Madeira":"PT","Atlantic/Azores":"PT","Pacific/Palau":"PW","America/Asuncion":"PY","Asia/Qatar":"QA","Indian/Reunion":"RE","Europe/Bucharest":"RO","Europe/Belgrade":"RS","Europe/Kaliningrad":"RU","Europe/Moscow":"RU","Europe/Simferopol":"UA","Europe/Kirov":"RU","Europe/Volgograd":"RU","Europe/Astrakhan":"RU","Europe/Saratov":"RU","Europe/Ulyanovsk":"RU","Europe/Samara":"RU","Asia/Yekaterinburg":"RU","Asia/Omsk":"RU","Asia/Novosibirsk":"RU","Asia/Barnaul":"RU","Asia/Tomsk":"RU","Asia/Novokuznetsk":"RU","Asia/Krasnoyarsk":"RU","Asia/Irkutsk":"RU","Asia/Chita":"RU","Asia/Yakutsk":"RU","Asia/Khandyga":"RU","Asia/Vladivostok":"RU","Asia/Ust-Nera":"RU","Asia/Magadan":"RU","Asia/Sakhalin":"RU","Asia/Srednekolymsk":"RU","Asia/Kamchatka":"RU","Asia/Anadyr":"RU","Africa/Kigali":"RW","Asia/Riyadh":"SA","Pacific/Guadalcanal":"SB","Indian/Mahe":"SC","Africa/Khartoum":"SD","Europe/Stockholm":"SE","Asia/Singapore":"SG","Atlantic/St_Helena":"SH","Europe/Ljubljana":"SI","Arctic/Longyearbyen":"SJ","Europe/Bratislava":"SK","Africa/Freetown":"SL","Europe/San_Marino":"SM","Africa/Dakar":"SN","Africa/Mogadishu":"SO","America/Paramaribo":"SR","Africa/Juba":"SS","Africa/Sao_Tome":"ST","America/El_Salvador":"SV","America/Lower_Princes":"SX","Asia/Damascus":"SY","Africa/Mbabane":"SZ","America/Grand_Turk":"TC","Africa/Ndjamena":"TD","Indian/Kerguelen":"TF","Africa/Lome":"TG","Asia/Bangkok":"TH","Asia/Dushanbe":"TJ","Pacific/Fakaofo":"TK","Asia/Dili":"TL","Asia/Ashgabat":"TM","Africa/Tunis":"TN","Pacific/Tongatapu":"TO","Europe/Istanbul":"TR","America/Port_of_Spain":"TT","Pacific/Funafuti":"TV","Asia/Taipei":"TW","Africa/Dar_es_Salaam":"TZ","Europe/Kyiv":"UA","Africa/Kampala":"UG","Pacific/Midway":"UM","Pacific/Wake":"UM","America/New_York":"US","America/Detroit":"US","America/Kentucky/Louisville":"US","America/Kentucky/Monticello":"US","America/Indiana/Indianapolis":"US","America/Indiana/Vincennes":"US","America/Indiana/Winamac":"US","America/Indiana/Marengo":"US","America/Indiana/Petersburg":"US","America/Indiana/Vevay":"US","America/Chicago":"US","America/Indiana/Tell_City":"US","America/Indiana/Knox":"US","America/Menominee":"US","America/North_Dakota/Center":"US","America/North_Dakota/New_Salem":"US","America/North_Dakota/Beulah":"US","America/Denver":"US","America/Boise":"US","America/Phoenix":"US","America/Los_Angeles":"US","America/Anchorage":"US","America/Juneau":"US","America/Sitka":"US","America/Metlakatla":"US","America/Yakutat":"US","America/Nome":"US","America/Adak":"US","Pacific/Honolulu":"US","America/Montevideo":"UY","Asia/Samarkand":"UZ","Asia/Tashkent":"UZ","Europe/Vatican":"VA","America/St_Vincent":"VC","America/Caracas":"VE","America/Tortola":"VG","America/St_Thomas":"VI","Asia/Ho_Chi_Minh":"VN","Pacific/Efate":"VU","Pacific/Wallis":"WF","Pacific/Apia":"WS","Asia/Aden":"YE","Indian/Mayotte":"YT","Africa/Johannesburg":"ZA","Africa/Lusaka":"ZM","Africa/Harare":"ZW"};
const cloud=window.supabase?.createClient
  ?window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY)
  :null;
const studentsWorkspace=window.MawaeidiStudents.create({
  root:document.getElementById("studentsView"),
  cloud
});
function resetStudentWorkspace(){studentsWorkspace.reset()}

function makeId(){
  if(window.crypto&&typeof window.crypto.randomUUID==="function")return window.crypto.randomUUID();
  return `lesson-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
function textValue(value){return typeof value==="string"?value:""}
function validTimeZone(value){
  const zone=textValue(value).trim();if(!zone)return false;
  try{new Intl.DateTimeFormat("en",{timeZone:zone}).format(new Date());return true}catch{return false}
}
function normalizeNotificationLeads(value,fallback=DEFAULT_NOTIFICATION_LEADS){
  const values=Array.isArray(value)?value:[value];
  const normalized=[...new Set(values.map(Number).filter(item=>NOTIFICATION_LEAD_OPTIONS.includes(item)))].sort((a,b)=>b-a).slice(0,MAX_NOTIFICATION_LEADS);
  if(normalized.length)return normalized;
  const safeFallback=Array.isArray(fallback)?fallback:[fallback];
  return [...new Set(safeFallback.map(Number).filter(item=>NOTIFICATION_LEAD_OPTIONS.includes(item)))].sort((a,b)=>b-a).slice(0,MAX_NOTIFICATION_LEADS);
}
function normalizeSessionRecords(value){
  const records=[],ids=new Set(),baseKeys=new Set();
  for(const item of (Array.isArray(value)?value:[]).slice(0,MAX_SESSION_RECORDS)){
    if(!item||typeof item!=="object")continue;
    const kind=item.kind==="replacement"?"replacement":"base",date=textValue(item.date),time=textValue(item.time);
    if(!validDateKey(date)||!TIME_RE.test(time))continue;
    let status=SESSION_RECORD_STATUSES.includes(item.status)?item.status:"default";
    if(kind==="base"&&status==="default")continue;
    if(kind==="replacement"&&status==="rescheduled")status="default";
    const sourceDate=textValue(item.sourceDate),sourceTime=textValue(item.sourceTime);
    if(kind==="replacement"&&(!validDateKey(sourceDate)||!TIME_RE.test(sourceTime)))continue;
    const baseKey=`${date}|${time}`;
    if(kind==="base"&&baseKeys.has(baseKey))continue;
    let id=textValue(item.id);
    if(!/^[A-Za-z0-9_-]{1,120}$/.test(id))id=kind==="base"?`base-${date}-${time.replace(":","")}`:makeId();
    while(ids.has(id))id=makeId();
    ids.add(id);
    if(kind==="base")baseKeys.add(baseKey);
    const record={id,kind,date,time,status,updatedAt:textValue(item.updatedAt)||new Date().toISOString()};
    if(kind==="base"&&status==="rescheduled"&&/^[A-Za-z0-9_-]{1,120}$/.test(textValue(item.replacementId)))record.replacementId=textValue(item.replacementId);
    if(kind==="replacement"){record.sourceDate=sourceDate;record.sourceTime=sourceTime}
    records.push(record);
  }
  const replacementIds=new Set(records.filter(item=>item.kind==="replacement").map(item=>item.id));
  const linkedReplacementIds=new Set(records.filter(item=>item.kind==="base"&&item.status==="rescheduled"&&replacementIds.has(item.replacementId)).map(item=>item.replacementId));
  return records.filter(item=>item.kind==="base"?(item.status!=="rescheduled"||linkedReplacementIds.has(item.replacementId)):linkedReplacementIds.has(item.id));
}
function normalizeLesson(item){
  const duration=Number(item.duration);
  const id=textValue(item.id);
  const reminderMode=item.reminderMode==="off"||item.reminderMode==="custom"?item.reminderMode:"default";
  return {
    id:/^[A-Za-z0-9_-]{1,120}$/.test(id)?id:makeId(),
    type:item.type==="learn"?"learn":"teach",
    studentType:item.studentType==="group"?"group":"individual",
    lessonSource:item.lessonSource==="center"?"center":"private",
    name:textValue(item.name),
    groupStudents:Array.isArray(item.groupStudents)?item.groupStudents.filter(x=>typeof x==="string"&&x.trim()).map(x=>x.trim()):[],
    studentTimeZone:validTimeZone(item.studentTimeZone)?textValue(item.studentTimeZone).trim():"",
    centerName:textValue(item.centerName),
    subject:textValue(item.subject),
    duration:Number.isFinite(duration)&&duration>=15&&duration<=720?duration:60,
    platform:textValue(item.platform),
    repeat:"أسبوعيًا",
    reminderMode,
    reminderLeads:normalizeNotificationLeads(item.reminderLeads,[DEFAULT_NOTIFICATION_LEAD]),
    notes:textValue(item.notes),
    sessionRecords:normalizeSessionRecords(item.sessionRecords),
    schedules:Array.isArray(item.schedules)?item.schedules
      .filter(s=>s&&days.includes(s.day)&&TIME_RE.test(textValue(s.time)))
      .map(s=>({day:s.day,time:s.time})):[]
  };
}
function normalizeLessons(list){
  const seen=new Set();
  return (Array.isArray(list)?list:[]).filter(item=>item&&typeof item==="object").map(item=>{
    const lesson=normalizeLesson(item);
    while(seen.has(lesson.id))lesson.id=makeId();
    seen.add(lesson.id);
    return lesson;
  });
}
function validDateKey(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(textValue(value)))return false;
  const date=new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
function loadLocalLessons(){
  try{
    const raw=localStorage.getItem(LEGACY_STORAGE_KEY);
    if(raw===null)return null;
    const parsed=JSON.parse(raw);
    return normalizeLessons(parsed);
  }catch(error){
    console.warn("تعذّر قراءة بيانات مواعيدي القديمة.",error);
    return [];
  }
}

let lessons=[];
let currentFilter="all";
let currentView="today";
let selectedWeekOffset=0;
let weekTimeMode=savedWeekTimeMode();
let weekDensity=savedWeekDensity();
let expandedWeekTimes=new Set();
let draggedWeekContext=null;
let activeWeekMoveContext=null;
let currentSection=new URLSearchParams(location.search).get("section")==="students"?"students":"schedule";
let editingId=null;
let lessonSaveInFlight=false;
let drawerReturnFocus=null;
let currentUser=null;
let cloudReady=false;
let authMode="signin";
let sessionSequence=0;
let loadingUserId=null;
let recoveryUser=null;
let lastCloudUpdatedAt=null;
let realtimeChannel=null;
let refreshInFlight=false;
let saveInFlight=false;
let backupInFlight=false;
let backupStatusToastTimer=null;
function showBackupStatus(message,{error=false,persistent=false}={}){
  const status=document.getElementById("backupStatusToast");
  if(!status)return;
  clearTimeout(backupStatusToastTimer);
  status.textContent=message;
  status.classList.toggle("error",error);
  status.hidden=false;
  if(!persistent)backupStatusToastTimer=setTimeout(()=>{status.hidden=true},5500);
}
let pendingBackupRestorePlan=null;
let pendingRemoteRow=null;
let lastAutoRefreshAt=0;
let deferredInstallPrompt=null;
let serviceWorkerRegistration=null;
let toolReturnFocus=null;
let notificationBusy=false;
let historySnapshots=new Map();
let activeSessionContext=null;
let worldClockInterval=null;
let worldClockSettings=null;
let worldClockBusy=false;
let worldClockLoadSequence=0;
let timeZoneCatalogCache=null;

function closeDataMenu(restoreFocus=false){
  const menu=document.getElementById("dataMenu");
  const wasOpen=Boolean(menu?.open);
  menu?.removeAttribute("open");
  if(restoreFocus&&wasOpen)menu?.querySelector("summary")?.focus();
}
function isStandalone(){return window.matchMedia?.("(display-mode: standalone)").matches||navigator.standalone===true}
function isIOS(){return /iphone|ipad|ipod/i.test(navigator.userAgent||"")}
function vapidKeyIsConfigured(){return VAPID_PUBLIC_KEY&&!VAPID_PUBLIC_KEY.startsWith("__")}
function validNotificationLead(value){
  const lead=Number(value);
  return NOTIFICATION_LEAD_OPTIONS.includes(lead)?lead:DEFAULT_NOTIFICATION_LEAD;
}
function savedNotificationLeads(){
  try{
    const stored=localStorage.getItem(NOTIFICATION_LEADS_KEY);
    if(stored)return normalizeNotificationLeads(JSON.parse(stored));
    const legacy=localStorage.getItem(NOTIFICATION_LEAD_KEY);
    return legacy===null?[...DEFAULT_NOTIFICATION_LEADS]:normalizeNotificationLeads([legacy]);
  }catch{return [...DEFAULT_NOTIFICATION_LEADS]}
}
function rememberNotificationLeads(value){
  const leads=normalizeNotificationLeads(value);
  try{localStorage.setItem(NOTIFICATION_LEADS_KEY,JSON.stringify(leads))}catch{}
  return leads;
}
function notificationLeadText(value){
  const lead=validNotificationLead(value);
  return lead===60?"ساعة":lead+" دقيقة";
}
function notificationLeadsText(value){
  const labels=normalizeNotificationLeads(value).map(notificationLeadText);
  return labels.length===1?labels[0]:labels.slice(0,-1).join("، ")+" و"+labels.at(-1);
}
function notificationLeadChoices(leads,inputClass="notification-lead",handler="saveNotificationLeads(this)"){
  const selected=new Set(normalizeNotificationLeads(leads));
  return [60,30,15,10,5].map(value=>`<label class="lead-option"><input class="${inputClass}" type="checkbox" value="${value}" ${selected.has(value)?"checked":""} onchange="${handler}"><span>قبل ${notificationLeadText(value)}</span></label>`).join("");
}
function checkedNotificationLeads(selector){
  return [...new Set([...document.querySelectorAll(selector+":checked")]
    .map(input=>Number(input.value))
    .filter(value=>NOTIFICATION_LEAD_OPTIONS.includes(value)))]
    .sort((a,b)=>b-a);
}
function openToolDialog(title,intro,content){
  const backdrop=document.getElementById("toolBackdrop");
  const previousFocus=document.activeElement;
  if(!backdrop.classList.contains("show")){
    // A tool opened from the collapsing <details> menu should return to its summary.
    const menu=document.getElementById("dataMenu");
    toolReturnFocus=menu?.contains(previousFocus)?menu.querySelector("summary"):previousFocus;
  }
  closeDataMenu();
  document.getElementById("toolTitle").textContent=title;
  document.getElementById("toolIntro").textContent=intro||"";
  document.getElementById("toolBody").innerHTML=content||"";
  backdrop.classList.add("show");
  backdrop.setAttribute("aria-hidden","false");
  document.body.classList.add("drawer-open");
  requestAnimationFrame(()=>{
    if(backdrop.classList.contains("show"))document.getElementById("toolDialog").focus({preventScroll:true});
  });
}
function closeToolDialog(event){
  const backdrop=document.getElementById("toolBackdrop");
  if(event&&event.target!==backdrop)return;
  if(!backdrop.classList.contains("show"))return;
  backdrop.classList.remove("show");
  backdrop.setAttribute("aria-hidden","true");
  document.body.classList.remove("drawer-open");
  activeSessionContext=null;
  activeWeekMoveContext=null;
  pendingBackupRestorePlan=null;
  if(worldClockInterval){clearInterval(worldClockInterval);worldClockInterval=null}
  const requestedFocus=toolReturnFocus;
  toolReturnFocus=null;
  const toolsSummary=document.querySelector("#dataMenu > summary");
  const returnTarget=requestedFocus?.isConnected
      &&!requestedFocus.closest("[hidden],details:not([open])")
      &&!requestedFocus.hidden
    ?requestedFocus:toolsSummary;
  requestAnimationFrame(()=>{
    if(!backdrop.classList.contains("show"))returnTarget?.focus({preventScroll:true});
  });
  setTimeout(flushPendingRemote,0);
}
function refreshInstallAction(){
  const action=document.getElementById("installAction");
  if(action)action.hidden=isStandalone();
}
async function registerAppWorker(){
  if(!("serviceWorker" in navigator))return null;
  const safeOrigin=location.protocol==="https:"||location.hostname==="localhost"||location.hostname==="127.0.0.1";
  if(!safeOrigin)return null;
  try{
    serviceWorkerRegistration=await navigator.serviceWorker.register("./sw.js",{scope:"./"});
    return serviceWorkerRegistration;
  }catch(error){
    console.warn("تعذّر تسجيل خدمة تطبيق مواعيدي.",error);
    return null;
  }
}
async function installApp(){
  closeDataMenu();
  if(isStandalone()){
    openToolDialog("مواعيدي مُثبّت","التطبيق يعمل الآن في وضع الشاشة الكاملة.",'<div class="tool-card"><h3>التثبيت مكتمل</h3><p>ستجد أيقونة مواعيدي بين تطبيقات الهاتف، ويمكنك فتحه مباشرة منها.</p></div>');
    return;
  }
  if(deferredInstallPrompt){
    const prompt=deferredInstallPrompt;
    deferredInstallPrompt=null;
    await prompt.prompt();
    const choice=await prompt.userChoice;
    if(choice?.outcome==="accepted")refreshInstallAction();
    else refreshInstallAction();
    return;
  }
  const help=isIOS()
    ?'<div class="tool-card"><h3>على iPhone أو iPad</h3><p>افتح الموقع في Safari، واضغط زر المشاركة، ثم اختر «إضافة إلى الشاشة الرئيسية» وبعدها «إضافة».</p><div class="install-help">بعد التثبيت سيفتح مواعيدي كتطبيق كامل، ومن داخله يمكنك تفعيل التنبيهات.</div></div>'
    :'<div class="tool-card"><h3>تثبيت التطبيق</h3><p>افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». إن لم يظهر الخيار، حدّث الصفحة مرة واحدة ثم افتح القائمة مجددًا.</p></div>';
  openToolDialog("تثبيت مواعيدي","خطوة واحدة تضع أيقونة التطبيق على هاتفك.",help);
}

function legacyWorldClockSnapshot(){
 try{
  const savedBase=localStorage.getItem(WORLD_CLOCK_BASE_KEY),savedZones=localStorage.getItem(WORLD_CLOCK_ZONES_KEY);
  if(savedBase===null&&savedZones===null)return null;
  const base=validTimeZone(savedBase)?savedBase:SCHEDULE_TIMEZONE;
  const parsed=savedZones===null?["Asia/Baku"]:JSON.parse(savedZones);
  return {base,zones:[...new Set((Array.isArray(parsed)?parsed:[]).filter(validTimeZone).filter(zone=>zone!==base))].slice(0,9)};
 }catch{return null}
}
function savedWorldClockBase(){
 return worldClockSettings?.userId===currentUser?.id?worldClockSettings.base:SCHEDULE_TIMEZONE;
}
function savedWorldClockZones(){
 const base=savedWorldClockBase();
 return [base,...(worldClockSettings?.userId===currentUser?.id?worldClockSettings.zones:["Asia/Baku"].filter(zone=>zone!==base))];
}
function setWorldClockServerRow(row,userId){
 if(!row||currentUser?.id!==userId)return false;
 const base=textValue(row.base_zone),version=Number(row.version),zones=Array.isArray(row.zones)?row.zones:[];
 if(!validTimeZone(base)||!Number.isSafeInteger(version)||version<1||zones.length>9
 ||zones.some(z=>!validTimeZone(z)||z===base)||new Set(zones).size!==zones.length)
   throw new Error("invalid_world_clock_settings");
 if(worldClockSettings?.userId===userId&&version<worldClockSettings.version)return false;
 if(worldClockSettings?.userId===userId&&version===worldClockSettings.version
 &&worldClockSettings.base===base&&JSON.stringify(worldClockSettings.zones)===JSON.stringify(zones))return false;
 worldClockSettings={userId,base,zones:[...zones],version};
 if(currentSection==="world"&&!document.getElementById("worldClockView").hidden)openWorldClock();
 return true;
}
function resetWorldClockSync(){worldClockLoadSequence++;worldClockSettings=null;worldClockBusy=false}
async function refreshWorldClockFromCloud(){
 if(!currentUser||!cloudReady||worldClockBusy)return false;
 const userId=currentUser.id,seq=worldClockLoadSequence;
 const {data,error}=await cloud.from(WORLD_CLOCK_SETTINGS_TABLE)
  .select("user_id,base_zone,zones,version").eq("user_id",userId).maybeSingle();
 if(error){console.warn("World clock refresh failed.",error);return false}
 if(seq!==worldClockLoadSequence||currentUser?.id!==userId||!data)return false;
 return setWorldClockServerRow(data,userId);
}
async function initializeWorldClockForUser(user,sequence){
 const userId=user.id,load=++worldClockLoadSequence;
 const {data,error}=await cloud.from(WORLD_CLOCK_SETTINGS_TABLE)
  .select("user_id,base_zone,zones,version").eq("user_id",userId).maybeSingle();
 if(error)throw error;
 if(sequence!==sessionSequence||load!==worldClockLoadSequence||currentUser?.id!==userId)return;
 const legacy=legacyWorldClockSnapshot();
 let legacyOwner="";
 try{legacyOwner=localStorage.getItem(WORLD_CLOCK_LEGACY_OWNER_KEY)||""}catch{}
 let row=data;
 if(!row){
  const canClaim=Boolean(legacy)&&(!legacyOwner||legacyOwner===userId);
  if(!legacyOwner){try{localStorage.setItem(WORLD_CLOCK_LEGACY_OWNER_KEY,userId)}catch{}}
  let base=SCHEDULE_TIMEZONE,zones=["Asia/Baku"];
  if(canClaim&&confirm("وجدنا مدنًا محفوظة في الساعة العالمية على هذا الجهاز. هل تريد نقلها إلى حسابك لمزامنتها بين الأجهزة؟")){
   base=legacy.base;zones=legacy.zones;
  }
  const initialized=await cloud.rpc("mawaeidi_world_clock_initialize",{p_base:base,p_zones:zones});
  if(initialized.error)throw initialized.error;
  row=initialized.data;
 }else if(legacy&&!legacyOwner){
  try{localStorage.setItem(WORLD_CLOCK_LEGACY_OWNER_KEY,userId)}catch{}
  const additions=[...new Set([legacy.base,...legacy.zones])].filter(zone=>zone!==row.base_zone&&!row.zones.includes(zone));
  if(additions.length&&confirm(`هناك ${additions.length} مدينة قديمة على هذا الجهاز ليست في حسابك. هل تريد إضافتها إلى الساعة السحابية؟`)){
   const merged=await cloud.rpc("mawaeidi_world_clock_change",{p_action:"merge",p_zones:additions});
   if(merged.error){console.warn("Legacy clock merge skipped.",merged.error);alert("تعذّر دمج المدن القديمة. لم تُحذف بيانات الجهاز ويمكنك إضافتها لاحقًا.")}
   else row=merged.data;
  }
 }
 if(sequence!==sessionSequence||load!==worldClockLoadSequence||currentUser?.id!==userId)return;
 setWorldClockServerRow(row,userId);
}
async function mutateWorldClock(action,zone=null,extra={}){
 if(!currentUser||!cloudReady||!worldClockSettings||worldClockSettings.userId!==currentUser.id){
  alert("لم تكتمل مزامنة الساعة. تحقق من الاتصال وحدّث الصفحة.");return false;
 }
 if(worldClockBusy){alert("جارٍ حفظ تعديل للساعة. أعد المحاولة بعد اكتماله.");return false}
 if(!navigator.onLine){alert("يجب الاتصال بالإنترنت لتعديل الساعة العالمية وحفظها في الحساب.");return false}
 const userId=currentUser.id;
 worldClockBusy=true;
 try{
  const args={p_action:action,...extra};if(zone!==null)args.p_zone=zone;
  const {data,error}=await cloud.rpc("mawaeidi_world_clock_change",args);
  if(error)throw error;
  if(currentUser?.id!==userId)return false;
  setWorldClockServerRow(data,userId);
  return true;
 }catch(error){
  console.error("World clock synchronization failed.",error);
  const msg=textValue(error?.message);
  alert(msg.includes("clock_zone_limit")?"يمكن حفظ تسع مدن بجانب التوقيت الأساسي. احذف مدينة أولًا.":
    msg.includes("zone_exists")?"هذه المدينة موجودة بالفعل في الساعة.":
    msg.includes("trash_item_expired")?"انتهت مدة استعادة هذه المدينة.":
    "تعذّر حفظ التغيير في حسابك. لم تتغير إعدادات الساعة؛ حاول مجددًا بعد التحقق من الاتصال.");
  return false;
 }finally{
  worldClockBusy=false;
  if(currentUser?.id===userId)refreshWorldClockFromCloud();
 }
}
function worldClockState(hour){
  if(hour>=8&&hour<18)return {label:"وقت عمل",className:"work"};
  if(hour>=18&&hour<23)return {label:"مساء",className:"evening"};
  return {label:"ليل / مبكر",className:"night"};
}
function utcOffsetText(date,zone){
  const offset=zoneOffsetMinutes(date,zone),sign=offset>=0?"+":"−",abs=Math.abs(offset),hours=Math.floor(abs/60),minutes=abs%60;
  return `UTC${sign}${hours}${minutes?":"+String(minutes).padStart(2,"0"):""}`;
}
function worldTimelineReferenceInstant(){
  const date=document.getElementById("worldConvertDate")?.value,time=document.getElementById("worldConvertTime")?.value,from=resolvedZoneFromInput(document.getElementById("worldFromZone"));
  if(validDateKey(date)&&TIME_RE.test(String(time))&&from.entry){const instant=wallTimeToInstant(date,time,from.entry.zone);if(instant)return instant}
  return new Date();
}
function selectWorldTimelineHour(time){
  const date=document.getElementById("worldConvertDate"),clock=document.getElementById("worldConvertTime"),from=document.getElementById("worldFromZone");
  if(!date||!clock||!from)return;const base=savedWorldClockBase(),reference=worldTimelineReferenceInstant();date.value=dateKeyInZone(reference,base);clock.value=time;setTimeZoneInput(from,base);convertWorldTime();
}
function renderWorldTimeline(){
  const box=document.getElementById("worldTimeline");if(!box)return;
  const base=savedWorldClockBase(),reference=worldTimelineReferenceInstant(),baseDate=dateKeyInZone(reference,base),selectedHour=zonedParts(reference,base).hour,zones=savedWorldClockZones();
  const baseLabel=timeZoneShortLabel(base)||base;
  const header=`<div class="world-timeline-row world-timeline-axis"><div class="world-timeline-label"><strong>الوقت</strong><small>نظام 12 ساعة</small></div>${Array.from({length:24},(_,hour)=>`<button type="button" class="world-hour-cell" tabindex="-1">${esc(worldHour12Label(hour))}</button>`).join("")}</div>`;
  const rows=zones.map(zone=>{
    const entry=timeZoneEntry(zone),label=entry?.label||zone;
    const cells=Array.from({length:24},(_,hour)=>{
      const baseTime=`${String(hour).padStart(2,"0")}:00`,instant=wallTimeToInstant(baseDate,baseTime,base);if(!instant)return "";
      const p=zonedParts(instant,zone),state=worldClockState(p.hour),selected=hour===selectedHour?" selected":"";
      return `<button type="button" class="world-hour-cell ${state.className}${selected}" title="${esc(label)} · ${esc(worldHour12Label(p.hour))}" onclick="selectWorldTimelineHour('${baseTime}')">${esc(worldHour12Label(p.hour))}</button>`;
    }).join("");
    return `<div class="world-timeline-row"><div class="world-timeline-label"><strong>${esc(zone===base?baseLabel:label)}</strong><small>${zone===base?"التوقيت الأساسي":esc(worldOffsetText(reference,zone,base))}</small></div>${cells}</div>`;
  }).join("");
  box.innerHTML=header+rows;
}
function renderWorldClockCards(){
  const box=document.getElementById("worldClockCards");if(!box)return;
  const now=new Date(),base=savedWorldClockBase(),zones=savedWorldClockZones(),homeParts=zonedParts(now,base),homeState=worldClockState(homeParts.hour),baseLabel=timeZoneShortLabel(base)||base;
  const heroTime=document.getElementById("worldHomeTime"),heroMeta=document.getElementById("worldHomeMeta"),clock=document.getElementById("worldAnalogClock"),kicker=document.getElementById("worldHeroKicker");
  if(kicker)kicker.textContent=`التوقيت الأساسي · ${baseLabel}`;
  if(heroTime)heroTime.textContent=formattedTimeInZone(now,base);
  if(heroMeta){const dateKey=dateKeyInZone(now,base),dateText=new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"});heroMeta.innerHTML=`${esc(dateText)}<br>${esc(utcOffsetText(now,base))} · ${esc(homeState.label)}`}
  if(clock){const minute=homeParts.minute,hour=(homeParts.hour%12)+minute/60;clock.style.setProperty("--minute-angle",`${minute*6}deg`);clock.style.setProperty("--hour-angle",`${hour*30}deg`);clock.setAttribute("aria-label",`ساعة ${baseLabel} الآن`)}
  const otherZones=zones.filter(zone=>zone!==base);
  box.innerHTML=otherZones.length?otherZones.map(zone=>{
    const entry=timeZoneEntry(zone),parts=zonedParts(now,zone),state=worldClockState(parts.hour),dateKey=dateKeyInZone(now,zone),dateText=new Date(`${dateKey}T12:00:00Z`).toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"short",timeZone:"UTC"});
    const country=entry?.country||timeZoneShortLabel(zone)||zone,rawCity=entry?.city&&normalizeZoneSearch(entry.city)!==normalizeZoneSearch(country)?entry.city:"",city=worldCityArabicName(rawCity,zone),flag=worldFlagMarkup(entry?.code,country),clockLabel=city?`${country}، ${city}`:country;
    return `<article class="world-clock-card world-city-clock-card"><button type="button" class="world-remove" aria-label="إزالة ${esc(entry?.label||zone)}" onclick="removeWorldClockZone('${esc(zone)}')">×</button><div class="world-city-clock-layout">${worldMiniClockMarkup(now,zone,clockLabel)}<div class="world-city-clock-info"><div class="world-city-title"><span class="world-country-flag">${flag}</span><div><strong>${esc(country)}</strong>${city?`<small>${esc(city)}</small>`:""}</div></div><div class="world-clock-time">${esc(formattedTimeInZone(now,zone))}</div><div class="world-clock-date">${esc(dateText)}</div><div class="world-city-clock-meta"><span class="world-zone-state ${state.className}">${esc(state.label)}</span><span class="world-offset-chip">${esc(worldOffsetText(now,zone,base))}</span></div></div></div></article>`;
  }).join(""):`<div class="world-clock-empty">أضف بلد الطالب أو مدينته، وسيظهر هنا بساعة مستقلة ووقت رقمي مقارنة بالتوقيت الأساسي.</div>`;
  renderWorldTimeline();
}
function worldBaseInputChanged(input){if(input.value!==input.dataset.zoneLabel){input.dataset.zone="";input.dataset.zoneLabel=""}}
async function changeWorldClockBase(){
  const input=document.getElementById("worldBaseZone"),hint=document.getElementById("worldBaseHint"),result=resolvedZoneFromInput(input);if(!input)return;
  if(!result.entry){if(hint)hint.textContent=result.ambiguous?"هذه الدولة لها أكثر من منطقة زمنية؛ اختر المدينة أو المنطقة من القائمة.":"اختر دولة أو مدينة واضحة من الاقتراحات.";return}
  if(result.entry.zone===savedWorldClockBase())return;
  const saved=await mutateWorldClock("base",result.entry.zone);
  if(currentUser?.id===worldClockSettings?.userId&&currentSection==="world")openWorldClock();
  if(!saved&&hint)hint.textContent="لم يُحفظ تغيير التوقيت الأساسي.";
}
function setWorldConverterNow(){
  const fromResult=resolvedZoneFromInput(document.getElementById("worldFromZone")),zone=fromResult.entry?.zone||savedWorldClockBase(),now=new Date(),date=document.getElementById("worldConvertDate"),time=document.getElementById("worldConvertTime");
  if(date)date.value=dateKeyInZone(now,zone);if(time)time.value=timeKeyInZone(now,zone);convertWorldTime();
}
async function addWorldClockZone(){
  const input=document.getElementById("worldZoneSearch"),result=resolvedZoneFromInput(input);if(!input||!input.value.trim())return;
  if(!result.entry){const hint=document.getElementById("worldZoneSearchHint");if(hint)hint.textContent=result.ambiguous?"هذه الدولة فيها أكثر من منطقة زمنية؛ اختر المدينة/المنطقة من الاقتراحات.":"لم أتعرف على المنطقة. اختر نتيجة من القائمة.";return}
  if(savedWorldClockZones().includes(result.entry.zone))return;
  const saved=await mutateWorldClock("add",result.entry.zone);
  if(saved){const field=document.getElementById("worldZoneSearch");if(field){field.value="";field.dataset.zone="";field.dataset.zoneLabel=""}}
}
async function removeWorldClockZone(zone){
 if(!validTimeZone(zone)||zone===savedWorldClockBase()||!savedWorldClockZones().includes(zone))return;
 if(!confirm(`إزالة ${timeZoneEntry(zone)?.label||zone} ونقلها إلى سلة المحذوفات لمدة 30 يومًا؟`))return;
 await mutateWorldClock("remove",zone);
}
function worldZoneInputChanged(input){if(input.value!==input.dataset.zoneLabel){input.dataset.zone="";input.dataset.zoneLabel=""}}
function convertWorldTime(){
  const date=document.getElementById("worldConvertDate")?.value,time=document.getElementById("worldConvertTime")?.value,fromResult=resolvedZoneFromInput(document.getElementById("worldFromZone")),toResult=resolvedZoneFromInput(document.getElementById("worldToZone")),box=document.getElementById("worldConvertResult");if(!box)return;
  if(!validDateKey(date)||!TIME_RE.test(time)){box.className="world-convert-result error";box.textContent="اختر تاريخًا ووقتًا صحيحين.";return}
  if(!fromResult.entry||!toResult.entry){box.className="world-convert-result error";box.textContent="اختر منطقتين زمنيتين واضحتين من الاقتراحات؛ الدول متعددة التوقيت تحتاج تحديد المدينة أو المنطقة.";return}
  const instant=wallTimeToInstant(date,time,fromResult.entry.zone);if(!instant){box.className="world-convert-result error";box.textContent="تعذّر تحويل هذا الموعد.";return}
  const targetDate=dateKeyInZone(instant,toResult.entry.zone),targetRaw=timeKeyInZone(instant,toResult.entry.zone),sourceLabel=timeZoneShortLabel(fromResult.entry.zone)||fromResult.entry.label,targetLabel=timeZoneShortLabel(toResult.entry.zone)||toResult.entry.label;
  const sourceDateText=new Date(`${date}T12:00:00Z`).toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"}),targetDateText=new Date(`${targetDate}T12:00:00Z`).toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"}),targetHour=Number(targetRaw.slice(0,2)),warning=targetHour<6||targetHour>=23;
  box.className="world-convert-result";box.innerHTML=`<div class="world-result-head"><span>النتيجة</span><small>${esc(worldDifferenceText(instant,fromResult.entry.zone,toResult.entry.zone))}</small></div><div class="world-result-times"><div class="world-result-time-card"><small>${esc(sourceLabel)}</small><strong>${esc(fmt(time))}</strong></div><div class="world-result-arrow">←</div><div class="world-result-time-card"><small>${esc(targetLabel)}</small><strong>${esc(fmt(targetRaw))}</strong></div></div><div class="world-result-meta">${esc(sourceDateText)} ← ${esc(targetDateText)}${esc(dayShiftLabel(date,targetDate))}</div>${warning?'<div class="world-result-warning">هذا الموعد يقع في وقت متأخر جدًا أو مبكر جدًا في المنطقة الثانية.</div>':""}`;
  renderWorldTimeline();
}
function swapWorldConverter(){
  const from=document.getElementById("worldFromZone"),to=document.getElementById("worldToZone");if(!from||!to)return;
  const a={value:from.value,zone:from.dataset.zone,label:from.dataset.zoneLabel};from.value=to.value;from.dataset.zone=to.dataset.zone||"";from.dataset.zoneLabel=to.dataset.zoneLabel||"";to.value=a.value;to.dataset.zone=a.zone||"";to.dataset.zoneLabel=a.label||"";convertWorldTime();
}
function openWorldClock(){
  closeDataMenu();currentSection="world";updateSectionChrome();
  const ticks=Array.from({length:60},(_,index)=>{const angle=index*6*Math.PI/180,r=index%5===0?45.5:46.5,x=50+r*Math.sin(angle),y=50-r*Math.cos(angle);return `<i class="world-clock-tick${index%5===0?" major":""}" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%"></i>`}).join("");
  const numbers=Array.from({length:12},(_,index)=>{const number=index+1,angle=number*30*Math.PI/180,r=37.5,x=50+r*Math.sin(angle),y=50-r*Math.cos(angle);return `<span class="world-clock-number" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%">${number}</span>`}).join("");
  const content=`<div class="world-clock-tool world-clock-tool-v2">
    <section class="world-clock-hero world-clock-hero-v2">
      <div class="world-hero-content world-hero-content-v2">
        <div class="world-hero-copy world-hero-copy-v2">
          <div class="world-hero-topline"><span class="world-hero-kicker" id="worldHeroKicker">التوقيت الأساسي · مصر</span><button type="button" class="world-base-change" onclick="document.getElementById('worldBaseZone')?.focus()">تغيير</button></div>
          <h3>الساعة العالمية</h3>
          <p>اعرف وقت طلابك، وقارن بين البلدان، وحوّل مواعيد الدروس بدون حساب فرق الساعات يدويًا.</p>
          <div class="world-base-control world-base-control-v2"><label for="worldBaseZone">التوقيت الأساسي</label><input id="worldBaseZone" list="worldTimeZoneOptions" autocomplete="off" placeholder="مصر — القاهرة" oninput="worldBaseInputChanged(this)" onchange="changeWorldClockBase()"><div class="world-base-hint" id="worldBaseHint"></div></div>
        </div>
        <div class="world-hero-now">
          <div class="world-analog-clock" id="worldAnalogClock" aria-label="الساعة الآن">${ticks}${numbers}<span class="world-clock-center"></span></div>
          <div class="world-now-copy"><span class="world-now-label">الوقت الآن</span><div class="world-home-time" id="worldHomeTime">—</div><div class="world-home-meta" id="worldHomeMeta">—</div></div>
        </div>
      </div>
    </section>

    <section class="world-clock-section world-timeline-section world-timeline-featured">
      <div class="world-timeline-head"><div><div class="world-timeline-title-row"><span class="world-feature-tag">نظرة سريعة</span><h3>مقارنة اليوم بصريًا</h3></div><p>شاهد نفس اللحظة عند كل بلد بنظام 12 ساعة، واضغط أي ساعة لاستخدامها مباشرة في المحول.</p></div><div class="world-timeline-tools"><span class="world-format-badge">12 ساعة</span><div class="world-timeline-legend"><span><i></i>ليل</span><span class="work"><i></i>وقت مناسب</span><span class="evening"><i></i>مساء</span></div></div></div>
      <div class="world-timeline-scroll"><div class="world-timeline" id="worldTimeline"></div></div>
      <div class="world-timeline-note"><b>ملاحظة:</b> الألوان للمساعدة البصرية فقط؛ التحويل يعتمد على المنطقة الزمنية الحقيقية وتاريخ الموعد.</div>
    </section>

    <div class="world-dashboard-grid world-dashboard-grid-v2">
      <section class="world-clock-section"><header><div><h3>بلاد الطلاب</h3><p>احفظ المناطق التي تتعامل معها لتراها دائمًا مقارنة بالتوقيت الأساسي.</p></div><span class="world-section-badge">يتحدث تلقائيًا</span></header><div class="world-zone-add"><input id="worldZoneSearch" list="worldTimeZoneOptions" placeholder="ابحث باسم الدولة أو المدينة" autocomplete="off" oninput="worldZoneInputChanged(this)"><button type="button" onclick="addWorldClockZone()">＋ إضافة بلد</button></div><div class="world-search-hint" id="worldZoneSearchHint">إذا كانت الدولة متعددة التوقيت فاختر المدينة أو المنطقة المناسبة من القائمة.</div><datalist id="worldTimeZoneOptions"></datalist><div class="world-clock-cards" id="worldClockCards"></div></section>
      <section class="world-clock-section world-converter-section"><header><div><h3>تحويل موعد</h3><p>حدّد الموعد أولًا، ثم اختر التوقيتين وشاهد النتيجة بوضوح.</p></div><span class="world-section-badge">DST تلقائي</span></header><div class="world-convert-shell"><div class="world-convert-when"><div class="field"><label for="worldConvertDate">التاريخ</label><input id="worldConvertDate" type="date" onchange="convertWorldTime()"></div><div class="field"><label for="worldConvertTime">الساعة</label><input id="worldConvertTime" type="time" oninput="convertWorldTime()"></div></div><div class="world-convert-route"><div class="world-zone-picker"><div class="field"><label for="worldFromZone">من توقيت</label><input id="worldFromZone" list="worldTimeZoneOptions" autocomplete="off" oninput="worldZoneInputChanged(this)" onchange="convertWorldTime()"></div></div><button type="button" class="world-swap-zone" onclick="swapWorldConverter()" title="عكس الاتجاه" aria-label="عكس اتجاه التحويل">⇄</button><div class="world-zone-picker"><div class="field"><label for="worldToZone">إلى توقيت</label><input id="worldToZone" list="worldTimeZoneOptions" autocomplete="off" oninput="worldZoneInputChanged(this)" onchange="convertWorldTime()"></div></div></div><div class="world-convert-actions"><button type="button" onclick="convertWorldTime()">تحويل الموعد</button><button type="button" class="secondary" onclick="setWorldConverterNow()">الآن</button></div><div class="world-convert-result" id="worldConvertResult" aria-live="polite"></div></div></section>
    </div>
  </div>`;
  const mount=document.getElementById("worldClockPageMount");if(!mount)return;mount.innerHTML=content;populateTimeZoneDatalist("worldTimeZoneOptions");
  const base=savedWorldClockBase();setTimeZoneInput(document.getElementById("worldBaseZone"),base);setTimeZoneInput(document.getElementById("worldFromZone"),base);const target=savedWorldClockZones().find(zone=>zone!==base)||SCHEDULE_TIMEZONE;setTimeZoneInput(document.getElementById("worldToZone"),validTimeZone(target)?target:base);
  const now=new Date();document.getElementById("worldConvertDate").value=dateKeyInZone(now,base);document.getElementById("worldConvertTime").value=timeKeyInZone(now,base);renderWorldClockCards();convertWorldTime();
  if(worldClockInterval)clearInterval(worldClockInterval);worldClockInterval=setInterval(renderWorldClockCards,30000);
}
function lessonTimeZoneInputChanged(){const input=document.getElementById("studentTimeZoneInput");if(input&&input.value!==input.dataset.zoneLabel){input.dataset.zone="";input.dataset.zoneLabel=""}updateStudentTimeZoneHint()}
function readLessonTimeZone(){const input=document.getElementById("studentTimeZoneInput");if(!input||!input.value.trim())return "";return resolvedZoneFromInput(input).entry?.zone||""}
function setLessonTimeZoneField(zone=""){
  populateTimeZoneDatalist("lessonTimeZoneOptions");const input=document.getElementById("studentTimeZoneInput");if(!input)return;
  if(validTimeZone(zone))setTimeZoneInput(input,zone);else{input.value="";input.dataset.zone="";input.dataset.zoneLabel=""}updateStudentTimeZoneHint();
}
function updateStudentTimeZoneHint(){
  const input=document.getElementById("studentTimeZoneInput"),hint=document.getElementById("studentTimeZoneHint");if(!input||!hint)return;
  hint.classList.remove("warn","error");if(!input.value.trim()){hint.textContent="اختياري — سيظهر وقت الطالب بجانب موعد مصر، ويتغير تلقائيًا مع التوقيت الصيفي.";return}
  const result=resolveTimeZoneText(input.value);if(!result.entry){hint.classList.add(result.ambiguous?"warn":"error");hint.textContent=result.ambiguous?"هذه الدولة فيها أكثر من منطقة زمنية؛ اختر المدينة أو المنطقة من الاقتراحات.":"اختر منطقة زمنية صحيحة من الاقتراحات.";return}
  input.dataset.zone=result.entry.zone;input.dataset.zoneLabel=result.entry.label;
  const schedules=readSchedules();if(!schedules.length){hint.textContent=`تم اختيار ${result.entry.label}.`;return}
  const first=schedules[0];let date=weekDateForDay(first.day,currentDateKey());if(date<currentDateKey()||(date===currentDateKey()&&mins(first.time)<mins(currentTimeKey())))date=addDaysToDateKey(date,7);
  const info=studentTimeInfo({lesson:{studentTimeZone:result.entry.zone},date,time:first.time});if(!info){hint.textContent=`تم اختيار ${result.entry.label}.`;return}
  hint.classList.toggle("warn",info.odd);hint.textContent=`${first.day} ${fmt(first.time)} في مصر = ${info.time} لدى الطالب (${info.label})${info.shift}.${info.odd?" هذا وقت متأخر/مبكر لدى الطالب.":""}`;
}
function urlBase64ToUint8Array(value){
  const padding="=".repeat((4-value.length%4)%4);
  const base64=(value+padding).replace(/-/g,"+").replace(/_/g,"/");
  const raw=atob(base64);
  return Uint8Array.from([...raw].map(char=>char.charCodeAt(0)));
}
function notificationSupport(){
  return "Notification" in window&&"serviceWorker" in navigator&&"PushManager" in window;
}
async function getAppWorker(){
  if(!("serviceWorker" in navigator))return null;
  if(!serviceWorkerRegistration)await registerAppWorker();
  try{
    const ready=await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_,reject)=>setTimeout(()=>reject(new Error("service_worker_timeout")),8000))
    ]);
    serviceWorkerRegistration=ready;
    return ready;
  }catch{
    return serviceWorkerRegistration?.active?serviceWorkerRegistration:null;
  }
}
function updateNotificationMenuStatus(enabled){
  const status=document.getElementById("notificationMenuStatus");
  if(!status)return;
  status.textContent=enabled?"مفعّلة":"غير مفعّلة";
  status.classList.toggle("on",Boolean(enabled));
}
async function refreshNotificationMenuStatus(){
  if(!currentUser||!notificationSupport()){updateNotificationMenuStatus(false);return false}
  try{
    const registration=await getAppWorker();
    const subscription=await registration?.pushManager.getSubscription();
    let enabled=Notification.permission==="granted"&&Boolean(subscription);
    if(enabled&&cloud&&currentUser){
      const {data,error}=await cloud.from(PUSH_SUBSCRIPTIONS_TABLE)
        .select("id")
        .eq("user_id",currentUser.id)
        .eq("endpoint",subscription.endpoint)
        .maybeSingle();
      if(error)throw error;
      enabled=Boolean(data);
    }
    updateNotificationMenuStatus(enabled);
    return enabled;
  }catch{
    updateNotificationMenuStatus(false);
    return false;
  }
}
function notificationSettingsMarkup({supported,configured,requiresInstall=false,permission,enabled,leads=DEFAULT_NOTIFICATION_LEADS,error=""}){
  if(!supported)return '<div class="tool-status error">هذا المتصفح لا يدعم تنبيهات الويب. جرّب Chrome أو Edge، أو ثبّت الموقع من Safari على iPhone.</div>';
  if(requiresInstall)return '<div class="tool-status">على iPhone وiPad يجب تثبيت مواعيدي على الشاشة الرئيسية أولًا، ثم فتحه من الأيقونة وتفعيل التنبيهات من داخله.</div><div class="tool-actions"><button type="button" class="tool-primary" onclick="installApp()">طريقة التثبيت</button></div>';
  if(!configured)return '<div class="tool-status">الميزة مجهّزة في النسخة المحلية، وستصبح قابلة للتفعيل بعد اعتماد التحديث وإضافة مفتاح التنبيهات الآمن.</div><div class="tool-card"><h3>كيف ستعمل؟</h3><p>بعد النشر ستضغط «تفعيل التنبيهات» مرة واحدة على كل جهاز، وستصلك الرسالة قبل الحصة حتى إن كان التطبيق مغلقًا.</p></div>';
  const leadValues=normalizeNotificationLeads(leads);
  const statusClass=error?"error":enabled?"on":"";
  const statusText=error|| (enabled?"التنبيهات مفعّلة على هذا الجهاز.":permission==="denied"?"المتصفح حظر التنبيهات. اسمح بها من إعدادات الموقع ثم أعد المحاولة.":"التنبيهات غير مفعّلة على هذا الجهاز.");
  return `<div class="tool-status ${statusClass}">${esc(statusText)}</div>
    <div class="tool-card">
      <h3>مواعيد التنبيه الافتراضية</h3>
      <p>اختر من تنبيه إلى ثلاثة لكل حصة. ويمكنك تخصيص أي حصة من نافذة تعديلها.</p>
      <div class="notification-leads" id="notificationLeadChoices" data-enabled="${enabled?"true":"false"}">${notificationLeadChoices(leadValues)}</div>
      <div class="notification-features" aria-label="خصائص التنبيه">
        <span class="notification-feature">صوت النظام</span>
        <span class="notification-feature">اهتزاز عند دعمه</span>
        <span class="notification-feature">يعمل والتطبيق مغلق</span>
      </div>
      <div class="tool-actions">
        <button type="button" class="${enabled?"tool-danger":"tool-primary"}" id="notificationToggle" onclick="${enabled?"disableNotifications()":"enableNotifications()"}">${enabled?"إيقاف التنبيهات":"تفعيل التنبيهات"}</button>
        ${enabled?'<button type="button" class="tool-secondary" id="notificationTest" onclick="testNotificationNow()">اختبار الصوت والتنبيه</button>':""}
      </div>
      <p class="install-help">الصوت هو صوت الإشعارات الذي اخترته في الجهاز، وقد يمنعه الوضع الصامت أو «عدم الإزعاج». لا يستطيع الموقع معرفة إن كان صوت الجهاز مكتومًا.</p>
    </div>`;
}
async function readNotificationState(){
  const base={supported:notificationSupport(),configured:vapidKeyIsConfigured(),requiresInstall:isIOS()&&!isStandalone(),permission:"default",enabled:false,leads:savedNotificationLeads(),error:""};
  if(!base.supported||base.requiresInstall)return base;
  base.permission=Notification.permission;
  try{
    const registration=await getAppWorker();
    const subscription=await registration?.pushManager.getSubscription();
    base.enabled=false;
    if(base.permission==="granted"&&subscription&&cloud&&currentUser){
      const {data,error}=await cloud.from(PUSH_SUBSCRIPTIONS_TABLE)
        .select("lead_minutes,lead_minutes_list")
        .eq("user_id",currentUser.id)
        .eq("endpoint",subscription.endpoint)
        .maybeSingle();
      if(error)throw error;
      base.enabled=Boolean(data);
      if(base.enabled)base.leads=rememberNotificationLeads(data?.lead_minutes_list?.length?data.lead_minutes_list:[data?.lead_minutes]);
    }
  }catch(error){
    console.warn("تعذّر قراءة إعداد التنبيهات.",error);
    base.error="تعذّر قراءة إعداد التنبيهات. تحقق من الإنترنت ثم حاول مرة أخرى.";
  }
  return base;
}
async function openNotificationSettings(){
  closeDataMenu();
  if(!currentUser||!cloudReady){alert("انتظر حتى يكتمل تحميل حسابك ثم حاول مرة أخرى.");return}
  openToolDialog("تنبيهات الحصص","إعداد مستقل لكل هاتف أو كمبيوتر.",'<div class="tool-status">جارٍ قراءة إعداد هذا الجهاز…</div>');
  const state=await readNotificationState();
  if(!document.getElementById("toolBackdrop").classList.contains("show"))return;
  document.getElementById("toolBody").innerHTML=notificationSettingsMarkup(state);
  updateNotificationMenuStatus(state.enabled);
}
function notificationFailureMessage(error,stage){
  if(!navigator.onLine)return "الجهاز غير متصل بالإنترنت. اتصل بالإنترنت ثم أعد المحاولة.";
  if(error?.message==="permission_denied"||Notification.permission==="denied"||error?.name==="NotAllowedError"){
    return "المتصفح حظر الإشعارات. افتح إعدادات هذا الموقع واجعل الإشعارات «سماح»، ثم أعد المحاولة.";
  }
  if(error?.message==="permission_dismissed")return "لم يتم منح الإذن. اضغط تفعيل ثم اختر «سماح» في رسالة المتصفح.";
  if(stage==="worker")return "تعذّر تشغيل خدمة التنبيهات داخل التطبيق. أغلق التطبيق وافتحه ثم حاول مرة أخرى.";
  if(stage==="subscribe"){
    if(error?.name==="InvalidAccessError")return "مفتاح خدمة التنبيهات غير صالح. يحتاج إعداد الموقع إلى تصحيح.";
    if(error?.name==="AbortError")return "تعذّر الاتصال بخدمة إشعارات المتصفح. تأكد أن إشعارات المتصفح مسموحة في نظام الجهاز.";
    return "المتصفح لم يتمكن من إنشاء اشتراك التنبيهات على هذا الجهاز.";
  }
  if(stage==="cloud"){
    if(error?.code==="23505")return "اشتراك هذا الجهاز مرتبط مسبقًا بحساب آخر.";
    if(error?.code==="42501")return "تم السماح بالإشعارات، لكن قاعدة البيانات رفضت حفظ اشتراك الجهاز.";
    return "تم السماح بالإشعارات، لكن تعذّر ربط هذا الجهاز بحسابك السحابي.";
  }
  return "تعذّر تفعيل التنبيهات على هذا الجهاز.";
}
async function storePushSubscription(subscription,leads){
  const json=subscription.toJSON();
  const normalizedLeads=normalizeNotificationLeads(leads);
  const payload={
    user_id:currentUser.id,
    endpoint:subscription.endpoint,
    p256dh:json.keys?.p256dh||"",
    auth_key:json.keys?.auth||"",
    timezone:SCHEDULE_TIMEZONE,
    lead_minutes:Math.min(...normalizedLeads),
    lead_minutes_list:normalizedLeads,
    updated_at:new Date().toISOString()
  };
  const {data:existing,error:lookupError}=await cloud.from(PUSH_SUBSCRIPTIONS_TABLE)
    .select("id")
    .eq("user_id",currentUser.id)
    .eq("endpoint",subscription.endpoint)
    .maybeSingle();
  if(lookupError)throw lookupError;
  if(existing?.id){
    const {error}=await cloud.from(PUSH_SUBSCRIPTIONS_TABLE)
      .update({
        p256dh:payload.p256dh,
        auth_key:payload.auth_key,
        timezone:payload.timezone,
        lead_minutes:payload.lead_minutes,
        lead_minutes_list:payload.lead_minutes_list,
        updated_at:payload.updated_at
      })
      .eq("user_id",currentUser.id)
      .eq("id",existing.id);
    if(error)throw error;
    return existing.id;
  }
  const {error}=await cloud.from(PUSH_SUBSCRIPTIONS_TABLE).insert(payload);
  if(error)throw error;
  return true;
}
async function enableNotifications(){
  if(notificationBusy||!currentUser||!cloudReady)return;
  if(!notificationSupport()||!vapidKeyIsConfigured()){await openNotificationSettings();return}
  notificationBusy=true;
  const button=document.getElementById("notificationToggle");if(button)button.disabled=true;
  const selected=checkedNotificationLeads("#notificationLeadChoices .notification-lead");
  const leads=rememberNotificationLeads(selected.length?selected:savedNotificationLeads());
  let stage="permission";
  try{
    const permission=await Notification.requestPermission();
    if(permission==="denied")throw new Error("permission_denied");
    if(permission!=="granted")throw new Error("permission_dismissed");
    stage="worker";
    const registration=await getAppWorker();
    if(!registration)throw new Error("service_worker_unavailable");
    stage="subscribe";
    let subscription=await registration.pushManager.getSubscription();
    if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)});
    stage="cloud";
    await storePushSubscription(subscription,leads);
    updateNotificationMenuStatus(true);
    await openNotificationSettings();
  }catch(error){
    console.error("تعذّر تفعيل التنبيهات.",{stage,name:error?.name,code:error?.code,message:error?.message});
    const state=await readNotificationState();
    state.leads=leads;
    state.error=notificationFailureMessage(error,stage);
    document.getElementById("toolBody").innerHTML=notificationSettingsMarkup(state);
  }finally{
    notificationBusy=false;
  }
}
async function saveNotificationLeads(changedInput){
  if(notificationBusy||!currentUser||!cloudReady)return;
  const choices=document.getElementById("notificationLeadChoices");
  let leads=checkedNotificationLeads("#notificationLeadChoices .notification-lead");
  const status=document.querySelector(".tool-status");
  if(!leads.length){
    if(changedInput)changedInput.checked=true;
    leads=checkedNotificationLeads("#notificationLeadChoices .notification-lead");
    if(status){status.className="tool-status error";status.textContent="اختر موعد تنبيه واحدًا على الأقل."}
    return;
  }
  if(leads.length>MAX_NOTIFICATION_LEADS){
    if(changedInput)changedInput.checked=false;
    leads=checkedNotificationLeads("#notificationLeadChoices .notification-lead");
    if(status){status.className="tool-status error";status.textContent="يمكن اختيار ثلاثة تنبيهات بحد أقصى."}
    return;
  }
  leads=rememberNotificationLeads(leads);
  if(choices?.dataset.enabled!=="true"){
    if(status){status.className="tool-status";status.textContent=`سيتم التنبيه قبل ${notificationLeadsText(leads)} عند التفعيل.`}
    return;
  }
  notificationBusy=true;
  try{
    const registration=await getAppWorker();
    const subscription=await registration?.pushManager.getSubscription();
    if(!subscription||Notification.permission!=="granted"){
      if(status){status.className="tool-status";status.textContent=`سيتم التنبيه قبل ${notificationLeadsText(leads)} عند التفعيل.`}
      return;
    }
    const {data:existing,error:lookupError}=await cloud.from(PUSH_SUBSCRIPTIONS_TABLE)
      .select("id")
      .eq("user_id",currentUser.id)
      .eq("endpoint",subscription.endpoint)
      .maybeSingle();
    if(lookupError)throw lookupError;
    if(!existing?.id){
      if(status){status.className="tool-status";status.textContent=`تم اختيار ${notificationLeadsText(leads)}. اضغط «تفعيل التنبيهات» لحفظها.`}
      return;
    }
    const {error}=await cloud.from(PUSH_SUBSCRIPTIONS_TABLE)
      .update({lead_minutes:Math.min(...leads),lead_minutes_list:leads,timezone:SCHEDULE_TIMEZONE,updated_at:new Date().toISOString()})
      .eq("user_id",currentUser.id)
      .eq("id",existing.id);
    if(error)throw error;
    if(status){status.className="tool-status on";status.textContent=`تم الحفظ: التنبيه قبل ${notificationLeadsText(leads)}.`}
  }catch(error){
    console.error("تعذّر حفظ مواعيد التنبيه.",error);
    if(status){status.className="tool-status error";status.textContent="تعذّر حفظ مواعيد التنبيه في حسابك. تحقق من الإنترنت وحاول مرة أخرى."}
  }finally{notificationBusy=false}
}
async function testNotificationNow(){
  if(notificationBusy)return;
  notificationBusy=true;
  const button=document.getElementById("notificationTest");if(button)button.disabled=true;
  const status=document.querySelector(".tool-status");
  try{
    if(Notification.permission!=="granted")throw new Error("permission_denied");
    const registration=await getAppWorker();
    if(!registration)throw new Error("service_worker_unavailable");
    await registration.showNotification("اختبار تنبيهات مواعيدي",{
      body:"إذا سمعت الصوت أو شعرت بالاهتزاز، فإعداد الجهاز يعمل.",
      icon:"./icons/icon-192.png",
      badge:"./icons/icon-192.png",
      lang:"ar",
      dir:"rtl",
      tag:`mawaeidi-test-${Date.now()}`,
      renotify:true,
      silent:false,
      vibrate:[200,120,200],
      requireInteraction:true,
      timestamp:Date.now(),
      data:{url:"./"}
    });
    if(status){status.className="tool-status on";status.textContent="تم إرسال الاختبار. إن ظهر بلا صوت، ارفع صوت الإشعارات وأوقف «عدم الإزعاج» ثم اختبر مرة أخرى."}
  }catch(error){
    console.error("تعذّر اختبار التنبيه.",error);
    if(status){status.className="tool-status error";status.textContent=notificationFailureMessage(error,error?.message==="service_worker_unavailable"?"worker":"permission")}
  }finally{
    notificationBusy=false;
    if(button)button.disabled=false;
  }
}
async function disableNotifications(silent=false){
  if(notificationBusy)return false;
  notificationBusy=true;
  const button=document.getElementById("notificationToggle");if(button)button.disabled=true;
  try{
    const registration=await getAppWorker();
    const subscription=await registration?.pushManager.getSubscription();
    if(subscription&&cloud&&currentUser){
      const {error}=await cloud.from(PUSH_SUBSCRIPTIONS_TABLE).delete().eq("user_id",currentUser.id).eq("endpoint",subscription.endpoint);
      if(error&&!silent)throw error;
      await subscription.unsubscribe();
    }
    updateNotificationMenuStatus(false);
    if(!silent)await openNotificationSettings();
    return true;
  }catch(error){
    console.error("تعذّر إيقاف التنبيهات.",error);
    if(!silent){const status=document.querySelector(".tool-status");if(status){status.className="tool-status error";status.textContent="تعذّر إيقاف التنبيهات. حاول مرة أخرى."}}
    return false;
  }finally{notificationBusy=false}
}
function sessionOnlyHistorySummary(beforeLesson,afterLesson){
  if(!beforeLesson||!afterLesson)return null;
  const {sessionRecords:beforeRecords=[],...beforeBase}=beforeLesson;
  const {sessionRecords:afterRecords=[],...afterBase}=afterLesson;
  if(JSON.stringify(beforeBase)!==JSON.stringify(afterBase)||JSON.stringify(beforeRecords)===JSON.stringify(afterRecords))return null;
  const beforeMap=new Map(beforeRecords.map(item=>[item.id,item])),afterMap=new Map(afterRecords.map(item=>[item.id,item]));
  const changed=afterRecords.find(item=>!beforeMap.has(item.id)||JSON.stringify(beforeMap.get(item.id))!==JSON.stringify(item));
  const removed=beforeRecords.find(item=>!afterMap.has(item.id));
  const record=(changed?.kind==="base"?changed:null)||(removed?.kind==="base"?removed:null)||changed||removed;
  let detail="تم تحديث حالة إحدى الحصص.";
  if(record){
    const date=record.kind==="replacement"?record.date:record.date,time=record.time;
    const label=!changed?"عادت إلى الحالة التلقائية":changed.kind==="replacement"&&changed.status==="default"?"موعد بديل":sessionStatusInfo(changed.status).full;
    detail=`${formatSessionDate(date)} · ${fmt(time)} · ${label}`;
  }
  return {title:`تحديث حالة حصة: ${afterLesson.name||beforeLesson.name||"بدون اسم"}`,detail};
}
function historyChangeSummary(entry){
 const before=Array.isArray(entry?.before_lessons)?entry.before_lessons:[];
 const after=Array.isArray(entry?.after_lessons)?entry.after_lessons:[];
 const beforeMap=new Map(before.map(x=>[x?.id,x])),afterMap=new Map(after.map(x=>[x?.id,x]));
 const added=after.filter(x=>!beforeMap.has(x?.id)),removed=before.filter(x=>!afterMap.has(x?.id));
 const changed=after.filter(x=>beforeMap.has(x?.id)&&JSON.stringify(beforeMap.get(x.id))!==JSON.stringify(x));
 if(added.length===1&&!removed.length&&!changed.length)return {title:`إضافة حصة: ${added[0].name||"بدون اسم"}`,detail:"يمكن الرجوع إلى الجدول قبل إضافتها."};
 if(removed.length===1&&!added.length&&!changed.length)return {title:`حذف حصة: ${removed[0].name||"بدون اسم"}`,detail:"يمكن استرجاع الحصة وكل مواعيدها."};
 if(changed.length===1&&!added.length&&!removed.length){
  const info=sessionOnlyHistorySummary(beforeMap.get(changed[0].id),changed[0]);
  return info||{title:`تعديل حصة: ${changed[0].name||beforeMap.get(changed[0].id)?.name||"بدون اسم"}`,detail:"يمكن استرجاع بياناتها ومواعيدها السابقة."};
 }
 return {title:"تحديث عدة مواعيد",detail:`${added.length} إضافة · ${changed.length} تعديل · ${removed.length} حذف`};
}
function formatHistoryDate(value){
  const date=new Date(value);
  if(!Number.isFinite(date.getTime()))return "وقت غير معروف";
  return new Intl.DateTimeFormat("ar-EG",{dateStyle:"medium",timeStyle:"short"}).format(date);
}
function renderHistoryRows(rows){
  historySnapshots=new Map(rows.map(row=>[String(row.id),row]));
  if(!rows.length)return '<div class="history-empty">لا توجد تعديلات مسجلة حتى الآن.</div>';
  return `<div class="history-list">${rows.map(row=>{
    const summary=historyChangeSummary(row);
    return `<article class="history-item">
      <div class="history-top"><div class="history-summary">${esc(summary.title)}</div><time class="history-time">${esc(formatHistoryDate(row.created_at))}</time></div>
      <div class="history-detail">${esc(summary.detail)}</div>
      <button type="button" class="history-restore" onclick="restoreHistory('${esc(String(row.id))}',this)">استعادة البيانات قبل هذا التغيير</button>
    </article>`;
  }).join("")}</div>`;
}
async function openHistory(){
  closeDataMenu();
  if(!currentUser||!cloudReady){alert("انتظر حتى يكتمل تحميل حسابك ثم حاول مرة أخرى.");return}
  openToolDialog("سجل التعديلات والحذف","آخر 30 تغييرًا محفوظة في حسابك.",'<div class="tool-status">جارٍ تحميل السجل…</div>');
  try{
    const {data,error}=await cloud.from(HISTORY_TABLE)
      .select("id,before_lessons,after_lessons,created_at")
      .eq("user_id",currentUser.id)
      .order("created_at",{ascending:false})
      .limit(30);
    if(error)throw error;
    if(document.getElementById("toolBackdrop").classList.contains("show"))document.getElementById("toolBody").innerHTML=renderHistoryRows(data||[]);
  }catch(error){
    console.error("تعذّر تحميل سجل مواعيدي.",error);
    document.getElementById("toolBody").innerHTML='<div class="tool-status">السجل مجهّز في النسخة المحلية، وسيبدأ حفظ التغييرات بعد اعتماد التحديث وتفعيل جدول السجل.</div>';
  }
}
async function restoreHistory(id,button){
 const snapshot=historySnapshots.get(String(id));
 if(!snapshot||!Array.isArray(snapshot.before_lessons))return;
 if(!confirm("ستعود المواعيد إلى حالتها قبل هذا التغيير. وسيُسجَّل الاسترجاع نفسه في السجل. هل تريد المتابعة؟"))return;
 if(button)button.disabled=true;
 const old=lessons;lessons=normalizeLessons(snapshot.before_lessons);
 if(!await persist()){lessons=old;if(button)button.disabled=false;return}
 render();await openHistory();
}

const TRASH_RETENTION_DAYS=30;
let unifiedTrashItems=[];
let unifiedTrashFilter="all";
let unifiedTrashSequence=0;
function trashCutoff(){return new Date(Date.now()-TRASH_RETENTION_DAYS*86400000).toISOString()}
function renderUnifiedTrash(){
  const target=document.getElementById("toolBody");
  if(!target||!document.getElementById("toolBackdrop").classList.contains("show")||document.getElementById("toolTitle").textContent!=="سلة المحذوفات")return;
  const categories=[
    ["all","الكل"],["lesson","المواعيد"],["student","الطلاب"],["world_zone","الساعة العالمية"]
  ];
  const filtered=unifiedTrashItems.filter(item=>unifiedTrashFilter==="all"||item.kind===unifiedTrashFilter);
  const buttons=categories.map(([kind,label])=>
    `<button type="button" class="unified-trash-filter" aria-pressed="${unifiedTrashFilter===kind}" onclick="changeUnifiedTrashFilter('${kind}')">${label} (${kind==="all"?unifiedTrashItems.length:unifiedTrashItems.filter(item=>item.kind===kind).length})</button>`
  ).join("");
  const rows=filtered.map(item=>{
    const until=Math.max(0,Math.ceil((Date.parse(item.deletedAt)+TRASH_RETENTION_DAYS*86400000-Date.now())/86400000));
    const kind={student:"طالب",lesson:"حصة",world_zone:"ساعة عالمية"}[item.kind]||"عنصر";
    const remaining=until===0?"آخر يوم للاستعادة":`متبقي ${until} يومًا`;
    return `<article class="unified-trash-item">
      <div class="unified-trash-heading"><strong>${esc(item.label)}</strong><span class="tool-meta">${esc(kind)}</span></div>
      <p>${esc(formatHistoryDate(item.deletedAt))} · ${remaining}</p>
      <div class="unified-trash-controls">
        <button type="button" onclick="restoreUnifiedTrash('${esc(item.token)}',this)">استعادة</button>
        <button type="button" class="danger" onclick="permanentlyDeleteUnifiedTrash('${esc(item.token)}',this)">حذف نهائي</button>
      </div>
    </article>`;
  }).join("");
  target.innerHTML=`<div class="unified-trash">
    <div class="unified-trash-info">تظل العناصر هنا لمدة 30 يومًا، ثم تنتهي إمكانية استعادتها. تظهر السلة الخاصة بحسابك فقط. المدن المحفوظة في الساعة العالمية تعود إلى الجهاز الذي تستعيدها عليه.</div>
    <div class="unified-trash-filters">${buttons}</div>
    <div class="unified-trash-items">${rows||'<div class="unified-trash-empty">لا توجد محذوفات في هذا القسم.</div>'}</div>
  </div>`;
}
function changeUnifiedTrashFilter(kind){
  if(!["all","lesson","student","world_zone"].includes(kind))return;
  unifiedTrashFilter=kind;renderUnifiedTrash();
  // Filtering replaces the buttons: restore keyboard focus to the selected one.
  document.querySelector("#toolBody .unified-trash-filter[aria-pressed='true']")?.focus({preventScroll:true});
}
async function loadUnifiedTrash(){
  const user=currentUser;
  if(!user||!cloudReady)throw Error("missing_account");
  const sequence=++unifiedTrashSequence;
  // The student workspace safely expires older students and retries detached image cleanup.
  const active=await studentsWorkspace.activate(user);
  if(!active)throw Error("students_unavailable");
  const cutoff=trashCutoff();
  const cleanup=await cloud.from("mawaeidi_trash").delete().eq("user_id",user.id).lte("deleted_at",cutoff);
  if(cleanup.error)throw cleanup.error;
  const [general,archivedStudents]=await Promise.all([
    cloud.from("mawaeidi_trash").select("id,entity_kind,item_key,label,payload,deleted_at")
      .eq("user_id",user.id).gt("deleted_at",cutoff).order("deleted_at",{ascending:false}).limit(500),
    cloud.from(STUDENTS_TABLE).select("id,first_name,last_name,deleted_at")
      .eq("user_id",user.id).not("deleted_at","is",null).gt("deleted_at",cutoff)
      .order("deleted_at",{ascending:false}).limit(500)
  ]);
  if(general.error||archivedStudents.error)throw general.error||archivedStudents.error;
  if(sequence!==unifiedTrashSequence||currentUser?.id!==user.id)throw Error("account_changed");
  unifiedTrashItems=[
    ...(general.data||[]).map(item=>({
      token:`archive:${item.id}`,kind:item.entity_kind,recordId:item.id,
      label:item.label||item.item_key,deletedAt:item.deleted_at,payload:item.payload
    })),
    ...(archivedStudents.data||[]).map(student=>({
      token:`student:${student.id}`,kind:"student",recordId:student.id,
      label:[student.first_name,student.last_name].filter(Boolean).join(" ")||"طالب",
      deletedAt:student.deleted_at
    }))
  ].sort((a,b)=>Date.parse(b.deletedAt)-Date.parse(a.deletedAt));
}
function unifiedTrashDialogOpen(){
  return document.getElementById("toolBackdrop").classList.contains("show")
    &&document.getElementById("toolTitle").textContent==="سلة المحذوفات";
}
async function retryUnifiedTrashLoad(){
  if(!unifiedTrashDialogOpen()||!currentUser||!cloudReady)return;
  document.getElementById("toolBody").innerHTML='<div class="tool-status" role="status">جارٍ تحميل المحذوفات…</div>';
  try{
    await loadUnifiedTrash();
    if(unifiedTrashDialogOpen())renderUnifiedTrash();
  }catch(error){
    console.error("Unified trash load failed.",error);
    if(unifiedTrashDialogOpen())document.getElementById("toolBody").innerHTML=
      '<div class="tool-status" role="alert">تعذّر تحميل سلة المحذوفات. تحقق من الاتصال وحاول مرة أخرى.'+
      '<div><button type="button" class="unified-trash-retry" onclick="retryUnifiedTrashLoad()">إعادة المحاولة</button></div></div>';
  }
}
async function openUnifiedTrash(){
  closeDataMenu();
  if(!currentUser||!cloudReady){alert("انتظر حتى يكتمل تحميل حسابك ثم أعد المحاولة.");return}
  unifiedTrashFilter="all";
  openToolDialog("سلة المحذوفات","الطلاب والمواعيد والساعة العالمية في مكان واحد.",'<div class="tool-status">جارٍ تحميل المحذوفات…</div>');
  await retryUnifiedTrashLoad();
}
function findUnifiedTrash(token){return unifiedTrashItems.find(item=>item.token===token)}
async function restoreUnifiedTrash(token,button){
  const item=findUnifiedTrash(token);
  if(!item||!currentUser||!cloudReady)return;
  if(Date.parse(item.deletedAt)<=Date.now()-TRASH_RETENTION_DAYS*86400000){alert("انتهت مدة استعادة هذا العنصر.");return}
  const userId=currentUser.id;
  if(button)button.disabled=true;
  try{
    if(item.kind==="student"){
      const {data,error}=await cloud.from(STUDENTS_TABLE).update({deleted_at:null})
        .eq("id",item.recordId).eq("user_id",userId)
        .gt("deleted_at",trashCutoff()).select("id").maybeSingle();
      if(error||!data)throw error||Error("student_not_restored");
      await studentsWorkspace.refresh();
    }else if(item.kind==="lesson"){
      const {data,error}=await cloud.rpc("mawaeidi_restore_trashed_lesson",{p_trash_id:item.recordId});
      if(error||!data)throw error||Error("lesson_not_restored");
      await refreshFromCloud(true);
    }else if(item.kind==="world_zone"){
      if(!worldClockSettings||worldClockSettings.userId!==userId)throw Error("clock_unavailable");
      const restored=await mutateWorldClock("restore",null,{p_trash_id:item.recordId});
      if(!restored)return;
    }
    if(currentUser?.id!==userId)return;
    await loadUnifiedTrash();renderUnifiedTrash();
  }catch(error){
    console.error("Unified trash restore failed.",error);
    const reason=String(error?.message||"");
    alert(reason.includes("lesson_time_conflict")?"لا يمكن استعادة الحصة؛ يوجد تعارض مع موعد حالي. غيّر الموعد المتعارض أولًا.":
      reason.includes("lesson_id_exists")?"الحصة موجودة بالفعل في الجدول.":
      reason.includes("zone_exists")?"هذه المدينة موجودة بالفعل على ساعتك.":
      reason.includes("zone_limit")?"الساعة ممتلئة؛ يمكنك حفظ تسع مناطق بجانب التوقيت الأساسي.":
      "تعذّرت الاستعادة. قد تكون المدة انتهت أو حدث خطأ في الاتصال.");
  }finally{if(button)button.disabled=false}
}
async function permanentlyDeleteUnifiedTrash(token,button){
  const item=findUnifiedTrash(token);
  if(!item||!currentUser||!cloudReady)return;
  if(!confirm(`حذف «${item.label}» نهائيًا من السلة؟ لا يمكن التراجع عن ذلك.`))return;
  const userId=currentUser.id;
  if(button)button.disabled=true;
  try{
    const table=item.kind==="student"?STUDENTS_TABLE:"mawaeidi_trash";
    let query=cloud.from(table).delete().eq("id",item.recordId).eq("user_id",userId);
    if(item.kind==="student")query=query.not("deleted_at","is",null);
    const {data,error}=await query.select("id");
    if(error||!data?.length)throw error||Error("trash_item_not_deleted");
    if(item.kind==="student")await studentsWorkspace.refresh();
    if(currentUser?.id!==userId)return;
    await loadUnifiedTrash();renderUnifiedTrash();
  }catch(error){
    console.error("Unified trash permanent delete failed.",error);
    alert("تعذّر الحذف النهائي. لم يتم تغيير بقية المحذوفات.");
  }finally{if(button)button.disabled=false}
}

function cloneBackupValue(value){
  return JSON.parse(JSON.stringify(value));
}
function currentBackupSettings(){
  return {
    format:"mawaeidi-settings",
    version:1,
    week_time_mode:weekTimeMode,
    week_density:weekDensity,
    world_clock_base:savedWorldClockBase(),
    world_clock_zones:savedWorldClockZones()
  };
}
function parseBackupSettings(value){
  if(!value||value.format!=="mawaeidi-settings"||value.version!==1)throw new Error("invalid_settings_backup");
  const weekTimeModeValue=value.week_time_mode==="full"?"full":"compact";
  const weekDensityValue=["compact","normal","comfortable"].includes(value.week_density)?value.week_density:"normal";
  const worldClockBase=validTimeZone(value.world_clock_base)?value.world_clock_base:SCHEDULE_TIMEZONE;
  const worldClockZones=[...new Set((Array.isArray(value.world_clock_zones)?value.world_clock_zones:[])
    .filter(validTimeZone))].slice(0,10);
  return {
    weekTimeMode:weekTimeModeValue,
    weekDensity:weekDensityValue,
    worldClockBase,
    worldClockZones:[...new Set([worldClockBase,...worldClockZones])].slice(0,10)
  };
}
async function applyBackupSettings(settings){
  if(!settings)return;
  if(!currentUser||!worldClockSettings||worldClockSettings.userId!==currentUser.id)throw new Error("clock_unavailable");
  const success=await mutateWorldClock("merge",null,{
    p_zones:[...new Set([settings.worldClockBase,...settings.worldClockZones])]
  });
  if(!success)throw new Error("clock_backup_merge_failed");
  weekTimeMode=settings.weekTimeMode;
  weekDensity=settings.weekDensity;
  rememberWeekTimeMode(weekTimeMode);
  rememberWeekDensity(weekDensity);
  renderWeek();
  if(currentSection==="world")openWorldClock();
}
function parseScheduleBackupObject(obj){
  let source;
  if(Array.isArray(obj))source=obj;
  else if(obj&&obj.format===BACKUP_FORMAT&&[1,2,BACKUP_VERSION].includes(obj.version)&&Array.isArray(obj.lessons))source=obj.lessons;
  else if(obj&&obj.format==="mawaeidi-schedule"&&obj.version===1&&Array.isArray(obj.lessons))source=obj.lessons;
  else throw new Error("invalid_schedule_backup");
  if(source.length>MAX_BACKUP_LESSONS)throw new Error("too_many_lessons");
  if(source.some(item=>!item||typeof item!=="object"||Array.isArray(item)))throw new Error("invalid_lesson");
  const normalized=normalizeLessons(source);
  if(normalized.some(item=>!item.schedules.length))throw new Error("invalid_schedule");
  return normalized;
}
function parseBackupText(rawText){
  const clean=textValue(rawText).replace(/^\uFEFF/,"");
  let obj;
  try{obj=JSON.parse(clean)}catch{throw new Error("invalid_json")}
  return parseScheduleBackupObject(obj);
}
function mergeBackupLessons(current,incoming){
  const merged=normalizeLessons(current);
  const positions=new Map(merged.map((lesson,index)=>[lesson.id,index]));
  let added=0;
  let updated=0;
  for(const lesson of incoming||[]){
    if(positions.has(lesson.id)){
      merged[positions.get(lesson.id)]=cloneBackupValue(lesson);
      updated++;
    }else{
      positions.set(lesson.id,merged.length);
      merged.push(cloneBackupValue(lesson));
      added++;
    }
  }
  return {lessons:normalizeLessons(merged),added,updated};
}
function fullBackupFilename(prefix="mawaeidi-full-backup"){
  const stamp=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
  return `${prefix}-${stamp}.zip`;
}
async function createFullBackupPackage(){
  if(!window.MawaeidiBackup)throw new Error("backup_tools_unavailable");
  if(!cloudReady||!currentUser)throw new Error("backup_account_required");
  const operationUserId=currentUser.id;
  if(!worldClockSettings||worldClockSettings.userId!==operationUserId)throw new Error("clock_sync_required_for_backup");
  const scheduleSnapshot=cloneBackupValue(lessons);
  const studentSnapshot=await studentsWorkspace.createBackupSnapshot(currentUser);
  const trashResponse=await cloud.from("mawaeidi_trash")
    .select("entity_kind,item_key,label,payload,deleted_at")
    .eq("user_id",operationUserId).gt("deleted_at",trashCutoff())
    .order("deleted_at",{ascending:false}).limit(5000);
  if(trashResponse.error)throw trashResponse.error;
  const archivedItems=trashResponse.data||[];
  if(archivedItems.length>=5000)throw new Error("trash_backup_limit");
  if(!currentUser||currentUser.id!==operationUserId||!cloudReady)throw new Error("backup_account_changed");
  const exportedAt=new Date().toISOString();
  const schedulePayload={
    format:"mawaeidi-schedule",
    version:1,
    exported_at:exportedAt,
    lesson_count:scheduleSnapshot.length,
    lessons:scheduleSnapshot
  };
  const studentsPayload={...studentSnapshot.manifest,exported_at:exportedAt};
  const settingsPayload=currentBackupSettings();
  const trashPayload={format:"mawaeidi-trash",version:1,items:archivedItems};
  const manifest={
    format:"mawaeidi-full-backup",
    version:1,
    exported_at:exportedAt,
    contents:{
      schedule:{file:"schedule.json",count:scheduleSnapshot.length},
      students:{
        file:"students.json",
        csv_file:"students.csv",
        count:studentsPayload.student_count,
        photo_count:studentsPayload.photo_count,
        missing_photo_count:studentsPayload.missing_photo_count
      },
      settings:{file:"settings.json"},
      trash:{file:"trash.json",count:archivedItems.length}
    }
  };
  const readme=[
    "نسخة احتياطية كاملة من مواعيدي",
    `تاريخ الإنشاء: ${new Intl.DateTimeFormat("ar-EG",{dateStyle:"long",timeStyle:"short",timeZone:SCHEDULE_TIMEZONE}).format(new Date())}`,
    `عدد المواعيد: ${scheduleSnapshot.length}`,
    `عدد الطلاب: ${studentsPayload.student_count}`,
    `عدد صور الطلاب: ${studentsPayload.photo_count}`,
    `عدد العناصر في السلة (المواعيد والمدن): ${archivedItems.length}`,
    "",
    "تحتوي النسخة على المواعيد، وسجل الطلاب، وصورهم الاختيارية، وإعدادات عرض الجدول والساعة العالمية، والعناصر المحذوفة التي لم تنته مدة الاحتفاظ بها.",
    "لا تحتوي النسخة على كلمة المرور أو جلسة تسجيل الدخول أو معرّف الحساب.",
    "لاستعادتها: سجّل الدخول إلى مواعيدي، ثم افتح الأدوات واختر «استعادة نسخة احتياطية».",
    "الاستعادة تدمج البيانات مع الموجود ولا تحذف السجلات الحالية.",
    "",
    "احتفظ بالملف في مكان آمن لأنه قد يتضمن بيانات تواصل وملاحظات خاصة."
  ].join("\r\n");
  const files=[
    {name:"manifest.json",data:JSON.stringify(manifest,null,2)},
    {name:"schedule.json",data:JSON.stringify(schedulePayload,null,2)},
    {name:"students.json",data:JSON.stringify(studentsPayload,null,2)},
    {name:"students.csv",data:studentSnapshot.csv},
    {name:"settings.json",data:JSON.stringify(settingsPayload,null,2)},
    {name:"trash.json",data:JSON.stringify(trashPayload,null,2)},
    {name:"README.txt",data:"\uFEFF"+readme},
    ...studentSnapshot.files
  ];
  const blob=await window.MawaeidiBackup.createZip(files);
  return {
    blob,
    counts:{
      lessons:scheduleSnapshot.length,
      students:studentsPayload.student_count,
      photos:studentsPayload.photo_count,
      trash:archivedItems.length
    },
    warnings:studentSnapshot.warnings
  };
}
async function createAndDownloadFullBackup(prefix){
  const result=await createFullBackupPackage();
  window.MawaeidiBackup.download(result.blob,fullBackupFilename(prefix));
  return result;
}
async function exportBackup(){
  closeDataMenu();
  if(!cloudReady||!currentUser){alert("انتظر حتى يكتمل تحميل حسابك ثم حاول مرة أخرى.");return}
  if(backupInFlight)return;
  backupInFlight=true;
  setSync("saving","جارٍ تجهيز النسخة الكاملة");
  showBackupStatus("جارٍ تجهيز نسختك الاحتياطية الكاملة…",{persistent:true});
  try{
    const result=await createAndDownloadFullBackup("mawaeidi-full-backup");
    setSync("saved",result.warnings.length?"تم تنزيل النسخة مع تنبيه صور":"تم تنزيل النسخة الكاملة");
    showBackupStatus(result.warnings.length?"بدأ تنزيل النسخة، مع تنبيه بشأن بعض الصور.":"بدأ تنزيل النسخة الكاملة. احتفظ بها في مكان آمن.");
    if(result.warnings.length)alert(`تم تنزيل البيانات كاملة، لكن تعذّر تضمين ${result.warnings.length} صورة. لم تُحذف أي بيانات من الموقع.`);
  }catch(error){
    console.error("تعذّر إنشاء النسخة الاحتياطية الكاملة.",error);
    setSync("error","تعذّر إنشاء النسخة");
    showBackupStatus("تعذّر تجهيز النسخة الاحتياطية. تحقق من اتصال الإنترنت.",{error:true});
    alert("تعذّر تنزيل النسخة الاحتياطية الكاملة. تحقق من الإنترنت وحاول مرة أخرى.");
  }finally{backupInFlight=false}
}
function chooseBackupFile(){
  closeDataMenu();
  if(!cloudReady||!currentUser){alert("انتظر حتى يكتمل تحميل حسابك ثم حاول مرة أخرى.");return}
  if(!window.MawaeidiBackup){alert("أدوات النسخ الاحتياطي لم تكتمل. حدّث الصفحة ثم حاول مرة أخرى.");return}
  document.getElementById("backupFile").click();
}

function inspectTrashBackup(payload){
  if(payload===null||payload===undefined)return null;
  if(!payload||payload.format!=="mawaeidi-trash"||payload.version!==1||!Array.isArray(payload.items)||payload.items.length>5000)
    throw new Error("invalid_trash_backup");
  return payload.items.map(row=>{
    const kind=row?.entity_kind;
    const key=textValue(row?.item_key).trim();
    const label=textValue(row?.label).trim().slice(0,300);
    const deletedAt=textValue(row?.deleted_at);
    const item=row?.payload;
    if(!["lesson","world_zone"].includes(kind)||!key||key.length>240||!Number.isFinite(Date.parse(deletedAt))
      ||!item||Array.isArray(item)||typeof item!=="object")
      throw new Error("invalid_trash_record");
    if(kind==="lesson"&&(item.id!==key||!Array.isArray(item.schedules)))throw new Error("invalid_trash_lesson");
    if(kind==="world_zone"&&(item.zone!==key||!validTimeZone(key)))throw new Error("invalid_trash_zone");
    return {entity_kind:kind,item_key:key,label,payload:item,deleted_at:deletedAt};
  }).filter(row=>Date.parse(row.deleted_at)>Date.now()-TRASH_RETENTION_DAYS*86400000);
}
async function mergeTrashBackupRows(items){
  if(!items?.length)return 0;
  const userId=currentUser?.id;
  if(!userId||!cloudReady)throw new Error("missing_account");
  const {data,error}=await cloud.from("mawaeidi_trash").select("entity_kind,item_key,deleted_at")
    .eq("user_id",userId).gt("deleted_at",trashCutoff()).limit(5000);
  if(error)throw error;
  const existing=new Set((data||[]).map(row=>[row.entity_kind,row.item_key,row.deleted_at].join("|")));
  const fresh=items.filter(item=>!existing.has([item.entity_kind,item.item_key,item.deleted_at].join("|")))
    .map(item=>({...item,user_id:userId}));
  for(let n=0;n<fresh.length;n+=100){
    const result=await cloud.from("mawaeidi_trash").insert(fresh.slice(n,n+100));
    if(result.error)throw result.error;
  }
  return fresh.length;
}

async function parseFullBackupFile(file){
  if(!file||file.size>MAX_BACKUP_BYTES)throw new Error("backup_too_large");
  const signature=new Uint8Array(await file.slice(0,4).arrayBuffer());
  const isZip=signature.length===4&&signature[0]===0x50&&signature[1]===0x4b;
  if(!isZip){
    if(file.size>5*1024*1024)throw new Error("legacy_backup_too_large");
    return {
      source:"legacy-schedule",
      scheduleLessons:parseBackupText(await file.text()),
      studentPlan:null,
      settings:null
    };
  }

  const entries=await window.MawaeidiBackup.readZip(file);
  if(entries.has("manifest.json")){
    const manifest=window.MawaeidiBackup.readJson(entries,"manifest.json",1024*1024);
    if(!manifest||manifest.format!=="mawaeidi-full-backup"||manifest.version!==1)throw new Error("invalid_full_backup");
    const schedulePayload=window.MawaeidiBackup.readJson(entries,"schedule.json",8*1024*1024);
    const studentsPayload=window.MawaeidiBackup.readJson(entries,"students.json",64*1024*1024);
    const settingsPayload=window.MawaeidiBackup.readJson(entries,"settings.json",1024*1024);
    const scheduleLessons=parseScheduleBackupObject(schedulePayload);
    const studentPlan=studentsWorkspace.inspectBackupSnapshot(studentsPayload,entries);
    const settings=parseBackupSettings(settingsPayload);
    const trashItems=entries.has("trash.json")?inspectTrashBackup(window.MawaeidiBackup.readJson(entries,"trash.json",32*1024*1024)):null;
    if(entries.has("trash.json")&&Number(manifest.contents?.trash?.count)!==window.MawaeidiBackup.readJson(entries,"trash.json",32*1024*1024).items.length)
      throw new Error("trash_count_mismatch");
    if(Number(manifest.contents?.schedule?.count)!==scheduleLessons.length)throw new Error("schedule_count_mismatch");
    if(Number(manifest.contents?.students?.count)!==studentPlan.studentCount)throw new Error("student_count_mismatch");
    if(Number(manifest.contents?.students?.photo_count)!==studentPlan.photoCount||studentPlan.missingPhotoCount)throw new Error("photo_count_mismatch");
    return {source:"full",scheduleLessons,studentPlan,settings,trashItems};
  }

  if(entries.has("students.json")){
    const studentsPayload=window.MawaeidiBackup.readJson(entries,"students.json",64*1024*1024);
    return {
      source:"legacy-students",
      scheduleLessons:null,
      studentPlan:studentsWorkspace.inspectBackupSnapshot(studentsPayload,entries),
      settings:null
    };
  }
  throw new Error("unknown_backup_format");
}
function backupRestorePreviewMarkup(plan){
  const scheduleCount=plan.scheduleLessons?.length??0;
  const studentCount=plan.studentPlan?.studentCount??0;
  const photoCount=plan.studentPlan?.photoCount??0;
  const missingPhotos=plan.studentPlan?.missingPhotoCount??0;
  const rows=[];
  if(plan.scheduleLessons)rows.push(`<p><strong>المواعيد:</strong> ${scheduleCount}</p>`);
  if(plan.studentPlan)rows.push(`<p><strong>الطلاب:</strong> ${studentCount} · <strong>الصور:</strong> ${photoCount}</p>`);
  if(plan.settings)rows.push("<p><strong>الإعدادات:</strong> عرض الجدول والساعة العالمية</p>");
  if(plan.trashItems)rows.push(`<p><strong>سلة المحذوفات:</strong> ${plan.trashItems.length} عنصر لم تنته مدة الاحتفاظ به</p>`);
  const warning=missingPhotos?`<div class="tool-status error">هناك ${missingPhotos} صورة مفقودة داخل الملف؛ ستُستعاد بيانات الطلاب من دونها.</div>`:"";
  return `${warning}
    <div class="tool-status on">تم فحص الملف بنجاح.</div>
    <div class="tool-card">
      <h3>محتويات النسخة</h3>
      ${rows.join("")}
      <p>سيتم الدمج مع بيانات حسابك الحالي: المتطابق يُحدّث والجديد يُضاف، ولن تُحذف البيانات الموجودة.</p>
      <p class="install-help">قبل بدء الدمج سننزّل تلقائيًا نسخة أمان كاملة من حالتك الحالية.</p>
      <div class="tool-actions">
        <button type="button" class="tool-primary" id="confirmBackupRestore" onclick="confirmBackupRestore()">استعادة ودمج البيانات</button>
        <button type="button" class="tool-secondary" onclick="cancelBackupRestore()">إلغاء</button>
      </div>
    </div>`;
}
function cancelBackupRestore(){
  pendingBackupRestorePlan=null;
  closeToolDialog();
  setSync("saved","لم تتغير البيانات");
}
async function importBackup(event){
  const input=event.currentTarget;
  const file=input.files?.[0];
  if(!file)return;
  if(file.size>MAX_BACKUP_BYTES){input.value="";alert("ملف النسخة الاحتياطية أكبر من الحد المسموح.");return}
  if(backupInFlight)return;
  backupInFlight=true;
  setSync("saving","جارٍ فحص النسخة");
  try{
    const plan=await parseFullBackupFile(file);
    pendingBackupRestorePlan=plan;
    openToolDialog("استعادة نسخة احتياطية","راجع المحتويات قبل دمجها في حسابك.",backupRestorePreviewMarkup(plan));
    setSync("saved","النسخة جاهزة للاستعادة");
  }catch(error){
    pendingBackupRestorePlan=null;
    console.error("تعذّر فحص النسخة الاحتياطية.",error);
    setSync("error","النسخة غير صالحة");
    alert("ملف النسخة الاحتياطية غير صالح أو تالف، ولم تتغير أي بيانات.");
  }finally{
    backupInFlight=false;
    input.value="";
  }
}
async function confirmBackupRestore(){
  const plan=pendingBackupRestorePlan;
  if(!plan||backupInFlight||!currentUser||!cloudReady)return;
  const button=document.getElementById("confirmBackupRestore");
  if(button){button.disabled=true;button.textContent="جارٍ إنشاء نسخة الأمان…"}
  backupInFlight=true;
  setSync("saving","جارٍ إنشاء نسخة أمان");
  let safetyDownloaded=false;
  let studentResult=null;
  let scheduleResult=null;
  let settingsApplied=false;
  let trashAdded=0;
  try{
    await createAndDownloadFullBackup("mawaeidi-before-restore");
    safetyDownloaded=true;
    if(button)button.textContent="جارٍ دمج البيانات…";
    setSync("saving","جارٍ دمج النسخة");

    if(plan.studentPlan)studentResult=await studentsWorkspace.restoreBackupSnapshot(plan.studentPlan,currentUser);
    if(plan.scheduleLessons){
      const previous=lessons;
      scheduleResult=mergeBackupLessons(lessons,plan.scheduleLessons);
      lessons=scheduleResult.lessons;
      if(!await persist(true)){
        lessons=previous;
        throw new Error("schedule_restore_failed");
      }
    }
    if(plan.settings){
      await applyBackupSettings(plan.settings);
      settingsApplied=true;
    }
    if(plan.trashItems)trashAdded=await mergeTrashBackupRows(plan.trashItems);
    render();
    pendingBackupRestorePlan=null;
    closeToolDialog();
    const summary=[];
    if(scheduleResult)summary.push(`${scheduleResult.added} موعد جديد و${scheduleResult.updated} موعد محدّث`);
    if(studentResult)summary.push(`${studentResult.inserted} طالب جديد و${studentResult.updated} طالب محدّث`);
    if(studentResult)summary.push(`${studentResult.restoredPhotos} صورة مستعادة`);
    if(settingsApplied)summary.push("تم استعادة إعدادات العرض");
    if(plan.trashItems)summary.push(`${trashAdded} عنصر جديد في سلة المحذوفات`);
    const photoWarning=studentResult?.photoFailures?.length?`\nتعذّر رفع ${studentResult.photoFailures.length} صورة، وبقيت البيانات الحالية دون حذف.`:"";
    setSync("saved","تم دمج النسخة بنجاح");
    alert(`تمت الاستعادة والدمج بنجاح.\n${summary.join("\n")}\nتم تنزيل نسخة أمان قبل الاستعادة.${photoWarning}`);
  }catch(error){
    console.error("تعذّر إكمال استعادة النسخة الاحتياطية.",error);
    setSync("error","تعذّر إكمال الاستعادة");
    const partial=Boolean(studentResult||scheduleResult||settingsApplied||trashAdded);
    const status=document.querySelector("#toolBody .tool-status");
    if(status){
      status.className="tool-status error";
      status.textContent=partial
        ?"توقفت العملية بعد استعادة جزء من البيانات. يمكنك مراجعة نسخة الأمان التي نُزّلت ثم المحاولة مرة أخرى."
        :"توقفت العملية قبل تغيير البيانات.";
    }
    if(button){button.disabled=false;button.textContent="إعادة المحاولة"}
    alert(safetyDownloaded
      ?(partial?"تعذّر إكمال بعض أجزاء الاستعادة. نُزّلت نسخة أمان قبل البدء، ولم تُحذف السجلات الحالية.":"تعذّرت الاستعادة، لكن نُزّلت نسخة الأمان ولم تتغير البيانات.")
      :"تعذّر إنشاء نسخة الأمان، لذلك أوقفنا الاستعادة ولم تتغير البيانات.");
  }finally{backupInFlight=false}
}
function hasRecoveryMarker(){
  try{
    const query=new URLSearchParams(location.search);
    const hash=new URLSearchParams(location.hash.replace(/^#/,""));
    return query.get("type")==="recovery"||hash.get("type")==="recovery";
  }catch{return /(?:^|[?#&])type=recovery(?:&|$)/.test(location.href)}
}
let recoveryLinkDetected=hasRecoveryMarker();

function setAuthMessage(message,isError=false){
  const box=document.getElementById("authMessage");
  box.textContent=message;
  box.classList.toggle("error",isError);
}
function setSync(state,message){
  const box=document.getElementById("syncStatus");
  box.className=`sync-status ${state||""}`.trim();
  document.getElementById("syncStatusText").textContent=message;
  box.disabled=state==="saving";
  box.setAttribute("aria-label",`${message}؛ اضغط لتحديث المواعيد من السحابة`);
}
function isDrawerVisible(){return document.getElementById("drawer").classList.contains("show")||Boolean(document.querySelector("#toolBackdrop.show .session-status-form"))}
function remoteRowIsNewer(row){
  const remote=textValue(row?.updated_at);
  if(!remote)return !lastCloudUpdatedAt;
  if(!lastCloudUpdatedAt)return true;
  const remoteTime=Date.parse(remote),localTime=Date.parse(lastCloudUpdatedAt);
  if(Number.isFinite(remoteTime)&&Number.isFinite(localTime))return remoteTime>localTime;
  return remote!==lastCloudUpdatedAt;
}
function applyRemoteRow(row,message="تم تحديث المواعيد"){
  if(!row||!currentUser||row.user_id!==currentUser.id||!Array.isArray(row.lessons)||!remoteRowIsNewer(row))return false;
  lessons=normalizeLessons(row.lessons);
  lastCloudUpdatedAt=textValue(row.updated_at)||lastCloudUpdatedAt;
  render();
  setSync("saved",message);
  return true;
}
function handleRemoteRow(row){
  if(!row||!currentUser||row.user_id!==currentUser.id||saveInFlight||!remoteRowIsNewer(row))return;
  if(isDrawerVisible()){
    pendingRemoteRow=row;
    setSync("saving","تحديث جديد ينتظر");
    return;
  }
  applyRemoteRow(row,"تم التحديث من جهاز آخر");
}
function flushPendingRemote(){
  if(!pendingRemoteRow||isDrawerVisible())return;
  const row=pendingRemoteRow;
  pendingRemoteRow=null;
  if(!applyRemoteRow(row,"تم التحديث من جهاز آخر"))setSync("saved","البيانات محدّثة");
}
function stopRealtime(){
  if(realtimeChannel&&cloud)cloud.removeChannel(realtimeChannel);
  realtimeChannel=null;
  pendingRemoteRow=null;
}
function startRealtime(user){
  stopRealtime();
  if(!cloud||!user)return;
  realtimeChannel=cloud
    .channel(`mawaeidi-sync-${user.id}`)
    .on("postgres_changes",{
      event:"*",schema:"public",table:"mawaeidi_data",filter:`user_id=eq.${user.id}`
    },payload=>{
      if(payload.eventType==="DELETE"){
        refreshFromCloud(true);
        return;
      }
      handleRemoteRow(payload.new);
    })
    .on("postgres_changes",{
      event:"*",schema:"public",table:WORLD_CLOCK_SETTINGS_TABLE,filter:`user_id=eq.${user.id}`
    },payload=>{
      if(payload.eventType==="DELETE"){refreshWorldClockFromCloud();return}
      if(currentUser?.id===user.id&&cloudReady&&!worldClockBusy){
        try{setWorldClockServerRow(payload.new,user.id)}catch(error){console.warn("World clock sync payload rejected.",error)}
      }
    })
    .subscribe(status=>{
      if(status==="SUBSCRIBED"&&cloudReady&&!saveInFlight&&!refreshInFlight&&!pendingRemoteRow)setSync("saved","متزامن سحابيًا");
      if((status==="CHANNEL_ERROR"||status==="TIMED_OUT")&&currentUser?.id===user.id)setSync("error","اضغط للتحديث");
    });
}
async function refreshFromCloud(silent=false){
  if(currentSection==="world"&&currentUser&&cloudReady)return refreshWorldClockFromCloud();
  if(currentSection==="students"&&currentUser&&cloudReady)return studentsWorkspace.refresh();
  if(!cloud||!currentUser||!cloudReady){
    if(!silent)alert("لم يكتمل الاتصال بحسابك بعد.");
    return false;
  }
  if(refreshInFlight||saveInFlight||backupInFlight)return false;
  if(isDrawerVisible()){
    if(!silent)alert("احفظ التعديل المفتوح أو أغلقه أولًا، ثم حدّث المواعيد.");
    return false;
  }
  if(!navigator.onLine){
    setSync("error","غير متصل بالإنترنت");
    if(!silent)alert("لا يوجد اتصال بالإنترنت حاليًا.");
    return false;
  }
  refreshInFlight=true;
  setSync("saving","جارٍ التحديث");
  try{
    const {data,error}=await cloud.from("mawaeidi_data")
      .select("user_id,lessons,updated_at")
      .eq("user_id",currentUser.id)
      .maybeSingle();
    if(error)throw error;
    if(data&&applyRemoteRow(data,"تم تحديث المواعيد"))return true;
    setSync("saved","البيانات محدّثة");
    return true;
  }catch(error){
    console.error("تعذّر تحديث مواعيدي من السحابة.",error);
    setSync("error","تعذّر التحديث");
    if(!silent)alert("تعذّر تحديث المواعيد. تحقق من الإنترنت وحاول مرة أخرى.");
    return false;
  }finally{
    refreshInFlight=false;
  }
}
function requestAutoRefresh(){
  if(document.visibilityState!=="visible"||backupInFlight)return;
  const now=Date.now();
  if(now-lastAutoRefreshAt<AUTO_REFRESH_THROTTLE_MS)return;
  lastAutoRefreshAt=now;
  refreshFromCloud(true);
  refreshWorldClockFromCloud();
}
function finishAuthBootstrap(){document.body.classList.remove("auth-pending")}
function showAuth(){
  document.getElementById("authGate").classList.remove("hidden");
  finishAuthBootstrap();
  const target=authMode==="update"?document.getElementById("authPassword"):document.getElementById("authEmail");
  target.focus();
}
function hideAuth(){
  document.getElementById("authGate").classList.add("hidden");
  finishAuthBootstrap();
}
function setAuthMode(mode){
  authMode=["signin","recover","update"].includes(mode)?mode:"signin";
  const signin=authMode==="signin",recover=authMode==="recover",update=authMode==="update";
  const title=signin?"تسجيل الدخول":recover?"استعادة كلمة المرور":"تعيين كلمة مرور جديدة";
  const intro=signin?"ادخل إلى جدولك المحفوظ وافتحه من أي جهاز.":recover?"اكتب بريد حسابك، وسنرسل إليك رابطًا آمنًا لتغيير كلمة المرور.":"اكتب كلمة مرور جديدة لحسابك، ثم أكّدها.";
  document.getElementById("authTitle").textContent=title;
  document.getElementById("authIntro").textContent=intro;
  document.getElementById("authEmailField").hidden=update;
  document.getElementById("authPasswordField").hidden=recover;
  document.getElementById("authConfirmField").hidden=!update;
  document.getElementById("authForgot").hidden=!signin;
  document.getElementById("authSwitch").hidden=!recover;
  document.getElementById("authPasswordLabel").textContent=update?"كلمة المرور الجديدة":"كلمة المرور";
  document.getElementById("authPassword").autocomplete=signin?"current-password":"new-password";
  document.getElementById("authSubmit").textContent=signin?"تسجيل الدخول":recover?"إرسال رابط الاستعادة":"حفظ كلمة المرور الجديدة";
  document.getElementById("authSwitch").textContent="العودة إلى تسجيل الدخول";
  document.getElementById("authPassword").value="";
  document.getElementById("authConfirm").value="";
  setAuthMessage("");
}
function handleAuthSwitch(){setAuthMode("signin");showAuth()}
function startPasswordRecovery(){setAuthMode("recover");showAuth()}
function enterPasswordUpdate(user){
  recoveryUser=user||null;
  recoveryLinkDetected=false;
  setAuthMode("update");
  showAuth();
  setAuthMessage("تم التحقق من رابط الاستعادة. اختر كلمة مرور جديدة.");
  const cleanUrl=authRedirectUrl();
  if(cleanUrl&&history.replaceState)history.replaceState({},document.title,cleanUrl);
}
function setAuthBusy(busy){
  ["authSubmit","authSwitch","authForgot"].forEach(id=>{document.getElementById(id).disabled=busy});
}
function authRedirectUrl(){
  return location.protocol==="http:"||location.protocol==="https:"
    ?location.href.split(/[?#]/)[0]
    :undefined;
}
async function submitAuth(){
  if(!cloud){setAuthMessage("تعذّر تحميل خدمة الحساب. تحقق من اتصال الإنترنت ثم حدّث الصفحة.",true);return}
  const mode=authMode;
  const email=document.getElementById("authEmail").value.trim();
  const password=document.getElementById("authPassword").value;
  const confirmPassword=document.getElementById("authConfirm").value;
  if(mode!=="update"&&(!email||!email.includes("@"))){setAuthMessage("اكتب بريدًا إلكترونيًا صحيحًا.",true);return}
  if(mode!=="recover"&&password.length<6){setAuthMessage("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",true);return}
  if(mode==="update"&&password!==confirmPassword){setAuthMessage("كلمتا المرور غير متطابقتين.",true);return}
  setAuthBusy(true);
  setAuthMessage(mode==="signin"?"جارٍ تسجيل الدخول…":mode==="recover"?"جارٍ إرسال رابط الاستعادة…":"جارٍ حفظ كلمة المرور الجديدة…");
  try{
    if(mode==="signin"){
      const {data,error}=await cloud.auth.signInWithPassword({email,password});
      if(error)throw error;
      await activateSession(data.user);
    }else if(mode==="recover"){
      const redirect=authRedirectUrl();
      const options=redirect?{redirectTo:redirect}:undefined;
      const {error}=await cloud.auth.resetPasswordForEmail(email,options);
      if(error)throw error;
      setAuthMessage("إن كان هذا البريد مسجّلًا، فستصلك رسالة الاستعادة خلال دقائق. افحص البريد غير المرغوب أيضًا.");
    }else{
      const {data,error}=await cloud.auth.updateUser({password});
      if(error)throw error;
      setAuthMessage("تم تغيير كلمة المرور بنجاح. جارٍ فتح جدولك…");
      await new Promise(resolve=>setTimeout(resolve,650));
      await activateSession(data.user||recoveryUser);
      recoveryUser=null;
      if(cloudReady)setSync("saved","تم تحديث كلمة المرور");
    }
  }catch(error){
    console.error("تعذّر إكمال عملية الحساب.",error);
    const errorMessage=mode==="signin"?"البريد أو كلمة المرور غير صحيحين.":mode==="recover"?"تعذّر إرسال رابط الاستعادة الآن. انتظر قليلًا ثم حاول مرة أخرى.":"تعذّر تغيير كلمة المرور. اطلب رابط استعادة جديدًا ثم حاول مرة أخرى.";
    setAuthMessage(errorMessage,true);
  }finally{
    setAuthBusy(false);
  }
}
async function activateSession(user){
  if(!user||!cloud)return;
  if(loadingUserId===user.id)return;
  if(currentUser?.id===user.id&&cloudReady){if(!realtimeChannel)startRealtime(user);hideAuth();refreshNotificationMenuStatus();if(!worldClockSettings)initializeWorldClockForUser(user,sessionSequence).catch(error=>console.warn("Clock sync retry failed.",error));if(currentSection==="students")studentsWorkspace.activate(user);return}
  stopRealtime();
  lastCloudUpdatedAt=null;
  loadingUserId=user.id;
  const sequence=++sessionSequence;
  resetStudentWorkspace();
  resetWorldClockSync();
  currentUser=user;
  cloudReady=false;
  setAuthMessage("جارٍ تحميل جدولك…");
  setSync("saving","جارٍ التحميل");
  try{
    const {data,error}=await cloud.from("mawaeidi_data")
      .select("lessons,updated_at")
      .eq("user_id",user.id)
      .maybeSingle();
    if(error)throw error;
    if(sequence!==sessionSequence)return;
    lessons=normalizeLessons(data?.lessons||[]);
    lastCloudUpdatedAt=textValue(data?.updated_at)||null;
    let needsInitialSave=!data;

    const migrationKey=MIGRATION_KEY_PREFIX+user.id;
    const localLessons=loadLocalLessons();
    if(!lessons.length&&localLessons?.length&&!localStorage.getItem(migrationKey)){
      const importLocal=confirm(`وجدت ${localLessons.length} حصة محفوظة على هذا الجهاز، وقد تشمل بيانات تجريبية. هل تريد نقلها إلى حسابك؟`);
      localStorage.setItem(migrationKey,importLocal?"imported":"skipped");
      if(importLocal){lessons=localLessons;needsInitialSave=true}
    }

    cloudReady=true;
    if(needsInitialSave){
      const saved=await persist(true);
      if(!saved)throw new Error("initial cloud save failed");
    }
    try{await initializeWorldClockForUser(user,sequence)}
    catch(error){console.warn("World clock settings could not be loaded.",error)}
    if(sequence!==sessionSequence||currentUser?.id!==user.id)return;
    render();
    hideAuth();
    setSync("saved","محفوظ سحابيًا");
    startRealtime(user);
    refreshNotificationMenuStatus();
    if(currentSection==="students")await studentsWorkspace.activate(user);
  }catch(error){
    console.error("تعذّر تحميل جدول مواعيدي.",error);
    cloudReady=false;
    stopRealtime();
    showAuth();
    setAuthMessage("تعذّر تحميل جدولك. تحقق من الإنترنت ثم أعد المحاولة.",true);
    setSync("error","تعذّر الاتصال");
  }finally{
    if(sequence===sessionSequence)loadingUserId=null;
  }
}
async function logout(){
  if(!cloud)return;
  closeDataMenu();
  await disableNotifications(true);
  const {error}=await cloud.auth.signOut();
  if(error){alert("تعذّر تسجيل الخروج. حاول مرة أخرى.");return}
  stopRealtime();
  sessionSequence++;
  resetStudentWorkspace();
  resetWorldClockSync();
  loadingUserId=null;currentUser=null;cloudReady=false;lessons=[];editingId=null;lastCloudUpdatedAt=null;
  closeDrawer();closeToolDialog();render();showAuth();
  setAuthMessage("تم تسجيل الخروج.");
}
async function persist(silent=false){
  if(!cloud||!currentUser||!cloudReady){
    if(!silent)alert("لم يكتمل الاتصال بحسابك بعد.");
    return false;
  }
  saveInFlight=true;
  setSync("saving","جارٍ الحفظ");
  try{
    const updatedAt=new Date().toISOString();
    const {data,error}=await cloud.from("mawaeidi_data").upsert({
      user_id:currentUser.id,
      lessons,
      updated_at:updatedAt
    },{onConflict:"user_id"}).select("updated_at").single();
    if(error)throw error;
    lastCloudUpdatedAt=textValue(data?.updated_at)||updatedAt;
    setSync("saved","تم الحفظ");
    return true;
  }catch(error){
    console.error("تعذّر حفظ بيانات مواعيدي.",error);
    setSync("error","لم يُحفظ");
    if(!silent)alert("تعذّر حفظ البيانات سحابيًا. تحقق من اتصال الإنترنت وحاول مرة أخرى.");
    return false;
  }finally{
    saveInFlight=false;
  }
}
function getOccurrences(list=lessons){
  return list.flatMap(l=>(Array.isArray(l.schedules)?l.schedules:[])
    .filter(s=>s&&days.includes(s.day)&&TIME_RE.test(textValue(s.time)))
    .map(s=>({lesson:l,day:s.day,time:s.time})));
}
function sourceLabel(lesson){
  return lesson.lessonSource==="center"?(lesson.centerName.trim()||"مركز"):"خاص";
}
function sourceColorFromLabel(label){
  if(label==="خاص")return PRIVATE_SOURCE_COLOR;
  let hash=0;
  for(const char of label)hash=(hash*31+char.codePointAt(0))>>>0;
  return SOURCE_COLORS[hash%SOURCE_COLORS.length];
}
function sourceColor(lesson){return sourceColorFromLabel(sourceLabel(lesson))}
function esc(s){return String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]))}
function fmt(t){
  const value=TIME_RE.test(String(t))?String(t):"00:00";
  const[h,m]=value.split(":").map(Number),p=h>=12?"م":"ص";
  let hh=h%12;if(!hh)hh=12;
  return `${hh}:${String(m).padStart(2,"0")} ${p}`;
}
function mins(t){const value=TIME_RE.test(String(t))?String(t):"00:00";const[h,m]=value.split(":").map(Number);return h*60+m}
function normalizeZoneSearch(value){
  return String(value||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[إأآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/[_/().,-]+/g," ").replace(/\s+/g," ").trim();
}
function countryNameForZone(zone){
  const code=TIMEZONE_COUNTRY_MAP[zone];if(!code)return "";
  try{return new Intl.DisplayNames(["ar-EG"],{type:"region"}).of(code)||code}catch{return code}
}
function genericNameForZone(zone,date=new Date()){
  try{return new Intl.DateTimeFormat("ar-EG",{timeZone:zone,timeZoneName:"longGeneric"}).formatToParts(date).find(part=>part.type==="timeZoneName")?.value||zone}catch{return zone}
}
function timeZoneCatalog(){
  if(timeZoneCatalogCache)return timeZoneCatalogCache;
  let zones=[];
  try{zones=typeof Intl.supportedValuesOf==="function"?Intl.supportedValuesOf("timeZone"):Object.keys(TIMEZONE_COUNTRY_MAP)}catch{zones=Object.keys(TIMEZONE_COUNTRY_MAP)}
  if(!zones.includes(SCHEDULE_TIMEZONE))zones.push(SCHEDULE_TIMEZONE);
  const countryCounts={};zones.forEach(zone=>{const code=TIMEZONE_COUNTRY_MAP[zone];if(code)countryCounts[code]=(countryCounts[code]||0)+1});
  timeZoneCatalogCache=[...new Set(zones)].filter(validTimeZone).map(zone=>{
    const code=TIMEZONE_COUNTRY_MAP[zone]||"",country=countryNameForZone(zone),zoneName=genericNameForZone(zone),city=(zone.split("/").at(-1)||zone).replace(/_/g," ");
    const multi=code&&countryCounts[code]>1;
    const label=country?(multi?`${country} — ${zoneName} · ${city}`:`${country} — ${zoneName}`):`${zoneName} — ${city}`;
    return {zone,code,country,zoneName,city,label,search:normalizeZoneSearch(`${country} ${zoneName} ${city} ${zone}`)};
  }).sort((a,b)=>a.label.localeCompare(b.label,"ar"));
  return timeZoneCatalogCache;
}
function timeZoneEntry(zone){return timeZoneCatalog().find(item=>item.zone===zone)||null}
function timeZoneShortLabel(zone){
  const entry=timeZoneEntry(zone);if(!entry)return zone||"";
  if(!entry.country)return entry.zoneName;
  const count=timeZoneCatalog().filter(item=>item.code&&item.code===entry.code).length;
  return count>1?`${entry.country} · ${entry.zoneName.replace(/^توقيت\s*/,"")}`:entry.country;
}
function resolveTimeZoneText(value){
  const raw=String(value||"").trim();if(!raw)return {entry:null,ambiguous:false,matches:[]};
  const catalog=timeZoneCatalog(),exactZone=catalog.find(item=>item.zone.toLowerCase()===raw.toLowerCase()),exactLabel=catalog.find(item=>item.label===raw);
  if(exactZone||exactLabel)return {entry:exactZone||exactLabel,ambiguous:false,matches:[exactZone||exactLabel]};
  const query=normalizeZoneSearch(raw),countryExact=catalog.filter(item=>normalizeZoneSearch(item.country)===query);
  if(countryExact.length===1)return {entry:countryExact[0],ambiguous:false,matches:countryExact};
  if(countryExact.length>1)return {entry:null,ambiguous:true,matches:countryExact.slice(0,12)};
  const matches=catalog.filter(item=>item.search.includes(query)).slice(0,12);
  return {entry:matches.length===1?matches[0]:null,ambiguous:matches.length>1,matches};
}
function populateTimeZoneDatalist(id){
  const list=document.getElementById(id);if(!list)return;
  list.innerHTML="";const fragment=document.createDocumentFragment();
  timeZoneCatalog().forEach(entry=>{const option=document.createElement("option");option.value=entry.label;option.label=entry.zone;fragment.appendChild(option)});list.appendChild(fragment);
}
function setTimeZoneInput(input,zone){
  if(!input)return;const entry=timeZoneEntry(zone);
  input.value=entry?.label||"";input.dataset.zone=entry?.zone||"";input.dataset.zoneLabel=input.value;
}
function resolvedZoneFromInput(input){
  if(!input)return {entry:null,ambiguous:false,matches:[]};
  if(input.dataset.zone&&input.value===input.dataset.zoneLabel&&validTimeZone(input.dataset.zone))return {entry:timeZoneEntry(input.dataset.zone)||{zone:input.dataset.zone,label:input.value},ambiguous:false,matches:[]};
  const result=resolveTimeZoneText(input.value);
  if(result.entry){input.dataset.zone=result.entry.zone;input.dataset.zoneLabel=result.entry.label;input.value=result.entry.label}
  return result;
}
function zonedParts(date,zone){
  const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date).filter(part=>part.type!=="literal").map(part=>[part.type,part.value]));
  return {year:Number(parts.year),month:Number(parts.month),day:Number(parts.day),hour:Number(parts.hour),minute:Number(parts.minute),second:Number(parts.second)};
}
function zoneOffsetMinutes(date,zone){
  const p=zonedParts(date,zone),rounded=Math.floor(date.getTime()/1000)*1000;
  return Math.round((Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-rounded)/60000);
}
function wallTimeToInstant(dateKey,time,zone=SCHEDULE_TIMEZONE){
  if(!validDateKey(dateKey)||!TIME_RE.test(String(time))||!validTimeZone(zone))return null;
  const [year,month,day]=dateKey.split("-").map(Number),[hour,minute]=String(time).split(":").map(Number),target=Date.UTC(year,month-1,day,hour,minute,0);
  let stamp=target;
  for(let i=0;i<5;i++){
    const next=target-zoneOffsetMinutes(new Date(stamp),zone)*60000;
    if(Math.abs(next-stamp)<1000){stamp=next;break}stamp=next;
  }
  const date=new Date(stamp);return Number.isFinite(date.getTime())?date:null;
}
function dateKeyInZone(date,zone){const p=zonedParts(date,zone);return `${p.year}-${String(p.month).padStart(2,"0")}-${String(p.day).padStart(2,"0")}`}
function timeKeyInZone(date,zone){const p=zonedParts(date,zone);return `${String(p.hour).padStart(2,"0")}:${String(p.minute).padStart(2,"0")}`}
function formattedTimeInZone(date,zone){return fmt(timeKeyInZone(date,zone))}
function dayShiftLabel(sourceDate,targetDate){return targetDate===sourceDate?"":targetDate>sourceDate?" · اليوم التالي":" · اليوم السابق"}
function studentTimeInfo(occurrence){
  const zone=occurrence?.lesson?.studentTimeZone;if(!zone||!validTimeZone(zone)||!validDateKey(occurrence?.date)||!TIME_RE.test(occurrence?.time))return null;
  const instant=wallTimeToInstant(occurrence.date,occurrence.time,SCHEDULE_TIMEZONE);if(!instant)return null;
  const targetDate=dateKeyInZone(instant,zone),targetTime=timeKeyInZone(instant,zone),hour=Number(targetTime.slice(0,2));
  return {zone,label:timeZoneShortLabel(zone),time:fmt(targetTime),date:targetDate,shift:dayShiftLabel(occurrence.date,targetDate),odd:hour<6||hour>=23};
}
function studentTimeInline(occurrence){const info=studentTimeInfo(occurrence);return info?`🌍 ${info.time} · ${info.label}${info.shift}`:""}
function worldOffsetText(date,zone,baseZone=savedWorldClockBase()){
  const diff=zoneOffsetMinutes(date,zone)-zoneOffsetMinutes(date,baseZone),baseLabel=timeZoneShortLabel(baseZone)||"التوقيت الأساسي";
  if(!diff)return `نفس توقيت ${baseLabel}`;
  const sign=diff>0?"+":"−",abs=Math.abs(diff),hours=Math.floor(abs/60),minutes=abs%60;
  return `${sign}${hours}${minutes?`:${String(minutes).padStart(2,"0")}`:""} عن ${baseLabel}`;
}
function worldDifferenceText(date,fromZone,toZone){
  const diff=zoneOffsetMinutes(date,toZone)-zoneOffsetMinutes(date,fromZone);if(!diff)return "نفس التوقيت";
  const abs=Math.abs(diff),hours=Math.floor(abs/60),minutes=abs%60,amount=`${hours}${minutes?`:${String(minutes).padStart(2,"0")}`:""}`;
  return diff>0?`التوقيت الثاني أمام بـ ${amount}`:`التوقيت الثاني متأخر بـ ${amount}`;
}
function worldHour12Label(hour){const value=((Number(hour)%24)+24)%24,h=value%12||12;return `${h} ${value<12?"ص":"م"}`}
const WORLD_CITY_ARABIC={
  "Cairo":"القاهرة","Baku":"باكو","Bishkek":"بيشكك","Tashkent":"طشقند","Moscow":"موسكو","Istanbul":"إسطنبول","Riyadh":"الرياض","Dubai":"دبي","Doha":"الدوحة","Kuwait":"الكويت","Amman":"عمّان","Beirut":"بيروت","Damascus":"دمشق","Baghdad":"بغداد","Jerusalem":"القدس","Gaza":"غزة","London":"لندن","Paris":"باريس","Berlin":"برلين","Rome":"روما","Madrid":"مدريد","New York":"نيويورك","Los Angeles":"لوس أنجلوس","Toronto":"تورونتو","Vancouver":"فانكوفر","Almaty":"ألماتي","Astana":"أستانا","Dushanbe":"دوشنبه","Ashgabat":"عشق آباد","Kabul":"كابل","Karachi":"كراتشي","Dhaka":"دكا","Jakarta":"جاكرتا","Tokyo":"طوكيو","Seoul":"سيول","Beijing":"بكين","Shanghai":"شنغهاي","Kuala Lumpur":"كوالالمبور","Singapore":"سنغافورة","Sydney":"سيدني","Melbourne":"ملبورن"
};
function worldCityArabicName(city,zone=""){
  const raw=String(city||"").trim(),fallback=(String(zone||"").split("/").at(-1)||"").replace(/_/g," ");
  return WORLD_CITY_ARABIC[raw]||WORLD_CITY_ARABIC[fallback]||raw||fallback;
}
function worldFlagMarkup(code,country=""){
  const value=String(code||"").toUpperCase();
  if(!/^[A-Z]{2}$/.test(value))return '<span class="world-flag-fallback">🌐</span>';
  const lower=value.toLowerCase(),label=country?`علم ${country}`:"علم الدولة";
  return `<img class="world-country-flag-img" src="https://flagcdn.com/32x24/${lower}.png" srcset="https://flagcdn.com/64x48/${lower}.png 2x" width="24" height="18" alt="${esc(label)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="world-flag-fallback" hidden>🌐</span>`;
}
function worldFlagEmoji(code){
  const value=String(code||"").toUpperCase();
  if(!/^[A-Z]{2}$/.test(value))return "🌐";
  return String.fromCodePoint(...[...value].map(char=>127397+char.charCodeAt(0)));
}
function worldMiniClockMarkup(date,zone,label=""){
  const parts=zonedParts(date,zone),minute=parts.minute+parts.second/60,hour=(parts.hour%12)+minute/60;
  const numbers=Array.from({length:12},(_,index)=>{
    const number=index+1,angle=number*30*Math.PI/180,x=50+38*Math.sin(angle),y=50-38*Math.cos(angle);
    return `<span class="world-mini-number" style="left:${x}%;top:${y}%">${number}</span>`;
  }).join("");
  return `<div class="world-mini-clock" style="--mini-hour:${hour*30}deg;--mini-minute:${minute*6}deg" role="img" aria-label="ساعة ${esc(label||timeZoneShortLabel(zone)||zone)}">${numbers}<i class="world-mini-center"></i></div>`;
}
function todayName(){return dayNameForDateKey(currentDateKey())}
function currentDateKey(date=new Date()){
  try{
    const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:SCHEDULE_TIMEZONE,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date).filter(part=>part.type!=="literal").map(part=>[part.type,part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  }catch{return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10)}
}
function currentTimeKey(date=new Date()){
  try{
    const parts=Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:SCHEDULE_TIMEZONE,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date).filter(part=>part.type!=="literal").map(part=>[part.type,part.value]));
    return `${parts.hour}:${parts.minute}`;
  }catch{return `${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`}
}
function addDaysToDateKey(value,daysToAdd){
  if(!validDateKey(value))return currentDateKey();
  const date=new Date(`${value}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+Number(daysToAdd||0));return date.toISOString().slice(0,10);
}
function monthBounds(period){
  if(!validMonthKey(period))period=currentDateKey().slice(0,7);
  const [year,month]=period.split("-").map(Number);
  const start=`${year}-${String(month).padStart(2,"0")}-01`;
  const end=new Date(Date.UTC(year,month,0)).toISOString().slice(0,10);
  return {start,end};
}
function monthLabel(period){
  const {start}=monthBounds(period);
  return new Date(`${start}T12:00:00Z`).toLocaleDateString("ar-EG",{month:"long",year:"numeric",timeZone:"UTC"});
}
function dayNameForDateKey(value){
  if(!validDateKey(value))return "";
  return ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"][new Date(`${value}T12:00:00Z`).getUTCDay()];
}
function selectedWeekAnchor(){return addDaysToDateKey(currentDateKey(),selectedWeekOffset*7)}
function weekDateForDay(day,anchor=selectedWeekAnchor()){
  const target=days.indexOf(day),current=days.indexOf(dayNameForDateKey(anchor));
  return target<0||current<0?anchor:addDaysToDateKey(anchor,target-current);
}
function formatSessionDate(value,short=false){
  if(!validDateKey(value))return "تاريخ غير معروف";
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("ar-EG",short
    ?{day:"numeric",month:"numeric",timeZone:"UTC"}
    :{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"});
}
function selectedWeekRangeLabel(){
  const start=weekDateForDay(days[0]),end=weekDateForDay(days[days.length-1]);
  const startDate=new Date(`${start}T12:00:00Z`),endDate=new Date(`${end}T12:00:00Z`);
  const sameMonth=start.slice(0,7)===end.slice(0,7);
  const first=startDate.toLocaleDateString("ar-EG",sameMonth?{day:"numeric",timeZone:"UTC"}:{day:"numeric",month:"long",timeZone:"UTC"});
  const last=endDate.toLocaleDateString("ar-EG",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"});
  return `${first} — ${last}`;
}
function baseSessionRecord(lesson,date,time){
  return (lesson?.sessionRecords||[]).find(item=>item.kind==="base"&&item.date===date&&item.time===time)||null;
}
function replacementSessionRecord(lesson,id){
  return (lesson?.sessionRecords||[]).find(item=>item.kind==="replacement"&&item.id===id)||null;
}
function occurrenceHasEnded(occurrence,nowDate=currentDateKey(),nowTime=currentTimeKey()){
  if(occurrence.date<nowDate)return true;
  if(occurrence.date>nowDate)return false;
  return mins(occurrence.time)+Number(occurrence.lesson?.duration||60)<=mins(nowTime);
}
function occurrenceHasStarted(occurrence,nowDate=currentDateKey(),nowTime=currentTimeKey()){
  if(occurrence.date<nowDate)return true;
  if(occurrence.date>nowDate)return false;
  return mins(occurrence.time)<=mins(nowTime);
}
function occurrenceRawStatus(occurrence){return occurrence.record?.status||"default"}
function occurrenceStatus(occurrence){
  const explicit=occurrenceRawStatus(occurrence);
  if(explicit!=="default")return explicit;
  if(occurrenceHasEnded(occurrence))return "completed";
  if(occurrenceHasStarted(occurrence))return "ongoing";
  return "upcoming";
}
function sessionStatusInfo(status){
  return ({
    upcoming:{short:"قادمة",full:"قادمة",className:"upcoming"},
    ongoing:{short:"جارية",full:"جارية الآن",className:"ongoing"},
    completed:{short:"تمت",full:"تمت",className:"completed"},
    cancelled_unpaid:{short:"أُلغيت",full:"أُلغيت",className:"cancelled"},
    cancelled_counted:{short:"إلغاء متأخر",full:"أُلغيت (إلغاء متأخر)",className:"counted-cancel"},
    free:{short:"مجانية",full:"تمت مجانًا",className:"free"},
    rescheduled:{short:"تأجلت",full:"تأجلت إلى موعد آخر",className:"rescheduled"}
  })[status]||{short:"قادمة",full:"قادمة",className:"upcoming"};
}
function occurrenceIsInactive(occurrence){return ["cancelled_unpaid","cancelled_counted","rescheduled"].includes(occurrenceStatus(occurrence))}
function datedOccurrencesForDate(date,list=lessons){
  if(!validDateKey(date))return [];
  const day=dayNameForDateKey(date),occurrences=[];
  (Array.isArray(list)?list:[]).forEach(lesson=>{
    (lesson.schedules||[]).filter(schedule=>schedule.day===day).forEach(schedule=>{
      const record=baseSessionRecord(lesson,date,schedule.time);
      occurrences.push({lesson,date,day,time:schedule.time,kind:"base",record,recordId:record?.id||""});
    });
    (lesson.sessionRecords||[]).filter(record=>record.kind==="replacement"&&record.date===date).forEach(record=>{
      occurrences.push({lesson,date,day,time:record.time,kind:"replacement",record,recordId:record.id,sourceDate:record.sourceDate,sourceTime:record.sourceTime});
    });
  });
  return occurrences.sort((a,b)=>a.time.localeCompare(b.time)||a.lesson.name.localeCompare(b.lesson.name,"ar"));
}
function currentWeekOccurrences(list=filtered()){
  return days.flatMap(day=>datedOccurrencesForDate(weekDateForDay(day),list));
}
function sessionStatusButtonMarkup(occurrence){
  const info=sessionStatusInfo(occurrenceStatus(occurrence));
  const prefix=occurrence.kind==="replacement"?"بديل · ":"";
  return `<button type="button" class="session-status-chip ${info.className}" title="${esc(info.full)}" aria-label="تغيير حالة حصة ${esc(occurrence.lesson.name||"بدون اسم")}: ${esc(info.full)}" onclick="event.stopPropagation();openSessionStatus('${occurrence.lesson.id}','${occurrence.date}','${occurrence.time}','${occurrence.kind}','${occurrence.recordId||""}')">${prefix}${esc(info.short)}</button>`;
}
function findSessionOccurrence(lessonId,date,time,kind="base",recordId=""){
  const lesson=lessons.find(item=>item.id===lessonId);
  if(!lesson||!validDateKey(date)||!TIME_RE.test(time))return null;
  if(kind==="replacement"){
    const record=replacementSessionRecord(lesson,recordId);
    return record?{lesson,date:record.date,day:dayNameForDateKey(record.date),time:record.time,kind:"replacement",record,recordId:record.id,sourceDate:record.sourceDate,sourceTime:record.sourceTime}:null;
  }
  const record=baseSessionRecord(lesson,date,time);
  return {lesson,date,day:dayNameForDateKey(date),time,kind:"base",record,recordId:record?.id||""};
}
function sessionStatusOption(value,title,detail,selected){
  return `<label class="session-status-option"><input type="radio" name="sessionStatusChoice" value="${value}" ${selected===value?"checked":""} onchange="toggleSessionRescheduleFields()"><span><b>${title}</b><small>${detail}</small></span></label>`;
}
function openSessionStatus(lessonId,date,time,kind="base",recordId=""){
  const occurrence=findSessionOccurrence(lessonId,date,time,kind,recordId);if(!occurrence)return;
  const raw=occurrenceRawStatus(occurrence),selected=raw==="default"?"automatic":raw;
  let replacement=null;
  if(kind==="base"&&raw==="rescheduled")replacement=replacementSessionRecord(occurrence.lesson,occurrence.record?.replacementId);
  const suggestedDate=replacement?.date||occurrence.date,suggestedTime=replacement?.time||occurrence.time;
  activeSessionContext={lessonId,date:occurrence.date,time:occurrence.time,kind,recordId:occurrence.recordId||""};
  const info=sessionStatusInfo(occurrenceStatus(occurrence));
  const moveDetails=replacement?`<br>الموعد البديل: ${esc(formatSessionDate(replacement.date))} · ${esc(fmt(replacement.time))}`:kind==="replacement"?`<br>بديل عن: ${esc(formatSessionDate(occurrence.sourceDate))} · ${esc(fmt(occurrence.sourceTime))}`:"";
  const content=`<div class="session-status-form">
    <div class="session-status-current"><strong>${esc(occurrence.lesson.name||"بدون اسم")}</strong>${esc(formatSessionDate(occurrence.date))} · ${esc(fmt(occurrence.time))}<br>الحالة الحالية: ${esc(info.full)}${moveDetails}</div>
    <div class="session-status-options">
      ${sessionStatusOption("automatic","تلقائي حسب الموعد","قبل الموعد: قادمة، وبعد انتهائه: تمت.",selected)}
      ${sessionStatusOption("completed","تمت","تم عقد الحصة.",selected)}
      ${sessionStatusOption("cancelled_unpaid","أُلغيت","لم تُعقد الحصة.",selected)}
      ${sessionStatusOption("cancelled_counted","إلغاء متأخر","لتسجيل إلغاء حصة بعد فوات موعد الإلغاء المتفق عليه.",selected)}
      ${sessionStatusOption("free","حصة مجانية","لتسجيل حصة مجانية.",selected)}
      ${sessionStatusOption("rescheduled",kind==="replacement"?"تأجيل الموعد البديل":"تأجيل الحصة","ينقل هذه الحصة وحدها إلى تاريخ ووقت جديدين.",selected)}
    </div>
    <div class="session-reschedule-fields${selected==="rescheduled"?" show":""}" id="sessionRescheduleFields">
      <div class="field"><label for="sessionNewDate">التاريخ الجديد</label><input id="sessionNewDate" type="date" value="${suggestedDate}"></div>
      <div class="field"><label for="sessionNewTime">الوقت الجديد</label><input id="sessionNewTime" type="time" value="${suggestedTime}"></div>
    </div>
    <div class="session-status-note">التغيير يخص هذه الحصة بتاريخها فقط، وسيظهر في سجل التعديلات وعلى أجهزتك الأخرى.</div>
    <div class="session-status-actions"><button type="button" class="save" onclick="saveSessionStatus(this)">حفظ الحالة</button><button type="button" class="cancel" onclick="closeToolDialog()">إلغاء</button></div>
  </div>`;
  openToolDialog("حالة الحصة","تعديل سريع لا يغيّر موعدك الأسبوعي الأساسي.",content);
  activeSessionContext={lessonId,date:occurrence.date,time:occurrence.time,kind,recordId:occurrence.recordId||""};
}
function toggleSessionRescheduleFields(){
  const selected=document.querySelector('input[name="sessionStatusChoice"]:checked')?.value;
  document.getElementById("sessionRescheduleFields")?.classList.toggle("show",selected==="rescheduled");
}
function rescheduleConflict(context,newDate,newTime){
  const lesson=lessons.find(item=>item.id===context.lessonId);if(!lesson)return null;
  const start=mins(newTime),end=start+Number(lesson.duration||60);
  return datedOccurrencesForDate(newDate,lessons).find(item=>{
    if(context.kind==="base"&&item.kind==="base"&&item.lesson.id===context.lessonId&&item.date===context.date&&item.time===context.time)return false;
    if(context.kind==="replacement"&&item.kind==="replacement"&&item.lesson.id===context.lessonId&&item.recordId===context.recordId)return false;
    if(occurrenceIsInactive(item))return false;
    const otherStart=mins(item.time),otherEnd=otherStart+Number(item.lesson.duration||60);
    return start<otherEnd&&end>otherStart;
  })||null;
}
function lessonWithSessionStatus(lesson,context,status,newDate="",newTime=""){
  let records=(lesson.sessionRecords||[]).map(item=>({...item})),now=new Date().toISOString();
  if(context.kind==="replacement"){
    const index=records.findIndex(item=>item.kind==="replacement"&&item.id===context.recordId);
    if(index<0)throw new Error("Replacement session not found");
    if(status==="rescheduled")records[index]={...records[index],date:newDate,time:newTime,status:"default",updatedAt:now};
    else records[index]={...records[index],status:status==="automatic"?"default":status,updatedAt:now};
    return normalizeLesson({...lesson,sessionRecords:records});
  }
  const oldBase=records.find(item=>item.kind==="base"&&item.date===context.date&&item.time===context.time)||null;
  const oldReplacement=oldBase?.replacementId?records.find(item=>item.kind==="replacement"&&item.id===oldBase.replacementId):null;
  records=records.filter(item=>!(item.kind==="base"&&item.date===context.date&&item.time===context.time)&&item.id!==oldBase?.replacementId);
  if(status==="automatic")return normalizeLesson({...lesson,sessionRecords:records});
  if(status==="rescheduled"){
    const replacementId=oldReplacement?.id||makeId();
    records.push({id:`base-${context.date}-${context.time.replace(":","")}`,kind:"base",date:context.date,time:context.time,status:"rescheduled",replacementId,updatedAt:now});
    records.push({id:replacementId,kind:"replacement",date:newDate,time:newTime,status:"default",sourceDate:context.date,sourceTime:context.time,updatedAt:now});
  }else records.push({id:`base-${context.date}-${context.time.replace(":","")}`,kind:"base",date:context.date,time:context.time,status,updatedAt:now});
  return normalizeLesson({...lesson,sessionRecords:records});
}
async function saveSessionStatus(button){
  const context=activeSessionContext,status=document.querySelector('input[name="sessionStatusChoice"]:checked')?.value;
  if(!context||!["automatic","completed","cancelled_unpaid","cancelled_counted","free","rescheduled"].includes(status))return;
  let newDate="",newTime="";
  if(status==="rescheduled"){
    newDate=document.getElementById("sessionNewDate")?.value||"";newTime=document.getElementById("sessionNewTime")?.value||"";
    if(!validDateKey(newDate)||!TIME_RE.test(newTime)){alert("اختر تاريخًا ووقتًا صحيحين.");return}
    if(newDate===context.date&&newTime===context.time){alert("اختر موعدًا مختلفًا عن الموعد الحالي.");return}
    const conflict=rescheduleConflict(context,newDate,newTime);
    if(conflict){alert(`الموعد الجديد يتعارض مع حصة ${conflict.lesson.name||"أخرى"} الساعة ${fmt(conflict.time)}.`);return}
  }
  const index=lessons.findIndex(item=>item.id===context.lessonId);if(index<0)return;
  const previous=lessons;
  try{
    const updated=lessonWithSessionStatus(lessons[index],context,status,newDate,newTime);
    lessons=lessons.map((item,itemIndex)=>itemIndex===index?updated:item);
  }catch(error){console.error("تعذّر تحديث حالة الحصة.",error);alert("تعذّر تحديث هذه الحصة. حدّث الصفحة وحاول مرة أخرى.");return}
  if(button)button.disabled=true;
  if(!await persist()){lessons=previous;if(button)button.disabled=false;return}
  closeToolDialog();render();
}
function handlePrimaryAction(){
  if(currentSection==="students")studentsWorkspace.openNew();
  else if(currentSection==="schedule")openNew();
}
function updateSectionChrome(){
 if(currentSection!=="students")studentsWorkspace.deactivate();
 document.getElementById("scheduleWorkspace").hidden=currentSection!=="schedule";
 document.getElementById("worldClockView").hidden=currentSection!=="world";
 document.getElementById("studentsView").hidden=currentSection!=="students";
 document.querySelectorAll(".workspace-switch button").forEach(button=>{
  const active=(currentSection==="schedule"&&button.id==="scheduleSectionButton")||(currentSection==="world"&&button.id==="worldClockSectionButton")||(currentSection==="students"&&button.id==="studentsSectionButton");
  button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));
 });
 const btn=document.getElementById("primaryActionButton");btn.hidden=currentSection!=="schedule";
 if(!btn.hidden)btn.textContent="＋ إضافة حصة";
 if(currentSection!=="world"&&worldClockInterval){clearInterval(worldClockInterval);worldClockInterval=null}
}
function setSection(section){
 currentSection=["schedule","world","students"].includes(section)?section:"schedule";
 updateSectionChrome();
 if(currentSection==="world")openWorldClock();
 if(currentSection==="students"&&currentUser&&cloudReady)studentsWorkspace.activate(currentUser);
}
function filtered(){return lessons.filter(l=>l&&(currentFilter==="all"||l.type===currentFilter))}
function savedWeekTimeMode(){
  try{return localStorage.getItem(WEEK_TIME_MODE_KEY)==="full"?"full":"compact"}catch{return "compact"}
}
function rememberWeekTimeMode(mode){
  try{localStorage.setItem(WEEK_TIME_MODE_KEY,mode)}catch{}
}
function savedWeekDensity(){
  try{
    const value=localStorage.getItem(WEEK_DENSITY_KEY);
    return ["compact","normal","comfortable"].includes(value)?value:"normal";
  }catch{return "normal"}
}
function rememberWeekDensity(value){try{localStorage.setItem(WEEK_DENSITY_KEY,value)}catch{}}
function setWeekDensity(value){
  weekDensity=["compact","comfortable"].includes(value)?value:"normal";
  rememberWeekDensity(weekDensity);renderWeek();
}
function renderWeekDensityChrome(){
  [["weekDensityCompact","compact"],["weekDensityNormal","normal"],["weekDensityComfortable","comfortable"]].forEach(([id,value])=>{
    const button=document.getElementById(id),active=weekDensity===value;
    if(button){button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active))}
  });
}
function shiftedWeekTime(time,deltaMinutes){
  const base=mins(time),total=base+Number(deltaMinutes||0);
  if(!Number.isFinite(base)||total<0||total>=1440)return null;
  return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
}
function fullDayWeekTimes(){return Array.from({length:24},(_,hour)=>`${String(hour).padStart(2,"0")}:00`)}
function getWeekLayout(list=filtered()){
  const occurrences=currentWeekOccurrences(list),occurrenceTimes=[...new Set(occurrences.map(o=>o.time))];
  let times=occurrenceTimes;
  if(weekTimeMode==="full")times=[...new Set([...fullDayWeekTimes(),...occurrenceTimes])];
  else if(expandedWeekTimes.size)times=[...new Set([...occurrenceTimes,...expandedWeekTimes])];
  times.sort((a,b)=>mins(a)-mins(b));
  const slots=new Map(times.flatMap(time=>days.map(day=>[`${time}|${day}`,[]])));
  occurrences.forEach(item=>slots.get(`${item.time}|${item.day}`)?.push(item));
  return {occurrences,times,slots};
}
function renderWeekTimeModeChrome(){
  const compact=weekTimeMode!=="full",compactButton=document.getElementById("weekCompactTimeMode"),fullButton=document.getElementById("weekFullTimeMode"),hint=document.getElementById("weekTimeModeHint");
  if(compactButton){compactButton.classList.toggle("active",compact);compactButton.setAttribute("aria-pressed",String(compact))}
  if(fullButton){fullButton.classList.toggle("active",!compact);fullButton.setAttribute("aria-pressed",String(!compact))}
  if(hint)hint.textContent=compact?"المواعيد الموجودة فقط؛ استخدم علامة + بين الصفوف لإظهار ساعة فارغة.":"كل ساعات اليوم من 00:00 إلى 23:00، مع إظهار أي مواعيد إضافية مثل أنصاف الساعات.";
}
function setWeekTimeMode(mode){
  weekTimeMode=mode==="full"?"full":"compact";
  expandedWeekTimes.clear();rememberWeekTimeMode(weekTimeMode);renderWeek();
}
function revealWeekTime(time){
  if(weekTimeMode!=="compact"||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return;
  expandedWeekTimes.add(time);renderWeek();
  requestAnimationFrame(()=>document.querySelector(`[data-week-time="${time}"]`)?.scrollIntoView({block:"nearest",behavior:"smooth"}));
}
function changeScheduleWeek(delta){
  const next=selectedWeekOffset+Number(delta||0);
  selectedWeekOffset=Math.max(-260,Math.min(260,next));
  expandedWeekTimes.clear();renderWeek();
}
function resetScheduleWeek(){selectedWeekOffset=0;expandedWeekTimes.clear();renderWeek()}

function setFilter(f,btn){
  currentFilter=f;expandedWeekTimes.clear();
  document.querySelectorAll(".filter").forEach(b=>{b.classList.remove("active");b.setAttribute("aria-pressed","false")});
  btn.classList.add("active");
  btn.setAttribute("aria-pressed","true");
  render();
}
function setView(v,btn){
  currentView=v;
  document.querySelectorAll(".tab").forEach(b=>{b.classList.remove("active");b.setAttribute("aria-pressed","false")});
  btn.classList.add("active");
  btn.setAttribute("aria-pressed","true");
  document.getElementById("todayView").style.display=v==="today"?"grid":"none";
  document.getElementById("weekView").style.display=v==="week"?"block":"none";
  render();
}

function render(){
  updateSectionChrome();
  renderHeader();
  renderTimeline();
  renderSummary();
  renderWeekBars();
  renderWeek();
}

function renderHeader(){
  const d=new Date(),tn=todayName(),today=currentDateKey();
  const cairoDate=new Date(`${today}T12:00:00Z`);
  const items=datedOccurrencesForDate(today,filtered());
  const activeItems=items.filter(item=>!occurrenceIsInactive(item));
  document.getElementById("dateLabel").textContent=cairoDate.toLocaleDateString("ar-EG",{day:"numeric",month:"short",timeZone:"UTC"});
  document.getElementById("todayHeading").textContent=`${tn} — ${cairoDate.toLocaleDateString("ar-EG",{day:"numeric",month:"long",timeZone:"UTC"})}`;
  document.getElementById("todayCount").textContent=`${activeItems.length} حصة`;

  const now=mins(currentTimeKey(d));
  const next=activeItems.find(o=>occurrenceRawStatus(o)!=="completed"&&mins(o.time)+Number(o.lesson.duration||60)>=now);
  const card=document.getElementById("nextCard");
  if(next){
    const l=next.lesson;
    card.innerHTML=`
      <div class="dot"></div>
      <div class="label">الحصة القادمة</div>
      <div class="time">${fmt(next.time)}</div>
      <div class="name">${esc(l.name||"بدون اسم")}</div>
      <div class="meta">${esc(l.subject||"")}${l.platform?" · "+esc(l.platform):""} · ${l.duration} دقيقة${studentTimeInline(next)?" · "+esc(studentTimeInline(next)):""}</div>
`;
    card.onclick=()=>openEdit(l.id);
    card.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openEdit(l.id)}};
    card.setAttribute("role","button");
    card.setAttribute("tabindex","0");
    card.setAttribute("aria-label",`فتح الحصة القادمة: ${l.name||"بدون اسم"}`);
  }else{
    card.onclick=null;
    card.onkeydown=null;
    card.removeAttribute("role");
    card.removeAttribute("tabindex");
    card.removeAttribute("aria-label");
    card.innerHTML=`
      <div class="dot"></div>
      <div class="label">الحصة القادمة</div>
      <div class="time">—</div>
      <div class="name">لا توجد حصة قادمة اليوم</div>
      <div class="meta">يمكنك الانتقال إلى الأسبوع أو إضافة موعد جديد.</div>
`;
  }
}

function renderTimeline(){
  const items=datedOccurrencesForDate(currentDateKey(),filtered());
  const box=document.getElementById("timeline");
  if(!items.length){
    box.innerHTML='<div class="empty">لا توجد حصص اليوم.</div>';
    return;
  }
  box.innerHTML="";
  items.forEach((o,i)=>{
    const l=o.lesson;
    const src=l.lessonSource==="center"?(l.centerName?`مركز: ${esc(l.centerName)}`:"مركز"):"خاص";
    const srcColor=sourceColor(l);
    const people=l.studentType==="group"?`مجموعة${l.groupStudents?.length?` · ${l.groupStudents.length} طلاب`:""}`:"فردي";
    const row=document.createElement("div");
    row.className="timeline-row";
    row.style.animationDelay=`${i*.05}s`;
    row.innerHTML=`
      <div class="t-time">${fmt(o.time)}</div>
      <div class="lesson ${l.type}${occurrenceIsInactive(o)?" session-inactive":""}" style="--source-color:${srcColor}" role="button" tabindex="0" aria-label="فتح وتعديل الحصة: ${esc(l.name||"بدون اسم")}" onclick="openEdit('${l.id}')" onkeydown="if(event.target===this&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openEdit('${l.id}')}">
        <div>
          <div class="lesson-name">${esc(l.name||"بدون اسم")}</div>
          <div class="lesson-meta">${esc(l.subject||"")}${l.platform?" · "+esc(l.platform):""} · ${l.duration} دقيقة</div>
          <div class="pills">
            <span class="pill ${l.type}">${l.type==="teach"?"أُدرِّس":"أدرس"}</span>
            <span class="pill">${people}</span>
            <span class="pill">${src}</span>
            ${studentTimeInline(o)?`<span class="pill student-time-pill">${esc(studentTimeInline(o))}</span>`:""}
            ${sessionStatusButtonMarkup(o)}
          </div>
        </div>
        <div class="actions">
          <button type="button" class="icon-btn" title="نسخ" aria-label="نسخ الحصة" onclick="event.stopPropagation();copyLessonById('${l.id}')">⧉</button>
          <button type="button" class="icon-btn" title="تعديل" aria-label="تعديل الحصة" onclick="event.stopPropagation();openEdit('${l.id}')">✎</button>
        </div>
      </div>`;
    box.appendChild(row);
  });
}

function renderSummary(){
  const all=getOccurrences(lessons), tn=todayName();
  document.getElementById("totalCount").textContent=all.length;
  document.getElementById("teachCount").textContent=all.filter(o=>o.lesson.type==="teach").length;
  document.getElementById("learnCount").textContent=all.filter(o=>o.lesson.type==="learn").length;
  document.getElementById("todayMini").textContent=all.filter(o=>o.day===tn).length;
}

function renderWeekBars(){
  const box=document.getElementById("weekBars"),occ=getOccurrences(lessons);
  const data=days.map(day=>({day,count:occ.filter(o=>o.day===day).length}));
  const max=Math.max(1,...data.map(x=>x.count));
  box.innerHTML=data.map(x=>`
    <div class="bar-row">
      <b>${x.day}</b>
      <div class="track"><div class="fill" style="width:${x.count/max*100}%"></div></div>
      <span>${x.count}</span>
    </div>`).join("");
}

function weekHoursText(minutes){
  const hours=Math.round((Math.max(0,minutes)/60)*10)/10;
  return `${new Intl.NumberFormat("ar-EG",{maximumFractionDigits:1}).format(hours)} س`;
}
function renderWeekSmartSummary(occurrences){
  const box=document.getElementById("weekSmartSummary");if(!box)return;
  const active=(occurrences||[]).filter(item=>!occurrenceIsInactive(item));
  const teachMinutes=active.filter(item=>item.lesson.type==="teach").reduce((sum,item)=>sum+Number(item.lesson.duration||60),0);
  const learnMinutes=active.filter(item=>item.lesson.type==="learn").reduce((sum,item)=>sum+Number(item.lesson.duration||60),0);
  const dayCounts=days.map(day=>({day,count:active.filter(item=>item.day===day).length})).sort((a,b)=>b.count-a.count||days.indexOf(a.day)-days.indexOf(b.day));
  const busiest=dayCounts[0]||{day:"—",count:0};
  box.innerHTML=`
    <div class="week-summary-card"><small>حصص الأسبوع</small><strong>${active.length}</strong><span>${active.length?"المواعيد الفعلية في هذا الأسبوع":"لا توجد حصص"}</span></div>
    <div class="week-summary-card"><small>وقت التدريس</small><strong>${weekHoursText(teachMinutes)}</strong><span>${active.filter(item=>item.lesson.type==="teach").length} حصة أُدرِّس</span></div>
    <div class="week-summary-card"><small>وقت الدراسة</small><strong>${weekHoursText(learnMinutes)}</strong><span>${active.filter(item=>item.lesson.type==="learn").length} حصة أدرس</span></div>
    <div class="week-summary-card"><small>الأكثر ازدحامًا</small><strong>${busiest.count?esc(busiest.day):"—"}</strong><span>${busiest.count?`${busiest.count} حصة`:"الأسبوع هادئ"}</span></div>`;
}
function appendWeekGapControl(grid,time){
  if(!time)return;
  const gap=document.createElement("div"),button=document.createElement("button");
  gap.className="week-gap-control";gap.setAttribute("aria-hidden","false");
  button.type="button";button.setAttribute("aria-label",`إظهار صف الساعة ${fmt(time)}`);
  button.innerHTML=`<b aria-hidden="true">＋</b><small>${esc(fmt(time))}</small>`;
  button.onclick=()=>revealWeekTime(time);gap.appendChild(button);grid.appendChild(gap);
}
function renderWeek(){
  const list=filtered(),grid=document.getElementById("weekGrid"),legend=document.getElementById("sourceLegend"),layout=getWeekLayout(list),occ=layout.occurrences,tn=todayName();
  const rangeLabel=document.getElementById("weekRangeLabel"),isCurrentWeek=selectedWeekOffset===0;
  if(rangeLabel)rangeLabel.textContent=`${selectedWeekRangeLabel()}${isCurrentWeek?" · الأسبوع الحالي":""}`;
  renderWeekTimeModeChrome();renderWeekDensityChrome();renderWeekSmartSummary(occ);
  grid.innerHTML="";grid.classList.toggle("full-day",weekTimeMode==="full");
  grid.classList.remove("density-compact","density-normal","density-comfortable");grid.classList.add(`density-${weekDensity}`);
  const sourceNames=[...new Set(list.map(sourceLabel))].sort((a,b)=>a.localeCompare(b,"ar"));
  legend.innerHTML=sourceNames.length
    ?`<span class="legend-title">الجهة</span>${sourceNames.map(name=>`<span class="source-chip" style="--source-color:${sourceColorFromLabel(name)}"><i class="source-line" aria-hidden="true"></i>${esc(name)}</span>`).join("")}`
    :"";

  const times=layout.times;
  grid.classList.toggle("is-empty",!times.length);
  if(!times.length){
    grid.removeAttribute("aria-rowcount");
    grid.removeAttribute("aria-colcount");
    grid.innerHTML='<div class="week-empty">لا توجد حصص في هذا التصنيف.</div>';
    return;
  }

  grid.setAttribute("aria-rowcount",String(times.length+1));
  grid.setAttribute("aria-colcount",String(days.length+1));
  const head=document.createElement("div");
  head.className="week-grid-row";head.setAttribute("role","row");
  const corner=document.createElement("div");
  corner.className="week-corner";corner.setAttribute("role","columnheader");corner.textContent="الوقت";
  head.appendChild(corner);
  days.forEach(day=>{
    const count=occ.filter(o=>o.day===day&&!occurrenceIsInactive(o)).length,date=weekDateForDay(day);
    const cell=document.createElement("div");
    cell.className="week-day-head"+(isCurrentWeek&&day===tn?" today":"");cell.setAttribute("role","columnheader");
    cell.innerHTML=`<span class="count">${count}</span><span class="week-day-label"><span>${day}</span><small>${esc(formatSessionDate(date,true))}</small></span>`;
    head.appendChild(cell);
  });
  grid.appendChild(head);

  if(weekTimeMode==="compact"&&times.length){
    const beforeFirst=shiftedWeekTime(times[0],-60);
    if(beforeFirst)appendWeekGapControl(grid,beforeFirst);
  }

  times.forEach((time,timeIndex)=>{
    const row=document.createElement("div");
    row.className="week-grid-row";row.setAttribute("role","row");row.dataset.weekTime=time;
    const timeCell=document.createElement("div");
    timeCell.className="week-time-label";timeCell.setAttribute("role","rowheader");timeCell.dataset.weekTime=time;timeCell.textContent=fmt(time);
    row.appendChild(timeCell);
    days.forEach(day=>{
      const items=layout.slots.get(`${time}|${day}`)||[];
      const slot=document.createElement("div");
      slot.className="week-slot"+(isCurrentWeek&&day===tn?" today":"")+(items.length?"":" is-empty");
      slot.dataset.weekDay=day;slot.dataset.weekTime=time;slot.dataset.weekDate=weekDateForDay(day);
      slot.setAttribute("role","cell");
      slot.setAttribute("aria-label",items.length?`${day}، ${fmt(time)}، ${items.length} حصة`:`${day}، ${fmt(time)}، فارغ`);
      slot.ondragover=e=>{if(!draggedWeekContext)return;e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect="move";slot.classList.add("drag-over")};
      slot.ondragleave=e=>{if(!slot.contains(e.relatedTarget))slot.classList.remove("drag-over")};
      slot.ondrop=e=>{e.preventDefault();slot.classList.remove("drag-over");if(draggedWeekContext)openWeekMoveDialog(draggedWeekContext,day,time)};
      if(!items.length){
        const add=document.createElement("button");
        add.type="button";
        add.className="quick-add-slot";
        add.setAttribute("aria-label",`إضافة حصة يوم ${day} الساعة ${fmt(time)}`);
        add.innerHTML='<span><b aria-hidden="true">＋</b> إضافة</span>';
        add.onclick=()=>openQuickAdd(day,time);
        slot.appendChild(add);
      }
      items.forEach(o=>{
        const l=o.lesson,kind=l.type==="teach"?"أُدرِّس":"أدرس",src=sourceLabel(l),srcColor=sourceColor(l);
        const details=[`${l.duration} دقيقة`,l.subject,l.platform].filter(Boolean).map(esc).join(" · ");
        const card=document.createElement("article");
        card.className=`week-card ${l.type}${occurrenceIsInactive(o)?" session-inactive":""}`;card.style.setProperty("--source-color",srcColor);
        card.setAttribute("role","button");card.setAttribute("tabindex","0");
        card.setAttribute("aria-label",`${kind}: ${l.name||"بدون اسم"}، ${day} ${fmt(time)}، ${src}`);
        card.innerHTML=`
          <div class="week-card-top">
            <span class="week-kind ${l.type}">${kind}</span>
            <div class="week-card-tools">
              <button type="button" class="icon-btn week-move-btn" title="نقل الموعد" aria-label="نقل الموعد">↔</button>
              <button type="button" class="icon-btn week-copy-btn" title="نسخ" aria-label="نسخ الحصة">⧉</button>
            </div>
          </div>
          <div class="week-name">${esc(l.name||"بدون اسم")}</div>
          <div class="week-meta">${details}</div>
          ${studentTimeInline(o)?`<div class="week-student-time">${esc(studentTimeInline(o))}</div>`:""}
          <div class="week-status-row"><div class="week-source"><i class="source-line" aria-hidden="true"></i>${esc(src)}</div>${sessionStatusButtonMarkup(o)}</div>`;
        const moveContext={lessonId:l.id,date:o.date,time:o.time,day:o.day,kind:o.kind||"base",recordId:o.recordId||""};
        card.onclick=()=>openEdit(l.id);
        card.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openEdit(l.id)}};
        if(!occurrenceIsInactive(o)){
          card.draggable=true;card.setAttribute("aria-grabbed","false");
          card.ondragstart=e=>{draggedWeekContext=moveContext;card.classList.add("dragging");card.setAttribute("aria-grabbed","true");if(e.dataTransfer){e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",JSON.stringify(moveContext))}};
          card.ondragend=()=>{draggedWeekContext=null;card.classList.remove("dragging");card.setAttribute("aria-grabbed","false");document.querySelectorAll(".week-slot.drag-over").forEach(item=>item.classList.remove("drag-over"))};
        }
        card.querySelector(".week-copy-btn").onclick=e=>{e.stopPropagation();copyLessonById(l.id)};
        card.querySelector(".week-move-btn").onclick=e=>{e.stopPropagation();openWeekMoveDialog(moveContext,o.day,o.time)};
        slot.appendChild(card);
      });
      row.appendChild(slot);
    });
    grid.appendChild(row);
    if(weekTimeMode==="compact"){
      const candidate=shiftedWeekTime(time,60),nextTime=times[timeIndex+1]||null;
      if(candidate&&(!nextTime||mins(candidate)<mins(nextTime)))appendWeekGapControl(grid,candidate);
    }
  });
}

function scheduleRowHTML(day="الاثنين",time="18:00"){
  const safeDay=days.includes(day)?day:"الاثنين";
  const safeTime=TIME_RE.test(String(time))?String(time):"18:00";
  const opts=days.map(d=>`<option ${d===safeDay?"selected":""}>${d}</option>`).join("");
  return `<div class="row">
    <select class="schedule-day" aria-label="يوم الحصة" onchange="updateStudentTimeZoneHint()">${opts}</select>
    <input class="schedule-time" type="time" value="${safeTime}" aria-label="وقت الحصة" required oninput="updateStudentTimeZoneHint()">
    <button type="button" class="small-btn remove" onclick="removeScheduleRow(this)">حذف</button>
  </div>`;
}
function setScheduleRows(schedules){
  const box=document.getElementById("scheduleRows");box.innerHTML="";
  (schedules?.length?schedules:[{day:"الاثنين",time:"18:00"}]).forEach(s=>box.insertAdjacentHTML("beforeend",scheduleRowHTML(s.day,s.time)));
}
function addScheduleRow(){document.getElementById("scheduleRows").insertAdjacentHTML("beforeend",scheduleRowHTML())}
function removeScheduleRow(btn){
  const rows=document.querySelectorAll(".row");
  if(rows.length<=1){alert("يجب أن يكون للحصة موعد واحد على الأقل.");return}
  btn.closest(".row").remove();
}
function readSchedules(){
  return [...document.querySelectorAll(".row")].map(r=>({
    day:r.querySelector(".schedule-day").value,
    time:r.querySelector(".schedule-time").value
  }));
}

function setLessonReminderFields(mode="default",leads=[DEFAULT_NOTIFICATION_LEAD]){
  const safeMode=mode==="off"||mode==="custom"?mode:"default";
  document.getElementById("lessonReminderMode").value=safeMode;
  const selected=new Set(normalizeNotificationLeads(leads,[DEFAULT_NOTIFICATION_LEAD]));
  document.querySelectorAll(".lesson-reminder-lead").forEach(input=>{input.checked=selected.has(Number(input.value))});
  toggleLessonReminderFields();
}
function toggleLessonReminderFields(){
  const mode=document.getElementById("lessonReminderMode").value;
  const custom=document.getElementById("lessonReminderCustom");
  const hint=document.getElementById("lessonReminderHint");
  custom.classList.toggle("show",mode==="custom");
  if(mode==="off")hint.textContent="لن يُرسل أي تنبيه لهذه الحصة على أجهزتك.";
  else if(mode==="custom")hint.textContent="هذه المواعيد ستتجاوز الإعداد العام لهذه الحصة فقط.";
  else hint.textContent="سيُستخدم موعد التنبيه الافتراضي المحفوظ على كل جهاز.";
}
function validateLessonReminderChoice(changedInput){
  const selected=checkedNotificationLeads(".lesson-reminder-lead");
  if(!selected.length){
    if(changedInput)changedInput.checked=true;
    alert("اختر موعد تنبيه واحدًا على الأقل لهذه الحصة.");
    return false;
  }
  if(selected.length>MAX_NOTIFICATION_LEADS){
    if(changedInput)changedInput.checked=false;
    alert("يمكن اختيار ثلاثة تنبيهات بحد أقصى للحصة.");
    return false;
  }
  return true;
}

function toggleFields(){
  const st=document.getElementById("studentType").value;
  const src=document.getElementById("lessonSource").value;
  document.getElementById("groupField").style.display=st==="group"?"flex":"none";
  document.getElementById("centerField").style.display=src==="center"?"flex":"none";
  document.getElementById("nameLabel").textContent=st==="group"?"اسم المجموعة / عنوان الدرس":"اسم الطالب / عنوان الدرس";
}
function openDrawer(){
  const drawer=document.getElementById("drawer");
  if(!drawer.classList.contains("show"))drawerReturnFocus=document.activeElement;
  document.getElementById("backdrop").classList.add("show");
  drawer.classList.add("show");
  drawer.setAttribute("aria-hidden","false");
  document.body.classList.add("drawer-open");
  requestAnimationFrame(()=>{
    if(drawer.classList.contains("show"))drawer.focus({preventScroll:true});
  });
}
function closeDrawer(){
  const drawer=document.getElementById("drawer");
  if(!drawer.classList.contains("show"))return;
  document.getElementById("backdrop").classList.remove("show");
  drawer.classList.remove("show");
  drawer.setAttribute("aria-hidden","true");
  document.body.classList.remove("drawer-open");
  const returnFocus=drawerReturnFocus;
  drawerReturnFocus=null;
  const fallback=document.getElementById("primaryActionButton");
  requestAnimationFrame(()=>{
    if(returnFocus?.isConnected&&!returnFocus.hidden&&returnFocus.getAttribute?.("aria-hidden")!=="true")
      returnFocus.focus({preventScroll:true});
    else if(fallback&&!fallback.hidden)fallback.focus({preventScroll:true});
  });
  setTimeout(flushPendingRemote,0);
}

function openNew(){
  editingId=null;
  document.getElementById("drawerTitle").textContent="إضافة حصة";
  document.getElementById("drawerSub").textContent="أدخل بيانات الحصة مرة واحدة، ثم أضف كل مواعيدها.";
  document.getElementById("copyBtn").style.display="none";
  document.getElementById("deleteBtn").style.display="none";
  ["name","subject","platform","notes","groupStudents","centerName"].forEach(id=>document.getElementById(id).value="");
  setLessonTimeZoneField("");
  document.getElementById("type").value="teach";
  document.getElementById("studentType").value="individual";
  document.getElementById("lessonSource").value="private";
  document.getElementById("duration").value=60;
  document.getElementById("conflictBox").style.display="none";
  setScheduleRows([{day:"الاثنين",time:"18:00"}]);
  setLessonReminderFields("default",[DEFAULT_NOTIFICATION_LEAD]);
  toggleFields();openDrawer();
}
function quickAddCandidate(){
  const day=document.getElementById("quickDay")?.value||"الاثنين",time=document.getElementById("quickTime")?.value||"18:00",duration=Number(document.getElementById("quickDuration")?.value||60);
  return normalizeLesson({id:"quick-preview",type:document.getElementById("quickType")?.value==="learn"?"learn":"teach",studentType:"individual",lessonSource:"private",name:document.getElementById("quickName")?.value.trim()||"حصة جديدة",duration,repeat:"أسبوعيًا",reminderMode:"default",reminderLeads:[DEFAULT_NOTIFICATION_LEAD],sessionRecords:[],schedules:[{day,time}]});
}
function quickAddConflictList(){
  const candidate=quickAddCandidate(),basic=conflicts(candidate),schedule=candidate.schedules[0],date=weekDateForDay(schedule.day),start=mins(schedule.time),end=start+candidate.duration;
  const dated=datedOccurrencesForDate(date,lessons).filter(item=>!occurrenceIsInactive(item)).filter(item=>start<mins(item.time)+Number(item.lesson.duration||60)&&end>mins(item.time)).map(item=>({day:schedule.day,time:schedule.time,name:item.lesson.name||"حصة أخرى",exTime:item.time}));
  const seen=new Set();return [...basic,...dated].filter(item=>{const key=`${item.day}|${item.exTime}|${item.name}`;if(seen.has(key))return false;seen.add(key);return true});
}
function updateQuickAddConflict(){
  const box=document.getElementById("quickConflict");if(!box)return;
  const list=quickAddConflictList();box.classList.toggle("show",Boolean(list.length));
  box.innerHTML=list.length?`<strong>هذا الوقت غير متاح.</strong><br>${list.map(item=>`${esc(item.name)} · ${esc(fmt(item.exTime))}`).join("<br>")}`:"";
}
function openQuickAddForToday(){
  const minutes=mins(currentTimeKey());
  const nextHalfHour=Math.ceil((minutes+1)/30)*30;
  const timeMinutes=nextHalfHour%(24*60);
  const time=`${String(Math.floor(timeMinutes/60)).padStart(2,"0")}:${String(timeMinutes%60).padStart(2,"0")}`;
  const todayIndex=days.indexOf(todayName());
  const day=nextHalfHour>=24*60&&todayIndex>=0?days[(todayIndex+1)%days.length]:todayName();
  openQuickAdd(day,time);
}
function openQuickAdd(day,time){
  const safeDay=days.includes(day)?day:"الاثنين",safeTime=TIME_RE.test(String(time))?String(time):"18:00";
  const content=`<div class="quick-add-form">
    <div class="quick-add-grid">
      <div class="field full"><label for="quickName">اسم الطالب / عنوان الحصة</label><input id="quickName" maxlength="160" placeholder="مثلاً: أحمد" autocomplete="off"></div>
      <div class="field"><label for="quickType">نوع الحصة</label><select id="quickType"><option value="teach">أُدرِّس</option><option value="learn">أدرس</option></select></div>
      <div class="field"><label for="quickDuration">المدة</label><select id="quickDuration" onchange="updateQuickAddConflict()"><option value="30">30 دقيقة</option><option value="45">45 دقيقة</option><option value="60" selected>60 دقيقة</option><option value="90">90 دقيقة</option><option value="120">120 دقيقة</option></select></div>
      <div class="field"><label for="quickDay">اليوم</label><select id="quickDay" onchange="updateQuickAddConflict()">${days.map(item=>`<option value="${item}" ${item===safeDay?"selected":""}>${item}</option>`).join("")}</select></div>
      <div class="field"><label for="quickTime">الوقت</label><input id="quickTime" type="time" value="${safeTime}" oninput="updateQuickAddConflict()"></div>
    </div>
    <div class="quick-conflict" id="quickConflict" role="alert"></div>
    <div class="quick-add-note">الحفظ السريع ينشئ موعدًا أسبوعيًا ببيانات أساسية. لإضافة اسم المركز أو المنصة استخدم «تفاصيل أكثر».</div>
    <div class="quick-actions"><button type="button" class="save" onclick="saveQuickAdd(this)">حفظ سريع</button><button type="button" onclick="expandQuickAddToDrawer()">تفاصيل أكثر</button><button type="button" onclick="closeToolDialog()">إلغاء</button></div>
  </div>`;
  openToolDialog("إضافة سريعة",`${safeDay} · ${fmt(safeTime)}`,content);setTimeout(()=>{document.getElementById("quickName")?.focus();updateQuickAddConflict()},0);
}
async function saveQuickAdd(button){
  const name=document.getElementById("quickName")?.value.trim()||"",candidate=quickAddCandidate();
  if(!name){alert("اكتب اسم الطالب أو عنوان الحصة.");document.getElementById("quickName")?.focus();return}
  if(!Number.isFinite(candidate.duration)||candidate.duration<15||candidate.duration>720){alert("اختر مدة صحيحة.");return}
  const list=quickAddConflictList();if(list.length){updateQuickAddConflict();return}
  const lesson=normalizeLesson({...candidate,id:makeId(),name});
  const previous=lessons;button.disabled=true;lessons=[...lessons,lesson];
  if(!await persist()){lessons=previous;button.disabled=false;return}
  render();closeToolDialog();
}
function expandQuickAddToDrawer(){
  const name=document.getElementById("quickName")?.value.trim()||"",type=document.getElementById("quickType")?.value||"teach",duration=Number(document.getElementById("quickDuration")?.value||60),day=document.getElementById("quickDay")?.value||"الاثنين",time=document.getElementById("quickTime")?.value||"18:00";
  closeToolDialog();openNew();document.getElementById("name").value=name;document.getElementById("type").value=type;document.getElementById("duration").value=duration;setScheduleRows([{day,time}]);
}
function weeklyMoveCandidate(context,targetDay,targetTime){
  const lesson=lessons.find(item=>item.id===context.lessonId);if(!lesson)return null;
  const schedules=(lesson.schedules||[]).map(item=>item.day===context.day&&item.time===context.time?{day:targetDay,time:targetTime}:{...item});
  if(!schedules.some(item=>item.day===targetDay&&item.time===targetTime)&&!(lesson.schedules||[]).some(item=>item.day===context.day&&item.time===context.time))return null;
  return normalizeLesson({...lesson,schedules});
}
function weekMoveConflict(context,targetDay,targetTime,scope){
  if(!context||!days.includes(targetDay)||!TIME_RE.test(targetTime))return {message:"اختر يومًا ووقتًا صحيحين."};
  const targetDate=weekDateForDay(targetDay);
  if(scope==="single"){
    if(targetDate===context.date&&targetTime===context.time)return {message:"هذا هو الموعد الحالي بالفعل."};
    const conflict=rescheduleConflict(context,targetDate,targetTime);return conflict?{message:`يتعارض مع ${conflict.lesson.name||"حصة أخرى"} · ${fmt(conflict.time)}`} : null;
  }
  if(context.kind==="replacement")return {message:"الموعد البديل يمكن نقله لهذه الحصة فقط."};
  if(targetDay===context.day&&targetTime===context.time)return {message:"هذا هو الموعد الأسبوعي الحالي بالفعل."};
  const candidate=weeklyMoveCandidate(context,targetDay,targetTime);if(!candidate)return {message:"تعذّر العثور على الموعد الأسبوعي الأصلي."};
  const recurring=conflicts(candidate)[0];if(recurring)return {message:`يتعارض أسبوعيًا مع ${recurring.name} · ${fmt(recurring.exTime)}`};
  const dated=rescheduleConflict(context,targetDate,targetTime);return dated?{message:`يتعارض في هذا الأسبوع مع ${dated.lesson.name||"حصة أخرى"} · ${fmt(dated.time)}`} : null;
}
function updateWeekMoveConflict(){
  const box=document.getElementById("weekMoveConflict");if(!box||!activeWeekMoveContext)return;
  const day=document.getElementById("weekMoveDay")?.value,time=document.getElementById("weekMoveTime")?.value,scope=document.querySelector('input[name="weekMoveScope"]:checked')?.value||"single",conflict=weekMoveConflict(activeWeekMoveContext,day,time,scope);
  box.classList.toggle("show",Boolean(conflict));box.innerHTML=conflict?`<strong>لا يمكن النقل:</strong> ${esc(conflict.message)}`:"";
}
function openWeekMoveDialog(context,presetDay,presetTime){
  if(!context)return;activeWeekMoveContext={...context};
  const targetDay=days.includes(presetDay)?presetDay:context.day,targetTime=TIME_RE.test(String(presetTime))?String(presetTime):context.time,lesson=lessons.find(item=>item.id===context.lessonId);if(!lesson)return;
  const weeklyDisabled=context.kind==="replacement";
  const content=`<div class="week-move-form">
    <div class="week-move-grid"><div class="field"><label for="weekMoveDay">اليوم الجديد</label><select id="weekMoveDay" onchange="updateWeekMoveConflict()">${days.map(item=>`<option value="${item}" ${item===targetDay?"selected":""}>${item}</option>`).join("")}</select></div><div class="field"><label for="weekMoveTime">الوقت الجديد</label><input id="weekMoveTime" type="time" value="${targetTime}" oninput="updateWeekMoveConflict()"></div></div>
    <div class="move-scope"><label><input type="radio" name="weekMoveScope" value="single" checked onchange="updateWeekMoveConflict()"><span><strong>هذه الحصة فقط</strong><br>ينقل موعد هذا الأسبوع دون تغيير الجدول الأساسي.</span></label><label><input type="radio" name="weekMoveScope" value="weekly" ${weeklyDisabled?"disabled":""} onchange="updateWeekMoveConflict()"><span><strong>الموعد الأسبوعي</strong><br>يغيّر هذا الموعد في الأسابيع القادمة كلها.</span></label></div>
    <div class="week-move-conflict" id="weekMoveConflict" role="alert"></div>
    <div class="quick-actions"><button type="button" class="save" onclick="saveWeekMove(this)">نقل الموعد</button><button type="button" onclick="closeToolDialog()">إلغاء</button></div>
  </div>`;
  openToolDialog("نقل الموعد",`${lesson.name||"بدون اسم"} · ${formatSessionDate(context.date)} · ${fmt(context.time)}`,content);activeWeekMoveContext={...context};setTimeout(updateWeekMoveConflict,0);
}
async function saveWeekMove(button){
  const context=activeWeekMoveContext;if(!context)return;
  const targetDay=document.getElementById("weekMoveDay")?.value,targetTime=document.getElementById("weekMoveTime")?.value,scope=document.querySelector('input[name="weekMoveScope"]:checked')?.value||"single",conflict=weekMoveConflict(context,targetDay,targetTime,scope);
  if(conflict){updateWeekMoveConflict();return}
  const index=lessons.findIndex(item=>item.id===context.lessonId);if(index<0)return;
  const previous=lessons;button.disabled=true;
  if(scope==="weekly"){
    const candidate=weeklyMoveCandidate(context,targetDay,targetTime);if(!candidate){button.disabled=false;return}
    lessons=lessons.map((item,itemIndex)=>itemIndex===index?candidate:item);
  }else{
    const targetDate=weekDateForDay(targetDay),updated=lessonWithSessionStatus(lessons[index],context,"rescheduled",targetDate,targetTime);
    lessons=lessons.map((item,itemIndex)=>itemIndex===index?updated:item);
  }
  if(!await persist()){lessons=previous;button.disabled=false;return}
  render();closeToolDialog();
}
function openEdit(id){
  const l=lessons.find(x=>x.id===id);if(!l)return;
  editingId=id;
  document.getElementById("drawerTitle").textContent="تعديل الحصة";
  document.getElementById("drawerSub").textContent="عدّل البيانات أو المواعيد من نفس المكان.";
  document.getElementById("copyBtn").style.display="inline-block";
  document.getElementById("deleteBtn").style.display="inline-block";
  document.getElementById("type").value=l.type||"teach";
  document.getElementById("studentType").value=l.studentType||"individual";
  document.getElementById("lessonSource").value=l.lessonSource||"private";
  document.getElementById("name").value=l.name||"";
  document.getElementById("groupStudents").value=Array.isArray(l.groupStudents)?l.groupStudents.join("\n"):"";
  setLessonTimeZoneField(l.studentTimeZone||"");
  document.getElementById("centerName").value=l.centerName||"";
  document.getElementById("subject").value=l.subject||"";
  document.getElementById("duration").value=l.duration||60;
  document.getElementById("platform").value=l.platform||"";
  document.getElementById("notes").value=l.notes||"";
  document.getElementById("conflictBox").style.display="none";
  setScheduleRows(l.schedules||[]);
  setLessonReminderFields(l.reminderMode,l.reminderLeads);
  toggleFields();openDrawer();
}

function conflicts(candidate){
  const out=[],dur=Number(candidate.duration||60);
  const own=Array.isArray(candidate.schedules)?candidate.schedules:[];
  for(let i=0;i<own.length;i++){
    for(let j=i+1;j<own.length;j++){
      if(own[i].day!==own[j].day)continue;
      const a1=mins(own[i].time),a2=a1+dur,b1=mins(own[j].time),b2=b1+dur;
      if(a1<b2&&a2>b1)out.push({day:own[i].day,time:own[i].time,name:"موعد آخر في الحصة نفسها",exTime:own[j].time});
    }
  }
  for(const s of candidate.schedules||[]){
    const a1=mins(s.time),a2=a1+dur;
    for(const ex of lessons){
      if(ex.id===candidate.id)continue;
      const ed=Number(ex.duration||60);
      for(const es of ex.schedules||[]){
        if(es.day!==s.day)continue;
        const b1=mins(es.time),b2=b1+ed;
        if(a1<b2&&a2>b1)out.push({day:s.day,time:s.time,name:ex.name||"حصة أخرى",exTime:es.time});
      }
    }
  }
  return out;
}

async function saveLesson(){
  if(lessonSaveInFlight)return;
  const st=document.getElementById("studentType").value;
  const src=document.getElementById("lessonSource").value;
  const existingLesson=editingId?lessons.find(item=>item.id===editingId):null;
  const reminderMode=document.getElementById("lessonReminderMode").value;
  const reminderLeads=checkedNotificationLeads(".lesson-reminder-lead");
  const duration=Number(document.getElementById("duration").value);
  const groupStudents=document.getElementById("groupStudents").value.split(/[\n،,]+/).map(x=>x.trim()).filter(Boolean);
  const lesson={
    id:editingId||makeId(),
    type:document.getElementById("type").value,
    studentType:st,lessonSource:src,
    name:document.getElementById("name").value.trim(),
    groupStudents,
    studentTimeZone:readLessonTimeZone(),
    centerName:document.getElementById("centerName").value.trim(),
    subject:document.getElementById("subject").value.trim(),
    duration,
    platform:document.getElementById("platform").value.trim(),
    repeat:"أسبوعيًا",
    reminderMode,
    reminderLeads:normalizeNotificationLeads(reminderLeads,[DEFAULT_NOTIFICATION_LEAD]),
    sessionRecords:existingLesson?.sessionRecords||[],
    schedules:readSchedules(),
    notes:document.getElementById("notes").value.trim()
  };
  if(document.getElementById("studentTimeZoneInput").value.trim()&&!lesson.studentTimeZone){alert("اختر بلد/منطقة الطالب من الاقتراحات. وإذا كانت الدولة فيها أكثر من توقيت، اختر المدينة أو المنطقة.");return}
  if(!Number.isFinite(duration)||duration<15||duration>720){alert("اكتب مدة صحيحة بين 15 و720 دقيقة.");return}
  if(reminderMode==="custom"&&!reminderLeads.length){alert("اختر موعد تنبيه واحدًا على الأقل لهذه الحصة.");return}
  if(reminderMode==="custom"&&reminderLeads.length>MAX_NOTIFICATION_LEADS){alert("يمكن اختيار ثلاثة تنبيهات بحد أقصى للحصة.");return}
  if(!lesson.schedules.length||lesson.schedules.some(s=>!days.includes(s.day)||!TIME_RE.test(s.time))){alert("اختر يومًا ووقتًا صحيحين لكل موعد.");return}
  if(st==="individual"&&!lesson.name){alert("اكتب اسم الطالب أو عنوان الدرس.");return}
  if(st==="group"&&!groupStudents.length){alert("أضف اسم طالب واحد على الأقل في المجموعة.");return}
  if(st==="group"&&!lesson.name)lesson.name="مجموعة "+groupStudents.slice(0,2).join(" و");
  if(src==="center"&&!lesson.centerName){alert("اكتب اسم المركز.");return}
  const c=conflicts(lesson),box=document.getElementById("conflictBox");
  if(c.length){
    box.innerHTML="<strong>يوجد تعارض:</strong><br>"+c.map(x=>`${x.day} ${fmt(x.time)} مع ${esc(x.name)} (${fmt(x.exTime)})`).join("<br>");
    box.style.display="block";return;
  }
  const old=lessons;
  const saveButton=document.getElementById("saveLessonBtn");
  lessonSaveInFlight=true;
  if(saveButton){saveButton.disabled=true;saveButton.textContent="جارٍ الحفظ…";}
  try{
    lessons=editingId?lessons.map(l=>l.id===editingId?lesson:l):[...lessons,lesson];
    if(!await persist()){lessons=old;return}
    render();closeDrawer();
  }catch(error){
    lessons=old;
    console.error("تعذّر حفظ الحصة.",error);
    alert("تعذّر حفظ الحصة. تحقق من الاتصال وحاول مرة أخرى.");
  }finally{
    lessonSaveInFlight=false;
    if(saveButton){saveButton.disabled=false;saveButton.textContent="حفظ";}
  }
}
function copyLessonById(id){
  const o=lessons.find(l=>l.id===id);if(!o)return;
  openEdit(id);
  editingId=null;
  document.getElementById("drawerTitle").textContent="نسخ الحصة";
  document.getElementById("drawerSub").textContent="عدّل الاسم أو الموعد ثم احفظ النسخة الجديدة.";
  document.getElementById("name").value=(o.name||"حصة")+" - نسخة";
  document.getElementById("copyBtn").style.display="none";
  document.getElementById("deleteBtn").style.display="none";
}
function copyLesson(){if(editingId)copyLessonById(editingId)}
async function deleteLesson(){
 if(!editingId||!confirm("نقل هذه الحصة وكل مواعيدها إلى سلة المحذوفات لمدة 30 يومًا؟ يمكنك استعادتها لاحقًا."))return;
 const old=lessons;lessons=lessons.filter(l=>l.id!==editingId);
 if(!await persist()){lessons=old;return}
 render();closeDrawer();
}

function keepToolDialogKeyboardFocus(event){
  if(event.key!=="Tab"||!document.getElementById("toolBackdrop").classList.contains("show"))return;
  const dialog=document.getElementById("toolDialog");
  const focusables=[...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(el=>!el.hidden&&!el.closest("[hidden]")&&el.getClientRects().length);
  if(!focusables.length){event.preventDefault();dialog.focus({preventScroll:true});return}
  const first=focusables[0],last=focusables[focusables.length-1],current=document.activeElement;
  if(!dialog.contains(current)||current===dialog){
    event.preventDefault();(event.shiftKey?last:first).focus({preventScroll:true});
  }else if(event.shiftKey&&current===first){
    event.preventDefault();last.focus({preventScroll:true});
  }else if(!event.shiftKey&&current===last){
    event.preventDefault();first.focus({preventScroll:true});
  }
}
document.addEventListener("keydown",e=>{
  if(e.key==="Tab")keepToolDialogKeyboardFocus(e);
  if(e.key==="Escape"){
    if(document.getElementById("toolBackdrop").classList.contains("show")){closeToolDialog();return}
    if(document.getElementById("dataMenu")?.open){closeDataMenu(true);return}
    if(document.getElementById("authGate").classList.contains("hidden"))closeDrawer();
  }
  if(e.key==="Enter"&&!document.getElementById("authGate").classList.contains("hidden"))submitAuth();
});
document.addEventListener("click",e=>{
  const menu=document.getElementById("dataMenu");
  if(menu?.open&&!menu.contains(e.target))closeDataMenu();
});
document.addEventListener("visibilitychange",requestAutoRefresh);
window.addEventListener("focus",requestAutoRefresh);
window.addEventListener("online",requestAutoRefresh);
window.addEventListener("offline",()=>{if(currentUser)setSync("error","غير متصل بالإنترنت")});
window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();
  deferredInstallPrompt=event;
  refreshInstallAction();
});
window.addEventListener("appinstalled",()=>{
  deferredInstallPrompt=null;
  refreshInstallAction();
});

async function initApp(){
  refreshInstallAction();
  registerAppWorker();
  render();
  if(!cloud){
    showAuth();
    setAuthMessage("تعذّر تحميل خدمة الحساب. تحقق من اتصال الإنترنت ثم حدّث الصفحة.",true);
    return;
  }
  cloud.auth.onAuthStateChange((event,session)=>{
    if(event==="PASSWORD_RECOVERY"&&session?.user){
      enterPasswordUpdate(session.user);
    }else if(event==="SIGNED_OUT"){
      setTimeout(()=>{
        stopRealtime();
        resetStudentWorkspace();
        resetWorldClockSync();
        sessionSequence++;loadingUserId=null;currentUser=null;cloudReady=false;lessons=[];editingId=null;
        recoveryUser=null;lastCloudUpdatedAt=null;setAuthMode("signin");closeDrawer();closeToolDialog();updateNotificationMenuStatus(false);render();showAuth();setAuthMessage("سجّل الدخول للوصول إلى جدولك.");
      },0);
    }else if(event==="SIGNED_IN"&&session?.user&&authMode!=="update"){
      if(recoveryLinkDetected){enterPasswordUpdate(session.user);return}
      setTimeout(()=>activateSession(session.user),0);
    }
  });
  const {data,error}=await cloud.auth.getSession();
  if(error){
    console.error("تعذّر قراءة جلسة مواعيدي.",error);
    showAuth();setAuthMessage("تعذّر الاتصال بالحساب. حدّث الصفحة وحاول مرة أخرى.",true);return;
  }
  if(data.session?.user){
    if(authMode==="update")return;
    if(recoveryLinkDetected)enterPasswordUpdate(data.session.user);
    else await activateSession(data.session.user);
  }else if(authMode!=="update"){
    showAuth();setAuthMessage("سجّل الدخول إلى حسابك.");
  }
}
initApp();


