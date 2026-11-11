/* ---------- 4.99.28 รูปประกอบในใบเสนอราคา: pictures printed in the quotation (user, 2026-11-11, Wet Tapping quote with options A/B:
   "ใบ PM มีรูปไหม", "อยากไส่รูปด้วย") ----------
   A card on the quotation page adds pictures (several at once). Each picture belongs to one work section (i.g) or to the whole
   quotation (''), and has a caption. 4.99.29 (user: "รูปประกอบทำแยกจากใบเสนอราคาดีกว่า", "ดูแล้วแปลกๆ"): the pictures print as their own
   attachment sheet (PRINT.quotePics, button พิมพ์รูปประกอบ on the card), never inside the quotation. The sheet has the company header,
   the quotation's number, customer, project and work, and the pictures grouped by section in the order of the lines; in an options
   quotation (989-quote-options.js) each group carries its option's badge. Pictures are made smaller and kept like
   site photos (IndexedDB, key 'qph-…'), so backups, folder/cloud sync, phone file exchange and รับงานสด carry them (photoKeys in 280).
   Q.pics = [{id, k: photo key, g: section ('' = whole quotation), cap: caption}]. */
const QPX_MAX=12;
const qpxFind=id=>(CO().quotes||[]).find(q=>q.id===id);
const qpxList=Q=>Array.isArray(Q&&Q.pics)?Q.pics.filter(p=>p&&p.k):[];
const qpxSecs=Q=>{const G=[];(Q.items||[]).forEach(i=>{if(i.g!=null&&!G.includes(i.g))G.push(i.g)});return G};
// the option letter of a section when the quotation prints as options A/B
const qpxOpt=(Q,g)=>{try{return g&&typeof qopOn==='function'&&qopOn(Q)?(qopMap(Q)[g]||''):''}catch(e){return ''}};
const qpxSecName=(Q,g)=>{const nm=typeof qopBare==='function'?qopBare(gName(g)):gName(g);return nm};

// ---- the card on the quotation page
function qpxCard(Q){if(!Q||(typeof qmMa==='function'&&qmMa(Q)))return '';const L=qpxList(Q),b=`co.quotes.${Q.id}`,G=qpxSecs(Q);
  const opts=g=>`<option value=""${!g?' selected':''}>ทั้งใบ (ไม่ผูกกับหมวด)</option>`+G.map(x=>{const o=qpxOpt(Q,x);return `<option value="${esc(x)}"${x===g?' selected':''}>${o?`ออปชั่น ${o} · `:''}${esc(qpxSecName(Q,x))}</option>`}).join('')
    +(g&&!G.includes(g)?`<option value="${esc(g)}" selected>${esc(gName(g))} (ไม่มีในรายการแล้ว)</option>`:'');
  const rows=L.map((p,k)=>`<div class="qpx-it"><img data-ph="${esc(p.k)}" src="${phCache[p.k]||''}" alt="${esc(p.cap||'รูปประกอบ')}">
    <div class="qpx-f"><label>อยู่กับหมวด<select data-p="${b}.pics.${p.id}.g">${opts(p.g||'')}</select></label>
      <label>คำอธิบายใต้รูป<input data-p="${b}.pics.${p.id}.cap" value="${esc(p.cap||'')}" placeholder="เช่น ตัวอย่างหน้างาน Wet Tapping"></label>
      <div class="row" style="gap:4px"><button type="button" class="btn ghost sm" data-a="qpxMv" data-id="${Q.id}" data-p="${p.id}" data-d="-1"${k?'':' disabled'} aria-label="เลื่อนขึ้น">▲</button><button type="button" class="btn ghost sm" data-a="qpxMv" data-id="${Q.id}" data-p="${p.id}" data-d="1"${k<L.length-1?'':' disabled'} aria-label="เลื่อนลง">▼</button>
      <button type="button" class="btn ghost sm" data-a="qpxDel" data-id="${Q.id}" data-p="${p.id}">ลบรูป</button></div></div></div>`).join('');
  return `<section class="card qpx-card"><h2><span>รูปประกอบในใบเสนอราคา</span><small>${L.length?`${L.length} รูป · `:''}พิมพ์แยกเป็นเอกสารแนบ ไม่ปนในใบเสนอราคา</small></h2>
  <p class="hint">ใส่รูปหน้างาน แบบอุปกรณ์ หรือรูปจากใบเสนอราคาผู้ขาย แต่ละรูปเลือกได้ว่าอยู่กับหมวดหรือออปชั่นไหน${G.length>1?' ในใบแบบออปชั่น A / B รูปจะขึ้นป้ายออปชั่นของหมวดนั้น':''}</p>
  ${rows?`<div class="qpx-g">${rows}</div>`:''}
  <div class="row" style="gap:6px;flex-wrap:wrap"><button type="button" class="btn sm" data-a="qpxAdd" data-id="${Q.id}"${L.length>=QPX_MAX?' disabled':''}>+ เพิ่มรูป</button>${L.length?`<button type="button" class="btn sm" data-a="print" data-k="quotePics" data-id="${Q.id}">พิมพ์รูปประกอบ</button>`:''}${L.length>=QPX_MAX?`<small class="muted">ใส่ได้สูงสุด ${QPX_MAX} รูปต่อใบ</small>`:''}</div></section>`}
{const f=salesQuote;salesQuote=function(){const h=f.apply(this,arguments),Q=qpxFind(S.sel.quote)||(CO().quotes||[]).slice().reverse()[0];return Q?qbIns(h,qpxCard(Q)):h}}

