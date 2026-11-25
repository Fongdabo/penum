/* ---------- 4.99.69 ชุดเอกสารส่งงวด: PO ลูกค้า แนบให้อัตโนมัติ ----------
   User (2026-11-25): "แยก ดึงไฟล์ PO ของโครงการมาแนบให้อัตโนมัติ". The customer's PO is what their accounts check a claim
   against (above all งวดที่ 1 "Down payment with PO"), so the set gets its own "PO ลูกค้า" box. It takes the PO file already
   kept with the project (P.info.poFile, 790: 📄 ดึงจากชื่อไฟล์ PO / สัญญา) instead of attaching it by hand to every claim.
   Its pages are drawn once into JPEGs like 989-claim-attach (P.info.poPages {src,pages}, listed in photoKeys in 280), the
   box is ticked by itself when the file is there, the cover letter names the PO number, and the pages print right after
   the set's own pages (before the other attachments). No file yet: the card says so and offers to attach it once. */
SUBPG.splice((i=>i<0?SUBPG.length:i)(SUBPG.findIndex(x=>x[0]==='att')),0,['po','PO ลูกค้า']);
const spoF=()=>(P&&P.info&&P.info.poFile)||null;
const spoOk=f=>!!f&&(/pdf|image/.test(f.type||'')||/\.(pdf|png|jpe?g|webp|gif)$/i.test(f.name||''));
const spoPages=()=>{const f=spoF(),G=P&&P.info&&P.info.poPages;return f&&G&&G.src===f.k&&Array.isArray(G.pages)?G.pages:[]};
{const f=subPk;subPk=b=>{const r=f(b);r.po=spoOk(spoF())&&!(b.pk&&b.pk.po!=null&&!b.pk.po)?1:0;return r}}
// the PO's pages, drawn once per file (a new PO file replaces the old pages)
let SPO_BUSY='',SPO_ERR='';
async function spoPrep(){const p=P,f=spoF();if(!f||!spoOk(f)||spoPages().length||SPO_BUSY===f.k||SPO_ERR===f.k)return;SPO_BUSY=f.k;
  try{const v=await phSrc(f.k);if(!v){SPO_ERR=f.k;return}
    const pdf=/pdf/.test(f.type||'')||/\.pdf$/i.test(f.name||''),blob=await (await fetch(v)).blob();
    const L=pdf?await satPdf(blob,(i,t)=>{if(t>1)toast(`กำลังเตรียม PO หน้า ${i}/${t}`)}):[await shrink(new File([blob],f.name,{type:blob.type||f.type}),1600,.85)],keys=[];
    for(const d of L){const k='ph-'+uid();await IDB.put(k,d);phCache[k]=d;keys.push(k)}
    if(p!==P||!spoF()||spoF().k!==f.k){keys.forEach(k=>{IDB.del(k).catch(()=>{});delete phCache[k]});return}
    const old=P.info.poPages;if(old&&Array.isArray(old.pages))old.pages.forEach(k=>{IDB.del(k).catch(()=>{});delete phCache[k]});
    P.info.poPages={src:f.k,pages:keys,at:today()};save();render()}
  catch(e){console.warn('spoPrep',e);SPO_ERR=f.k;render()}finally{if(SPO_BUSY===f.k)SPO_BUSY=''}}
