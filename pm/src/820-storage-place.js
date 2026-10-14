/* ---------- 3.47 where the PENUM-PM folder lives: OneDrive, Google Drive, Dropbox, a shared office folder, or this computer ----------
   Folder mode works with any folder Edge/Chrome can open, so the choice only changes the instructions:
   how to make the folder, how to share it, and what to pick on a phone. The choice rides in co.syncP so phones
   that receive the data show the right steps; before that it is remembered on the device. OneDrive stays the default. */
document.head.insertAdjacentHTML('beforeend',`<style>
.sp-g{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}
.sp-c{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:none;color:inherit;cursor:pointer;font:inherit;font-size:13.5px}
.sp-c[aria-pressed="true"]{border-color:var(--pri,#0891B2);background:color-mix(in srgb,var(--pri,#0891B2) 12%,transparent);font-weight:600}
.sp-n{font-size:13px;margin:4px 0 8px;padding:8px 10px;border-radius:10px;background:color-mix(in srgb,var(--pri,#0891B2) 7%,transparent)}
.sp-w{background:color-mix(in srgb,#E58A7A 16%,transparent)}
.sp-more{margin:-2px 0 8px;font-size:13px}.sp-more summary{cursor:pointer;color:var(--muted)}.sp-more .sp-g{margin-top:6px}
</style>`);
const SYNCP={
  od:{n:'OneDrive',ic:'☁',
    note:'โปรแกรม OneDrive (Windows มีมาให้แล้ว) ซิงค์โฟลเดอร์ขึ้นคลาวด์ และไปยังเครื่องของคนที่แชร์ให้',
    pc:['ดูว่าไอคอนรูปเมฆ <b>OneDrive</b> ที่มุมขวาล่างของจอขึ้นอยู่ (ถ้าไม่มี กดปุ่ม Start พิมพ์ OneDrive แล้วล็อกอินด้วยบัญชีของบริษัท)'],at:'<b>OneDrive</b>',
    share:'เปิด onedrive.live.com คลิกขวาที่โฟลเดอร์ PENUM-PM › <b>แชร์</b> › ใส่อีเมล เลือก <b>แก้ไขได้</b> › ส่ง · คนที่ได้รับกด <b>เพิ่มทางลัดไปยังไฟล์ของฉัน</b>',
    app:'OneDrive'},
  gd:{n:'Google Drive',ic:'△',
    note:'ติดตั้งโปรแกรม <b>Google Drive for desktop</b> (ดาวน์โหลดฟรีจาก google.com/drive/download) จะมีไดรฟ์ “Google Drive” ในเครื่อง และซิงค์ให้เอง',
    pc:['ติดตั้งและเปิด <b>Google Drive for desktop</b> ล็อกอินด้วยบัญชี Google ของบริษัท'],at:'<b>Google Drive</b> (หรือไดรฟ์ G:) › ดับเบิลคลิก <b>ไดรฟ์ของฉัน</b> (My Drive)',
    share:'เปิด drive.google.com คลิกขวาที่โฟลเดอร์ PENUM-PM › <b>แชร์</b> › ใส่อีเมล เลือก <b>ผู้แก้ไข</b> › ส่ง · คนที่ได้รับเปิด <b>แชร์กับฉัน</b> คลิกขวาที่โฟลเดอร์ › <b>จัดระเบียบ › เพิ่มทางลัด</b> ไปที่ไดรฟ์ของฉัน',
    app:'Google Drive'},
  db:{n:'Dropbox',ic:'◇',
    note:'ติดตั้งโปรแกรม <b>Dropbox</b> บนคอมพิวเตอร์ จะมีโฟลเดอร์ Dropbox ในเครื่อง และซิงค์ให้เอง (บัญชีฟรีพื้นที่ 2 GB พอสำหรับข้อมูล PENUM PM)',
    pc:['ติดตั้งและเปิดโปรแกรม <b>Dropbox</b> ล็อกอินด้วยบัญชีของบริษัท'],at:'<b>Dropbox</b>',
    share:'เปิด dropbox.com คลิกที่ ⋯ ของโฟลเดอร์ PENUM-PM › <b>แชร์</b> › ใส่อีเมล เลือก <b>แก้ไขได้</b> › แชร์ · คนที่ได้รับกด <b>เพิ่มไปยัง Dropbox ของฉัน</b>',
    app:'Dropbox'},
  nas:{n:'โฟลเดอร์กลางในบริษัท (NAS / เซิร์ฟเวอร์)',s:'โฟลเดอร์กลาง',ic:'🖧',
    note:'ใช้โฟลเดอร์แชร์บน NAS หรือเครื่องเซิร์ฟเวอร์ในออฟฟิศ ทุกเครื่องต้องอยู่ในเครือข่ายของบริษัท (หรือต่อ VPN) ข้อมูลไม่ขึ้นคลาวด์ ควรตั้ง NAS ให้สำรองข้อมูลด้วย',
    pc:['ให้คนดูแลไอทีแชร์โฟลเดอร์บน NAS หรือเซิร์ฟเวอร์แบบ <b>อ่านและเขียนได้</b> แล้วต่อเป็นไดรฟ์ในเครื่อง (Map network drive เช่น Z:)'],at:'<b>พีซีเครื่องนี้</b> › ดับเบิลคลิกไดรฟ์ของ NAS',
    share:'ทุกเครื่องในออฟฟิศต่อไดรฟ์ NAS เดียวกัน แล้วกด “เลือกโฟลเดอร์” ในหน้านี้ เลือกโฟลเดอร์ PENUM-PM เดียวกัน',
    app:''},
  loc:{n:'เฉพาะเครื่องนี้ (ไม่แชร์)',s:'เครื่องนี้',ic:'💻',
    note:'เหมาะกับบริษัทที่ใช้คอมพิวเตอร์เครื่องเดียว โปรแกรมบันทึกลงโฟลเดอร์ และเก็บสำรองรายวัน 30 วันไว้ในโฟลเดอร์ backup',
    warn:'ข้อมูลอยู่ในเครื่องนี้เครื่องเดียว ถ้าเครื่องเสียหรือหาย ข้อมูลหายด้วย คัดลอกโฟลเดอร์ PENUM-PM ลงแฟลชไดรฟ์หรือฮาร์ดดิสก์ภายนอกอย่างน้อยสัปดาห์ละครั้ง',
    pc:[],at:'<b>เอกสาร</b> (Documents)',
    share:'',app:''}};
