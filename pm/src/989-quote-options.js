/* ---------- 4.99.25 แบบฟอร์ม "ออปชั่น A / B": one quotation offering two to four choices (user, 2026-11-06: "ในกรณีเราทำ 2 ออฟชั้น", "แยกเป็นอีกฟอร์มนะ") ----------
   A free form in แบบฟอร์มเอกสาร (983). Each work section (i.g) belongs to one option (A–D) or to every option ('' = ใช้ทุกออปชั่น); the
   quotation keeps this in Q.opt = {sec:{g:'A'|'B'|…|''}, nm:{A:'name'}, d:{A:discount}, pick:'A'}. Option X = the shared sections + X's.
   The print is the ORIEN Modern one (981) over every line, with a badge on each option's sections; the table's total row, the totals box
   (subtotal, extras such as SAFETY & CLEANING, discount, VAT, grand total, withholding), the amount in words and the payment amounts come
   once per option and are never added together. Everything else reads the quotation as the option the customer chose (Q.opt.pick), or
   option A until then: lists, sales figures, ได้งาน. ได้งาน asks which option was chosen and sends only that option's lines to the project.
   Other forms ignore Q.opt, so switching back prints the quotation as before. */
const QOP_L=['A','B','C','D'];
const qopIs=Q=>!!Q&&!!Q.items&&!Q._opt&&!Q._optAll&&!Q._part&&typeof fsCur==='function'&&fsCur(Q)==='opt';
// "ออปชั่น B", "Option B", "ทางเลือก B" in a section name
const QOP_RX=/(?:ออปชั่น|ออฟชั่น|ออพชั่น|อ็อปชั่น|option|ทางเลือก(?:ที่)?)\s*[:.\-–]?\s*([A-Da-d])(?![A-Za-z])/i;
const qopDet=s=>{const m=String(s||'').match(QOP_RX);return m?m[1].toUpperCase():''};
const qopSecs=Q=>{const G=[];(Q.items||[]).forEach(i=>{if(!G.includes(i.g))G.push(i.g)});return G};
// the option of every section: the user's choice, else the section's name; with no name saying so the first section is A and the rest are shared
function qopMap(Q){const G=qopSecs(Q),S=Q.opt&&Q.opt.sec,M={};
  if(S){G.forEach(g=>{M[g]=Object.prototype.hasOwnProperty.call(S,g)?(QOP_L.includes(S[g])?S[g]:''):qopDet(gName(g))});return M}
  G.forEach(g=>M[g]=qopDet(gName(g)));
  if(G.length&&!Object.values(M).some(Boolean))M[G[0]]='A';
  return M}
const qopLet=Q=>{const v=Object.values(qopMap(Q));return QOP_L.filter(k=>v.includes(k))};
const qopOn=Q=>qopIs(Q)&&qopLet(Q).length>=2;
const qopEns=Q=>{if(!Q.opt||typeof Q.opt!=='object')Q.opt={};if(!Q.opt.sec)Q.opt.sec=qopMap(Object.assign({},Q,{opt:null}));Q.opt.nm=Q.opt.nm||{};Q.opt.d=Q.opt.d||{};return Q.opt};
const qopNm=(Q,k)=>String((Q.opt&&Q.opt.nm&&Q.opt.nm[k])||'').trim();
// the option the rest of the program reads: the customer's pick, else the first
const qopCur=Q=>{const L=qopLet(Q),p=Q.opt&&Q.opt.pick;return L.includes(p)?p:L[0]};
const qopDisc=(Q,k)=>{const d=Q.opt&&Q.opt.d&&Q.opt.d[k];return d!==''&&d!=null?n(d):n(Q.disc)};
const qopItems=(Q,k,M)=>{M=M||qopMap(Q);return Q.items.filter(i=>!M[i.g]||M[i.g]===k)};
// option k as a quotation of its own (shared sections + its own), one document even with แยกค่าเครื่อง
const qopQ=(Q,k)=>Object.assign({},Q,{items:qopItems(Q,k),_opt:k,eqDoc:'one',disc:qopDisc(Q,k)});
// a section's name without an option label already in it (the print shows a badge instead)
const qopBare=s=>{const t=String(s||'').replace(/^\s*(?:ออปชั่น|ออฟชั่น|ออพชั่น|option|ทางเลือก)\s*[A-D]\s*[:·.\-–]?\s*/i,'').replace(/\s*[-–·]?\s*[(\[]?\s*(?:ออปชั่น|ออฟชั่น|ออพชั่น|option|ทางเลือก)\s*[A-D]\s*[)\]]?\s*$/i,'').trim();return t||String(s||'')};

