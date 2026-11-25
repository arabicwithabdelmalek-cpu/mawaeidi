import {test} from 'node:test';
import assert from 'node:assert/strict';
const base='https://ep-royal-sunset-bh71zbq5.apirest.c-10.eu-central-1.aws.neon.tech/neondb/rest/v1';
const tables=['mawaeidi_data','mawaeidi_students','mawaeidi_student_followups','mawaeidi_world_clock_settings','mawaeidi_trash','mawaeidi_history','mawaeidi_student_history','mawaeidi_student_photo_cleanup'];
for(const table of tables)test('anonymous request denied: '+table,async()=>{
  const response=await fetch(base+'/'+table+'?select=user_id&limit=1',{headers:{Origin:'https://arabicwithabdelmalek-cpu.github.io'},signal:AbortSignal.timeout(20000)});
  assert.ok([401,403].includes(response.status),'Expected authorization denial, got HTTP '+response.status);
});