// one section picked when the quotation has only one, or the newest picture's section, else the whole quotation
const qpxDefG=Q=>{const G=qpxSecs(Q),L=qpxList(Q);return L.length?(L[L.length-1].g||''):G.length===1?G[0]:''};
ACT.qpxAdd=b=>{const Q=qpxFind(b.dataset.id);if(!Q)return;const f=$('#fileIn');f.accept='image/*';f.multiple=true;
  f.onchange=async()=>{const fs=[...f.files];f.value='';f.multiple=false;Q.pics=qpxList(Q);let k=0;const g=qpxDefG(Q);
    for(const file of fs){if(Q.pics.length>=QPX_MAX)break;try{const d=await shrink(file,1600,.8),key='qph-'+uid();await IDB.put(key,d);phCache[key]=d;Q.pics.push({id:uid(),k:key,g,cap:''});k++}catch(e){}}
    save();render();toast(k?`เพิ่มรูป ${k} รูป`+(fs.length>k?` (ใส่ได้สูงสุด ${QPX_MAX} รูป)`:''):'เพิ่มรูปไม่ได้')};f.click()};
ACT.qpxDel=b=>{const Q=qpxFind(b.dataset.id);if(!Q||!confirm('ลบรูปนี้ออกจากใบเสนอราคา?'))return;const p=qpxList(Q).find(x=>x.id===b.dataset.p);if(!p)return;
  Q.pics=qpxList(Q).filter(x=>x!==p);
  // a copied quotation (Rev., ทำซ้ำ) shares the same picture: keep it while another quotation still uses it
  if(!(CO().quotes||[]).some(q=>qpxList(q).some(x=>x.k===p.k)))IDB.del(p.k).catch(()=>{});save();render()};
ACT.qpxMv=b=>{const Q=qpxFind(b.dataset.id);if(!Q)return;const L=qpxList(Q),i=L.findIndex(x=>x.id===b.dataset.p),j=i+n(b.dataset.d);if(i<0||j<0||j>=L.length)return;
  [L[i],L[j]]=[L[j],L[i]];Q.pics=L;save();render()};

