/* ---------- purchasing: BOQ materials → PR → quotes → PO → deliveries ---------- */
const poTotal=po=>{const s=sum(po.items,l=>n(l.q)*n(l.p)),v=po.novat?0:s*n(P.info.vat)/100;return {s,v,t:s+v}};
const recvOf=(po,lid)=>sum((po.dl||[]).filter(d=>d.line===lid),d=>d.q);
function poState(po){const td=today();let full=true,any=false;po.items.forEach(l=>{const r=recvOf(po,l.id);if(r>0)any=true;if(r<n(l.q))full=false});
  const late=!full&&okD(po.due)&&po.due<td;
  return full&&po.items.length?{k:'ok',l:'ส่งครบ'}:late?{k:'bad',l:any?'ส่งบางส่วน · ล่าช้า':'ล่าช้า'}:any?{k:'warn',l:'ส่งบางส่วน'}:{k:'',l:'รอส่ง'}}
const orderedOf=bid=>sum(P.pos.flatMap(p=>p.items).filter(l=>l.bid===bid),l=>l.q);
const requestedOf=bid=>sum(P.prs.filter(r=>!r.po).flatMap(r=>r.items).filter(l=>l.bid===bid),l=>l.q);
function needDate(g){const s=sched(),L=P.tasks.filter(t=>t.g===g);if(!L.length)return '';const es=L.map(t=>s.R[t.id].es).sort()[0];return addD(es,-7)}
NEW.vendors=()=>({name:'',cat:'',contact:'',phone:'',email:'',tax:'',credit:30});
NEW.prs=arr=>({no:nextNo('PR-',arr),date:today(),need:'',note:'',items:[],qs:[],by:P.info.pm||''});
NEW.pos=arr=>({no:nextNo('PO-',arr),date:today(),vid:'',due:addD(today(),14),credit:30,items:[],dl:[],note:''});
NEW.items=()=>({desc:'',unit:'',q:1,bud:0,p:0});
NEW.dl=()=>({date:today(),ref:'',line:'',q:0});

ACT.pick=b=>{S.pick[b.dataset.id]=!S.pick[b.dataset.id];render()};
ACT.pickAll=()=>{const L=buyList();const all=L.every(i=>S.pick[i.id]);L.forEach(i=>S.pick[i.id]=!all);render()};
ACT.bg=()=>{};
function buyList(){return P.boq.items.filter(i=>!S.bg||i.g===S.bg).filter(i=>n(i.m)>0)}
ACT.mkPR=()=>{const ids=Object.keys(S.pick).filter(k=>S.pick[k]);if(!ids.length){toast('เลือกรายการก่อน');return}
  const its=P.boq.items.filter(i=>ids.includes(i.id));
  const pr=Object.assign({id:uid()},NEW.prs(P.prs));pr.items=its.map(i=>({id:uid(),bid:i.id,g:i.g,desc:itemName(i),unit:i.unit,q:Math.max(0,n(i.q)-orderedOf(i.id)-requestedOf(i.id))||n(i.q),bud:n(i.m)}));
  const nd=its.map(i=>needDate(i.g)).filter(Boolean).sort();pr.need=nd[0]||addD(today(),14);
  P.prs.push(pr);S.pick={};S.sub.buy='pr';S.sel.pr=pr.id;save();render();toast(`สร้างใบขอซื้อ ${pr.no} แล้ว`)};
ACT.addQ=b=>{const pr=P.prs.find(r=>r.id===b.dataset.id);if(!pr)return;const used=pr.qs.map(q=>q.vid);const v=P.vendors.find(v=>!used.includes(v.id));pr.qs.push({id:uid(),vid:v?v.id:'',p:{},days:7,credit:30,note:''});save();render()};
ACT.delQ=b=>{const pr=P.prs.find(r=>r.id===b.dataset.id);if(!pr||!confirm('ลบใบเสนอราคานี้?'))return;pr.qs=pr.qs.filter(q=>q.id!==b.dataset.q);save();render()};
ACT.award=b=>{const pr=P.prs.find(r=>r.id===b.dataset.id),q=pr&&pr.qs.find(x=>x.id===b.dataset.q);if(!q)return;
  if(!q.vid){toast('เลือกผู้ขายของใบเสนอราคานี้ก่อน');return}
  if(pr.po&&!confirm('ใบขอซื้อนี้ออก PO ไปแล้ว ออกใหม่อีกใบ?'))return;
  const po=Object.assign({id:uid()},NEW.pos(P.pos),{vid:q.vid,pr:pr.id,credit:n(q.credit),due:addD(today(),n(q.days)||14),note:pr.note});
  po.items=pr.items.map(l=>({id:uid(),bid:l.bid,g:l.g,desc:l.desc,unit:l.unit,q:n(l.q),p:n(q.p[l.id])}));
  P.pos.push(po);pr.po=po.id;pr.award=q.id;S.sub.buy='po';S.sel.po=po.id;save();render();toast(`ออก ${po.no} ให้ ${vName(q.vid)} แล้ว`)};