// every total in the program = the chosen option (or A); the print and the panel ask for each option themselves
{const f=qCalc;qCalc=function(Q){if(!qopOn(Q))return f.apply(this,arguments);return f(qopQ(Q,qopCur(Q)))}}

// ---- the print
const QOP_CSS=`<style>
#print .qm .qop-b{display:inline-flex;align-items:center;justify-content:center;min-width:15px;height:15px;padding:0 4px;margin-right:5px;border-radius:4px;background:var(--qo,#F59E0B);color:#fff;font-size:9.5px;font-weight:700;line-height:1;vertical-align:1px;font-style:normal}
#print .qm .qop-nt{margin:0 0 8px;border:1px solid var(--ql);border-left:4px solid var(--qo,#F59E0B);border-radius:10px;padding:5px 10px;font-size:10.5px;break-inside:avoid}
#print .qm .qop-nt-t{font-weight:600;color:var(--qn);margin:0 0 3px}
#print .qm .qop-nt-t small{font-weight:400;color:var(--qg);margin-left:6px;font-size:9.5px}
#print .qm .qop-chips{display:flex;flex-wrap:wrap;gap:4px 18px}
#print .qm .qop-chips>div{display:flex;align-items:center;gap:2px}
#print .qm .qop-chips b{font-weight:600;color:var(--qn);margin-right:6px}
#print .qm .qop-chips em{font-style:normal;font-weight:700;color:var(--qn);font-variant-numeric:tabular-nums}
#print .qm .qop-chips small{color:var(--qg);font-size:9px;margin-left:4px}
#print .qm .qop-ft{margin:0 0 10px}#print .qm .qop-sum{break-inside:avoid;page-break-inside:avoid}
#print .qm .qop-hd{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 8px;margin:0 0 5px;font-size:11px;color:var(--qn)}
#print .qm .qop-hd b{font-weight:700}#print .qm .qop-hd small{color:var(--qg);font-size:9.5px}
#print .qm .qop-g{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:0 0 8px;break-inside:avoid}
#print .qm .qop-g.n3{grid-template-columns:repeat(3,1fr)}
#print .qm .qop-c{border:1px solid var(--ql);border-radius:12px;padding:6px 8px 7px;break-inside:avoid}
#print .qm .qop-ch{display:flex;align-items:center;flex-wrap:wrap;gap:2px;font-size:11px;color:var(--qn);margin:0 0 1px}
#print .qm .qop-ch b{font-weight:700}#print .qm .qop-ch span.nm{margin-left:5px;font-weight:600;color:var(--qt)}
#print .qm .qop-cs{font-size:9px;color:var(--qg);margin:0 0 5px;line-height:1.3}
#print .qm .qop-ft .qm-tm{margin-top:0}
#print .qm table.pay th.qop-a,#print .qm table.pay td.qop-a{text-align:right;white-space:nowrap}
#print .qm table.qm-t tr.tt .qop-b{background:var(--qo,#F59E0B)}
#print .qm .qop-pick{display:flex;justify-content:center;flex-wrap:wrap;gap:4px 12px;margin-top:4px;font-weight:600;color:var(--qn)}
</style>`;
function qopPrint(Q,bq){if(!qopOn(Q))return qmPrint(Q,bq);
  const f0=qForm(Q);if(f0==='G'||f0==='E')return PRINT.quoteXl(Q.id,bq);
  const M=qopMap(Q),Ls=qopLet(Q),L=qmLang(Q),EN=L==='en',tx=(th,en)=>EN?en:th,t=(th,en)=>L==='en'?en:L==='th'?th:`${th}<i class="en il">${en}</i>`;
  const lab=k=>(EN?'Option ':'ออปชั่น ')+k,bd=k=>`<span class="qop-b">${k}</span>`,nm=k=>qopNm(Q,k);
  // every line, each option's section names carrying a mark that becomes the badge
  const A=Object.assign({},Q,{_optAll:1,eqDoc:'one',items:Q.items.map(i=>M[i.g]?Object.assign({},i,{g:`⟦${M[i.g]}⟧`+qopBare(gName(i.g))}):i)});
  const X={},C={};Ls.forEach(k=>{X[k]=qopQ(Q,k);C[k]=qCalc(X[k])});
  const T=document.createElement('template');T.innerHTML=qmPrint(A,bq);const R=T.content;
  // the table's total row: one per option (shared sections + the option's)
  const eqs=!!Q.eqSep&&!qmMa(Q),sums=k=>X[k].items.reduce((a,i)=>{const x=qLine(X[k],i),e=eqs&&qmIsEq(i);a.e+=e?x.mt:0;a.m+=e?0:x.mt;a.l+=x.lt;a.t+=x.t;return a},{e:0,m:0,l:0,t:0});
  const S={};Ls.forEach(k=>S[k]=sums(k));const mny=v=>Math.abs(v)<0.005?'–':fmt(v,2);
  R.querySelectorAll('table.qm-t').forEach(tb=>{const rows=[...tb.querySelectorAll('tr.tt')];const row=rows[rows.length-1];if(!row)return;
    const rc=[...row.cells].filter(c=>c.classList.contains('r')),keys=rc.length>=4?['e','m','l','t']:rc.length===3?['m','l','t']:rc.length===2?['m','t']:['t'];
    Ls.forEach(k=>{const r=row.cloneNode(true),c=[...r.cells].filter(x=>x.classList.contains('r'));c.forEach((x,j)=>x.textContent=mny(S[k][keys[j]]||0));
      if(r.cells[1])r.cells[1].innerHTML=`${tx('รวม','Total ')}${bd(k)}${tx(lab(k),'')}${nm(k)?' · '+esc(nm(k)):''}`;row.parentNode.insertBefore(r,row)});
    row.remove()});
  // the totals box, amount in words and withholding of each option, side by side
  const part=k=>{const t2=document.createElement('template');t2.innerHTML=qmPrint(X[k],bq);const ft=t2.content.querySelector('.qm-ft');return ft&&ft.children[1]?ft.children[1].innerHTML:''};
  const secs=k=>qopSecs(X[k]).map(g=>qopBare(gName(g))).join(' + ');
  const cards=Ls.map(k=>`<div class="qop-c"><div class="qop-ch">${bd(k)}<b>${lab(k)}</b>${nm(k)?`<span class="nm">${esc(nm(k))}</span>`:''}</div><div class="qop-cs">${tx('ประกอบด้วย ','Includes ')}${esc(secs(k))}</div>${part(k)}</div>`).join('');
  const ft=R.querySelector('.qm-ft');
  if(ft){const tm=ft.children[0];
    // payment: one amount column per option
    if(tm){const P=[...tm.querySelectorAll('table.pay')],two=P.length===2&&eqs&&(Q.qpayE||[]).length,base=(k,j)=>two&&typeof qmPayBase==='function'?qmPayBase(X[k],j===0?'eq':'svc').grand:C[k].grand;
      P.forEach((tbl,j)=>{const list=(two&&j===0?Q.qpayE:qEnsure(Q).qpay)||[];
        tbl.innerHTML=`<thead><tr><th>${tx('งวด','No.')}</th><th>${tx('เมื่อ','When')}</th><th class="r">%</th>${Ls.map(k=>`<th class="qop-a">${lab(k)}</th>`).join('')}</tr></thead><tbody>
          ${list.map((x,i)=>`<tr><td>${esc(x.no||String(i+1))}</td><td>${esc(x.desc||'')}</td><td class="r">${fmtq(x.pct)}%</td>${Ls.map(k=>`<td class="qop-a">${fmt(base(k,j)*n(x.pct)/100,2)}</td>`).join('')}</tr>`).join('')}</tbody>`;
        const h=tbl.previousElementSibling;if(h&&h.tagName==='SPAN'&&!/VAT/.test(h.textContent))h.insertAdjacentHTML('beforeend',` <small style="color:var(--qg)">${tx('(จำนวนเงินรวม VAT ตามออปชั่นที่เลือก)','(amounts incl. VAT, by option)')}</small>`)})}
    const box=document.createElement('div');box.className='qop-ft';
    box.innerHTML=`<div class="qop-sum"><div class="qop-hd"><b>${t('สรุปราคาแต่ละออปชั่น','Price by option')}</b><small>${tx('ลูกค้าเลือกอย่างใดอย่างหนึ่ง ยอดของแต่ละออปชั่นไม่นำมารวมกัน','Please choose one option. The option totals are not added together.')}</small></div>
      <div class="qop-g${Ls.length===3?' n3':''}">${cards}</div></div>`;
    if(tm)box.appendChild(tm);ft.replaceWith(box)}
  // a note under the opening sentence: the options and their grand totals
  const intro=R.querySelector('.qm-in');
  if(intro)intro.insertAdjacentHTML('afterend',`<div class="qop-nt"><div class="qop-nt-t">${tx(`ใบเสนอราคานี้เสนอ ${Ls.length} ทางเลือก โปรดเลือกอย่างใดอย่างหนึ่ง`,`This quotation offers ${Ls.length} options. Please choose one.`)}<small>${tx('หมวดที่ไม่มีป้ายออปชั่น รวมอยู่ในทุกออปชั่น','Sections without an option badge are included in every option.')}</small></div>
    <div class="qop-chips">${Ls.map(k=>`<div>${bd(k)}<b>${lab(k)}${nm(k)?' · '+esc(nm(k)):''}</b><em>${fmt(C[k].grand,2)}</em><small>${tx('บาท รวม VAT','incl. VAT')}</small></div>`).join('')}</div></div>`);
  const h1=R.querySelector('.qm-ti h1');if(h1&&!h1.querySelector('.pt'))h1.insertAdjacentHTML('beforeend',`<span class="pt">${tx('ออปชั่น ','Options ')}${Ls.join(' / ')}</span>`);
  // the customer ticks the option on the acceptance box
  const ok=R.querySelector('.qm-sg>div.ok');if(ok){const q=ok.querySelector('.q');(q||ok.querySelector('h4')).insertAdjacentHTML('afterend',`<div class="qop-pick">${Ls.map(k=>`<span>☐ ${lab(k)}</span>`).join('')}</div>`)}
  return QOP_CSS+T.innerHTML.replace(/⟦([A-D])⟧/g,'<span class="qop-b">$1</span>')}

