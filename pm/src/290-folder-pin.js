/* ---------- no app registration needed: a folder inside OneDrive on this computer ----------
   The app reads and writes PENUM-PM/penum-pm.json in a folder the user picks once (Edge/Chrome on a computer);
   the OneDrive program syncs that folder to the cloud and to everyone it is shared with. Same merge as above,
   and OneDrive's own conflict copies (penum-pm-PCNAME.json) are merged in and removed. */
const FS={h:null,busy:false,state:'',msg:''};
const fsOK=()=>'showDirectoryPicker' in window;
const folderOn=()=>!!CL.dirName&&!cloudOn();
// a company set up from a licence code never merges into another company's shared data (3.48.1)
function coClash(R){const L=DB.co||{},F=(R&&R.co)||{},ln=(L.name||'').trim(),fn=(F.name||'').trim();return L.lic&&fn&&ln&&fn!==ln&&F.lic!==L.lic?fn:''}
const clashMsg=x=>`ข้อมูลในที่เก็บนี้เป็นของ “${x}” ไม่ใช่ “${DB.co.name}” ระบบหยุดไว้ ไม่ให้ข้อมูลสองบริษัทปนกัน`;
const EMPTY='{"projects":{},"co":{}}';
async function dirH(){if(!FS.h){try{FS.h=await IDB.get('__dirh')}catch(e){}}return FS.h}
async function fPerm(ask){const h=await dirH();if(!h)return false;const o={mode:'readwrite'};let p=await h.queryPermission(o);if(p!=='granted'&&ask)p=await h.requestPermission(o);return p==='granted'}
async function fRead(dir,name){try{const f=await (await dir.getFileHandle(name)).getFile();return {txt:await f.text(),mtime:f.lastModified}}catch(e){return null}}
async function fWrite(dir,name,txt){const fh=await dir.getFileHandle(name,{create:true}),w=await fh.createWritable();await w.write(txt);await w.close();return (await fh.getFile()).lastModified}
async function fSub(name){return (await dirH()).getDirectoryHandle(name,{create:true})}
async function folderSync(force){if(!folderOn()||FS.busy)return;if(!await fPerm(false)){FS.state='perm';cloudBadge();return}
  FS.busy=true;FS.state='busy';cloudBadge();let changed=false;
  try{const h=await dirH(),cur=await fRead(h,FNAME),anc=JSON.parse((await IDB.get('__cloudbase'))||EMPTY);
    if(cur){const x=coClash(JSON.parse(cur.txt||EMPTY));if(x){toast(clashMsg(x));throw new Error(clashMsg(x))}}
    if(cur&&(force||cur.mtime!==CL.dirMtime)&&cur.txt!==payload()){applyData(merge3(anc,JSON.parse(payload()),JSON.parse(cur.txt||EMPTY)));changed=true}
    for await(const [nm,eh] of h.entries()){if(eh.kind!=='file'||nm===FNAME||!/^penum-pm.*\.json$/i.test(nm))continue;
      try{const J=JSON.parse(await (await eh.getFile()).text());
        if(J.kind==='penum-mobile'){await mobileIn(J);const d=await fSub('mobile-done');await fWrite(d,nm,JSON.stringify({kind:J.kind,by:J.by,at:J.at,in:new Date().toISOString()}))}
        else applyData(merge3(anc,JSON.parse(payload()),J));await h.removeEntry(nm);changed=true}catch(e){}}
    const body=payload();CL.dirMtime=!cur||body!==cur.txt?await fWrite(h,FNAME,body):cur.mtime;
    await baseSet(body);CL.last=Date.now();clSave();await fBackup(h,body).catch(()=>{});fPhotos().catch(()=>{});FS.state='ok';FS.msg=''}
  catch(e){FS.state='err';FS.msg=e.message}
  finally{FS.busy=false;if(changed)render();else cloudBadge()}}
async function fBackup(h,body){const d=today();if(CL.dirBk===d)return;const bk=await h.getDirectoryHandle('backup',{create:true});await fWrite(bk,`penum-pm-${d}.json`,body);CL.dirBk=d;clSave();
  const L=[];for await(const [nm] of bk.entries())if(/^penum-pm-\d{4}-\d\d-\d\d\.json$/.test(nm))L.push(nm);L.sort().reverse();for(const nm of L.slice(30))await bk.removeEntry(nm).catch(()=>{})}
