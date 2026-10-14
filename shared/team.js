/* PENUM โครงการของบริษัท (company projects): every PENUM MEP / PENUM BIM project of one customer company in one list that all of
   its staff see, wherever each one works, with who saved it last and who has it open now, so two people do not overwrite each other.
   tools/build-pages.mjs puts this file in the <head> of every app whose app.json has "team": true (MEP, BIM; see docs/apps.md).
   - The company is the licence code (shared/licence.js, one code per customer company). The list lives in ORIEN's Supabase
     (tools/team-setup.sql, run once): a company key kept there encrypted with the code, and one row per project encrypted with
     that key, so only devices holding the company's code can find or read it; ORIEN cannot. A renewed code gets the same key.
   - Each project is shared by itself: the open project goes up a few seconds after a change; MEP also shares the other projects
     in its list once. Taking a project off the list (เอาออกจากรายการ) deletes nothing and stops it going up again.
   - Edit lock: the device that has a project open holds it (every 50 s; it lapses 150 s after the last word, or after 15 minutes
     without use). Another device opens it to look: its own changes stay on that device until the lock is free, and it can make
     its own copy or take over. A save is refused when the company's copy changed since this device's version (the server checks
     the version), so the device asks: use the newest (its own version kept as a copy) or send its own over it.
   - Who: the name typed in the list (localStorage 'penum.team', with this device's random id and the company keys, shared by MEP
     and BIM); without one, "ไม่ระบุชื่อ" and 4 letters of the device id.
   window.penumTeam: attach(cfg) · soon() after a change · tick() · render(el, {compact}) the list · state() · name() · setName(v)
   cfg (the app): app 'mep'|'bim' · cur() → null (nothing to share: a sample, read-only) or {id, name, client, code, sum, text()}
   · apply(text, meta) the company's newer version replaces the open one · has(id) · openLocal(id) · open(text, meta) → bool
   · copy(text, meta) a project of its own with a new id · keep(text) keep this device's version as a copy · sumTxt(sum) · locals() */
