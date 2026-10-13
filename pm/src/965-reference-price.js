/* ---------- 3.84 PENUM ราคากลาง round 2: the bid priced from the price library, buildings, and ปร.4 / ปร.5 / ปร.6 ----------
   - A card on the bid matches each BOQ line to the company price library (960-price-library.js) by name, unit and brand, then
     by close names (pbCands); the estimator checks the pairs and takes the library's material and labour prices and brand.
     The bid's own prices can go back into the library.
   - t.parts = [{id, name}]: the buildings or parts of the work. Each BOQ line belongs to one (i.part, the first part when unset);
     the site costs are a part of their own. One part = the forms as before.
   - t.purpose: 'bid' (our offer) or 'ref' (a reference price for a government agency, signed by its committee t.c1–t.c3).
   - ปร.4 one sheet per part with the brand in the remarks, ปร.5 one per part, ปร.6 the parts summed, rounded and in words.
     Factor F is the one for the whole job (tdCalc), the way the official table is read. */
PL_SK.td=['งานประมูล',''];
NEW.parts=arr=>({name:'อาคาร '+(arr.length+1)});
const tdPartId=(t,i)=>{const P=t.parts||[];return P.some(p=>p.id===i.part)?i.part:(P[0]||{}).id||''};
const TD_PRE='ค่าใช้จ่ายพิเศษตามข้อกำหนดและค่าใช้จ่ายอื่นๆ';
function tdParts(t){const P=t.parts||[];if(!P.length)return [{id:'',name:'',G:tdGroups(t)}];
  const out=P.map(p=>({id:p.id,name:p.name||'อาคาร',G:tdGroups(Object.assign({},t,{items:t.items.filter(i=>tdPartId(t,i)===p.id),pre:[]}))}));
  if((t.pre||[]).length)out.push({id:'pre',name:TD_PRE,G:tdGroups(Object.assign({},t,{items:[]}))});
  return out.filter(p=>p.G.length)}
const tdPCost=(t,p)=>sum(p.G,g=>tdGCost(t,g));
const tdRef=t=>t.purpose==='ref';
const tdSigns=t=>tdRef(t)?signs([['c1','ประธานกรรมการ'],['c2','กรรมการ'],['c3','กรรมการ']].map(([k,l])=>`(${esc(t[k]||'.......................................')})<br>${l}`))
  :signs(['ผู้ประมาณราคา','ผู้ตรวจสอบ','กรรมการผู้จัดการ']);
const prMetaP=(t,form,k,N)=>`<div style="display:flex;justify-content:space-between;font-size:11px"><span>แบบ ${form}</span><span>${N>1?`ส่วนที่ ${k} / ${N} · `:''}แผ่นที่ ...... / ......</span></div>`;
const tdBr='<div style="page-break-before:always"></div>';