ACT.spoRetry=()=>{SPO_ERR='';spoPrep()};
// the card: the box shows the PO number, and a row under the ticks says what will be attached
{const f=subCard;subCard=function(b){let h=f.apply(this,arguments);const I=P.info,F=spoF(),ok=spoOk(F),G=spoPages(),on=subPk(b).po,no=I.contractNo||'';
  if(!ok&&b.pk)delete b.pk.po;// with no file the box means nothing: don't keep it off for when the file comes
  if(ok&&!G.length)setTimeout(spoPrep,0);
  const lab=F?(ok?` <small class="muted">(${G.length?G.length+' หน้า':'กำลังเตรียม…'})</small>`:' <small class="muted">(ไฟล์ Excel พิมพ์ในชุดไม่ได้)</small>'):' <small class="muted">(ยังไม่มีไฟล์ PO)</small>';
  h=h.replace(/(<input type="checkbox" data-t="chk" data-p="bills\.[^"]+\.pk\.po"[^>]*)>PO ลูกค้า/,(m,a)=>`${a}${ok?'':' disabled'}>PO ลูกค้า${lab}`);
  const st=!F?'':!ok?`<span class="muted">${esc(F.name)} เป็นไฟล์ที่พิมพ์ไม่ได้ แนบ PO เป็น PDF หรือรูปแทน</span>`
    :SPO_ERR===F.k&&!G.length?`<span class="spo-bad">เปิดไฟล์ PO ในเครื่องนี้ไม่ได้ เปิดจากเครื่องที่แนบไฟล์ หรือแนบใหม่</span><button type="button" class="btn sm" data-a="spoRetry">ลองอีกครั้ง</button>`
    :!G.length?'<span class="muted">กำลังเตรียมหน้า PO…</span>':!on?'<span class="muted">(ไม่ได้ติ๊ก จะไม่พิมพ์)</span>':`<span class="muted">พิมพ์ต่อจากเอกสารในชุด ${G.length} หน้า</span>`;
  const row=`<div class="sat-row spo-row"><b>🧾 PO ลูกค้า</b>${F?`<span>เลขที่ <b>${no?esc(no):'<span class="spo-bad">ยังไม่ใส่</span>'}</b></span><button type="button" class="po-pick po-view" data-a="poView" title="แนบเมื่อ ${esc(thDL(F.date||''))}">📄 ${esc(F.name)}</button>${st}<button type="button" class="btn sm" data-a="poPick" data-p="info.contractNo">เปลี่ยนไฟล์ PO</button>`
    :`<span class="muted">ยังไม่ได้เก็บไฟล์ PO ของโครงการ${no?` (เลขที่ ${esc(no)})`:''} แนบครั้งเดียว ทุกงวดจะดึงไปแนบให้เอง</span><button type="button" class="btn sm pri" data-a="poPick" data-p="info.contractNo">+ แนบไฟล์ PO</button>`}</div>`;
  const k0=h.indexOf('<div class="sat-row">'),k=k0>=0?k0:h.indexOf('<p class="hint">ผลงานสะสมที่ขอเบิก');return k<0?h+row:h.slice(0,k)+row+h.slice(k)}}
// the cover letter: "สำเนาใบสั่งซื้อ / ใบสั่งจ้าง (PO) เลขที่ …" in สิ่งที่ส่งมาด้วย
{const f=subLetter;subLetter=function(b,x,pk){const h=f.apply(this,arguments);if(!pk.po)return h;const no=P.info.contractNo,G=spoPages();
  return h.replace(/(>\s*(?:\d+\.\s*)?)PO ลูกค้า(?=\s*<)/,`$1สำเนาใบสั่งซื้อ / ใบสั่งจ้าง (PO)${no?' เลขที่ '+esc(no):''}${G.length?` (${G.length} หน้า)`:''}`)}}
// the pages: after the set's own pages, before 989-claim-attach's files
{const f=PRINT.subm;PRINT.subm=id=>{const h=f(id),b=P.bills.find(y=>y.id===id);if(!b||!subPk(b).po)return h;const G=spoPages();if(!G.length)return h;
  const no=P.info.contractNo,pg=G.map((k,i)=>`<div class="spo-pg"><div class="spo-cap">สำเนา PO ลูกค้า${no?' เลขที่ '+esc(no):''}${G.length>1?` · หน้า ${i+1}/${G.length}`:''}</div><img data-ph="${k}" alt=""></div>`).join(subBr);
  const at='<div class="sat-pg">',j=h.indexOf(subBr+at);if(j>=0)return h.slice(0,j)+subBr+pg+h.slice(j);if(h.startsWith(at))return pg+subBr+h;return h?h+subBr+pg:pg}}
document.head.insertAdjacentHTML('beforeend',`<style>
.spo-row .po-view{margin:0}.spo-bad{color:var(--danger,#b3261e)}
#print .spo-pg{text-align:center;break-inside:avoid;page-break-inside:avoid}
#print .spo-cap{text-align:left;font-size:11.5px;color:#55666C;margin:0 0 2mm}
#print .spo-pg img{display:inline-block;max-width:100%;max-height:240mm;width:auto;height:auto;border:1px solid #DDE3E5}
</style>`);
if(typeof SBKW==='object')SBKW['pj.cost.bill']=(SBKW['pj.cost.bill']||'')+' PO ลูกค้า แนบ PO ใบสั่งซื้อ ใบสั่งจ้าง Down payment';