(()=>{if(window.penumTeam)return;
const SB={url:'https://uejnlxwjqsadbnzdncvb.supabase.co',key:'sb_publishable_0GTUfFnwBuWxjMw7yYULtQ_mhVVhcez'};
const K='penum.team',TTL=150e3,BEAT=50e3,IDLE=15*60e3,MAX=3e6,SOON=6e3;
const EN=()=>!/^th/i.test(document.documentElement.lang||'th');
const T={
  title:['โครงการของบริษัท','Company projects'],
  sub:['ทุกคนในบริษัทเดียวกันเห็นรายการนี้ เปิดต่อจากเพื่อนร่วมงานได้ และเห็นว่าใครกำลังแก้อยู่','Everyone in your company sees this list: carry on from a colleague and see who is editing what.'],
  you:['ผู้ใช้งาน','Signed in as'],chg:['เปลี่ยน','Change'],
  uT:['ผู้ใช้งาน','Who is using this computer'],uP:['ชื่อนี้แสดงให้เพื่อนร่วมงานเห็นในโครงการของบริษัท ว่าใครบันทึกและใครกำลังแก้','Colleagues see this name in your company projects: who saved and who is editing.'],
  uPick:['เลือกจากรายชื่อพนักงานใน PENUM PM ({0})','Pick from the staff list in PENUM PM ({0})'],uNone:['— ไม่เลือก —','— none —'],
  uType:['ชื่อของคุณ','Your name'],uType2:['หรือพิมพ์ชื่อ','Or type a name'],uPm:['PENUM PM ในเครื่องนี้ใช้งานในชื่อ {0}','PENUM PM on this computer is signed in as {0}'],
  uSet:['ใส่ชื่อผู้ใช้','Set your name'],uTip:['ผู้ใช้งาน','User'],youP:['ชื่อที่เพื่อนร่วมงานจะเห็น','The name your colleagues see'],save:['บันทึก','Save'],
  anon:['ไม่ระบุชื่อ ({0})','No name ({0})'],needName:['ใส่ชื่อของคุณ เพื่อนร่วมงานจะได้รู้ว่าใครแก้','Type your name so colleagues know who edited'],
  load:['กำลังโหลดรายการของบริษัท…','Loading your company list…'],
  nolic:['ใช้ได้เมื่อเครื่องนี้มีรหัสเปิดใช้งานของบริษัท (รหัสเดียวกับที่เพื่อนร่วมงานใช้) เมนู › สิทธิ์การใช้งาน','Works when this device has your company\'s activation code (the one your colleagues use): Menu › Licence.'],
  offline:['ต่ออินเทอร์เน็ตไม่ได้ จึงยังไม่เห็นรายการของบริษัท โครงการในเครื่องนี้ใช้ได้ตามปกติ','No internet connection, so the company list is not shown. Projects on this device work as usual.'],
  nosql:['ORIEN ยังไม่ได้เปิดระบบโครงการของบริษัท (tools/team-setup.sql) ติดต่อ ORIEN','ORIEN has not switched company projects on yet (tools/team-setup.sql). Contact ORIEN.'],
  bad:['โหลดรายการของบริษัทไม่สำเร็จ','The company list could not be loaded'],retry:['ลองอีกครั้ง','Try again'],
  none:['ยังไม่มีโครงการในรายการของบริษัท โครงการที่เปิดในเครื่องนี้จะขึ้นที่นี่เอง','No company projects yet. The projects you open here show up by themselves.'],
  q:['ค้นหาชื่อโครงการ ลูกค้า หรือคนแก้','Search project, client or person'],
  by:['บันทึกล่าสุดโดย {0}','Last saved by {0}'],editing:['{0} กำลังแก้อยู่','{0} is editing'],editMe:['คุณกำลังแก้อยู่','You are editing'],
  here:['มีในเครื่องนี้','On this device'],open:['เปิด','Open'],look:['เปิดดู','Look'],copy:['ทำสำเนาเป็นงานของฉัน','Make my own copy'],
  hide:['เอาออกจากรายการ','Take off the list'],show:['แสดงอีกครั้ง','Put back'],hidden:['ที่เอาออกจากรายการแล้ว ({0})','Taken off the list ({0})'],
  sharing:['กำลังแชร์โครงการในเครื่องนี้ให้บริษัท {0} รายการ…','Sharing {0} projects of this device with your company…'],
  now:['เมื่อสักครู่','just now'],min:['{0} นาทีที่แล้ว','{0} min ago'],today:['วันนี้ {0}','today {0}'],yday:['เมื่อวาน {0}','yesterday {0}'],
  lockT:['{0} กำลังแก้โครงการนี้อยู่','{0} is editing this project'],
  lockP:['{0} เปิดแก้ “{1}” อยู่ ถ้าแก้พร้อมกัน งานจะทับกัน เปิดดูได้ (การแก้ในเครื่องนี้ยังไม่ส่งเข้าบริษัท) ทำสำเนาเป็นงานของคุณ หรือรอให้ {0} ปิดก่อน','{0} has “{1}” open. Editing it together would overwrite each other. Look at it (changes made here are not sent to the company), make your own copy, or wait until {0} closes it.'],
  cancel:['ยกเลิก','Cancel'],close:['ปิด','Close'],
  bar:['{0} กำลังแก้โครงการนี้อยู่ · ที่นี่เปิดดูได้ การแก้ในเครื่องนี้จะยังไม่ส่งเข้าบริษัท','{0} is editing this project · you can look here; changes made here are not sent to the company'],
  take:['แก้แทน','Take over'],takeT:['แก้แทน {0}?','Take over from {0}?'],
  takeP:['{0} จะเห็นว่าคุณแก้ต่อ และงานที่ {0} ยังไม่ได้ส่ง จะไม่ทับงานของคุณ (เครื่องของ {0} จะถามก่อน) ใช้เมื่อ {0} ลืมปิดโครงการ หรือตกลงกันแล้ว','{0} sees that you carry on; whatever {0} has not sent yet will not overwrite yours ({0}\'s device asks first). Use it when {0} forgot to close the project, or you agreed.'],
  newT:['มีฉบับใหม่กว่าในบริษัท','A newer version is in the company list'],
  newP:['{0} บันทึก “{1}” ไว้ ({2}) หลังจากที่เครื่องนี้แก้ไขไปด้วย ถ้าส่งของคุณทับ งานของ {0} ในรายการของบริษัทจะถูกแทนที่','{0} saved “{1}” ({2}), after this device changed it too. Sending yours over it replaces {0}\'s work in the company list.'],
  useNew:['ใช้ฉบับของ {0} (ของฉันเก็บเป็นสำเนา)','Use {0}\'s version (keep mine as a copy)'],useMine:['ส่งของฉันทับ','Send mine over it'],later:['ไว้ทีหลัง','Later'],
  barNew:['มีฉบับใหม่กว่าในบริษัทจาก {0} · การแก้ในเครื่องนี้หยุดส่งไว้ก่อน','{0} saved a newer version in the company list · this device stopped sending for now'],pick:['เลือกฉบับ','Choose'],
  got:['อัปเดตเป็นฉบับล่าสุดที่ {0} บันทึกแล้ว','Updated to the latest version {0} saved'],
  big:['โครงการนี้ใหญ่เกินกว่าจะแชร์ให้บริษัท (เกิน 3 MB หลังบีบอัด) บันทึกลงเครื่องแล้วส่งไฟล์แทน','This project is too big to share with your company (over 3 MB compressed). Save it to a file and send that instead.'],
  full:['พื้นที่ของระบบโครงการของบริษัทเต็ม ติดต่อ ORIEN','Company projects storage is full. Contact ORIEN.'],
  hideT:['เอา “{0}” ออกจากรายการของบริษัท?','Take “{0}” off the company list?'],
  hideP:['ไม่มีอะไรถูกลบ เครื่องที่มีโครงการนี้อยู่ยังเก็บไว้ แต่จะไม่ส่งเข้ารายการอีก จนกว่าจะกด แสดงอีกครั้ง','Nothing is deleted: devices that have the project keep it, but stop sending it until someone presses Put back.'],
  fail:['เปิดจากรายการของบริษัทไม่สำเร็จ ลองอีกครั้ง','Could not open it from the company list. Try again.'],
  cnt:['{0} โครงการ','{0} projects'],co:['บริษัท {0}','{0}']};
const t=(k,...a)=>(T[k]?T[k][EN()?1:0]:k).replace(/\{(\d)\}/g,(m,i)=>a[i]);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const te=new TextEncoder(),td=new TextDecoder();
const sha=async s=>new Uint8Array(await crypto.subtle.digest('SHA-256',te.encode(s)));
const hex=u=>[...u].map(b=>b.toString(16).padStart(2,'0')).join('');
const b64u=u=>{let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const ub64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
async function gzip(u){return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer())}
async function unzip(u){return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer())}
const aes=async raw=>crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);
// "iv.ct": AES-GCM of the JSON (or text), gzipped first when asked and the browser can (the first byte says which)
async function enc(key,x,z){const raw=te.encode(typeof x==='string'?x:JSON.stringify(x));let body=raw,f=0;if(z&&window.CompressionStream){body=await gzip(raw);f=1}
  const pt=new Uint8Array(body.length+1);pt[0]=f;pt.set(body,1);const iv=crypto.getRandomValues(new Uint8Array(12));
  return b64u(iv)+'.'+b64u(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,pt)))}
