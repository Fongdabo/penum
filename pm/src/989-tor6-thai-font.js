/* ---------- 4.99.60 แบ่งจอ TOR: Thai text in a Word file still reads right when its font is not on this computer ----------
   User (2026-11-19, ขอบเขตขอ2.docx in TH SarabunPSK 16): "ตรวจสอบฟอนต์ อักษรแล้วใช่ไหม". docx-preview (4.99.59) writes the file's own
   font names; a computer without them fell back to whatever font it had, so lines looked cramped. Sarabun (SIL OFL, files/fonts) now
   stands in after the file's font: the computer's own TH SarabunPSK is still used when it is there. TH Sarabun at 16 pt is the size of
   Sarabun at about 12 pt, so the stand-in for the TH Sarabun family is drawn at 75 %. */
{const U='files/fonts/sarabun-',TH='U+0E01-0E5B,U+200C-200D,U+25CC',f=(fam,adj)=>[400,700].map(w=>`@font-face{font-family:"${fam}";font-weight:${w};font-display:swap;${adj?`size-adjust:${adj};`:''}src:url(${U}thai-${w}-normal.woff2) format("woff2");unicode-range:${TH}}
@font-face{font-family:"${fam}";font-weight:${w};font-display:swap;${adj?`size-adjust:${adj};`:''}src:url(${U}latin-${w}-normal.woff2) format("woff2");unicode-range:U+0000-00FF,U+2000-206F,U+20AC,U+2122}`).join('\n');
  document.head.insertAdjacentHTML('beforeend',`<style id="torfvFonts">${f('PenumSarabunTH','75%')}\n${f('PenumSarabun','')}</style>`)}
// after the file's own font: the stand-in that matches its size
const torfvFam=s=>String(s).replace(/font-family\s*:\s*([^;}"]*(?:"[^"]*"[^;}"]*)*)(;|}|$)/gi,(m,v,e)=>/Penum/.test(v)?m:`font-family:${v.trim()},${/sarabun|angsana|cordia|browallia|\bTH /i.test(v)?'PenumSarabunTH':'PenumSarabun'}${e}`);
{const f=torfvDraw;torfvDraw=async function(){const box=await f.apply(this,arguments);try{
  box.querySelectorAll('style').forEach(s=>{if(/font-family/i.test(s.textContent))s.textContent=torfvFam(s.textContent)});
  box.querySelectorAll('[style*="font-family"]').forEach(e=>e.setAttribute('style',torfvFam(e.getAttribute('style'))));
  box.style.fontFamily='PenumSarabun,sans-serif'}catch(e){console.warn('torfv font',e)}return box}}