const SPK=['od','gd','db','nas','loc'],SPLS='pmSyncP'+DSFX;
function spGet(){const k=(typeof DB!=='undefined'&&DB&&DB.co&&DB.co.syncP)||(()=>{try{return localStorage.getItem(SPLS)}catch(e){return ''}})();// a company on a folder from before the cloud existed keeps showing its folder place
  return SYNCP[k]&&!(k==='sb'&&!(typeof sbOn==='function'&&sbOn())&&folderOn())?k:folderOn()&&!(typeof sbOn==='function'&&sbOn())?'od':SPK[0]}
const spN=k=>{const p=SYNCP[k||spGet()];return p.s||p.n};
ACT.spSet=b=>{const k=b.dataset.k;if(!SYNCP[k])return;try{localStorage.setItem(SPLS,k)}catch(e){}
  // only a company that already exists keeps it in its data (an empty welcome screen must stay empty)
  if(DB&&DB.co&&(DB.co.name||DB.co.setupAt||!dbEmpty())&&DB.co.syncP!==k&&!(typeof licRO==='function'&&licRO())){DB.co.syncP=k;save()}render()};
// 3.51: OneDrive (the usual case) is the only choice in view; the other places fold away under "ที่อื่น"
const spChip=(k,a,cur)=>`<button type="button" class="sp-c" data-a="${a}" data-k="${k}" aria-pressed="${k===cur}"><span aria-hidden="true">${SYNCP[k].ic}</span>${esc(SYNCP[k].n)}${k===SPK[0]?' <small>(แนะนำ)</small>':''}</button>`;
const spChips=(a='spSet',cur=spGet())=>{const P=SPK[0];return `<div class="sp-g" role="group" aria-label="เก็บข้อมูลไว้ที่">${spChip(P,a,cur)}${cur!==P?spChip(cur,a,cur):''}</div>
  <details class="sp-more"${cur!==P?' open':''}><summary>ใช้ที่อื่นแทน ${esc(SYNCP[P].s||SYNCP[P].n)} (${SPK.filter(k=>k!==P).map(k=>esc(SYNCP[k].s||SYNCP[k].n)).join(', ')})</summary><div class="sp-g">${SPK.filter(k=>k!==P&&k!==cur).map(k=>spChip(k,a,cur)).join('')}</div></details>`};
