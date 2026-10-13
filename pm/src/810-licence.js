/* ---------- 3.46 รหัสเปิดใช้งาน (licence code per customer company) ----------
   We register each customer (company, administrator, e-mail, plan, users, expiry) and send a signed code, usually as a
   link …/pm/#lic=<code>. The code is "PNM1.<payload>.<signature>", ECDSA P-256 over "PNM1.<payload>", checked here with
   the public key only, so a changed company name or date makes it invalid. The code lives in DB.co.lic and travels with
   the data, so every device (folder, phone, backup) re-checks it. Data without a code (ORIEN's own) and the demo are free.
   After expiry + 7 days the data turns read-only: viewing, printing and backup download keep working, nothing is deleted. */
const LIC_JWK={kty:'EC',crv:'P-256',x:'wyXLWhvzv-0vF50q9rOZ8sMoh2QIg9Nsr_5IpR8f7jo',y:'BI9uqpJjjWVmVLaEgAfXkpOXtdU-Ec7I-zQRJyUeDp4',ext:true,key_ops:['verify']};
const LIC_PLAN={pilot:'ทดลองใช้ (Pilot)',starter:'Starter',std:'Standard',biz:'Business',ent:'Enterprise',rent:'เช่ารายเดือน'};
const LIC_GRACE=7,LIC_WARN=30;
const licB64=s=>{s=String(s).replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
let LICK=null;const LICV={};
// → {ok:true,p} or {ok:false,err}
async function licCheck(code){code=String(code||'').replace(/\s+/g,'').replace(/^.*#lic=/,'');if(!code)return {ok:false,err:'empty'};if(LICV[code])return LICV[code];
  let r;try{const m=code.match(/^PNM1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/);if(!m)throw 0;
    LICK=LICK||await crypto.subtle.importKey('jwk',LIC_JWK,{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
    const ok=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},LICK,licB64(m[2]),new TextEncoder().encode('PNM1.'+m[1]));if(!ok)throw 0;
    const p=JSON.parse(new TextDecoder().decode(licB64(m[1])));if(p.v!==1||!p.co||!okD(p.exp))throw 0;r={ok:true,p,code}}
  catch(e){r={ok:false,err:'bad',code}}
  return LICV[code]=r}
// revoked licence ids, published by ORIEN in files/revoked.json; the last list seen is kept so it also applies offline
let LICREV=(()=>{try{return JSON.parse(localStorage.getItem('penum.revoked')||'[]')}catch(e){return []}})();
// 3.66: an entry is a serial number, a customer code (all of its codes), or "customer code<YYYY-MM-DD" (only its codes issued before that day,
// used when a customer code was reused: L26-0004 was a deleted test company's code before ORIEN was given it on 2026-10-12)
const licRevHit=(x,p)=>{const id=String(p.id),m=/^(.+)<(\d{4}-\d\d-\d\d)$/.exec(x);
  if(m)return (m[1]===id||m[1]===id.replace(/-R\d+$/,''))&&String(p.iat||'')<m[2];
  return x===p.no||x===id||x===p.sn||x===id.replace(/-R\d+$/,'')};
{const v=r=>r.ok&&LICREV.some(x=>licRevHit(x,r.p))?Object.assign({},r,{ok:false,err:'rev'}):r;const f=licCheck;licCheck=async c=>v(await f(c))}
// 3.73 one company code can open several PENUM programs: payload.ap lists them (["pm","mep","bim"]); a code without ap is PENUM PM only.
// PM takes only a code that includes PM; the rest are for PENUM MEP and BIM (shared/licence.js), which read the codes a device holds
// from 'penum.licences', where PM also puts its company's code, so a code with MEP or BIM is not typed again there.
const LIC_APPS={pm:'PENUM PM',mep:'PENUM MEP',bim:'PENUM BIM'};
const licAp=p=>Array.isArray(p&&p.ap)&&p.ap.length?p.ap.map(String):['pm'];
const licApTxt=p=>licAp(p).map(a=>LIC_APPS[a]||a).join(' · ');
{const f=licCheck;licCheck=async c=>{const r=await f(c);return r.ok&&!licAp(r.p).includes('pm')?Object.assign({},r,{ok:false,err:'app'}):r}}
const LICDEV='penum.licences';
const licPeek=c=>{try{return JSON.parse(new TextDecoder().decode(licB64(String(c).split('.')[1])))}catch(e){return null}};
// one code per customer, the newest (the same rule as shared/licence.js)
function licDevAdd(code){code=String(code||'').replace(/\s+/g,'').replace(/^.*#lic=/,'');const p=licPeek(code);if(!p||!p.co)return;try{
  let L=JSON.parse(localStorage.getItem(LICDEV)||'[]');if(!Array.isArray(L))L=[];if(L.includes(code))return;
  const who=q=>String(q.id||'').replace(/-R\d+$/,'')||q.co,rk=q=>String(q.iat||'')+'|'+String(q.exp||''),same=L.filter(c=>{const q=licPeek(c);return !q||who(q)===who(p)});
  if(same.some(c=>{const q=licPeek(c);return q&&rk(q)>rk(p)}))return;localStorage.setItem(LICDEV,JSON.stringify(L.filter(c=>!same.includes(c)).concat(code)))}catch(e){}}
const licDevCodes=()=>{try{const L=JSON.parse(localStorage.getItem(LICDEV)||'[]');return (Array.isArray(L)?L:[]).map(c=>({c,p:licPeek(c)})).filter(x=>x.p&&x.p.co&&licAp(x.p).includes('pm'))}catch(e){return []}};
const licOpenApps=p=>licAp(p).filter(a=>a!=='pm').map(a=>`<a class="btn sm" href="../${a}/" target="penum-${a}">เปิด ${esc(LIC_APPS[a]||a)}</a>`).join(' ');
if(!DEMOPG)fetch('files/revoked.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j||!Array.isArray(j.ids))return;const L=j.ids.map(String);
  if(JSON.stringify(L)===JSON.stringify(LICREV))return;LICREV=L;try{localStorage.setItem('penum.revoked',JSON.stringify(L))}catch(e){}LIC={code:null,r:null};render()}).catch(()=>{});
// the state of this data set, kept up to date by render (checking is async, so the last result is cached)
let LIC={code:null,r:null};
const licOn=()=>!DEMOPG&&!!(DB&&DB.co&&DB.co.lic);
function licState(){if(!licOn())return 'none';if(LIC.code!==DB.co.lic||!LIC.r)return 'wait';if(!LIC.r.ok)return LIC.r.err==='rev'?'rev':'bad';
  const d=diffD(today(),LIC.r.p.exp);return d<-LIC_GRACE?'ro':d<0?'grace':d<=LIC_WARN?'warn':'ok'}
const licRO=()=>{const s=licState();return s==='ro'||s==='bad'||s==='rev'};
const licP=()=>licOn()&&LIC.r&&LIC.r.ok&&LIC.code===DB.co.lic?LIC.r.p:null;
const licUsed=()=>1+CO().staff.filter(s=>s.active!==false&&s.pin).length;
const licMax=()=>{const p=licP();return p&&n(p.mx)>0?n(p.mx):0};
let LOCKSNAP=null,LOCKDB=null;
function licSync(){if(!licOn()){LIC={code:null,r:null};LOCKSNAP=null;return}if(LIC.code===DB.co.lic&&LIC.r)return;const code=DB.co.lic;LIC={code,r:null};
  licCheck(code).then(r=>{if(DB.co.lic!==code)return;LIC={code,r};LOCKSNAP=licRO()?JSON.stringify(DB):null;LOCKDB=DB;render()})}

/* --- 1) a link with #lic= : keep the code for this tab, drop it from the address bar --- */
const LICSK='pmLicPend'+DSFX;
{const m=location.hash.match(/(?:^#|&)lic=([^&]+)/);if(m){try{sessionStorage.setItem(LICSK,decodeURIComponent(m[1]))}catch(e){}history.replaceState(null,'',location.pathname+location.search)}}
const licPend=()=>{try{return sessionStorage.getItem(LICSK)||''}catch(e){return ''}};
const licPendClear=()=>{try{sessionStorage.removeItem(LICSK)}catch(e){}};
let LICHASH=!!licPend();
function licFromLink(){if(!LICHASH||DEMOPG)return;LICHASH=false;
  if(dbEmpty()&&!DB.co.lic&&!folderOn()&&!cloudOn()){S.wiz=true;S.wizNew=true;S.noWelcome=false;DB.co.pfx=DB.co.pfx||{};return}
  const other=()=>setTimeout(()=>dialog('รหัสเปิดใช้งาน',`<p>ลิงก์นี้เป็นของบริษัทอื่น ส่วนเครื่องนี้มีข้อมูลของ <b>${esc(DB.co.name||'บริษัทเดิม')}</b> อยู่แล้ว</p><p class="hint">กด “เพิ่มเป็นบริษัทใหม่” ระบบจะเปิดบริษัทนี้แยกไว้อีกชุด ข้อมูลบริษัทเดิมอยู่ครบ ไม่ถูกลบ สลับไปมาได้ที่ชื่อบริษัทมุมซ้ายบน</p>`,
    `<button type="button" class="btn pri" data-a="coAddLic">เพิ่มเป็นบริษัทใหม่</button>`),60);
  const toCard=()=>{S.dept='set';pgGo(['co','coset','']);setTimeout(()=>{const c=$('#licCard');if(c)c.scrollIntoView({behavior:'smooth'})},80)};
  // the link always asks first: this company, a company in another slot, or a new one (3.49.1)
  const pend=licPend();Promise.all([licCheck(pend),licCheck(DB.co.lic||'')]).then(async([r,q])=>{const a=r&&r.p,b=q&&q.p||{};if(!a){other();return}
    if(b.id&&coBase(a.id)===coBase(b.id)){
      if(pend!==DB.co.lic&&(a.iat||0)>(b.iat||0)){toCard();return}
      licPendClear();setTimeout(()=>dialog('รหัสเปิดใช้งาน',`<p><b>${esc(DB.co.name||a.co)}</b> เปิดใช้งานในเครื่องนี้แล้ว ลิงก์นี้จึงพามาที่ข้อมูลเดิมของบริษัท ไม่ต้องตั้งค่าซ้ำ</p><p class="hint">ลิงก์ในอีเมลใช้ตั้งค่าครั้งแรกเท่านั้น ครั้งต่อไปเปิดโปรแกรมจากไอคอน PENUM PM ได้เลย ถ้าต้องการลองตั้งค่าใหม่ตั้งแต่ต้น กด “ตั้งค่าใหม่อีกชุด” ข้อมูลเดิมไม่ถูกลบ</p>`,
        `<button type="button" class="btn" data-a="coAddLicP" data-k="${esc(pend)}">ตั้งค่าใหม่อีกชุด</button><button type="button" class="btn pri" data-a="dlgClose">ใช้ข้อมูลเดิม</button>`),60);return}
    for(const sl of coSlots()){if(sl===COSLOT)continue;const c=coPeek(sl);if(!c.lic)continue;const z=await licCheck(c.lic);
      if(z&&z.p&&coBase(z.p.id)===coBase(a.id)){setTimeout(()=>dialog('รหัสเปิดใช้งาน',`<p><b>${esc(c.name||a.co)}</b> มีอยู่ในเครื่องนี้แล้ว (อีกชุดข้อมูล)</p><p class="hint">กด “ไปที่บริษัทนี้” เพื่อสลับไปใช้ข้อมูลของบริษัทนี้ ข้อมูลของ ${esc(DB.co.name||'บริษัทที่เปิดอยู่')} ไม่ถูกลบ</p>`,
        `<button type="button" class="btn pri" data-a="coSw" data-k="${sl}">ไปที่บริษัทนี้</button>`),60);licPendClear();return}}
    other()}).catch(()=>other())}
const coBase=id=>String(id||'').replace(/-R\d+$/,'');

/* --- 3.50 staff invite link: the admin sends #join=…, a staff member only picks the shared PENUM-PM folder ---
   No company setup and no choice of storage on the staff side: the link names the company, where the folder lives
   (OneDrive, Google Drive…), the folder's name and who is invited. Picking a folder without this company's data is refused. */
const JOINK='pmJoin'+DSFX;
const jEnc=t=>{const u=new TextEncoder().encode(t);let x='';u.forEach(c=>x+=String.fromCharCode(c));return btoa(x).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const jDec=t=>new TextDecoder().decode(Uint8Array.from(atob(t.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)));
{const m=location.hash.match(/(?:^#|&)join=([^&]+)/);if(m){try{sessionStorage.setItem(JOINK,m[1])}catch(e){}history.replaceState(null,'',location.pathname+location.search)}}
const joinP=()=>{try{const t=sessionStorage.getItem(JOINK);const o=t&&JSON.parse(jDec(t));return o&&o.co?o:null}catch(e){return null}};
const joinClear=()=>{try{sessionStorage.removeItem(JOINK)}catch(e){}};
function joinTxt(o,link){const p=SYNCP[o.sp]||SYNCP.od;
  return `เชิญเข้าใช้ PENUM PM ของ ${o.co}\nสวัสดีคุณ ${o.wn||''}\n\n`+
    (p.app?`1) เปิดอีเมลแชร์โฟลเดอร์ ${o.dir} จาก ${p.app} แล้วกด "เพิ่มทางลัดไปยังไฟล์ของฉัน" (ทำครั้งเดียว) และล็อกอินโปรแกรม ${p.app} บนคอมพิวเตอร์\n`:'1) ต่อคอมพิวเตอร์เข้ากับโฟลเดอร์กลางของบริษัท (ถามผู้ดูแลระบบ)\n')+
    `2) เปิดลิงก์นี้บนคอมพิวเตอร์ ด้วย Edge หรือ Chrome\n${link}\n3) กดปุ่ม "เลือกโฟลเดอร์ ${o.dir}" แล้วเลือกโฟลเดอร์ ${o.dir}${p.app?` ใน ${p.app}`:''}\n4) เลือกชื่อของคุณ ใส่ PIN ที่ได้รับ แล้วกด เข้าใช้งาน\n\nไม่ต้องตั้งค่าบริษัทหรือเลือกที่เก็บข้อมูลเอง`}
ACT.joinLink=async b=>{const id=b.dataset.id,st=CO().staff.find(x=>x.id===id)||{},k=spGet();
  if(k==='loc'){dialog('ลิงก์เชิญพนักงาน',`<p>บริษัทนี้เก็บข้อมูลแบบ <b>เฉพาะเครื่องนี้</b> พนักงานจึงใช้จากคอมพิวเตอร์เครื่องอื่นไม่ได้</p><p class="hint">ให้พนักงานใช้เครื่องนี้ (กด ออกจากระบบ แล้วเลือกชื่อและใส่ PIN) หรือเปลี่ยนที่เก็บเป็น OneDrive ที่ ตั้งค่า › โฟลเดอร์ข้อมูล PENUM-PM</p>`);return}
  if(!folderOn()){dialog('ลิงก์เชิญพนักงาน',`<p>ยังไม่ได้เชื่อมโฟลเดอร์ข้อมูล PENUM-PM ในเครื่องนี้ พนักงานเครื่องอื่นจึงยังเข้าไม่ได้</p><p class="hint">ไปที่ ตั้งค่า › โฟลเดอร์ข้อมูล PENUM-PM แล้วกด เลือกโฟลเดอร์ PENUM-PM ก่อน</p>`);return}
  const q=await licCheck(DB.co.lic||''),o={v:1,co:DB.co.name||'',cid:coBase(q&&q.p&&q.p.id),sp:k,dir:CL.dirName||'PENUM-PM',who:id||'',wn:st.name||st.code||''},
    link=location.origin+location.pathname+'#join='+jEnc(JSON.stringify(o)),t=joinTxt(o,link),p=SYNCP[k];
  dialog('ลิงก์เชิญพนักงาน',`<p>ส่งข้อความนี้ให้ <b>${esc(o.wn||'พนักงาน')}</b> ทาง LINE หรืออีเมล พนักงานไม่ต้องตั้งค่าบริษัทหรือเลือกที่เก็บข้อมูลเอง แค่เลือกโฟลเดอร์ที่แชร์ให้</p>
  ${p.app?`<p class="hint">ก่อนส่ง แชร์โฟลเดอร์ <b>${esc(o.dir)}</b> ให้พนักงานคนนี้ก่อน: ${p.share}</p>`:''}${st.pin?'':'<p class="hint" style="color:var(--bad,#C0392B)">ยังไม่ได้ตั้ง PIN ให้คนนี้ ตั้งก่อน ไม่อย่างนั้นจะเข้าใช้งานไม่ได้</p>'}
  <textarea readonly rows="9" style="width:100%">${esc(t)}</textarea>`,'<button type="button" class="btn pri" data-a="joinCopy">คัดลอกข้อความ</button>')};
ACT.joinCopy=async()=>{const ta=$('#dlg textarea');toast(ta&&await copyText(ta.value)?'คัดลอกแล้ว วางส่งทาง LINE หรืออีเมลได้เลย':'คัดลอกไม่ได้')};
{const f=CVIEWS.coset;CVIEWS.coset=()=>f().replace(/(<button type="button" class="btn sm" data-a="pinSet" data-id="([^"]+)">[^<]*<\/button>)/g,(m,b,id)=>id==='admin'?m:`${b} <button type="button" class="btn sm" data-a="joinLink" data-id="${id}">ลิงก์เชิญ</button>`)
  .replace('ตั้ง PIN ให้แต่ละคนแล้วบอกเขาเป็นการส่วนตัว','ตั้ง PIN ให้แต่ละคนแล้วบอกเขาเป็นการส่วนตัว · พนักงานที่ใช้คอมพิวเตอร์ของตัวเอง กด <b>ลิงก์เชิญ</b> แล้วส่งข้อความให้เขา')}
// the staff side: a join screen in place of the welcome screen (an empty device takes the folder as it is, like fPick without local data)
function joinView(o){const p=SYNCP[o.sp]||SYNCP.od;
  return `<section class="card wl"><div class="wl-h"><h1>เข้าร่วม ${esc(o.co)}</h1><p>${o.wn?`สวัสดีคุณ ${esc(o.wn)} · `:''}ผู้ดูแลระบบเชิญให้ใช้ PENUM PM ไม่ต้องตั้งค่าบริษัทหรือเลือกที่เก็บข้อมูลเอง</p></div>
  ${o.sp==='loc'?'<p>ข้อมูลของบริษัทนี้อยู่ในคอมพิวเตอร์ของผู้ดูแลระบบเครื่องเดียว ให้ใช้งานที่เครื่องนั้น</p>':fsOK()?`<ol style="padding-left:20px;line-height:1.9">
    ${p.app?`<li>ตรวจว่ากด <b>เพิ่มทางลัดไปยังไฟล์ของฉัน</b> ในอีเมลแชร์โฟลเดอร์ <b>${esc(o.dir)}</b> แล้ว และโปรแกรม <b>${esc(p.app)}</b> บนเครื่องนี้ล็อกอินอยู่</li>`:'<li>ตรวจว่าเครื่องนี้ต่อกับโฟลเดอร์กลางของบริษัทแล้ว</li>'}
    <li>กดปุ่มด้านล่าง ในหน้าต่างที่เปิดขึ้น กด <b>${esc(p.app||'พีซีเครื่องนี้')}</b> ทางซ้าย › เลือกโฟลเดอร์ <b>${esc(o.dir)}</b> › กด <b>เลือกโฟลเดอร์</b> › กด <b>แก้ไขไฟล์</b></li>
    <li>เลือกชื่อของคุณ ใส่ PIN แล้วกด <b>เข้าใช้งาน</b></li></ol>
    <div class="row" style="margin-top:10px"><button type="button" class="btn pri" data-a="joinPick">เลือกโฟลเดอร์ ${esc(o.dir)}</button></div>`
    :'<p>เปิดลิงก์นี้บน<b>คอมพิวเตอร์</b> ด้วย Edge หรือ Chrome · ถ้าใช้มือถือ ให้ทำตามคู่มือส่วนที่ 3 (รับข้อมูลจากบริษัท)</p>'}
  <p style="margin-top:14px"><button type="button" class="btn ghost sm" data-a="joinCancel">ยกเลิก</button></p></section>`}
ACT.joinCancel=()=>{joinClear();render()};
ACT.joinPick=async()=>{const o=joinP();if(!o)return;let h;try{h=await showDirectoryPicker({id:'penum-pm',mode:'readwrite'})}catch(e){return}
  const c=await fRead(h,FNAME);let j=null;try{j=c&&JSON.parse(c.txt||'null')}catch(e){}
  if(!j||!j.co){alert(`โฟลเดอร์ “${h.name}” ยังไม่มีข้อมูลของ ${o.co}\nเลือกโฟลเดอร์ ${o.dir} ที่ผู้ดูแลระบบแชร์ให้ (ถ้ายังไม่เห็น ให้รอโปรแกรม ${(SYNCP[o.sp]||{}).app||'ซิงก์'} โหลดเสร็จก่อน)`);return}
  const fn=(j.co.name||'').trim();if(fn&&o.co&&fn!==o.co.trim()&&!confirm(`โฟลเดอร์นี้เป็นข้อมูลของ “${fn}” ไม่ใช่ “${o.co}” ใช้โฟลเดอร์นี้ต่อไหม?`))return;
  try{if(o.sp)localStorage.setItem(SPLS,o.sp)}catch(e){}
  await IDB.put('__dirh',h);FS.h=h;CL.dirName=h.name;CL.dirMtime=0;CL.dirPh=[];CL.dirBk='';clSave();
  await baseSet(payload());await folderSync(true);joinClear();PINAUTH={last:o.who||''};authSave();S.noWelcome=true;saveUI();toast(`เชื่อมข้อมูล ${fn||o.co} แล้ว เลือกชื่อและใส่ PIN`);render()};
{const f=welcomeView;welcomeView=function(){const o=joinP();return o?joinView(o):f()}}
// a join link opened where a company is already open: the same company just goes to sign-in, another one gets its own slot
setTimeout(()=>{const o=joinP();if(!o||DEMOPG)return;const C=DB.co;if(dbEmpty()&&!C.lic&&!folderOn()&&!cloudOn()){S.noWelcome=false;render();return}
  // the same company is already here (usually the admin testing the link on their own computer): explain, sign no one out
  if((C.name||'').trim()===o.co.trim()){joinClear();const nm=o.wn||'พนักงาน';
    dialog('ลิงก์เชิญพนักงาน',`<p>เครื่องนี้ใช้ <b>${esc(o.co)}</b> อยู่แล้ว ไม่ต้องเข้าร่วมอีก</p><p>ลิงก์นี้มีไว้ให้ <b>${esc(nm)}</b> เปิดใน<b>มือถือหรือคอมพิวเตอร์ของเขาเอง</b></p>
      <p class="hint">อยากลองว่าลิงก์ใช้ได้: เปิดลิงก์ในมือถือ หรือในหน้าต่างส่วนตัวของเบราว์เซอร์ (Edge: Ctrl+Shift+N · Chrome: Ctrl+Shift+N) แล้ววางลิงก์</p>`,
      o.who&&o.who!=='admin'&&pinOn()?`<button type="button" class="btn" data-a="joinAsHere" data-k="${esc(o.who)}">เปลี่ยนเป็น ${esc(nm)} บนเครื่องนี้</button>`:'');return}
  const t=sessionStorage.getItem(JOINK);
  dialog('ลิงก์เชิญพนักงาน',`<p>ลิงก์นี้เชิญเข้าร่วม <b>${esc(o.co)}</b> ส่วนเครื่องนี้มีข้อมูลของ <b>${esc(C.name||'บริษัทอื่น')}</b> อยู่แล้ว</p><p class="hint">กด “เข้าร่วมเป็นอีกบริษัท” ข้อมูลเดิมในเครื่องไม่ถูกลบ สลับไปมาได้ที่ชื่อบริษัทมุมซ้ายบน</p>`,
    `<button type="button" class="btn pri" data-a="joinSlot" data-k="${esc(t)}">เข้าร่วมเป็นอีกบริษัท</button>`)},120);
ACT.joinAsHere=b=>{PINAUTH={last:b.dataset.k};authSave();$('#dlg').close();render()};
ACT.joinSlot=b=>{const t=b.dataset.k;joinClear();const sl=coNewSlot();try{sessionStorage.setItem('pmJoin'+(sl?'.c'+sl:''),t)}catch(e){}coGo(sl)};

/* --- several companies on one device (3.49): pick one from the company name at the top of the side menu ---
   Each company lives in its own storage slot (COSLOT, see storage). Nothing in another slot is read except its name
   and logo for the list, and nothing is ever deleted here. */
function coSlots(){const r=[];try{for(let i=0;i<localStorage.length;i++){const m=/^penum\.pm\.v1(?:\.c(\d+))?$/.exec(localStorage.key(i)||'');if(m)r.push(m[1]||'')}}catch(e){}
  if(!r.includes(COSLOT))r.push(COSLOT);return r.sort((a,b)=>(+a||1)-(+b||1))}
function coPeek(sl){if(sl===COSLOT)return {name:DB.co.name,logo:DB.co.logo,lic:DB.co.lic};try{const d=JSON.parse(localStorage.getItem('penum.pm.v1'+(sl?'.c'+sl:''))||'null');const c=d&&d.co||{};return {name:c.name,logo:c.logo,lic:c.lic}}catch(e){return {}}}
function coGo(sl,pend){const blank=COSLOT&&!DB.co.lic&&!DB.co.setupAt&&dbEmpty()&&!folderOn()&&!cloudOn();try{sessionStorage.setItem('pmSlot',sl);localStorage.setItem('penum.pm.slot',sl);if(pend)sessionStorage.setItem('pmLicPend'+(sl?'.c'+sl:''),pend)}catch(e){toast('สลับบริษัทไม่ได้');return}
  // a company slot that was added but never set up leaves no entry behind in the list
  if(blank){window.__coDrop=1;clearTimeout(saveT);try{localStorage.removeItem(KEY)}catch(e){}}else save(true);location.reload()}
const coNewSlot=()=>String(Math.max(1,...coSlots().map(x=>+x||1))+1);
ACT.coPick=()=>{if(DEMOPG){toast('หน้านี้เป็นบริษัทตัวอย่าง');return}const L=coSlots();
  dialog('เลือกบริษัท',`<div class="co-l">${L.map(sl=>{const c=coPeek(sl);return `<button type="button" data-a="coSw" data-k="${sl}"${sl===COSLOT?' class="on" aria-current="true"':''}>${c.logo?`<img src="${esc(c.logo)}" alt="">`:'<span class="mark">P</span>'}<span><b>${esc(c.name||'(ยังไม่ได้ตั้งค่าบริษัท)')}</b><small>${sl===COSLOT?'กำลังใช้อยู่':'กดเพื่อสลับไปบริษัทนี้'}</small></span>${sl===COSLOT?'<span class="ck">✓</span>':''}</button>`}).join('')}</div>
  <p class="hint">ข้อมูลแต่ละบริษัทแยกกัน รวมถึงโฟลเดอร์ที่เก็บข้อมูล ผู้ใช้และ PIN การสลับบริษัทไม่ลบข้อมูลใดๆ</p>`,
  '<button type="button" class="btn pri" data-a="coAdd">+ เพิ่มบริษัท</button>')};
ACT.coSw=b=>{const sl=b.dataset.k;if(sl===COSLOT){$('#dlg').close();return}coGo(sl)};
ACT.coAdd=()=>dialog('เพิ่มบริษัท',`<p>ระบบจะเปิดบริษัทใหม่แยกไว้อีกชุด เริ่มจากหน้าว่าง แล้วพาตั้งค่าบริษัท (วางรหัสเปิดใช้งาน ตั้ง PIN เลือกที่เก็บข้อมูล)</p>
  <p class="hint">ข้อมูลของ <b>${esc(DB.co.name||'บริษัทนี้')}</b> อยู่ครบเหมือนเดิม กลับมาได้ที่ชื่อบริษัทมุมซ้ายบน · ตอนเลือกที่เก็บข้อมูล ให้สร้างโฟลเดอร์ใหม่ของบริษัทนั้นเอง</p>`,
  '<button type="button" class="btn pri" data-a="coAddGo">เพิ่มบริษัท</button>');
ACT.coAddGo=()=>coGo(coNewSlot());
ACT.coAddLicP=b=>coGo(coNewSlot(),b.dataset.k);
ACT.coAddLic=()=>{const pend=licPend();licPendClear();coGo(coNewSlot(),pend)};

/* --- 2) setup step 0: the code, checked as it is pasted --- */
function licInfo(p,cls=''){const d=diffD(today(),p.exp);
  return `<dl class="lic-i ${cls}"><div><dt>บริษัท</dt><dd>${esc(p.co)}</dd></div><div><dt>ผู้ดูแลระบบ</dt><dd>${esc(p.an||'')}${p.em?` <small>${esc(p.em)}</small>`:''}</dd></div>
  <div><dt>แพ็กเกจ</dt><dd>${esc(LIC_PLAN[p.pl]||p.pl||'')}</dd></div><div><dt>โปรแกรม</dt><dd>${esc(licApTxt(p))}</dd></div>${licAp(p).includes('pm')?`<div><dt>ผู้ใช้งานได้</dt><dd>${n(p.mx)?fmt(n(p.mx))+' คน':'ไม่จำกัด'}</dd></div>`:''}
  <div><dt>ใช้ได้ถึง</dt><dd>${thDL(p.exp)}${d<0?' <span class="pill bad">หมดอายุแล้ว</span>':d<=LIC_WARN?` <span class="pill warn">อีก ${d} วัน</span>`:''}</dd></div>${p.id?`<div><dt>รหัสลูกค้า</dt><dd>${esc(p.sn||String(p.id).replace(/-R\d+$/,''))}</dd></div>`:''}${p.no?`<div><dt>Serial number</dt><dd>${esc(p.no)}</dd></div>`:''}</dl>`}
function licStep(){const p=licP(),need=S.wizNew&&!p;
  return `<section class="card" id="wzLicCard"><h2><span>0. รหัสเปิดใช้งาน${need?' *':''}</span><small>รหัสที่ได้จากผู้ให้บริการ PENUM PM ทางอีเมลหรือ LINE ถ้าเปิดจากลิงก์ รหัสจะใส่ไว้ให้แล้ว</small></h2>
  ${p?licInfo(p)+'<p class="hint">ชื่อบริษัทและผู้ดูแลระบบล็อกตามรหัส ถ้าต้องแก้ ติดต่อผู้ให้บริการเพื่อออกรหัสใหม่</p>'
  :`<textarea id="wzLic" rows="3" style="width:100%;font-family:monospace;font-size:12.5px" placeholder="PNM1.…">${esc(licPend())}</textarea><div id="wzLicR" class="lic-r"></div>
  ${licPend()?'':licDevCodes().slice(-3).map(x=>`<p class="hint" style="margin:6px 0 0"><button type="button" class="btn sm" data-a="licUseDev" data-k="${esc(x.c)}">ใช้รหัสของ ${esc(x.p.co)}</button> ที่ใส่ไว้ใน PENUM MEP หรือ BIM บนเครื่องนี้</p>`).join('')}`}</section>`}
ACT.licUseDev=b=>{const t=$('#wzLic');if(!t)return;t.value=b.dataset.k;wzLicGo()};
async function licTry(code,out){const el=$(out);if(!el)return null;code=String(code||'').trim();if(!code){el.innerHTML='';return null}
  el.innerHTML='<span class="hint">กำลังตรวจรหัส…</span>';const r=await licCheck(code);
  if(r.err==='app'){licDevAdd(r.code);el.innerHTML=licInfo(r.p)+`<p class="lic-bad">รหัสนี้ใช้กับ ${esc(licApTxt(r.p))} ไม่รวม PENUM PM</p><p class="hint">เก็บรหัสไว้ในเครื่องนี้ให้แล้ว ${licOpenApps(r.p)}</p>`;return null}
  if(!r.ok){el.innerHTML=`<p class="lic-bad">${r.err==='rev'?'รหัสนี้ถูกยกเลิกแล้ว':'รหัสไม่ถูกต้อง'} ติดต่อผู้ให้บริการ</p>`;return null}
  if(diffD(today(),r.p.exp)<0){el.innerHTML=licInfo(r.p)+'<p class="lic-bad">รหัสนี้หมดอายุแล้ว ติดต่อผู้ให้บริการเพื่อต่ออายุ</p>';return null}
  el.innerHTML=licInfo(r.p,'ok');return r}
async function wzLicGo(){const t=$('#wzLic');if(!t)return;const r=await licTry(t.value,'#wzLicR');if(!r)return;const C=DB.co;
  C.lic=r.code;C.name=r.p.co;if(r.p.en&&!C.nameEn)C.nameEn=r.p.en;if(r.p.tx&&!C.tax)C.tax=r.p.tx;if(r.p.ph&&!C.phone)C.phone=r.p.ph;C.adminName=r.p.an||C.adminName||'';C.adminEmail=r.p.em||'';if(!C.email&&r.p.em)C.email=r.p.em;licPendClear();
  LIC={code:r.code,r};save(true);render();toast('รหัสถูกต้อง ใส่ชื่อบริษัทและผู้ดูแลระบบให้แล้ว')}
document.addEventListener('input',e=>{if(e.target.id==='wzLic'){clearTimeout(e.target._t);e.target._t=setTimeout(wzLicGo,250)}});
{const f=wizView;wizView=function(){let h=f();if(DEMOPG)return h;const p=licP();
  if(p)h=h.replace(/(data-p="co\.name"[^>]*?)>/,'$1 readonly title="ล็อกตามรหัสเปิดใช้งาน">').replace(/(data-p="co\.adminName"[^>]*?)>/,'$1 readonly title="ล็อกตามรหัสเปิดใช้งาน">');
  return licStep()+h}}
{const f=ACT.wizStart;ACT.wizStart=b=>{S.wizNew=dbEmpty()&&!DB.co.lic&&!DEMOPG;return f(b)}}
{const f=ACT.coNewGo;ACT.coNewGo=async b=>{await f(b);if(S.wiz){S.wizNew=!DEMOPG;saveUI();render()}}}
{const f=ACT.wizDone;ACT.wizDone=async b=>{if(!DEMOPG){const t=$('#wzLic'),typed=t&&t.value.trim();
    if(typed&&!licP()){const r=await licTry(typed,'#wzLicR');if(!r){toast('รหัสไม่ถูกต้อง ติดต่อผู้ให้บริการ');t.focus();return}await wzLicGo();return}
    if(S.wizNew&&!licP()){toast('ใส่รหัสเปิดใช้งานก่อน');if(t)t.focus();return}}
  await f(b);S.wizNew=false;saveUI()}}
// the company name stays the one on the code
HOOK.push((p,v)=>{const L=licP();if(L&&p==='co.name'&&v!==L.co){DB.co.name=L.co;toast('ชื่อบริษัทล็อกตามรหัสเปิดใช้งาน');setTimeout(render,0)}});

/* --- 3) sign-in: the administrator is shown by name --- */
{const f=loginScreen;loginScreen=function(){const x=f.apply(this,arguments);const o=document.querySelector('#pinWho option[value="__admin"]'),p=licP(),nm=(p&&p.an)||DB.co.adminName;if(o&&nm)o.textContent=`${nm} · ผู้ดูแลระบบ`;return x}}

/* --- 5) users: no more PINs than the plan allows --- */
const licUpMsg=()=>dialog('ผู้ใช้งานครบตามแพ็กเกจแล้ว',`<p>แพ็กเกจ <b>${esc(LIC_PLAN[licP().pl]||licP().pl)}</b> ใช้งานได้ ${fmt(licMax())} คน (รวมผู้ดูแลระบบ) ตอนนี้ตั้ง PIN ครบแล้ว</p>
  <p class="hint">ลบ PIN ของคนที่ไม่ได้ใช้แล้วที่ ตั้งค่า › เข้าระบบด้วย PIN หรือติดต่อผู้ให้บริการเพื่อเพิ่มจำนวนผู้ใช้ แล้วใส่รหัสใหม่ที่ ตั้งค่า › สิทธิ์การใช้งาน</p>`,'');
{const f=ACT.pinSet;ACT.pinSet=async b=>{const id=b.dataset.id,s=CO().staff.find(x=>x.id===id);
  if(licMax()&&id!=='admin'&&s&&!s.pin&&licUsed()>=licMax()){licUpMsg();return}return f(b)}}
// people past the limit (e.g. after a smaller plan) cannot sign in; the earliest in the staff list keep their place
const licAllowedIds=()=>{const m=licMax();const L=CO().staff.filter(s=>s.active!==false&&s.pin);return new Set((m?L.slice(0,Math.max(0,m-1)):L).map(s=>s.id))};
{const f=ACT.pinIn;ACT.pinIn=async b=>{const who=($('#pinWho')||{}).value;if(licMax()&&who&&who!=='__admin'&&!licAllowedIds().has(who)){toast('ผู้ใช้งานเกินจำนวนตามแพ็กเกจ ให้ผู้ดูแลระบบติดต่อผู้ให้บริการ');return}return f(b)}}

/* --- 4) ตั้งค่า › สิทธิ์การใช้งาน --- */
function licCard(){const L=licP(),pend=licPend();if(!licOn()&&!pend)return '';const admin=!S.me,st=licState();
  const head=`<section class="card" id="licCard"><h2><span>สิทธิ์การใช้งาน</span><small>รหัสเปิดใช้งานจากผู้ให้บริการ เก็บไว้กับข้อมูลบริษัท ทุกเครื่องที่ใช้ข้อมูลชุดนี้ตรวจรหัสเอง</small></h2>`;
  const body=L?licInfo(L)+`<p style="margin:8px 0">ผู้ใช้งานตอนนี้ <b>${fmt(licUsed())}</b>${licMax()?` / ${fmt(licMax())}`:''} คน <small class="muted">(ผู้ดูแลระบบ + พนักงานที่ตั้ง PIN แล้ว)</small></p>`
    :st==='rev'?'<p class="lic-bad">รหัสนี้ถูกผู้ให้บริการยกเลิกแล้ว ข้อมูลเปิดดูและพิมพ์ได้อย่างเดียว ข้อมูลไม่ถูกลบ ติดต่อผู้ให้บริการเพื่อรับรหัสใหม่</p>':st==='bad'?'<p class="lic-bad">รหัสที่เก็บไว้ไม่ถูกต้อง ข้อมูลเปิดดูและพิมพ์ได้อย่างเดียว ใส่รหัสใหม่จากผู้ให้บริการด้านล่าง</p>':'<p class="hint">กำลังตรวจรหัส…</p>';
  const renew=admin?`${L?`<p class="hint">หลังผู้ให้บริการอนุมัติ รหัสใหม่จะเข้ามาเองเมื่อเปิดโปรแกรมตอนต่อเน็ต ไม่ต้องทำอะไร</p><details${pend?' open':''}><summary class="hint" style="cursor:pointer">มีรหัสใหม่จากผู้ให้บริการ? วางรหัสเอง</summary>`:`<h3 class="wz-s">ใส่รหัสใหม่</h3>`}<p class="hint">วางรหัสใหม่ที่ได้จากผู้ให้บริการ (ต้องเป็นบริษัทเดียวกัน) รหัสใหม่จะแทนรหัสเดิม ข้อมูลทั้งหมดอยู่ครบ</p>
    <textarea id="licNew" rows="3" style="width:100%;font-family:monospace;font-size:12.5px" placeholder="PNM1.…">${esc(pend)}</textarea><div id="licNewR" class="lic-r"></div>
    <div class="row" style="margin-top:8px"><button type="button" class="btn pri" data-a="licRenew">ใช้รหัสนี้</button></div>${L?'</details>':''}`:'<p class="hint">รหัสต่ออายุจะเข้ามาเองเมื่อผู้ให้บริการอนุมัติ</p>';
  return head+body+planCard(L,admin)+renew+'</section>'}
/* approved renewals: ORIEN publishes the new code encrypted with a key made from the code this company already holds (so only
   this company can read it), in ORIEN's Supabase (ส่งให้ลูกค้าอัตโนมัติ in ORIEN ฝ่ายขาย, tools/licence-setup.sql) or in
   files/licences.json. PM picks it up when it opens online and when it comes back to the front, so the customer does nothing:
   a renewal looks like the same code with a later date */
const licNorm=c=>String(c||'').replace(/\s+/g,'').replace(/^.*#lic=/,'');
const sha=async t=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)));
async function licPub(idx){const E=[],sb=typeof SBCFG==='object'&&SBCFG&&SBCFG.url&&SBCFG.key?SBCFG:null;
  await Promise.all([sb&&fetch(sb.url+'/rest/v1/rpc/penum_lic_get',{method:'POST',cache:'no-store',headers:{apikey:sb.key,'Content-Type':'application/json'},body:JSON.stringify({p_k:[idx]})})
      .then(r=>r.ok?r.json():null).then(j=>{if(j&&j[idx])E.push(j[idx])}).catch(()=>{}),
    fetch('files/licences.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(j&&j.e&&j.e[idx])E.push(j.e[idx])}).catch(()=>{})]);
  return E}
async function licAuto(){licAuto.t=Date.now();try{if(DEMOPG||!licOn())return;const cur=licNorm(DB.co.lic),o=await licCheck(cur);if(!o.ok)return;
  const idx=[...(await sha('i'+cur)).slice(0,12)].map(b=>b.toString(16).padStart(2,'0')).join(''),k=await crypto.subtle.importKey('raw',await sha('k'+cur),'AES-GCM',false,['decrypt']);
  const rk=p=>String(p.iat)+'|'+String(p.exp);let r=null;
  for(const e of await licPub(idx)){try{const x=await licCheck(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:licB64(e.iv)},k,licB64(e.ct))));
    if(x.ok&&x.p.co===o.p.co&&x.code!==cur&&String(x.p.iat)>=String(o.p.iat)&&(!r||rk(x.p)>rk(r.p)))r=x}catch(e){}}
  if(!r||DB.co.lic!==cur&&licNorm(DB.co.lic)!==cur)return;
  DB.co.lic=r.code;if(r.p.an)DB.co.adminName=r.p.an;if(r.p.em)DB.co.adminEmail=r.p.em;LIC={code:r.code,r};LOCKSNAP=null;save(true);render();
  toast(`อัปเดตสิทธิ์การใช้งานจากผู้ให้บริการแล้ว: ${LIC_PLAN[r.p.pl]||r.p.pl} ${fmt(r.p.mx)} คน ใช้ได้ถึง ${thDL(r.p.exp)}`)}catch(e){}}
if(!DEMOPG){setTimeout(licAuto,1500);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-(licAuto.t||0)>30*60e3)licAuto()})}
/* packages on offer, from files/plans.json (ORIEN edits prices there); a request goes to ORIEN by e-mail or LINE */
let PLANS=(()=>{try{return JSON.parse(localStorage.getItem('penum.plans')||'null')}catch(e){return null}})()||{contact:{email:'fong101dt@gmail.com',line:''},vat:'ราคาต่อเดือน ไม่รวม VAT 7%',plans:[{k:'pilot',name:'ทดลองใช้ (Pilot)',price:0,users:10,txt:'ฟรีช่วงทดลอง'},{k:'starter',name:'Starter',price:1490,users:10},{k:'std',name:'Standard',price:3900,users:30},{k:'biz',name:'Business',price:7900,users:80},{k:'ent',name:'Enterprise',price:null,users:200,txt:'ติดต่อฝ่ายขาย'}]};
if(!DEMOPG)fetch('files/plans.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j||!Array.isArray(j.plans))return;const t=JSON.stringify(j);if(t===JSON.stringify(PLANS))return;PLANS=j;try{localStorage.setItem('penum.plans',t)}catch(e){}if(S.ctab==='coset')render()}).catch(()=>{});
const planPrice=x=>x.price==null?(x.txt||'ติดต่อฝ่ายขาย'):n(x.price)?fmt(x.price)+' บาท/เดือน':(x.txt||'ฟรี');
function planCard(L,admin){if(!L)return '';
  return `<h3 class="wz-s">แพ็กเกจที่มี</h3><div class="tw"><table><thead><tr><th>แพ็กเกจ</th><th class="r">ผู้ใช้งานได้</th><th class="r">ราคา</th></tr></thead><tbody>${PLANS.plans.map(x=>`<tr${x.k===L.pl?' style="font-weight:700"':''}><td>${esc(x.name)}${x.k===L.pl?' <span class="pill ok">ใช้อยู่</span>':''}</td><td class="r">${fmt(x.users)} คน</td><td class="r">${esc(planPrice(x))}</td></tr>`).join('')}</tbody></table></div>
  ${planApps(L)}<p class="hint">${esc(PLANS.vat||'')} · อยากเปลี่ยนแพ็กเกจหรือเพิ่มโปรแกรม ส่งคำขอให้ผู้ให้บริการ แล้วจะได้รับใบวางบิลและรหัสใหม่ทางอีเมล</p>${admin?'<div class="row" style="margin-bottom:6px"><button type="button" class="btn" data-a="planReq">ขอเปลี่ยนแพ็กเกจ / เพิ่มโปรแกรม</button></div>':''}`}
const planAppList=()=>(Array.isArray(PLANS.apps)?PLANS.apps:[]).filter(x=>x&&x.k&&x.k!=='pm');
function planApps(L){const A=planAppList(),mine=licAp(L);if(!A.length)return '';
  return `<h3 class="wz-s">โปรแกรมอื่นของ PENUM</h3><div class="tw"><table><thead><tr><th>โปรแกรม</th><th class="r">ราคา</th></tr></thead><tbody>${A.map(x=>`<tr${mine.includes(x.k)?' style="font-weight:700"':''}><td>${esc(x.name)}${mine.includes(x.k)?' <span class="pill ok">ใช้อยู่</span>':''}${x.txt?`<br><small class="muted">${esc(x.txt)}</small>`:''}</td><td class="r">${esc(planPrice(x))}</td></tr>`).join('')}</tbody></table></div>
  ${PLANS.bundle&&PLANS.bundle.txt?`<p class="hint">${esc(PLANS.bundle.txt)}</p>`:''}${mine.length>1?`<p class="hint">รหัสนี้เปิด ${esc(licApTxt(L))} ในเครื่องที่ใช้ PENUM PM ของบริษัทนี้ได้เลย ไม่ต้องใส่รหัสซ้ำ ${licOpenApps(L)}</p>`:''}`}
function planTxt(){const L=licP(),C=DB.co,to=PLANS.plans.find(x=>x.k===($('#plTo')||{}).value)||{},cur=PLANS.plans.find(x=>x.k===L.pl)||{name:L.pl},note=(($('#plNo')||{}).value||'').trim();
  const add=[...document.querySelectorAll('#dlg .plAdd:checked')].map(x=>x.value);
  const cust=L.sn||String(L.id).replace(/-R\d+$/,'');
  return ['เรียน ฝ่ายขาย PENUM PM','',add.length?'ขอเปลี่ยนแพ็กเกจ / เพิ่มโปรแกรม PENUM':'ขอเปลี่ยนแพ็กเกจ PENUM PM','',`บริษัท: ${L.co}`,`รหัสลูกค้า: ${cust}`,`Serial number: ${L.no||L.id}`,`แพ็กเกจปัจจุบัน: ${cur.name} (${fmt(L.mx)} คน ใช้ได้ถึง ${thDL(L.exp)})`,`แพ็กเกจที่ต้องการ: ${to.name||''} (${fmt(to.users)} คน ${planPrice(to)})`,...(add.length?['เพิ่มโปรแกรม: '+add.map(a=>LIC_APPS[a]||a).join(', ')]:[]),...(note?['หมายเหตุ: '+note]:[]),'',`ผู้ติดต่อ: ${C.adminName||L.an||''}${C.phone?' โทร '+C.phone:''}${C.email||L.em?' '+(C.email||L.em):''}`,'','กรุณาส่งใบวางบิลและรหัสใหม่กลับมาทางอีเมลนี้','',`[PENUM-PLAN] ${cust} ${L.no||L.id} ${L.pl}>${to.k||''}${add.length?' +'+add.join(','):''}`].join('\n')}
ACT.planReq=()=>{const L=licP();if(!L)return;const o=[...PLANS.plans.filter(x=>x.k===L.pl),...PLANS.plans.filter(x=>x.k!==L.pl)];const c=PLANS.contact||{},add=planAppList().filter(x=>!licAp(L).includes(x.k));
  dialog('ขอเปลี่ยนแพ็กเกจ / เพิ่มโปรแกรม',`<label>แพ็กเกจ PENUM PM<select id="plTo">${o.map(x=>`<option value="${x.k}">${esc(x.name)}${x.k===L.pl?' (ใช้อยู่)':''} · ${fmt(x.users)} คน · ${esc(planPrice(x))}</option>`).join('')}</select></label>
  ${add.length?`<div style="margin-top:8px"><span class="hint">เพิ่มโปรแกรม (ใช้รหัสเดียวกับ PM)</span>${add.map(x=>`<label style="display:flex;gap:8px;align-items:center;margin-top:4px"><input type="checkbox" class="plAdd" value="${x.k}" style="width:auto"> ${esc(x.name)} · ${esc(planPrice(x))}</label>`).join('')}</div>`:''}
  <label style="margin-top:8px;display:block">หมายเหตุ (ถ้ามี)<textarea id="plNo" rows="2" style="width:100%" placeholder="เช่น ต้องการเริ่มเดือนหน้า"></textarea></label>
  <p class="hint">${c.lineOA?`กด “ส่งทาง LINE” บนมือถือ ระบบจะเปิดแชท LINE ${esc(c.lineOA)} พร้อมข้อความให้แล้ว กดส่งได้เลย บนคอมพิวเตอร์ ระบบจะคัดลอกข้อความให้ แล้วเปิดหน้า QR ของ ${esc(c.lineOA)} ให้เปิด LINE ค้นหาไอดีนี้แล้ววางข้อความ`:`กด “ส่งอีเมล” ระบบจะเปิดอีเมลที่เขียนไว้ให้แล้ว ส่งถึง ${esc(c.email||'')} หรือกด “คัดลอกข้อความ” แล้ววางส่งทาง LINE${c.line?' '+esc(c.line):''}`}</p>`,
  (c.lineOA?'<button type="button" class="btn pri" data-a="planLine">ส่งทาง LINE</button><button type="button" class="btn" data-a="planMail">ส่งอีเมล</button>':'<button type="button" class="btn pri" data-a="planMail">ส่งอีเมล</button>')+'<button type="button" class="btn" data-a="planCopy">คัดลอกข้อความ</button>')};
// LINE Official Account chat with the request typed in (contact.lineOA in plans.json, e.g. "@orien")
// oaMessage links only open the chat in the LINE phone app; on a PC they land on line.me's home page,
// so there the message is copied and the OA's add-friend page (QR code) opens instead
ACT.planLine=async()=>{let id=String((PLANS.contact||{}).lineOA||'').trim();if(!id)return;id=id.startsWith('@')?id:'@'+id;
  if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){open(`https://line.me/R/oaMessage/${encodeURIComponent(id)}/?${encodeURIComponent(planTxt())}`,'_blank');return}
  const t=planTxt(),ok=await copyText(t);open(`https://line.me/R/ti/p/${encodeURIComponent(id)}`,'_blank');
  dialog('ส่งคำขอทาง LINE',`<p>${ok?'คัดลอกข้อความคำขอไว้ให้แล้ว':'คัดลอกข้อความในช่องด้านล่างไว้'} ส่งให้ ORIEN ได้ 2 แบบ</p>
  <ol style="margin:6px 0 10px 18px;line-height:1.7"><li><b>LINE ในคอมฯ</b> เปิดโปรแกรม LINE › เพิ่มเพื่อน › ค้นหาไอดี <b>${esc(id)}</b> › เปิดแชท › วางข้อความ (Ctrl+V) › ส่ง</li>
  <li><b>LINE ในมือถือ</b> สแกน QR ในหน้าที่เพิ่งเปิดขึ้น › เพิ่มเพื่อน › วางหรือพิมพ์ข้อความ › ส่ง</li></ol>
  <textarea readonly rows="6" style="width:100%">${esc(t)}</textarea>`,'<button type="button" class="btn pri" data-a="planLineCopy">คัดลอกข้อความอีกครั้ง</button>');
  const ta=$('#dlg textarea');ta&&ta.addEventListener('focus',()=>ta.select())};
ACT.planLineCopy=async()=>{const ta=$('#dlg textarea');toast(ta&&await copyText(ta.value)?'คัดลอกแล้ว':'คัดลอกไม่ได้')};
ACT.planMail=()=>{const L=licP(),to=PLANS.plans.find(x=>x.k===$('#plTo').value)||{},add=[...document.querySelectorAll('#dlg .plAdd:checked')].map(x=>LIC_APPS[x.value]||x.value);location.href=`mailto:${(PLANS.contact||{}).email||''}?subject=${encodeURIComponent(`ขอเปลี่ยนแพ็กเกจ PENUM PM: ${L.co} → ${to.name||''}${add.length?' + '+add.join(', '):''}`)}&body=${encodeURIComponent(planTxt())}`};
ACT.planCopy=async()=>{toast(await copyText(planTxt())?'คัดลอกแล้ว วางส่งทาง LINE ได้เลย':'คัดลอกไม่ได้')};
ACT.licRenew=async()=>{const t=$('#licNew');if(!t||!t.value.trim()){toast('วางรหัสก่อน');return}const r=await licTry(t.value,'#licNewR');if(!r)return;
  const cur=licP()?licP().co:(DB.co.name||'');if(DB.co.lic&&cur&&r.p.co!==cur){$('#licNewR').innerHTML+=`<p class="lic-bad">รหัสนี้เป็นของ “${esc(r.p.co)}” ไม่ใช่ “${esc(cur)}”</p>`;return}
  if(!DB.co.lic&&!dbEmpty()&&!confirm(`ใส่รหัสของ “${r.p.co}” ให้ข้อมูลชุดนี้? ชื่อบริษัทจะล็อกตามรหัส`))return;
  DB.co.lic=r.code;DB.co.name=r.p.co;if(r.p.en&&!DB.co.nameEn)DB.co.nameEn=r.p.en;if(r.p.tx&&!DB.co.tax)DB.co.tax=r.p.tx;if(r.p.ph&&!DB.co.phone)DB.co.phone=r.p.ph;if(r.p.an)DB.co.adminName=r.p.an;if(r.p.em)DB.co.adminEmail=r.p.em;LIC={code:r.code,r};LOCKSNAP=null;licPendClear();save(true);render();toast('ใช้รหัสใหม่แล้ว ใช้ได้ถึง '+thDL(r.p.exp))};
{const f=CVIEWS.coset;CVIEWS.coset=()=>{const h=f();if(DEMOPG)return h;const c=licCard();return c+h}}
{const f=CVIEWS.coset;CVIEWS.coset=()=>{let h=f();const p=licP();if(p)h=h.replace(/(data-p="co\.name"[^>]*?)>/,'$1 readonly title="ล็อกตามรหัสเปิดใช้งาน">');return h}}

/* --- 6) expiry: warning, 7 days' grace, then read-only (view, print and backup still work) --- */
{const s=save;save=function(now){
  // data received from the company (phone receive, folder) replaces the whole set: that is reading, not editing
  if(LOCKSNAP&&DB!==LOCKDB){LOCKDB=DB;if(licRO())LOCKSNAP=JSON.stringify(DB);return s(now)}
  if(licRO()&&LOCKSNAP&&DB.co.lic===LIC.code){DB=JSON.parse(LOCKSNAP);LOCKDB=DB;P=DB.projects[DB.cur]||Object.values(DB.projects)[0];
    toast('สิทธิ์การใช้งานหมดอายุ ข้อมูลเปิดดูและพิมพ์ได้อย่างเดียว ต่ออายุได้ที่ ตั้งค่า › สิทธิ์การใช้งาน');clearTimeout(save._t);save._t=setTimeout(()=>render(),0);return}
  return s(now)}}
function licBanner(){const st=licState(),p=licP(),admin=!S.me;if(st==='none'||st==='wait'||st==='ok')return '';
  const go='<button type="button" class="btn sm" data-a="licGo">ตั้งค่า › สิทธิ์การใช้งาน</button>';
  if(st==='warn'){if(!admin)return '';return `<div class="lic-ban warn">สิทธิ์การใช้งานหมดอายุ ${thDL(p.exp)} (อีก ${diffD(today(),p.exp)} วัน) ติดต่อผู้ให้บริการเพื่อต่ออายุ แล้วใส่รหัสใหม่ ${go}</div>`}
  if(st==='grace'){const left=LIC_GRACE+diffD(today(),p.exp);return `<div class="lic-ban bad">สิทธิ์การใช้งานหมดอายุแล้วเมื่อ ${thDL(p.exp)} ใช้งานต่อได้อีก ${left} วัน หลังจากนั้นข้อมูลจะเปิดดูและพิมพ์ได้อย่างเดียว${admin?' '+go:' แจ้งผู้ดูแลระบบ'}</div>`}
  return `<div class="lic-ban bad">${st==='bad'?'รหัสเปิดใช้งานไม่ถูกต้อง':st==='rev'?'รหัสเปิดใช้งานถูกยกเลิก':'สิทธิ์การใช้งานหมดอายุ'} ข้อมูลเปิดดู พิมพ์ และดาวน์โหลดไฟล์สำรองได้ แต่แก้ไขไม่ได้ ข้อมูลไม่ถูกลบ${admin?' ใส่รหัสใหม่ได้ที่ '+go:' แจ้งผู้ดูแลระบบ'}</div>`}
ACT.licGo=()=>{S.dept='set';pgGo(['co','coset','']);render();setTimeout(()=>{const c=$('#licCard');if(c)c.scrollIntoView({behavior:'smooth'})},60)};
{const r=render;render=function(){try{if(typeof DB!=='undefined'&&DB&&DB.co){licSync();licFromLink();if(licP()&&licDevAdd.last!==DB.co.lic){licDevAdd.last=DB.co.lic;licDevAdd(DB.co.lic)}}}catch(e){console.error(e)}const x=r.apply(this,arguments);
  try{const t=$('#wzLic'),o=$('#wzLicR');if(t&&o&&t.value.trim()&&!o.innerHTML)setTimeout(wzLicGo,0)}catch(e){}
  try{if(!licOn()||(pinOn()&&!authOK()))return x;const v=$('#view');if(!v)return x;const b=licBanner();if(b)v.insertAdjacentHTML('afterbegin',b);
    document.body.classList.toggle('lic-ro',licRO());
    if(licRO())v.querySelectorAll('input,select,textarea').forEach(e=>{if(!e.closest('#licCard')&&e.type!=='search')e.disabled=true})}catch(e){console.error(e)}return x}}

document.head.insertAdjacentHTML('beforeend',`<style>
.lic-i{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px 16px;margin:6px 0;padding:12px 14px;border:1px solid var(--line);border-radius:12px}
.lic-i.ok{border-color:var(--good);background:color-mix(in srgb,var(--good) 8%,transparent)}
.lic-i dt{font-size:12px;color:var(--muted)}.lic-i dd{margin:0;font-weight:600}.lic-i dd small{font-weight:400;color:var(--muted)}
.lic-bad{color:var(--danger);font-weight:600;margin:6px 0}.lic-r{margin-top:6px}
.lic-ban{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;border-radius:12px;margin:0 0 12px;font-size:14px}
.lic-ban.warn{border:1px solid var(--warn-c);background:color-mix(in srgb,var(--warn-c) 10%,transparent)}
.lic-ban.bad{border:1px solid var(--danger);background:color-mix(in srgb,var(--danger) 10%,transparent)}
</style>`);
// data received from the company (phone receive, folder, cloud) is filled into DB in place: let its next save through
{const f=applyData;applyData=function(){const x=f.apply(this,arguments);LOCKDB={};return x}}