async function dec(key,s,text){const [a,b]=String(s||'').split('.');const pt=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub64(a)},key,ub64(b))),body=pt.subarray(1);
  const x=td.decode(pt[0]===1?await unzip(body):body);return text?x:JSON.parse(x)}
// a quick fingerprint of a project's text: has it changed since it was last sent or fetched
function hs(s){let h=0x811c9dc5,g=0x9e3779b9;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h=Math.imul(h^c,16777619);g=Math.imul(g^c,2246822507)}return (h>>>0).toString(36)+(g>>>0).toString(36)+s.length.toString(36)}
async function rpc(fn,body,keep){let r;try{r=await fetch(SB.url+'/rest/v1/rpc/'+fn,{method:'POST',cache:'no-store',keepalive:!!keep,headers:{apikey:SB.key,'Content-Type':'application/json'},body:JSON.stringify(body)})}catch(e){return {err:'offline'}}
  if(r.ok){try{const x=await r.text();return {j:x?JSON.parse(x):null}}catch(e){return {err:'bad'}}}
  let s='';try{s=await r.text()}catch(e){}if(r.status===404||/PGRST202|does not exist|Could not find the function/i.test(s))return {err:'nosql'};
  return {err:/\bfull\b/.test(s)?'full':r.status===413||/too long|too large/i.test(s)?'big':r.status>=500?'offline':'bad'}}

// this device: its random id, the name its user typed, the company keys it knows and what it last sent or fetched of each project
function ld(){try{const o=JSON.parse(localStorage.getItem(K)||'{}');return o&&typeof o==='object'?o:{}}catch(e){return {}}}
function sv(o){try{localStorage.setItem(K,JSON.stringify(o))}catch(e){}}
let DEV='';function dev(){if(DEV)return DEV;const o=ld();if(!/^[0-9a-f]{24}$/.test(o.dev||'')){o.dev=hex(crypto.getRandomValues(new Uint8Array(12)));sv(o)}return DEV=o.dev}
// PENUM PM in this browser (read only): the company whose licence matches this one (else PM's open company), its staff, and who
// is signed in there (PIN sign-in, else the user picked in PM's header), so MEP and BIM show the same person without asking
const b64j=s=>{try{return JSON.parse(td.decode(ub64(s)))}catch(e){return null}};
function licCid(code){const m=/^PNM1\.([A-Za-z0-9_-]+)\./.exec(String(code||'').replace(/\s+/g,''));const p=m&&b64j(m[1]);return p?String(p.id||'').replace(/-R\d+$/,'')||String(p.co||''):''}
let PMC=null,PMT=0;          // PM's data can be large: read again only after a minute or when another window changed it
function pm(){if(PMT&&Date.now()-PMT<60000)return PMC;PMT=Date.now();return PMC=pm0()}
function pm0(){const s=lic(),cid=s&&(s.cid||s.co)||'';let cur='';try{const l=localStorage.getItem('penum.pm.slot')||'';cur=l?'.c'+l:''}catch(e){}let best=null;
  try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i),m=/^penum\.pm\.v1((?:\.c\d+)?)$/.exec(k||'');if(!m)continue;let D=null;try{D=JSON.parse(localStorage.getItem(k)||'null')}catch(e){}
    const c=D&&D.co;if(!c||!Array.isArray(c.staff))continue;if(cid&&c.lic&&licCid(c.lic)!==cid)continue;/* another company's PM */const sc=(cid&&licCid(c.lic)===cid?2:0)+(m[1]===cur?1:0);if(!best||sc>best.sc)best={sc,sfx:m[1],c}}}catch(e){}
  if(!best)return null;const staff=best.c.staff.filter(x=>x&&x.active!==false&&String(x.name||'').trim()).map(x=>({id:x.id,name:String(x.name).trim(),role:x.role||''}));
  let id='';try{const a=JSON.parse(localStorage.getItem('penum.pm.auth'+best.sfx)||'null');if(best.c.pinOn&&a&&a.id)id=a.id}catch(e){}
  if(!id)try{id=(JSON.parse(localStorage.getItem('penum.pm.ui'+best.sfx)||'{}')||{}).me||''}catch(e){}
  const me=staff.find(x=>x.id===id);return {co:String(best.c.name||''),staff,me:me?me.name:''}}
const own=()=>String(ld().name||'').trim().slice(0,60);
const name=()=>own()||((pm()||{}).me||'').slice(0,60);
function setName(v,sid){const o=ld();o.name=String(v||'').trim().slice(0,60);o.sid=sid||'';o.asked=1;sv(o);ST.lw='';chips();VIEWS.forEach(paint);if(CFG)soon()}
const shown=()=>name()||t('anon',dev().slice(0,4).toUpperCase());
const recK=p=>CFG.app+':'+p;
function rec(p){return (ld().s||{})[recK(p)]||null}
function recSet(p,r){const o=ld();o.s=o.s||{};if(r)o.s[recK(p)]=Object.assign({},r,{u:Date.now()});else delete o.s[recK(p)];
  const ks=Object.keys(o.s);if(ks.length>400)ks.sort((a,b)=>(o.s[a].u||0)-(o.s[b].u||0)).slice(0,ks.length-400).forEach(k=>delete o.s[k]);sv(o)}