// the computer steps for the chosen place; the new-folder rule is the same everywhere
// 3.51: no "new folder" step any more: the user picks the place itself and PENUM PM makes its own PENUM-PM folder inside
function spSteps(k=spGet()){const p=SYNCP[k];
  return `${k==='od'?'':`<div class="sp-n">${p.note}</div>`}${p.warn?`<div class="sp-n sp-w">⚠ ${p.warn}</div>`:''}
  <ol class="hint" style="padding-left:18px;line-height:1.9">${p.pc.map(x=>`<li>${x}</li>`).join('')}
  <li>กดปุ่ม <b>${esc(spBtnT(k))}</b> ด้านล่าง</li>
  <li>หน้าต่างเลือกโฟลเดอร์จะเปิดขึ้น กด ${p.at} ทางซ้าย แล้วกด <b>เลือกโฟลเดอร์</b> ได้เลย</li>
  <li>กด <b>แก้ไขไฟล์</b> (หรือ อนุญาต)</li></ol>
  <p class="hint" style="margin-top:0">PENUM PM สร้างโฟลเดอร์ <b>PENUM-PM</b> ข้างในให้เอง และเขียนเฉพาะในโฟลเดอร์นั้น ไม่แตะไฟล์หรือโฟลเดอร์อื่น</p>`}
const spBtnT=k=>(k||spGet())==='sb'?'✦ เก็บข้อมูลบนคลาวด์ PENUM':'📁 เก็บข้อมูลใน '+((SYNCP[k||spGet()]||SYNCP.od).s||(SYNCP[k||spGet()]||SYNCP.od).n);
const spBtn=(t)=>`<button type="button" class="btn pri" data-a="fPick"${fsOK()?'':' disabled'}>${t||esc(spBtnT())}</button>`;

// wizard last step
wizFolderView=function(){return `<section class="card" id="spWiz"><h2><span>ขั้นสุดท้าย: เลือกที่เก็บข้อมูลของบริษัท</span><small>ทุกเครื่องที่เชื่อมโฟลเดอร์เดียวกันเห็นข้อมูลชุดเดียวกัน และมีสำรองอัตโนมัติทุกวัน</small></h2>
  ${spChips()}${spSteps()}
  <div class="row">${spBtn()}<button type="button" class="btn ghost" data-a="wizFSkip">ข้ามไปก่อน เก็บในเบราว์เซอร์</button></div>
  ${fsOK()?'':'<p class="hint">เบราว์เซอร์นี้เลือกโฟลเดอร์ไม่ได้ ใช้ Edge หรือ Chrome บนคอมพิวเตอร์ หรือกดข้ามแล้วสำรองข้อมูลจากเมนูเป็นระยะ</p>'}</section>`};

// welcome screen: the wording no longer says OneDrive only
{const f=welcomeView;welcomeView=function(){return f().replace('หรือในโฟลเดอร์ OneDrive ของบริษัทคุณเอง','หรือในโฟลเดอร์ของบริษัทคุณเอง บน OneDrive, Google Drive, Dropbox หรือ NAS ในออฟฟิศ')
  .replace('<b>เชื่อมโฟลเดอร์ OneDrive ที่มีข้อมูลบริษัทอยู่แล้ว</b>','<b>เชื่อมโฟลเดอร์ PENUM-PM ที่มีข้อมูลบริษัทอยู่แล้ว</b>')
  .replace('เลือกโฟลเดอร์ PENUM-PM เดิม','เลือก OneDrive (หรือที่เก็บเดิม) ระบบหาโฟลเดอร์ PENUM-PM ให้เอง')}}

