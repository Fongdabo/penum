/* ---------- 4.99.66 หมวดงานตาม BOQ ของโครงการ ในค่าใช้จ่ายอื่น / ผู้รับเหมาช่วง, คาดการณ์ไม่นับซ้ำ ----------
   A BOQ imported from Excel keeps its own section names as the group (i.g = "Pipe System (ระบบท่อน้ำเย็น)"), but the
   หมวดงาน box of other costs and subcontractors listed only the standard codes (chw, eq …). Costs then landed in rows with
   no budget: the BOQ sections stayed at ใช้ไป 0% and คาดการณ์ (max of budget and committed, row by row) counted the same
   money twice (full budget + the cost again).
   - the box now lists this project's BOQ sections first, then the standard ones (optgroups);
   - a cost in a group with no budget shows under "ไม่อยู่ในงบ BOQ" with a warning, and can be counted as one BOQ section
     (P.gmap[code] = section, so costs already booked compute correctly without editing them);
   - the forecast takes those costs out of the remaining BOQ budget first and adds only what goes past it. ---------- */
const cbgBud=()=>{const B={};P.boq.items.forEach(i=>{B[i.g]=(B[i.g]||0)+boqCost(i)});return B};
const cbgOpts=()=>{const bq=groupsInBoq(),std=Object.entries(BOQ_G).filter(([k])=>!bq.includes(k));
  return bq.length?[['','–'],['\u0001','หมวดใน BOQ ของโครงการนี้'],...bq.map(g=>[g,gName(g)]),['\u0001','หมวดมาตรฐาน'],...std]:G_OPTS()};
{const f=gtable;gtable=function(base,rows,cols,o){
  if(base==='costs'||base==='subs')cols.forEach(c=>{if(c.k==='g'&&c.t==='sel'){c.o=cbgOpts;if(groupsInBoq().some(g=>!BOQ_G[g]))c.w=Math.max(c.w||0,230)}});
  let h=f.call(this,base,rows,cols,o);
  if(base==='costs'||base==='subs')h=h.replace(/<option value="\u0001">([^<]*)<\/option>/g,'<optgroup label="$1">');
  return h}}
{const f=costTable;costTable=function(){
  const {L}=f.apply(this,arguments),M=P.gmap||{},B=cbgBud(),by={};L.forEach(r=>by[r.g]=r);
  // a group with no budget that the user counts as a BOQ section joins that section's row
  L.slice().forEach(r=>{const to=!r.bud&&M[r.g];const t=to&&to!==r.g&&B[to]>0&&by[to];if(!t)return;
    ['po','sub','exp','paid'].forEach(k=>t[k]+=r[k]);(t.from=t.from||[]).push(r.g);L.splice(L.indexOf(r),1)});
  const bq=groupsInBoq(),ix=g=>{const i=bq.indexOf(g);return i<0?1e3:i},hasB=L.some(r=>r.bud>0);
  L.forEach(r=>{r.com=r.po+r.sub+r.exp;r.nb=hasB&&!(r.bud>0)&&r.com>0;r.fc=r.nb?r.com:Math.max(r.bud,r.com)});
  L.sort((a,b)=>(a.nb-b.nb)||(ix(a.g)-ix(b.g)));
  const IN=L.filter(r=>!r.nb),NB=L.filter(r=>r.nb),left=sum(IN,r=>Math.max(0,r.bud-r.com)),nb=sum(NB,r=>r.com),over=Math.max(0,nb-left);
  const T={bud:sum(L,r=>r.bud),com:sum(L,r=>r.com),paid:sum(L,r=>r.paid),fc:sum(IN,r=>r.fc)+over,nb,over,left};
  return {L,T}}}
