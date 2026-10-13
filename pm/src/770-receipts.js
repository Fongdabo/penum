/* ---------- 3.30 รับเงินบางส่วน: a client may pay a bill in several parts ----------
   Each bill keeps b.rcpts [{id,date,amt,note}]. Once the parts reach the net amount the bill becomes "รับเงินแล้ว"
   with the last receipt's date; until then it shows what is still owed. */
function billSync(b){const r=b.rcpts||[];if(!r.length)return;const net=billCalc(b).net,got=sum(r,x=>n(x.amt));
  if(got>=net-0.005&&got>0){if(b.status!=='paid')b.stPrev=b.status;b.status='paid';b.paid=r.map(x=>x.date).filter(okD).sort().pop()||today()}
  else if(b.status==='paid'){b.status=b.stPrev&&b.stPrev!=='paid'?b.stPrev:'ok';b.paid=''}}
HOOK.push((p,v)=>{const m=p.match(/^bills\.([^.]+)\.(rcpts\.|status$)/);if(!m)return;const b=P.bills.find(x=>x.id===m[1]);if(!b)return;
  // choosing "รับเงินแล้ว" while part of it is still owed records the rest as received today
  if(m[2]==='status'){if(v==='paid'&&(b.rcpts||[]).length){const out=billCalc(b).net-sum(b.rcpts,x=>n(x.amt));if(out>0.005)b.rcpts.push({id:uid(),date:today(),amt:Math.round(out*100)/100,note:'รับส่วนที่เหลือ'})}return}
  billSync(b)});
ACT.rcAdd=b=>{const x=P.bills.find(y=>y.id===b.dataset.id);if(!x)return;const net=billCalc(x).net;
  if(!x.rcpts||!x.rcpts.length)x.rcpts=x.status==='paid'?[{id:uid(),date:x.paid||x.date,amt:Math.round(net*100)/100,note:''}]:[];
  const out=Math.max(0,net-sum(x.rcpts,r=>n(r.amt)));if(out>0.005||!x.rcpts.length)x.rcpts.push({id:uid(),date:today(),amt:Math.round(out*100)/100,note:''});billSync(x);save();render()};
ACT.rcDel=b=>{const x=P.bills.find(y=>y.id===b.dataset.id);if(!x)return;x.rcpts=(x.rcpts||[]).filter(r=>r.id!==b.dataset.k);if(!x.rcpts.length){delete x.rcpts;if(x.status==='paid'){x.status=x.stPrev||'ok';x.paid=''}}else billSync(x);save();render()};
function rcCard(sel){const c=billCalc(sel),R=sel.rcpts||[],got=billRecv(sel),out=c.net-got,b=`bills.${sel.id}`;
  return `<section class="card" id="rcCard"><h2><span>การรับเงิน ${esc(sel.no)}</span><small>ลูกค้าจ่ายไม่ครบ ให้บันทึกทีละครั้งที่ได้รับ ครบเมื่อไรสถานะจะเป็น “รับเงินแล้ว” เอง</small><span class="sp"></span>
    ${out>0.005||!R.length?`<button type="button" class="btn sm pri" data-a="rcAdd" data-id="${sel.id}" data-go="1">${R.length?'+ บันทึกรับเงิน':out>0.005?'+ บันทึกรับเงิน':'แก้ยอดที่ได้รับจริง'}</button>`:''}</h2>
  <dl class="stats" style="margin-bottom:10px"><div><dt>ยอดรับสุทธิตามใบเบิก</dt><dd>${fmt(c.net,2)}</dd></div><div><dt>รับแล้ว</dt><dd style="color:var(--good)">${fmt(got,2)}</dd>${c.net?`<div class="bar"><i style="width:${Math.min(100,got*100/c.net)}%;background:var(--good)"></i></div>`:''}</div>
    <div><dt>ค้างรับ</dt><dd style="color:${out>0.005?'var(--danger)':'var(--good)'}">${out>0.005?fmt(out,2):'ครบแล้ว'}</dd></div></dl>
  ${R.length?`<div class="tw"><table><thead><tr><th>ครั้งที่</th><th>วันที่รับ</th><th class="r">จำนวนเงิน</th><th>หมายเหตุ (เช่น เลขที่เช็ค โอนเข้าบัญชี)</th><th>สลิป / หลักฐาน</th><th></th></tr></thead><tbody>
    ${R.map((r,i)=>`<tr><td>${i+1}</td><td><input type="date" data-p="${b}.rcpts.${r.id}.date" value="${esc(r.date||'')}" aria-label="วันที่รับ"></td><td><input class="r" data-t="num" inputmode="decimal" data-p="${b}.rcpts.${r.id}.amt" value="${n(r.amt)}" aria-label="จำนวนเงิน" style="width:130px"></td><td><input data-p="${b}.rcpts.${r.id}.note" value="${esc(r.note||'')}" aria-label="หมายเหตุ"></td><td><div class="rc-sl">${(r.photos||[]).map(k=>`<figure><img data-ph="${k}" alt="สลิปครั้งที่ ${i+1}"><button type="button" class="x" data-a="photoDel" data-c="${b}.rcpts.${r.id}" data-k="${k}" aria-label="ลบสลิป">✕</button></figure>`).join('')}<button type="button" class="btn sm" data-a="photoAdd" data-c="${b}.rcpts.${r.id}">📎 แนบสลิป</button></div></td><td><button type="button" class="x" data-a="rcDel" data-id="${sel.id}" data-k="${r.id}" aria-label="ลบ">✕</button></td></tr>`).join('')}
    </tbody></table></div>`:`<p class="hint">${sel.status==='paid'?`รับเงินครบแล้วเมื่อ ${thD(sel.paid)} ถ้าจริง ๆ ได้ไม่ครบ กด “แก้ยอดที่ได้รับจริง” แล้วใส่ยอดที่ได้`:'ยังไม่มีการรับเงิน กด “+ บันทึกรับเงิน” เมื่อลูกค้าจ่าย ใส่ยอดที่ได้จริงได้ ไม่ต้องครบ'}</p>`}
  </section>`}