// the company: from the licence code in use; its key is kept in Supabase encrypted with the code
let TM=null,TMC='';
function lic(){try{return window.penumLic&&penumLic.state()||null}catch(e){return null}}
async function team(){const s=lic();if(!s||!s.code||s.st==='none'||s.st==='ro'||s.st==='wait')return {err:'nolic'};
  if(TM&&TMC===s.code)return TM;
  try{const c=s.code,cust=String(s.cid||s.co||''),k=hex((await sha('penum-team-c:'+c)).slice(0,16)),ck=await aes(await sha('penum-team-ck:'+c));
    let r=await rpc('penum_team_key_get',{p_k:k});if(r.err)return r;let sec='';
    if(r.j){try{sec=await dec(ck,r.j,1)}catch(e){}}
    if(!sec){const known=(ld().co||{})[cust]||'';          // a renewed code: the company's key this device already knew
      r=await rpc('penum_team_key_add',{p_k:k,p_e:await enc(ck,known||hex(crypto.getRandomValues(new Uint8Array(16))))});if(r.err)return r;
      try{sec=await dec(ck,r.j,1)}catch(e){return {err:'bad'}}}
    const o=ld();o.co=o.co||{};o.co[cust]=sec;sv(o);
    ST.lw='';TM={t:hex((await sha('penum-team:'+sec)).slice(0,16)),key:await aes(await sha('penum-team-key:'+sec)),co:s.co||''};TMC=c;return TM}
  catch(e){return {err:'bad'}}}
const pk=async id=>hex((await sha('penum-team-p:'+CFG.app+':'+id)).slice(0,16));
async function who(T,lw){if(!lw)return '';try{return String((await dec(T.key,lw)).n||'')}catch(e){return ''}}
async function lockWho(T){if(!ST.lw||ST.lwN!==shown()){ST.lwN=shown();ST.lw=await enc(T.key,{n:ST.lwN})}return ST.lw}
function metaOf(c){return {id:c.id,name:c.name||'',client:c.client||'',code:c.code||'',sum:c.sum||null,by:shown(),dev:dev(),at:Date.now()}}
async function put(T,p,c,txt,base){const d=await enc(T.key,txt,1);if(d.length>MAX)return {err:'big'};
  const r=await rpc('penum_team_put',{p_t:T.t,p_p:p,p_a:CFG.app,p_m:await enc(T.key,metaOf(c)),p_d:d,p_base:base||null,p_dev:dev()});return r.err?r:(r.j||{})}
async function get(T,p){const r=await rpc('penum_team_get',{p_t:T.t,p_p:p});if(r.err||!r.j)return null;
  try{return {d:await dec(T.key,r.j.d,1),at:String(r.j.at||''),m:await dec(T.key,r.j.m)}}catch(e){return null}}

// the open project, every 50 s and a few seconds after a change: hold it, send it, or take the company's newer version
let CFG=null;const ST={st:'',p:'',id:'',held:'',other:null,conf:null,asked:{},busy:0,act:Date.now(),err:'',lw:'',lwN:'',shared:0,pend:0,hideBar:''};
let soonT=0;function soon(){ST.act=Date.now();clearTimeout(soonT);soonT=setTimeout(tick,SOON)}
async function tick(){if(!CFG)return;if(ST.busy){ST.pend=1;return}ST.busy=1;try{await tick0()}catch(e){}finally{ST.busy=0;bar();if(ST.pend){ST.pend=0;soon()}}}
async function release(keep){const p=ST.held;ST.held='';if(!p||!TM)return;await rpc('penum_team_unlock',{p_t:TM.t,p_p:p,p_dev:dev()},keep)}
async function tick0(){
  const c=CFG.cur();if(!c||!c.id){await release();Object.assign(ST,{p:'',id:'',other:null,conf:null,err:''});return}
  const T=await team();if(T.err){ST.st=T.err;return}ST.st='ok';
  if(!ST.nameAsk&&!name()&&!ld().asked&&!document.querySelector('dialog[open]')){ST.nameAsk=1;setTimeout(userBox,0)}
  const p=await pk(c.id);if(ST.p!==p){if(ST.held&&ST.held!==p)await release();ST.p=p;ST.id=c.id;ST.other=null;ST.conf=null;ST.err=''}
  if(Date.now()-ST.act>IDLE&&document.visibilityState!=='visible'){await release();return}          // not used for a while: others may take it
  const txt=c.text(),h=hs(txt),R=rec(p);
  const r=await rpc('penum_team_lock',{p_t:T.t,p_p:p,p_dev:dev(),p_lw:await lockWho(T),p_force:false});if(r.err){ST.st=r.err;return}const L=r.j||{};
  if(L.off){ST.held='';ST.other=null;ST.conf=null;return}
  if(L.none){const w=await put(T,p,c,txt,null);if(w.at){recSet(p,{b:w.at,h});ST.held=p;ST.err='';await rpc('penum_team_lock',{p_t:T.t,p_p:p,p_dev:dev(),p_lw:await lockWho(T),p_force:false})}else ST.err=w.err||'';return}
  if(!L.ok){ST.held='';ST.other={n:await who(T,L.lw),at:L.lat};
    if(R&&L.at!==R.b&&R.h===h&&!ST.conf)await pull(T,p,txt);          // nothing changed here: show the newest
    return}
  ST.held=p;ST.other=null;
  if(R&&L.at===R.b){ST.conf=null;if(R.h!==h){const w=await put(T,p,c,txt,R.b);if(w.at){recSet(p,{b:w.at,h});ST.err=''}else if(w.stale)soon();else ST.err=w.err||''}return}
  if(R&&R.h===h){await pull(T,p,txt);return}
  // changed here and in the company list (or never matched here): the same content needs nothing, otherwise ask once per version
  const g=await get(T,p);if(!g)return;if(hs(g.d)===h){recSet(p,{b:g.at,h});ST.conf=null;return}
  ST.conf={p,at:g.at,d:g.d,m:g.m||{},mine:txt};if(ST.asked[p]!==g.at){ST.asked[p]=g.at;ask()}}
