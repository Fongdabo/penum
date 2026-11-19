/* ---------- 4.99.59 แบ่งจอ TOR shows the TOR file itself ----------
   User (2026-11-19, after 4.99.58): "ทำไมไม่เหมือนไฟล์ที่ส่งให้", and sent the original ขอบเขตขอ2.docx again. The right side of แบ่งจอ
   on ข้อกำหนดสำคัญ now shows the customer's own file as it looks: Word (.docx) through docx-preview (files/lib, Apache-2.0, with JSZip),
   PDF pages through pdf.js, pictures as they are. A choice in the title row picks which attached file, or ใบตอบ TOR (4.99.58). พิมพ์ใบตอบ TOR
   still prints the answer sheet. Clicking a clause in the table brings it into view in a Word file too (its text is searched for).
   A file is drawn once and kept while the page is open, so typing in the table does not redraw it. */
const TORFV={},TORFV_EL={};let TORFV_PR=0;
const torfvFiles=t=>(t.files||[]).filter(f=>f&&f.k&&/\.(docx|pdf|png|jpe?g|gif|webp)$/i.test(f.name||'')||/^(application\/pdf|image\/)|wordprocessingml/.test(f&&f.type||''));
// what the split shows for one TOR: a file id, or 'sheet'; the first file the TOR has (its own TOR file before others) unless picked
const torfvPick=t=>{const L=torfvFiles(t),v=TORFV[t.id];if(v==='sheet')return null;return L.find(f=>f.id===v)||L.find(f=>f.ft==='tor')||L[0]||null};
{const f=ACT.print;ACT.print=function(){TORFV_PR++;try{return f.apply(this,arguments)}finally{TORFV_PR--}}}
{const f=PRINT.tor;PRINT.tor=function(id){const t=torCfg().find(x=>x.id===id),x=t&&!TORFV_PR&&torfvPick(t);if(!x)return f.apply(this,arguments);
  return `<div class="torfv" data-k="${esc(x.k)}" data-n="${esc(x.name||'')}" data-t="${esc(x.type||'')}" style="margin:-10mm -10mm 0;min-height:60mm"></div>`}}
function torfvLib(src,ok){return new Promise((res,rej)=>{if(ok())return res();const s=document.createElement('script');s.src='files/lib/'+src;s.onload=()=>res();s.onerror=()=>rej(new Error('lib'));document.head.appendChild(s)})}
async function torfvDraw(k,name,type){const box=document.createElement('div');box.className='torfv-in';
  const v=await phSrc(k);if(!v){box.innerHTML='<p style="padding:20px">ไม่พบไฟล์ในเครื่องนี้ ให้เครื่องที่แนบไฟล์เชื่อมคลาวด์หรือโฟลเดอร์ก่อน</p>';return box}
  const blob=await (await fetch(v)).blob(),ty=blob.type||type||'';
  if(/\.docx$/i.test(name)||/wordprocessingml/.test(ty)){await torfvLib('jszip.min.js',()=>window.JSZip);await torfvLib('docx-preview.min.js',()=>window.docx&&window.docx.renderAsync);
    const st=document.createElement('div');box.appendChild(st);const body=document.createElement('div');box.appendChild(body);
    await docx.renderAsync(blob,body,st,{inWrapper:false,ignoreWidth:true,ignoreHeight:true,breakPages:true,experimental:true,useBase64URL:true});
    box.insertAdjacentHTML('afterbegin','<style>.torfv-in section.docx{padding:12mm 14mm!important;margin:0 0 6px!important;box-shadow:none!important;background:#fff!important;min-height:0!important}.torfv-in .tq-hl{outline:2px solid #1C8F9B;outline-offset:2px;background:#E8F6F7}</style>');return box}
  if(/\.pdf$/i.test(name)||/pdf/.test(ty)){await libLoad('pdf.min.js');pdfjsLib.GlobalWorkerOptions.workerSrc='files/lib/pdf.worker.min.js';
    const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await blob.arrayBuffer())}).promise;
    for(let i=1;i<=pdf.numPages;i++){const pg=await pdf.getPage(i),vp=pg.getViewport({scale:1.6}),c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;
      await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;const im=new Image();im.src=c.toDataURL('image/jpeg',.85);im.style.cssText='display:block;width:100%;margin:0 0 6px;border-bottom:1px solid #ccc';box.appendChild(im)}
    return box}
  const im=new Image();im.src=v;im.style.cssText='display:block;max-width:100%';box.appendChild(im);return box}
