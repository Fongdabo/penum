/* ---------- 3.12: a new company of its own ----------
   For contractors trying PENUM PM: with no data the app opens on a welcome screen instead of filling in ORIEN, and the
   menu has "เริ่มบริษัทใหม่" (after offering a backup). A short setup form takes the company's names, logo, tax ID and
   branch, address, VAT registration, document number prefixes and the administrator's PIN, then links the company's
   own OneDrive PENUM-PM folder. Prints use that company's name and logo; ORIEN's own blank forms are hidden. */
function dbEmpty(){const C=DB.co;return !(C.name||'').trim()&&!C.customers.length&&!C.staff.length&&!C.quotes.length&&!(C.tenders||[]).length&&
  Object.values(DB.projects).every(p=>!p.boq.items.length&&!p.tasks.length&&!p.bills.length&&!p.daily.length)}
// ORIEN's own material (blank PDF forms, the ORIEN fill-in button) only for ORIEN, or for data set up before this release
const genericCo=()=>!!DB.co.setupAt&&!/โอเรียน|ORIEN/i.test(DB.co.name||'');
const PFX=[['QT-','ใบเสนอราคา'],['PR-','ใบขอซื้อ'],['PO-','ใบสั่งซื้อ'],['INV-','ใบเบิกงวดงาน'],['IV-','ใบกำกับภาษี'],['RC-','ใบเสร็จรับเงิน'],['BN-','ใบวางบิล'],['VO-','งานเพิ่ม-ลด (VO)'],['JOB-','ใบงานบริการ']];
// a staff phone starts from its own "รับข้อมูลจากบริษัท" screen, so the welcome is for computers
const welcomeOn=()=>!S.wiz&&!S.noWelcome&&!DB.co.setupAt&&dbEmpty()&&!folderOn()&&!cloudOn()&&!(typeof mobileMode==='function'&&mobileMode());

function welcomeView(){return `<section class="card wl"><div class="wl-h"><h1>เริ่มใช้ PENUM PM</h1><p>ระบบบริหารโครงการและบริษัทสำหรับผู้รับเหมา ข้อมูลเก็บในเครื่องนี้ หรือในโฟลเดอร์ OneDrive ของบริษัทคุณเอง</p></div>
  <div class="wl-g">
    <button type="button" class="wl-c pri" data-a="wizStart"><b>ตั้งค่าบริษัทใหม่</b><span>ใส่ชื่อบริษัท โลโก้ เลขผู้เสียภาษี และ PIN ผู้ดูแล ใช้เวลาไม่กี่นาที เอกสารทุกใบจะพิมพ์ในนามบริษัทของคุณ</span></button>
    <button type="button" class="wl-c" data-a="fPick"${fsOK()?'':' disabled'}><b>เชื่อมโฟลเดอร์ OneDrive ที่มีข้อมูลบริษัทอยู่แล้ว</b><span>เครื่องใหม่ของบริษัทที่ใช้ PENUM PM อยู่แล้ว เลือกโฟลเดอร์ PENUM-PM เดิม${fsOK()?'':' (ใช้ Edge หรือ Chrome บนคอมพิวเตอร์)'}</span></button>
    <button type="button" class="wl-c" data-a="restore"><b>เปิดไฟล์สำรอง</b><span>ไฟล์ PENUM-PM-วันที่.json ที่ดาวน์โหลดไว้</span></button>
    <button type="button" class="wl-c" data-a="loadDemo"><b>ลองด้วยข้อมูลตัวอย่าง</b><span>บริษัทตัวอย่าง พร้อมโครงการ ใบเสนอราคา พนักงาน ไว้ลองกดดูก่อน ลบทิ้งได้ภายหลังด้วย “เริ่มบริษัทใหม่” ในเมนู</span></button>
  </div><p style="margin-top:14px"><button type="button" class="btn ghost sm" data-a="wlSkip">ข้ามไปก่อน</button></p></section>`}
ACT.wlSkip=()=>{S.noWelcome=true;saveUI();render()};
ACT.wizStart=()=>{S.wiz=true;DB.co.pfx=DB.co.pfx||{};render();scrollTo({top:0})};

