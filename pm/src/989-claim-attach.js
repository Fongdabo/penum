/* ---------- 4.99.35 ชุดเอกสารส่งงวด: เอกสารแนบท้าย (PDF / รูป) ----------
   User (2026-11-16, Noble QT-015 ล้าง AHU/CDU): "เพิ่มรายงานที่ทำไว้ มาแทนรูปดีกว่าไหม สำหรับงาน PM". A service job's claim is
   better backed by its PM report (photos with captions, readings, results per machine) and the customer's PO than by loose
   site photos, and those come as PDF files. Each claim can now carry files (b.atf [{id,name,n,pages:[keys],at}]): every PDF
   page is drawn once with pdf.js into a JPEG kept like a photo (IndexedDB 'ph-…', listed in photoKeys in 280 so backups,
   folder/cloud sync and phone exchange carry them), and the set prints the pages at its end, one per sheet. The cover letter
   names the files under สิ่งที่ส่งมาด้วย. A picture file goes in as one page. */
SUBPG.push(['att','เอกสารแนบท้าย (PDF)']);
const satFiles=b=>(b&&Array.isArray(b.atf)?b.atf:[]).filter(f=>f&&(f.pages||[]).length);
{const f=subPk;subPk=b=>{const r=f(b);r.att=satFiles(b).length&&!(b.pk&&b.pk.att!=null&&!b.pk.att)?1:0;return r}}
const satName=f=>String(f.name||'ไฟล์แนบ').replace(/\.(pdf|jpe?g|png|webp)$/i,'');
// one PDF page → a JPEG about 1240 px wide (A4 at 150 dpi), enough to read a report's small print
async function satPdf(file,tick){await libLoad('pdf.min.js');pdfjsLib.GlobalWorkerOptions.workerSrc='files/lib/pdf.worker.min.js';
  const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise,out=[];
  for(let i=1;i<=pdf.numPages;i++){tick(i,pdf.numPages);const pg=await pdf.getPage(i),v0=pg.getViewport({scale:1}),v=pg.getViewport({scale:Math.min(3,1240/v0.width)});
    const c=document.createElement('canvas');c.width=Math.round(v.width);c.height=Math.round(v.height);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
    await pg.render({canvasContext:x,viewport:v}).promise;out.push(c.toDataURL('image/jpeg',.82));c.width=c.height=0}
  return out}
ACT.subAtAdd=bt=>{const b=P.bills.find(y=>y.id===bt.dataset.id);if(!b)return;const fi=$('#fileIn');fi.accept='application/pdf,.pdf,image/*';fi.multiple=true;
  fi.onchange=async()=>{const fs=[...fi.files];fi.value='';fi.multiple=false;if(!fs.length)return;let pages=0;
    for(const file of fs){try{const pdf=/\.pdf$/i.test(file.name)||file.type==='application/pdf';
        const L=pdf?await satPdf(file,(i,t)=>toast(`กำลังแปลง ${file.name} หน้า ${i}/${t}`)):[await shrink(file,1600,.85)],keys=[];
        for(const d of L){const k='ph-'+uid();await IDB.put(k,d);phCache[k]=d;keys.push(k)}
        (b.atf=b.atf||[]).push({id:uid(),name:file.name,n:keys.length,pages:keys,at:today()});pages+=keys.length}
      catch(e){console.warn("subAtAdd",file.name,e);toast(`แนบ ${file.name} ไม่ได้ (ไฟล์เสียหรือมีรหัสผ่าน)`)}}
    if(pages){b.pk=Object.assign(subPk(b),b.pk||{},{att:1});save();render();toast(`แนบแล้ว ${pages} หน้า`)}};
  fi.click()};
ACT.subAtDel=bt=>{const b=P.bills.find(y=>y.id===bt.dataset.id);if(!b)return;const i=(b.atf||[]).findIndex(f=>f.id===bt.dataset.k);if(i<0)return;
  const f=b.atf[i];if(!confirm(`เอา “${f.name}” ออกจากชุดส่งงวด?`))return;b.atf.splice(i,1);(f.pages||[]).forEach(k=>{IDB.del(k).catch(()=>{});delete phCache[k]});
  if(!b.atf.length)delete b.atf;save();render()};
