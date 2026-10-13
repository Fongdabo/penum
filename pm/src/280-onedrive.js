/* ---------- shared data on OneDrive, Microsoft sign-in ----------
   One JSON file in the owner's OneDrive folder "PENUM-PM", shared with staff by e-mail invitation.
   Every device keeps its own copy (works offline) and merges with the file: record by record, by id,
   so two people editing different rows never lose each other's work. Photos sit next to it in photos/,
   and a dated copy goes to backup/ once a day (last 30 kept). */
const CKEY='penum.pm.cloud'+DSFX,AUTH='https://login.microsoftonline.com/common/oauth2/v2.0',GR='https://graph.microsoft.com/v1.0',
  SCOPE='offline_access User.Read Files.ReadWrite.All',FOLDER='PENUM-PM',FNAME='penum-pm.json';
let CL={};try{CL=JSON.parse(localStorage.getItem(CKEY)||'{}')}catch(e){}
const clSave=()=>{try{localStorage.setItem(CKEY,JSON.stringify(CL))}catch(e){}};
const CS={state:'',msg:'',busy:false,dirty:false};// sync status for the band button
const cloudOn=()=>!!(CL.tok&&CL.file);
const redirectUri=()=>location.origin+location.pathname.replace(/index\.html$/,'');
const b64u=buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const myMail=()=>((CL.user||{}).mail||'').toLowerCase();

/* sign-in: OAuth code flow with PKCE, no library */
async function msLogin(){if(!CL.clientId){toast('ใส่ Application (client) ID ก่อน');return}
  if(!SUITE){toast('ล็อกอินได้เฉพาะในแอปที่ติดตั้งจาก fongdabo.github.io');return}
  const v=b64u(crypto.getRandomValues(new Uint8Array(32))),st=b64u(crypto.getRandomValues(new Uint8Array(12)));
  const ch=b64u(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));
  CL.pkce={v,st};clSave();save(true);
  location.href=AUTH+'/authorize?'+new URLSearchParams({client_id:CL.clientId,response_type:'code',redirect_uri:redirectUri(),scope:SCOPE,code_challenge:ch,code_challenge_method:'S256',state:st,prompt:'select_account'})}
async function tokenReq(body){const r=await fetch(AUTH+'/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:CL.clientId,scope:SCOPE,...body})});
  const j=await r.json().catch(()=>({}));if(!r.ok||!j.access_token)throw new Error(j.error_description||j.error||'ล็อกอินไม่สำเร็จ');
  CL.tok={at:j.access_token,exp:Date.now()+(n(j.expires_in)||3600)*1000,rt:j.refresh_token||(CL.tok||{}).rt};clSave()}
async function msRedirect(){const q=new URLSearchParams(location.search);
  if(q.get('cid')){CL.clientId=q.get('cid').trim();clSave()}
  if(!q.get('code')&&!q.get('error')){if(q.get('cid'))history.replaceState(null,'',redirectUri());return false}
  history.replaceState(null,'',redirectUri());
  if(q.get('error')){toast('ล็อกอินไม่สำเร็จ: '+(q.get('error_description')||q.get('error')).slice(0,120));return false}
  const pk=CL.pkce||{};delete CL.pkce;if(pk.st!==q.get('state')){toast('ล็อกอินไม่สำเร็จ ลองใหม่อีกครั้ง');return false}
  try{await tokenReq({grant_type:'authorization_code',code:q.get('code'),redirect_uri:redirectUri(),code_verifier:pk.v});
    const u=await (await gfetch('/me?$select=displayName,mail,userPrincipalName')).json();CL.user={name:u.displayName||'',mail:(u.mail||u.userPrincipalName||'').toLowerCase()};clSave();
    toast(`ล็อกอินแล้ว: ${CL.user.name||CL.user.mail}`);return true}catch(e){toast(e.message);return false}}
async function accessToken(){const t=CL.tok;if(!t)return null;if(t.at&&t.exp>Date.now()+60000)return t.at;if(!t.rt)return null;
  try{await tokenReq({grant_type:'refresh_token',refresh_token:t.rt});return CL.tok.at}catch(e){CL.tok=null;clSave();return null}}
async function gfetch(path,opt={}){const t=await accessToken();if(!t){CS.state='login';cloudBadge();throw new Error('ต้องล็อกอิน Microsoft อีกครั้ง')}
  return fetch(path.startsWith('http')?path:GR+path,{...opt,headers:{Authorization:'Bearer '+t,...(opt.headers||{})}})}
async function gjson(path,opt){const r=await gfetch(path,opt);const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.error&&j.error.message)||('OneDrive ตอบกลับ '+r.status));return j}
const itemPath=(rel)=>`/drives/${CL.file.drive}/items/${CL.file.folder}:/${rel.split('/').map(encodeURIComponent).join('/')}:`;

