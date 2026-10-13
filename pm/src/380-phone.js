/* ---------- round 2.8: PENUM PM on a phone ----------
   A phone cannot open the OneDrive folder from the browser, so it trades files with it instead:
   "รับข้อมูลล่าสุด" opens PENUM-PM/penum-pm.json through the phone's file picker (OneDrive shows there),
   "ส่งงานเข้าระบบ" saves a package penum-pm-mobile-….json into the same folder through the share sheet.
   The package carries the copy it was based on, so the computer merges only what changed on the phone. */
const isPhone=()=>matchMedia('(max-width:700px)').matches||/Android|iPhone|iPad/i.test(navigator.userAgent);
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const MKEY='penum.pm.mobile'+DSFX;
const MB={base:null,info:{}};
try{MB.info=JSON.parse(localStorage.getItem(MKEY)||'{}')||{}}catch(e){}
const mbSave=()=>{try{localStorage.setItem(MKEY,JSON.stringify(MB.info))}catch(e){}};
IDB.get('__mbase').then(v=>{MB.base=v||null;if(typeof render==='function'&&document.readyState!=='loading')cloudBadge()}).catch(()=>{});
const mobileMode=()=>!cloudOn()&&!folderOn()&&(isPhone()||!fsOK());
// work on this phone that the shared file has not seen yet
const mbPending=()=>{if(!MB.base)return false;const b=payload();return b!==MB.base&&b!==MB.info.sentBody};
const hasLocalData=()=>Object.values(DB.projects).some(p=>p.boq.items.length||p.tasks.length||p.daily.length)||DB.co.staff.length||DB.co.customers.length;
let BIP=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();BIP=e;if($('#instCard'))render()});
addEventListener('appinstalled',()=>{BIP=null;toast('ติดตั้ง PENUM PM แล้ว');render()});

function pickFile(cb){const f=$('#fileIn');f.accept='';f.multiple=false;f.onchange=async()=>{const file=f.files[0];f.value='';if(file)cb(file)};f.click()}
ACT.mPull=()=>pickFile(async file=>{let txt,J;try{txt=await file.text();J=JSON.parse(txt)}catch(e){toast('ไฟล์นี้ไม่ใช่ข้อมูล PENUM PM');return}
  if(J.kind==='penum-mobile'){await mobileIn(J);save();render();return}
  if(!J||!J.projects||!J.co){toast('ไฟล์นี้ไม่ใช่ข้อมูล PENUM PM เลือกไฟล์ penum-pm.json ในโฟลเดอร์ PENUM-PM');return}
  let merged=J;
  if(MB.base)merged=merge3(JSON.parse(MB.base),JSON.parse(payload()),J);
  else if(hasLocalData()&&confirm('ในเครื่องนี้มีข้อมูลอยู่แล้ว รวมเข้ากับข้อมูลบริษัทไหม?\nกด ตกลง = รวม · กด ยกเลิก = ใช้ข้อมูลบริษัทอย่างเดียว'))merged=merge3({projects:{},co:{}},JSON.parse(payload()),J);
  applyData(merged);MB.base=JSON.stringify(J);await IDB.put('__mbase',MB.base).catch(()=>{});
  MB.info.pulled=Date.now();MB.info.file=file.name;mbSave();save();render();
  toast(`รับข้อมูลแล้ว (ไฟล์บันทึกเมื่อ ${new Date(file.lastModified).toLocaleString('th-TH',{dateStyle:'short',timeStyle:'short'})})`)});

