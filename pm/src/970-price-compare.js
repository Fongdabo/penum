/* ---------- 3.87 เทียบราคาทุกแหล่ง: every source's price for a library line, side by side ----------
   960-price-library.js keeps each source's price on the line (x.o, filled by plMerge) beside the price in use. Here they are shown
   one column per kind of source with the lowest, the highest and the spread, and the estimator picks which one the library uses
   (x.pin: a picked price is not replaced by later imports, which only add prices to compare). The value compared is the
   material price, or the labour price for a source that only gives labour (กรมบัญชีกลาง). */
Object.assign(PL_SK,{sup:['ใบเสนอราคาผู้ขาย','ok'],dealer:['ผู้แทนจำหน่าย','ok'],bb:['สำนักงบประมาณ','info'],cgd:['กรมบัญชีกลาง','info'],egp:['e-GP','info'],shop:['ร้านออนไลน์','']});
const PL_ORD=['moc','bb','cgd','egp','dealer','sup','po','shop','mep','td','qt','xls','file','hand','demo'];
function plOffs(x){const O=Object.entries(x.o||{}).map(([k,v])=>Object.assign({k},v));
  return O.length?O:[{k:plOK(x.sk,x.src),s:x.sk||'hand',src:x.src||'',m:n(x.m),l:n(x.l),d:x.date||''}]}
const plOV=o=>n(o.m)>0?n(o.m):n(o.l);
const plUsed=(x,o)=>x.pin?x.pin===o.k:o.s===(x.sk||'hand')&&o.src===(x.src||'');
function plSpread(x){const V=plOffs(x).map(plOV).filter(v=>v>0);if(!V.length)return null;const lo=Math.min(...V),hi=Math.max(...V);return {lo,hi,avg:sum(V)/V.length,n:V.length,pct:lo?(hi-lo)/lo*100:0}}
ACT.plV=b=>{S.sel.plV=b.dataset.k;S.sel.plN=200;render()};
document.addEventListener('change',e=>{if(e.target.id==='plCm'){S.sel.plCm=e.target.value;render()}});
function plCmpTable(R0){const show=S.sel.plCm||'multi',R=R0.filter(x=>show==='all'||plOffs(x).length>1&&(show!=='spread'||(plSpread(x)||{}).pct>10)),N=Math.max(100,+S.sel.plN||200);
  const K=PL_ORD.filter(k=>R.some(x=>plOffs(x).some(o=>o.s===k)));
  const rows=R.slice(0,N).map(x=>{const O=plOffs(x),sp=plSpread(x);
    const cellOf=k=>{const L=O.filter(o=>o.s===k).sort((a,b)=>plOV(a)-plOV(b));if(!L.length)return '<td class="muted" style="text-align:center">–</td>';const o=L[0],v=plOV(o),u=L.some(z=>plUsed(x,z));
      const c=sp&&sp.n>1?v===sp.lo?'var(--good)':v===sp.hi?'var(--danger)':'':'';
      return `<td class="r" style="white-space:nowrap${u?';background:var(--sunk);font-weight:600':''}"><button type="button" class="btn ghost sm" data-a="plUse" data-id="${x.id}" data-k="${esc(o.k)}" title="ใช้ราคานี้ · ${esc(o.src)}" style="${c?'color:'+c:''}">${fmt(v,2)}</button>${L.length>1?`<small class="muted"> +${L.length-1}</small>`:''}<br><small class="muted">${thD(o.d)}${!n(o.m)&&n(o.l)?' · ค่าแรง':''}</small></td>`};
    return `<tr><td style="min-width:200px">${esc(x.name)}${x.br?` <small class="muted">· ${esc(x.br)}</small>`:''}<br><small class="muted">${esc(x.unit)}</small></td>${K.map(cellOf).join('')}
      <td class="r" style="white-space:nowrap">${sp?fmt(sp.lo,2):''}</td><td class="r" style="white-space:nowrap">${sp?fmt(sp.hi,2):''}</td><td class="r">${sp&&sp.n>1?`<span style="color:${sp.pct>10?'var(--danger)':''}">${fmt(sp.pct,0)}%</span>`:''}</td>
      <td class="r" style="white-space:nowrap"><b>${fmt(n(x.m)>0?x.m:x.l,2)}</b>${x.pin?' 📌':''}<br><small class="muted">${esc(PL_SK[plSrcK(x)][0])}</small></td><td><button type="button" class="btn ghost sm" data-a="plOff" data-id="${x.id}">ทุกราคา</button></td></tr>`}).join('');
  return `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><select id="plCm" aria-label="แสดง">${[['multi','เฉพาะรายการที่มีหลายแหล่ง'],['spread','เฉพาะที่ราคาต่างกันเกิน 10%'],['all','ทุกรายการ']].map(([k,l])=>`<option value="${k}"${k===show?' selected':''}>${l}</option>`).join('')}</select>
    <button type="button" class="btn sm" data-a="plLow">ใช้ราคาต่ำสุดกับรายการที่แสดง</button><span class="muted">กดตัวเลขเพื่อใช้ราคานั้น · เขียว = ต่ำสุด แดง = สูงสุด · ช่องที่ทึบคือราคาที่ใช้อยู่</span></div>
  <div class="tw" style="max-height:600px;overflow:auto"><table><thead><tr><th>รายการ</th>${K.map(k=>`<th class="r">${esc(PL_SK[k][0])}</th>`).join('')}<th class="r">ต่ำสุด</th><th class="r">สูงสุด</th><th class="r">ต่าง</th><th class="r">ใช้อยู่</th><th></th></tr></thead>
  <tbody>${rows||`<tr><td colspan="${K.length+6}" class="empty">ยังไม่มีรายการที่มีราคาจากหลายแหล่ง กด “เติมราคา” แล้ววางราคาจากแหล่งอื่น เช่น price list ผู้แทนจำหน่าย หรือบัญชีพาณิชย์</td></tr>`}</tbody></table></div>
  ${R.length>N?`<div class="row" style="margin-top:8px"><span class="muted">แสดง ${fmt(N)} จาก ${fmt(R.length)} รายการ</span><button type="button" class="btn sm" data-a="plMore">แสดงเพิ่ม</button></div>`:`<p class="muted" style="margin:8px 0 0">${fmt(R.length)} รายการ</p>`}
  <p class="hint">ราคาทุกแหล่งไม่รวม VAT (ตอนวางเลือก “ราคารวม VAT แล้ว” เพื่อหักออก) · เทียบที่ค่าวัสดุ ถ้าแหล่งนั้นมีแต่ค่าแรงจะเทียบค่าแรง · ราคาที่เลือกเองมี 📌 ราคาที่เติมใหม่จะมาเป็นตัวเลือกให้เทียบ ไม่แทนราคาที่เลือกไว้</p>`}