// ตั้งค่า: the folder card offers the choice before connecting and shows the right sharing steps after
function spCard(){const on=folderOn(),p=SYNCP[spGet()];
  return `<section class="card" id="folderCard"><h2><span>โฟลเดอร์ข้อมูล PENUM-PM</span><small>PENUM PM บันทึกลงโฟลเดอร์ในคอมพิวเตอร์ แล้วโปรแกรมซิงค์ (OneDrive, Google Drive, Dropbox) หรือ NAS ส่งต่อให้เครื่องอื่น ใช้ได้กับ Edge หรือ Chrome บนคอมพิวเตอร์</small></h2>
  ${on?`<dl class="stats"><div><dt>โฟลเดอร์</dt><dd style="font-size:15px">${esc(CL.dirName)}<br><small>${esc(p.n)}</small></dd></div><div><dt>บันทึกล่าสุด</dt><dd style="font-size:15px">${CL.last?new Date(CL.last).toLocaleString('th-TH'):'–'}</dd></div><div><dt>สำรองอัตโนมัติ</dt><dd style="font-size:15px">วันละครั้ง เก็บ 30 วัน <small>(โฟลเดอร์ backup)</small></dd></div></dl>
    ${FS.state==='err'?`<p class="pill bad" style="display:inline-block;margin-bottom:8px">${esc(FS.msg)}</p>`:''}
    <div class="row"><button type="button" class="btn pri" data-a="fSync">บันทึกและดึงข้อมูลตอนนี้</button><button type="button" class="btn" data-a="spMove">ย้ายที่เก็บข้อมูล</button><button type="button" class="btn" data-a="fOff">เลิกเชื่อมบนเครื่องนี้</button></div>
    <p class="hint" style="margin:10px 0 0">โฟลเดอร์นี้อยู่ที่ (เลือกให้ตรง เพื่อให้วิธีแชร์และวิธีใช้บนมือถือถูกต้อง)</p>${spChips()}
    ${p.warn?`<div class="sp-n sp-w">⚠ ${p.warn}</div>`:''}
    ${p.share?`<p class="hint">ให้คนอื่นใช้ข้อมูลชุดเดียวกัน: ${p.share} จากนั้นในเครื่องของเขากดปุ่ม “เลือกโฟลเดอร์” ในหน้านี้ แล้วเลือกโฟลเดอร์เดียวกัน</p>`:''}`
  :`<p class="hint" style="margin:0">เก็บข้อมูลไว้ที่</p>${spChips()}${spSteps()}${spBtn()}${fsOK()?'':' <span class="hint">เบราว์เซอร์นี้ใช้ไม่ได้ ใช้ Edge หรือ Chrome บนคอมพิวเตอร์</span>'}`}</section>`}
{const f=CVIEWS.coset;CVIEWS.coset=()=>{let h=f();if(cloudOn())return h;
  h=h.replace(/<section class="card" id="folderCard">[\s\S]*?<\/section>/,()=>spCard());
  const p=SYNCP[spGet()];
  return h.replace(/ · แชร์โฟลเดอร์ PENUM-PM ให้เขาแบบ <b>แก้ไขได้<\/b> เพื่อให้ส่งงานกลับเข้าโฟลเดอร์ได้/,p.app?` · แชร์โฟลเดอร์ PENUM-PM บน ${esc(p.app)} ให้เขาแบบ <b>แก้ไขได้</b> และให้เขาติดตั้งแอป ${esc(p.app)} ในมือถือ`:' · ส่งไฟล์ penum-pm.json จากโฟลเดอร์ PENUM-PM ให้เขาทาง LINE หรืออีเมล แล้วรับงานกลับด้วยปุ่มนำเข้าด้านบน')}}

// header button
{const cb=cloudBadge;cloudBadge=function(){cb();const b=$('#cloudBtn');if(!b)return;if(!folderOn()){if(!cloudOn())b.textContent=b.textContent.replace('ยังไม่เชื่อม OneDrive','ยังไม่เชื่อมโฟลเดอร์');return}b.textContent=b.textContent.replace('OneDrive',spN())}}