ACT.mSend=async()=>{if(!MB.base&&!confirm('ยังไม่เคยรับข้อมูลจากบริษัทในเครื่องนี้ ส่งงานไปเลยไหม?\n(ควรกด “รับข้อมูลล่าสุด” ก่อน)'))return;
  const sent=new Set(MB.info.ph||[]),photos={};
  for(const k of photoKeys()){if(sent.has(k))continue;const v=await IDB.get(k).catch(()=>null);if(v)photos[k]=v}
  const who=S.me?staffName(S.me):'ผู้ดูแลระบบ',u=me(),d=new Date(),st=d.toISOString().slice(0,16).replace(/\D/g,'');
  const pkg={kind:'penum-mobile',v:1,by:who,at:d.toISOString(),base:JSON.parse(MB.base||'{"projects":{},"co":{}}'),data:JSON.parse(payload()),photos};
  const name=`penum-pm-mobile-${(u&&u.code)||'admin'}-${st}.json`,file=new File([JSON.stringify(pkg)],name,{type:'application/json'});
  const done=()=>{MB.info.sent=Date.now();MB.info.sentBody=payload();MB.info.ph=[...sent,...Object.keys(photos)];mbSave();render()};
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'งานจาก PENUM PM'});done();toast('ส่งแล้ว ถ้าบันทึกลงโฟลเดอร์ PENUM-PM คอมพิวเตอร์จะรวมงานให้เอง');return}
    catch(e){if(e&&e.name==='AbortError')return}}
  const a=document.createElement('a'),url=URL.createObjectURL(file);a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
  done();toast('ดาวน์โหลดไฟล์แล้ว ย้ายไฟล์นี้เข้าโฟลเดอร์ PENUM-PM ใน OneDrive')};

// computer side: merge a phone package against the copy the phone started from, so rows added here since then stay
async function mobileIn(J){if(!J||J.kind!=='penum-mobile'||!J.data)return;
  applyData(merge3(J.base||{projects:{},co:{}},JSON.parse(payload()),J.data));
  for(const [k,v] of Object.entries(J.photos||{}))if(/^ph-/.test(k)&&typeof v==='string'&&v.startsWith('data:image/')){await IDB.put(k,v).catch(()=>{});phCache[k]=v}
  toast(`รวมงานจากมือถือของ ${J.by||'พนักงาน'} แล้ว`)}
ACT.mImport=()=>pickFile(async file=>{let J;try{J=JSON.parse(await file.text())}catch(e){}
  if(!J||J.kind!=='penum-mobile'){toast('เลือกไฟล์ penum-pm-mobile-….json ที่ส่งมาจากมือถือ');return}await mobileIn(J);save();render()});
ACT.mInstall=async()=>{if(!BIP)return;BIP.prompt();try{await BIP.userChoice}catch(e){}BIP=null;render()};
ACT.mDaily=()=>{S.dept='pj';pgGo(['pj','site','daily']);const t=today(),d=P.daily.find(x=>x.date===t);
  if(d)S.sel.daily=d.id;else{const r=Object.assign({id:uid()},NEW.daily(P.daily));P.daily.push(r);S.sel.daily=r.id;save()}render();scrollTo({top:0})};
ACT.mLeave=()=>{S.dept='hr';pgGo(['co','hr','leave']);render();scrollTo({top:0})};
ACT.mSafe=()=>{S.dept='she';pgGo(['pj','site','safe']);render();scrollTo({top:0})};
ACT.mPunch=()=>{S.dept='pj';pgGo(['pj','hand','punch']);render();scrollTo({top:0})};
ACT.mGo=()=>{S.dept='home';pgGo(['co','exec','']);render();setTimeout(()=>{const c=$('#mobCard');if(c)c.scrollIntoView({behavior:'smooth'})},50)};

