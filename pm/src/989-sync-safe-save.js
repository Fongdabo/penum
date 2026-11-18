/* ---------- 4.99.39 two devices saving at the same moment never lose each other's work (audit 2026-11-11, round 2) ----------
   Each device wrote the whole penum-pm.json over the cloud copy. A device that had read the file just before another device
   saved wrote its older copy back; the next merge (merge3) then read the other device's new records as deleted, and they
   vanished from every device without a message (4 devices saving every 4-12 s lost 11 of 65). On PENUM's cloud now:
   1. A device saves only on top of the newest copy, one device at a time. It reads the copy's number (rpc pm_rev) before the
      file, asks for a short lock with that number before writing (pm_lock: "busy" = another device is writing, wait; "stale" =
      someone saved since, so read and merge again first) and hands the lock back with the number + 1 (pm_unlock).
      The rpcs are in tools/pm-cloud-setup.sql. A cloud that has not run it yet saves as before, with 2 and 3 below.
   2. A device sends the file only when its user saved something (save() outside render, not the one made when the page
      closes) since its last upload, after a new link or join, or when a record had to be put back (3). Pages that only tidy
      their data while being looked at no longer send the whole file (11 of 105 pages did, from every device that opened them).
      The flag outlives a reload (pmSBdirty); a device without it sends once.
   3. A record deleted on purpose is noted for 90 days in DB.co.tomb (id: day), by the upload that drops it. A record that the
      last synced copy and this device both have, but the cloud copy lacks with no such note, was written over by an older
      copy: it is put back before the merge and saved again.
   Saving to a OneDrive folder, OneDrive or a phone file is unchanged. */
const SSV={n:0,r:0,d:null,sync:null,run:null,q:null,off:0,mg:0,f:null,rv:0,dev:uid()+Date.now().toString(36)};
const SSVK='pmSBdirty'+DSFX,ssvPath=()=>SB.cid+'/'+FNAME,ssvOn=()=>sbOn()&&folderOn();
function ssvDirty(){if(SSV.d===null){try{SSV.d=localStorage.getItem(SSVK)!=='0'}catch(e){SSV.d=true}}return SSV.d}
function ssvMark(v){if(SSV.d===v)return;SSV.d=v;try{localStorage.setItem(SSVK,v?'1':'0')}catch(e){}}
// 2: what counts as the user's own save
{const f=save;save=function(){const e=window.event;if(!SSV.r&&!(e&&e.type==='pagehide')){SSV.n++;ssvMark(true)}return f.apply(this,arguments)}}
function ssvRW(){const f=render;render=function(){SSV.r++;try{return f.apply(this,arguments)}finally{SSV.r--}};render.ssv=1}
ssvRW();setTimeout(()=>{if(!render.ssv)ssvRW()},0);// once more over the pages that wrap render after this file
{const f=applyData;applyData=function(){if(SSV.sync)SSV.sync.ap++;return f.apply(this,arguments)}}

// 1: the lock's rpcs; {off:1} when this cloud does not have them (SQL not run yet) or they fail there: then saving works as before
async function ssvRpc(fn,a){const r=await sbReq('/rest/v1/rpc/'+fn,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(a)});
  const j=await r.json().catch(()=>null);if(r.ok&&j&&typeof j==='object')return j;
  if(r.status!==404)console.warn('PENUM cloud: '+fn+' '+r.status+' '+((j&&(j.message||j.code))||''));SSV.off=Date.now();return {off:1}}