ACT.recvAll=b=>{const po=P.pos.find(p=>p.id===b.dataset.id);if(!po)return;let k=0;po.items.forEach(l=>{const left=n(l.q)-recvOf(po,l.id);if(left>0){po.dl.push({id:uid(),date:today(),ref:'',line:l.id,q:left});k++}});save();render();toast(k?`บันทึกรับของ ${k} รายการ`:'รับครบแล้ว')};
ACT.addLine=b=>{const o=resolve(b.dataset.c);if(!o)return;o.items.push({id:uid(),desc:'',unit:'',q:1,bud:0,p:0});save();render()};
ACT.bgSel=()=>{};
document.addEventListener('change',e=>{if(e.target.id==='bgSel'){S.bg=e.target.value;S.pick={};render()}});

VIEWS.buy=()=>{
  const {cur,html}=subTabs('buy',[['boq','รายการวัสดุจาก BOQ'],['pr','ใบขอซื้อและเทียบราคา'],['po','ใบสั่งซื้อ (PO)'],['dl','ติดตามของเข้าหน้างาน'],['ven','ผู้ขาย']]);
  return html+({boq:buyBoq,pr:buyPR,po:buyPO,dl:buyDL,ven:buyVen}[cur])();
};
function buyBoq(){
  if(!P.boq.items.length)return `<section class="card"><h2>ยังไม่มี BOQ</h2><p class="hint">ไปที่แท็บ “ข้อมูลโครงการและ BOQ” แล้วดึง BOQ จาก PENUM MEP ก่อน</p><button type="button" class="btn pri" data-a="tab" data-k="setup">ไปดึง BOQ</button></section>`;
  const L=buyList(),k=Object.values(S.pick).filter(Boolean).length;
  return `<section class="card"><h2><span>รายการวัสดุและอุปกรณ์จาก BOQ</span><small>ติ๊กรายการที่ต้องซื้อ แล้วกดสร้างใบขอซื้อ จำนวนจะใส่ส่วนที่ยังไม่ได้สั่งให้อัตโนมัติ</small></h2>
  <div class="row" style="margin-bottom:10px"><select id="bgSel" aria-label="หมวด"><option value="">ทุกหมวด</option>${groupsInBoq().map(g=>`<option value="${g}"${S.bg===g?' selected':''}>${gName(g)}</option>`).join('')}</select>
    <button type="button" class="btn pri" data-a="mkPR"${k?'':' disabled'}>สร้างใบขอซื้อจากรายการที่เลือก (${k})</button></div>
  <div class="tw"><table><thead><tr><th><input type="checkbox" data-a="pickAll" aria-label="เลือกทั้งหมด"${L.length&&L.every(i=>S.pick[i.id])?' checked':''}></th><th>หมวด</th><th>รายการ</th><th>หน่วย</th><th class="r">จำนวน BOQ</th><th class="r">ราคาของ/หน่วย (งบ)</th><th class="r">ขอซื้อรอ PO</th><th class="r">สั่งแล้ว</th><th class="r">คงเหลือ</th><th>ต้องใช้ก่อน</th></tr></thead><tbody>
  ${L.map(i=>{const o=orderedOf(i.id),rq=requestedOf(i.id),left=n(i.q)-o;return `<tr class="${S.pick[i.id]?'sel':''}"><td><input type="checkbox" data-a="pick" data-id="${i.id}"${S.pick[i.id]?' checked':''} aria-label="เลือก"></td><td class="muted" style="white-space:nowrap">${gName(i.g)}</td><td>${esc(itemName(i))}</td><td>${esc(i.unit)}</td><td class="r">${fmtq(i.q)}</td><td class="r">${fmt(i.m)}</td><td class="r">${rq?fmtq(rq):''}</td><td class="r">${o?fmtq(o):''}</td><td class="r">${left<=0?'<span class="pill ok">ครบ</span>':fmtq(left)}</td><td>${thD(needDate(i.g))}</td></tr>`}).join('')}</tbody></table></div></section>`;
}
function prStatus(pr){return pr.po?{k:'ok',l:'ออก PO แล้ว'}:pr.qs.length?{k:'info',l:`เทียบราคา ${pr.qs.length} ราย`}:{k:'warn',l:'รอใบเสนอราคา'}}
function buyPR(){
  const sel=P.prs.find(r=>r.id===S.sel.pr)||P.prs[P.prs.length-1];
  const list=`<section class="card"><h2><span>ใบขอซื้อ (PR)</span><span class="sp"></span><button type="button" class="btn sm" data-a="add" data-c="prs" data-sel="pr">+ ใบขอซื้อเปล่า</button></h2>
  <div class="tw"><table><thead><tr><th>เลขที่</th><th>วันที่</th><th>ต้องใช้ก่อน</th><th class="r">รายการ</th><th class="r">งบ (บาท)</th><th>สถานะ</th><th>ผู้ขายที่เลือก</th><th></th></tr></thead><tbody>
  ${P.prs.length?P.prs.slice().reverse().map(r=>{const st=prStatus(r),aw=r.qs.find(q=>q.id===r.award);return `<tr class="${sel&&sel.id===r.id?'sel':''}"><td><button type="button" class="btn ghost sm" data-a="sel" data-k="pr" data-id="${r.id}"><b>${esc(r.no)}</b></button></td><td>${thD(r.date)}</td><td>${thD(r.need)}</td><td class="r">${r.items.length}</td><td class="r">${fmt(sum(r.items,l=>n(l.q)*n(l.bud)))}</td><td><span class="pill ${st.k}">${st.l}</span></td><td>${aw?esc(vName(aw.vid)):''}</td><td><button type="button" class="x" data-a="delRow" data-c="prs" data-id="${r.id}" aria-label="ลบ">✕</button></td></tr>`}).join(''):'<tr><td colspan="8" class="empty">ยังไม่มีใบขอซื้อ เลือกรายการจากแท็บ “รายการวัสดุจาก BOQ”</td></tr>'}</tbody></table></div></section>`;
  if(!sel)return list;
  const b=`prs.${sel.id}`,its=sel.items,Q=sel.qs;
  const best={};its.forEach(l=>{const ps=Q.map(q=>n(q.p[l.id])).filter(v=>v>0);best[l.id]=ps.length?Math.min(...ps):0});
  const tot=q=>sum(its,l=>n(l.q)*n(q.p[l.id])),full=q=>its.every(l=>n(q.p[l.id])>0),tots=Q.filter(full).map(tot),bt=tots.length?Math.min(...tots):0;
  const vopts=[['','– เลือกผู้ขาย –'],...P.vendors.map(v=>[v.id,v.name||'(ไม่มีชื่อ)'])];
  return list+`<section class="card"><h2><span>${esc(sel.no)} · เปรียบเทียบราคา</span><small>ใส่ราคาต่อหน่วยของแต่ละเจ้า ช่องสีเขียว = ถูกที่สุด กด “เลือกและออก PO” ที่เจ้าที่ต้องการ</small><span class="sp"></span>
    <button type="button" class="btn sm" data-a="print" data-k="pr" data-id="${sel.id}">พิมพ์ใบขอซื้อ/เทียบราคา</button></h2>
  <div class="form" style="margin-bottom:12px"><label>เลขที่<input data-p="${b}.no" value="${esc(sel.no)}"></label><label>วันที่<input type="date" data-p="${b}.date" value="${esc(sel.date)}"></label><label>ต้องใช้ก่อน<input type="date" data-p="${b}.need" value="${esc(sel.need)}"></label><label>ผู้ขอซื้อ<input data-p="${b}.by" value="${esc(sel.by||'')}"></label><label class="w2">หมายเหตุ<input data-p="${b}.note" value="${esc(sel.note)}"></label></div>
  <div class="tw"><table class="cmp"><thead><tr><th>รายการ</th><th>หน่วย</th><th class="r">จำนวน</th><th class="r">งบ/หน่วย</th>${Q.map(q=>`<th style="min-width:150px"><select data-p="${b}.qs.${q.id}.vid" aria-label="ผู้ขาย">${vopts.map(([k,l])=>`<option value="${k}"${k===q.vid?' selected':''}>${esc(l)}</option>`).join('')}</select></th>`).join('')}<th><button type="button" class="btn sm" data-a="addQ" data-id="${sel.id}">+ ผู้เสนอราคา</button></th><th></th></tr></thead><tbody>
  ${its.map(l=>`<tr><td style="min-width:220px"><input data-p="${b}.items.${l.id}.desc" value="${esc(l.desc)}" aria-label="รายการ"></td><td style="width:70px"><input data-p="${b}.items.${l.id}.unit" value="${esc(l.unit)}" aria-label="หน่วย"></td><td style="width:90px"><input class="r" data-t="num" data-p="${b}.items.${l.id}.q" value="${n(l.q)}" aria-label="จำนวน"></td><td class="r muted">${fmt(l.bud)}</td>
    ${Q.map(q=>{const v=n(q.p[l.id]);return `<td class="${v>0&&v===best[l.id]&&Q.length>1?'best':''}"><input class="r" data-t="num" data-p="${b}.qs.${q.id}.p.${l.id}" value="${v||''}" placeholder="ราคา/หน่วย" aria-label="ราคา"></td>`}).join('')}<td></td>
    <td><button type="button" class="x" data-a="delRow" data-c="${b}.items" data-id="${l.id}" aria-label="ลบ">✕</button></td></tr>`).join('')}
  <tr class="tot"><td colspan="4">รวม (ไม่รวม VAT) · งบ ${fmt(sum(its,l=>n(l.q)*n(l.bud)))}</td>${Q.map(q=>{const t=tot(q);return `<td class="r${full(q)&&t===bt&&Q.length>1?' best':''}">${fmt(t)}${full(q)?'':' <small class="muted">ไม่ครบ</small>'}</td>`}).join('')}<td></td><td></td></tr>
  <tr><td colspan="4" class="muted">ส่งของภายใน (วัน)</td>${Q.map(q=>`<td><input class="r" data-t="num" data-p="${b}.qs.${q.id}.days" value="${n(q.days)}" aria-label="วันส่งของ"></td>`).join('')}<td></td><td></td></tr>
  <tr><td colspan="4" class="muted">เครดิต (วัน)</td>${Q.map(q=>`<td><input class="r" data-t="num" data-p="${b}.qs.${q.id}.credit" value="${n(q.credit)}" aria-label="เครดิต"></td>`).join('')}<td></td><td></td></tr>
  <tr><td colspan="4"></td>${Q.map(q=>`<td style="white-space:nowrap"><button type="button" class="btn sm ${sel.award===q.id?'':'pri'}" data-a="award" data-id="${sel.id}" data-q="${q.id}">${sel.award===q.id?'✓ เลือกแล้ว':'เลือกและออก PO'}</button> <button type="button" class="x" data-a="delQ" data-id="${sel.id}" data-q="${q.id}" aria-label="ลบใบเสนอราคา">✕</button></td>`).join('')}<td></td><td></td></tr>
  </tbody></table></div>
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-a="addLine" data-c="${b}">+ เพิ่มรายการ</button>${P.vendors.length?'':'<span class="hint" style="margin:0">ยังไม่มีรายชื่อผู้ขาย เพิ่มได้ที่แท็บ “ผู้ขาย”</span>'}</div></section>`;
}
function buyPO(){
  const sel=P.pos.find(r=>r.id===S.sel.po)||P.pos[P.pos.length-1];
  const list=`<section class="card"><h2><span>ใบสั่งซื้อ (PO)</span><span class="sp"></span><button type="button" class="btn sm" data-a="add" data-c="pos" data-sel="po">+ PO เปล่า</button></h2>
  <div class="tw"><table><thead><tr><th>เลขที่</th><th>วันที่</th><th>ผู้ขาย</th><th class="r">มูลค่ารวม VAT</th><th>กำหนดส่ง</th><th>สถานะส่งของ</th><th>จ่ายเงิน</th><th></th></tr></thead><tbody>
  ${P.pos.length?P.pos.slice().reverse().map(p=>{const st=poState(p);return `<tr class="${sel&&sel.id===p.id?'sel':''}"><td><button type="button" class="btn ghost sm" data-a="sel" data-k="po" data-id="${p.id}"><b>${esc(p.no)}</b></button></td><td>${thD(p.date)}</td><td>${esc(vName(p.vid))}</td><td class="r">${fmt(poTotal(p).t)}</td><td>${thD(p.due)}</td><td><span class="pill ${st.k}">${st.l}</span></td><td>${p.paid?`<span class="pill ok">จ่ายแล้ว ${thD(p.paidDate)}</span>`:'<span class="pill">ยังไม่จ่าย</span>'}</td><td><button type="button" class="x" data-a="delRow" data-c="pos" data-id="${p.id}" aria-label="ลบ">✕</button></td></tr>`}).join(''):'<tr><td colspan="8" class="empty">ยังไม่มี PO ออกจากหน้าเปรียบเทียบราคา หรือกด “+ PO เปล่า”</td></tr>'}</tbody></table></div></section>`;
  if(!sel)return list;
  const b=`pos.${sel.id}`,T=poTotal(sel),st=poState(sel);
  return list+`<section class="card"><h2><span>${esc(sel.no)} · ${esc(vName(sel.vid))}</span> <span class="pill ${st.k}">${st.l}</span><span class="sp"></span><button type="button" class="btn sm" data-a="print" data-k="po" data-id="${sel.id}">พิมพ์ใบสั่งซื้อ</button></h2>
  <div class="form" style="margin-bottom:12px"><label>เลขที่<input data-p="${b}.no" value="${esc(sel.no)}"></label><label>วันที่<input type="date" data-p="${b}.date" value="${esc(sel.date)}"></label>
    <label>ผู้ขาย<select data-p="${b}.vid">${[['','–'],...P.vendors.map(v=>[v.id,v.name])].map(([k,l])=>`<option value="${k}"${k===sel.vid?' selected':''}>${esc(l)}</option>`).join('')}</select></label>
    <label>กำหนดส่ง<input type="date" data-p="${b}.due" value="${esc(sel.due)}"></label><label>เครดิต (วัน)<input data-t="num" data-p="${b}.credit" value="${n(sel.credit)}"></label>
    <label>สถานที่ส่ง<input data-p="${b}.ship" value="${esc(sel.ship||P.info.site||'')}"></label>
    <label style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" data-t="chk" data-p="${b}.novat"${sel.novat?' checked':''}> ไม่คิด VAT</label>
    <label style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" data-t="chk" data-p="${b}.paid"${sel.paid?' checked':''}> จ่ายเงินแล้ว</label>
    ${sel.paid?`<label>วันที่จ่าย<input type="date" data-p="${b}.paidDate" value="${esc(sel.paidDate||'')}"></label>`:''}
    <label class="full">หมายเหตุ<input data-p="${b}.note" value="${esc(sel.note||'')}"></label></div>
  ${gtable(`${b}.items`,sel.items,[{k:'desc',h:'รายการ',t:'area',w:420},{k:'unit',h:'หน่วย',w:60},{k:'q',h:'จำนวน',t:'num',w:80},{k:'p',h:'ราคา/หน่วย',t:'num',w:100},{h:'รวม',t:'calc',r:1,f:l=>fmt(n(l.q)*n(l.p))},{h:'รับแล้ว',t:'calc',r:1,f:l=>fmtq(recvOf(sel,l.id))},{h:'ค้างส่ง',t:'calc',r:1,f:l=>{const k=n(l.q)-recvOf(sel,l.id);return k>0?fmtq(k):'<span class="pill ok">ครบ</span>'}}])}
  <div class="row end" style="margin:8px 0 14px;gap:18px"><button type="button" class="btn sm" data-a="addLine" data-c="${b}">+ เพิ่มรายการ</button><span class="sp" style="flex:1"></span><span>รวม <b>${fmt(T.s,2)}</b></span><span>VAT <b>${fmt(T.v,2)}</b></span><span>รวมทั้งสิ้น <b>${fmt(T.t,2)}</b> บาท</span></div>
  <h3 style="font-size:15px;margin-bottom:8px">บันทึกรับของเข้าหน้างาน</h3>
  ${gtable(`${b}.dl`,sel.dl,[{k:'date',h:'วันที่รับ',t:'date'},{k:'ref',h:'เลขใบส่งของ',w:120},{k:'line',h:'รายการ',t:'sel',w:240,o:()=>[['','–'],...sel.items.map(l=>[l.id,l.desc])]},{k:'q',h:'จำนวนที่รับ',t:'num',w:90}],{empty:'ยังไม่มีการรับของ'})}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-a="add" data-c="${b}.dl">+ บันทึกรับของ</button><button type="button" class="btn sm" data-a="recvAll" data-id="${sel.id}">รับครบทุกรายการวันนี้</button></div></section>`;
}
function buyDL(){
  const td=today(),rows=P.pos.flatMap(po=>po.items.map(l=>({po,l,r:recvOf(po,l.id)}))).sort((a,b)=>(a.po.due||'').localeCompare(b.po.due||''));
  const open=rows.filter(x=>x.r<n(x.l.q)),late=open.filter(x=>okD(x.po.due)&&x.po.due<td);
  return `<dl class="stats"><div><dt>รายการที่สั่งทั้งหมด</dt><dd>${rows.length}</dd></div><div><dt>ยังส่งไม่ครบ</dt><dd>${open.length}</dd></div><div><dt>เลยกำหนดส่ง</dt><dd style="color:${late.length?'var(--danger)':'inherit'}">${late.length}</dd></div><div><dt>ส่งใน 7 วันข้างหน้า</dt><dd>${open.filter(x=>okD(x.po.due)&&x.po.due>=td&&x.po.due<=addD(td,7)).length}</dd></div></dl>
  <section class="card"><h2><span>ติดตามของเข้าหน้างาน</span><small>เรียงตามกำหนดส่ง กดเลข PO เพื่อบันทึกรับของ</small></h2>
  <div class="tw"><table><thead><tr><th>PO</th><th>ผู้ขาย</th><th>รายการ</th><th class="r">สั่ง</th><th class="r">รับแล้ว</th><th class="r">ค้าง</th><th>กำหนดส่ง</th><th>สถานะ</th></tr></thead><tbody>
  ${rows.length?rows.map(({po,l,r})=>{const left=n(l.q)-r,lt=left>0&&okD(po.due)&&po.due<td;return `<tr><td><button type="button" class="btn ghost sm" data-a="goPO" data-id="${po.id}">${esc(po.no)}</button></td><td>${esc(vName(po.vid))}</td><td>${esc(l.desc)}</td><td class="r">${fmtq(l.q)} ${esc(l.unit)}</td><td class="r">${fmtq(r)}</td><td class="r">${left>0?fmtq(left):''}</td><td>${thD(po.due)}</td><td>${left<=0?'<span class="pill ok">ครบ</span>':lt?`<span class="pill bad">ช้า ${diffD(po.due,td)} วัน</span>`:r>0?'<span class="pill warn">บางส่วน</span>':'<span class="pill">รอส่ง</span>'}</td></tr>`}).join(''):'<tr><td colspan="8" class="empty">ยังไม่มี PO</td></tr>'}</tbody></table></div></section>`;
}
ACT.goPO=b=>{S.sub.buy='po';S.sel.po=b.dataset.id;render()};
function buyVen(){
  const cols=[{k:'name',h:'ชื่อผู้ขาย',w:200},{k:'cat',h:'สินค้า/หมวด',w:140},{k:'contact',h:'ผู้ติดต่อ',w:120},{k:'phone',h:'โทร',w:110},{k:'email',h:'อีเมล',w:160},{k:'tax',h:'เลขผู้เสียภาษี',w:130},{k:'addr',h:'ที่อยู่',t:'area',w:220},{k:'credit',h:'เครดิต (วัน)',t:'num',w:70},
    {h:'PO',t:'calc',r:1,f:v=>P.pos.filter(p=>p.vid===v.id).length||''},{h:'ยอดสั่งซื้อ',t:'calc',r:1,f:v=>{const t=sum(P.pos.filter(p=>p.vid===v.id),p=>poTotal(p).t);return t?fmt(t):''}}];
  TABLES.ven={rows:()=>P.vendors,cols};
  return `<section class="card"><h2><span>ทะเบียนผู้ขาย</span><span class="sp"></span>${copyBtn('ven')}</h2>${gtable('vendors',P.vendors,cols)}<div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="vendors">+ เพิ่มผู้ขาย</button></div></section>`;
}
PRINT.pr=id=>{const r=P.prs.find(x=>x.id===id);if(!r)return '';const Q=r.qs;
  return phead(`ใบขอซื้อ / ตารางเปรียบเทียบราคา ${esc(r.no)}`,`วันที่ ${thDL(r.date)}`)+`<div class="meta"><div>ต้องใช้ก่อน: ${thDL(r.need)}</div><div>ผู้ขอซื้อ: ${esc(r.by||'')}</div><div>หมายเหตุ: ${esc(r.note||'')}</div></div>
  <table><thead><tr><th>#</th><th>รายการ</th><th>จำนวน</th><th>หน่วย</th><th>งบ/หน่วย</th>${Q.map(q=>`<th>${esc(vName(q.vid))}</th>`).join('')}</tr></thead><tbody>
  ${r.items.map((l,i)=>`<tr><td>${i+1}</td><td>${esc(l.desc)}</td><td style="text-align:right">${fmtq(l.q)}</td><td>${esc(l.unit)}</td><td style="text-align:right">${fmt(l.bud)}</td>${Q.map(q=>`<td style="text-align:right">${n(q.p[l.id])?fmt(n(q.p[l.id]),2):'–'}</td>`).join('')}</tr>`).join('')}
  <tr><td></td><td colspan="4"><b>รวม (ไม่รวม VAT)</b></td>${Q.map(q=>`<td style="text-align:right"><b>${fmt(sum(r.items,l=>n(l.q)*n(q.p[l.id])),2)}</b></td>`).join('')}</tr>
  <tr><td></td><td colspan="4">ส่งของ (วัน) / เครดิต (วัน)</td>${Q.map(q=>`<td style="text-align:right">${n(q.days)} / ${n(q.credit)}</td>`).join('')}</tr></tbody></table>
  ${r.award?`<p>ผู้ขายที่เลือก: <b>${esc(vName((Q.find(q=>q.id===r.award)||{}).vid))}</b></p>`:''}<div class="sign"><div>ผู้ขอซื้อ</div><div>ผู้ตรวจสอบ</div><div>ผู้อนุมัติ</div></div>`};