function plUseOffer(x,o){plHist(x);if(n(o.m)>0)x.m=n(o.m);if(n(o.l)>0)x.l=n(o.l);x.src=o.src;x.sk=o.s;x.date=o.d||today();x.pin=o.k}
ACT.plUse=b=>{const x=plCfg().find(i=>i.id===b.dataset.id),o=x&&plOffs(x).find(z=>z.k===b.dataset.k);if(!x||!o)return;plOffSeed(x);plUseOffer(x,o);$('#dlg').open&&$('#dlg').close();save();render();toast(`ใช้ราคา ${PL_SK[o.s]?PL_SK[o.s][0]:''} ${fmt(plOV(o),2)} แล้ว`)};
ACT.plLow=()=>{const show=S.sel.plCm||'multi',R=plList().filter(x=>plOffs(x).length>1&&(show!=='spread'||(plSpread(x)||{}).pct>10));let k=0;
  if(!R.length||!confirm(`ใช้ราคาต่ำสุดของแต่ละรายการ ${fmt(R.length)} รายการ? (ราคาเดิมเก็บในประวัติ กด ย้อนกลับ ได้)`))return;
  R.forEach(x=>{const O=plOffs(x).filter(o=>plOV(o)>0).sort((a,b)=>plOV(a)-plOV(b)),o=O[0];if(!o||plUsed(x,o))return;plOffSeed(x);plUseOffer(x,o);k++});save();render();toast(`เปลี่ยนเป็นราคาต่ำสุด ${fmt(k)} รายการ`)};