/* what is shared: projects and company data (not which project this device has open) */
const payload=()=>JSON.stringify({v:DB.v||1,projects:DB.projects,co:DB.co});
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const isObj=x=>x&&typeof x==='object'&&!Array.isArray(x);
const byId=a=>Array.isArray(a)&&a.length>0&&a.every(x=>isObj(x)&&x.id!=null);
// three-way merge: base = last synced, l = this device, r = the file now. A side that did not change gives way.
function merge3(b,l,r){if(l===undefined)return r;if(r===undefined)return l;if(eq(l,r)||eq(l,b))return r;if(eq(r,b))return l;
  if(Array.isArray(l)&&Array.isArray(r)&&(byId(l)||byId(r)||byId(b))&&[l,r,b||[]].every(a=>a.every(x=>isObj(x)&&x.id!=null))){
    const M=a=>new Map((a||[]).map(x=>[x.id,x])),B=M(b),L=M(l),R=M(r),ids=[...R.keys(),...[...L.keys()].filter(k=>!R.has(k))],out=[];
    for(const id of ids){const bi=B.get(id),li=L.get(id),ri=R.get(id);
      if(bi&&!li){if(ri&&!eq(ri,bi))out.push(ri);continue}// deleted here; keep only if edited there
      if(bi&&!ri){if(li&&!eq(li,bi))out.push(li);continue}// deleted there; keep only if edited here
      out.push(li&&ri?merge3(bi,li,ri):li||ri)}
    return out}
  if(isObj(l)&&isObj(r)){const bb=isObj(b)?b:{},out={};
    for(const k of new Set([...Object.keys(r),...Object.keys(l)])){const inL=k in l,inR=k in r;
      if(!inL&&k in bb){if(inR&&!eq(r[k],bb[k]))out[k]=r[k];continue}
      if(!inR&&k in bb){if(inL&&!eq(l[k],bb[k]))out[k]=l[k];continue}
      out[k]=merge3(bb[k],l[k],r[k])}
    return out}
  return l}
async function baseGet(){try{return JSON.parse(await IDB.get('__cloudbase')||'null')}catch(e){return null}}
const baseSet=s=>IDB.put('__cloudbase',s).catch(()=>{});
function applyData(d){DB.projects=d.projects||{};Object.values(DB.projects).forEach(migrate);DB.co=Object.assign(blankCo(),d.co||{});
  if(!Object.keys(DB.projects).length){const p=blankProject('โครงการแรก');DB.projects[p.id]=p}
  if(!DB.projects[DB.cur])DB.cur=Object.keys(DB.projects)[0];P=DB.projects[DB.cur];localStorage.setItem(KEY,JSON.stringify(DB))}

async function cloudPull(force){if(!cloudOn())return;
  const it=await gjson(`/drives/${CL.file.drive}/items/${CL.file.id}?$select=id,eTag,lastModifiedDateTime,lastModifiedBy`);
  if(!force&&it.eTag===CL.file.etag)return false;
  const dl=await gjson(`/drives/${CL.file.drive}/items/${CL.file.id}?$select=id,eTag,@microsoft.graph.downloadUrl`);
  const txt=await (await fetch(dl['@microsoft.graph.downloadUrl'])).text(),remote=JSON.parse(txt||'{}'),base=await baseGet(),local=JSON.parse(payload());
  {const x=coClash(remote);if(x){toast(clashMsg(x));throw new Error(clashMsg(x))}}
  const merged=base?merge3(base,local,remote):remote;applyData(merged);
  CL.file.etag=dl.eTag;clSave();await baseSet(txt);CS.dirty=payload()!==txt;
  const by=((it.lastModifiedBy||{}).user||{}).displayName;if(by&&(it.lastModifiedBy.user.email||'').toLowerCase()!==myMail())CS.msg=`อัปเดตจาก ${by}`;
  render();return true}