// the copy's number first, then the copy: a save made in between costs one more read, never a lost record.
// A device with nothing of its own to send skips the number (no extra request on every 20-second check).
{const f=fRead;fRead=async function(dir,name){const t=SSV.sync;if(!t||t.cur!==undefined||name!==FNAME||!dir||!dir._sb)return f.apply(this,arguments);
  t.cur=null;t.off=!!SSV.off&&Date.now()-SSV.off<6e5;
  if(!t.off){if(ssvDirty()||!CL.dirMtime||SSV.rv){SSV.rv=0;const v=await ssvRpc('pm_rev',{p_company:SB.cid,p_path:ssvPath()});if(v.off)t.off=true;else{SSV.off=0;t.rev=+v.rev||0}}else t.norev=1}
  const c=await f.apply(this,arguments);t.cur=c;t.main=!!(c&&(t.force||c.mtime!==CL.dirMtime)&&c.txt!==payload());return c}}
{const f=fWrite;fWrite=async function(dir,name,txt){const t=SSV.sync;if(!t||t.w||name!==FNAME||!dir||!dir._sb)return f.apply(this,arguments);
  t.w=1;const cur=t.cur;
  // 2: nothing of this device's own to send: the cloud copy stays as it is and becomes the last synced copy
  if(cur&&CL.dirMtime&&!t.fix&&t.ap<=(t.main?1:0)&&!ssvDirty()){t.base=cur.txt;return cur.mtime}
  if(t.norev&&!t.off){SSV.rv=1;t.again='stale';throw Object.assign(new Error('กำลังรวมข้อมูลล่าสุดก่อนบันทึก'),{again:'stale'})}// read again, number first
  txt=ssvTomb(cur&&cur.txt,txt);
  if(!t.off){const L=await ssvRpc('pm_lock',{p_company:SB.cid,p_path:ssvPath(),p_base:t.rev||0,p_dev:SSV.dev});
    if(L.busy||L.stale){t.again=L.busy?'busy':'stale';
      throw Object.assign(new Error(L.busy?'อีกเครื่องกำลังบันทึกข้อมูลบริษัทอยู่ จะลองบันทึกอีกครั้งเอง':'มีเครื่องอื่นเพิ่งบันทึก กำลังรวมข้อมูลล่าสุดก่อนบันทึก'),{again:t.again})}
    if(L.ok)t.lk=1;else t.off=true}
  let ok=false;
  try{const m=await f.call(this,dir,name,txt);ok=true;t.base=txt;t.up=1;return m}
  finally{if(t.lk){let U=null;for(let i=0;i<3&&!U;i++)U=await ssvRpc('pm_unlock',{p_company:SB.cid,p_path:ssvPath(),p_dev:SSV.dev,p_saved:ok}).catch(()=>null);
    if(U&&U.lost)t.lost=1}}}}// the lock ran out during a very slow upload and another device took it: sync again soon

// 3: ids that are in the cloud copy (C) and not in what this device sends (B): this device deleted them
const ssvAll=a=>Array.isArray(a)&&a.every(x=>isObj(x)&&x.id!=null);
const ssvColl=o=>{if(!isObj(o))return false;const k=Object.keys(o);return k.length>0&&k.every(i=>isObj(o[i])&&String(o[i].id)===i)};// DB.projects
function ssvGone(C,B,out){
  if(Array.isArray(C)||Array.isArray(B)){if(!(ssvAll(C)&&ssvAll(B)))return;const M=new Map(B.map(x=>[String(x.id),x]));
    for(const x of C){const y=M.get(String(x.id));if(y===undefined)out.push(String(x.id));else ssvGone(x,y,out)}return}
  if(isObj(C)&&isObj(B)){const coll=ssvColl(C);for(const k of Object.keys(C)){if(k in B)ssvGone(C[k],B[k],out);else if(coll)out.push(k)}}}
function ssvTomb(curTxt,txt){let C=null,B;try{C=curTxt?JSON.parse(curTxt):null;B=JSON.parse(txt)}catch(e){return txt}
  if(!isObj(B)||!isObj(B.co))return txt;
  const T=Object.assign({},isObj(B.co.tomb)?B.co.tomb:{}),d=Math.floor(Date.now()/864e5);let ch=false;
  if(isObj(C)){const g=[];ssvGone(C,B,g);for(const id of g)if(!(id in T)){T[id]=d;ch=true}}
  for(const k in T)if(!(d-T[k]<=90)){delete T[k];ch=true}
  const K=Object.keys(T);if(K.length>5000){K.sort((a,b)=>T[a]-T[b]).slice(0,K.length-5000).forEach(k=>delete T[k]);ch=true}
  if(!ch)return txt;
  B.co.tomb=T;DB.co.tomb=Object.assign({},T);try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){}
  return JSON.stringify(B)}