function rcIns(h,sel){const pb=h.indexOf(`data-a="print" data-k="bill" data-id="${sel.id}"`),end=pb<0?-1:h.indexOf('</section>',pb);return end<0?h+rcCard(sel):h.slice(0,end+10)+rcCard(sel)+h.slice(end+10)}
{const f=VIEWS.cost;VIEWS.cost=()=>{let h=f();if((S.sub.cost||'sum')!=='bill')return h;
  // bills paid in part show it in the list
  P.bills.forEach(b=>{if(b.status==='paid'||b.status==='draft')return;const got=billRecv(b);if(got<=0.005)return;const k=h.indexOf(`data-k="bill" data-id="${b.id}"`);if(k<0)return;
    const a=h.indexOf('<span class="pill',k),e=a<0?-1:h.indexOf('</span>',a);if(a<0||e<0)return;h=h.slice(0,a)+`<span class="pill warn" title="รับแล้ว ${fmt(got,2)}">รับบางส่วน · ค้าง ${fmt(billCalc(b).net-got)}</span>`+h.slice(e+7)});
  const sel=P.bills.find(x=>x.id===S.sel.bill);if(!sel)return h;
  // right under the bill's own details (above ชุดเอกสารส่งงวด), so the amount box is where people look
  const pb=h.indexOf(`data-a="print" data-k="bill" data-id="${sel.id}"`),end=pb<0?-1:h.indexOf('</section>',pb);
  // a short line inside the bill itself: what came in, what is still owed, and a button that jumps to the receipts
  const got=billRecv(sel),net=billCalc(sel).net,ds=pb<0?-1:h.indexOf('<dl class="stats"',pb);
  if(ds>0&&ds<end){const strip=`<div class="rc-strip"><b>การรับเงิน</b><span>รับแล้ว <b style="color:var(--good)">${fmt(got,2)}</b></span><span>ค้างรับ <b style="color:${net-got>0.005?'var(--danger)':'var(--good)'}">${net-got>0.005?fmt(net-got,2):'ครบแล้ว'}</b></span><span class="sp" style="flex:1"></span>${net-got>0.005?`<button type="button" class="btn sm pri" data-a="rcAdd" data-id="${sel.id}" data-go="1">+ บันทึกรับเงิน (กรณีได้ไม่ครบใส่ยอดจริง)</button>`:''}<button type="button" class="btn sm" data-a="rcGo">ดูการรับเงิน / แนบสลิป ↓</button></div>`;
    h=h.slice(0,ds)+strip+h.slice(ds);return rcIns(h,sel)}
  if(end<0)return h+rcCard(sel);return h.slice(0,end+10)+rcCard(sel)+h.slice(end+10)}}