async function cloudPush(){if(!cloudOn())return;const body=payload(),base=await baseGet();
  if(base&&JSON.stringify(base)===body&&!CS.dirty)return;
  for(let i=0;i<3;i++){const r=await gfetch(`/drives/${CL.file.drive}/items/${CL.file.id}/content`,{method:'PUT',headers:{'Content-Type':'application/json','If-Match':CL.file.etag||'*'},body:payload()});
    if(r.status===412||r.status===409){await cloudPull(true);continue}// someone saved first: merge their changes in, then try again
    const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.error&&j.error.message)||('บันทึกขึ้น OneDrive ไม่ได้ '+r.status));
    CL.file.etag=j.eTag;clSave();await baseSet(payload());CS.dirty=false;await dailyBackup().catch(()=>{});pushPhotos().catch(()=>{});return}
  throw new Error('มีคนแก้ไขพร้อมกันหลายครั้ง ลองซิงค์อีกครั้ง')}
async function cloudSync(force){if(!cloudOn()||CS.busy)return;if(!navigator.onLine){CS.state='off';cloudBadge();return}
  CS.busy=true;CS.state='busy';cloudBadge();
  try{await cloudPull(force);await cloudPush();CS.state='ok';CL.last=Date.now();clSave()}
  catch(e){CS.state=CS.state==='login'?'login':'err';CS.msg=e.message}
  finally{CS.busy=false;cloudBadge()}}
let pushT;const schedPush=()=>{if(!cloudOn())return;clearTimeout(pushT);CS.state=CS.busy?CS.state:'wait';cloudBadge();pushT=setTimeout(()=>cloudSync(),2500)};
{const s=save;save=function(now){s(now);if(cloudOn())schedPush()}}

/* photos: data URLs in IndexedDB here, text files in PENUM-PM/photos/ there */
const photoKeys=()=>{const K=new Set();Object.values(DB.projects).forEach(p=>{['daily','punch','safe','incid','wir','ncr'].forEach(c=>(p[c]||[]).forEach(r=>(r.photos||[]).forEach(k=>K.add(k))));(p.bills||[]).forEach(b=>(b.rcpts||[]).forEach(r=>(r.photos||[]).forEach(k=>K.add(k))))});return [...K]};
async function pushPhotos(){const done=new Set(CL.ph||[]);for(const k of photoKeys()){if(done.has(k))continue;const v=await IDB.get(k).catch(()=>null);if(!v)continue;
    const r=await gfetch(itemPath(`photos/${k}.txt`)+'/content',{method:'PUT',headers:{'Content-Type':'text/plain'},body:v});if(r.ok){done.add(k);CL.ph=[...done];clSave()}}}
{const f=phSrc;phSrc=async k=>{const v=await f(k);if(v||!cloudOn())return v;
  try{const j=await gjson(itemPath(`photos/${k}.txt`)+'?$select=id,@microsoft.graph.downloadUrl');const t=await (await fetch(j['@microsoft.graph.downloadUrl'])).text();
    if(t.startsWith('data:')){await IDB.put(k,t);phCache[k]=t;CL.ph=[...new Set([...(CL.ph||[]),k])];clSave();return t}}catch(e){}return ''}}

/* a dated copy once a day, keep the last 30 */
async function dailyBackup(){const d=today();if(CL.bk===d)return;
  const r=await gfetch(itemPath(`backup/penum-pm-${d}.json`)+'/content',{method:'PUT',headers:{'Content-Type':'application/json'},body:payload()});if(!r.ok)return;
  CL.bk=d;clSave();const L=await gjson(itemPath('backup')+'/children?$select=id,name&$top=200').catch(()=>({value:[]}));
  const old=(L.value||[]).filter(x=>/^penum-pm-\d{4}-\d\d-\d\d\.json$/.test(x.name)).sort((a,b)=>b.name.localeCompare(a.name)).slice(30);
  for(const x of old)await gfetch(`/drives/${CL.file.drive}/items/${x.id}`,{method:'DELETE'}).catch(()=>{})}

