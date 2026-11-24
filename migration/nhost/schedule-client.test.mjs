import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createScheduleClient} from './schedule-client.mjs';
const graphqlUrl = 'https://example.graphql.eu-central-1.nhost.run/v1';
function client(response, captured = [], token = 'fake-test-token') {
  return createScheduleClient({graphqlUrl, getAccessToken: async () => token,
    fetchImpl: async (url, options) => {
      captured.push({url, options});
      return {ok: true, json: async () => response};
    }});
}
test('read distinguishes missing record from network/API errors', async () => {
  assert.equal(await client({data:{mawaeidi_data:[]}}).load(), null);
  await assert.rejects(client({errors:[{message:'permission denied'}]}).load(), /graphql_request_failed/);
});
test('read requires authenticated token and sends no admin headers', async () => {
  const calls = [];
  await assert.rejects(client({}, calls, '').load(), /authentication_required/);
  assert.equal(calls.length, 0);
  await client({data:{mawaeidi_data:[{lessons:[],updated_at:'test'}]}}, calls).load();
  assert.equal(calls[0].options.headers.Authorization, 'Bearer fake-test-token');
  assert.equal(Object.keys(calls[0].options.headers).length, 2);
});
test('save never sends user_id; server sets ownership', async () => {
  const calls = [];
  await client({data:{insert_mawaeidi_data_one:{updated_at:'test'}}},calls).save([{id:'fake'}]);
  const body = JSON.parse(calls[0].options.body);
  assert.equal('user_id' in body.variables, false);
  assert.equal(body.query.includes('user_id'), false);
  assert.deepEqual(body.variables.lessons,[{id:'fake'}]);
});
test('rejects invalid endpoints and unconfirmed saves', async () => {
  assert.throws(() => createScheduleClient({graphqlUrl:'https://example.com/v1'}), /endpoint/);
  await assert.rejects(client({data:{insert_mawaeidi_data_one:null}}).save([]), /save_not_confirmed/);
});