function wizView(){const c=CO();c.pfx=c.pfx||{};const f=(k,l,cls='',ph='')=>`<label class="${cls}">${l}<input data-p="co.${k}" value="${esc(c[k]||'')}"${ph?` placeholder="${esc(ph)}"`:''}></label>`;
  return `<section class="card"><h2><span>ตั้งค่าบริษัท</span><small>ข้อมูลนี้ขึ้นหัวเอกสารทุกใบ แก้ภายหลังได้ที่ ตั้งค่า › ตั้งค่าบริษัท</small></h2>
    <h3 class="wz-s">1. บริษัท</h3><div class="form">${f('name','ชื่อบริษัท (ไทย) *','w2','บริษัท ตัวอย่าง จำกัด')}${f('nameEn','ชื่อภาษาอังกฤษ','w2','Example Co., Ltd.')}
      ${f('tax','เลขประจำตัวผู้เสียภาษี 13 หลัก')}${f('branch','สาขา','','สำนักงานใหญ่')}${f('phone','โทรศัพท์')}${f('email','อีเมล')}${f('addr','ที่อยู่','full')}</div>
    <div class="row" style="margin-top:10px;align-items:center">${c.logo?`<img src="${c.logo}" alt="โลโก้" style="height:54px;max-width:160px;object-fit:contain;border:1px solid var(--line);border-radius:10px;padding:4px;background:#fff">`:''}<button type="button" class="btn" data-a="logoUp">${c.logo?'เปลี่ยนโลโก้':'อัปโหลดโลโก้'}</button><span class="hint">ไฟล์รูป PNG หรือ JPG</span></div>
    <h3 class="wz-s">2. ภาษีมูลค่าเพิ่ม</h3><label style="flex-direction:row;align-items:center;gap:8px;display:flex"><input type="checkbox" data-t="chk" data-p="co.vatReg"${c.vatReg!==false?' checked':''}> จดทะเบียนภาษีมูลค่าเพิ่ม (คิด VAT 7% ในโครงการใหม่ ใบเสนอราคา และใบกำกับภาษี)</label>
    <h3 class="wz-s">3. เลขที่เอกสาร</h3><p class="hint">ตัวหน้าเลขที่ของเอกสารแต่ละชนิด เลขต่อท้ายนับต่อให้อัตโนมัติ เช่น QT-001 หรือ ORQ69-001</p>
    <div class="form">${PFX.map(([k,l])=>`<label>${l}<input data-p="co.pfx.${k}" value="${esc(c.pfx[k]||'')}" placeholder="${k}"></label>`).join('')}</div>
    <h3 class="wz-s">4. ผู้ดูแลระบบ</h3><p class="hint">ผู้ดูแลระบบเห็นทุกส่วน ตั้งสิทธิ์พนักงาน และตั้ง PIN ให้คนอื่น ถ้าใส่ PIN ทุกเครื่องที่ใช้ข้อมูลชุดนี้ต้องใส่ PIN ก่อนใช้งาน</p>
    <div class="form">${f('adminName','ชื่อผู้ดูแลระบบ')}<label>PIN 4–8 หลัก<input id="wzPin" type="password" inputmode="numeric" autocomplete="new-password"></label><label>ใส่ PIN อีกครั้ง<input id="wzPin2" type="password" inputmode="numeric" autocomplete="new-password"></label></div>
    <div class="row" style="margin-top:16px"><button type="button" class="btn pri" data-a="wizDone">บันทึกและไปขั้นต่อไป</button><button type="button" class="btn ghost" data-a="wizCancel">ยกเลิก</button></div></section>`}
ACT.wizCancel=()=>{S.wiz=false;render()};
ACT.wizDone=async()=>{const C=DB.co,pin=(($('#wzPin')||{}).value||'').trim(),pin2=(($('#wzPin2')||{}).value||'').trim();
  if(!(C.name||'').trim()){toast('ใส่ชื่อบริษัทก่อน');const i=$('[data-p="co.name"]');if(i)i.focus();return}
  if(pin||pin2){if(!/^\d{4,8}$/.test(pin)){toast('PIN ต้องเป็นตัวเลข 4–8 หลัก');return}if(pin!==pin2){toast('PIN สองช่องไม่ตรงกัน');return}
    C.adminPin=await pinHash('admin',pin);C.pinOn=true;PINAUTH={id:'',last:'',at:Date.now()};authSave()}
  Object.keys(C.pfx||{}).forEach(k=>{C.pfx[k]=String(C.pfx[k]||'').trim();if(!C.pfx[k])delete C.pfx[k]});
  C.setupAt=today();Object.values(DB.projects).forEach(p=>{if(!p.info.company)p.info.company=C.name;if(C.vatReg===false&&!p.boq.items.length)p.info.vat=0});
  S.wiz=false;S.wizF=!folderOn();save(true);render();scrollTo({top:0});toast('บันทึกข้อมูลบริษัทแล้ว')};