// phone: receive / send steps for the chosen place
function spPhone(){const k=spGet(),p=SYNCP[k],ios=isIOS();
  if(!p.app)return `<p><b>รับข้อมูลล่าสุด</b></p><ol><li>ขอไฟล์ <b>penum-pm.json</b> จากผู้ดูแลระบบทาง LINE หรืออีเมล แล้วบันทึกลงเครื่อง</li><li>กด <b>⬇ รับข้อมูลล่าสุด</b> แล้วเลือกไฟล์นั้น${ios?' (อยู่ในแอป <b>ไฟล์</b>)':' (อยู่ใน <b>ดาวน์โหลด</b>)'}</li></ol>
    <p><b>ส่งงานเข้าระบบ</b></p><ol><li>กด <b>⬆ ส่งงานเข้าระบบ</b> แล้วเลือก <b>LINE</b> หรือ <b>อีเมล</b> ส่งให้ผู้ดูแลระบบ</li><li>ผู้ดูแลระบบกด <b>นำเข้างานจากมือถือ</b> ที่หน้า ตั้งค่า${k==='nas'?' หรือคัดลอกไฟล์ลงโฟลเดอร์ PENUM-PM บน NAS แล้วคอมพิวเตอร์จะรวมให้เอง':''}</li></ol>
    <p class="hint">${k==='nas'?'NAS ในออฟฟิศเปิดจากมือถือนอกบริษัทไม่ได้ จึงรับส่งเป็นไฟล์':'ข้อมูลเก็บเฉพาะคอมพิวเตอร์เครื่องเดียว จึงรับส่งเป็นไฟล์'}</p>`;
  const pick=ios?`หน้าต่างเลือกไฟล์จะเปิดขึ้น กด <b>เลือกดู</b> (Browse) › <b>${p.app}</b>`:`หน้าต่างเลือกไฟล์จะเปิดขึ้น กดเมนู ☰ มุมซ้ายบน › <b>${p.app==='Google Drive'?'ไดรฟ์ (Drive)':p.app}</b>`,
    shared=k==='gd'?'แชร์กับฉัน':k==='db'?'แชร์':'แชร์';
  return `<p><b>รับข้อมูลล่าสุด</b></p><ol><li>กด <b>⬇ รับข้อมูลล่าสุด</b></li><li>${pick} (ต้องมีแอป ${p.app} ในมือถือและล็อกอินแล้ว)</li>
    <li>เข้าโฟลเดอร์ <b>PENUM-PM</b> (ถ้าเป็นโฟลเดอร์ที่คนอื่นแชร์ให้ จะอยู่ในหัวข้อ <b>${shared}</b>) แล้วแตะไฟล์ <b>penum-pm.json</b></li></ol>
  <p><b>ส่งงานเข้าระบบ</b> (หลังเขียนรายงาน ถ่ายรูป หรือยื่นใบลาเสร็จ)</p><ol><li>กด <b>⬆ ส่งงานเข้าระบบ</b></li>
    <li>${ios?`เลือก <b>บันทึกไปยังแอปไฟล์</b> (Save to Files) › <b>${p.app}</b> › โฟลเดอร์ <b>PENUM-PM</b> › กด <b>บันทึก</b>`:`เลือกแอป <b>${p.app}</b> › เลือกโฟลเดอร์ <b>PENUM-PM</b> › กด <b>${k==='gd'?'บันทึก':'อัปโหลด'}</b> (หรือ ✓)`}</li>
    <li>คอมพิวเตอร์ที่เปิด PENUM PM และเชื่อมโฟลเดอร์ไว้จะรวมงานจากมือถือให้เองภายในไม่กี่นาที</li></ol>
  <p class="hint">ไม่มีแอป ${p.app} ในมือถือ: ส่งไฟล์ทาง LINE หรืออีเมลให้ผู้ดูแลระบบ แล้วผู้ดูแลระบบกด <b>นำเข้างานจากมือถือ</b> ที่หน้า ตั้งค่า · ใช้เฉพาะโฟลเดอร์ PENUM-PM ไม่ยุ่งกับไฟล์อื่น</p>`}
{const f=mobSync;mobSync=function(){return f().replace(/(<summary>วิธีรับและส่งงาน ทีละขั้น<\/summary>)[\s\S]*<\/details>/,(m,s)=>`${s}<p class="hint" style="margin:6px 0 0">โฟลเดอร์ของบริษัทอยู่ที่</p>${spChips()}${spPhone()}</details>`)}}
// "รับข้อมูลจากบริษัท (OneDrive)" buttons and the empty-phone card name the chosen place
{const lab=()=>{const p=SYNCP[spGet()];return p.app||'ไฟล์จากผู้ดูแล'};
  const fix=h=>h.replace(/⬇ รับข้อมูลจากบริษัท \(OneDrive\)/g,()=>`⬇ รับข้อมูลจากบริษัท (${esc(lab())})`)
    .replace('ในโฟลเดอร์ PENUM-PM บน OneDrive ที่ผู้ดูแลระบบแชร์ให้',()=>{const p=SYNCP[spGet()];return p.app?`ในโฟลเดอร์ PENUM-PM บน ${esc(p.app)} ที่ผู้ดูแลระบบแชร์ให้`:'ที่ผู้ดูแลระบบส่งให้ทาง LINE หรืออีเมล'});
  for(const v of ['exec','mine'])if(CVIEWS[v]){const f=CVIEWS[v];CVIEWS[v]=function(){return fix(f.apply(this,arguments))}}}
{const t=toast;toast=function(m){return t(typeof m==='string'?m.replace('ย้ายไฟล์นี้เข้าโฟลเดอร์ PENUM-PM ใน OneDrive',()=>{const p=SYNCP[spGet()];return p.app?`ย้ายไฟล์นี้เข้าโฟลเดอร์ PENUM-PM ใน ${p.app}`:'ส่งไฟล์นี้ให้ผู้ดูแลระบบทาง LINE หรืออีเมล'}):m)}}
// the wizard sets the place chosen on the welcome screen into the new company's data
{const f=ACT.wizDone;ACT.wizDone=async function(){const r=await f.apply(this,arguments);try{if(DB.co.setupAt&&!DB.co.syncP){const k=localStorage.getItem(SPLS);if(SYNCP[k]){DB.co.syncP=k;save()}}}catch(e){}return r}}
Object.assign(SBKW,{'co.coset':(SBKW['co.coset']||'')+' โฟลเดอร์ OneDrive Google Drive Dropbox NAS ซิงค์ แชร์ข้อมูล'});