PRINT.po=id=>{const p=P.pos.find(x=>x.id===id);if(!p)return '';const v=P.vendors.find(x=>x.id===p.vid)||{},T=poTotal(p);
  return phead(`ใบสั่งซื้อ (Purchase Order) ${esc(p.no)}`,`วันที่ ${thDL(p.date)}`)+`<div class="meta"><div><b>ผู้ขาย:</b> ${esc(v.name||'')}<br>${esc(v.contact||'')} ${esc(v.phone||'')}<br>เลขผู้เสียภาษี ${esc(v.tax||'')}</div><div>กำหนดส่ง: ${thDL(p.due)}<br>สถานที่ส่ง: ${esc(p.ship||P.info.site||'')}<br>เครดิต ${n(p.credit)} วัน</div></div>
  <table><thead><tr><th>#</th><th>รายการ</th><th>จำนวน</th><th>หน่วย</th><th>ราคา/หน่วย</th><th>จำนวนเงิน</th></tr></thead><tbody>
  ${p.items.map((l,i)=>`<tr><td>${i+1}</td><td>${esc(l.desc)}</td><td style="text-align:right">${fmtq(l.q)}</td><td>${esc(l.unit)}</td><td style="text-align:right">${fmt(l.p,2)}</td><td style="text-align:right">${fmt(n(l.q)*n(l.p),2)}</td></tr>`).join('')}
  <tr><td colspan="5" style="text-align:right">รวม</td><td style="text-align:right">${fmt(T.s,2)}</td></tr><tr><td colspan="5" style="text-align:right">VAT ${p.novat?0:n(P.info.vat)}%</td><td style="text-align:right">${fmt(T.v,2)}</td></tr><tr><td colspan="5" style="text-align:right"><b>รวมทั้งสิ้น</b></td><td style="text-align:right"><b>${fmt(T.t,2)}</b></td></tr></tbody></table>
  ${p.note?`<p>หมายเหตุ: ${esc(p.note)}</p>`:''}<div class="sign"><div>ผู้จัดทำ</div><div>ผู้อนุมัติ</div><div>ผู้ขาย (รับทราบ)</div></div>`};