// --- the forms ---
PRINT.pr4=id=>{const t=tdById(id);if(!t)return '';const P=tdParts(t),R=v=>`<td style="text-align:right">${v}</td>`;
  return `<style>@page{size:A4 landscape;margin:10mm}</style>`+P.map((p,k)=>{const sm=sum(p.G,g=>g.pre?tdGCost(t,g):sum(g.items,i=>n(i.q)*tdM(t,i))),sl=sum(p.G,g=>g.pre?0:sum(g.items,i=>n(i.q)*tdL(t,i)));
    return (k?tdBr:'')+prMetaP(t,'ปร.4',k+1,P.length)+`<h1 style="text-align:center">แบบแสดงรายการ ปริมาณงาน และราคา</h1>`+prHead(t)+(p.name&&P.length>1?`<p style="margin:2px 0 6px"><b>อาคาร / ส่วนงาน</b> ${esc(p.name)}</p>`:'')+
    `<table class="pr4"><thead><tr><th rowspan="2">ลำดับ</th><th rowspan="2">รายการ</th><th rowspan="2">จำนวน</th><th rowspan="2">หน่วย</th><th colspan="2">ราคาค่าวัสดุ</th><th colspan="2">ราคาค่าแรงงาน</th><th rowspan="2">รวมค่าวัสดุและค่าแรงงาน</th><th rowspan="2">หมายเหตุ</th></tr>
    <tr><th>ราคาต่อหน่วย</th><th>จำนวนเงิน</th><th>ราคาต่อหน่วย</th><th>จำนวนเงิน</th></tr></thead><tbody>
    ${p.G.map((g,gi)=>{const head=`<tr><td><b>${gi+1}</b></td><td colspan="9"><b>${esc(g.name)}</b></td></tr>`;
      const body=g.pre?g.pre.map((x,j)=>`<tr><td>${gi+1}.${j+1}</td><td>${esc(x.desc)}</td>${R(fmtq(x.q))}<td>${esc(x.unit)}</td>${R(fmt(x.rate,2))}${R(fmt(n(x.q)*n(x.rate),2))}${R('–')}${R('–')}${R(fmt(n(x.q)*n(x.rate),2))}<td></td></tr>`).join('')
        :g.items.map((i,j)=>{const m=tdM(t,i),l=tdL(t,i);return `<tr><td>${gi+1}.${j+1}</td><td>${esc(itemName(i))}</td>${R(fmtq(i.q))}<td>${esc(i.unit)}</td>${R(fmt(m,2))}${R(fmt(n(i.q)*m,2))}${R(fmt(l,2))}${R(fmt(n(i.q)*l,2))}${R(fmt(n(i.q)*(m+l),2))}<td>${i.br?'ยี่ห้อ '+esc(i.br):''}</td></tr>`}).join('');
      const gm=g.pre?tdGCost(t,g):sum(g.items,i=>n(i.q)*tdM(t,i)),gl=g.pre?0:sum(g.items,i=>n(i.q)*tdL(t,i));
      return head+body+`<tr class="st"><td></td><td style="text-align:right">รวม${esc(g.name)}</td><td></td><td></td><td></td>${R(fmt(gm,2))}<td></td>${R(fmt(gl,2))}${R(fmt(gm+gl,2))}<td></td></tr>`}).join('')}
    <tr class="st"><td></td><td style="text-align:right"><b>รวมค่างานต้นทุน${P.length>1?esc(p.name):'ทั้งหมด'}</b></td><td></td><td></td><td></td>${R('<b>'+fmt(sm,2)+'</b>')}<td></td>${R('<b>'+fmt(sl,2)+'</b>')}${R('<b>'+fmt(sm+sl,2)+'</b>')}<td></td></tr></tbody></table>`+tdSigns(t)}).join('')};