FS_FORMS.push({id:'opt',g:'pvt',k:'boq',n:'ออปชั่น A / B',d:'เสนอหลายทางเลือกในใบเดียว แต่ละออปชั่นมียอดรวม VAT และตัวอักษรของตัวเอง ลูกค้าเลือกอย่างใดอย่างหนึ่ง',p:0,set:{look:'',one:false},
  pr:(Q,bq)=>qopPrint(Q,bq),
  // the card's picture: shared installation + two brands of air conditioner
  smp:it=>({title:'ติดตั้งระบบปรับอากาศ ห้องประชุม',opt:{sec:{'งานท่อและติดตั้ง':'','เครื่องปรับอากาศ Inverter':'A','เครื่องปรับอากาศ Fixed speed':'B'},nm:{A:'Inverter',B:'Fixed speed'},d:{}},
    items:[it('งานท่อและติดตั้ง','ท่อทองแดงพร้อมฉนวน 5/8"','ม.',60,420,180),it('งานท่อและติดตั้ง','ค่าติดตั้งและทดสอบ','ชุด',4,0,2500),
      it('เครื่องปรับอากาศ Inverter','Split Type Inverter 24,000 BTU/hr','ชุด',4,32000,0),it('เครื่องปรับอากาศ Fixed speed','Split Type 24,000 BTU/hr','ชุด',4,24500,0)]})});

