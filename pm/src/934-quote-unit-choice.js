/* ---------- 4.47 choose the unit of an item and keep the choice (user: "ส่วนตัวนี้ให้เราเลือกได้ว่าจะใส่หน่วยอะไร และทำการบันทึกไว้ ดีไหม") ----------
   The check (914) warned "ที่เคยเสนอใช้หน่วย Lot ไม่ใช่ ตัว" with only a [ใช้ Lot] button. Now the warning also offers
   [ใช้ “ตัว” ต่อไป], a list of other units, and [บันทึกลงคลังราคา]. The choice is kept per item name in co.qcU {u,m,l,by,at}:
   914 then compares this item against it instead of the price library or older quotations, so neither the unit nor the price
   warning comes back for that item in that unit, on this quotation or the next. Prices are compared only in the same unit. */
const qcuKey=d=>qcNorm(d);
const qcuGet=d=>{const k=qcuKey(d),M=CO().qcU;return k&&M&&M[k]||null};
const QCU_UNITS=['ตัว','ชุด','เครื่อง','อัน','จุด','ม.','ม้วน','เส้น','ท่อน','แผ่น','กล่อง','ตร.ม.','ลบ.ม.','กก.','ลิตร','Lot','งาน','เหมา','วัน','ครั้ง'];
// buttons for one line's warning; unit = 1 on the unit warning (with the list of units), ref = the other unit
const qcuBtns=(Q,i,unit,ref)=>{const u=String(i.unit||'').trim(),a=`data-id="${Q.id}" data-i="${i.id}"`,cost=n(i.m)+n(i.l);
  const us=[...new Set([u,ref,...QCU_UNITS].filter(Boolean))];
  return (unit&&u?`<button type="button" class="qc-fx" data-a="qcuKeep" ${a} title="จำไว้ว่ารายการนี้ใช้หน่วย ${esc(u)} คราวหน้าจะไม่เตือนอีก">ใช้ “${esc(u)}” ต่อไป</button>`:'')
    +(unit?`<select class="qc-us" ${a} aria-label="เลือกหน่วยแล้วจำไว้"><option value="">เลือกหน่วยอื่น…</option>${us.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select>`:'')
    +(!unit&&u&&cost?`<button type="button" class="qc-fx" data-a="qcuKeep" ${a} title="จำราคานี้ไว้เป็นราคาอ้างอิงของรายการนี้ คราวหน้าจะไม่เตือนอีก">ราคานี้ถูกแล้ว</button>`:'')
    +(u&&cost?`<button type="button" class="qc-fx" data-a="qcuLib" ${a} title="ใส่หน่วย ${esc(u)} และทุน ${fmt(cost,2)} ลงคลังราคากลาง">บันทึกลงคลังราคา</button>`:'')};
const qcuLine=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),i=Q&&Q.items.find(x=>x.id===b.dataset.i);return i?{Q,i}:null};
function qcuKeep(i){const k=qcuKey(i.desc);if(!k)return false;const C=CO();if(!C.qcU||typeof C.qcU!=='object')C.qcU={};
  const u=typeof me==='function'&&me();C.qcU[k]={u:String(i.unit||'').trim(),m:n(i.m),l:n(i.l),by:u?u.name:'',at:today()};return true}
ACT.qcuKeep=b=>{const L=qcuLine(b);if(!L||!qcuKeep(L.i))return;save();render();toast(`จำไว้แล้ว “${String(L.i.desc).trim()}” ใช้หน่วย ${L.i.unit} จะไม่เตือนอีก`)};
// the price library row of the same name gets this unit and cost; a new row when there is none
ACT.qcuLib=b=>{const L=qcuLine(b);if(!L)return;const i=L.i,name=String(i.desc||'').trim(),P=plCfg(),k=qcuKey(name);let x=P.find(r=>qcuKey(r.name)===k);
  if(x){if(!confirm(`แก้คลังราคา “${x.name}” จาก ${x.unit||'-'} ${fmt(n(x.m)+n(x.l),2)} เป็น ${i.unit} ${fmt(n(i.m)+n(i.l),2)} บาท?`))return;x.unit=String(i.unit||'').trim();x.m=n(i.m);x.l=n(i.l);x.date=today();x.src='แก้จากใบเสนอราคา'}
  else{x={id:uid(),g:typeof PL_GS==='function'&&PL_GS().includes(i.g)?i.g:'oth',name,unit:String(i.unit||'').trim(),m:n(i.m),l:n(i.l),src:'จากใบเสนอราคา '+(L.Q.no||''),sk:'hand',date:today()};P.unshift(x)}
  qcuKeep(i);save();render();toast(`บันทึกลงคลังราคาแล้ว: ${name} · ${x.unit} · ${fmt(n(x.m)+n(x.l),2)} บาท`)};
document.addEventListener('change',e=>{const s=e.target;if(!s||!s.classList||!s.classList.contains('qc-us')||!s.value)return;e.stopPropagation();const L=qcuLine(s);if(!L)return;
  const p=`co.quotes.${L.Q.id}.items.${L.i.id}.unit`;setPath(p,s.value);HOOK.forEach(f=>f(p,s.value));qcuKeep(L.i);save();render();toast(`ใช้หน่วย ${s.value} และจำไว้แล้ว`)},true);
document.head.insertAdjacentHTML('beforeend',`<style>.qc-us{font:inherit;font-size:11px;padding:1px 6px;border-radius:10px;border:1px solid currentColor;background:transparent;color:inherit;width:auto!important;max-width:150px;margin-left:4px}.qc-ws .qc-fx+.qc-fx{margin-left:4px}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'เลือกหน่วยอื่น…':'Other unit…','ราคานี้ถูกแล้ว':'This price is right','บันทึกลงคลังราคา':'Save to price library'});