PRINT.pr5=id=>{const t=tdById(id);if(!t)return '';const P=tdParts(t),c=tdCalc(t),gov=t.mode!=='pvt',F=gov?c.F:c.mk,one=P.length===1,ref=tdRef(t),r=v=>`<td style="text-align:right">${v}</td>`;
  return P.map((p,k)=>{const D=tdPCost(t,p);
    return (k?tdBr:'')+prMetaP(t,'ปร.5',k+1,P.length)+`<h1 style="text-align:center">แบบสรุปค่าก่อสร้าง</h1>`+prHead(t)+
    `<p style="margin:4px 0">${P.length>1?`<b>อาคาร / ส่วนงาน</b> ${esc(p.name)} · `:''}ระยะเวลาก่อสร้าง ${fmtq(t.months)} เดือน · ราคาจากแบบ ปร.4 จำนวน ${p.G.length} หมวด</p>
    <table><thead><tr><th>ลำดับ</th><th>รายการ</th><th>ค่างานต้นทุน (บาท)</th><th>${gov?'Factor F':'ตัวคูณ'}</th><th>ค่าก่อสร้าง (บาท)</th><th>หมายเหตุ</th></tr></thead><tbody>
    ${p.G.map((g,i)=>{const v=tdGCost(t,g);return `<tr><td>${i+1}</td><td>${esc(g.name)}</td>${r(fmt(v,2))}<td style="text-align:center">${fmt(F,4)}</td>${r(fmt(v*F,2))}<td></td></tr>`}).join('')}
    <tr><td></td><td style="text-align:right"><b>รวมค่าก่อสร้าง${one?'':esc(p.name)}</b></td>${r('<b>'+fmt(D,2)+'</b>')}<td></td>${r('<b>'+fmt(D*F,2)+'</b>')}<td></td></tr>
    ${one?`<tr><td></td><td style="text-align:right">ปัดเศษ${n(t.disc)?' และลดราคา':''}</td><td></td><td></td>${r(fmt(c.bid-c.raw,2))}<td></td></tr>
    ${gov?'':`<tr><td></td><td style="text-align:right">ภาษีมูลค่าเพิ่ม ${fmtq(t.vat)}%</td><td></td><td></td>${r(fmt(c.vat,2))}<td></td></tr>`}
    <tr><td></td><td style="text-align:right"><b>${ref?'ราคากลาง':gov?'ราคาที่เสนอ':'รวมราคาที่เสนอ'}${gov?' (รวมภาษีมูลค่าเพิ่ม)':''}</b></td><td></td><td></td>${r('<b>'+fmt(c.gross,2)+'</b>')}<td></td></tr>
    <tr><td colspan="6" style="text-align:center"><b>(${bahtText(c.gross)})</b></td></tr>`:`<tr><td colspan="6" style="text-align:center">รวมทุกอาคาร ปัดเศษ และ${ref?'ราคากลาง':'ราคาที่เสนอ'}อยู่ในแบบ ปร.6</td></tr>`}</tbody></table>
    <p style="margin-top:8px"><b>เงื่อนไขที่ใช้คำนวณ</b> เงินล่วงหน้าจ่าย ${fmtq(t.adv)}% · เงินประกันผลงานหัก ${fmtq(t.ret)}% · ดอกเบี้ยเงินกู้ ${fmtq(t.int)}% ต่อปี · ภาษีมูลค่าเพิ่ม ${fmtq(t.vat)}%${gov&&n(t.Fo)>0?' · Factor F ตามตารางทางราชการ':gov?` · Factor F คำนวณจากค่าอำนวยการ ${fmt(c.oh,2)}% กำไร ${fmt(c.pr,2)}% ดอกเบี้ย ${fmt(c.fin,2)}% ของค่างานต้นทุนทั้งโครงการ`:''}</p>`+tdSigns(t)}).join('')};