// ---- the panel under the form cards: which section goes in which option, option names, discounts, totals, the customer's pick
const QOP_UI=`<style>
.qop{margin-top:10px;border:1px solid var(--line);border-left:3px solid #F59E0B;border-radius:10px;padding:8px 10px 10px;background:var(--surface)}
.qop-h{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 10px;margin:0 0 6px}.qop-h b{font-size:14px}.qop-h small{color:var(--muted);font-size:12px}
.qop-tw{overflow-x:auto}
.qop-t{width:100%;border-collapse:collapse;font-size:13px}
.qop-t th{text-align:left;font-weight:600;color:var(--muted);font-size:12px;padding:3px 6px}.qop-t td{padding:4px 6px;border-top:1px solid var(--line);vertical-align:middle}
.qop-t .r{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.qop-sg{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden;white-space:nowrap}
.qop-sg button{border:0;background:transparent;color:inherit;font:inherit;font-size:12.5px;padding:3px 9px;min-width:32px;cursor:pointer}
.qop-sg button+button{border-left:1px solid var(--line)}
.qop-sg button.on{background:var(--accent,#1C8F9B);color:#fff;font-weight:600}
.qop-sg button.on.c{background:#64748B}
.qop-bd{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 5px;border-radius:5px;background:#F59E0B;color:#fff;font-weight:700;font-size:12px}
.qop-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px;margin-top:10px}
.qop-card{border:1.5px solid var(--line);border-radius:10px;padding:8px 10px}
.qop-card.pk{border-color:var(--accent,#1C8F9B);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent,#1C8F9B) 22%,transparent)}
.qop-card .hd{display:flex;align-items:center;gap:6px;margin:0 0 6px}.qop-card .hd b{font-size:13.5px}
.qop-card label{display:flex;align-items:center;gap:6px;font-size:12.5px;margin:0 0 5px}.qop-card label span{width:70px;color:var(--muted);flex:none}
.qop-card label input{flex:1;min-width:0;height:30px}
.qop-card .rw{display:flex;justify-content:space-between;font-size:12.5px;padding:1px 0}.qop-card .rw b{font-variant-numeric:tabular-nums}
.qop-card .rw.gt{border-top:1px solid var(--line);margin-top:3px;padding-top:4px;font-size:14px}
.qop-card .btn{margin-top:6px;width:100%}
.qop-w{margin-top:8px;padding:6px 10px;border-radius:8px;background:color-mix(in srgb,#F59E0B 14%,transparent);font-size:12.5px}
.qop .hint{display:block;margin-top:8px}
</style>`;
function qopPanel(Q){const o=qopEns(Q),M=qopMap(Q),G=qopSecs(Q),Ls=qopLet(Q),cur=Ls.length>=2?qopCur(Q):'',ek=encodeURIComponent;
  const val=g=>sum(Q.items.filter(i=>i.g===g),i=>qLine(Q,i).t);
  const seg=g=>`<span class="qop-sg" role="group" aria-label="ออปชั่นของหมวดนี้">${[['','ทุกออปชั่น'],...QOP_L.map(k=>[k,k])].map(([v,tl])=>`<button type="button" class="${(M[g]||'')===v?'on':''}${v?'':' c'}" data-a="qopSec" data-id="${Q.id}" data-g="${ek(g)}" data-v="${v}" aria-pressed="${(M[g]||'')===v}">${tl}</button>`).join('')}</span>`;
  const rows=G.map((g,k)=>`<tr><td>${k+1}</td><td>${esc(gName(g))}</td><td class="r">${fmt(val(g),2)}</td><td>${seg(g)}</td><td><button type="button" class="btn sm ghost" data-a="qopDup" data-id="${Q.id}" data-g="${ek(g)}" title="คัดลอกรายการในหมวดนี้เป็นออปชั่นใหม่ แล้วแก้ยี่ห้อ/ราคาในหมวดที่คัดลอก">⧉ คัดลอกเป็นออปชั่นใหม่</button></td></tr>`).join('');
  const card=k=>{const c=qCalc(qopQ(Q,k)),d=o.d[k];return `<div class="qop-card${k===cur&&o.pick===k?' pk':''}"><div class="hd"><span class="qop-bd">${k}</span><b>ออปชั่น ${k}</b>${o.pick===k?'<span class="tag" style="margin-left:auto;font-size:11px;padding:0 7px;border-radius:9px;background:var(--accent,#1C8F9B);color:#fff">✓ ลูกค้าเลือก</span>':''}</div>
    <label><span>ชื่อ</span><input class="qop-nm" data-id="${Q.id}" data-k="${k}" value="${esc(o.nm[k]||'')}" placeholder="เช่น Dahua 2MP / ยี่ห้อ B"></label>
    <label><span>ส่วนลด</span><input class="qop-dc" data-id="${Q.id}" data-k="${k}" inputmode="decimal" value="${esc(d==null?'':String(d))}" placeholder="${n(Q.disc)?'ตามใบ '+fmt(n(Q.disc),2):'ไม่มี'}"></label>
    <div class="rw"><span>ก่อน VAT</span><b>${fmt(c.net,2)}</b></div><div class="rw"><span>VAT 7%</span><b>${fmt(c.vat,2)}</b></div><div class="rw gt"><span>รวมทั้งสิ้น</span><b>${fmt(c.grand,2)}</b></div>
    <button type="button" class="btn sm${o.pick===k?' pri':''}" data-a="qopPick" data-id="${Q.id}" data-k="${k}">${o.pick===k?'✓ ลูกค้าเลือกออปชั่นนี้ (กดอีกครั้งเพื่อยกเลิก)':'ลูกค้าเลือกออปชั่นนี้'}</button></div>`};
  return QOP_UI+`<div class="qop"><div class="qop-h"><b>ออปชั่นในใบนี้</b><small>เลือกว่าแต่ละหมวดอยู่ในออปชั่นไหน หมวด "ทุกออปชั่น" นับรวมในทุกออปชั่น ยอดรวม VAT ตัวอักษร และงวดเงิน พิมพ์แยกตามออปชั่น</small></div>
    <div class="qop-tw"><table class="qop-t"><thead><tr><th>#</th><th>หมวดงาน</th><th class="r">ราคาขาย</th><th>อยู่ในออปชั่น</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="muted">ยังไม่มีรายการ</td></tr>'}</tbody></table></div>
    ${Ls.length>=2?`<div class="qop-cards">${Ls.map(card).join('')}</div>`:`<div class="qop-w">ต้องมีอย่างน้อย 2 ออปชั่น: แยกรายการเป็นหมวด (เช่น หมวด 1 ออปชั่น A, หมวด 2 ออปชั่น B) หรือกด ⧉ คัดลอกเป็นออปชั่นใหม่ ตอนนี้ใบนี้พิมพ์แบบใบปกติ</div>`}
    <small class="hint">มูลค่าในรายการใบเสนอราคา ยอดขาย และ "ได้งาน" ใช้ออปชั่นที่ลูกค้าเลือก${Ls.length>=2?` (ตอนนี้: ออปชั่น ${cur}${o.pick?'':' เพราะยังไม่เลือก'})`:''}</small></div>`}
{const f=fsInputs;fsInputs=function(F,Q){const h=f.apply(this,arguments);return F&&F.id==='opt'&&Q&&!qmMa(Q)?h+qopPanel(Q):h}}
const qopFind=id=>(CO().quotes||[]).find(q=>q.id===id);
// picking the form: keep what its first two sections would be, so the panel shows it and new sections start as shared
{const f=ACT.fsPick;ACT.fsPick=async b=>{const r=await f(b);if(b.dataset.v==='opt'){const Q=qopFind(b.dataset.id);if(Q&&!Q.opt){qopEns(Q);save();render()}}return r}}
ACT.qopSec=b=>{const Q=qopFind(b.dataset.id);if(!Q)return;const o=qopEns(Q),g=decodeURIComponent(b.dataset.g);o.sec[g]=b.dataset.v||'';
  if(o.pick&&!qopLet(Q).includes(o.pick))o.pick='';save();render()};