async function pull(T,p){const g=await get(T,p);if(!g)return;await CFG.apply(g.d,g.m||{});const c=CFG.cur();recSet(p,{b:g.at,h:hs(c?c.text():g.d)});ST.conf=null;
  note(t('got',(g.m||{}).by||''))}
async function ask(){const C=ST.conf;if(!C)return;const by=C.m.by||'?';
  const k=await dlg(t('newT'),`<p>${esc(t('newP',by,C.m.name||'',when(C.at)))}</p>`,[['new',t('useNew',by),1],['mine',t('useMine')],['',t('later')]]);
  if(ST.conf!==C)return;
  if(k==='new'){try{if(CFG.keep)await CFG.keep(C.mine)}catch(e){}await CFG.apply(C.d,C.m);const c=CFG.cur();recSet(C.p,{b:C.at,h:hs(c?c.text():C.d)});ST.conf=null;note(t('got',by))}
  else if(k==='mine'){const T=await team(),c=CFG.cur();if(!T.err&&c){const txt=c.text(),w=await put(T,C.p,c,txt,C.at);if(w.at){recSet(C.p,{b:w.at,h:hs(txt)});ST.conf=null}else soon()}}
  bar()}

// the strip at the bottom while the open project is held by someone else, or waits for a choice
function bar(){let e=document.getElementById('ptmBar');const o=ST.other,C=ST.conf,big=ST.err==='big'||ST.err==='full';
  const key=o?'o'+o.n:C?'c'+C.at:big?ST.err:'';if(!key||ST.hideBar===key){if(e)e.hidden=true;return}
  if(!e){e=document.createElement('div');e.id='ptmBar';e.className='ptm-bar';e.setAttribute('role','status');document.body.appendChild(e)}
  e.innerHTML=o?`<span>🔒 ${esc(t('bar',o.n||'?'))}</span><button type="button" data-ptmb="copy">${esc(t('copy'))}</button><button type="button" data-ptmb="take">${esc(t('take'))}</button><button type="button" class="x" data-ptmb="x" aria-label="${esc(t('close'))}">×</button>`
    :C?`<span>${esc(t('barNew',C.m.by||'?'))}</span><button type="button" data-ptmb="pick">${esc(t('pick'))}</button><button type="button" class="x" data-ptmb="x" aria-label="${esc(t('close'))}">×</button>`
    :`<span>${esc(t(ST.err))}</span><button type="button" class="x" data-ptmb="x" aria-label="${esc(t('close'))}">×</button>`;
  e.dataset.k=key;e.hidden=false}
document.addEventListener('click',async ev=>{const b=ev.target.closest&&ev.target.closest('[data-ptmb]');if(!b)return;const k=b.dataset.ptmb;
  if(k==='x'){ST.hideBar=(document.getElementById('ptmBar')||{dataset:{}}).dataset.k||'';bar();return}
  if(k==='pick'){ask();return}
  if(k==='copy'){const c=CFG.cur();if(c)await CFG.copy(c.text(),{name:c.name});soon();return}
  if(k==='take'){const o=ST.other;if(!o)return;if(await dlg(t('takeT',o.n||'?'),`<p>${esc(t('takeP',o.n||'?'))}</p>`,[['go',t('take'),1],['',t('cancel')]])!=='go')return;
    const T=await team();if(T.err)return;const r=await rpc('penum_team_lock',{p_t:T.t,p_p:ST.p,p_dev:dev(),p_lw:await lockWho(T),p_force:true});if(!r.err){ST.other=null;ST.held=ST.p}tick()}});

// the company list: in MEP's projects page and start page, and BIM's start page and menu
const VIEWS=new Set();
async function list(){const T=await team();if(T.err)return T;const r=await rpc('penum_team_list',{p_t:T.t,p_a:CFG.app});if(r.err)return r;
  const rows=(await Promise.all((r.j||[]).map(async x=>{let m;try{m=await dec(T.key,x.m)}catch(e){return null}
    return {p:x.p,m,at:x.at,off:!!x.off,lk:x.ld?{me:x.ld===dev(),n:await who(T,x.lw),at:x.lat}:null}}))).filter(Boolean);
  return {rows:rows.filter(x=>!x.m.k),co:T.co}}          // rows marked k are not projects (k:'prices' the price library, shared/prices.js)
function when(s){const d=new Date(s);if(isNaN(d))return '–';const ms=Date.now()-d,L=EN()?'en-GB':'th-TH',hm=d.toLocaleTimeString(L,{hour:'2-digit',minute:'2-digit'});
  if(ms<90e3)return t('now');if(ms<3600e3)return t('min',Math.round(ms/6e4));const a=new Date();a.setHours(0,0,0,0);if(d>=a)return t('today',hm);if(d>=a-864e5)return t('yday',hm);
  return d.toLocaleDateString(L,{day:'numeric',month:'short',year:'2-digit'})+' '+hm}
