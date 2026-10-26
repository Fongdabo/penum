/* ---------- 4.79 เทียบกับไฟล์ฉบับเก่า: a quotation beside an older BOQ file (R1 in Excel or PDF), line by line ----------
   User (2026-10-26, TOYOTA CANTEEN R1 → R3): "ทำด้วยครับ" / "ลูกค้าจะได้เช็คได้ ผมว่าดี". 923 compares the Revs kept inside the quote; an
   older version that was never in PENUM (the R1 Excel the customer already has) comes in through the usual import dialog (710, target
   'qv'), is kept with the quote (Q.vf, newest 3: {id, nm, at, items:[{g, head, desc, unit, q, m, l}], ex:{extra, disc}}) and shown
   beside the quote as it is now: quantity, selling price per unit and amount, added / removed / changed, totals before and with VAT.
   Lines meet by their wording (numbering left out), unit, then section and heading. "พิมพ์ให้ลูกค้า" prints the same table with
   selling prices only (PRINT.qvf, A4 landscape), so the customer can check what changed. */
const QVF_MAX=3;
const qvfN=s=>String(s||'').toLowerCase().replace(/^\s*[-–•]?\s*(\d+(\.\d+)*\.?\s+)?/,'').replace(/[\s.,:;'"“”()\-–]+/g,'');
const qvfU=s=>String(s||'').toLowerCase().replace(/[\s.]/g,'');
const qvfTok=s=>new Set(String(s||'').toLowerCase().replace(/^\s*\d+(\.\d+)*\.?\s*/,'').split(/[^a-z0-9ก-๙]+/).filter(Boolean));
const qvfSim=(a,b)=>{const A=qvfTok(a),B=qvfTok(b);if(!A.size||!B.size)return 0;let k=0;A.forEach(x=>{if(B.has(x))k++});return k/Math.max(A.size,B.size)};
// pair every line now with a line of the old file: same wording and unit first, the closest section and heading among those
function qvfPair(Q,F){const O=F.items.map((o,k)=>({o,k,d:qvfN(o.desc),u:qvfU(o.unit),used:0})),N=(Q.items||[]).filter(i=>!i.hs),R=[];
  N.forEach(i=>{const d=qvfN(i.desc),u=qvfU(i.unit);let c=O.filter(x=>!x.used&&x.d===d&&x.u===u);if(!c.length)c=O.filter(x=>!x.used&&x.d===d);
    let b=null,bs=-1;c.forEach(x=>{const s=(qvfN(x.o.g)===qvfN(i.g)?2:0)+(qvfN(x.o.head)===qvfN(i.head)?3:0)+2*qvfSim(x.o.head,i.head)+qvfSim(x.o.g,i.g);if(s>bs){bs=s;b=x}});
    if(b)b.used=1;R.push({i,o:b&&b.o})});
  O.filter(x=>!x.used).forEach(x=>R.push({i:null,o:x.o}));return R}
function qvfRows(Q,F){return qvfPair(Q,F).map(({i,o})=>{const q1=o?n(o.q):0,u1=o?n(o.m)+n(o.l):0,q2=i?n(i.q):0,u2=i?qUnit(Q,i):0,a1=q1*u1,a2=q2*u2;
  const st=!o?'add':!i||!q2?'del':!q1?'add':q2!==q1?(q2>q1?'up':'dn'):Math.abs(u2-u1)>0.004?'pr':'same';
  return {g:(i||o).g||'',head:(i||o).head||'',desc:(i||o).desc||'',unit:(i||o).unit||'',q1,u1,a1,q2,u2,a2,st}})}
const QVF_ST={add:'เพิ่มใหม่',del:'ตัดออก',up:'เพิ่มปริมาณ',dn:'ลดปริมาณ',pr:'ราคาเปลี่ยน',same:'เท่าเดิม'};
function qvfSum(Q,F,R){const l1=sum(R,r=>r.a1),c=qCalc(Q),x=F.ex||{},net1=l1+n(x.extra)-n(x.disc);return {l1,l2:c.lines,net1,net2:c.net,g1:net1*1.07,g2:c.grand}}
const qvfD=v=>Math.abs(v)<0.005?'<span class="qvf-0">–</span>':`<span class="${v>0?'qvf-p':'qvf-m'}">${v>0?'+':''}${fmt(v,2)}</span>`;
const qvfDq=v=>Math.abs(v)<1e-9?'<span class="qvf-0">–</span>':`<span class="${v>0?'qvf-p':'qvf-m'}">${v>0?'+':''}${fmtq(v)}</span>`;
// the table, for the page (only = hide unchanged lines) and the print
function qvfTable(Q,F,only){const R=qvfRows(Q,F),S=qvfSum(Q,F,R),cnt=k=>R.filter(r=>r.st===k).length;let g=null,h='';
  R.forEach(r=>{if(only&&r.st==='same')return;if(r.g!==g){g=r.g;h+=`<tr class="qvf-g"><td colspan="11">${esc(g||'ไม่ระบุหมวด')}</td></tr>`}
    h+=`<tr class="qvf-${r.st}"><td>${esc([r.head.replace(/^\s*\d+(\.\d+)*\.?\s*/,''),r.desc].filter(Boolean).join(' · '))}</td><td>${esc(r.unit)}</td>
      <td class="r">${r.q1?fmtq(r.q1):'–'}</td><td class="r">${r.q2?fmtq(r.q2):'–'}</td><td class="r">${qvfDq(r.q2-r.q1)}</td>
      <td class="r">${r.u1?fmt(r.u1,2):'–'}</td><td class="r">${r.u2&&r.q2?fmt(r.u2,2):'–'}</td>
      <td class="r">${r.q1?fmt(r.a1,2):'–'}</td><td class="r">${r.q2?fmt(r.a2,2):'–'}</td><td class="r">${qvfD(r.a2-r.a1)}</td><td class="c"><span class="qvf-st">${QVF_ST[r.st]}</span></td></tr>`});
  const tr=(l,a,b)=>`<tr><td>${l}</td><td class="r">${fmt(a,2)}</td><td class="r">${fmt(b,2)}</td><td class="r">${qvfD(b-a)}</td></tr>`;
  return {n:{add:cnt('add'),del:cnt('del'),ch:cnt('up')+cnt('dn')+cnt('pr'),same:cnt('same')},
    sum:`<table class="qvf-s"><thead><tr><th></th><th class="r">${esc(F.nm)}</th><th class="r">${esc(Q.no||'ฉบับนี้')}</th><th class="r">ต่างกัน</th></tr></thead><tbody>
      ${tr('รวมรายการ',S.l1,S.l2)}${tr('ยอดก่อน VAT',S.net1,S.net2)}${tr('รวม VAT 7%',S.g1,S.g2)}</tbody></table>`,
    rows:`<table class="qvf-t"><thead><tr><th rowspan="2">รายการ</th><th rowspan="2">หน่วย</th><th colspan="3" class="c">จำนวน</th><th colspan="2" class="c">ราคา/หน่วย</th><th colspan="3" class="c">จำนวนเงิน</th><th rowspan="2" class="c">สถานะ</th></tr>
      <tr><th class="r">เดิม</th><th class="r">ใหม่</th><th class="r">ต่าง</th><th class="r">เดิม</th><th class="r">ใหม่</th><th class="r">เดิม</th><th class="r">ใหม่</th><th class="r">ต่าง</th></tr></thead><tbody>${h||'<tr><td colspan="11" class="empty">ไม่มีรายการที่เปลี่ยน</td></tr>'}</tbody></table>`}}
const qvfGet=id=>{const [qid,fid]=String(id||'').split('|'),Q=CO().quotes.find(q=>q.id===qid),F=Q&&(Q.vf||[]).find(f=>f.id===fid);return F?{Q,F}:null};
const QVF_CSS=`.qvf-t{width:100%;border-collapse:collapse;font-size:12.5px}.qvf-t th,.qvf-t td{border:1px solid #d5dde0;padding:3px 6px;vertical-align:top}.qvf-t thead th{background:#123A42;color:#fff;font-weight:600}
.qvf-t tr.qvf-g td{background:#eef3f4;font-weight:700}.qvf-t tr.qvf-add td{background:#e6f5ea}.qvf-t tr.qvf-del td{background:#fbe6e6}.qvf-t tr.qvf-up td,.qvf-t tr.qvf-dn td,.qvf-t tr.qvf-pr td{background:#fff6dc}
.qvf-p{color:#1e7a46;font-weight:600}.qvf-m{color:#b3261e;font-weight:600}.qvf-0{color:#9aa7ab}.qvf-st{white-space:nowrap;font-size:11.5px}.qvf-s{border-collapse:collapse;margin:6px 0 10px;font-size:13px}.qvf-s td,.qvf-s th{border:1px solid #d5dde0;padding:3px 10px}.qvf-s thead th{background:#eef3f4}`;
const qvfLegend='<p class="qvf-lg"><span class="qvf-k" style="background:#e6f5ea"></span> เพิ่มใหม่ <span class="qvf-k" style="background:#fbe6e6"></span> ตัดออก <span class="qvf-k" style="background:#fff6dc"></span> ปริมาณหรือราคาเปลี่ยน · ราคาไม่รวม VAT</p>';
PRINT.qvf=id=>{const x=qvfGet(id);if(!x)return '';const {Q,F}=x,T=qvfTable(Q,F,false),cu=custName(Q.cust)||Q.cust||'';
  return `<style>@page{size:A4 landscape;margin:9mm}${QVF_CSS}.qvf-p,.qvf-m{font-weight:600}.qvf-lg{font-size:11px;margin:4px 0}.qvf-k{display:inline-block;width:12px;height:10px;border:1px solid #ccd;margin:0 3px 0 8px;vertical-align:middle}</style>
  <div data-doc-name="${esc(`${Q.no||''} เทียบ ${F.nm} ${cu}`)}"></div>`+cphead(`ตารางเปรียบเทียบรายการ ${esc(Q.no||'')} กับ ${esc(F.nm)}`,esc(Q.no||''))+
  `<p style="margin:2px 0 6px">${cu?`เรียน <b>${esc(cu)}</b> · `:''}${esc([Q.pname,Q.title].filter(Boolean).join(' · '))}</p>
  <p style="margin:0 0 4px">เพิ่มใหม่ ${T.n.add} รายการ · ตัดออก ${T.n.del} รายการ · ปริมาณหรือราคาเปลี่ยน ${T.n.ch} รายการ · เท่าเดิม ${T.n.same} รายการ</p>${T.sum}${qvfLegend}${T.rows}`};
function qvfShow(Q,F){const T=qvfTable(Q,F,true);
  dialog(`เทียบ ${esc(Q.no||'')} กับ ${esc(F.nm)}`,`<div class="qvf"><p style="margin:0 0 6px">เพิ่มใหม่ <b>${T.n.add}</b> รายการ · ตัดออก <b>${T.n.del}</b> · ปริมาณหรือราคาเปลี่ยน <b>${T.n.ch}</b> · เท่าเดิม ${T.n.same} (ซ่อนไว้ ดูครบในใบพิมพ์)</p>${T.sum}<div class="tw qvf-w">${T.rows}</div></div>`,
    `<button type="button" class="btn pri" data-a="print" data-k="qvf" data-id="${Q.id}|${F.id}">พิมพ์ให้ลูกค้า</button>`);const d=$('#dlg');if(d){d.classList.add('dlg-wide','qvf-dlg');d.addEventListener('close',()=>d.classList.remove('dlg-wide','qvf-dlg'),{once:true})}}
// ---- the old file comes in through the import dialog
ACT.qvfAdd=b=>{ACT.impFile({dataset:{t:'qv',id:b.dataset.id}});const g=$('#impGoBtn');if(g)g.textContent='เทียบกับใบนี้';
  const p=document.querySelector('#dlg .hint');if(p)p.insertAdjacentHTML('afterend','<p class="hint">เลือกไฟล์ BOQ หรือใบเสนอราคาฉบับเก่า (เช่น R1) ระบบจะเทียบทีละรายการกับใบนี้ ใบนี้ไม่ถูกแก้ ตรวจว่าคอลัมน์ราคาเป็นราคาขายที่ลูกค้าเห็น</p>')};
{const f=impTarget;impTarget=function(){if(IMP.t==='qv'){const Q=CO().quotes.find(x=>x.id===IMP.id);return Q&&{has:0,o:Q}}return f.apply(this,arguments)}}
{const f=ACT.impGo;ACT.impGo=function(b){if(IMP.t!=='qv')return f.apply(this,arguments);const Q=CO().quotes.find(x=>x.id===IMP.id);if(!Q)return;
  const L=(IMP.rows||[]).filter(r=>r.on&&impTxt(r.desc)).map(r=>({g:impTxt(r.g),head:impTxt(r.head),desc:impTxt(r.desc),unit:impTxt(r.unit),q:n(r.q),m:n(r.m),l:n(r.l)}));
  if(!L.length){toast('ไม่มีรายการที่เลือกไว้');return}const E=IMP.ex||{};
  const F={id:uid(),nm:String(IMP.name||'ไฟล์เดิม').replace(/\.[a-z0-9]+$/i,''),at:new Date().toISOString(),items:L,ex:{extra:Math.round(n(E.extra)*100)/100,disc:Math.round(n(E.disc)*100)/100}};
  Q.vf=[...(Q.vf||[]),F].slice(-QVF_MAX);save();render();qvfShow(Q,F)}}
ACT.qvfOpen=b=>{const x=qvfGet(b.dataset.id);if(x)qvfShow(x.Q,x.F)};
ACT.qvfDel=b=>{const x=qvfGet(b.dataset.id);if(!x||!confirm(`ลบไฟล์เทียบ “${x.F.nm}” ออกจากใบนี้?`))return;x.Q.vf=x.Q.vf.filter(f=>f!==x.F);save();render()};
// ---- on the quote page, inside the Rev. card (923)
{const f=qrvCard;qrvCard=function(Q){const h=f.apply(this,arguments);if(!h||!Q)return h;const V=Q.vf||[];
  const box=`<div class="qvf-c"><b>เทียบกับไฟล์ฉบับเก่า</b> <small class="muted">เช่น BOQ R1 ที่ส่งลูกค้าไปแล้ว ดูว่าอะไรเพิ่ม ตัด หรือเปลี่ยน แล้วพิมพ์ให้ลูกค้าเช็คได้</small>
    ${V.map(F=>`<span class="qvf-f"><button type="button" class="btn sm" data-a="qvfOpen" data-id="${Q.id}|${F.id}">${esc(F.nm)}</button><button type="button" class="btn sm" data-a="print" data-k="qvf" data-id="${Q.id}|${F.id}" title="พิมพ์ตารางเทียบให้ลูกค้า">พิมพ์</button><button type="button" class="x" data-a="qvfDel" data-id="${Q.id}|${F.id}" title="ลบไฟล์เทียบนี้" aria-label="ลบไฟล์เทียบนี้">✕</button></span>`).join('')}
    <button type="button" class="btn sm pri" data-a="qvfAdd" data-id="${Q.id}">${V.length?'+ ไฟล์อื่น':'เลือกไฟล์ฉบับเก่า…'}</button></div>`;
  const k=h.lastIndexOf('</section>');return k<0?h:h.slice(0,k)+box+h.slice(k)}}
document.head.insertAdjacentHTML('beforeend',`<style>${QVF_CSS}.qvf{min-width:min(1100px,90vw)}#dlg.qvf-dlg{width:min(1440px,97vw)}.qvf-w{max-height:58vh;overflow:auto}.qvf-c{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px dashed var(--line,#cfd8dc)}
.qvf-f{display:inline-flex;gap:3px;align-items:center}.qvf-t thead th{position:sticky;top:0}.qvf-t thead tr+tr th{top:25px}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'เทียบกับไฟล์ฉบับเก่า':'Compare with an older file','เลือกไฟล์ฉบับเก่า…':'Choose the older file…','+ ไฟล์อื่น':'+ Another file','พิมพ์ให้ลูกค้า':'Print for the customer',
  'เทียบกับใบนี้':'Compare with this quote','เพิ่มใหม่':'Added','ตัดออก':'Removed','เพิ่มปริมาณ':'More','ลดปริมาณ':'Less','ราคาเปลี่ยน':'Price changed','เท่าเดิม':'Same','ต่างกัน':'Difference','สถานะ':'Status','เดิม':'Old','ใหม่':'New','ต่าง':'Change','รวมรายการ':'Lines total','ยอดก่อน VAT':'Before VAT','รวม VAT 7%':'With VAT 7%'});