function cbgTable(){
  const {L,T}=costTable(),bq=groupsInBoq(),M=P.gmap||{},B=cbgBud();
  const row=r=>{const u=r.bud?r.com*100/r.bud:0,fr=(r.from||[]).map(gName).join(', ');
    const map=r.nb&&bq.length?`<br><select class="cbg-map" data-g="${esc(r.g)}" aria-label="นับเป็นหมวด BOQ" style="margin-top:4px;max-width:260px"><option value="">นับเป็นหมวด BOQ… (ยังไม่เลือก)</option>${bq.filter(g=>B[g]>0).map(g=>`<option value="${esc(g)}"${M[r.g]===g?' selected':''}>${esc(gName(g))}</option>`).join('')}</select>`:'';
    return `<tr${r.nb?' class="cbg-nb"':''}><td>${esc(gName(r.g))}${r.nb?' <span class="pill warn">ไม่อยู่ในงบ BOQ</span>':''}${fr?`<br><small class="muted">รวมค่าใช้จ่ายที่ลงไว้ในหมวด ${esc(fr)}</small>`:''}${map}</td><td class="r">${fmt(r.bud)}</td><td class="r">${fmt(r.po)}</td><td class="r">${fmt(r.sub)}</td><td class="r">${fmt(r.exp)}</td><td class="r">${fmt(r.com)}</td><td class="r"><span class="pill ${u>100?'bad':u>85?'warn':''}">${r.bud?fmt(u,0)+'%':'–'}</span></td><td class="r" style="${r.bud-r.com<0?'color:var(--danger)':''}">${r.nb?'–':fmt(r.bud-r.com)}</td><td class="r">${fmt(r.paid)}</td><td class="r">${r.nb?'<span class="muted">ดูแถวด้านล่าง</span>':fmt(r.fc)}</td></tr>`};
  const IN=L.filter(r=>!r.nb),NB=L.filter(r=>r.nb);
  const nbRows=NB.length?`<tr class="grp"><td colspan="10">ไม่อยู่ในงบ BOQ · ค่าใช้จ่ายที่ลงในหมวดที่ไม่มีงบ ${fmt(T.nb)} บาท ${bq.length?'(เลือก “นับเป็นหมวด BOQ” ในแต่ละแถว หรือแก้หมวดในรายการค่าใช้จ่าย)':''}</td></tr>${NB.map(row).join('')}
    <tr><td colspan="9" class="r muted">คาดการณ์ของค่าใช้จ่ายนอกงบ: หักจากงบ BOQ ที่ยังเหลือ ${fmt(T.left)} ก่อน ส่วนที่เกินงบคงเหลือ</td><td class="r"${T.over?' style="color:var(--danger)"':''}>${fmt(T.over)}</td></tr>`:'';
  const warn=NB.length?`<p class="hint cbg-warn" style="border-left:3px solid var(--warn,#f59e0b);padding-left:8px">⚠ มีค่าใช้จ่าย ${fmt(T.nb)} บาท ลงในหมวดที่ไม่มีงบใน BOQ ยอดนี้ยังไม่หักงบหมวดใด และคาดการณ์ไม่นับซ้ำกับงบ BOQ ${bq.length?'เลือกหมวด BOQ ได้ที่ช่อง “หมวดงาน” ของค่าใช้จ่ายอื่น/ผู้รับเหมาช่วง หรือที่ “นับเป็นหมวด BOQ” ด้านล่าง':''}</p>`:'';
  return `<section class="card"><h2><span>งบประมาณเทียบค่าใช้จ่ายจริงรายหมวด</span><small>งบ = ค่าของ + ค่าแรงใน BOQ (ไม่รวมกำไร) · คาดการณ์ = ค่าที่มากกว่าระหว่างงบกับยอดผูกพัน · ค่าใช้จ่ายนอกงบ BOQ นับเฉพาะส่วนที่เกินงบคงเหลือ</small></h2>${warn}
  <div class="tw"><table><thead><tr><th>หมวดงาน</th><th class="r">งบต้นทุน</th><th class="r">PO วัสดุ</th><th class="r">ผู้รับเหมาช่วง</th><th class="r">ค่าใช้จ่ายอื่น</th><th class="r">ผูกพันรวม</th><th class="r">ใช้ไป %</th><th class="r">คงเหลือ</th><th class="r">จ่ายแล้ว</th><th class="r">คาดการณ์</th></tr></thead><tbody>
  ${L.length?IN.map(row).join('')+nbRows
   +`<tr class="tot"><td>รวม</td><td class="r">${fmt(T.bud)}</td><td class="r">${fmt(sum(L,r=>r.po))}</td><td class="r">${fmt(sum(L,r=>r.sub))}</td><td class="r">${fmt(sum(L,r=>r.exp))}</td><td class="r">${fmt(T.com)}</td><td class="r">${T.bud?fmt(T.com*100/T.bud,0)+'%':''}</td><td class="r">${fmt(T.bud-T.com)}</td><td class="r">${fmt(T.paid)}</td><td class="r">${fmt(T.fc)}</td></tr>`
   :'<tr><td colspan="10" class="empty">ยังไม่มี BOQ หรือค่าใช้จ่าย</td></tr>'}</tbody></table></div></section>`}
{const f=costSum;costSum=function(){const h=f.apply(this,arguments),i=h.indexOf('<section class="card"><h2><span>งบประมาณเทียบค่าใช้จ่ายจริงรายหมวด');
  return i<0?h+cbgTable():h.slice(0,i)+cbgTable()}}
document.addEventListener('change',e=>{const el=e.target;if(!el.classList||!el.classList.contains('cbg-map'))return;
  P.gmap=P.gmap||{};const g=el.dataset.g;if(el.value)P.gmap[g]=el.value;else delete P.gmap[g];save();render();
  toast(el.value?`นับค่าใช้จ่ายหมวด ${gName(g)} เป็นหมวด ${gName(el.value)} แล้ว`:'ยกเลิกการนับเป็นหมวด BOQ แล้ว')});
if(typeof SBKW==='object')SBKW['pj.cost.sum']=(SBKW['pj.cost.sum']||'')+' หมวด BOQ ไม่อยู่ในงบ นับเป็นหมวด คาดการณ์ นับซ้ำ';