async function fPhotos(){const done=new Set(CL.dirPh||[]),d=await fSub('photos');for(const k of photoKeys()){if(done.has(k))continue;const v=await IDB.get(k).catch(()=>null);if(!v)continue;await fWrite(d,k+'.txt',v);done.add(k);CL.dirPh=[...done];clSave()}}
{const f=phSrc;phSrc=async k=>{const v=await f(k);if(v||!folderOn())return v;
  try{if(!await fPerm(false))return '';const r=await fRead(await fSub('photos'),k+'.txt');if(r&&r.txt.startsWith('data:')){await IDB.put(k,r.txt);phCache[k]=r.txt;return r.txt}}catch(e){}return ''}}
let fT;{const s=save;save=function(now){s(now);if(folderOn()){clearTimeout(fT);fT=setTimeout(()=>folderSync(),1500)}}}
{const cb=cloudBadge;cloudBadge=function(){cb();const b=$('#cloudBtn');if(!b)return;if(!folderOn()){b.dataset.a='cGo';return}b.dataset.a='fGo';
  const t=CL.last?new Date(CL.last).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}):'';
  b.textContent=FS.state==='perm'?'📁 กดเพื่อเปิดโฟลเดอร์ OneDrive':FS.state==='busy'?'📁 กำลังบันทึก…':FS.state==='err'?'📁 บันทึกไม่ได้':`📁 ${CL.dirName||'OneDrive'} · บันทึกแล้ว ${t}`;
  b.title=FS.state==='err'?FS.msg:`โฟลเดอร์ ${CL.dirName}`;b.style.borderColor=FS.state==='err'||FS.state==='perm'?'#E58A7A':''}}

ACT.fGo=async()=>{if(FS.state==='perm'||FS.state==='err'){if(await fPerm(true)){await folderSync(true);return}}S.mode='co';S.ctab='coset';render();setTimeout(()=>{const c=$('#folderCard');if(c)c.scrollIntoView({behavior:'smooth'})},50)};
ACT.fPick=async()=>{if(!fsOK()){toast('ใช้ได้กับ Edge หรือ Chrome บนคอมพิวเตอร์');return}
  let h;try{h=await showDirectoryPicker({id:'penum-pm',mode:'readwrite',startIn:'documents'})}catch(e){return}
  // only a new empty folder, or one that already holds PENUM PM data: never write into a folder with other files
  const other=[];for await(const [nm] of h.entries())if(!(nm===FNAME||nm==='backup'||nm==='photos'||nm==='mobile-done'||/^penum-pm.*\.json$/i.test(nm)||/^(desktop\.ini|thumbs\.db|\.ds_store|\.dropbox.*|icon\r?)$/i.test(nm)))other.push(nm);
  if(other.length){alert(`โฟลเดอร์ “${h.name}” มีไฟล์อื่นอยู่แล้ว (${other.slice(0,3).join(', ')}${other.length>3?' …':''})\nเพื่อไม่ให้ไปยุ่งกับไฟล์เดิม กรุณากด “โฟลเดอร์ใหม่” สร้างโฟลเดอร์ PENUM-PM ที่ว่างเปล่า แล้วเลือกโฟลเดอร์นั้น`);return}
  {const c0=await fRead(h,FNAME);let x='';try{x=c0&&coClash(JSON.parse(c0.txt||EMPTY))}catch(e){}if(x){alert(clashMsg(x)+`\n\nเลือกโฟลเดอร์อื่น หรือกด “โฟลเดอร์ใหม่” สร้างโฟลเดอร์ใหม่ (เช่น PENUM-PM-${(DB.co.nameEn||'').split(/\s+/)[0]||'บริษัท'}) แล้วเลือกโฟลเดอร์นั้น`);return}}
  await IDB.put('__dirh',h);FS.h=h;CL.dirName=h.name;CL.dirMtime=0;CL.dirPh=[];CL.dirBk='';clSave();
  const cur=await fRead(h,FNAME),hasLocal=Object.values(DB.projects).some(p=>p.boq.items.length||p.tasks.length)||DB.co.staff.length;
  const keep=!cur||(hasLocal&&confirm('โฟลเดอร์นี้มีข้อมูลกลางอยู่แล้ว รวมข้อมูลในเครื่องนี้เข้าไปด้วยไหม?\nกด ตกลง = รวม · กด ยกเลิก = ใช้ข้อมูลในโฟลเดอร์อย่างเดียว (ข้อมูลในเครื่องนี้ถูกแทนที่)'));
  await baseSet(keep?EMPTY:payload());await folderSync(true);toast(cur?'เชื่อมโฟลเดอร์ข้อมูลกลางแล้ว':'สร้างข้อมูลกลางในโฟลเดอร์แล้ว');render()};
