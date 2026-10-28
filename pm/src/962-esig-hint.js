/* ---------- 4.96 ตั้งลายเซ็น next to พิมพ์ใบเสนอราคา (user: "ใส่รายเซ็นยังไง", "กดแล้วขึ้นแบบนี้") ----------
   The "who signs where" dialog (860) only opens once someone has a saved signature, so a company that never set one printed
   straight to the browser and could not tell where signatures come from. While the signed-in person has none (or, signed in
   as the administrator, nobody has one), the quote card shows a ✍ ตั้งลายเซ็น button beside the print button. */
const esgNeed=()=>{const u=typeof me==='function'&&me();if(u)return !u.sig;return !(CO().staff||[]).some(s=>s.active!==false&&s.sig)};
{const f=salesQuote;salesQuote=function(){const h=f.apply(this,arguments);if(!esgNeed())return h;const u=me();
  const b=u?`<button type="button" class="btn sm" data-a="esigEdit" title="ตั้งลายเซ็นครั้งเดียว ตอนกดพิมพ์ระบบจะถามว่าจะใส่ลายเซ็นของใครในช่องไหน">✍ ตั้งลายเซ็น</button>`
    :`<button type="button" class="btn sm" data-a="go" data-m="co" data-k="coset" title="ยังไม่มีใครตั้งลายเซ็น ตั้งได้ที่ ตั้งค่าบริษัท › ลายเซ็นอิเล็กทรอนิกส์">✍ ตั้งลายเซ็น</button>`;
  return h.replace(/(<button type="button" class="btn sm" data-a="print" data-k="quote"[^>]*>[^<]*<\/button>)/,`$1${b}`)}}
{const g=ACT.go;ACT.go=(b,e)=>{const r=g(b,e);if(b.dataset.k==='coset'&&b.textContent.includes('ลายเซ็น'))setTimeout(()=>{const c=$('#esigCard');if(c)c.scrollIntoView({block:'start'})},60);return r}}
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'✍ ตั้งลายเซ็น':'✍ Set signature',
  'ตั้งลายเซ็นครั้งเดียว ตอนกดพิมพ์ระบบจะถามว่าจะใส่ลายเซ็นของใครในช่องไหน':'Set it once; when you print, you choose whose signature goes in which box',
  'ยังไม่มีใครตั้งลายเซ็น ตั้งได้ที่ ตั้งค่าบริษัท › ลายเซ็นอิเล็กทรอนิกส์':'Nobody has a signature yet; set one in Company settings › Electronic signatures'});