async function render(el,opt){if(!el||!CFG)return;opt=opt||{};VIEWS.add(el);el.classList.add('ptm');el._ptm=opt;
  if(!el._ptmOn){el._ptmOn=1;el.addEventListener('click',ev=>click(el,ev));el.addEventListener('input',ev=>{if(ev.target.dataset.ptmq!=null){el._q=ev.target.value;el._qf=1;paint(el)}});
}
  if(!el._d)el.innerHTML=`<p class="ptm-h">${esc(t('load'))}</p>`;
  const r=await list();el._d=r;paint(el);if(!r.err)share(r.rows)}
function paint(el){const r=el._d,opt=el._ptm||{};if(!r)return;
  const head=`<div class="ptm-me"><span>${esc(t('you'))}: <b>${esc(shown())}</b></span><button type="button" class="btn sm" data-ptm="name">${esc(t('chg'))}</button>${name()?'':`<small class="ptm-warn">${esc(t('needName'))}</small>`}</div>`;
  if(r.err){el.innerHTML=(opt.compact?'':head)+`<p class="ptm-note">${esc(t(r.err==='nolic'||r.err==='offline'||r.err==='nosql'?r.err:'bad'))}</p>${r.err==='nolic'?'':`<button type="button" class="btn sm" data-ptm="retry">${esc(t('retry'))}</button>`}`;return}
  const q=String(el._q||'').trim().toLowerCase().split(/\s+/).filter(Boolean),live=r.rows.filter(x=>!x.off),off=r.rows.filter(x=>x.off);
  let L=live.filter(x=>{const s=[x.m.name,x.m.client,x.m.code,x.m.by,x.lk&&x.lk.n].join(' ').toLowerCase();return q.every(w=>s.includes(w))});
  L.sort((a,b)=>(b.lk&&!b.lk.me?1:0)-(a.lk&&!a.lk.me?1:0)||String(b.at).localeCompare(String(a.at)));if(opt.compact)L=L.slice(0,opt.max||6);
  const row=x=>{const m=x.m,here=CFG.has(m.id),lk=x.lk,s=CFG.sumTxt?CFG.sumTxt(m.sum||{}):'';
    return `<div class="ptm-r${lk&&!lk.me?' lk':''}"><div class="ptm-rn"><b>${esc(m.name||'–')}</b>${lk?`<span class="ptm-pill ${lk.me?'me':'on'}">● ${esc(lk.me?t('editMe'):t('editing',lk.n||'?'))}</span>`:''}${here?`<span class="ptm-pill">${esc(t('here'))}</span>`:''}</div>
      <small>${esc([m.client,m.code].filter(Boolean).join(' · '))}${m.client||m.code?' · ':''}${esc(t('by',m.by||'?'))} · ${esc(when(x.at))}${s?' · '+esc(s):''}</small>
      <div class="ptm-ra"><button type="button" class="btn sm primary" data-ptm="open" data-p="${x.p}">${esc(lk&&!lk.me?t('look'):t('open'))}</button>${opt.compact?'':`<button type="button" class="btn sm" data-ptm="copy" data-p="${x.p}">${esc(t('copy'))}</button><button type="button" class="btn sm ghost" data-ptm="hide" data-p="${x.p}">${esc(t('hide'))}</button>`}</div></div>`};
  el.innerHTML=(opt.compact?'':head)+(opt.compact||live.length<6?'':`<input type="search" class="ptm-q" data-ptmq placeholder="${esc(t('q'))}" value="${esc(el._q||'')}">`)
    +(ST.shared?`<p class="ptm-h">${esc(t('sharing',ST.shared))}</p>`:'')
    +(L.length?`<div class="ptm-l">${L.map(row).join('')}</div>`:`<p class="ptm-h">${esc(live.length?'–':t('none'))}</p>`)
    +(!opt.compact&&off.length?`<details class="ptm-off"><summary>${esc(t('hidden',off.length))}</summary>${off.map(x=>`<div class="ptm-r"><div class="ptm-rn"><b>${esc(x.m.name||'–')}</b></div><div class="ptm-ra"><button type="button" class="btn sm" data-ptm="show" data-p="${x.p}">${esc(t('show'))}</button></div></div>`).join('')}</details>`:'');
  const i=el.querySelector('[data-ptmq]');if(i&&el._qf){i.focus();i.setSelectionRange(i.value.length,i.value.length)}el._qf=0;
  if(opt.count){const n=document.getElementById(opt.count);if(n)n.textContent=t('cnt',live.length)}}