/* ---------- 3.51 simpler storage: pick the place, PENUM PM makes its own folder ----------
   Before, the user had to press "โฟลเดอร์ใหม่" in the browser's folder window, type PENUM-PM, go into it and only then
   press เลือกโฟลเดอร์; picking OneDrive itself was refused. Now any of these works:
   - the PENUM-PM folder itself (empty, or already holding this company's data) - used as it is, like before;
   - the place above it (OneDrive, My Drive, Dropbox, Documents…) - a PENUM-PM folder in it that holds this company's
     data is used; otherwise a new folder is created (PENUM-PM, or PENUM-PM-<name> when PENUM-PM is someone else's).
   Nothing outside that one folder is read beyond the names in the picked place, and nothing there is changed.
   "ย้ายที่เก็บข้อมูล" in ตั้งค่า moves the data to a new place the same way; the old folder is left as it was. */
const fOther=async h=>{const o=[];for await(const [nm] of h.entries())if(!(nm===FNAME||nm==='backup'||nm==='photos'||nm==='mobile-done'||nm==='cloud-backup'||/^penum-pm.*\.json$/i.test(nm)||/^(desktop\.ini|thumbs\.db|\.ds_store|\.dropbox.*|icon\r?)$/i.test(nm)))o.push(nm);return o};
const fData=async h=>{const c=await fRead(h,FNAME);try{return c?JSON.parse(c.txt||EMPTY):null}catch(e){return null}};
async function fRes(h,noMake){
  // 1) the picked folder is a PENUM-PM folder (data in it, or nothing else in it)
  const d0=await fData(h);if(d0){const x=coClash(d0);return x?{err:clashMsg(x)}:{h}}
  if(!(await fOther(h)).length)return {h};
  // 2) a PENUM-PM folder inside the picked place
  const subs=[];for await(const [nm,c] of h.entries())if(c.kind==='directory'&&/^penum-pm/i.test(nm))subs.push(c);
  subs.sort((a,b)=>(a.name.toUpperCase()==='PENUM-PM'?0:1)-(b.name.toUpperCase()==='PENUM-PM'?0:1));
  for(const c of subs){const d=await fData(c);if(d&&d.co&&!coClash(d)&&(!(DB.co.name||'').trim()||!(d.co.name||'').trim()||(d.co.name||'').trim()===(DB.co.name||'').trim()))return {h:c,found:1}}
  if(noMake)return {err:`ไม่พบข้อมูล PENUM PM ใน “${h.name}”\nเลือกที่เก็บที่บริษัทใช้อยู่ (เช่น OneDrive) หรือโฟลเดอร์ PENUM-PM ของบริษัท`};
  // 3) a new folder (never into one with other files or another company's data)
  const tag=((DB.co.nameEn||'').trim().split(/\s+/)[0]||'').replace(/[^\w-]/g,'')||(COSLOT?'co'+COSLOT:'');
  const names=['PENUM-PM',...(tag?['PENUM-PM-'+tag]:[]),'PENUM-PM-2','PENUM-PM-3','PENUM-PM-4'];
  for(const nm of names){let c=null;try{c=await h.getDirectoryHandle(nm)}catch(e){}
    if(!c){try{return {h:await h.getDirectoryHandle(nm,{create:true}),made:1}}catch(e){return {err:`สร้างโฟลเดอร์ ${nm} ใน “${h.name}” ไม่ได้ (${e.message||e.name})`}}}
    if(!(await fData(c))&&!(await fOther(c)).length)return {h:c}}
  return {err:`ใน “${h.name}” มีโฟลเดอร์ PENUM-PM ของบริษัทอื่นหลายโฟลเดอร์แล้ว เลือกที่อื่น`}}