// ---- the attachment sheet
const QPX_CSS=`<style>@page{size:A4;margin:12mm}
.qpx{font-size:11px;color:#1d2b3a;--qt:#1c6f7d;--qn:#123a5c;--qg:#667085;--ql:#dde3ea;--qo:#F59E0B}
.qpx-bar{height:5px;border-radius:3px;background:linear-gradient(90deg,var(--qn),var(--qt));margin:0 0 10px}
.qpx-h{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin:0 0 10px}
.qpx-h img{max-height:46px;max-width:200px;object-fit:contain}.qpx-h .nm{font-size:16px;font-weight:700;color:var(--qn)}
.qpx-h .co{text-align:right;font-size:9.5px;color:var(--qg);line-height:1.45}.qpx-h .co b{font-size:11px;color:var(--qn)}
.qpx-tt{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;border-bottom:1px solid var(--ql);padding:0 0 8px;margin:0 0 10px}
.qpx-tt small{display:block;letter-spacing:.2em;color:var(--qt);font-size:9px;font-weight:700}.qpx-tt h1{margin:0;font-size:19px;color:var(--qn)}
.qpx-tt h1 i{font-style:normal;font-weight:400;font-size:12px;color:var(--qg);margin-left:6px}
.qpx-no{text-align:right;font-size:10px;color:var(--qg)}.qpx-no b{display:block;font-size:13px;color:var(--qn)}
.qpx-inf{display:grid;grid-template-columns:repeat(2,1fr);gap:3px 16px;margin:0 0 12px;font-size:10.5px}
.qpx-inf div{display:grid;grid-template-columns:92px 1fr;gap:6px}.qpx-inf span{color:var(--qg)}
.qpx-sec{margin:0 0 10px;break-inside:avoid;page-break-inside:avoid}
.qpx-sh{display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:var(--qn);margin:0 0 5px}
.qpx-b{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;border-radius:4px;background:var(--qo);color:#fff;font-size:10px;font-weight:700}
.qpx-row{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.qpx-row.n1{grid-template-columns:minmax(0,80%)}.qpx-row.n3{grid-template-columns:repeat(3,1fr)}
.qpx-row figure{margin:0;border:1px solid var(--ql);border-radius:8px;padding:4px;break-inside:avoid;page-break-inside:avoid;background:#fff}
.qpx-row img,#print .qpx .qpx-row img{display:block;width:100%;max-width:none;height:70mm;max-height:none;object-fit:contain;border-radius:5px;background:#f6f8fa}
.qpx-row.n1 img,#print .qpx .qpx-row.n1 img{height:95mm}.qpx-row.n3 img,#print .qpx .qpx-row.n3 img{height:48mm}
.qpx-row figcaption{font-size:10px;color:#475467;margin:4px 2px 1px;line-height:1.35}
.qpx-ft{margin-top:10px;border-top:1px solid var(--ql);padding-top:5px;display:flex;justify-content:space-between;font-size:9px;color:var(--qg)}
</style>`;
function qpxSheet(Q){const L=qpxList(Q);if(!L.length)return '';const C=CO(),G=qpxSecs(Q),EN=typeof qmLang==='function'&&qmLang(Q)==='en';
  const tx=(th,en)=>EN?en:th,cu=(C.customers||[]).find(x=>x.id===Q.cust)||{},cuN=EN&&cu.nameEn||cu.name||'';
  const dt=s=>{try{if(!okD(s))return '';return EN?pd(s).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):thDL(s)}catch(e){return String(s||'')}};
  // groups: the whole quotation first, then the sections in the order of the lines (a section no longer in the lines prints last)
  const order=['',...G,...L.map(p=>p.g||'').filter(g=>g&&!G.includes(g))],seen=new Set();
  const groups=order.filter(g=>!seen.has(g)&&seen.add(g)).map(g=>({g,P:L.filter(p=>(p.g||'')===g)})).filter(x=>x.P.length);
  const fig=p=>`<figure><img data-ph="${esc(p.k)}" src="${phCache[p.k]||''}" alt="${esc(p.cap||'')}">${p.cap?`<figcaption>${esc(p.cap)}</figcaption>`:''}</figure>`;
  const sec=x=>{const o=qpxOpt(Q,x.g),nm=x.g?qpxSecName(Q,x.g):'',N=x.P.length,cl=N===1?' n1':N%3===0||N>4?' n3':'';
    const head=x.g||o?`<div class="qpx-sh">${o?`<span class="qpx-b">${o}</span>${tx('ออปชั่น','Option')} ${o} · `:''}${esc(nm)}</div>`:'';
    return `<div class="qpx-sec">${head}<div class="qpx-row${cl}">${x.P.map(fig).join('')}</div></div>`};
  const inf=[[tx('ลูกค้า','Customer'),cuN],[tx('โครงการ','Project'),Q.pname||''],[tx('งาน','Work'),Q.title||''],[tx('สถานที่','Site'),Q.site||'']].filter(r=>r[1]);
  return QPX_CSS+`<div class="qpx" data-doc-name="${esc([Q.no,tx('รูปประกอบ','Pictures'),Q.pname||Q.title||''].filter(Boolean).join(' '))}"><div class="qpx-bar"></div>
  <div class="qpx-h"><div>${C.logo?`<img src="${C.logo}" alt="">`:`<span class="nm">${esc(C.name||'')}</span>`}</div>
    <div class="co"><b>${esc(EN&&C.nameEn||C.name||'')}</b>${C.addr?'<br>'+esc(EN&&C.addrEn||C.addr):''}${C.phone||C.email?'<br>'+esc([C.phone?tx('โทร ','Tel. ')+C.phone:'',C.email||''].filter(Boolean).join(' · ')):''}</div></div>
  <div class="qpx-tt"><div><small>${tx('ATTACHMENT','ATTACHMENT')}</small><h1>${tx('รูปประกอบใบเสนอราคา','Quotation pictures')}${EN?'':'<i>Pictures</i>'}</h1></div>
    <div class="qpx-no">${tx('แนบท้ายใบเสนอราคาเลขที่','Attached to quotation no.')}<b>${esc(Q.no||'')}</b>${Q.date?`${tx('ลงวันที่','dated')} ${dt(Q.date)}`:''}</div></div>
  ${inf.length?`<div class="qpx-inf">${inf.map(r=>`<div><span>${r[0]}</span><b>${esc(r[1])}</b></div>`).join('')}</div>`:''}
  ${groups.map(sec).join('')}
  <div class="qpx-ft"><span>${esc(C.name||'')}</span><span>${tx('เอกสารแนบ','Attachment')} ${esc(Q.no||'')}</span></div></div>`}
PRINT.quotePics=id=>{const Q=qpxFind(id);return Q?qpxSheet(Q):''};

// ---- the card's look on the screen
document.head.insertAdjacentHTML('beforeend',`<style>
.qpx-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;margin:8px 0 10px}
.qpx-it{display:flex;gap:10px;border:1px solid var(--line,#e2e8f0);border-radius:12px;padding:8px;align-items:flex-start}
.qpx-it img{width:120px;height:96px;object-fit:contain;border-radius:8px;background:#f4f6f9;flex:none}
.qpx-f{display:flex;flex-direction:column;gap:6px;flex:1;min-width:0}.qpx-f label{display:flex;flex-direction:column;gap:2px;font-size:12px;margin:0}
.qpx-f select,.qpx-f input{width:100%}
@media (max-width:600px){.qpx-g{grid-template-columns:1fr}.qpx-it img{width:96px;height:80px}}
</style>`);