const when=t=>t?new Date(t).toLocaleString('th-TH',{dateStyle:'short',timeStyle:'short'}):'ยังไม่เคย';
function mobSync(){const pend=mbPending();
  return `<div class="msync"><div class="mst"><span>รับข้อมูลล่าสุด: <b>${when(MB.info.pulled)}</b></span><span>ส่งงานล่าสุด: <b>${when(MB.info.sent)}</b></span>
    ${pend?'<span class="pill warn">มีงานในเครื่องที่ยังไม่ได้ส่ง</span>':MB.base?'<span class="pill ok">ส่งงานครบแล้ว</span>':''}</div>
  <div class="row"><button type="button" class="btn" data-a="mPull">⬇ รับข้อมูลล่าสุด</button><button type="button" class="btn${pend?' pri':''}" data-a="mSend">⬆ ส่งงานเข้าระบบ</button></div>
  <details class="mhow"><summary>วิธีรับและส่งงาน ทีละขั้น</summary>
  <p><b>รับข้อมูลล่าสุด</b></p><ol><li>กด <b>⬇ รับข้อมูลล่าสุด</b></li>
    <li>${isIOS()?'หน้าต่างเลือกไฟล์จะเปิดขึ้น กด <b>เลือกดู</b> (Browse) › <b>OneDrive</b>':'หน้าต่างเลือกไฟล์จะเปิดขึ้น กดเมนู ☰ มุมซ้ายบน › <b>OneDrive</b>'} (ต้องมีแอป OneDrive ในมือถือและล็อกอินแล้ว)</li>
    <li>เข้าโฟลเดอร์ <b>PENUM-PM</b> (ถ้าเป็นโฟลเดอร์ที่คนอื่นแชร์ให้ จะอยู่ในหัวข้อ <b>แชร์</b>) แล้วแตะไฟล์ <b>penum-pm.json</b></li></ol>
  <p><b>ส่งงานเข้าระบบ</b> (หลังเขียนรายงาน ถ่ายรูป หรือยื่นใบลาเสร็จ)</p><ol><li>กด <b>⬆ ส่งงานเข้าระบบ</b></li>
    <li>${isIOS()?'เลือก <b>บันทึกไปยังแอปไฟล์</b> (Save to Files) › <b>OneDrive</b> › โฟลเดอร์ <b>PENUM-PM</b> › กด <b>บันทึก</b>':'เลือกแอป <b>OneDrive</b> › เลือกโฟลเดอร์ <b>PENUM-PM</b> › กด <b>อัปโหลด</b> (หรือ ✓)'}</li>
    <li>คอมพิวเตอร์ที่เปิด PENUM PM และเชื่อมโฟลเดอร์ไว้จะรวมงานจากมือถือให้เองภายในไม่กี่นาที</li></ol>
  <p class="hint">ไม่มี OneDrive ในมือถือ: ส่งไฟล์ทาง LINE หรืออีเมลให้ผู้ดูแลระบบ แล้วผู้ดูแลระบบกด <b>นำเข้างานจากมือถือ</b> ที่หน้า ตั้งค่า · ใช้เฉพาะโฟลเดอร์ PENUM-PM ไม่ยุ่งกับไฟล์อื่นใน OneDrive</p></details></div>`}
function instCard(){if(isStandalone())return '';
  return `<section class="card" id="instCard"><h2><span>ติดตั้ง PENUM PM บนมือถือ</span><small>ติดตั้งแล้วจะมีไอคอนบนหน้าจอ เปิดเต็มจอเหมือนแอป และเปิดได้แม้ไม่มีเน็ต</small></h2>
  ${BIP?'<button type="button" class="btn pri" data-a="mInstall">ติดตั้งแอปเลย</button>':isIOS()?`<ol class="hint mol"><li>เปิดลิงก์นี้ด้วย <b>Safari</b></li><li>กดปุ่ม <b>แชร์</b> (สี่เหลี่ยมมีลูกศรชี้ขึ้น) ด้านล่างจอ</li><li>เลื่อนลงแล้วกด <b>เพิ่มไปยังหน้าจอโฮม</b></li><li>กด <b>เพิ่ม</b> มุมขวาบน</li></ol>`
  :`<ol class="hint mol"><li>เปิดลิงก์นี้ด้วย <b>Chrome</b></li><li>กดปุ่ม <b>⋮</b> มุมขวาบน</li><li>กด <b>ติดตั้งแอป</b> หรือ <b>เพิ่มลงในหน้าจอหลัก</b></li><li>กด <b>ติดตั้ง</b></li></ol>`}</section>`}
function mobCard(){const n=myQueue().length,pend=(CO().leave||[]).filter(l=>l.status==='pend'&&l.staff===S.me).length;
  const b=(a,ic,t,s)=>`<button type="button" class="mq" data-a="${a}"><span class="mqi" aria-hidden="true">${ic}</span><b>${t}</b><small>${s}</small></button>`;
  return `<section class="card" id="mobCard"><h2><span>งานหน้างานวันนี้</span><small>${esc(P.name||P.info.name||'')} · ${new Date().toLocaleDateString('th-TH',{weekday:'short',day:'numeric',month:'short'})}</small></h2>
  <div class="mqs">${allowed('pj','site')?b('mDaily','📝','รายงานประจำวัน','จำนวนคน งานที่ทำ ถ่ายรูป')+b('mSafe','🦺','ตรวจความปลอดภัย','เช็กลิสต์ประจำวัน'):''}
  ${allowed('pj','hand')?b('mPunch','📷','รายการแก้ไข','ถ่ายรูปจุดที่ต้องแก้'):''}${b('mLeave','🗓','ยื่นใบลา',pend?`รออนุมัติ ${pend} ใบ`:'ลาป่วย ลากิจ ลาพักร้อน')}
  ${n?b('mGoAppr','✅','รออนุมัติ',`${n} รายการรอคุณ`):''}</div>${mobSync()}</section>`}
