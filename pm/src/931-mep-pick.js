/* ---------- 4.45: one "ดึงจาก PENUM MEP…" button where a BOQ comes in (project BOQ, quotation, bid) ----------
   The rows of MEP buttons (the latest MEP project pulled at once, the link code, a MEP file, the pasted BOQ) become one button that opens a
   picker: the MEP projects within reach (the one open in MEP on this computer, the company's MEP projects in ORIEN's cloud
   (shared/team.js), the MEP projects the PM projects are linked to), then a link code, a MEP file and, at the bottom, the pasted BOQ.
   Picking a project shows its items and total and asks before anything is replaced. นำเข้าจากไฟล์ stays beside it; the original-file
   link and the sample project become small links under the row. */
const MPK={rows:null,err:'',t:0,busy:0};          // the company's MEP projects (penumTeam.list), refreshed at most every 30 s
const mpkNorm=c=>window.penumLink?penumLink.norm(c||''):'';
async function mpkLoad(force){if(!window.penumTeam||!penumTeam.list||MPK.busy||(!force&&Date.now()-MPK.t<30e3))return;MPK.busy=1;
  try{const r=await penumTeam.list('mep',force);MPK.err=r.err||'';MPK.rows=r.err?[]:(r.rows||[]).filter(x=>!x.off&&x.m&&x.m.id)}catch(e){MPK.err='bad';MPK.rows=[]}
  finally{MPK.busy=0;MPK.t=Date.now();if($('#dlg').open&&$('#mpkList'))$('#mpkList').innerHTML=mpkRows();else if(MPK.rows&&MPK.rows.length)rerender()}}
// every MEP project within reach, one row per link code: [{code, name, client, n (items, when known), tot, at, where}]
function mpkAll(){const out=[],add=o=>{const c=mpkNorm(o.code);if(o.code&&!c)return;const x=c&&out.find(y=>y.code===c);if(x){for(const k in o)if(x[k]==null||x[k]===''||(k==='where'&&o.local))x[k]=o[k];return}out.push(Object.assign({},o,{code:c}))};
  const loc=mepLink();if(loc)add({code:loc.lid||'',name:loc.project||'',n:loc.boq.items.length,tot:n(loc.boq.grand),at:+loc.at||0,where:'เปิดอยู่ใน PENUM MEP เครื่องนี้',local:1});
  (MPK.rows||[]).forEach(x=>add({code:x.m.id,name:x.m.name||'',client:x.m.client||'',tot:x.m.sum&&n(x.m.sum.boq)||null,at:x.m.at||0,by:x.m.by||'',where:'โครงการของบริษัท (คลาวด์)'}));
  Object.values(DB.projects).forEach(p=>{const c=mepCode(p);if(!c)return;const L=mepFor(c);add({code:c,name:(L&&L.project)||p.mep.name||'',n:L?L.boq.items.length:null,tot:L?n(L.boq.grand):null,at:L?+L.at||0:0,where:`เชื่อมกับโครงการ ${p.name} ใน PM`})});
  out.forEach(x=>{const L=x.code&&mepFor(x.code);if(L){if(x.n==null)x.n=L.boq.items.length;if(x.tot==null)x.tot=n(L.boq.grand)}});
  return out.sort((a,b)=>(b.local||0)-(a.local||0)||(b.at||0)-(a.at||0))}