PRINT.pr6=id=>{const t=tdById(id);if(!t)return '';const P=tdParts(t),c=tdCalc(t),gov=t.mode!=='pvt',F=gov?c.F:c.mk,ref=tdRef(t),r=v=>`<td style="text-align:right">${v}</td>`;
  return prMeta(t,'ปร.6')+`<h1 style="text-align:center">แบบสรุปผลการคำนวณราคากลางงานก่อสร้างอาคาร</h1>`+prHead(t)+
  `<p style="margin:4px 0">${ref?'คำนวณราคากลาง':'ประมาณราคา'}ตามแบบ ปร.4 และ ปร.5 ที่แนบ จำนวน ${P.length} ส่วน · ระยะเวลาก่อสร้าง ${fmtq(t.months)} เดือน</p>
  <table><thead><tr><th>ลำดับ</th><th>รายการ</th><th>ค่างานต้นทุน (บาท)</th><th>${gov?'Factor F':'ตัวคูณ'}</th><th>ค่าก่อสร้างเป็นเงิน (บาท)</th><th>หมายเหตุ</th></tr></thead><tbody>
  ${P.map((p,i)=>{const D=tdPCost(t,p);return `<tr><td>${i+1}</td><td>${esc(p.name||t.title||'งานก่อสร้าง')}</td>${r(fmt(D,2))}<td style="text-align:center">${fmt(F,4)}</td>${r(fmt(D*F,2))}<td>ตามแบบ ปร.5${P.length>1?' ส่วนที่ '+(i+1):''}</td></tr>`}).join('')}
  <tr><td></td><td style="text-align:right"><b>รวมค่าก่อสร้างทั้งโครงการ</b></td>${r('<b>'+fmt(c.D,2)+'</b>')}<td></td>${r('<b>'+fmt(c.raw,2)+'</b>')}<td></td></tr>
  <tr><td></td><td style="text-align:right">ปัดเศษ${n(t.disc)?' และลดราคา':''}</td><td></td><td></td>${r(fmt(c.bid-c.raw,2))}<td></td></tr>
  ${gov?'':`<tr><td></td><td style="text-align:right">ภาษีมูลค่าเพิ่ม ${fmtq(t.vat)}%</td><td></td><td></td>${r(fmt(c.vat,2))}<td></td></tr>`}
  <tr><td></td><td style="text-align:right"><b>${ref?'ราคากลาง':'ราคาที่เสนอ'}${gov?' (รวมภาษีมูลค่าเพิ่ม)':''}</b></td><td></td><td></td>${r('<b>'+fmt(c.gross,2)+'</b>')}<td></td></tr>
  <tr><td colspan="6" style="text-align:center"><b>(${bahtText(c.gross)})</b></td></tr></tbody></table>
  <p style="margin-top:8px">${gov?`Factor F ${fmt(c.F,4)} ${n(t.Fo)>0?'ตามตารางทางราชการ':'คำนวณจากค่างานต้นทุนทั้งโครงการ'} · `:''}ภาษีมูลค่าเพิ่ม ${fmtq(t.vat)}% · ${ref?'คำนวณราคากลาง':'ประมาณราคา'}เมื่อวันที่ ${thDL(t.date)}</p>`+tdSigns(t)};
DOC_EN.push([/แบบสรุปผลการคำนวณราคากลาง/,'REFERENCE PRICE SUMMARY (FORM POR.6)']);

// --- the price library on the bid ---
let TDW=null;// the library indexed for one render
function tdLibIdx(){const L=plCfg();if(TDW&&TDW.L===L&&TDW.n===L.length)return TDW;const ix=new Map();
  L.forEach(x=>{const k=plKey(x.name);(ix.get(k)||ix.set(k,[]).get(k)).push(x)});
  return TDW={L,n:L.length,ix,w:{items:L.map(x=>({id:x.id,name:plSyn(x.name+(x.br?' '+x.br:'')),unit:x.unit,x}))}}}
const tdLibCands=i=>{const I=tdLibIdx();return pbCands(I.w,{desc:plSyn(itemName(i)+(i.br?' '+i.br:'')),unit:i.unit}).map(c=>({x:c.x.x,s:c.s}))};
function tdLibMatch(t,i){const o=(t.plx||{})[i.id];if(o==='none')return null;const I=tdLibIdx();
  if(o){const x=I.L.find(z=>z.id===o);if(x)return {x,s:1,manual:1}}
  const u=plKey(i.unit||''),b=plKey(i.br||''),C=[...(I.ix.get(plKey(itemName(i)))||[]),...(I.ix.get(plKey(i.desc))||[])].filter(x=>!u||!x.unit||plKey(x.unit)===u);
  const x=C.find(z=>plKey(z.br||'')===b)||(!b&&C[0]);if(x)return {x,s:1};
  const c=tdLibCands(i)[0];return c&&c.s>=.5?c:null}