ACT.qopPick=b=>{const Q=qopFind(b.dataset.id);if(!Q)return;const o=qopEns(Q),k=b.dataset.k;o.pick=o.pick===k?'':k;save();render();toast(o.pick?`ลูกค้าเลือกออปชั่น ${k}`:'ยกเลิกการเลือกออปชั่น')};
// ⧉ a copy of the section's lines as the next free option, right under it; a shared section becomes the first free option itself
ACT.qopDup=b=>{const Q=qopFind(b.dataset.id);if(!Q)return;const o=qopEns(Q),g=decodeURIComponent(b.dataset.g),M=qopMap(Q);let used=qopLet(Q);
  if(!M[g]){const k=QOP_L.find(x=>!used.includes(x));if(!k){toast('มีครบ 4 ออปชั่นแล้ว');return}o.sec[g]=k;used=qopLet(Q)}
  const k2=QOP_L.find(x=>!used.includes(x));if(!k2){toast('มีครบ 4 ออปชั่นแล้ว');return}
  const G=qopSecs(Q),base=qopBare(gName(g));let ng=`${base} (ออปชั่น ${k2})`,j=2;while(G.includes(ng))ng=`${base} (ออปชั่น ${k2}) ${j++}`;
  const last=Q.items.map(i=>i.g).lastIndexOf(g),cp=Q.items.filter(i=>i.g===g).map(i=>Object.assign(JSON.parse(JSON.stringify(i)),{id:uid(),g:ng}));
  Q.items.splice(last+1,0,...cp);o.sec[ng]=k2;save();render();toast(`คัดลอกเป็นหมวด “${ng}” แล้ว แก้ยี่ห้อหรือราคาในหมวดนี้ได้เลย`)};
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.classList)return;const nmB=t.classList.contains('qop-nm'),dcB=t.classList.contains('qop-dc');if(!nmB&&!dcB)return;
  const Q=qopFind(t.dataset.id);if(!Q)return;const o=qopEns(Q),k=t.dataset.k;
  if(nmB)o.nm[k]=t.value.trim();else{const v=String(t.value).replace(/,/g,'').trim();if(v==='')delete o.d[k];else o.d[k]=n(v)}save();render()});