ACT.fSync=async()=>{if(await fPerm(true))folderSync(true)};
ACT.fOff=async()=>{if(!confirm('เลิกเชื่อมโฟลเดอร์บนเครื่องนี้? (ข้อมูลในเครื่องและในโฟลเดอร์ยังอยู่)'))return;delete CL.dirName;clSave();FS.h=null;await IDB.del('__dirh');IDB.del('__cloudbase');FS.state='';render()};

{const f=CVIEWS.coset;CVIEWS.coset=()=>{if(cloudOn())return f();const on=folderOn();
  return f()+`<section class="card" id="folderCard"><h2><span>ทางเลือกที่ไม่ต้องลงทะเบียน: โฟลเดอร์ OneDrive ในคอมพิวเตอร์</span><small>PENUM PM บันทึกลงโฟลเดอร์ แล้วโปรแกรม OneDrive ซิงค์ขึ้นคลาวด์และไปยังเครื่องของคนที่แชร์ให้ ใช้ได้กับ Edge หรือ Chrome บนคอมพิวเตอร์</small></h2>
  ${on?`<dl class="stats"><div><dt>โฟลเดอร์</dt><dd style="font-size:15px">${esc(CL.dirName)}</dd></div><div><dt>บันทึกล่าสุด</dt><dd style="font-size:15px">${CL.last?new Date(CL.last).toLocaleString('th-TH'):'–'}</dd></div><div><dt>สำรองอัตโนมัติ</dt><dd style="font-size:15px">วันละครั้ง เก็บ 30 วัน <small>(โฟลเดอร์ backup)</small></dd></div></dl>
    ${FS.state==='err'?`<p class="pill bad" style="display:inline-block;margin-bottom:8px">${esc(FS.msg)}</p>`:''}
    <div class="row"><button type="button" class="btn pri" data-a="fSync">บันทึกและดึงข้อมูลตอนนี้</button><button type="button" class="btn" data-a="fPick">เปลี่ยนโฟลเดอร์</button><button type="button" class="btn" data-a="fOff">เลิกเชื่อมบนเครื่องนี้</button></div>
    <p class="hint" style="margin-top:8px">ให้คนอื่นใช้ข้อมูลชุดเดียวกัน: เปิด onedrive.live.com คลิกขวาที่โฟลเดอร์ ${esc(CL.dirName)} › <b>แชร์</b> › ใส่อีเมล เลือก <b>แก้ไขได้</b> › ส่ง · คนที่ได้รับเปิดลิงก์แล้วกด <b>เพิ่มทางลัดไปยังไฟล์ของฉัน</b> จากนั้นในเครื่องของเขากดปุ่ม “เลือกโฟลเดอร์” ในหน้านี้ แล้วเลือกโฟลเดอร์เดียวกัน</p>`
  :`<ol class="hint" style="padding-left:18px;line-height:1.9">
    <li>เปิดโปรแกรม <b>OneDrive</b> บนคอมพิวเตอร์ (Windows มีมาให้แล้ว ไอคอนรูปเมฆที่มุมขวาล่าง) และล็อกอินด้วยบัญชีเดียวกับ onedrive.live.com</li>
    <li>กดปุ่มด้านล่าง หน้าต่างเลือกโฟลเดอร์จะเปิดขึ้น ทางซ้ายกด <b>OneDrive</b></li>
    <li>กด <b>โฟลเดอร์ใหม่</b> ตั้งชื่อ <b>PENUM-PM</b> แล้วดับเบิลคลิกเข้าไปในโฟลเดอร์นั้น (โปรแกรมใช้เฉพาะโฟลเดอร์ใหม่ที่ว่าง ไม่แตะไฟล์หรือโฟลเดอร์อื่นใน OneDrive)</li>
    <li>กด <b>เลือกโฟลเดอร์</b> แล้วกด <b>ดูไฟล์</b> หรือ <b>อนุญาต</b> ให้แก้ไขไฟล์ได้</li></ol>
    <button type="button" class="btn pri" data-a="fPick"${fsOK()?'':' disabled'}>เลือกโฟลเดอร์ OneDrive</button>${fsOK()?'':' <span class="hint">เบราว์เซอร์นี้ใช้ไม่ได้ ใช้ Edge หรือ Chrome บนคอมพิวเตอร์</span>'}`}</section>`}}