// the same card serves a quotation (ใบเสนอราคา, private jobs): its buttons and selects carry data-tk="q"
const tdLibJob=b=>b.dataset.tk==='q'?CO().quotes.find(q=>q.id===b.dataset.id):tdById(b.dataset.id);
ACT.tdLib=b=>{const t=tdLibJob(b),q=b.dataset.tk==='q';if(!t)return;// a quotation prices from the line total (i.t), so it follows the new cost
  const only=b.dataset.i;let k=0;
  t.items.forEach(i=>{if(only&&i.id!==only)return;if(!only&&!$(`#tlc-${i.id}`)?.checked)return;const m=tdLibMatch(t,i);if(!m)return;
    if(n(m.x.m)>0)i.m=n(m.x.m);if(n(m.x.l)>0)i.l=n(m.x.l);if(m.x.br)i.br=m.x.br;i.mSrc=`คลังราคา · ${m.x.src||''}`;if(q)i.t=n(i.q)*(n(i.m)+n(i.l));k++});
  save();render();toast(k?`ใช้ราคาจากคลัง ${k} รายการ`:'ยังไม่ได้เลือกรายการ')};
ACT.tdToLib=b=>{const t=tdLibJob(b);if(!t||!t.items.length)return;const q=b.dataset.tk==='q';
  const r=plMerge(t.items.map(i=>({g:i.g,name:itemName(i),br:i.br,unit:i.unit,m:i.m,l:i.l})),{src:`${t.no} ${t.title||''}`.trim(),sk:q?'qt':'td'});plSay(r,'บันทึกราคางานนี้เข้าคลัง')};
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset&&el.dataset.tli){const t=el.dataset.tk==='q'?CO().quotes.find(q=>q.id===el.dataset.id):curTd();if(t){(t.plx=t.plx||{})[el.dataset.tli]=el.value;save();render()}}
  else if(el.id==='tlAll')document.querySelectorAll('.tlc').forEach(c=>c.checked=el.checked);
  else if(el.id==='tlShow'){S.sel.tlShow=el.value;render()}
  else if(el.dataset&&el.dataset.tdpg){const t=curTd();if(!t||!el.value)return;t.items.forEach(i=>{if(i.g===el.dataset.tdpg)i.part=el.value});save();render()}});
