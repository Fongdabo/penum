/* ---------- BOQ import from PENUM MEP ---------- */
const bKey=i=>[i.g,i.head,i.type,i.desc].join('|');
function setBoq(items,meta){
  const old={};P.boq.items.forEach(i=>old[bKey(i)]=i.id);
  P.boq=Object.assign({items:items.map(i=>Object.assign({id:old[bKey(i)]||uid()},i)),at:today()},meta);
  if(P.info.cvAuto)P.info.cv=n(P.boq.sub)+n(P.boq.ohp);
  if(meta.rooms)P.rooms=meta.rooms;delete P.boq.rooms;
}
function mepLink(){if(!SUITE)return null;try{const o=JSON.parse(localStorage.getItem(MEP_LINK)||'null');return o&&o.boq&&o.boq.items?o:null}catch(e){return null}}
// the MEP results for this project, its BOQ buttons and note: the latest MEP project in this browser here; 920-mep-link.js adds the project
// linked by its รหัสเชื่อมโครงการ, wherever MEP was used
let mepCur=()=>mepLink(),mepBind=L=>{};
// what MEP's BOQ was when it was pulled, so a later change in MEP shows (P.boq.mepSig)
const boqSig=L=>{const s=JSON.stringify(L.boq||{});let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
const mepNew=L=>!!(L&&P.boq.items.length&&P.boq.mepSig&&boqSig(L)!==P.boq.mepSig);
let mepBtns=L=>L?`<button type="button" class="btn pri" data-a="pullMep">ดึง BOQ จาก PENUM MEP <small>(${esc(L.project||'')})</small></button>`:'';
let mepNote=L=>!L&&SUITE?'<p class="hint">ถ้าเปิด PENUM MEP ในเครื่องนี้และมีโครงการอยู่ ปุ่ม “ดึง BOQ จาก PENUM MEP” จะขึ้นให้กดได้ทันที</p>':'';
ACT.pullMep=()=>{const L=mepCur();if(!L){toast('ไม่พบ BOQ จาก PENUM MEP ในเครื่องนี้');return}
  if(P.boq.items.length&&!confirm(`แทนที่ BOQ เดิมด้วย BOQ ของ “${L.project}” จาก PENUM MEP?\nรายการเดิมที่ชื่อตรงกันจะคงการผูกกับ PO และใบเบิกไว้`))return;
  setBoq(L.boq.items.map(i=>({g:i.g,head:i.head,type:i.type,desc:i.desc,unit:i.unit,q:n(i.q),m:n(i.m),l:n(i.l),t:n(i.total)})),{src:'PENUM MEP · '+(L.project||''),sub:L.boq.sub,ohp:L.boq.ohp,vat:L.boq.vat,grand:L.boq.grand,rooms:(L.loads&&L.loads.rooms||[]).map(r=>({name:r.name,cmh:n(r.cmh),qty:n(r.qty)||1}))});
  if(P.name==='โครงการแรก'||P.name==='โครงการใหม่')P.name=L.project||P.name;
  P.boq.mepAt=n(L.at);P.boq.mepSig=boqSig(L);mepBind(L);
  save();render();toast(`ดึง BOQ ${P.boq.items.length} รายการแล้ว`)};
ACT.pasteBoq=()=>{dialog('วาง BOQ จาก PENUM MEP',`<ol class="steps"><li>เปิด PENUM MEP ไปที่หน้า BOQ</li><li>กดปุ่ม <b>คัดลอก BOQ (วางใน Excel)</b></li><li>กลับมาที่นี่ คลิกในช่องด้านล่าง แล้วกด Ctrl+V</li></ol><textarea id="boqTxt" rows="8" placeholder="วาง BOQ ที่นี่"></textarea>`,`<button type="button" class="btn pri" data-a="pasteGo">นำเข้า</button>`)};
ACT.pasteGo=()=>{const r=parseBoqTSV($('#boqTxt').value);if(!r.items.length){toast('ไม่พบรายการ BOQ ในข้อความที่วาง');return}setBoq(r.items,{src:'วางจาก PENUM MEP',sub:r.sub,ohp:r.ohp,vat:r.vat,grand:r.grand});$('#dlg').close();save();render();toast(`นำเข้า BOQ ${r.items.length} รายการแล้ว`)};
function parseBoqTSV(txt){
  const GL={};Object.entries(BOQ_G).forEach(([k,v])=>GL[v]=k);
  let g='',head='',type='';const items=[],tot={};
  txt.split(/\r?\n/).forEach(line=>{const c=line.split('\t');const a=(c[0]||'').trim(),b=(c[1]||'');const bt=b.trim();if(!bt)return;
    const num=k=>c[k]!=null&&/^-?[\d,]+(\.\d+)?$/.test(String(c[k]).trim())?n(c[k]):null;
    if(/^รวมค่าของและค่าแรง/.test(bt)){tot.sub=num(8);return}if(/^ค่าดำเนินการ/.test(bt)){tot.ohp=num(11);return}if(/^VAT/.test(bt)){tot.vat=num(11);return}if(/^รวมทั้งสิ้น/.test(bt)){tot.grand=num(11);return}
    if(/^หมวด/.test(bt)&&/^[A-Z]$/.test(a))return;
    if(/^\d+$/.test(a)&&GL[bt]){g=GL[bt];head='';type='';return}
    const q=num(2);
    if(q==null){if(/^\d+\.\d+$/.test(a)){head=bt;type=''}else if(!a&&/^\s{2}/.test(b))type=bt;return}
    const sub=/^\s*-\s/.test(b);if(!sub){head='';type=''}
    items.push({g,head:sub?head:'',type:sub?type:'',desc:bt.replace(/^-\s*/,''),unit:(c[3]||'').trim(),q,m:n(c[4]),l:n(c[6]),t:n(c[11])||n(c[8])});
  });
  return {items,sub:tot.sub||sum(items,i=>i.t),ohp:tot.ohp||0,vat:tot.vat||0,grand:tot.grand||0};
}

VIEWS.setup=()=>{
  const I=P.info,L=mepCur(),C=contract();let lg='';
  const f=(k,l,t='',cls='')=>`<label class="${cls}">${l}<input${t?` type="${t}"`:''} data-p="info.${k}"${t==='num'?' data-t="num" inputmode="decimal"':''} value="${esc(I[k]??'')}"></label>`;
  return `<section class="card"><h2>ข้อมูลโครงการ</h2><div class="form">
    <label class="w2">ชื่อโครงการ<input data-p="name" value="${esc(P.name)}"></label><label>ลูกค้า (จากทะเบียน)<select data-p="info.cust">${[['','–'],...DB.co.customers.map(c=>[c.id,c.name])].map(([k,l])=>`<option value="${k}"${k===(I.cust||'')?' selected':''}>${esc(l)}</option>`).join('')}</select></label>${f('client','ชื่อผู้ว่าจ้างบนเอกสาร')}${f('contractNo','เลขที่สัญญา')}${f('site','สถานที่ก่อสร้าง','','w2')}
    ${f('company','ชื่อบริษัท (หัวเอกสาร)')}${f('pm','ผู้จัดการโครงการ')}${f('start','วันเริ่มสัญญา','date')}${f('finish','วันสิ้นสุดสัญญา','date')}
    <label>มูลค่าสัญญา ไม่รวม VAT<input data-t="num" data-p="info.cv" value="${n(I.cv)}"${I.cvAuto&&P.boq.items.length?' readonly':''}></label>
    <label style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" data-t="chk" data-p="info.cvAuto"${I.cvAuto?' checked':''}> ใช้ยอดจาก BOQ (ค่าของ+ค่าแรง+ค่าดำเนินการ)</label></div>
    <div class="row" style="margin-top:12px"><button type="button" class="btn del" data-a="delProj">ลบโครงการนี้</button></div></section>
  <section class="card"><h2><span>BOQ ของโครงการ</span><small>${P.boq.items.length?`${P.boq.items.length} รายการ · ${esc(P.boq.src||'')} · นำเข้า ${thD(P.boq.at)}`:'ยังไม่มี'}</small></h2>
    <div class="row" style="margin-bottom:12px">
      ${mepBtns(L)}
      <button type="button" class="btn${L?'':' pri'}" data-a="pasteBoq">วาง BOQ ที่คัดลอกจาก PENUM MEP</button>
      <button type="button" class="btn" data-a="loadDemo">เปิดโครงการตัวอย่าง</button></div>
    ${mepNote(L)}
    ${P.boq.items.length?`<dl class="stats" style="margin-bottom:12px"><div><dt>ค่าของ + ค่าแรง</dt><dd>${fmt(sum(P.boq.items,boqCost))}</dd></div><div><dt>ราคาขายก่อน VAT</dt><dd>${fmt(C.base)}</dd></div><div><dt>รวม VAT</dt><dd>${fmt(I.cvAuto&&n(P.boq.grand)?n(P.boq.grand):C.base*(1+n(I.vat)/100))}</dd></div></dl>
    <div class="tw" style="max-height:480px"><table><thead><tr><th>รายการ</th><th>หน่วย</th><th class="r">จำนวน</th><th class="r">ค่าของ/หน่วย</th><th class="r">ค่าแรง/หน่วย</th><th class="r">ราคาขาย</th></tr></thead><tbody>
    ${P.boq.items.map(i=>{const h=i.g!==lg?`<tr class="grp"><td colspan="6">${gName(i.g)}</td></tr>`:'';lg=i.g;return h+`<tr><td>${esc(itemName(i))}</td><td>${esc(i.unit)}</td><td class="r">${fmtq(i.q)}</td><td class="r">${fmt(i.m)}</td><td class="r">${fmt(i.l)}</td><td class="r">${fmt(i.t)}</td></tr>`}).join('')}</tbody></table></div>`:''}
  </section>`;
};
ACT.delProj=()=>{if(Object.keys(DB.projects).length<2){toast('ต้องมีอย่างน้อยหนึ่งโครงการ');return}if(!confirm(`ลบโครงการ “${P.name}” และข้อมูลทั้งหมด?`))return;delete DB.projects[P.id];DB.cur=Object.keys(DB.projects)[0];P=DB.projects[DB.cur];save();S.tab='dash';render()};

