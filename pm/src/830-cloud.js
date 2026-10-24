/* ---------- 3.52 คลาวด์ PENUM: company data on ORIEN's Supabase, no folder to pick ----------
   Storage only: each company is a folder <company id>/ in the private bucket "pm", holding the same files as a PENUM-PM
   folder (penum-pm.json, photos/, backup/). SBD() below is a stand-in for a folder handle, so folderSync, the merge,
   backups and photos work unchanged. Sign-in is anonymous per device; a device gets access only by creating the company
   (admin) or by opening an invite link (staff code / admin code), checked in the database (penum-pm/cloud/setup.sql).
   Nothing shows until SBCFG has the project URL and public (anon) key. */
// ORIEN's project (the publishable key is public by design; the data is locked by the rules in tools/pm-cloud-setup.sql).
// live:true (3.56, user chose "เปิดเลย") = every company sees the cloud; live:false = only a device that opened …/pm/#cloud=1 or a cloud invite link
const SBCFG=window.__SBCFG||{url:'https://uejnlxwjqsadbnzdncvb.supabase.co',key:'sb_publishable_0GTUfFnwBuWxjMw7yYULtQ_mhVVhcez',live:true};
{const m=location.hash.match(/(?:^#|&)cloud=([01])\b/);if(m){try{m[1]==='1'?localStorage.setItem('pmCloudBeta','1'):localStorage.removeItem('pmCloudBeta')}catch(e){}history.replaceState(null,'',location.pathname+location.search)}}
function sbReady(){if(!(SBCFG.url&&SBCFG.key))return false;if(SBCFG.live||window.__SBCFG)return true;try{if(JSON.parse(localStorage.getItem('pmSB'+DSFX)||'{}').on)return true}catch(e){}
  try{if(localStorage.getItem('pmCloudBeta'))return true;const o=joinP();if(o&&o.sp==='sb'){localStorage.setItem('pmCloudBeta','1');return true}}catch(e){}return false}
const SBK='pmSB'+DSFX;let SB={};try{SB=JSON.parse(localStorage.getItem(SBK)||'{}')||{}}catch(e){}
const sbSave=()=>{try{localStorage.setItem(SBK,JSON.stringify(SB))}catch(e){}};
function sbOn(){return sbReady()&&!!(SB.cid&&SB.on&&SB.rt)}
async function sbAuth(path,body){const r=await fetch(SBCFG.url+'/auth/v1/'+path,{method:'POST',headers:{apikey:SBCFG.key,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.msg||j.error_description||j.message||('เข้าระบบคลาวด์ไม่ได้ ('+r.status+')'));
  SB.at=j.access_token;SB.rt=j.refresh_token;SB.exp=Date.now()+((j.expires_in||3600)-60)*1000;SB.uid=j.user&&j.user.id||SB.uid;sbSave();return SB.at}
// one anonymous sign-in per device and company slot; the refresh token keeps it
async function sbTok(){if(SB.at&&Date.now()<SB.exp)return SB.at;if(SB.rt){try{return await sbAuth('token?grant_type=refresh_token',{refresh_token:SB.rt})}catch(e){if(!navigator.onLine)throw new Error('ออฟไลน์ ข้อมูลอยู่ในเครื่องนี้ จะบันทึกขึ้นคลาวด์เมื่อมีอินเทอร์เน็ต');throw e}}
  return sbAuth('signup',{data:{}})}
async function sbReq(path,o={}){const t=await sbTok();let r;
  try{r=await fetch(SBCFG.url+path,{...o,cache:'no-store',headers:{apikey:SBCFG.key,Authorization:'Bearer '+t,...(o.headers||{})}})}catch(e){throw new Error('ออฟไลน์ ข้อมูลอยู่ในเครื่องนี้ จะบันทึกขึ้นคลาวด์เมื่อมีอินเทอร์เน็ต')}
  return r}
async function sbRpc(fn,args){const r=await sbReq('/rest/v1/rpc/'+fn,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(args)});
  const j=await r.json().catch(()=>null);if(!r.ok)throw new Error((j&&(j.message||j.hint))||('คลาวด์ตอบกลับผิดพลาด ('+r.status+')'));return j}
const sbEnc=p=>p.split('/').map(encodeURIComponent).join('/');
async function sbList(dir,search){const out=[];for(let off=0;;off+=1000){
    const r=await sbReq('/storage/v1/object/list/pm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefix:dir,limit:1000,offset:off,search:search||'',sortBy:{column:'name',order:'asc'}})});
    if(!r.ok)throw new Error('อ่านข้อมูลบนคลาวด์ไม่ได้ ('+r.status+')');const L=await r.json();out.push(...L);if(L.length<1000)return out}}
const SBC=new Map(); // path → {m: mtime, t: text}: download a file only when it changed
async function sbStat(path){const i=path.lastIndexOf('/'),dir=path.slice(0,i),nm=path.slice(i+1);const it=(await sbList(dir,nm)).find(x=>x.name===nm&&x.id);return it?Date.parse(it.updated_at||it.created_at)||1:0}
let SBVQ=true;const SBSTALE=new Set(); // 3.70.9: paths whose last download looked like an old copy; the next one asks past any cache
function SBF(path,name,meta){return {kind:'file',name,path,
  async getFile(){const m=meta?Date.parse(meta.updated_at||meta.created_at)||1:await sbStat(path);meta=null;if(!m)throw new DOMException('ไม่มีไฟล์','NotFoundError');
    return {lastModified:m,async text(){const c=SBC.get(path);if(c&&c.m===m)return c.t;const u='/storage/v1/object/authenticated/pm/'+sbEnc(path);let r=null;
      // the file's time goes into the address, so a cache between here and the cloud can never hand back an older version
      // (3.70.9: users saw a teammate's chat file stuck at an old copy for many minutes); if the cloud refuses it, the plain address
      if(SBVQ){const v=SBSTALE.has(path)?Date.now():m;SBSTALE.delete(path);r=await sbReq(u+'?v='+v).catch(()=>null);if(r&&!r.ok){if(r.status===400)SBVQ=false;r=null}}if(!r)r=await sbReq(u);if(!r.ok)throw new Error('ดาวน์โหลดจากคลาวด์ไม่ได้ ('+r.status+')');const t=await r.text();SBC.set(path,{m,t});return t}}},
  async createWritable(){let buf='';return {async write(x){buf+=typeof x==='string'?x:await new Blob([x]).text()},
    async close(){const r=await sbReq('/storage/v1/object/pm/'+sbEnc(path),{method:'POST',headers:{'x-upsert':'true','cache-control':'no-cache','Content-Type':path.endsWith('.json')?'application/json':'text/plain'},body:buf});
      if(!r.ok)throw new Error(r.status===413?'ไฟล์ใหญ่เกินที่คลาวด์รับได้':'บันทึกขึ้นคลาวด์ไม่ได้ ('+r.status+')');const m=await sbStat(path);SBC.set(path,{m,t:buf});
      if(m)meta={updated_at:new Date(m).toISOString()}}}}}} // the getFile() right after a write (fWrite) needs no second look-up
function SBD(cid,sub=''){const base=cid+(sub?'/'+sub:'');return {kind:'directory',_sb:1,name:sub?sub.split('/').pop():'คลาวด์ PENUM',
  async queryPermission(){return SB.rt?'granted':'prompt'},async requestPermission(){try{await sbTok();return 'granted'}catch(e){return 'denied'}},
  async getDirectoryHandle(n){return SBD(cid,(sub?sub+'/':'')+n)},
  async getFileHandle(n){return SBF(base+'/'+n,n)},
  async removeEntry(n){const r=await sbReq('/storage/v1/object/pm',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:[base+'/'+n]})});SBC.delete(base+'/'+n);if(!r.ok)throw new Error('ลบไม่ได้')},
  async *entries(){for(const it of await sbList(base))if(it.name&&it.name!=='.emptyFolderPlaceholder')yield [it.name,it.id?SBF(base+'/'+it.name,it.name,it):SBD(cid,(sub?sub+'/':'')+it.name)]}}}
{const f=dirH;dirH=async function(){if(sbOn()){if(!FS.h||!FS.h._sb)FS.h=SBD(SB.cid);return FS.h}if(FS.h&&FS.h._sb)FS.h=null;return f()}}
// the place itself
SYNCP.sb={n:'คลาวด์ PENUM',s:'คลาวด์ PENUM',ic:'✦',at:'',app:'',share:'',pc:[],
  note:'ข้อมูลเก็บบนคลาวด์ของ PENUM (เซิร์ฟเวอร์สิงคโปร์) ไม่ต้องติดตั้งโปรแกรมหรือเลือกโฟลเดอร์ ใช้ได้ทั้งคอมพิวเตอร์และมือถือ สำรองข้อมูลอัตโนมัติวันละครั้ง'};
if(sbReady())SPK.unshift('sb');
const sbBtn=t=>`<button type="button" class="btn pri" data-a="sbStart">${t||'✦ เก็บข้อมูลบนคลาวด์ PENUM'}</button>`;
{const f=spSteps;spSteps=function(k=spGet()){return k!=='sb'?f(k):`<div class="sp-n">${SYNCP.sb.note}</div>
  <ol class="hint" style="padding-left:18px;line-height:1.9"><li>กดปุ่ม <b>✦ เก็บข้อมูลบนคลาวด์ PENUM</b> ด้านล่าง</li><li>รอสักครู่ ระบบสร้างที่เก็บของบริษัทและบันทึกข้อมูลให้ เสร็จแล้ว</li></ol>
  <p class="hint" style="margin-top:0">พนักงานเข้าใช้ด้วย <b>ลิงก์เชิญ</b> (ตั้งค่า › เข้าระบบด้วย PIN) กดลิงก์แล้วเข้าได้เลย ไม่ต้องเลือกโฟลเดอร์</p>`}}
// every "pick the folder" button becomes the cloud button while the cloud is chosen
const sbFix=h=>spGet()==='sb'?h.replace(/<button type="button" class="btn pri" data-a="fPick"[^>]*>[^<]*<\/button>/g,()=>sbBtn()):h;
{const f=wizFolderView;wizFolderView=function(){return sbFix(f())}}
const sbMvFix=k=>{if(k==='sb'){const ft=$('#dlg .ft');if(ft)ft.innerHTML=ft.innerHTML.replace(/<button type="button" class="btn pri" data-a="fPick"[^>]*>[^<]*<\/button>/,()=>sbBtn())}};
{const a=ACT.spMove,b=ACT.spMvSet;ACT.spMove=function(){a.apply(this,arguments);sbMvFix(window.__spMv)};ACT.spMvSet=function(x){b.apply(this,arguments);sbMvFix(window.__spMv)}}
ACT.sbStart=async b=>{if(!sbReady())return;if(!(DB.co.name||'').trim()){toast('ตั้งชื่อบริษัทก่อน (ตั้งค่า › ข้อมูลบริษัท)');return}
  if(b){b.disabled=true;b.textContent='กำลังสร้างที่เก็บบนคลาวด์…'}
  try{if(!SB.cid||SB.role!=='admin'){const r=await sbRpc('pm_create_company',{p_name:DB.co.name||'',p_lic:DB.co.lic||''});SB.cid=r.id;SB.role='admin'}
    SB.on=true;sbSave();window.__spMv='';
    try{localStorage.setItem(SPLS,'sb')}catch(e){}if(!(typeof licRO==='function'&&licRO())){DB.co.syncP='sb';save()}
    await IDB.del('__dirh').catch(()=>{});FS.h=SBD(SB.cid);CL.dirName='คลาวด์ PENUM';CL.dirMtime=0;CL.dirPh=[];CL.dirBk='';clSave();
    await baseSet(EMPTY);await folderSync(true);
    const d=$('#dlg');if(d&&d.open)d.close();if(S.wizF)S.wizF=false;
    toast(FS.state==='err'?FS.msg:'เก็บข้อมูลบนคลาวด์ PENUM แล้ว');render()}
  catch(e){alert('เก็บข้อมูลบนคลาวด์ไม่ได้\n'+(e.message||e)+'\n\nข้อมูลยังอยู่ในเครื่องนี้ครบ ลองใหม่อีกครั้ง');if(b){b.disabled=false;b.textContent='✦ เก็บข้อมูลบนคลาวด์ PENUM'}}};
// moving back to a folder turns the cloud off on this device (the cloud copy stays);
// any "store here" button pressed while the cloud is the chosen place stores in the cloud, never opens the folder window
{const f=ACT.fPick;ACT.fPick=async function(b){const k=window.__spMv||spGet();if(k==='sb'&&sbReady()&&!welcomeOn()&&!sbOn())return ACT.sbStart(b);const was=sbOn();if(was){SB.on=false;sbSave();FS.h=null}
  const n0=CL.dirName;await f.apply(this,arguments);if(was&&CL.dirName===n0){SB.on=true;sbSave()}}}
{const f=ACT.fOff;ACT.fOff=async function(){if(!sbOn())return f.apply(this,arguments);
  if(!confirm('เลิกใช้คลาวด์บนเครื่องนี้? ข้อมูลบนคลาวด์และในเครื่องยังอยู่ กลับมาใช้ได้ด้วยลิงก์ผู้ดูแลหรือลิงก์เชิญ'))return;
  SB.on=false;sbSave();delete CL.dirName;clSave();FS.h=null;IDB.del('__cloudbase');FS.state='';render()}}
// ตั้งค่า: the cloud card
async function sbCodes(nw){return sbRpc('pm_get_codes',{p_company:SB.cid,p_new:!!nw})}
function sbLink(o){return location.origin+location.pathname+'#join='+jEnc(JSON.stringify(o))}
{const f=spCard;spCard=function(){if(!sbOn())return f();
  return `<section class="card" id="folderCard"><h2><span>ที่เก็บข้อมูล: คลาวด์ PENUM</span><small>${SYNCP.sb.note}</small></h2>
  <dl class="stats"><div><dt>ที่เก็บ</dt><dd style="font-size:15px">คลาวด์ PENUM<br><small>${SB.role==='admin'?'เครื่องนี้เป็นของผู้ดูแลระบบ':'เครื่องพนักงาน'}</small></dd></div><div><dt>บันทึกล่าสุด</dt><dd style="font-size:15px">${CL.last?new Date(CL.last).toLocaleString('th-TH'):'–'}</dd></div><div><dt>สำรองอัตโนมัติ</dt><dd style="font-size:15px">วันละครั้ง เก็บ 30 วัน</dd></div></dl>
  ${FS.state==='err'?`<p class="pill bad" style="display:inline-block;margin-bottom:8px">${esc(FS.msg)}</p>`:''}
  <div class="row"><button type="button" class="btn pri" data-a="fSync">บันทึกและดึงข้อมูลตอนนี้</button>${SB.role==='admin'?'<button type="button" class="btn" data-a="sbAdminLink">ลิงก์ผู้ดูแล (เปิดในเครื่องอื่นของคุณ)</button><button type="button" class="btn" data-a="spMove">ย้ายที่เก็บข้อมูล</button><button type="button" class="btn" data-a="sbRotate">ยกเลิกลิงก์เชิญเดิมทั้งหมด</button>':''}</div>
  <p class="hint" style="margin-top:8px">ให้พนักงานเข้าใช้: ตั้งค่า › เข้าระบบด้วย PIN › กด <b>ลิงก์เชิญ</b> ข้างชื่อ แล้วส่งข้อความให้เขาทาง LINE · ไม่มีอินเทอร์เน็ต: ใช้งานต่อได้ ข้อมูลจะขึ้นคลาวด์เมื่อกลับมาออนไลน์</p></section>`}}
ACT.sbAdminLink=async()=>{let k;try{k=await sbCodes()}catch(e){toast(e.message);return}
  const link=sbLink({v:2,co:DB.co.name||'',sp:'sb',sc:SB.cid,k:k.admin,who:'admin',wn:'ผู้ดูแลระบบ'});
  dialog('ลิงก์ผู้ดูแล',`<p>เปิดลิงก์นี้ในคอมพิวเตอร์หรือมือถือ<b>ของคุณเอง</b> เครื่องนั้นจะเข้าถึงข้อมูลบริษัทแบบผู้ดูแลระบบ (ใช้ตอนเปลี่ยนเครื่องหรือเครื่องเดิมเสียด้วย)</p>
  <p class="hint" style="color:var(--bad,#C0392B)">ห้ามส่งลิงก์นี้ให้คนอื่น ใครมีลิงก์นี้เข้าถึงข้อมูลบริษัทได้ทั้งหมด เก็บไว้ในที่ปลอดภัย</p><textarea readonly rows="4" style="width:100%">${esc(link)}</textarea>`,'<button type="button" class="btn pri" data-a="joinCopy">คัดลอกลิงก์</button>')};
ACT.sbRotate=async()=>{if(!confirm('ยกเลิกลิงก์เชิญพนักงานที่ส่งไปแล้วทั้งหมด? เครื่องที่เข้าร่วมแล้วยังใช้ได้ตามเดิม คนที่ยังไม่ได้กดลิงก์ต้องได้ลิงก์ใหม่'))return;
  try{await sbCodes(true);toast('ยกเลิกลิงก์เชิญเดิมแล้ว ส่งลิงก์เชิญใหม่ได้ที่ ตั้งค่า › เข้าระบบด้วย PIN')}catch(e){toast(e.message)}};
// invite link for the cloud: a code instead of a folder, works on a phone too
{const f=ACT.joinLink;ACT.joinLink=async b=>{if(!sbOn())return f(b);const id=b.dataset.id,st=CO().staff.find(x=>x.id===id)||{};let k;try{k=await sbCodes()}catch(e){toast(e.message);return}
  const o={v:2,co:DB.co.name||'',sp:'sb',sc:SB.cid,k:k.staff,who:id||'',wn:st.name||st.code||''},link=sbLink(o),
    t=`เชิญเข้าใช้ PENUM PM ของ ${o.co}\nสวัสดีคุณ ${o.wn}\n\n1) เปิดลิงก์นี้ (คอมพิวเตอร์หรือมือถือก็ได้)\n${link}\n2) กดปุ่ม "เข้าร่วม ${o.co}"\n3) เลือกชื่อของคุณ ใส่ PIN ที่ได้รับ แล้วกด เข้าใช้งาน\n\nไม่ต้องตั้งค่าหรือเลือกที่เก็บข้อมูลเอง`;
  dialog('ลิงก์เชิญพนักงาน',`<p>ส่งข้อความนี้ให้ <b>${esc(o.wn||'พนักงาน')}</b> ทาง LINE หรืออีเมล เขากดลิงก์แล้วเข้าใช้ได้เลย</p>${st.pin?'':'<p class="hint" style="color:var(--bad,#C0392B)">ยังไม่ได้ตั้ง PIN ให้คนนี้ ตั้งก่อน ไม่อย่างนั้นจะเข้าใช้งานไม่ได้</p>'}
  <p class="hint">ลิงก์นี้ใช้เข้าร่วมบริษัทได้ ส่งเฉพาะพนักงานของบริษัท · ยกเลิกลิงก์ที่ส่งไปแล้วได้ที่ ตั้งค่า › ที่เก็บข้อมูล</p><textarea readonly rows="8" style="width:100%">${esc(t)}</textarea>`,'<button type="button" class="btn pri" data-a="joinCopy">คัดลอกข้อความ</button>')}}
{const f=joinView;joinView=function(o){if(o.sp!=='sb')return f(o);
  return `<section class="card wl"><div class="wl-h"><h1>เข้าร่วม ${esc(o.co)}</h1><p>${o.wn?`สวัสดีคุณ ${esc(o.wn)} · `:''}${o.who==='admin'?'ลิงก์ผู้ดูแลระบบ เครื่องนี้จะเข้าถึงข้อมูลบริษัทแบบผู้ดูแล':'ผู้ดูแลระบบเชิญให้ใช้ PENUM PM ไม่ต้องตั้งค่าหรือเลือกที่เก็บข้อมูลเอง'}</p></div>
  ${sbReady()?`<ol style="padding-left:20px;line-height:1.9"><li>กดปุ่มด้านล่าง</li><li>เลือกชื่อของคุณ ใส่ PIN แล้วกด <b>เข้าใช้งาน</b></li></ol>
  <div class="row" style="margin-top:10px"><button type="button" class="btn pri" data-a="sbJoin">เข้าร่วม ${esc(o.co)}</button></div>`:'<p>ลิงก์นี้ใช้ไม่ได้กับ PENUM PM รุ่นนี้ กด Ctrl+F5 แล้วเปิดลิงก์อีกครั้ง</p>'}
  <p style="margin-top:14px"><button type="button" class="btn ghost sm" data-a="joinCancel">ยกเลิก</button></p></section>`}}
ACT.sbJoin=async b=>{const o=joinP();if(!o||o.sp!=='sb')return;if(b){b.disabled=true;b.textContent='กำลังเชื่อมข้อมูล…'}
  try{const r=await sbRpc('pm_join',{p_company:o.sc,p_code:o.k,p_label:o.wn||''});SB.cid=r.id;SB.role=r.role;SB.who=r.role==='staff'?(o.who||''):'';SB.on=true;sbSave();
    try{localStorage.setItem(SPLS,'sb')}catch(e){}
    FS.h=SBD(SB.cid);CL.dirName='คลาวด์ PENUM';CL.dirMtime=0;CL.dirPh=[];CL.dirBk='';clSave();
    await baseSet(payload());await folderSync(true);if(FS.state==='err')throw new Error(FS.msg);
    joinClear();if(o.who&&o.who!=='admin'){PINAUTH={last:o.who};authSave()}S.noWelcome=true;saveUI();toast(`เชื่อมข้อมูล ${r.name||o.co} แล้ว${pinOn()?' เลือกชื่อและใส่ PIN':''}`);render()}
  catch(e){const m=String(e.message||e);alert(/bad code|no such/i.test(m)?'ลิงก์นี้ถูกยกเลิกแล้ว ขอลิงก์ใหม่จากผู้ดูแลระบบ':'เชื่อมข้อมูลไม่ได้\n'+m);if(b){b.disabled=false;b.textContent='เข้าร่วม '+o.co}}};
Object.assign(SBKW,{'co.coset':(SBKW['co.coset']||'')+' คลาวด์ cloud ลิงก์ผู้ดูแล'});
/* --- 3.53 "นำบริษัทนี้ออกจากเครื่องนี้": forget this browser's copy of the open company, nothing else ---
   Shared storage (cloud or folder) is synced first and must succeed; data kept only in this browser is downloaded as a
   backup file first. Only this slot's own keys and its own photo database are removed, never the cloud or the folder. */
const SLOTKEYS=['penum.pm.v1','penum.pm.cloud','penum.pm.auth','penum.pm.mobile','penum.pm.ui','pmBlSort','pmSyncP','pmSB'];
function coWhere(){return sbOn()?'cloud':folderOn()?'folder':cloudOn()?'od':'local'}
ACT.coLeave=async()=>{if(DEMOPG){toast('หน้านี้เป็นบริษัทตัวอย่าง');return}const w=coWhere(),nm=DB.co.name||'บริษัทนี้';let extra='';
  if(w==='cloud'&&SB.role==='admin'){try{const k=await sbCodes();extra=`<p class="sp-n sp-w">⚠ เครื่องนี้เป็นเครื่องผู้ดูแลระบบ ก่อนนำออก <b>เก็บลิงก์ผู้ดูแลไว้</b> (คัดลอกแล้ววางในที่ปลอดภัย) เพื่อกลับเข้ามาภายหลัง</p><textarea readonly rows="3" style="width:100%">${esc(sbLink({v:2,co:DB.co.name||'',sp:'sb',sc:SB.cid,k:k.admin,who:'admin',wn:'ผู้ดูแลระบบ'}))}</textarea>`}catch(e){extra='<p class="sp-n sp-w">⚠ อ่านลิงก์ผู้ดูแลไม่ได้ (ออฟไลน์?) ลองใหม่เมื่อมีอินเทอร์เน็ต</p>'}}
  const where={cloud:'ข้อมูลอยู่บน <b>คลาวด์ PENUM</b> ครบ ไม่ถูกลบ กลับมาใช้ได้ด้วยลิงก์เชิญหรือลิงก์ผู้ดูแล',folder:`ข้อมูลอยู่ในโฟลเดอร์ <b>${esc(CL.dirName||'')}</b> ครบ ไม่ถูกลบ กลับมาใช้ได้โดยเลือกโฟลเดอร์นี้อีกครั้ง`,od:'ข้อมูลอยู่บน OneDrive ไม่ถูกลบ',
    local:'<b>ข้อมูลของบริษัทนี้อยู่ในเบราว์เซอร์นี้ที่เดียว</b> ระบบจะดาวน์โหลดไฟล์สำรองให้ก่อน เก็บไฟล์นั้นไว้ให้ดี (นำกลับมาได้ด้วย "นำเข้าข้อมูล")'}[w];
  dialog('นำบริษัทนี้ออกจากเครื่องนี้',`<p>ลบเฉพาะสำเนาของ <b>${esc(nm)}</b> ที่เก็บไว้ในเบราว์เซอร์นี้ (ให้เครื่องนี้เลิกจำบริษัทนี้)</p><p>${where}</p>${extra}
    <p class="hint">บริษัทอื่นในเครื่องนี้ไม่ถูกแตะ · ใช้เมื่อเลิกใช้เครื่องนี้ ยืมเครื่องคนอื่น หรือทดลองเสร็จแล้ว</p>`,
    `<button type="button" class="btn pri" data-a="coLeaveGo">${w==='local'?'ดาวน์โหลดไฟล์สำรอง แล้วนำออก':'นำออกจากเครื่องนี้'}</button>`)};
ACT.coLeaveGo=async b=>{const w=coWhere();if(b){b.disabled=true;b.textContent='กำลังบันทึกข้อมูลล่าสุด…'}
  try{if(w==='cloud'||w==='folder'){FS.busy=false;await folderSync(true);if(FS.state!=='ok')throw new Error(FS.msg||'บันทึกไม่สำเร็จ')}
    else if(w==='od'){if(typeof cloudPush==='function')await cloudPush()}
    else{await ACT.backup();if(!confirm('ดาวน์โหลดไฟล์สำรองแล้ว ตรวจว่าไฟล์อยู่ในโฟลเดอร์ ดาวน์โหลด แล้วกด ตกลง เพื่อนำบริษัทนี้ออกจากเครื่องนี้'))throw new Error('')}}
  catch(e){if(e.message)alert('ยังนำออกไม่ได้: บันทึกข้อมูลล่าสุดไม่สำเร็จ\n'+e.message+'\n\nตรวจอินเทอร์เน็ตแล้วลองใหม่ ข้อมูลยังอยู่ครบ');if(b){b.disabled=false;b.textContent='นำออกจากเครื่องนี้'}return}
  // stop every writer, then remove this slot's own keys and photo store only
  window.__coDrop=1;FS.busy=true;clearTimeout(saveT);save=function(){};
  for(const k of SLOTKEYS)try{localStorage.removeItem(k+DSFX)}catch(e){}
  for(const k of ['pmLicPend','pmJoin'])try{sessionStorage.removeItem(k+DSFX)}catch(e){}
  try{IDB.db&&(await IDB.db).close()}catch(e){}try{indexedDB.deleteDatabase('penum-pm'+DSFX)}catch(e){}
  const rest=coSlots().filter(x=>x!==COSLOT&&localStorage.getItem('penum.pm.v1'+(x?'.c'+x:''))),nx=rest[0]||'';
  try{sessionStorage.setItem('pmSlot',nx);localStorage.setItem('penum.pm.slot',nx)}catch(e){}
  location.replace(location.pathname)};
{const f=ACT.coPick;ACT.coPick=function(){f.apply(this,arguments);const ft=$('#dlg .ft');if(ft&&!DEMOPG)ft.insertAdjacentHTML('afterbegin',`<button type="button" class="btn ghost" data-a="coLeave">นำบริษัทนี้ออกจากเครื่องนี้</button>`)}}
{const f=spCard;spCard=function(){return f().replace(/(<button type="button" class="btn" data-a="fOff">[^<]*<\/button>|<button type="button" class="btn" data-a="sbRotate">[^<]*<\/button>)<\/div>/,(m,x)=>`${x}<button type="button" class="btn" data-a="coLeave">นำบริษัทนี้ออกจากเครื่องนี้</button></div>`)}}
/* --- 3.54 a new company needs an activation code: an empty company without a code shows only the ways in ---
   ORIEN's own data (has records, no code) and the sample page stay as they are. Client-side only, like the rest of the licence. */
const licGate=()=>!DEMOPG&&!DB.co.lic&&dbEmpty()&&!S.wiz&&!sbOn();
function licGateView(){const ph=typeof mobileMode==='function'&&mobileMode(),c=(a,t,s,x='')=>`<button type="button" class="wl-c${x}" data-a="${a}"><b>${t}</b><span>${s}</span></button>`;
  return `<section class="card wl" id="licGate"><div class="wl-h"><h1>ใส่รหัสเปิดใช้งานก่อนเริ่มใช้</h1><p>บริษัทใหม่ใน PENUM PM ต้องมีรหัสเปิดใช้งานจากผู้ให้บริการ (ได้ทางอีเมลหรือ LINE) ถ้าได้รับเป็นลิงก์ ให้กดลิงก์นั้น รหัสจะใส่ไว้ให้เอง</p></div>
  <div class="wl-g">${c('wizStart','ใส่รหัสเปิดใช้งาน','วางรหัสที่ได้รับ แล้วตั้งค่าบริษัทและ PIN ผู้ดูแล',' pri')}
  ${ph?c('mPull','⬇ รับข้อมูลจากบริษัท','มือถือของพนักงาน รับข้อมูลบริษัทที่ใช้ PENUM PM อยู่แล้ว'):fsOK()?c('fPick','เชื่อมโฟลเดอร์ที่มีข้อมูลบริษัทอยู่แล้ว','เครื่องใหม่ของบริษัทที่ใช้ PENUM PM อยู่แล้ว'):''}
  ${c('restore','เปิดไฟล์สำรอง','ไฟล์ PENUM-PM-วันที่.json ที่ดาวน์โหลดไว้')}${c('loadDemo','ลองด้วยข้อมูลตัวอย่าง','เปิดบริษัทตัวอย่างในอีกแท็บ ไม่ต้องใช้รหัส')}</div>
  ${coSlots().length>1?'<p style="margin-top:14px"><button type="button" class="btn ghost sm" data-a="coPick">กลับไปบริษัทอื่นในเครื่องนี้</button></p>':''}</section>`}
// "ข้ามไปก่อน" no longer leaves an empty company open for use
{const f=welcomeView;welcomeView=function(){const h=f.apply(this,arguments);return DEMOPG||DB.co.lic?h:h.replace(/<p style="margin-top:14px"><button type="button" class="btn ghost sm" data-a="wlSkip">[^<]*<\/button><\/p>/,'')}}
{const r=render;render=function(){const x=r.apply(this,arguments);try{if(typeof DB==='undefined'||!DB||!licGate()||(typeof pinOn==='function'&&pinOn()&&!authOK()))return x;
  const v=$('#view');if(!v||v.querySelector('#licGate'))return x;v.innerHTML=licGateView()}catch(e){console.error(e)}return x}}

// 3.55 a new place on the cloud needs a valid, current activation code (ORIEN's own data, which has records and no code, may move too)
// records, not just a typed company name
const noRecs=()=>{const n=DB.co.name;DB.co.name='';try{return dbEmpty()}finally{DB.co.name=n}};
{const f=ACT.sbStart;ACT.sbStart=async b=>{if(!(SB.cid&&SB.role==='admin')&&!DEMOPG){const st=licState();
  if(st==='wait'){toast('กำลังตรวจรหัสเปิดใช้งาน ลองกดอีกครั้ง');return}
  if(DB.co.lic?!['ok','warn','grace'].includes(st):noRecs()){dialog('ต้องมีรหัสเปิดใช้งานก่อน',`<p>การเก็บข้อมูลบนคลาวด์ PENUM ใช้ได้กับบริษัทที่มีรหัสเปิดใช้งานที่ยังไม่หมดอายุ</p><p class="hint">ใส่หรือต่ออายุรหัสที่ ตั้งค่า › สิทธิ์การใช้งาน หรือติดต่อผู้ให้บริการ PENUM PM</p>`,'');return}}
  return f(b)}}
// 3.57 a phone on the cloud keeps the field shortcuts and the install card (no file send/receive: the cloud saves by itself)
{const f=CVIEWS.exec;CVIEWS.exec=()=>{const h=f();if(mobileMode()||!isPhone()||!sbOn())return h;
  return mobCard().replace(mobSync(),'<p class="hint" style="margin:10px 0 0">บันทึกขึ้นคลาวด์ PENUM ให้อัตโนมัติ ไม่ต้องกดส่งงาน</p>')+instCard()+h}}
// a staff device that joined by invite link never gets the admin view, even while the company has PIN sign-in off
function sbStaffLock(){return sbOn()&&SB.role==='staff'&&!pinOn()}
// a device that joined before 3.52.5 did not keep the name; the sign-in pre-selection set at join time has it
if(sbOn()&&SB.role==='staff'&&!SB.who){try{const w=PINAUTH&&PINAUTH.last;if(w&&w!=='__admin'&&w!=='admin'){SB.who=w;sbSave()}}catch(e){}}
{const r=render;render=function(){if(sbStaffLock()&&S.me!==(SB.who||'__none'))S.me=SB.who||'__none';const x=r.apply(this,arguments);
  if(sbStaffLock()){const us=$('#userSel');if(us){us.disabled=true;us.title='เครื่องพนักงาน: ใช้งานในชื่อของคุณเท่านั้น';us.querySelectorAll('option[value=""]').forEach(o=>o.remove())}}return x}}
// the invite needs PIN sign-in on, otherwise anyone at the staff member's device signs in as them without a PIN
{const f=ACT.joinLink;ACT.joinLink=async function(b){await f.apply(this,arguments);if(!pinOn()){const d=$('#dlg .bd');if(d)d.insertAdjacentHTML('afterbegin','<p class="sp-n sp-w">⚠ ยังไม่ได้เปิด <b>เข้าระบบด้วย PIN</b> พนักงานจะเข้าใช้ได้โดยไม่ต้องใส่ PIN (แต่เห็นเฉพาะส่วนของตัวเอง) แนะนำให้เปิดก่อน: กดปุ่มด้านล่าง</p>');const ft=$('#dlg .ft');if(ft)ft.insertAdjacentHTML('afterbegin','<button type="button" class="btn" data-a="pinToggle">เปิดใช้การเข้าระบบด้วย PIN</button>')}}}
// the old OneDrive-sign-in card (Microsoft app registration) only confuses a company already on the cloud or a folder
{const f=CVIEWS.coset;CVIEWS.coset=function(){const h=f.apply(this,arguments);return (sbOn()||folderOn())&&!cloudOn()?h.replace(/<section class="card" id="cloudCard">[\s\S]*?<\/section>/,''):h}}
// a cloud invite opened on a phone (where there is no welcome screen) still shows the join screen
{const r=render;render=function(){const x=r.apply(this,arguments);try{const o=joinP(),v=$('#view');if(o&&o.sp==='sb'&&!sbOn()&&v&&!v.querySelector('[data-a=sbJoin]')&&!(pinOn()&&!authOK()))v.innerHTML=joinView(o)}catch(e){}return x}}