/* connect: create the shared file (owner) or find the one shared with me (staff) */
async function cloudCreate(){if(!confirm('สร้างที่เก็บข้อมูลกลางใน OneDrive ของคุณ แล้วอัปโหลดข้อมูลในเครื่องนี้ขึ้นไป?'))return;
  try{CS.state='busy';cloudBadge();const f=await gjson(`/me/drive/root:/${FOLDER}/${FNAME}:/content?@microsoft.graph.conflictBehavior=fail`,{method:'PUT',headers:{'Content-Type':'application/json'},body:'{}'}).catch(async e=>{
      if(!/exist|conflict|409/i.test(e.message))throw e;if(!confirm('มีไฟล์ข้อมูลกลางใน OneDrive อยู่แล้ว เชื่อมกับไฟล์นั้นและรวมข้อมูลเข้าด้วยกัน?'))throw new Error('ยกเลิก');return gjson(`/me/drive/root:/${FOLDER}/${FNAME}`)});
    const it=await gjson(`/drives/${f.parentReference.driveId}/items/${f.id}?$select=id,eTag,parentReference`);
    CL.file={drive:it.parentReference.driveId,id:it.id,folder:it.parentReference.id,etag:it.eTag,owner:true};clSave();
    const adm=(DB.co.adminMails||'').toLowerCase();if(!adm.includes(myMail()))DB.co.adminMails=[adm,myMail()].filter(Boolean).join(', ');
    await baseSet('{}');CS.dirty=true;await cloudSync(true);toast('สร้างที่เก็บข้อมูลกลางแล้ว');render()}
  catch(e){CS.state='err';CS.msg=e.message;cloudBadge();if(e.message!=='ยกเลิก')toast(e.message)}}
async function useItem(it){// it: a driveItem of the folder or the file, possibly in someone else's drive
  const ri=it.remoteItem||it,drive=ri.parentReference.driveId;let file=ri,folder=ri.parentReference.id;
  if(ri.folder||ri.name===FOLDER){file=await gjson(`/drives/${drive}/items/${ri.id}:/${FNAME}`);folder=ri.id}
  CL.file={drive,id:file.id,folder,etag:'',owner:false};clSave();
  const hasLocal=Object.values(DB.projects).some(p=>p.boq.items.length||p.tasks.length)||DB.co.staff.length;
  const keep=hasLocal&&confirm('รวมข้อมูลในเครื่องนี้เข้ากับข้อมูลกลางด้วยไหม?\nกด ตกลง = รวม · กด ยกเลิก = ใช้ข้อมูลกลางอย่างเดียว (ข้อมูลในเครื่องนี้ถูกแทนที่)');
  await baseSet(keep?'{"projects":{},"co":{}}':payload());// empty base = everything here is new; base = local = the file wins
  await cloudSync(true);toast('เชื่อมข้อมูลกลางแล้ว');render()}
async function cloudFind(){try{CS.state='busy';cloudBadge();const j=await gjson('/me/drive/sharedWithMe');
    const hit=(j.value||[]).find(x=>x.name===FOLDER||x.name===FNAME);if(!hit)throw new Error('ยังไม่พบข้อมูลที่แชร์ให้คุณ ให้ผู้ดูแลกด “แชร์ให้พนักงาน” หรือวางลิงก์จากอีเมลเชิญด้านล่าง');await useItem(hit)}
  catch(e){CS.state='err';CS.msg=e.message;cloudBadge();toast(e.message)}}