ACT.plOff=b=>{const x=plCfg().find(i=>i.id===b.dataset.id);if(!x)return;const O=plOffs(x).sort((a,b)=>plOV(a)-plOV(b)),sp=plSpread(x);
  dialog('ราคาจากทุกแหล่ง',`<p><b>${esc(x.name)}</b>${x.br?' · '+esc(x.br):''} <small class="muted">${esc(x.unit)}</small>${sp&&sp.n>1?` · ต่ำสุด ${fmt(sp.lo,2)} สูงสุด ${fmt(sp.hi,2)} เฉลี่ย ${fmt(sp.avg,2)} ต่างกัน ${fmt(sp.pct,0)}%`:''}</p>
    <div class="tw"><table><thead><tr><th>แหล่ง</th><th>รายละเอียด</th><th class="r">ค่าวัสดุ</th><th class="r">ค่าแรง</th><th>วันที่ราคา</th><th></th></tr></thead><tbody>
    ${O.map(o=>{const u=plUsed(x,o);return `<tr${u?' class="grp"':''}><td><span class="pill ${(PL_SK[o.s]||['',''])[1]}">${esc((PL_SK[o.s]||[o.s])[0])}</span></td><td>${esc(o.src)}</td><td class="r">${n(o.m)?fmt(o.m,2):'–'}</td><td class="r">${n(o.l)?fmt(o.l,2):'–'}</td><td>${thD(o.d)}</td>
      <td style="white-space:nowrap">${u?'<b>ใช้อยู่</b>':`<button type="button" class="btn sm" data-a="plUse" data-id="${x.id}" data-k="${esc(o.k)}">ใช้ราคานี้</button>`}${O.length>1&&!u?`<button type="button" class="x" data-a="plOffDel" data-id="${x.id}" data-k="${esc(o.k)}" aria-label="ลบราคานี้">✕</button>`:''}</td></tr>`}).join('')}</tbody></table></div>
    <p class="hint">กด “ใช้ราคานี้” แล้วราคานั้นจะติด 📌 ราคาที่เติมเข้ามาทีหลังจะเก็บไว้เทียบเท่านั้น${x.pin?' · กด “ให้ราคาใหม่แทนได้” เพื่อให้ราคาที่เติมใหม่มาแทนเหมือนเดิม':''}</p>`,
    (x.pin?`<button type="button" class="btn sm" data-a="plUnpin" data-id="${x.id}">ให้ราคาใหม่แทนได้</button>`:'')+plJoinUI(x))};
// one thing named differently by two sources is two lines: move this line's prices into the other and drop this one
function plJoinUI(x){const w={items:plCfg().filter(z=>z!==x).map(z=>({id:z.id,name:plSyn(z.name+(z.br?' '+z.br:'')),unit:z.unit,x:z}))},C=pbCands(w,{desc:plSyn(x.name+(x.br?' '+x.br:'')),unit:x.unit}).slice(0,6);
  return C.length?`<select id="plJn" aria-label="รวมกับรายการ"><option value="">รวมราคาเข้ากับรายการ…</option>${C.map(c=>`<option value="${c.x.x.id}">${esc(c.x.x.name)}${c.x.x.br?' · '+esc(c.x.x.br):''} (${esc(c.x.x.unit)})</option>`).join('')}</select><button type="button" class="btn sm" data-a="plJoin" data-id="${x.id}">รวม</button>`:''}
ACT.plJoin=b=>{const L=plCfg(),x=L.find(i=>i.id===b.dataset.id),y=L.find(i=>i.id===$('#plJn')?.value);if(!x||!y){toast('เลือกรายการที่จะรวมก่อน');return}
  if(!confirm(`ย้ายราคาทุกแหล่งของ “${x.name}” ไปรวมกับ “${y.name}” แล้วลบรายการนี้?`))return;plOffSeed(x);plOffSeed(y);
  plOffs(x).forEach(o=>{y.o[o.k]={s:o.s,src:o.src,m:o.m,l:o.l,d:o.d}});CO().prices=L.filter(i=>i!==x);$('#dlg').close();save();render();ACT.plOff({dataset:{id:y.id}})};
ACT.plOffDel=b=>{const x=plCfg().find(i=>i.id===b.dataset.id);if(!x||!x.o)return;delete x.o[b.dataset.k];save();render();ACT.plOff(b)};
ACT.plUnpin=b=>{const x=plCfg().find(i=>i.id===b.dataset.id);if(!x)return;delete x.pin;save();render();ACT.plOff(b)};

if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ตารางราคา':'Price table','เทียบราคาทุกแหล่ง':'Compare all sources','ราคาจากทุกแหล่ง':'Prices from every source','ใช้ราคานี้':'Use this price','ใช้อยู่':'In use',
  'ต่ำสุด':'Lowest','สูงสุด':'Highest','ต่าง':'Spread','ทุกราคา':'All prices','เฉพาะรายการที่มีหลายแหล่ง':'Lines with several sources','เฉพาะที่ราคาต่างกันเกิน 10%':'Spread over 10% only','ใช้ราคาต่ำสุดกับรายการที่แสดง':'Use the lowest price on the lines shown',
  'ให้ราคาใหม่แทนได้':'Let new prices replace it','รวมราคาเข้ากับรายการ…':'Join the prices into line…','รวม':'Join','ใบเสนอราคาผู้ขาย':'Supplier quote','ผู้แทนจำหน่าย':'Dealer','สำนักงบประมาณ':'Budget Bureau','กรมบัญชีกลาง':'Comptroller General','ร้านออนไลน์':'Online shop'});