// fill each placeholder from the drawn file (drawn once per file)
function torfvFill(root){if(!root)return;root.querySelectorAll('.torfv').forEach(ph=>{const k=ph.dataset.k;let e=TORFV_EL[k];
  if(e&&e.done){ph.replaceChildren(e.box);return}
  ph.innerHTML='<p style="padding:20px;color:#6B7F87">กำลังเปิดไฟล์ TOR…</p>';if(e)return;
  TORFV_EL[k]=e={done:false};torfvDraw(k,ph.dataset.n,ph.dataset.t).catch(err=>{console.warn('torfv',err);const b=document.createElement('div');b.innerHTML='<p style="padding:20px">แสดงไฟล์นี้ไม่ได้ กด เปิด ที่ช่องไฟล์ TOR แทน</p>';return b})
    .then(box=>{e.box=box;e.done=true;document.querySelectorAll('section.qtab-sp>.qpv').forEach(v=>torfvFill(v.shadowRoot));torfvFill($('#print'))})})}
{const r=render;render=function(){const x=r.apply(this,arguments);try{document.querySelectorAll('section.qtab-sp>.qpv').forEach(v=>torfvFill(v.shadowRoot))}catch(e){console.error(e)}return x}}
if(typeof ACT.spPv==='function'){const f=ACT.spPv;ACT.spPv=function(){const x=f.apply(this,arguments);torfvFill($('#print'));return x}}
// the choice in the ข้อกำหนดสำคัญ title row: which file the split shows, or the answer sheet
{const f=torOne;torOne=function(t){const h=f.apply(this,arguments),L=torfvFiles(t);if(!L.length)return h;const x=torfvPick(t),k='<button type="button" class="btn sm" data-a="print" data-k="tor"';
  const sel=`<select data-tfv="${t.id}" title="แบ่งจอแสดงอะไรด้านขวา" style="max-width:260px">${L.map(f=>`<option value="${f.id}"${x&&x.id===f.id?' selected':''}>แบ่งจอ: ${esc(f.name||'ไฟล์ TOR')}</option>`).join('')}<option value="sheet"${x?'':' selected'}>แบ่งจอ: ใบตอบ TOR</option></select>`;
  return h.includes(k)?h.replace(k,sel+k):h}}
document.addEventListener('change',e=>{const s=e.target.closest&&e.target.closest('select[data-tfv]');if(!s)return;TORFV[s.dataset.tfv]=s.value;render()});
// a clause clicked in the table: find its words in the Word file beside it
const torfvNorm=s=>String(s||'').replace(/[\s​]/g,'');
document.addEventListener('focusin',e=>{const p=e.target&&e.target.dataset&&e.target.dataset.p,m=p&&p.match(/^co\.tors\.([^.]+)\.req\.([^.]+)\./);if(!m)return;
  const v=document.querySelector('section.qtab-sp>.qpv'),R=v&&v.shadowRoot,box=R&&R.querySelector('.torfv .torfv-in');if(!box)return;
  const t=torCfg().find(x=>x.id===m[1]),r=t&&(t.req||[]).find(x=>x.id===m[2]);if(!r)return;let w=torfvNorm(String(r.t||'').split(':').pop()).slice(0,24);if(w.length<6)w=torfvNorm(r.t).slice(0,24);if(w.length<4)return;
  const P=[...box.querySelectorAll('p,td,li')].find(x=>torfvNorm(x.textContent).includes(w));box.querySelectorAll('.tq-hl').forEach(x=>x.classList.remove('tq-hl'));if(!P)return;P.classList.add('tq-hl');
  const top=P.getBoundingClientRect().top-v.getBoundingClientRect().top;v.scrollTo({top:v.scrollTop+top-v.clientHeight/3,behavior:'smooth'})});