function folderInit(){if(folderOn())folderSync(true);else cloudBadge();
  setInterval(()=>{if(folderOn()&&document.visibilityState==='visible')folderSync()},20000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&folderOn())folderSync()})}

/* ---------- sign in with a PIN per person (folder mode / one shared PC) ----------
   Keeps honest people in their own department's screens and puts a name on approvals.
   It is not encryption: anyone who opens the data file can read it. */
const AKEY='penum.pm.auth'+DSFX;
let PINAUTH=null;try{PINAUTH=JSON.parse(localStorage.getItem(AKEY)||'null')}catch(e){}
const authSave=()=>{try{PINAUTH?localStorage.setItem(AKEY,JSON.stringify(PINAUTH)):localStorage.removeItem(AKEY)}catch(e){}};
async function pinHash(salt,pin){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('penum-pm|'+salt+'|'+pin));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const pinOn=()=>!!DB.co.pinOn&&!!DB.co.adminPin&&!cloudOn();
const authOK=()=>PINAUTH&&(PINAUTH.id===''||CO().staff.some(s=>s.id===PINAUTH.id&&s.active!==false&&s.pin));
{const r=render;render=function(){if(pinOn()){if(!authOK()){loginScreen();return}S.me=PINAUTH.id}
  r();bandCtl(true);if(pinOn()&&S.me)['[data-a="backup"]','[data-a="restore"]'].forEach(q=>{const e=$(q);if(e)e.hidden=true});const us=$('#userSel');if(us&&pinOn()){us.disabled=true;us.title='เปลี่ยนผู้ใช้: กดออกจากระบบแล้วเข้าใหม่ด้วย PIN'}
  let o=$('#outBtn');if(pinOn()){if(!o&&us){o=document.createElement('button');o.type='button';o.id='outBtn';o.className='bbtn';o.dataset.a='pinOut';o.textContent='ออกจากระบบ';us.after(o)}}else if(o)o.remove()}}
const bandCtl=show=>['#userSel','#outBtn','[data-a="backup"]','[data-a="restore"]'].forEach(q=>{const e=$(q);if(e)e.hidden=!show});
function loginScreen(){bandCtl(false);$('#tabs').innerHTML='';$('#modeSw').innerHTML='';$('#projBox').hidden=true;const us=$('#userSel');if(us)us.disabled=true;
  const L=CO().staff.filter(s=>s.active!==false&&s.pin);
  $('#view').innerHTML=`<section class="card" style="max-width:420px;margin:40px auto"><h2>เข้าใช้งาน PENUM PM</h2>
  <label style="display:block;margin-bottom:10px">ชื่อผู้ใช้<select id="pinWho" style="width:100%;display:block;margin-top:4px"><option value="__admin">ผู้ดูแลระบบ</option>${L.map(s=>`<option value="${s.id}"${PINAUTH&&PINAUTH.last===s.id?' selected':''}>${esc(s.name||s.code)} · ${esc(s.role||'')}</option>`).join('')}</select></label>
  <label style="display:block">PIN<input id="pinVal" type="password" inputmode="numeric" autocomplete="current-password" style="width:100%;display:block;margin-top:4px;font-size:20px;letter-spacing:6px"></label>
  <div class="row" style="margin-top:12px"><button type="button" class="btn pri" data-a="pinIn">เข้าใช้งาน</button></div>
  <p class="hint" style="margin-top:10px">ลืม PIN ให้ผู้ดูแลระบบตั้งใหม่ที่ ตั้งค่าบริษัท › เข้าระบบด้วย PIN</p>
  ${typeof coSlots==='function'&&coSlots().length>1?`<p style="margin-top:8px"><button type="button" class="btn sm" data-a="coPick">เปลี่ยนบริษัท</button></p>`:''}</section>`;
  setTimeout(()=>{const i=$('#pinVal');if(i)i.focus()},30);if(typeof cloudBadge==='function')cloudBadge()}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='pinVal')ACT.pinIn()});
ACT.pinIn=async()=>{const who=($('#pinWho')||{}).value,pin=(($('#pinVal')||{}).value||'').trim();if(!pin)return;
  const id=who==='__admin'?'':who,want=id===''?DB.co.adminPin:(CO().staff.find(s=>s.id===id)||{}).pin;
  if(want&&await pinHash(id||'admin',pin)===want){PINAUTH={id,last:id,at:Date.now()};authSave();S.me=id;toast(id?`สวัสดีครับ ${staffName(id)}`:'เข้าใช้งานในฐานะผู้ดูแลระบบ');render()}
  else{toast('PIN ไม่ถูกต้อง');const i=$('#pinVal');if(i){i.value='';i.focus()}}};