function refresh(){for(const el of [...VIEWS]){if(!el.isConnected){VIEWS.delete(el);continue}render(el,el._ptm)}}
async function click(el,ev){const b=ev.target.closest('[data-ptm]');if(!b)return;const k=b.dataset.ptm,x=((el._d||{}).rows||[]).find(r=>r.p===b.dataset.p);
  if(k==='retry'){TM=null;el._d=null;render(el,el._ptm);return}
  if(k==='name'){userBox();return}
  if(!x)return;const T=await team();if(T.err)return;
  if(k==='hide'){if(await dlg(t('hideT',x.m.name||''),`<p>${esc(t('hideP'))}</p>`,[['go',t('hide'),1],['',t('cancel')]])!=='go')return;
    await rpc('penum_team_off',{p_t:T.t,p_p:x.p,p_off:true});if(x.p===ST.p){ST.held='';ST.other=null}refresh();return}
  if(k==='show'){await rpc('penum_team_off',{p_t:T.t,p_p:x.p,p_off:false});refresh();soon();return}
  if(k==='copy'){const g=await get(T,x.p);if(!g){note(t('fail'));return}await CFG.copy(g.d,x.m);soon();refresh();return}
  if(k==='open'){if(x.lk&&!x.lk.me){const a=await dlg(t('lockT',x.lk.n||'?'),`<p>${esc(t('lockP',x.lk.n||'?',x.m.name||''))}</p>`,[['look',t('look'),1],['copy',t('copy')],['',t('cancel')]]);
      if(!a)return;if(a==='copy'){const g=await get(T,x.p);if(!g){note(t('fail'));return}await CFG.copy(g.d,x.m);soon();refresh();return}}
    if(opt0(el).close)opt0(el).close();
    if(CFG.has(x.m.id)){await CFG.openLocal(x.m.id);soon();return}
    const g=await get(T,x.p);if(!g){note(t('fail'));return}
    if(await CFG.open(g.d,x.m)){const c=CFG.cur();recSet(x.p,{b:g.at,h:hs(c?c.text():g.d)});ST.act=Date.now();tick()}}}
const opt0=el=>el._ptm||{};
// MEP: the other projects in this device's list go up once (each project goes up only when the company list does not have it yet)
let SHARED=0;
async function share(rows){if(SHARED||!CFG.locals)return;SHARED=1;const T=await team();if(T.err){SHARED=0;return}
  const have=new Set(rows.map(r=>r.p));let L=[];try{L=await CFG.locals()}catch(e){}const todo=[];
  for(const c of L){const p=await pk(c.id),R=rec(p);if(!have.has(p)&&!(R&&R.off))todo.push([p,c])}if(!todo.length)return;
  ST.shared=todo.length;VIEWS.forEach(paint);
  for(const [p,c] of todo){let txt='';try{txt=await c.text()}catch(e){}if(!txt)continue;const w=await put(T,p,c,txt,null);if(w.at)recSet(p,{b:w.at,h:hs(txt)});if(w.err==='offline'||w.err==='nosql'||w.err==='full')break}
  ST.shared=0;refresh()}

// small question boxes and a note, styled here so they look the same in MEP and BIM
function dlg(title,html,btns){return new Promise(res=>{const d=document.createElement('dialog');d.className='ptm-dlg';
  d.innerHTML=`<h3>${esc(title)}</h3><div class="ptm-db">${html}</div><div class="ptm-df">${btns.map(([k,l,p])=>`<button type="button" class="ptm-b${p?' pri':''}" value="${esc(k)}">${esc(l)}</button>`).join('')}</div>`;
  d.addEventListener('click',e=>{const b=e.target.closest('button[value]');if(b)d.close(b.value)});d.addEventListener('close',()=>{const v=d.returnValue||'';dlg.v={};d.querySelectorAll('[name]').forEach(x=>{dlg.v[x.name]=x.value});d.remove();res(v)});
  document.body.appendChild(d);d.showModal()})}
// ผู้ใช้งาน: a button in the app's header with the name colleagues see (like PENUM PM's user box); it opens a box to pick a name from
// PENUM PM's staff list (when PM is used in this browser) or to type one. Asked once by itself when the company list first works.
async function userBox(){PMT=0;const P=pm(),cur=own()||name(),sid=ld().sid||'',L=P?P.staff:[],pick=L.find(x=>x.id===sid||x.name===cur);
  const body=`<p style="margin:0 0 10px">${esc(t('uP'))}</p>${L.length?`<label class="ptm-f"><span>${esc(t('uPick',P.co||'PENUM PM'))}</span><select name="sid"><option value="">${esc(t('uNone'))}</option>${L.map(x=>`<option value="${esc(x.id)}"${pick&&pick.id===x.id?' selected':''}>${esc(x.name)}${x.role?' · '+esc(x.role):''}</option>`).join('')}</select></label>`:''}
    <label class="ptm-f"><span>${esc(t(L.length?'uType2':'uType'))}</span><input name="nm" type="text" maxlength="60" value="${esc(pick?'':cur)}" placeholder="${esc(t('youP'))}"></label>${P&&P.me?`<p class="ptm-h" style="margin:8px 0 0">${esc(t('uPm',P.me))}</p>`:''}`;
  const k=await dlg(t('uT'),body,[['ok',t('save'),1],['',t('cancel')]]);if(k!=='ok'){const o=ld();o.asked=1;sv(o);return}/* asked once only, whatever the answer */const v=dlg.v||{},x=v.sid&&L.find(y=>y.id===v.sid),typed=String(v.nm||'').trim();
  const nm=typed||(x?x.name:'');if(nm)setName(nm,!typed&&x?x.id:'');else{const o=ld();o.asked=1;sv(o)}}