const mpkHas=()=>mpkAll().length>0;
let MPKT={k:'pj',id:''};          // where the BOQ goes: pj (this project), q (a quotation), td (a bid)
const mpkTarget=()=>MPKT.k==='q'?CO().quotes.find(q=>q.id===MPKT.id):MPKT.k==='td'?tdById(MPKT.id):P;
const mpkTargetName=()=>{const x=mpkTarget();return !x?'':MPKT.k==='q'?`ใบเสนอราคา ${x.no||''}`:MPKT.k==='td'?`งานประมูล ${x.no||''}`:`โครงการ ${x.name||''}`};
const mpkItemsNow=()=>{const x=mpkTarget();return !x?0:MPKT.k==='pj'?x.boq.items.length:(x.items||[]).length};
function mpkRows(){const A=mpkAll();
  return (A.length?A.map((x,k)=>`<div class="mpk-row"><div><b>${esc(x.name||'ไม่มีชื่อ')}</b>${x.client?` <span class="muted">· ${esc(x.client)}</span>`:''}
      <small>${esc(x.where)}${x.n!=null?` · ${x.n} รายการ`:''}${x.tot?` · รวม ${fmt(x.tot)} บาท`:''}${x.at?` · แก้ไขล่าสุด ${mepWhen(x.at)}`:''}${x.by?` โดย ${esc(x.by)}`:''}</small></div>
      <button type="button" class="btn sm pri" data-a="mpkSel" data-i="${k}">เลือก</button></div>`).join('')
    :`<p class="hint" style="margin:0">ยังไม่พบโครงการ PENUM MEP ในเครื่องนี้${window.penumTeam?' หรือในโครงการของบริษัท':''} · ใช้รหัสเชื่อม ไฟล์ หรือวาง BOQ ด้านล่างแทน</p>`)
   +(MPK.busy||!MPK.t?'<p class="hint" style="margin:6px 0 0">กำลังโหลดโครงการของบริษัทจากคลาวด์…</p>':MPK.err&&MPK.err!=='nolic'?`<p class="hint" style="margin:6px 0 0">โหลดโครงการของบริษัทไม่ได้${MPK.err==='offline'?' (ไม่มีอินเทอร์เน็ต)':''}</p>`:'')}
const MPK_PASTE={pj:'pasteBoq',q:'qPaste',td:'tdPaste'};
ACT.mepPickDlg=b=>{MPKT={k:b.dataset.k||'pj',id:b.dataset.id||''};mpkLoad(true);
  dialog('ดึงจาก PENUM MEP',`<p class="hint" style="margin-top:0">เลือกโครงการที่จะดึง BOQ เข้า${esc(mpkTargetName())} · ดูจำนวนรายการและยอดรวมก่อนยืนยัน</p>
    <h3 class="mpk-h">1. โครงการ PENUM MEP</h3><div id="mpkList" class="mpk-list">${mpkRows()}</div>
    ${window.penumLink?`<h3 class="mpk-h">2. มีรหัสเชื่อมโครงการจาก PENUM MEP</h3><div class="row" style="gap:6px"><input id="mpkCode" placeholder="XXXXX-XXXXX-XXXXX-XXXXX หรือลิงก์" autocomplete="off" style="flex:1 1 220px"><button type="button" class="btn sm" data-a="mpkCodeGo">ค้นหา</button></div>
    <h3 class="mpk-h">3. ไม่มีอินเทอร์เน็ต: เปิดไฟล์โครงการจาก PENUM MEP</h3><button type="button" class="btn sm" data-a="mpkFile">เลือกไฟล์ .penmep</button>`:''}
    <p class="hint" style="margin:14px 0 0">MEP อยู่เครื่องอื่นและไม่ได้เชื่อมคลาวด์? <button type="button" class="btn ghost sm" data-a="mpkPaste">วาง BOQ ที่คัดลอกมา</button></p>`,'')};