function wizFolderView(){return `<section class="card"><h2><span>ขั้นสุดท้าย: เก็บข้อมูลในโฟลเดอร์ OneDrive ของบริษัท</span><small>ทุกเครื่องที่เชื่อมโฟลเดอร์เดียวกันเห็นข้อมูลชุดเดียวกัน และมีสำรองอัตโนมัติทุกวัน</small></h2>
  <ol class="hint" style="padding-left:18px;line-height:1.9"><li>เปิดโปรแกรม <b>OneDrive</b> บนคอมพิวเตอร์ ล็อกอินด้วยบัญชีของบริษัท</li><li>กดปุ่มด้านล่าง ในหน้าต่างเลือกโฟลเดอร์ กด <b>OneDrive</b> ทางซ้าย</li>
  <li>กด <b>โฟลเดอร์ใหม่</b> ตั้งชื่อ <b>PENUM-PM</b> แล้วเข้าไปในโฟลเดอร์นั้น (โปรแกรมไม่แตะไฟล์อื่นของบริษัท)</li><li>กด <b>เลือกโฟลเดอร์</b> แล้ว <b>อนุญาต</b> ให้แก้ไขไฟล์</li></ol>
  <div class="row"><button type="button" class="btn pri" data-a="fPick"${fsOK()?'':' disabled'}>เลือกโฟลเดอร์ OneDrive</button><button type="button" class="btn ghost" data-a="wizFSkip">ข้ามไปก่อน เก็บในเครื่องนี้</button></div>
  ${fsOK()?'':'<p class="hint">เบราว์เซอร์นี้เลือกโฟลเดอร์ไม่ได้ ใช้ Edge หรือ Chrome บนคอมพิวเตอร์ หรือกดข้ามแล้วสำรองข้อมูลจากเมนูเป็นระยะ</p>'}</section>`}
ACT.wizFSkip=()=>{S.wizF=false;render()};

{const r=render;render=function(){const x=r.apply(this,arguments);try{if(typeof DB==='undefined'||!DB||(typeof pinOn==='function'&&pinOn()&&!authOK()))return x;const v=$('#view');if(!v)return x;
  if(S.wiz)v.innerHTML=wizView();else if(welcomeOn())v.innerHTML=welcomeView();else if(S.wizF&&folderOn())S.wizF=false;else if(S.wizF)v.insertAdjacentHTML('afterbegin',wizFolderView())}catch(e){console.error(e)}return x}}

/* --- "เริ่มบริษัทใหม่": back up, unlink this computer from the old company's folder, start empty --- */
ACT.coNew=()=>dialog('เริ่มบริษัทใหม่',`<p>ข้อมูลทั้งหมดในเครื่องนี้ (โครงการ ลูกค้า พนักงาน เอกสาร) จะถูกล้าง แล้วเริ่มตั้งค่าบริษัทใหม่</p>
  <p class="hint">ดาวน์โหลดไฟล์สำรองเก็บไว้ก่อน ถ้าเครื่องนี้เชื่อมโฟลเดอร์ OneDrive อยู่ จะเลิกเชื่อมก่อนล้าง ข้อมูลในโฟลเดอร์เดิมไม่ถูกแตะ</p>`,
  `<button type="button" class="btn pri" data-a="coNewBk">ดาวน์โหลดไฟล์สำรอง แล้วเริ่มใหม่</button><button type="button" class="btn" data-a="coNewGo">เริ่มใหม่โดยไม่สำรอง</button>`);