ACT.pinOut=()=>{const last=PINAUTH&&PINAUTH.id;PINAUTH={last};authSave();render()};
ACT.pinSet=async b=>{const id=b.dataset.id,nm=id==='admin'?'ผู้ดูแลระบบ':staffName(id);const v=prompt(`ตั้ง PIN ใหม่ให้ ${nm} (ตัวเลข 4–8 หลัก)`,'');if(v==null)return;
  if(!/^\d{4,8}$/.test(v.trim())){toast('PIN ต้องเป็นตัวเลข 4–8 หลัก');return}const h=await pinHash(id,v.trim());
  if(id==='admin')DB.co.adminPin=h;else{const s=CO().staff.find(x=>x.id===id);if(s)s.pin=h}save();render();toast(`ตั้ง PIN ให้ ${nm} แล้ว`)};
ACT.pinClear=b=>{const s=CO().staff.find(x=>x.id===b.dataset.id);if(s&&confirm(`ลบ PIN ของ ${s.name}? คนนี้จะเข้าใช้งานไม่ได้จนกว่าจะตั้งใหม่`)){delete s.pin;save();render()}};
ACT.pinToggle=()=>{if(!DB.co.adminPin){toast('ตั้ง PIN ผู้ดูแลระบบก่อน');return}
  if(!DB.co.pinOn&&!confirm('เปิดใช้การเข้าระบบด้วย PIN? ทุกเครื่องที่ใช้ข้อมูลชุดนี้จะต้องใส่ PIN ก่อนใช้งาน'))return;
  DB.co.pinOn=!DB.co.pinOn;if(DB.co.pinOn){PINAUTH={id:'',last:'',at:Date.now()};authSave()}save();render()};
{const f=CVIEWS.coset;CVIEWS.coset=()=>{if(cloudOn())return f();const C=CO(),L=C.staff.filter(s=>s.active!==false),admin=!S.me;
  return f()+`<section class="card" id="pinCard"><h2><span>เข้าระบบด้วย PIN</span><small>แต่ละคนใส่ชื่อและ PIN ก่อนใช้งาน แล้วจะเห็นเฉพาะส่วนงานของฝ่ายตัวเอง และชื่อจะไปอยู่บนการอนุมัติ</small></h2>
  ${admin?`<div class="row" style="margin-bottom:10px"><button type="button" class="btn${DB.co.pinOn?'':' pri'}" data-a="pinToggle">${DB.co.pinOn?'ปิดการใช้ PIN':'เปิดใช้การเข้าระบบด้วย PIN'}</button>
    <button type="button" class="btn" data-a="pinSet" data-id="admin">${C.adminPin?'เปลี่ยน':'ตั้ง'} PIN ผู้ดูแลระบบ</button>${C.adminPin?'<span class="pill ok">ตั้งแล้ว</span>':'<span class="pill warn">ยังไม่ได้ตั้ง</span>'}</div>
  <div class="tw"><table><thead><tr><th>พนักงาน</th><th>ฝ่าย</th><th>PIN</th><th></th></tr></thead><tbody>${L.map(s=>`<tr><td>${esc(s.name||s.code)}<br><small class="muted">${esc(s.role||'')}</small></td><td>${esc((SKILLS.depts.find(d=>d.c===s.dept)||{}).n||'')}</td><td>${s.pin?'<span class="pill ok">ตั้งแล้ว</span>':'<span class="pill">ยังไม่มี</span>'}</td><td style="white-space:nowrap"><button type="button" class="btn sm" data-a="pinSet" data-id="${s.id}">${s.pin?'เปลี่ยน PIN':'ตั้ง PIN'}</button>${s.pin?` <button type="button" class="btn sm del" data-a="pinClear" data-id="${s.id}">ลบ</button>`:''}</td></tr>`).join('')}</tbody></table></div>
  <p class="hint" style="margin-top:6px">ตั้ง PIN ให้แต่ละคนแล้วบอกเขาเป็นการส่วนตัว คนที่ยังไม่มี PIN จะเข้าใช้งานไม่ได้ · PIN ช่วยแยกสิทธิ์การใช้งาน แต่ไม่ได้เข้ารหัสข้อมูล คนที่เปิดไฟล์ข้อมูลในโฟลเดอร์ได้ยังอ่านไฟล์ได้</p>`
  :'<p class="hint">เฉพาะผู้ดูแลระบบตั้งค่าส่วนนี้ได้</p>'}</section>`}}

