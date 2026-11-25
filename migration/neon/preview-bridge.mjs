import {createClient} from '@neon/neon-js/supabase';
const base='https://ep-withered-scene-bh3isds4.c-10.eu-central-1.aws.neon.tech/neondb';
const unavailable=async()=>({data:null,error:{message:'غير متاح في النسخة التجريبية'}}); 
const client=createClient(base);
// Explicitly fail closed for features not yet ported. No Supabase fallback.
const api={auth:client.auth,from:client.from.bind(client),rpc:client.rpc.bind(client),storage:{from:()=>({download:unavailable,upload:unavailable,remove:unavailable,createSignedUrl:unavailable,createSignedUrls:unavailable})},functions:{invoke:unavailable}};
window.supabase={createClient:()=>api};