function tdLibCard(t,o){o=o||{};const L=plCfg(),b=o.b||`co.tenders.${t.id}.items`,tk=o.tk?` data-tk="${o.tk}"`:'';
  const head=`<section class="card"><h2><span>${o.title||'ราคาจากคลังราคากลาง'}</span><small>จับคู่จากชื่อ หน่วย และยี่ห้อ · ${fmt(L.length)} รายการในคลัง</small><span class="sp"></span>
    <button type="button" class="btn sm" data-a="tdToLib" data-id="${t.id}"${tk}>บันทึกราคางานนี้เข้าคลัง</button><button type="button" class="btn sm" data-a="go" data-m="co" data-k="tender" data-s="plib">เปิดคลังราคากลาง</button></h2>`;
  if(!L.length)return head+`<p class="hint">คลังยังว่าง เปิดคลังราคากลางเพื่อเติมราคาก่อน หรือกด “บันทึกราคางานนี้เข้าคลัง”</p></section>`;
  const R=t.items.map(i=>({i,m:tdLibMatch(t,i)})),hit=R.filter(r=>r.m),show=S.sel.tlShow||'hit',
    same=r=>n(r.m.x.m)>0&&n(r.m.x.m)!==n(r.i.m)||n(r.m.x.l)>0&&n(r.m.x.l)!==n(r.i.l),Ls=show==='all'?R:show==='diff'?hit.filter(same):show==='miss'?R.filter(r=>!r.m):hit;
  const cost=sum(R,r=>n(r.i.q)*((r.m&&n(r.m.x.m)>0?n(r.m.x.m):n(r.i.m))+(r.m&&n(r.m.x.l)>0?n(r.m.x.l):n(r.i.l)))),now=sum(t.items,i=>n(i.q)*(n(i.m)+n(i.l)));
  return head+`<dl class="stats" style="margin-bottom:10px"><div><dt>จับคู่กับคลังได้</dt><dd>${hit.length} / ${t.items.length}</dd></div><div><dt>ราคาต่างจากคลัง</dt><dd>${hit.filter(same).length} รายการ</dd></div>
    <div><dt>ค่าวัสดุและค่าแรงถ้าใช้ราคาคลัง</dt><dd>${fmt(cost)}</dd></div><div><dt>ต่างจากตอนนี้</dt><dd style="color:${cost>now?'var(--danger)':'var(--good)'}">${cost>=now?'+':''}${fmt(cost-now)}</dd></div></dl>
  <div class="row" style="margin-bottom:8px"><select id="tlShow" aria-label="แสดง">${[['hit','เฉพาะที่จับคู่ได้'],['diff','เฉพาะที่ราคาต่างจากคลัง'],['miss','เฉพาะที่ไม่มีในคลัง'],['all','ทุกรายการ']].map(([k,l])=>`<option value="${k}"${k===show?' selected':''}>${l}</option>`).join('')}</select>
    <button type="button" class="btn sm pri" data-a="tdLib" data-id="${t.id}"${tk}>ใช้ราคาคลังกับรายการที่เลือก</button></div>
  <div class="tw" style="max-height:440px;overflow:auto"><table><thead><tr><th><input type="checkbox" id="tlAll" aria-label="เลือกทั้งหมด"></th><th>รายการใน BOQ</th><th>ยี่ห้อ / รุ่น</th><th class="r">วัสดุ / แรง (งานนี้)</th><th>รายการในคลัง</th><th class="r">วัสดุ / แรง (คลัง)</th><th></th></tr></thead><tbody>
  ${Ls.map(({i,m})=>{const C=tdLibCands(i),d=m&&same({i,m});
    return `<tr><td>${m?`<input type="checkbox" class="tlc" id="tlc-${i.id}" aria-label="เลือก">`:''}</td><td style="min-width:220px">${esc(itemName(i))}<br><small class="muted">${esc(i.unit)}${i.mSrc?' · ราคาจาก '+esc(i.mSrc):''}</small></td>
      <td style="min-width:120px"><input data-p="${b}.${i.id}.br" value="${esc(i.br||'')}" aria-label="ยี่ห้อ" placeholder="–"></td><td class="r" style="white-space:nowrap">${fmt(i.m,2)} / ${fmt(i.l,2)}</td>
      <td style="min-width:240px"><select data-tli="${i.id}" data-id="${t.id}"${tk} aria-label="จับคู่กับ"><option value="none"${!m?' selected':''}>– ไม่มีในคลัง –</option>${(m&&!C.some(c=>c.x.id===m.x.id)?[m]:[]).concat(C).map(c=>`<option value="${c.x.id}"${m&&m.x.id===c.x.id?' selected':''}>${esc(c.x.name)}${c.x.br?' · '+esc(c.x.br):''} (${esc(c.x.unit)})</option>`).join('')}</select></td>
      <td class="r" style="white-space:nowrap${d?';color:var(--crit)':''}">${m?`${fmt(m.x.m,2)} / ${fmt(m.x.l,2)}<br><small class="muted">${esc(PL_SK[plSrcK(m.x)][0])} ${thD(m.x.date)}</small>`:''}</td>
      <td>${m?`<button type="button" class="btn sm" data-a="tdLib" data-id="${t.id}"${tk} data-i="${i.id}">ใช้</button>`:''}</td></tr>`}).join('')||'<tr><td colspan="7" class="muted">ไม่มีรายการที่ตรงเงื่อนไข</td></tr>'}</tbody></table></div>
  <p class="hint">ตรวจคู่ที่โปรแกรมเลือกก่อนกดใช้ เปลี่ยนคู่ได้จากช่องเลือก · ใช้ราคาคลังแทนค่าวัสดุและค่าแรงที่คลังมีราคา (ราคาพาณิชย์มีแต่ค่าวัสดุ ค่าแรงเดิมคงไว้)${o.hint??' · ยี่ห้อพิมพ์ในช่องหมายเหตุของ ปร.4'}</p></section>`}