Object.assign(SBKW,{'pj.cost.bill':(SBKW['pj.cost.bill']||'')+' รับเงิน รับบางส่วน จ่ายไม่ครบ ค้างรับ ผ่อน ชำระ'});
{const f=ACT.arPaid;ACT.arPaid=b=>{const p=DB.projects[b.dataset.p],x=p&&p.bills.find(y=>y.id===b.dataset.id);if(x&&(x.rcpts||[]).length){const out=withP(p,()=>billCalc(x).net)-sum(x.rcpts,r=>n(r.amt));if(out>0.005)x.rcpts.push({id:uid(),date:today(),amt:Math.round(out*100)/100,note:'รับส่วนที่เหลือ'})}f(b)}}
document.head.insertAdjacentHTML('beforeend',`<style>.rc-sl{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.rc-sl figure{position:relative;margin:0}.rc-sl img{width:52px;height:52px;object-fit:cover;border-radius:6px;border:1px solid var(--line);cursor:zoom-in;display:block}.rc-sl figure .x{position:absolute;top:-6px;right:-6px;background:var(--surface);border-radius:50%;width:18px;height:18px;font-size:10px;padding:0}</style>`);
Object.assign(SBKW,{'pj.cost.bill':(SBKW['pj.cost.bill']||'')+' สลิป หลักฐานการโอน slip'});
// choosing a bill opens its details further down the page: bring them into view so the click visibly does something
function billFocus(){requestAnimationFrame(()=>{const id=S.sel.bill,e=id&&document.querySelector(`#view [data-a="print"][data-k="bill"][data-id="${id}"]`),sec=e&&e.closest('section');if(!sec)return;
  const hb=document.querySelector('header.band'),hs=hb&&getComputedStyle(hb).position,top=hb&&(hs==='sticky'||hs==='fixed')?hb.getBoundingClientRect().height+parseFloat(getComputedStyle(hb).top||0):0;
  window.scrollTo({top:window.scrollY+sec.getBoundingClientRect().top-top-12,behavior:'smooth'});sec.classList.add('flash');setTimeout(()=>sec.classList.remove('flash'),1600)})}
{const f=ACT.sel;ACT.sel=b=>{const r=f(b);if(b&&b.dataset&&b.dataset.k==='bill'&&S.mode==='pj'&&S.tab==='cost')billFocus();return r}}
{const f=ACT.add;ACT.add=b=>{const r=f(b);if(b&&b.dataset&&b.dataset.c==='bills'&&S.tab==='cost')billFocus();return r}}
document.head.insertAdjacentHTML('beforeend',`<style>#view section.flash{box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 55%,transparent);transition:box-shadow .3s}</style>`);
ACT.rcGo=()=>requestAnimationFrame(()=>{const c=$('#rcCard');if(!c)return;const hb=document.querySelector('header.band'),hs=hb&&getComputedStyle(hb).position,top=hb&&(hs==='sticky'||hs==='fixed')?hb.getBoundingClientRect().height+parseFloat(getComputedStyle(hb).top||0):0;
  window.scrollTo({top:window.scrollY+c.getBoundingClientRect().top-top-12,behavior:'smooth'});c.classList.add('flash');setTimeout(()=>c.classList.remove('flash'),1600);const a=c.querySelectorAll('input[data-p$=".amt"]');if(a.length)setTimeout(()=>{a[a.length-1].focus();a[a.length-1].select()},500)});
{const f=ACT.rcAdd;ACT.rcAdd=b=>{f(b);if(b.dataset.go)ACT.rcGo()}}
document.head.insertAdjacentHTML('beforeend',`<style>.rc-strip{display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:10px 14px;margin:0 0 12px;border:1px dashed var(--line);border-radius:10px;background:color-mix(in srgb,var(--good) 6%,transparent)}</style>`);

/* ---------- 3.31 วันที่รับเงินยึดตามสลิป ----------
   Attaching a slip asks for the transfer date and amount printed on it (pre-filled from the slip file's own date),
   and that date becomes the receipt date, so the bill's "รับเงินแล้ว" date follows the slip, not the day it was typed in. */
const rcOf=c=>{const m=(c||'').match(/^bills\.([^.]+)\.rcpts\.([^.]+)$/);if(!m)return null;const b=P.bills.find(x=>x.id===m[1]),r=b&&(b.rcpts||[]).find(x=>x.id===m[2]);return r?{b,r}:null};
function slipDlg(c,key,guess){const o=rcOf(c);if(!o)return;const {b,r}=o,i=b.rcpts.indexOf(r)+1,src=phCache[key]||'',d=okD(guess)&&guess<=today()?guess:r.date;
  dialog(`สลิปการรับเงินครั้งที่ ${i} · ${esc(b.no)}`,`<div class="slip-dg">${src?`<img src="${src}" alt="สลิป">`:''}<div>
    <p class="hint">ดูวันที่และยอดบนสลิป แล้วใส่ให้ตรง ระบบจะใช้วันที่นี้เป็นวันที่รับเงิน</p>
    <label>วันที่โอนตามสลิป<input type="date" id="slD" value="${esc(d||'')}"></label>${d&&d!==r.date?`<small class="hint">วันที่ของไฟล์สลิป (เดิมบันทึกไว้ ${thD(r.date)})</small>`:''}
    <label>ยอดเงินตามสลิป<input id="slA" class="r" inputmode="decimal" value="${n(r.amt)}"></label>
    <label>เลขที่อ้างอิง / ธนาคาร (ถ้ามี)<input id="slN" value="${esc(r.note||'')}"></label></div></div>`,
    `<button type="button" class="btn pri" data-a="slipOk" data-c="${c}">ใช้วันที่ตามสลิป</button>${src?`<a class="btn" href="${src}" download="slip-${key}.jpg">ดาวน์โหลด</a>`:''}`);
  setTimeout(()=>{const x=$('#slD');x&&x.focus()},50)}
