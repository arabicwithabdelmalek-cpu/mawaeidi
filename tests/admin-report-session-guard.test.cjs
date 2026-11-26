"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../admin-dashboard.js"),"utf8");
function extract(n){const m=source.match(new RegExp("^  (?:async )?function "+n+"\\(","m"));assert.ok(m,n);return source.slice(m.index,source.indexOf("\n  }",m.index)+4)}
const build=new Function("deps",[
'const client=deps.client,$=id=>deps.elements[id]||=( {} );',
'let pending=false,reportGeneration=0,current=null,users=[],sessions=[],selectedUserId=null,detailReturnFocus=null,adminAvatarOwner=null,avatarCache=new Map(),avatarLoadedAt=0,avatarRetryAfter=0,avatarRequest=null,deviceVersions=null,deviceRequest=0;',
'deps.elements.deviceRows={replaceChildren(){}};const loadDeviceVersions=()=>{};',
'const cairoDateFormat={format:()=>"today"},buildSummary=()=>({}),renderAll=()=>{deps.paints++},renderUsers=()=>{deps.paints++},renderDetails=()=>{},renderFeed=()=>{};',
extract("fail"),extract("refreshAvatarLinks"),extract("loadReport"),
'return {fail,loadReport,refreshAvatarLinks,state:()=>({current,users,adminAvatarOwner,avatarRetryAfter}),seed:()=>{current={};adminAvatarOwner="owner";users=[{id:"u"}]}};'
].join("\n"));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
function setup(){const auth=deferred(),rpc=deferred(),pictures=[];const deps={elements:{},paints:0,rpcCalls:0,client:{auth:{getUser:()=>auth.promise},rpc:()=>{deps.rpcCalls++;return rpc.promise},functions:{invoke(){const request=deferred();pictures.push(request);return request.promise}}}};return {x:build(deps),deps,auth,rpc,pictures}}
(async()=>{
let {x,deps,auth,rpc,pictures}=setup();let request=x.loadReport();x.fail("signed out");auth.resolve({data:{user:{id:"owner"}}});await request;assert.equal(deps.rpcCalls,0);assert.equal(x.state().current,null);
({x,deps,auth,rpc,pictures}=setup());request=x.loadReport();auth.resolve({data:{user:{id:"owner"}}});await flush();assert.equal(deps.rpcCalls,1);x.fail("signed out");rpc.resolve({data:{users:[{id:"u"}],sessions:[]}});await request;assert.equal(x.state().current,null);assert.equal(deps.paints,0);assert.equal(deps.elements.dashboard.hidden,true);
({x,deps,auth,rpc,pictures}=setup());x.seed();x.refreshAvatarLinks("owner",true);x.fail("signed out");x.seed();x.refreshAvatarLinks("owner",true);pictures[0].resolve({data:{users:[{id:"u",avatar_url:"https://example.test/old"}]}});await flush();assert.equal(x.state().users[0].avatar_url,undefined);assert.equal(deps.paints,0);pictures[1].resolve({data:{users:[{id:"u",avatar_url:"https://example.test/new"}]}});await flush();assert.equal(x.state().users[0].avatar_url,"https://example.test/new");
console.log("Admin report and avatar responses cannot restore data from a cleared session.");
})().catch(e=>{console.error(e);process.exitCode=1});