ACT.subAtUp=bt=>{const b=P.bills.find(y=>y.id===bt.dataset.id);if(!b||!b.atf)return;const i=b.atf.findIndex(f=>f.id===bt.dataset.k);if(i<1)return;
  [b.atf[i-1],b.atf[i]]=[b.atf[i],b.atf[i-1]];save();render()};
// the card: the attached files under the page ticks, with + แนบไฟล์
{const f=subCard;subCard=function(b){const h=f.apply(this,arguments),A=satFiles(b),on=subPk(b).att;
  const row=`<div class="sat-row"><b>📎 เอกสารแนบท้ายชุด</b>${A.length?A.map((x,i)=>`<span class="sat-f${on?'':' off'}" title="แนบเมื่อ ${esc(thD(x.at||''))}">${esc(satName(x))} <small>(${x.pages.length} หน้า)</small>${i?`<button type="button" data-a="subAtUp" data-id="${b.id}" data-k="${x.id}" title="เลื่อนขึ้น" aria-label="เลื่อนขึ้น">↑</button>`:''}<button type="button" data-a="subAtDel" data-id="${b.id}" data-k="${x.id}" title="เอาออก" aria-label="เอาออก">✕</button></span>`).join(''):'<span class="muted">ยังไม่มี เช่น รายงาน PM ใบตรวจรับ สำเนา PO</span>'}
    <button type="button" class="btn sm" data-a="subAtAdd" data-id="${b.id}">+ แนบไฟล์ PDF / รูป</button>${A.length&&!on?'<span class="muted">(ไม่ได้ติ๊ก จะไม่พิมพ์)</span>':''}</div>`;
  const k=h.indexOf('<p class="hint">ผลงานสะสมที่ขอเบิก');return k<0?h+row:h.slice(0,k)+row+h.slice(k)}}
// the cover letter names the files instead of the box label
{const f=subLetter;subLetter=function(b,x,pk){const h=f.apply(this,arguments),A=satFiles(b);if(!pk.att||!A.length)return h;
  return h.replace('เอกสารแนบท้าย (PDF)','เอกสารแนบท้าย: '+A.map(y=>`${esc(satName(y))} (${y.pages.length} หน้า)`).join(', '))}}
// the pages at the end of the set, one per sheet, scaled to fit inside the set's margins
{const f=PRINT.subm;PRINT.subm=id=>{const h=f(id),b=P.bills.find(y=>y.id===id);if(!b||!subPk(b).att)return h;
  const pg=satFiles(b).flatMap(x=>x.pages).map(k=>`<div class="sat-pg"><img data-ph="${k}" alt=""></div>`);if(!pg.length)return h;
  return (h?[h,...pg]:pg).join(subBr)}}
document.head.insertAdjacentHTML('beforeend',`<style>
.sat-row{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;margin:10px 0 2px;font-size:13.5px}
.sat-f{display:inline-flex;gap:4px;align-items:center;padding:3px 4px 3px 10px;border:1px solid var(--line);border-radius:8px;background:var(--sunk,transparent)}
.sat-f.off{opacity:.55}.sat-f small{color:var(--muted)}
.sat-f button{border:0;background:none;color:var(--muted);cursor:pointer;padding:0 4px;font-size:13px}.sat-f button:hover{color:var(--danger,#b3261e)}
#print .sat-pg{text-align:center;break-inside:avoid;page-break-inside:avoid}
#print .sat-pg img{display:inline-block;max-width:100%;max-height:247mm;width:auto;height:auto;border:1px solid #DDE3E5}
</style>`);
if(typeof SBKW==='object')SBKW['pj.cost.bill']=(SBKW['pj.cost.bill']||'')+' แนบไฟล์ เอกสารแนบ แนบ PDF รายงาน PM แนบ PO ชุดส่งงวด';
