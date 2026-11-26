const assert=require("node:assert/strict"),m=require("../admin-device-report.js");
assert.equal(m.compare("2.0.0-beta.9","2.0.0-beta.19"),-1);
assert.equal(m.compare("2.0.0","2.0.0-beta.19"),1);
assert.equal(m.compare("bad","2.0.0"),null);
const now=Date.now(),users=[{id:"a"},{id:"b"}],rows=[{user_id:"a",client_type:"android",app_version:"2.0.0-beta.18",last_seen_at:new Date(now-1000).toISOString()},{user_id:"a",client_type:"android",app_version:"2.0.0-beta.19",last_seen_at:new Date(now-2000).toISOString()},{user_id:"a",client_type:"web",last_seen_at:new Date(now-3000).toISOString()},{user_id:"b",client_type:"android",last_seen_at:new Date(now-4000).toISOString()}];
assert.deepEqual(m.rows(users,[],rows,"2.0.0-beta.19",now).map(x=>x.status),["outdated","web","unknown"]);
assert.equal(m.rows(users,rows,null,null,now)[0].status,"unverified");
assert.equal(m.rows(users,rows,[],null,now).length,0);
console.log("Device report model passed.");