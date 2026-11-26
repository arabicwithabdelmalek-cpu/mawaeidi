/* Pure report model: one last recorded session per account and platform, never a device fingerprint. */
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.MawaeidiDeviceReport=api})(typeof globalThis!=="undefined"?globalThis:this,()=>{
  const parts=v=>{const m=typeof v==="string"&&v.length<=64&&v.match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);return m?{core:m.slice(1,4).map(Number),pre:m[4]?m[4].split("."):[]}:null};
  function compare(a,b){const x=parts(a),y=parts(b);if(!x||!y)return null;for(let i=0;i<3;i++)if(x.core[i]!==y.core[i])return x.core[i]>y.core[i]?1:-1;if(!x.pre.length||!y.pre.length)return x.pre.length===y.pre.length?0:x.pre.length?-1:1;for(let i=0;i<Math.max(x.pre.length,y.pre.length);i++){const l=x.pre[i],r=y.pre[i];if(l===undefined)return -1;if(r===undefined)return 1;if(l===r)continue;const ln=/^\d+$/.test(l),rn=/^\d+$/.test(r);if(ln&&rn){const n=Number(l)-Number(r);if(n)return Math.sign(n);continue}if(ln!==rn)return ln?-1:1;return l>r?1:-1}return 0}
  function latestRelease(releases){return (Array.isArray(releases)?releases:[]).filter(r=>r&&!r.draft&&parts(r.tag_name)&&Array.isArray(r.assets)&&r.assets.some(a=>/^Mawaeidi-[0-9A-Za-z.-]+\.apk$/i.test(a.name||"")&&/^sha256:[a-f0-9]{64}$/i.test(a.digest||"")&&String(a.browser_download_url||"").startsWith("https://github.com/arabicwithabdelmalek-cpu/mawaeidi/releases/download/"))).map(r=>r.tag_name.replace(/^v/,"")).sort((a,b)=>compare(b,a))[0]||null}
  function rows(users,sessions,versions,latest,now=Date.now()){
    const people=new Map(users.map(u=>[u.id,u])),map=new Map(),cutoff=now-90*86400000;
    for(const s of (Array.isArray(versions)?versions:sessions)){
      if(!people.has(s.user_id)||!["web","android","ios"].includes(s.client_type))continue;
      const at=Date.parse(s.last_seen_at);if(!Number.isFinite(at)||at<cutoff)continue;
      const key=s.user_id+"|"+s.client_type,old=map.get(key);if(old&&old.at>=at)continue;
      const version=s.client_type!=="web"&&parts(s.app_version)?s.app_version:null;
      const cmp=s.client_type==="android"&&version&&latest?compare(version,latest):null;
      const status=s.client_type==="web"?"web":!version?"unknown":s.client_type!=="android"||cmp===null?"unverified":cmp<0?"outdated":cmp===0?"current":"newer";
      map.set(key,{person:people.get(s.user_id),platform:s.client_type,version,at,status});
    }
    return [...map.values()].sort((a,b)=>b.at-a.at);
  }
  return {compare,latestRelease,rows};
});
