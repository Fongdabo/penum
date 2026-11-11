/* ---------- 4.99.28 รูปประกอบในใบเสนอราคา: pictures printed in the quotation (user, 2026-11-11, Wet Tapping quote with options A/B:
   "ใบ PM มีรูปไหม", "อยากไส่รูปด้วย") ----------
   A card on the quotation page adds pictures (several at once). Each picture belongs to one work section (i.g) or to the whole
   quotation (''), and has a caption. The print puts a "รูปประกอบ" block above the signatures, grouped by section in the order of the
   lines; in an options quotation (989-quote-options.js) each group carries its option's badge. Pictures are made smaller and kept like
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
  return `<section class="card qpx-card"><h2><span>รูปประกอบในใบเสนอราคา</span><small>${L.length?`${L.length} รูป · `:''}พิมพ์ก่อนช่องลงนาม</small></h2>
  <p class="hint">ใส่รูปหน้างาน แบบอุปกรณ์ หรือรูปจากใบเสนอราคาผู้ขาย แต่ละรูปเลือกได้ว่าอยู่กับหมวดหรือออปชั่นไหน${G.length>1?' ในใบแบบออปชั่น A / B รูปจะขึ้นป้ายออปชั่นของหมวดนั้น':''}</p>
  ${rows?`<div class="qpx-g">${rows}</div>`:''}
  <div class="row" style="gap:6px;flex-wrap:wrap"><button type="button" class="btn sm" data-a="qpxAdd" data-id="${Q.id}"${L.length>=QPX_MAX?' disabled':''}>+ เพิ่มรูป</button>${L.length>=QPX_MAX?`<small class="muted">ใส่ได้สูงสุด ${QPX_MAX} รูปต่อใบ</small>`:''}</div></section>`}
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

// ---- the print
const QPX_CSS=`<style>
.qpx{margin:0 0 12px;break-inside:auto}
.qpx>h3{display:flex;align-items:center;gap:6px;margin:0 0 6px;font-size:11px;color:var(--qt,#1c6f7d);font-weight:700;letter-spacing:.02em}
.qpx>h3:before{content:"";width:8px;height:8px;border-radius:2px;background:var(--qt,#1c6f7d);transform:rotate(45deg)}
.qpx>h3 .en{display:inline;margin-left:2px;font-style:normal;font-weight:400;color:var(--qg,#667)}
.qpx-sec{margin:0 0 8px;break-inside:avoid;page-break-inside:avoid}
.qpx-sh{display:flex;align-items:center;gap:4px;font-size:10.5px;font-weight:600;color:var(--qn,#123a5c);margin:0 0 4px}
.qpx-sh .qpx-b{display:inline-flex;align-items:center;justify-content:center;min-width:15px;height:15px;padding:0 4px;border-radius:4px;background:var(--qo,#F59E0B);color:#fff;font-size:9.5px;font-weight:700}
.qpx-row{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.qpx-row.n1{grid-template-columns:minmax(0,70%)}.qpx-row.n3{grid-template-columns:repeat(3,1fr)}
.qpx-row figure{margin:0;border:1px solid var(--ql,#dde3ea);border-radius:8px;padding:4px;break-inside:avoid;page-break-inside:avoid;background:#fff}
.qpx-row img,#print .qpx .qpx-row img{display:block;width:100%;max-width:none;height:56mm;max-height:none;object-fit:contain;border-radius:5px;background:#f6f8fa}
.qpx-row.n1 img,#print .qpx .qpx-row.n1 img{height:72mm}.qpx-row.n3 img,#print .qpx .qpx-row.n3 img{height:42mm}
.qpx-row figcaption{font-size:9.5px;color:var(--qg,#556);margin:3px 2px 0;line-height:1.3}
</style>`;
function qpxPrint(Q){const L=qpxList(Q);if(!L.length)return '';const G=qpxSecs(Q),EN=typeof qmLang==='function'&&qmLang(Q)==='en',bi=typeof qmLang==='function'&&qmLang(Q)==='bi';
  // groups: the whole quotation first, then the sections in the order of the lines (a section no longer in the lines prints last)
  const order=['',...G,...L.map(p=>p.g||'').filter(g=>g&&!G.includes(g))],seen=new Set();
  const groups=order.filter(g=>!seen.has(g)&&seen.add(g)).map(g=>({g,P:L.filter(p=>(p.g||'')===g)})).filter(x=>x.P.length);
  const fig=p=>`<figure><img data-ph="${esc(p.k)}" src="${phCache[p.k]||''}" alt="${esc(p.cap||'')}">${p.cap?`<figcaption>${esc(p.cap)}</figcaption>`:''}</figure>`;
  const sec=x=>{const o=qpxOpt(Q,x.g),nm=x.g?qpxSecName(Q,x.g):'',N=x.P.length,cl=N===1?' n1':N%3===0||N>4?' n3':'';
    const head=x.g||o?`<div class="qpx-sh">${o?`<span class="qpx-b">${o}</span>`:''}${o?`${EN?'Option':'ออปชั่น'} ${o} · `:''}${esc(nm)}</div>`:'';
    return `<div class="qpx-sec">${head}<div class="qpx-row${cl}">${x.P.map(fig).join('')}</div></div>`};
  return QPX_CSS+`<div class="qpx"><h3>${EN?'Pictures':'รูปประกอบ'}${bi?'<i class="en">Pictures</i>':''}</h3>${groups.map(sec).join('')}</div>`}
{const f=PRINT.quote;PRINT.quote=function(id,bq){let h=f.apply(this,arguments);const Q=qpxFind(id);if(!h||!Q||bq||(typeof qmMa==='function'&&qmMa(Q)))return h;
  const x=qpxPrint(Q);if(!x)return h;const k=h.lastIndexOf('<div class="qm-sg">');return k<0?h+x:h.slice(0,k)+x+h.slice(k)}}

// ---- the card's look on the screen
document.head.insertAdjacentHTML('beforeend',`<style>
.qpx-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;margin:8px 0 10px}
.qpx-it{display:flex;gap:10px;border:1px solid var(--line,#e2e8f0);border-radius:12px;padding:8px;align-items:flex-start}
.qpx-it img{width:120px;height:96px;object-fit:contain;border-radius:8px;background:#f4f6f9;flex:none}
.qpx-f{display:flex;flex-direction:column;gap:6px;flex:1;min-width:0}.qpx-f label{display:flex;flex-direction:column;gap:2px;font-size:12px;margin:0}
.qpx-f select,.qpx-f input{width:100%}
@media (max-width:600px){.qpx-g{grid-template-columns:1fr}.qpx-it img{width:96px;height:80px}}
</style>`);