// ---- ได้งาน: which option did the customer choose? Only that option's lines go to the project
const qopWonAsk=Q=>{const Ls=qopLet(Q);dialog('ลูกค้าเลือกออปชั่นไหน',`<p>ใบเสนอราคา <b>${esc(Q.no||'')}</b> มี ${Ls.length} ออปชั่น เลือกออปชั่นที่ลูกค้าตกลง ระบบจะส่งเฉพาะรายการของออปชั่นนั้น (รวมหมวดที่ใช้ทุกออปชั่น) เข้าโครงการ</p>
  <div class="row" style="gap:8px;flex-wrap:wrap">${Ls.map(k=>{const c=qCalc(qopQ(Q,k)),nm=qopNm(Q,k);return `<button type="button" class="btn" data-a="qopWon" data-id="${Q.id}" data-k="${k}">ออปชั่น ${k}${nm?' · '+esc(nm):''} <small>(${fmt(c.net,2)} ก่อน VAT)</small></button>`}).join('')}</div>`,'')};
ACT.qopWon=b=>{const Q=qopFind(b.dataset.id);if(!Q)return;qopEns(Q).pick=b.dataset.k;save();$('#dlg').close();ACT.qWonDlg({dataset:{id:Q.id}})};
{const f=ACT.qWonDlg;ACT.qWonDlg=b=>{const Q=qopFind(b.dataset.id);if(Q&&qopOn(Q)&&!(Q.opt&&qopLet(Q).includes(Q.opt.pick))&&Q.items.length){qopWonAsk(Q);return}return f(b)}}
{const f=ACT.qWon;ACT.qWon=b=>{const Q=qopFind(b.dataset.id),on=Q&&qopOn(Q),had=Q&&Q.pj&&DB.projects[Q.pj],k=on&&qopCur(Q),M=on&&qopMap(Q);const r=f(b);
  if(on&&!had&&Q.pj&&DB.projects[Q.pj]){const p=DB.projects[Q.pj];p.boq.items=p.boq.items.filter(i=>!M[i.g]||M[i.g]===k);p.boq.opt=k;save();render()}return r}}
