/* ---------- รหัสเชื่อมโครงการ: a project here takes its BOQ from one PENUM MEP project, wherever MEP was used (PM 3.75) ----------
   P.mep={code,name}: the MEP project by its link code (shared/link.js; MEP shows it on its BOQ page). In this browser MEP's own
   penum.mep.link is used while MEP has that project open, otherwise the copy MEP sends to ORIEN's cloud (encrypted with the code).
   Pulling the BOQ of the MEP project open in this browser links the two. A link …/pm/#mep=<code> from MEP asks which project it is for.
   P.boq.mepAt / mepSig (160-mep-boq.js): when MEP last changed the BOQ that was pulled and what it was, so a change since shows. */
const ML=window.penumLink,MC={};          // code → {L: MEP's link data, at: when the cloud copy changed, t: when last asked, busy, err}
const mepCode=p=>ML&&p&&p.mep?ML.norm(p.mep.code):'';
const mepWhen=ms=>{const d=new Date(ms);return isNaN(d)?'':d.toLocaleString('th-TH',{day:'numeric',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'})};
async function mepFetch(code,force){if(!ML||!code)return;const c=MC[code]||(MC[code]={});if(c.busy||(!force&&Date.now()-(c.t||0)<60e3))return;c.busy=1;const was=JSON.stringify([c.at,c.err]);
  try{const a=await ML.at([code]);if(a.err){c.err=a.err;return}const at=a[code]&&a[code].mep;if(!at){c.err='none';c.L=null;c.at='';return}
    if(at!==c.at||!c.L){const r=await ML.get(code,'mep');if(!r){c.err='none';c.L=null;return}if(r.err){c.err=r.err;return}c.L=r.data&&r.data.boq&&r.data.boq.items?r.data:null;c.at=r.at}c.err=c.L?'':'none'}
  catch(e){c.err='bad'}
  finally{c.busy=0;c.t=Date.now();if(JSON.stringify([c.at,c.err])!==was&&S.mode==='pj'&&S.tab==='setup'&&mepCode(P)===code&&!$('#dlg').open)rerender()}}
mepCur=()=>{const loc=mepLink(),code=mepCode(P);if(!code)return loc;if(loc&&ML.norm(loc.lid)===code)return loc;mepFetch(code);const c=MC[code];return c&&c.L||null};
mepBind=L=>{const c=ML&&ML.norm(L.lid);if(c)P.mep={code:c,name:L.project||''}};
mepBtns=L=>{const code=mepCode(P);let h='';
  if(L)h+=`<button type="button" class="btn${!P.boq.items.length||mepNew(L)?' pri':''}" data-a="pullMep">${code?'ดึง BOQ ล่าสุดจาก PENUM MEP':'ดึง BOQ จาก PENUM MEP'} <small>(${esc(L.project||'')})</small></button>`;
  if(ML&&SUITE)h+=`<button type="button" class="btn" data-a="mepLinkDlg">${code?'เปลี่ยนโครงการ PENUM MEP ที่เชื่อม':'ใส่รหัสเชื่อมจาก PENUM MEP'}</button>`;
  return h};
mepNote=L=>{const code=mepCode(P),loc=mepLink();
  if(!code)return !L&&SUITE?`<p class="hint">ถ้าเปิด PENUM MEP ในเครื่องนี้ ปุ่ม “ดึง BOQ จาก PENUM MEP” จะขึ้นให้กดได้ทันที${ML?' ถ้าใช้ PENUM MEP เครื่องอื่น กด <b>ใส่รหัสเชื่อมจาก PENUM MEP</b> แล้ววางรหัสหรือลิงก์จากหน้า BOQ ของ PENUM MEP':''}</p>`:'';
  const c=MC[code]||{},nw=mepNew(L);
  let h=`<p class="hint">เชื่อมกับโครงการ <b>${esc((L&&L.project)||P.mep.name||'')}</b> ใน PENUM MEP · รหัส ${ML.show(code)}${L&&L.at?' · MEP แก้ไขล่าสุด '+mepWhen(L.at):''}${nw?' · <b style="color:#B45309">มีการแก้ไขหลังดึง BOQ ครั้งล่าสุด</b>':''}</p>`;
  if(!L)h+=`<p class="hint">${c.busy||!c.t?'กำลังดึงข้อมูลจาก PENUM MEP…':{offline:'ยังดึงข้อมูลไม่ได้ ไม่มีอินเทอร์เน็ต',nosql:'ORIEN ยังไม่ได้เปิดบริการเชื่อมข้ามเครื่อง',none:'ยังไม่มีข้อมูลของโครงการนี้บนคลาวด์ ให้เปิดโครงการนี้ใน PENUM MEP ตอนต่ออินเทอร์เน็ตหนึ่งครั้ง'}[c.err]||'ยังดึงข้อมูลไม่ได้'}</p>`;
  if(loc&&ML.norm(loc.lid)&&ML.norm(loc.lid)!==code)h+=`<p class="hint">PENUM MEP ในเครื่องนี้เปิดโครงการ “${esc(loc.project||'')}” อยู่ <button type="button" class="btn sm" data-a="mepUseLocal">เชื่อมกับโครงการนั้นแทน</button></p>`;
  return h};
ACT.mepUseLocal=()=>{const L=mepLink();if(!L||!ML.norm(L.lid))return;mepBind(L);save();render();toast(`เชื่อมกับ “${L.project||''}” แล้ว กดดึง BOQ ล่าสุดได้เลย`)};
ACT.mepLinkDlg=()=>{const code=mepCode(P);
  dialog('เชื่อมกับโครงการใน PENUM MEP',`<ol class="steps"><li>ที่ PENUM MEP เปิดโครงการ แล้วไปหน้า <b>BOQ</b></li><li>กด <b>คัดลอกลิงก์สำหรับ PENUM PM</b> หรือ <b>คัดลอกรหัส</b></li><li>วางในช่องด้านล่าง แล้วกด <b>ค้นหาโครงการ</b></li></ol>
    <label>รหัสหรือลิงก์จาก PENUM MEP<input id="mepCodeIn" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autocomplete="off"></label>
    ${code?`<p class="hint">ตอนนี้เชื่อมกับ “${esc(P.mep.name||'')}” (${ML.show(code)}) <button type="button" class="btn sm" data-a="mepUnlink">เลิกเชื่อม</button></p>`:''}`,
    `<button type="button" class="btn pri" data-a="mepFind">ค้นหาโครงการ</button>`);setTimeout(()=>{const i=$('#mepCodeIn');if(i)i.focus()},50)};
ACT.mepUnlink=()=>{delete P.mep;$('#dlg').close();save();render();toast('เลิกเชื่อมกับ PENUM MEP แล้ว BOQ ที่ดึงไว้ยังอยู่')};
ACT.mepFind=()=>{const c=ML.norm($('#mepCodeIn').value);if(!c){toast('รหัสไม่ถูกต้อง คัดลอกจากหน้า BOQ ของ PENUM MEP อีกครั้ง');return}mepPick(c)};
// which project here a MEP project goes to: the one linked to it already, one with its name, this one while it has no BOQ, or a new one
async function mepPick(code){dialog('เชื่อมกับโครงการใน PENUM MEP','<p>กำลังค้นหาโครงการจาก PENUM MEP…</p>','');
  const loc=mepLink();let L=loc&&ML.norm(loc.lid)===code?loc:null;if(!L){await mepFetch(code,true);L=(MC[code]||{}).L}
  if(!$('#dlg').open)return;
  if(!L){const e=(MC[code]||{}).err;dialog('เชื่อมกับโครงการใน PENUM MEP',`<p>${{offline:'ยังค้นหาไม่ได้ ไม่มีอินเทอร์เน็ต ต่อเน็ตแล้วลองอีกครั้ง',nosql:'ORIEN ยังไม่ได้เปิดบริการเชื่อมข้ามเครื่อง แจ้ง ORIEN ได้ที่ปุ่มแจ้งปัญหา',none:'ไม่พบโครงการนี้บนคลาวด์ ให้เปิดโครงการใน PENUM MEP ตอนต่ออินเทอร์เน็ต ไปหน้า BOQ แล้วคัดลอกรหัสหรือลิงก์มาใหม่'}[e]||'ค้นหาไม่ได้ ลองอีกครั้ง'}</p>`,`<button type="button" class="btn pri" data-a="mepRetry" data-c="${code}">ลองอีกครั้ง</button>`);return}
  const all=Object.values(DB.projects).filter(p=>!p.closed).sort((a,b)=>a.name.localeCompare(b.name,'th')),
    pick=all.find(p=>mepCode(p)===code)||all.find(p=>p.name===L.project)||(!P.boq.items.length&&!P.closed?P:null);
  dialog('เชื่อมกับโครงการใน PENUM MEP',`<p>พบโครงการ <b>${esc(L.project||'')}</b> จาก PENUM MEP<br><span class="hint">BOQ ${L.boq.items.length} รายการ · รวมทั้งสิ้น ${fmt(L.boq.grand)} บาท${L.at?' · แก้ไขล่าสุด '+mepWhen(L.at):''}</span></p>
    <label>รับ BOQ เข้าโครงการใน PENUM PM<select id="mepTo">${all.map(p=>`<option value="${p.id}"${pick===p?' selected':''}>${esc(p.name)}${mepCode(p)===code?' (เชื่อมอยู่แล้ว)':''}</option>`).join('')}<option value="new"${pick?'':' selected'}>＋ สร้างโครงการใหม่ชื่อ “${esc(L.project||'โครงการใหม่')}”</option></select></label>
    <p class="hint">โครงการที่เลือกจะเชื่อมกับโครงการนี้ใน PENUM MEP เมื่อ MEP แก้ไข กด <b>ดึง BOQ ล่าสุดจาก PENUM MEP</b> ได้จากทุกเครื่อง ที่หน้า ข้อมูลโครงการและ BOQ</p>`,
    `<button type="button" class="btn pri" data-a="mepGo" data-c="${code}">เชื่อมและดึง BOQ</button>`)}
ACT.mepRetry=b=>mepPick(b.dataset.c);
ACT.mepGo=b=>{const code=b.dataset.c,L=(MC[code]||{}).L||mepLink(),v=$('#mepTo').value;let p=DB.projects[v];
  if(!p){p=blankProject(((L&&L.project)||'โครงการใหม่').trim());DB.projects[p.id]=p}
  DB.cur=p.id;P=p;S.sel={};S.mode='pj';S.tab='setup';P.mep={code,name:(L&&L.project)||''};$('#dlg').close();save();render();ACT.pullMep()};
// …/pm/#mep=<code>: asked once PM is open and signed in
{const m=location.hash.match(/(?:^#|&)mep=([^&]+)/);if(m){try{sessionStorage.setItem('pmMepIn',decodeURIComponent(m[1]))}catch(e){}history.replaceState(null,'',location.pathname+location.search)}}
{const r=render;render=function(){const x=r.apply(this,arguments);
  try{const raw=sessionStorage.getItem('pmMepIn');if(raw&&ML&&!DEMOPG&&!dbEmpty()&&!(pinOn()&&!authOK())&&S.me!=='__none'&&!$('#dlg').open){sessionStorage.removeItem('pmMepIn');const c=ML.norm(raw);
    if(c)setTimeout(()=>mepPick(c),50);else toast('ลิงก์จาก PENUM MEP ไม่ถูกต้อง')}}catch(e){}return x}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.mode==='pj'&&S.tab==='setup'&&mepCode(P))mepFetch(mepCode(P))});