ACT.slipOk=bt=>{const o=rcOf(bt.dataset.c);if(!o)return;const {b,r}=o,d=$('#slD').value,a=parseFloat(String($('#slA').value).replace(/,/g,''));
  if(!okD(d)){toast('ใส่วันที่ตามสลิปก่อน');return}r.date=d;r.slipD=1;if(isFinite(a)&&a>0)r.amt=Math.round(a*100)/100;r.note=$('#slN').value;
  b.paid='';billSync(b);$('#dlg').close();save();render();toast(`วันที่รับเงิน ${thD(d)} ตามสลิป`)};
// attaching to a receipt: keep the slip file's own date (a saved bank slip carries the time of the transfer) and confirm it
{const f=ACT.photoAdd;ACT.photoAdd=bt=>{const c=bt.dataset.c;if(!rcOf(c))return f(bt);const r=resolve(c),fi=$('#fileIn');fi.accept='image/*';fi.multiple=false;
  fi.onchange=async()=>{const file=fi.files[0];fi.value='';if(!file)return;let key;try{const d=await shrink(file);key='ph-'+uid();await IDB.put(key,d);phCache[key]=d;(r.photos=r.photos||[]).push(key)}catch(e){toast('เพิ่มรูปไม่ได้');return}
    save();render();slipDlg(c,key,file.lastModified?iso(new Date(file.lastModified)):'')};fi.click()}}
// tap a slip: see it full size and set the date from it
document.addEventListener('click',e=>{const im=e.target.closest&&e.target.closest('.rc-sl img[data-ph]');if(!im)return;const bt=im.closest('figure').querySelector('[data-c]');slipDlg(bt&&bt.dataset.c,im.dataset.ph,'')});
// rows show whether the date came from the slip
{const f=rcCard;rcCard=sel=>{let h=f(sel).replace('<th>วันที่รับ</th>','<th>วันที่รับ (ตามสลิป)</th>');
  (sel.rcpts||[]).forEach(r=>{const k=`data-p="bills.${sel.id}.rcpts.${r.id}.date"`,a=h.indexOf(k),e=a<0?-1:h.indexOf('</td>',a);if(e<0)return;
    const tag=r.slipD?'<small class="sl-ok">✓ ตามสลิป</small>':(r.photos||[]).length?`<button type="button" class="btn sm sl-chk" data-a="slipChk" data-c="bills.${sel.id}.rcpts.${r.id}">ใส่วันที่ตามสลิป</button>`:'';h=h.slice(0,e)+tag+h.slice(e)});return h}}
ACT.slipChk=bt=>{const o=rcOf(bt.dataset.c);if(o)slipDlg(bt.dataset.c,(o.r.photos||[])[0],'')};
// typing a different date by hand means it no longer comes from the slip
HOOK.push(p=>{const m=p.match(/^bills\.([^.]+)\.rcpts\.([^.]+)\.date$/);if(!m)return;const o=rcOf(`bills.${m[1]}.rcpts.${m[2]}`);if(o)delete o.r.slipD});
document.head.insertAdjacentHTML('beforeend',`<style>.slip-dg{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,1fr);gap:16px;align-items:start}.slip-dg img{max-width:100%;max-height:62vh;display:block;margin:auto;border-radius:8px;border:1px solid var(--line)}.slip-dg label{display:flex;flex-direction:column;gap:4px;margin:10px 0;font-weight:600}@media(max-width:640px){.slip-dg{grid-template-columns:1fr}}
.sl-ok{display:block;color:var(--good);font-size:11px;margin-top:2px}.sl-chk{display:block;margin-top:4px;font-size:11px;padding:2px 8px}</style>`);
Object.assign(SBKW,{'pj.cost.bill':(SBKW['pj.cost.bill']||'')+' วันที่โอน วันที่ตามสลิป'});

/* ---------- 3.32 โครงการชื่อซ้ำ ----------
   Two projects with the same name looked identical in the project list. Now each one says what tells it apart
   (its quote number, how much is in it, or that it is empty), and the project page offers to merge the other one in. */