ACT.mGoAppr=()=>{render();setTimeout(()=>{const c=[...document.querySelectorAll('#view section.card')].find(s=>/ต้องดูวันนี้/.test(s.textContent.slice(0,40)));if(c)c.scrollIntoView({behavior:'smooth'})},50)};

{const f=CVIEWS.exec;CVIEWS.exec=()=>{const h=f();if(!mobileMode())return h;return mobCard()+(isPhone()?instCard():'')+h}}
// phone with no company data yet: the first step is to receive it
{const f=CVIEWS.exec;CVIEWS.exec=()=>{const h=f();return mobileMode()&&!MB.base?h.replace('<button type="button" class="btn pri" data-a="newProj">','<button type="button" class="btn pri" data-a="mPull">⬇ รับข้อมูลจากบริษัท (OneDrive)</button><button type="button" class="btn" data-a="newProj">'):h}}
{const f=CVIEWS.coset;CVIEWS.coset=()=>f()+(cloudOn()?'':`<section class="card" id="mobSet"><h2><span>มือถือ</span><small>มือถือรับข้อมูลจากไฟล์ penum-pm.json ในโฟลเดอร์ PENUM-PM และส่งงานกลับเป็นไฟล์ penum-pm-mobile-….json ลงโฟลเดอร์เดียวกัน คอมพิวเตอร์ที่เชื่อมโฟลเดอร์ไว้จะรวมให้เอง</small></h2>
  ${mobileMode()?mobSync():`<div class="row"><button type="button" class="btn" data-a="mImport">นำเข้างานจากมือถือ (ไฟล์ที่ได้ทาง LINE หรืออีเมล)</button></div>
  <p class="hint" style="margin-top:8px">ให้พนักงานติดตั้ง: เปิด <b>fongdabo.github.io/penum/pm/</b> ในมือถือ แล้วทำตามการ์ด “ติดตั้ง PENUM PM บนมือถือ” ที่หน้าแรก · แชร์โฟลเดอร์ PENUM-PM ให้เขาแบบ <b>แก้ไขได้</b> เพื่อให้ส่งงานกลับเข้าโฟลเดอร์ได้</p>`}</section>`)}
// header badge on a phone: shows whether work is waiting to be sent
{const cb=cloudBadge;cloudBadge=function(){cb();const b=$('#cloudBtn');if(!b||!mobileMode())return;b.dataset.a='mGo';
  b.textContent=!MB.base?'📱 รับข้อมูลบริษัท':mbPending()?'📱 มีงานรอส่ง':'📱 ส่งงานครบแล้ว';b.title='รับและส่งงานกับโฟลเดอร์ PENUM-PM';b.style.borderColor=mbPending()?'#E5B26A':''}}
{const s=save;save=function(now){s(now);if(mobileMode())cloudBadge()}}
document.head.insertAdjacentHTML('beforeend',`<style>
.mqs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-bottom:12px}
.mq{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);font:inherit;cursor:pointer;min-height:84px}
.mq:hover,.mq:focus-visible{border-color:var(--accent)}.mq b{font-size:15px}.mq small{color:var(--muted);font-size:12px}.mqi{font-size:22px;line-height:1.2}
.msync{border-top:1px solid var(--line);padding-top:10px}.mst{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;font-size:13px;margin-bottom:8px}
.msync .row .btn{flex:1 1 140px;min-height:42px}.mhow{margin-top:10px;font-size:13px}.mhow summary{cursor:pointer;color:var(--accent);font-weight:600}
.mhow ol,.mol{padding-left:20px;line-height:1.8;margin:4px 0 8px}.mhow p{margin:8px 0 2px}
@media(max-width:700px){.mqs{grid-template-columns:1fr 1fr}}
</style>`);