async function cloudLink(url){url=(url||'').trim();if(!/^https:\/\//.test(url)){toast('วางลิงก์ที่ขึ้นต้นด้วย https://');return}
  try{const id='u!'+btoa(unescape(encodeURIComponent(url))).replace(/=+$/,'').replace(/\//g,'_').replace(/\+/g,'-');
    const it=await gjson(`/shares/${id}/driveItem?$select=id,name,folder,parentReference,remoteItem`);await useItem(it)}catch(e){toast('เปิดลิงก์ไม่ได้: '+e.message)}}
async function cloudInvite(){const L=CO().staff.filter(s=>s.active!==false&&/@/.test(s.email||'')&&(s.email||'').toLowerCase()!==myMail()),done=new Set((CL.inv||[]).map(x=>x.toLowerCase()));
  const todo=L.filter(s=>!done.has(s.email.toLowerCase()));if(!todo.length){toast(L.length?'แชร์ให้ทุกคนที่มีอีเมลแล้ว':'ยังไม่มีพนักงานที่ใส่อีเมล ใส่ได้ที่ บุคคลและแรงงาน › พนักงาน');return}
  if(!confirm(`ส่งอีเมลเชิญให้ ${todo.length} คนเข้าถึงข้อมูลกลาง (แก้ไขได้)?\n${todo.map(s=>s.name+' '+s.email).join('\n')}`))return;
  try{await gjson(`/drives/${CL.file.drive}/items/${CL.file.folder}/invite`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({recipients:todo.map(s=>({email:s.email.trim()})),roles:['write'],requireSignIn:true,sendInvitation:true,message:'เชิญใช้งาน PENUM PM ข้อมูลกลางของบริษัท'})});
    CL.inv=[...done,...todo.map(s=>s.email.toLowerCase())];clSave();toast(`ส่งคำเชิญ ${todo.length} คนแล้ว`);render()}catch(e){toast('แชร์ไม่ได้: '+e.message)}}
function cloudOff(all){if(!confirm(all?'ออกจากระบบ Microsoft บนเครื่องนี้? (ข้อมูลในเครื่องยังอยู่)':'เลิกเชื่อมข้อมูลกลางบนเครื่องนี้? (ข้อมูลในเครื่องยังอยู่)'))return;
  CL.file=null;if(all){CL.tok=null;CL.user=null}CL.ph=[];clSave();IDB.del('__cloudbase');CS.state='';render()}

/* who is signed in decides the user: matched by e-mail in the staff list; admins listed in company settings */
const isAdmin=()=>!cloudOn()||(DB.co.adminMails||'').toLowerCase().split(/[\s,;]+/).includes(myMail());
const cloudStaff=()=>cloudOn()?CO().staff.find(s=>s.active!==false&&(s.email||'').trim().toLowerCase()===myMail()):null;
{const r=render;render=function(){if(cloudOn()&&!isAdmin()){const s=cloudStaff();S.me=s?s.id:'__none'}
  if(cloudOn()&&S.me==='__none'){$('#tabs').innerHTML='';$('#modeSw').innerHTML='';$('#projBox').hidden=true;
    $('#view').innerHTML=`<section class="card"><h2>ยังไม่มีสิทธิ์ใช้งาน</h2><p>บัญชี <b>${esc(myMail())}</b> ยังไม่อยู่ในทะเบียนพนักงาน ให้ผู้ดูแลระบบใส่อีเมลนี้ที่ บุคคลและแรงงาน › พนักงาน แล้วกดซิงค์อีกครั้ง</p><div class="row" style="margin-top:10px"><button type="button" class="btn pri" data-a="cSync">ซิงค์อีกครั้ง</button><button type="button" class="btn" data-a="cLogout">ออกจากระบบ</button></div></section>`;cloudBadge();return}
  r();const us=$('#userSel');if(us){us.disabled=cloudOn()&&!isAdmin();if(us.disabled)us.title='ผู้ใช้มาจากบัญชี Microsoft ที่ล็อกอิน'}cloudBadge()}}
function cloudBadge(){let b=$('#cloudBtn');if(!b){const us=$('#userSel');if(!us)return;b=document.createElement('button');b.type='button';b.id='cloudBtn';b.className='bbtn';b.dataset.a='cGo';us.before(b)}
  const t=CL.last?new Date(CL.last).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}):'';
  b.textContent=!cloudOn()?'☁ ยังไม่เชื่อม OneDrive':CS.state==='busy'?'☁ กำลังซิงค์…':CS.state==='wait'?'☁ รอบันทึก…':CS.state==='err'?'☁ ซิงค์ไม่ได้':CS.state==='login'?'☁ ต้องล็อกอินใหม่':CS.state==='off'?'☁ ออฟไลน์':`☁ ซิงค์แล้ว ${t}`;
  b.title=CS.msg||'';b.style.borderColor=CS.state==='err'||CS.state==='login'?'#E58A7A':''}