ACT.mpkPaste=()=>{$('#dlg').close();ACT[MPK_PASTE[MPKT.k]]({dataset:{id:MPKT.id}})};
async function mpkGet(code){const loc=mepLink();if(loc&&mpkNorm(loc.lid)===code)return loc;if(!(MF[code]&&MF[code].L))await mepFetch(code,true);return mepFor(code)}
const mpkErr=e=>({offline:'ดึงไม่ได้ ไม่มีอินเทอร์เน็ต',nosql:'ORIEN ยังไม่ได้เปิดบริการเชื่อมข้ามเครื่อง',none:'ยังไม่มี BOQ ของโครงการนี้บนคลาวด์ ให้เปิดโครงการนี้ใน PENUM MEP สักครั้ง'}[e]||'ดึงข้อมูลไม่ได้ ลองอีกครั้ง');
async function mpkOpen(code,L0){if(!L0){$('#mpkList').innerHTML='<p class="hint" style="margin:0">กำลังดึง BOQ จาก PENUM MEP…</p>'}
  const L=L0||(code?await mpkGet(code):mepLink());if(!$('#dlg').open)return;
  if(!L){$('#mpkList').innerHTML=`<p class="hint" style="margin:0;color:var(--danger)">${mpkErr((MC[code]||{}).err)}</p>`+mpkRows();return}
  MPK.L=L;const old=mpkItemsNow();
  dialog('ดึงจาก PENUM MEP',`<p>ดึง BOQ จาก <b>${esc(L.project||'')}</b></p><dl class="stats" style="margin:8px 0"><div><dt>รายการ</dt><dd>${L.boq.items.length}</dd></div><div><dt>รวมทั้งสิ้น</dt><dd>${fmt(n(L.boq.grand))}</dd></div>${L.at?`<div><dt>MEP แก้ไขล่าสุด</dt><dd style="font-size:15px">${mepWhen(L.at)}</dd></div>`:''}</dl>
    <p>เข้า <b>${esc(mpkTargetName())}</b>${old?` · <span style="color:var(--danger)">รายการเดิม ${old} รายการจะถูกแทนที่</span>`:''}</p>${MPKT.k==='pj'&&old?'<p class="hint">รายการเดิมที่ชื่อตรงกันจะคงการผูกกับ PO และใบเบิกไว้</p>':''}`,
    `<button type="button" class="btn" data-a="mepPickBack">ย้อนกลับ</button><button type="button" class="btn pri" data-a="mpkGo">ยืนยันดึง BOQ</button>`)}
ACT.mepPickBack=()=>ACT.mepPickDlg({dataset:{k:MPKT.k,id:MPKT.id}});
ACT.mpkSel=b=>{const x=mpkAll()[+b.dataset.i];if(!x)return;mpkOpen(x.code,x.local&&!x.code?mepLink():null)};
ACT.mpkCodeGo=()=>{const c=mpkNorm(($('#mpkCode')||{}).value);if(!c){toast('รหัสไม่ถูกต้อง คัดลอกจากหน้า BOQ ของ PENUM MEP อีกครั้ง');return}mpkOpen(c)};
ACT.mpkFile=()=>{const i=document.createElement('input');i.type='file';i.accept='.penmep,.json,application/json';i.style.display='none';
  i.onchange=async()=>{const f=i.files&&i.files[0];i.remove();if(!f)return;let o=null;try{o=JSON.parse(await f.text())}catch(e){}const L=o&&(o.mepLink||(o.boq&&o.loads?o:null));
    if(!L||!L.boq||!Array.isArray(L.boq.items)){toast(o&&Array.isArray(o.rooms)&&o.design?'ไฟล์นี้บันทึกจาก PENUM MEP รุ่นก่อน v118 ให้เปิดโครงการใน PENUM MEP แล้วบันทึกไฟล์โครงการอีกครั้ง':'ไฟล์นี้ไม่ใช่ไฟล์จาก PENUM MEP');return}
    const c=mpkNorm(L.lid||o.lid||'');if(c)MF[c]={L,file:f.name};mpkOpen(c,L)};document.body.appendChild(i);i.click()};
const mpkItems=L=>L.boq.items.map(i=>({g:i.g,head:i.head,type:i.type,desc:i.desc,unit:i.unit,q:n(i.q),m:n(i.m),l:n(i.l),t:n(i.total)}));
ACT.mpkGo=()=>{const L=MPK.L,x=mpkTarget();if(!L||!x)return;const src='PENUM MEP · '+(L.project||''),N=L.boq.items.length;
  if(MPKT.k==='q'){qFill(x,mpkItems(L),{src,sub:L.boq.sub,ohp:L.boq.ohp});if(!x.title)x.title=L.project||''}
  else if(MPKT.k==='td'){tdFill(x,mpkItems(L).map(i=>Object.assign(i,{t:i.t})),src);if(!x.title)x.title=L.project||''}
  else{setBoq(mpkItems(L),{src,sub:L.boq.sub,ohp:L.boq.ohp,vat:L.boq.vat,grand:L.boq.grand,rooms:(L.loads&&L.loads.rooms||[]).map(r=>({name:r.name,cmh:n(r.cmh),qty:n(r.qty)||1}))});
    if(P.name==='โครงการแรก'||P.name==='โครงการใหม่')P.name=L.project||P.name;P.boq.mepAt=n(L.at);P.boq.mepSig=boqSig(L);mepBind(L)}
  $('#dlg').close();save();render();toast(`ดึง BOQ ${N} รายการจาก ${L.project||'PENUM MEP'} แล้ว`)};

