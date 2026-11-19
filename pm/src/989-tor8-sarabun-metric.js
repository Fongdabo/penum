/* ---------- 4.99.63 TOR file: TH Sarabun drawn the same on every computer ----------
   User (2026-11-19, พิมพ์ TOR of 4.99.62 beside the file in Word): "ฟอนไม่เหมือน". The 75 % Sarabun stand-in (4.99.60) is a different
   design, and a computer's own font of that name could differ again, so numbers and English came out in another size and lines broke
   in other places. Text set in the TH Sarabun family (TH SarabunPSK, TH Sarabun New, …) is now always drawn in Laksaman (TLWG, from
   SIPA's TH Sarabun New, GPL-2+ with font exception, files/fonts): the same widths and line height as TH Sarabun, Thai, English and
   digits alike, so the split and พิมพ์ TOR wrap lines as Word does. Word's line spacing (single, 1.5 lines, …) is a multiple of the
   font's own line height, which for TH Sarabun is 1.94 times its size; docx-preview writes it as a multiple of the size, so lines sat
   on top of each other. Those multiples are scaled by 1.94 in a file that uses TH Sarabun. A tab that was not measured is ½ inch, Word's
   default stop, so first-line indents show. */
{const U='files/fonts/laksaman',F=[['',400,'normal'],['-bold',700,'normal'],['-italic',400,'italic'],['-bolditalic',700,'italic']]
  .map(([s,w,st])=>`@font-face{font-family:"PenumTHSarabun";font-weight:${w};font-style:${st};font-display:block;src:url(${U}${s}.woff2) format("woff2")}`).join('\n');
  const st=$('#torfvFonts');if(st)st.textContent+='\n'+F;else document.head.insertAdjacentHTML('beforeend',`<style id="torfvFonts">${F}</style>`)}
const TORFV_THLH=1.942,torfvLH=s=>String(s).replace(/line-height\s*:\s*([\d.]+)\s*(?=;|}|$)/gi,(m,v)=>`line-height:${(parseFloat(v)*TORFV_THLH).toFixed(3)}`);
const torfvTH=s=>String(s).replace(/font-family\s*:\s*([^;}"]*(?:"[^"]*"[^;}"]*)*)(;|}|$)/gi,(m,v,e)=>/sarabun/i.test(v)&&!/PenumTHSarabun/.test(v)?`font-family:PenumTHSarabun,PenumSarabun${e}`:m);
// loaded before the file is drawn: docx-preview measures tab widths as it draws
{const f=torfvDraw;torfvDraw=async function(){try{await Promise.all(['400 16px PenumTHSarabun','700 16px PenumTHSarabun','italic 400 16px PenumTHSarabun'].map(x=>document.fonts.load(x,'กa1')))}catch(e){}
  const box=await f.apply(this,arguments);try{
  const th=[...box.querySelectorAll('style')].some(s=>/sarabun/i.test(s.textContent))||!!box.querySelector('[style*="arabun"]');
  box.querySelectorAll('style').forEach(s=>{if(/sarabun/i.test(s.textContent))s.textContent=torfvTH(s.textContent);if(th&&/line-height/i.test(s.textContent))s.textContent=torfvLH(s.textContent)});
  // the paragraph's own (empty) line part is in the same font, so it does not add height of its own
  if(th)box.style.fontFamily='PenumTHSarabun,PenumSarabun,sans-serif';
  // a tab docx-preview could not measure (the file is drawn off the page) moves on to Word's default stop, ½ inch
  box.insertAdjacentHTML('afterbegin','<style>.torfv-in .docx-tab-stop:not([style*="width"]){display:inline-block;width:36pt}</style>');
  if(th)box.querySelectorAll('[style*="line-height"]').forEach(e=>e.setAttribute('style',torfvLH(e.getAttribute('style'))));
  box.querySelectorAll('[style*="font-family"]').forEach(e=>e.setAttribute('style',torfvTH(e.getAttribute('style'))));}catch(e){console.warn('torfv TH font',e)}return box}}
