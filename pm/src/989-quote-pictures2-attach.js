/* ---------- 4.99.51 รูปประกอบพิมพ์ต่อท้ายใบเสนอราคา (user, 2026-11-19, QT-021 with 5 pictures: "ปริ้นใบเสนอราคาแล้ว ไม่มีรูปแนบมาด้วย")
   The picture sheet (989-quote-pictures.js) still starts on its own page and never mixes into the quotation, but printing the
   quotation now adds it after the last page, so one print gives both. A tick on the pictures card (Q.picsSep) keeps them apart
   as before; พิมพ์รูปประกอบ still prints the sheet alone. The sheet's @page rule is made a named page so the quotation's own
   page size and margins are left as they were. */
const qpaOn=Q=>!!Q&&!Q.picsSep&&qpxList(Q).length>0&&!(typeof qmMa==='function'&&qmMa(Q));
// 4.99.65 no named page (989-quote-print-keep): the sheet's own @page rule is dropped and it prints in the quotation's page frame
const qpaSheet=Q=>`<div class="qpa-att" style="break-before:page;page-break-before:always">${qpxSheet(Q).replace(/@page\s*\{[^}]*\}/g,'')}</div>`;
{const f=PRINT.quote;PRINT.quote=function(id){const h=f.apply(this,arguments),Q=qpxFind(id);try{return h&&qpaOn(Q)?h+qpaSheet(Q):h}catch(e){return h}}}
{const f=qpxCard;qpxCard=function(Q){let h=f.apply(this,arguments);if(!h||!Q||!qpxList(Q).length)return h;
  h=h.replace('พิมพ์แยกเป็นเอกสารแนบ ไม่ปนในใบเสนอราคา',Q.picsSep?'พิมพ์แยกเป็นเอกสารแนบ ไม่ปนในใบเสนอราคา':'พิมพ์เป็นหน้าแนบต่อท้ายใบเสนอราคา');
  const k=h.lastIndexOf('</div></section>');if(k<0)return h;
  const t=`<label class="qpa-t"><input type="checkbox" data-p="co.quotes.${Q.id}.picsSep" data-t="chk"${Q.picsSep?' checked':''}> ไม่ต้องพิมพ์ต่อท้ายใบเสนอราคา (พิมพ์แยกด้วยปุ่มพิมพ์รูปประกอบ)</label>`;
  return h.slice(0,k)+t+h.slice(k)}}
document.head.insertAdjacentHTML('beforeend',`<style>.qpa-t{display:inline-flex;align-items:center;gap:6px;font-size:13px;margin:0 0 0 6px;color:var(--muted,#567080)}</style>`);