const pjKey=s=>String(s||'').normalize('NFC').replace(/\s+/g,' ').trim().toLowerCase(),pjDup=p=>Object.values(DB.projects).filter(x=>x.id!==p.id&&pjKey(x.name)===pjKey(p.name));
function pjTag(p){const q=(CO().quotes||[]).find(x=>x.pj===p.id),bits=[];if(q)bits.push(q.no);
  if(pjEmpty(p))bits.push('ว่าง');else{if(p.boq.items.length)bits.push(`BOQ ${p.boq.items.length}`);if(p.bills.length)bits.push(`เบิก ${p.bills.length}`);if(p.tasks.length)bits.push(`แผน ${p.tasks.length}`)}
  if(!q&&p.created)bits.push('สร้าง '+thD(p.created));return bits.join(' · ')}
function pjLabels(){['sbProj','projSel'].forEach(i=>{const s=document.getElementById(i);if(!s)return;
  [...s.options].forEach(o=>{const p=DB.projects[o.value];if(p&&pjDup(p).length)o.textContent=`${p.name} (${pjTag(p)})`})})}
// on every other project page a short bar keeps the clash visible, with the rename button right there
function dupBar(){if(S.mode!=='pj'||['dash','setup'].includes(S.tab)||!pjDup(P).length)return;const v=$('#view');if(!v||v.querySelector('.pj-dupbar'))return;
  v.insertAdjacentHTML('afterbegin',`<div class="pj-dupbar"><span>มีโครงการชื่อ “${esc(P.name)}” ซ้ำกัน ${pjDup(P).length+1} โครงการ · ที่เปิดอยู่: <b>${esc(pjTag(P))}</b></span><span class="sp" style="flex:1"></span><button type="button" class="btn sm pri" data-a="pjRenDlg">คนละงาน → ตั้งชื่อแยก</button><button type="button" class="btn sm" data-a="go" data-m="pj" data-k="dash">งานเดียวกัน → รวม</button></div>`)}
{const r=render;render=function(){const x=r.apply(this,arguments);try{pjLabels();dupBar()}catch(e){}return x}}
{const f=sbDraw;sbDraw=function(){const x=f.apply(this,arguments);try{pjLabels()}catch(e){}return x}}
// merge another project into this one: lists are joined by id, empty fields filled, links from the company side moved over
function pjMerge(T,F){for(const k in F){const a=F[k],b=T[k];
    if(k==='id'||k==='name'||k==='created')continue;
    if(k==='info'){for(const j in a)if(b[j]==null||b[j]===''||(j==='cv'&&!n(b[j])))b[j]=a[j];continue}
    if(k==='boq'){if(!b.items.length&&a.items.length)T.boq=a;continue}
    if(Array.isArray(a)){if(!Array.isArray(b)){T[k]=a;continue}if(k==='inst'&&b.length)continue;const ids=new Set(b.map(x=>x&&x.id));a.forEach(x=>{if(!x||!ids.has(x.id))b.push(x)});continue}
    if(a&&typeof a==='object'){T[k]=Object.assign({},a,b||{});continue}
    if(b==null||b==='')T[k]=a}
  const swap=o=>{if(Array.isArray(o)){o.forEach((v,i)=>{if(v===F.id)o[i]=T.id;else if(v&&typeof v==='object')swap(v)})}else if(o&&typeof o==='object')for(const k in o){if(o[k]===F.id)o[k]=T.id;else if(o[k]&&typeof o[k]==='object')swap(o[k])}};
  swap(DB.co);delete DB.projects[F.id]}
ACT.pjMerge=async b=>{const F=DB.projects[b.dataset.id];if(!F||F.id===P.id)return;
  if(!confirm(`รวมโครงการ “${F.name}” (${pjTag(F)}) เข้ากับโครงการนี้ (${pjTag(P)})?\n\nข้อมูลทั้งสองฝั่งจะรวมกันอยู่ในโครงการนี้ แล้วโครงการที่ซ้ำจะหายจากรายการ\nตกลง แล้วระบบจะถามให้ดาวน์โหลดไฟล์สำรองก่อน`))return;
  if(confirm('ดาวน์โหลดไฟล์สำรองเก็บไว้ก่อนรวมไหม (แนะนำ)\n\nตกลง = ดาวน์โหลดแล้วรวม\nยกเลิก = รวมเลยไม่สำรอง'))await ACT.backup();
  const nm=pjTag(F);pjMerge(P,F);S.sel={};save();render();toast(`รวมโครงการแล้ว (${nm})`)};