ACT.coNewBk=async()=>{await ACT.backup();ACT.coNewGo({bk:1})};
ACT.coNewGo=async b=>{if(!(b&&b.bk)&&!confirm('ล้างข้อมูลในเครื่องนี้โดยไม่สำรอง? ย้อนกลับไม่ได้'))return;const d=$('#dlg');if(d&&d.open)d.close();
  // never let the empty company be written over the old company's shared data
  if(folderOn()){delete CL.dirName;FS.h=null;FS.state='';await IDB.del('__dirh').catch(()=>{})}
  if(cloudOn()){CL.file=null;CL.ph=[]}clSave();await IDB.del('__cloudbase').catch(()=>{});
  PINAUTH=null;authSave();const p=blankProject('โครงการแรก');DB={v:1,cur:p.id,projects:{[p.id]:p},co:blankCo()};P=p;
  Object.assign(S,{mode:'co',ctab:'exec',dept:'home',sel:{},sub:{},noWelcome:false,wiz:true,wizF:false});DB.co.pfx={};save(true);saveUI();render();scrollTo({top:0});toast('ล้างข้อมูลแล้ว เริ่มตั้งค่าบริษัทใหม่')};
{const m=document.querySelector('#moreMenu .menu hr');if(m)m.insertAdjacentHTML('beforebegin','<button type="button" data-a="coNew">เริ่มบริษัทใหม่</button>')}

/* --- VAT registration decides the VAT of new projects --- */
{const f=blankProject;blankProject=function(name){const p=f(name);try{if(typeof DB!=='undefined'&&DB&&DB.co){if(DB.co.vatReg===false)p.info.vat=0;if(DB.co.name)p.info.company=DB.co.name}}catch(e){}return p}}

/* --- nothing printed or shown says ORIEN for another company --- */
Object.defineProperty(BENPOL.meta,'title',{get(){return 'ระเบียบสวัสดิการพนักงาน '+((typeof DB!=='undefined'&&DB&&DB.co&&DB.co.name)||'บริษัท')},configurable:true});
{const f=orgForms;orgForms=function(){const h=f();if(!genericCo())return h;const t=document.createElement('template');t.innerHTML=h;
  t.content.querySelectorAll('.fm').forEach(c=>{if(!c.querySelector('[data-a="go"]'))c.remove()});t.content.querySelectorAll('a[href^="files/"]').forEach(a=>a.remove());
  t.content.querySelectorAll('h2 small').forEach(s=>s.textContent='ทุกแบบฟอร์มกรอก ออกเลขที่ บันทึก และพิมพ์หัวกระดาษของบริษัทได้ในโปรแกรม กด “ทำในโปรแกรม” เพื่อไปหน้านั้น');return t.innerHTML}}
{const f=ACT.print;ACT.print=b=>{if(genericCo()&&coEmpty()){toast('ใส่ชื่อบริษัทที่ ตั้งค่าบริษัท ก่อนพิมพ์');ACT.coGoSet&&ACT.coGoSet();return}return f(b)}}
{const f=CVIEWS.coset;CVIEWS.coset=()=>f()+`<section class="card"><h2><span>เลขที่เอกสารและภาษี</span><small>ตัวหน้าเลขที่ของเอกสาร และการจดทะเบียน VAT</small><span class="sp"></span><button type="button" class="btn sm" data-a="wizStart">เปิดหน้าตั้งค่าบริษัททั้งหมด</button></h2>
  <p class="hint">${(PFX.filter(([k])=>(DB.co.pfx||{})[k]).map(([k,l])=>`${l} ${esc(DB.co.pfx[k])}`).join(' · '))||'ใช้ตัวหน้าเลขที่มาตรฐาน (QT- PO- INV- …)'} · ${DB.co.vatReg===false?'ไม่ได้จด VAT':'จด VAT'}</p></section>`}

document.head.insertAdjacentHTML('beforeend',`<style>
.wl{max-width:980px;margin:12px auto}.wl-h h1{font-size:26px;margin:0 0 6px}.wl-h p{color:var(--muted);margin:0 0 16px}
.wl-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.wl-c{display:grid;gap:6px;text-align:left;padding:16px;border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--ink);cursor:pointer;font:inherit}
.wl-c b{font-size:16px}.wl-c span{color:var(--muted);font-size:13.5px;line-height:1.5}.wl-c:hover{border-color:var(--pri,#2A7F8C)}
.wl-c.pri{background:linear-gradient(135deg,color-mix(in srgb,var(--pri,#2A7F8C) 14%,var(--surface)),var(--surface));border-color:color-mix(in srgb,var(--pri,#2A7F8C) 50%,var(--line))}
.wl-c[disabled]{opacity:.55;cursor:not-allowed}
.wz-s{font-size:15px;margin:18px 0 8px}
</style>`);
