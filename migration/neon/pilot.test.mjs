import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createScheduleAdapter} from './schedule-adapter.mjs';
function fixture({user={id:'test-owner'},load={data:null},save={data:{updated_at:'now'}}}={}) {
  const calls=[];
  const chain={
    select(v){calls.push(['select',v]);return this},
    eq(k,v){calls.push(['eq',k,v]);return this},
    maybeSingle:async()=>load,
    single:async()=>save,
    upsert(v,o){calls.push(['upsert',v,o]);return this}
  };
  return {calls,client:{auth:{getUser:async()=>({data:{user}})},from(n){calls.push(['from',n]);return chain}}};
}
test('denies unauthenticated access before any table request',async()=>{
  const f=fixture({user:null});
  await assert.rejects(createScheduleAdapter(f.client).load(),/authentication_required/);
  assert.equal(f.calls.length,0);
});
test('preserves distinction between no schedule and load failure',async()=>{
  const f=fixture();
  assert.equal(await createScheduleAdapter(f.client).load(),null);
  assert.deepEqual(f.calls[2],['eq','user_id','test-owner']);
  const e=fixture({load:{data:null,error:{message:'network'}}});
  await assert.rejects(createScheduleAdapter(e.client).load(),/schedule_load_failed/);
});
test('save uses verified session identity and checks confirmation',async()=>{
  const f=fixture();
  await createScheduleAdapter(f.client).save([{id:'synthetic'}]);
  assert.equal(f.calls[1][1].user_id,'test-owner');
  assert.deepEqual(f.calls[1][1].lessons,[{id:'synthetic'}]);
  await assert.rejects(createScheduleAdapter(fixture({save:{data:null,error:{}}}).client).save([]),/schedule_save_not_confirmed/);
});