ACT.pjGoto=b=>{if(!DB.projects[b.dataset.id])return;DB.cur=b.dataset.id;P=DB.projects[DB.cur];S.sel={};save();render()};
function dupCard(){const D=pjDup(P);if(!D.length)return '';
  return `<section class="card pj-dup"><h2><span>มีโครงการชื่อเดียวกันอีก ${D.length} โครงการ</span><small>ถ้าเป็นงานเดียวกัน กด “รวมเข้าโครงการนี้” ข้อมูลจะมาอยู่ที่นี่ที่เดียว · ถ้าเป็นคนละงาน กด “คนละงาน → ตั้งชื่อแยก”</small></h2>
  <p style="margin:0 0 8px">โครงการนี้: <b>${esc(P.name)}</b> <span class="pill">${esc(pjTag(P))}</span></p>
  ${D.map(p=>`<div class="row" style="gap:10px;align-items:center;margin:6px 0;flex-wrap:wrap"><b>${esc(p.name)}</b><span class="pill">${esc(pjTag(p))}</span><span class="sp" style="flex:1"></span><button type="button" class="btn sm" data-a="pjGoto" data-id="${p.id}">ไปดูโครงการนั้น</button><button type="button" class="btn sm" data-a="pjRenDlg">คนละงาน → ตั้งชื่อแยก</button><button type="button" class="btn sm pri" data-a="pjMerge" data-id="${p.id}">รวมเข้าโครงการนี้</button></div>`).join('')}</section>`}
{const f=VIEWS.dash;VIEWS.dash=()=>dupCard()+f()}
{const f=VIEWS.setup;VIEWS.setup=()=>dupCard()+f()}
document.head.insertAdjacentHTML('beforeend',`<style>.pj-dup{border-left:4px solid var(--warn,#f59e0b)}.pj-dupbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 12px;padding:10px 14px;border-radius:12px;border:1px solid var(--line);border-left:4px solid var(--warn,#f59e0b);background:var(--surface);font-size:14px}</style>`);
Object.assign(SBKW,{'pj.setup':(SBKW['pj.setup']||'')+' โครงการซ้ำ รวมโครงการ ชื่อซ้ำ merge'});

// different jobs at the same place: give each its own name, suggested from its quote (scope) or number
function pjSug(p,i){const q=(CO().quotes||[]).find(x=>x.pj===p.id),b=(p.name||'').trim(),t=q&&pjName(q.title||'');return `${b} - ${t&&t!==b&&!b.includes(t)?t:q?q.no:'งานที่ '+(i+1)}`}
ACT.pjRenDlg=()=>{const L=[P,...pjDup(P)];
  dialog('ตั้งชื่อแยกงาน',`<p class="hint">ชื่อลูกค้าและสถานที่ยังเหมือนเดิม เปลี่ยนแค่ชื่อที่ใช้เลือกโครงการ เช่น ใส่ระบบงานหรือเฟสต่อท้าย</p>${L.map((p,i)=>`<label style="display:flex;flex-direction:column;gap:4px;margin:10px 0"><span>${p.id===P.id?'โครงการนี้':'อีกโครงการ'} <small class="muted">(${esc(pjTag(p))})</small></span><input data-ren="${p.id}" value="${esc(pjSug(p,i))}"></label>`).join('')}`,
    `<button type="button" class="btn pri" data-a="pjRenGo">บันทึกชื่อ</button>`)};
ACT.pjRenGo=()=>{const I=[...document.querySelectorAll('#dlg input[data-ren]')],v=I.map(x=>x.value.trim());
  if(v.some(x=>!x)){toast('ใส่ชื่อให้ครบ');return}if(new Set(v).size<v.length){toast('ชื่อยังซ้ำกันอยู่');return}
  I.forEach((x,i)=>{const p=DB.projects[x.dataset.ren];if(p)p.name=v[i]});$('#dlg').close();save();render();toast('ตั้งชื่อแยกงานแล้ว')};
// a won quote whose project name is already taken gets its scope or number added, so the list never shows two identical names
{const f=ACT.qWon;ACT.qWon=b=>{f(b);const Q=CO().quotes.find(q=>q.id===b.dataset.id),p=Q&&DB.projects[Q.pj];if(p&&pjDup(p).length){p.name=pjSug(p,1);save();render()}}}

/* ---------- 3.33 เครดิตรับเงิน: the client pays N days after the bill date ----------
   Set once per project (default = the customer's credit, else 30 days) and change on a single bill when needed.
   Each bill then shows its due date, how many days are left or how late it is; cash flow, AR and the plan use the same date. */