ACT.fPick=async()=>{if(!fsOK()){toast('ใช้ได้กับ Edge หรือ Chrome บนคอมพิวเตอร์');return}
  let h0;try{h0=await showDirectoryPicker({id:'penum-pm',mode:'readwrite',startIn:'documents'})}catch(e){return}
  let r;try{r=await fRes(h0,welcomeOn())}catch(e){r={err:'เปิดโฟลเดอร์นี้ไม่ได้ ('+(e.message||e.name)+')'}}
  if(r.err){alert(r.err);return}
  const h=r.h,mv=window.__spMv;window.__spMv='';
  await IDB.put('__dirh',h);FS.h=h;CL.dirName=h.name;CL.dirMtime=0;CL.dirPh=[];CL.dirBk='';clSave();
  if(mv&&SYNCP[mv]){try{localStorage.setItem(SPLS,mv)}catch(e){}if(DB.co&&(DB.co.name||DB.co.setupAt)&&!(typeof licRO==='function'&&licRO())){DB.co.syncP=mv;save()}}
  const cur=await fRead(h,FNAME),hasLocal=Object.values(DB.projects).some(p=>p.boq.items.length||p.tasks.length)||DB.co.staff.length;
  const keep=!cur||(hasLocal&&confirm('โฟลเดอร์นี้มีข้อมูลกลางอยู่แล้ว รวมข้อมูลในเครื่องนี้เข้าไปด้วยไหม?\nกด ตกลง = รวม · กด ยกเลิก = ใช้ข้อมูลในโฟลเดอร์อย่างเดียว (ข้อมูลในเครื่องนี้ถูกแทนที่)'));
  await baseSet(keep?EMPTY:payload());await folderSync(true);
  const d=$('#dlg');if(d&&d.open&&d.querySelector('#spMv'))d.close();
  toast(cur?`เชื่อมโฟลเดอร์ ${h.name} แล้ว`:`สร้างโฟลเดอร์ ${h.name}${h0!==h?' ใน '+h0.name:''} และบันทึกข้อมูลแล้ว`);render()};
// ตั้งค่า › ย้ายที่เก็บข้อมูล: choose the new place in a dialog; the folder in use only changes once the new one is picked
function spMoveBody(k){return `<div id="spMv"><p>ข้อมูลทั้งหมดของ <b>${esc(DB.co.name||'บริษัทนี้')}</b> จะถูกบันทึกไปที่ใหม่ โฟลเดอร์เดิม <b>${esc(CL.dirName||'')}</b> ไม่ถูกลบหรือแก้ไข (ลบเองทีหลังได้เมื่อแน่ใจ)</p>
  <p class="hint" style="margin:0">ย้ายไปเก็บที่</p>${spChips('spMvSet',k)}${spSteps(k)}
  <p class="hint">หลังย้าย: ให้พนักงานที่ใช้คอมพิวเตอร์ของตัวเองเชื่อมที่ใหม่ (ส่ง <b>ลิงก์เชิญ</b> ใหม่ให้ ที่ ตั้งค่า › เข้าระบบด้วย PIN)${SYNCP[k].share?` และแชร์โฟลเดอร์ใหม่ให้เขา: ${SYNCP[k].share}`:''}</p></div>`}