// 3: put back into the cloud copy (r) what the last synced copy (b) and this device (l) have and nobody deleted (T)
function ssvRep(b,l,r,T){let n=0;
  if(Array.isArray(b)||Array.isArray(r)){if(!(ssvAll(b)&&ssvAll(l)&&ssvAll(r)))return 0;
    const R=new Map(r.map(x=>[String(x.id),x])),L=new Map(l.map(x=>[String(x.id),x]));let at=0;
    for(const x of b){const id=String(x.id),y=R.get(id);
      if(y){at=r.indexOf(y)+1;const z=L.get(id);if(z)n+=ssvRep(x,z,y,T);continue}
      if(!L.has(id)||id in T)continue;
      r.splice(at++,0,x);R.set(id,x);n++}
    return n}
  if(isObj(b)&&isObj(l)&&isObj(r)){const coll=ssvColl(b);
    for(const k of Object.keys(b)){if(!(k in l))continue;
      if(k in r)n+=ssvRep(b[k],l[k],r[k],T);else if(coll&&!(k in T)){r[k]=b[k];n++}}}
  return n}
{const f=merge3;merge3=function(b,l,r){
  if(SSV.mg||!SSV.sync||!isObj(b)||!isObj(l)||!isObj(r)||!isObj(l.co)||!isObj(l.projects))return f.apply(this,arguments);
  SSV.mg=1;try{const T=Object.assign({},isObj(r.co)&&isObj(r.co.tomb)?r.co.tomb:{},isObj(l.co.tomb)?l.co.tomb:{}),n=ssvRep(b,l,r,T);
    if(n){SSV.sync.fix=(SSV.sync.fix||0)+n;console.info('PENUM cloud: '+n+' record(s) missing from the cloud copy were put back')}
    return f.call(this,b,l,r)}finally{SSV.mg=0}}}

// 1: one sync at a time on this device; calls made meanwhile share one more sync right after it
function ssvGo(force){SSV.run=(async()=>{let x;
  for(let i=0;;i++){const anc=await IDB.get('__cloudbase').catch(()=>null),t=SSV.sync={n:SSV.n,force:!!force,ap:0};
    try{x=await SSV.f(force)}finally{SSV.sync=null}
    const ok=FS.state==='ok';
    if(t.lost){if(anc!=null)await IDB.put('__cloudbase',anc).catch(()=>{});setTimeout(()=>folderSync(true),2000)}
    else if(ok&&t.base!=null)await IDB.put('__cloudbase',t.base).catch(()=>{});
    if(ok&&(t.up||!t.w&&t.cur)&&!t.lost&&SSV.n===t.n)ssvMark(false);// sent, or the cloud already had exactly this
    if(!t.again)break;
    if(i>=(t.again==='busy'?14:6)){FS.msg+=' (ข้อมูลในเครื่องนี้ยังอยู่ครบ)';cloudBadge();break}
    FS.state='busy';FS.msg='';cloudBadge();
    await new Promise(r=>setTimeout(r,t.again==='busy'?Math.min(5000,800+600*i)+Math.random()*800:120+Math.random()*400));
    if(window.__coDrop||!ssvOn())break}
  return x})().finally(()=>{SSV.run=null});return SSV.run}
SSV.f=folderSync;
folderSync=function(force){if(!ssvOn())return SSV.f.apply(this,arguments);
  if(!SSV.run)return ssvGo(force);
  if(!SSV.q){const q=SSV.q={force:false};q.p=SSV.run.catch(()=>{}).then(()=>{SSV.q=null;return SSV.run||ssvGo(q.force)})}
  SSV.q.force=SSV.q.force||!!force;return SSV.q.p};