// the rows: MEP buttons out, the one picker button in; the sample project and the original file as small links underneath
const MPK_OLD={pullMep:'pj',pasteBoq:'pj',mepLinkDlg:'pj',mepFile:'pj',qMep:'q',qPaste:'q',tdMep:'td',tdPaste:'td'};
function mpkFix(){const rows=new Set();document.querySelectorAll('#view button[data-a]').forEach(b=>{if(MPK_OLD[b.dataset.a]&&b.parentElement)rows.add(b.parentElement)});
  rows.forEach(row=>{const B=[...row.querySelectorAll(':scope > button[data-a]')].filter(b=>MPK_OLD[b.dataset.a]);if(!B.length)return;
    const k=MPK_OLD[B[0].dataset.a],id=(B.find(b=>b.dataset.id)||{dataset:{}}).dataset.id||'',sm=B.some(b=>b.classList.contains('sm'))?' sm':'';
    const linked=k==='pj'&&mepCode(P),L=k==='pj'?mepCur():null,nw=L&&mepNew(L);B.forEach(b=>b.remove());
    row.insertAdjacentHTML('afterbegin',`<button type="button" class="btn pri mpk-btn${sm}" data-a="mepPickDlg" data-k="${k}" data-id="${esc(id)}">⬇ ดึงจาก PENUM MEP…${linked?` <small>(เชื่อมกับ ${esc((L&&L.project)||P.mep.name||'')}${nw?' · มีแก้ไขใหม่':''})</small>`:''}</button>`);
    row.querySelectorAll(':scope > [data-a="impFile"]').forEach(b=>b.classList.remove('pri'));
    const sub=[...row.querySelectorAll(':scope > [data-a="srcOpen"], :scope > [data-a="loadDemo"]')];
    if(sub.length){const d=document.createElement('div');d.className='mpk-sub';sub.forEach(b=>{b.className='mpk-link';d.appendChild(b)});row.insertAdjacentElement('afterend',d)}});
  if(rows.size)mpkLoad()}
{const r=render;render=function(){const x=r.apply(this,arguments);try{mpkFix()}catch(e){}return x}}
// the note under the project's buttons named the old buttons
{const f=mepNote;mepNote=L=>mepCode(P)?f(L):(!L&&SUITE?'<p class="hint">กด <b>ดึงจาก PENUM MEP…</b> แล้วเลือกโครงการ: โครงการที่เปิดใน PENUM MEP เครื่องนี้ โครงการของบริษัทบนคลาวด์ ใส่รหัสเชื่อม เปิดไฟล์ หรือวาง BOQ ที่คัดลอกมา</p>':'')+(!L?mepUp():'')}
document.head.insertAdjacentHTML('beforeend',`<style>
.mpk-btn{font-weight:700;box-shadow:0 2px 8px rgba(11,110,110,.18)}.mpk-btn small{font-weight:400;opacity:.85}
.mpk-sub{display:flex;flex-wrap:wrap;gap:4px 16px;margin:-4px 0 10px}
.mpk-link{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;min-height:0!important;color:var(--muted);font-size:12.5px;text-decoration:underline;cursor:pointer}
.mpk-link:hover{color:var(--accent)}
.mpk-h{font-size:14px;margin:14px 0 6px}.mpk-list{display:flex;flex-direction:column;gap:6px;max-height:46vh;overflow:auto}
.mpk-row{display:flex;gap:10px;align-items:center;padding:8px 10px;border:1px solid var(--line);border-radius:10px}.mpk-row>div{flex:1;min-width:0}.mpk-row small{display:block;color:var(--muted)}
</style>`);