const crSet=v=>v!=null&&String(v).trim()!=='';
function pjCredit(p){if(crSet(p.info.credit))return n(p.info.credit);const c=CO().customers.find(x=>x.id===p.info.cust);return c&&crSet(c.credit)?n(c.credit):30}
billDue=function(p,b){return addD(b.date,crSet(b.credit)?n(b.credit):pjCredit(p))};
function dueCell(b){if(b.status==='draft'||!okD(b.date))return '<span class="muted">–</span>';const d=billDue(P,b),td=today();
  if(b.status==='paid'){const pd0=b.paid||d,late=diffD(d,pd0);return `${thD(d)}${late>0?` <small style="color:var(--danger)">รับช้า ${late} วัน</small>`:''}`}
  const left=diffD(td,d);return left<0?`${thD(d)} <span class="pill bad">เลยกำหนด ${-left} วัน</span>`:`${thD(d)} <small class="muted">${left?`อีก ${left} วัน`:'วันนี้'}</small>`}
{const f=VIEWS.cost;VIEWS.cost=()=>{let h=f();if((S.sub.cost||'sum')!=='bill')return h;const I=P.info,cr=pjCredit(P);
  // project setting next to VAT / หัก ณ ที่จ่าย
  h=h.replace(/(<label>หัก ณ ที่จ่าย \(%\)<input data-t="num" data-p="info\.wht"[^>]*><\/label>)/,`$1<label>เครดิตรับเงิน (วัน นับจากวันเบิก)<input inputmode="numeric" data-p="info.credit" value="${crSet(I.credit)?esc(I.credit):''}" placeholder="${cr}" aria-label="เครดิตรับเงิน"></label>`);
  // list: a due-date column
  h=h.replace(/(<table class="bl-list"><thead><tr>[\s\S]*?)<th>สถานะ<\/th>/,'$1<th>ครบกำหนดรับเงิน</th><th>สถานะ</th>').replace('<td colspan="12" class="empty">ยังไม่มีใบเบิกงวด','<td colspan="13" class="empty">ยังไม่มีใบเบิกงวด');
  P.bills.forEach(b=>{const k=h.indexOf(`data-a="sel" data-k="bill" data-id="${b.id}"`);if(k<0)return;const a=h.indexOf('<td><span class="pill',k);if(a<0)return;h=h.slice(0,a)+`<td class="due">${dueCell(b)}</td>`+h.slice(a)});
  // bill form: its own credit (blank = project's) and the due date
  const sel=P.bills.find(x=>x.id===S.sel.bill)||billsSorted().slice(-1)[0];
  if(sel){const re=new RegExp(`(<label>วันที่<input type="date" data-p="bills\\.${sel.id}\\.date"[^>]*><\\/label>)`);
    h=h.replace(re,`$1<label>เครดิต (วัน)<input inputmode="numeric" data-p="bills.${sel.id}.credit" value="${crSet(sel.credit)?esc(sel.credit):''}" placeholder="${cr} ตามโครงการ" aria-label="เครดิตของใบนี้"></label><label>ครบกำหนดรับเงิน<span class="due-v">${dueCell(sel)}</span></label>`)}
  return h}}
document.head.insertAdjacentHTML('beforeend',`<style>.bl-list td.due{white-space:nowrap;font-size:13px}.due-v{display:flex;align-items:center;gap:6px;min-height:38px;font-weight:600}</style>`);
Object.assign(SBKW,{'pj.cost.bill':(SBKW['pj.cost.bill']||'')+' เครดิต ครบกำหนด รอบจ่าย 30 วัน credit due'});

/* ---------- 3.34 ใบเบิกงวด: sort the list by เลขที่ or วันที่, up or down ----------
   Display only: the billing maths still runs in date order. Default = by number, oldest first; the choice is remembered on this device. */
let BLS=(()=>{try{return JSON.parse(localStorage.getItem('pmBlSort'+DSFX))||{k:'no',d:1}}catch(e){return {k:'no',d:1}}})();
ACT.blSort=b=>{const k=b.dataset.k;BLS=BLS.k===k?{k,d:-BLS.d}:{k,d:1};try{localStorage.setItem('pmBlSort'+DSFX,JSON.stringify(BLS))}catch(e){}render()};
{const f=VIEWS.cost;VIEWS.cost=()=>{let h=f();if((S.sub.cost||'sum')!=='bill')return h;const a=h.indexOf('<table class="bl-list">');if(a<0)return h;
  const th=(k,l)=>`<th class="bl-s${BLS.k===k?' on':''}"><button type="button" data-a="blSort" data-k="${k}" title="กดเพื่อเรียงขึ้น / ลง">${l} <i>${BLS.k===k?(BLS.d>0?'▲':'▼'):'↕'}</i></button></th>`;
  const hd=h.indexOf('</thead>',a);h=h.slice(0,a)+h.slice(a,hd).replace('<th>เลขที่</th>',th('no','เลขที่')).replace('<th>วันที่</th>',th('date','วันที่'))+h.slice(hd);
  const tb=h.indexOf('<tbody>',a)+7,te=h.indexOf('</tbody>',tb);const rows=h.slice(tb,te).match(/<tr[\s\S]*?<\/tr>/g);if(!rows||rows.length<2)return h;
  const B=r=>{const m=r.match(/data-k="bill" data-id="([^"]+)"/);return m&&P.bills.find(x=>x.id===m[1])};
  const cmp=(x,y)=>{const a=B(x),b=B(y);if(!a||!b)return 0;const no=String(a.no).localeCompare(String(b.no),undefined,{numeric:true}),dt=(a.date||'').localeCompare(b.date||'');return BLS.d*(BLS.k==='date'?dt||no:no||dt)};
  return h.slice(0,tb)+rows.sort(cmp).join('')+h.slice(te)}}