const spMoveOpen=k=>{window.__spMv=k;dialog('ย้ายที่เก็บข้อมูล',spMoveBody(k),`<button type="button" class="btn pri" data-a="fPick"${fsOK()?'':' disabled'}>${esc(spBtnT(k))}</button>`)};
ACT.spMove=()=>spMoveOpen(spGet());
ACT.spMvSet=b=>{if(SYNCP[b.dataset.k])spMoveOpen(b.dataset.k)};
{const c=ACT.dlgClose;ACT.dlgClose=b=>{window.__spMv='';return c(b)}}
// staff join: picking OneDrive itself is enough, the shared folder is found inside it
ACT.joinPick=async()=>{const o=joinP();if(!o)return;let h;try{h=await showDirectoryPicker({id:'penum-pm',mode:'readwrite'})}catch(e){return}
  let j=await fData(h);
  if(!j||!j.co){const L=[];for await(const [nm,c] of h.entries())if(c.kind==='directory'&&(nm===o.dir||/^penum-pm/i.test(nm)))L.push(c);
    L.sort((a,b)=>(a.name===o.dir?0:1)-(b.name===o.dir?0:1));let alt=null;
    for(const c of L){const d=await fData(c);if(!d||!d.co)continue;if(!alt)alt=[c,d];if((d.co.name||'').trim()===(o.co||'').trim()){alt=[c,d];break}}
    if(alt)[h,j]=alt}
  if(!j||!j.co){alert(`ยังไม่พบข้อมูลของ ${o.co} ใน “${h.name}”\nตรวจว่ากด “เพิ่มทางลัดไปยังไฟล์ของฉัน” ในอีเมลแชร์โฟลเดอร์ ${o.dir} แล้ว และรอโปรแกรม ${(SYNCP[o.sp]||{}).app||'ซิงก์'} โหลดเสร็จ จากนั้นกดปุ่มนี้อีกครั้ง`);return}
  const fn=(j.co.name||'').trim();if(fn&&o.co&&fn!==o.co.trim()&&!confirm(`โฟลเดอร์ ${h.name} เป็นข้อมูลของ “${fn}” ไม่ใช่ “${o.co}” ใช้โฟลเดอร์นี้ต่อไหม?`))return;
  try{if(o.sp)localStorage.setItem(SPLS,o.sp)}catch(e){}
  await IDB.put('__dirh',h);FS.h=h;CL.dirName=h.name;CL.dirMtime=0;CL.dirPh=[];CL.dirBk='';clSave();
  await baseSet(payload());await folderSync(true);joinClear();PINAUTH={last:o.who||''};authSave();S.noWelcome=true;saveUI();toast(`เชื่อมข้อมูล ${fn||o.co} แล้ว เลือกชื่อและใส่ PIN`);render()};
{const f=joinView;joinView=function(o){const p=SYNCP[o.sp]||SYNCP.od;
  return f(o).replace(/<li>กดปุ่มด้านล่าง ในหน้าต่างที่เปิดขึ้น[\s\S]*?<\/li>/,()=>`<li>กดปุ่มด้านล่าง หน้าต่างเลือกโฟลเดอร์จะเปิดขึ้น กด ${p.app?p.at:'<b>พีซีเครื่องนี้</b> › ไดรฟ์ของโฟลเดอร์กลาง'} ทางซ้าย แล้วกด <b>เลือกโฟลเดอร์</b> ได้เลย (ระบบหาโฟลเดอร์ ${esc(o.dir)} ให้เอง) › กด <b>แก้ไขไฟล์</b></li>`)
    .replace(/data-a="joinPick">เลือกโฟลเดอร์ [^<]*</,()=>`data-a="joinPick">📁 เชื่อมข้อมูลบริษัท<`)}}
{const f=joinTxt;joinTxt=function(o,link){const p=SYNCP[o.sp]||SYNCP.od;return f(o,link).replace(/3\) กดปุ่ม "เลือกโฟลเดอร์ [^\n]*/,()=>`3) กดปุ่ม "เชื่อมข้อมูลบริษัท" แล้วกด ${p.app||'โฟลเดอร์กลาง'} ทางซ้าย กด "เลือกโฟลเดอร์" ได้เลย (ระบบหาโฟลเดอร์ ${o.dir} ให้เอง)`)}}