// --- buildings, purpose and the forms on the bid ---
function tdPartCard(t){if(!Array.isArray(t.parts))t.parts=[];const b=`co.tenders.${t.id}`,P=t.parts,c=tdCalc(t),F=t.mode!=='pvt'?c.F:c.mk,ref=tdRef(t),Ps=tdParts(t);
  const cost=p=>{const x=Ps.find(z=>z.id===p.id);return x?tdPCost(t,x):0};
  let lg='';
  return `<section class="card"><h2><span>ปร.4 ปร.5 ปร.6 และอาคาร</span><small>${ref?'ราคากลางให้หน่วยงาน':'ราคาที่เสนอ'} · ${Ps.length} ส่วน</small><span class="sp"></span>
    <button type="button" class="btn sm" data-a="print" data-k="pr4" data-id="${t.id}">พิมพ์ ปร.4</button><button type="button" class="btn sm" data-a="print" data-k="pr5" data-id="${t.id}">พิมพ์ ปร.5</button><button type="button" class="btn sm pri" data-a="print" data-k="pr6" data-id="${t.id}">พิมพ์ ปร.6</button></h2>
  <div class="form" style="margin-bottom:10px"><label>ทำราคานี้เพื่อ<select data-p="${b}.purpose"><option value="bid"${ref?'':' selected'}>ยื่นซอง (ราคาที่เสนอ)</option><option value="ref"${ref?' selected':''}>ราคากลางให้หน่วยงาน (คณะกรรมการลงนาม)</option></select></label>
    ${ref?[['c1','ประธานกรรมการ'],['c2','กรรมการ'],['c3','กรรมการ']].map(([k,l])=>`<label>${l}<input data-p="${b}.${k}" value="${esc(t[k]||'')}" placeholder="ชื่อ-นามสกุล"></label>`).join(''):''}</div>
  ${gtable(`${b}.parts`,P,[{k:'name',h:'อาคาร / ส่วนงาน',w:240},{h:'รายการ',t:'calc',r:1,f:p=>fmt(t.items.filter(i=>tdPartId(t,i)===p.id).length)},{h:'ค่างานต้นทุน',t:'calc',r:1,f:p=>fmt(cost(p))},{h:'ค่าก่อสร้าง × F',t:'calc',r:1,f:p=>fmt(cost(p)*F)}],
    {empty:'ทั้งงานเป็นอาคารเดียว กด “+ เพิ่มอาคาร” เมื่อมีหลายอาคารหรือหลายส่วนงาน แล้ว ปร.4 และ ปร.5 จะแยกแผ่นตามอาคาร และ ปร.6 สรุปรวม'})}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-a="add" data-c="${b}.parts">+ เพิ่มอาคาร</button>${(t.pre||[]).length&&P.length?`<span class="muted">ค่าใช้จ่ายหน้างานเป็นอีกส่วนหนึ่งใน ปร.6</span>`:''}</div>
  ${P.length>1&&t.items.length?`<h3 style="margin:14px 0 6px">รายการอยู่ในอาคารไหน</h3><div class="tw" style="max-height:420px;overflow:auto"><table><thead><tr><th>รายการ</th><th>หน่วย</th><th class="r">จำนวน</th><th>อาคาร / ส่วนงาน</th></tr></thead><tbody>
    ${t.items.map(i=>{const h=i.g!==lg?`<tr class="grp"><td colspan="3">${esc(gName(i.g))}</td><td><select data-tdpg="${esc(i.g)}" aria-label="ย้ายทั้งหมวด"><option value="">ย้ายทั้งหมวดไป…</option>${P.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></td></tr>`:'';lg=i.g;const pid=tdPartId(t,i);
      return h+`<tr><td>${esc(itemName(i))}</td><td>${esc(i.unit)}</td><td class="r">${fmtq(i.q)}</td><td><select data-p="${b}.items.${i.id}.part" aria-label="อาคาร">${P.map(p=>`<option value="${p.id}"${p.id===pid?' selected':''}>${esc(p.name)}</option>`).join('')}</select></td></tr>`}).join('')}</tbody></table></div>`:''}
  <p class="hint">Factor F อ่านจากค่างานต้นทุนรวมทั้งโครงการ แล้วใช้กับทุกอาคาร · ปร.6 รวมค่าก่อสร้างทุกส่วน ปัดเศษ และเขียนเป็นตัวอักษร${ref?' · ลายเซ็นท้ายแบบเป็นคณะกรรมการกำหนดราคากลาง':''}</p></section>`}
{const f=tdView;tdView=function(){let h=f();const t=curTd();if(!t)return h;TDW=null;
  h=h.replace(/(data-k="pr5" data-id="[^"]+">พิมพ์ ปร\.5<\/button>)/,`$1<button type="button" class="btn sm" data-a="print" data-k="pr6" data-id="${t.id}">พิมพ์ ปร.6</button>`);
  const at=s=>{const k=h.indexOf(s);return k<0?null:k},ins=(k,x)=>{h=h.slice(0,k)+x+h.slice(k)};
  if(t.items.length){const k=at('<section class="card"><h2><span>เทียบราคาวัสดุกับกระทรวงพาณิชย์')??at('<section class="card"><h2><span>ค่าใช้จ่ายหน้างาน');const x=tdLibCard(t);if(k==null)h+=x;else ins(k,x)}
  {const k=at('<section class="card"><h2><span>ค่าใช้จ่ายหน้างาน'),x=tdPartCard(t);if(k==null)h+=x;else ins(k,x)}
  return h}}
// a copied bid keeps its buildings: its lines point at the new part ids
{const f=ACT.tdCopy;ACT.tdCopy=b=>{const n0=tdCfg().tenders.length;f(b);const C=tdCfg();if(C.tenders.length===n0)return;const x=C.tenders[C.tenders.length-1],src=tdById(b.dataset.id);
  if(!src||!(x.parts||[]).length)return;const map={};x.parts.forEach(p=>{const o=p.id;p.id=uid();map[o]=p.id});x.items.forEach(i=>{if(map[i.part])i.part=map[i.part]});x.plx={};save();render()}}

if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ราคาจากคลังราคากลาง':'Prices from the price library','บันทึกราคางานนี้เข้าคลัง':'Save this job\'s prices to the library','เปิดคลังราคากลาง':'Open the price library',
  'จับคู่กับคลังได้':'Matched in library','ราคาต่างจากคลัง':'Differs from library','ใช้ราคาคลังกับรายการที่เลือก':'Use library prices on the selected lines','ปร.4 ปร.5 ปร.6 และอาคาร':'Forms POR.4–POR.6 and buildings',
  'พิมพ์ ปร.6':'Print POR.6','ทำราคานี้เพื่อ':'This price is for','ยื่นซอง (ราคาที่เสนอ)':'A bid (our offer)','ราคากลางให้หน่วยงาน (คณะกรรมการลงนาม)':'A reference price for an agency (signed by its committee)',
  '+ เพิ่มอาคาร':'+ Add building','อาคาร / ส่วนงาน':'Building / part','รายการอยู่ในอาคารไหน':'Which building each line is in','ย้ายทั้งหมวดไป…':'Move the whole group to…','ยี่ห้อ / รุ่น':'Brand / model',
  'เฉพาะที่จับคู่ได้':'Matched only','เฉพาะที่ราคาต่างจากคลัง':'Different from library only','เฉพาะที่ไม่มีในคลัง':'Not in library only','ทุกรายการ':'All lines','ประธานกรรมการ':'Committee chair','กรรมการ':'Committee member'});