document.head.insertAdjacentHTML('beforeend',`<style>.bl-list th.bl-s button{all:unset;cursor:pointer;font:inherit;color:inherit;display:inline-flex;gap:4px;align-items:center;padding:2px 4px;margin:-2px -4px;border-radius:6px}.bl-list th.bl-s button:hover,.bl-list th.bl-s button:focus-visible{background:var(--sunk,rgba(127,127,127,.15))}.bl-list th.bl-s i{font-style:normal;font-size:10px;opacity:.55}.bl-list th.bl-s.on i{opacity:1;color:var(--accent)}</style>`);
Object.assign(SBKW,{'pj.cost.bill':(SBKW['pj.cost.bill']||'')+' เรียง เลขที่ sort'});

/* ---------- 3.35 เงินประกันผลงาน: deduct on every instalment, or all at once on the last one ----------
   P.info.retMode: '' = every bill (as before), 'last' = nothing held on the way, the whole retention on the final bill.
   The final bill is found by itself (last instalment in % mode, 100% done in quantity mode); a bill can be set by hand. */
function retIsLast(b){if(b.retAll==='y')return true;if(b.retAll==='n')return false;const L=P.inst||[];
  if(P.info.billMode==='pct')return !!(L.length&&b.inst&&b.inst===L[L.length-1].id);return billCalc0(b).cum>=99.5}
const billCalc0=billCalc;
billCalc=function(b){const r=billCalc0(b);if(P.info.retMode!=='last'||(b.kind||'prog')!=='prog'||!r.ret&&!n(P.info.ret))return r;
  const prog=billsSorted().filter(x=>(x.kind||'prog')==='prog'),i=prog.indexOf(b);let ret=0;
  if(retIsLast(b)){const before=prog.slice(0,i),cumAmt=sum(before,x=>billCalc0(x).amt)+r.amt,held=sum(before,x=>billCalc(x).ret);ret=Math.max(0,cumAmt*n(P.info.ret)/100-held)}
  return Object.assign({},r,{ret,net:r.base+r.vat-r.wht-ret,retLast:ret>0})};
{const f=VIEWS.cost;VIEWS.cost=()=>{let h=f();if((S.sub.cost||'sum')!=='bill')return h;const I=P.info,last=I.retMode==='last';
  h=h.replace(/(<label>หักประกันผลงาน \(%\)<input data-t="num" data-p="info\.ret"[^>]*><\/label>)/,`$1<label>หักเงินประกันผลงานเมื่อไร<select data-p="info.retMode"><option value=""${last?'':' selected'}>หักทุกงวด</option><option value="last"${last?' selected':''}>หักครั้งเดียวในงวดสุดท้าย</option></select></label>`);
  const sel=P.bills.find(x=>x.id===S.sel.bill)||billsSorted().slice(-1)[0];
  if(last&&sel&&(sel.kind||'prog')==='prog'){const re=new RegExp(`(<label>สถานะ<select data-p="bills\\.${sel.id}\\.status")`),v=sel.retAll||'',auto=(()=>{const s=sel.retAll;sel.retAll='';const x=retIsLast(sel);sel.retAll=s;return x})();
    h=h.replace(re,`<label>หักเงินประกันในใบนี้<select data-p="bills.${sel.id}.retAll"><option value=""${v?'':' selected'}>อัตโนมัติ (${auto?'งวดสุดท้าย หักทั้งหมด':'ยังไม่หัก'})</option><option value="y"${v==='y'?' selected':''}>หักทั้งหมดในใบนี้</option><option value="n"${v==='n'?' selected':''}>ไม่หักในใบนี้</option></select></label>$1`)}
  if(last)h=h.replace(/<dt>หักประกันผลงาน ([\d.]+)%<\/dt>/,(m,p)=>`<dt>หักประกันผลงาน ${p}% <small>(หักงวดสุดท้าย)</small></dt>`);
  return h}}
Object.assign(SBKW,{'pj.cost.bill':(SBKW['pj.cost.bill']||'')+' เงินประกัน หักงวดสุดท้าย retention'});

