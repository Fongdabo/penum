/* ---------- 4.96 ตั้งลายเซ็น next to พิมพ์ใบเสนอราคา (user: "ใส่รายเซ็นยังไง", "กดแล้วขึ้นแบบนี้") ----------
   The "who signs where" dialog (860) only opens once someone has a saved signature, so a company that never set one printed
   straight to the browser and could not tell where signatures come from. While the signed-in person has none (or, signed in
   as the administrator, nobody has one), the quote card shows a ✍ ตั้งลายเซ็น button beside the print button.
   4.97 (user: "มีแล้วนะ"): signatures were set but this device had ถามเรื่องลายเซ็นทุกครั้งที่กดพิมพ์ unticked (ESASK = '0'), so print
   skipped the dialog. When the device is opted out and someone has a signature, the button is ✍ พิมพ์พร้อมลายเซ็น: it prints the
   quote with the dialog this once (ESASK is '1' only for that print call; the opt-out stays unless the dialog's own box is changed). */
const esgAny=()=>(CO().staff||[]).some(s=>s.active!==false&&s.sig);
const esgNeed=()=>{const u=typeof me==='function'&&me();if(u)return !u.sig;return !(CO().staff||[]).some(s=>s.active!==false&&s.sig)};
let esgF=0;
{const p=window.print;window.print=function(){if(!esgF||Date.now()-esgF>60000)return p.apply(this,arguments);esgF=0;let o=null;
  try{o=localStorage.getItem(ESASK);localStorage.setItem(ESASK,'1')}catch(e){}
  try{return p.apply(this,arguments)}finally{try{if(o==null)localStorage.removeItem(ESASK);else localStorage.setItem(ESASK,o)}catch(e){}}}}
ACT.esgPrint=b=>{const pb=document.querySelector(`#view button[data-a="print"][data-k="quote"][data-id="${b.dataset.id}"]`);if(!pb)return;esgF=Date.now();pb.click()};
{const f=salesQuote;salesQuote=function(){const h=f.apply(this,arguments),C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote);
  if(Q&&!esAsk()&&esgAny())return h.replace(/(<button type="button" class="btn sm" data-a="print" data-k="quote"[^>]*>[^<]*<\/button>)/,`$1<button type="button" class="btn sm" data-a="esgPrint" data-id="${Q.id}" title="เครื่องนี้ตั้งไว้ไม่ให้ถามเรื่องลายเซ็นตอนพิมพ์ ปุ่มนี้พิมพ์โดยถามว่าจะใส่ลายเซ็นของใครในช่องไหน">✍ พิมพ์พร้อมลายเซ็น</button>`);
  if(!esgNeed())return h;const u=me();
  const b=u?`<button type="button" class="btn sm" data-a="esigEdit" title="ตั้งลายเซ็นครั้งเดียว ตอนกดพิมพ์ระบบจะถามว่าจะใส่ลายเซ็นของใครในช่องไหน">✍ ตั้งลายเซ็น</button>`
    :`<button type="button" class="btn sm" data-a="go" data-m="co" data-k="coset" title="ยังไม่มีใครตั้งลายเซ็น ตั้งได้ที่ ตั้งค่าบริษัท › ลายเซ็นอิเล็กทรอนิกส์">✍ ตั้งลายเซ็น</button>`;
  return h.replace(/(<button type="button" class="btn sm" data-a="print" data-k="quote"[^>]*>[^<]*<\/button>)/,`$1${b}`)}}
{const g=ACT.go;ACT.go=(b,e)=>{const r=g(b,e);if(b.dataset.k==='coset'&&b.textContent.includes('ลายเซ็น'))setTimeout(()=>{const c=$('#esigCard');if(c)c.scrollIntoView({block:'start'})},60);return r}}
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'✍ ตั้งลายเซ็น':'✍ Set signature','✍ พิมพ์พร้อมลายเซ็น':'✍ Print with signatures',
  'เครื่องนี้ตั้งไว้ไม่ให้ถามเรื่องลายเซ็นตอนพิมพ์ ปุ่มนี้พิมพ์โดยถามว่าจะใส่ลายเซ็นของใครในช่องไหน':'This device skips the signature question when printing; this button prints and asks whose signature goes where',
  'ตั้งลายเซ็นครั้งเดียว ตอนกดพิมพ์ระบบจะถามว่าจะใส่ลายเซ็นของใครในช่องไหน':'Set it once; when you print, you choose whose signature goes in which box',
  'ยังไม่มีใครตั้งลายเซ็น ตั้งได้ที่ ตั้งค่าบริษัท › ลายเซ็นอิเล็กทรอนิกส์':'Nobody has a signature yet; set one in Company settings › Electronic signatures'});