ACT.cGo=()=>{if(cloudOn()&&CS.state!=='err'&&CS.state!=='login'&&!isAdmin()){cloudSync(true);return}S.mode='co';S.ctab='coset';render();setTimeout(()=>{const c=$('#cloudCard');if(c)c.scrollIntoView({behavior:'smooth'})},50)};
ACT.cLogin=()=>msLogin();ACT.cCreate=()=>cloudCreate();ACT.cFind=()=>cloudFind();ACT.cLinkGo=()=>cloudLink(($('#cLink')||{}).value);ACT.cInvite=()=>cloudInvite();
ACT.cSync=()=>cloudSync(true);ACT.cOff=()=>cloudOff(false);ACT.cLogout=()=>cloudOff(true);
ACT.cCid=()=>{const v=(($('#cCid')||{}).value||'').trim();if(!/^[0-9a-f-]{36}$/i.test(v)){toast('Client ID ต้องเป็นรหัส 36 ตัวอักษร เช่น 1a2b3c4d-....');return}CL.clientId=v;clSave();toast('บันทึก Client ID แล้ว');render()};
ACT.cCopy=async b=>toast(await copyText(b.dataset.v)?'คัดลอกแล้ว':'คัดลอกไม่ได้');

{const f=CVIEWS.coset;CVIEWS.coset=()=>{const on=cloudOn(),cid=CL.clientId||'',ru=SUITE?redirectUri():'https://fongdabo.github.io/penum/pm/',staffLink=cid?`${ru}?cid=${cid}`:'';
  const noMail=CO().staff.filter(s=>s.active!==false&&!/@/.test(s.email||'')).length;
  const step=(k,done,title,body)=>`<li style="margin-bottom:14px"><b>${done?'✓ ':''}ขั้นที่ ${k} · ${title}</b><div style="margin-top:6px">${body}</div></li>`;
  return f()+`<section class="card" id="cloudCard"><h2><span>เก็บข้อมูลบน OneDrive และล็อกอิน</span><small>ทุกคนใช้ข้อมูลชุดเดียวกัน ใช้งานต่อได้แม้ออฟไลน์ แล้วซิงค์เมื่อกลับมาออนไลน์ สำรองอัตโนมัติวันละครั้ง เก็บ 30 วัน</small></h2>
  ${on?`<dl class="stats"><div><dt>ล็อกอินเป็น</dt><dd style="font-size:15px">${esc((CL.user||{}).name||'')}<br><small>${esc(myMail())}</small></dd></div><div><dt>สิทธิ์</dt><dd style="font-size:15px">${isAdmin()?'ผู้ดูแลระบบ':esc((cloudStaff()||{}).role||'–')}</dd></div><div><dt>ซิงค์ล่าสุด</dt><dd style="font-size:15px">${CL.last?new Date(CL.last).toLocaleString('th-TH'):'–'}</dd></div><div><dt>ที่เก็บ</dt><dd style="font-size:15px">OneDrive › ${FOLDER}${CL.file.owner?' (ของคุณ)':' (แชร์มา)'}</dd></div></dl>
    ${CS.state==='err'?`<p class="pill bad" style="display:inline-block;margin-bottom:8px">${esc(CS.msg)}</p>`:''}
    <div class="row"><button type="button" class="btn pri" data-a="cSync">ซิงค์ตอนนี้</button>${isAdmin()?`<button type="button" class="btn" data-a="cInvite">แชร์ให้พนักงาน (ส่งอีเมลเชิญ)</button>`:''}<button type="button" class="btn" data-a="cOff">เลิกเชื่อมบนเครื่องนี้</button><button type="button" class="btn" data-a="cLogout">ออกจากระบบ</button></div>
    ${isAdmin()?`<p class="hint" style="margin-top:8px">${noMail?`มีพนักงาน ${noMail} คนที่ยังไม่ใส่อีเมล ใส่ได้ที่ บุคคลและแรงงาน › พนักงาน · `:''}พนักงานเปิดลิงก์นี้ครั้งแรกเพื่อตั้งค่าเครื่อง: <code>${esc(staffLink)}</code> <button type="button" class="btn sm" data-a="cCopy" data-v="${esc(staffLink)}">คัดลอกลิงก์</button></p>
    <label style="display:block;margin-top:10px">อีเมลผู้ดูแลระบบ (เห็นทุกส่วน คั่นด้วยจุลภาค)<input data-p="co.adminMails" value="${esc(DB.co.adminMails||'')}" style="width:100%;max-width:520px;display:block;margin-top:4px"></label>`:''}`
  :`<ol style="padding-left:0;list-style:none">
    ${step(1,!!cid,'ลงทะเบียนแอปกับ Microsoft (ผู้ดูแลทำครั้งเดียว)',`<ol class="hint" style="padding-left:18px;line-height:1.8">
      <li>เปิด <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener">portal.azure.com</a> ล็อกอินด้วยบัญชี Microsoft ที่ใช้ OneDrive (ถ้าเจอกล่องเตือน “Interaction required” กด Ignore)</li>
      <li>ช่องค้นหาด้านบนพิมพ์ <b>App registrations</b> แล้วกด <b>+ New registration</b></li>
      <li>ช่อง Name พิมพ์ <b>PENUM PM</b></li>
      <li>Supported account types เลือก <b>Accounts in any organizational directory and personal Microsoft accounts</b></li>
      <li>Redirect URI เลือก <b>Single-page application (SPA)</b> แล้ววาง <code>${esc(ru)}</code> <button type="button" class="btn sm" data-a="cCopy" data-v="${esc(ru)}">คัดลอก</button></li>
      <li>กด <b>Register</b> แล้วคัดลอก <b>Application (client) ID</b> มาวางด้านล่าง</li></ol>
      <div class="row"><input id="cCid" placeholder="Application (client) ID" value="${esc(cid)}" style="width:340px"><button type="button" class="btn" data-a="cCid">บันทึก</button></div>`)}
    ${step(2,!!CL.tok,'ล็อกอินด้วยบัญชี Microsoft',CL.tok?`ล็อกอินเป็น <b>${esc((CL.user||{}).name||'')}</b> ${esc(myMail())} <button type="button" class="btn sm" data-a="cLogout">ออกจากระบบ</button>`:`<button type="button" class="btn pri" data-a="cLogin"${cid?'':' disabled'}>ล็อกอิน Microsoft</button>${SUITE?'':' <span class="hint">ล็อกอินได้เฉพาะในแอปที่เปิดจาก fongdabo.github.io/penum/pm/</span>'}`)}
    ${step(3,false,'เชื่อมข้อมูลกลาง',`<div class="grid2"><div><b>ผู้ดูแล (ครั้งแรก)</b><p class="hint">สร้างโฟลเดอร์ ${FOLDER} ใน OneDrive ของคุณ แล้วอัปโหลดข้อมูลในเครื่องนี้ขึ้นไป</p><button type="button" class="btn pri" data-a="cCreate"${CL.tok?'':' disabled'}>สร้างที่เก็บข้อมูลกลาง</button></div>
      <div><b>พนักงาน</b><p class="hint">หลังผู้ดูแลกด “แชร์ให้พนักงาน” แล้ว กดปุ่มนี้ หรือวางลิงก์จากอีเมลเชิญ</p><button type="button" class="btn" data-a="cFind"${CL.tok?'':' disabled'}>ค้นหาข้อมูลที่แชร์ให้ฉัน</button>
      <div class="row" style="margin-top:6px"><input id="cLink" placeholder="ลิงก์จากอีเมลเชิญ" style="width:260px"><button type="button" class="btn" data-a="cLinkGo"${CL.tok?'':' disabled'}>เปิดลิงก์</button></div></div></div>`)}</ol>`}</section>`}}

async function cloudInit(){const back=await msRedirect().catch(()=>false);
  if(back&&!CL.file){S.mode='co';S.ctab='coset';render();setTimeout(()=>{const c=$('#cloudCard');if(c)c.scrollIntoView()},80)}
  if(cloudOn()){render();cloudSync(true)}else cloudBadge();
  setInterval(()=>{if(cloudOn()&&document.visibilityState==='visible')cloudSync()},60000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&cloudOn())cloudSync()});
  addEventListener('online',()=>cloudOn()&&cloudSync())}