const CHIPS=[];
function chip(cls){const b=document.createElement('button');b.type='button';b.className=(cls||'')+' ptm-chip';b.dataset.noxl='';b.addEventListener('click',userBox);CHIPS.push(b);chips();return b}
function chips(){const nm=name();for(const b of CHIPS){b.classList.toggle('none',!nm);b.innerHTML=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg><span>${esc(nm||t('uSet'))}</span>`;
  b.title=t('uTip')+(nm?': '+nm:'');b.setAttribute('aria-label',b.title)}}
function note(msg){let e=document.getElementById('ptmNote');if(!e){e=document.createElement('div');e.id='ptmNote';e.className='ptm-toast';e.setAttribute('role','status');document.body.appendChild(e)}
  e.textContent=msg;e.classList.add('on');clearTimeout(note.t);note.t=setTimeout(()=>e.classList.remove('on'),4500)}

const CSS=`.ptm-me{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px;font-size:14px}
.ptm-f{display:flex;flex-direction:column;gap:3px;font-size:13.5px;margin:0 0 10px}.ptm-f select,.ptm-f input{font:inherit;font-size:15px;padding:8px 10px;border-radius:10px;border:1px solid #CBD5E1;background:#fff;color:#0F1E2E}
.ptm-chip{display:inline-flex;align-items:center;gap:6px;max-width:200px}.ptm-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@media(max-width:640px){.ptm-chip span{display:none}}.ptm-chip.none{color:#B45309!important;border-color:#F6D9A8!important;background:#FFF7EA!important}.ptm-me label{display:flex;flex-direction:column;gap:2px;font-size:13px;flex:1 1 200px;max-width:320px}
.ptm-me input,.ptm-q{font:inherit;font-size:14px;padding:7px 10px;border-radius:10px;border:1px solid rgba(127,140,160,.45);background:transparent;color:inherit;min-width:0}
.ptm-q{width:100%;box-sizing:border-box;margin:0 0 10px}.ptm-warn{color:#B45309;font-size:12.5px;flex-basis:100%}
.ptm-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
.ptm-r{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:14px;border:1px solid rgba(127,140,160,.3);background:rgba(127,140,160,.06);min-width:0}
.ptm-r.lk{border-color:rgba(245,158,11,.6);background:rgba(245,158,11,.08)}.ptm-r small{opacity:.8;font-size:12.5px;line-height:1.45}
.ptm-rn{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.ptm-rn b{overflow-wrap:anywhere}
.ptm-pill{font-size:11.5px;font-weight:600;padding:1px 8px;border-radius:999px;background:rgba(127,140,160,.16);white-space:nowrap}
.ptm-pill.on{background:rgba(245,158,11,.18);color:#B45309}.ptm-pill.me{background:rgba(16,185,129,.16);color:#047857}
.ptm-ra{display:flex;flex-wrap:wrap;gap:6px}.ptm-h{opacity:.8;font-size:13.5px;margin:4px 0}
.ptm-note{margin:0 0 8px;padding:9px 12px;border-radius:12px;background:#FFF7EA;border:1px solid #F6D9A8;color:#7A4A0B;font-size:14px}
.ptm-off{margin-top:10px;font-size:13.5px}.ptm-off summary{cursor:pointer;opacity:.85}.ptm-off .ptm-r{margin-top:6px;flex-direction:row;justify-content:space-between;align-items:center}
.ptm-bar{position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147482000;max-width:min(480px,calc(100% - 24px));display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;
  padding:9px 12px;border-radius:14px;background:#FFF7EA;border:1px solid #F6D9A8;border-left:4px solid #F59E0B;color:#7A4A0B;font:14px/1.45 system-ui,'Noto Sans Thai',sans-serif;box-shadow:0 12px 30px -12px rgba(0,0,0,.35)}
.ptm-bar span{flex:1 1 100%}.ptm-bar button{font:inherit;font-size:13px;padding:4px 10px;border-radius:10px;border:1px solid #E2C48F;background:#fff;color:#7A4A0B;cursor:pointer}
.ptm-bar button.x{border:none;background:none;font-size:18px;padding:0 4px}
.ptm-dlg{border:none;border-radius:18px;padding:0;width:min(480px,calc(100% - 24px));color:#0F1E2E;background:#fff;box-shadow:0 30px 80px -20px rgba(8,20,40,.45);font:15px/1.55 system-ui,'Noto Sans Thai',sans-serif}
.ptm-dlg::backdrop{background:rgba(8,20,40,.35)}.ptm-dlg h3{margin:0;padding:16px 18px 10px;font-size:17px;border-bottom:1px solid #E2E8F1}
.ptm-db{padding:12px 18px}.ptm-db p{margin:0}.ptm-df{display:flex;flex-wrap:wrap;gap:8px;padding:10px 18px 16px}
.ptm-b{font:inherit;font-size:14px;padding:8px 14px;border-radius:12px;border:1px solid #E2E8F1;background:#fff;color:#0F1E2E;cursor:pointer}.ptm-b.pri{background:#0B6E7A;border-color:#0B6E7A;color:#fff}
.ptm-toast{position:fixed;left:50%;bottom:calc(70px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483001;max-width:calc(100% - 24px);background:#0F1E2E;color:#fff;padding:9px 18px;border-radius:999px;font:14px/1.45 system-ui,'Noto Sans Thai',sans-serif;opacity:0;transition:opacity .2s;pointer-events:none;text-align:center}
.ptm-toast.on{opacity:1}`;
function attach(cfg){if(CFG)return;CFG=cfg;
  const s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);
  setInterval(tick,BEAT);setTimeout(tick,2500);
  const act=()=>{ST.act=Date.now()};['pointerdown','keydown'].forEach(k=>addEventListener(k,act,{passive:true,capture:true}));
  addEventListener('focus',()=>{act();tick()});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){act();tick()}});
  addEventListener('pagehide',()=>{release(true)})}
new MutationObserver(chips).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});          // the app switched language
addEventListener('storage',e=>{if(e.key===K||/^penum\.pm\.(ui|auth|v1|slot)/.test(e.key||'')){PMT=0;ST.lw='';chips()}});          // a name picked in another window, or PENUM PM signing someone in
window.penumTeam={attach,soon,tick,render,refresh,state:()=>ST,name,setName,shown,chip,userBox};
})();
