/* ---------- 4.99.20 a letter stays on one A4 page (user: "กระดาษหลุด") ----------
   The Thai letters (.lt2: ชุดส่งงวด 620, หยุดงาน 942, เช็ค 944) are long enough that a signature picture plus the
   "ลงนามแทนโดย …" line (860, added at print time) pushed the end of the letter onto a second page. Just before printing:
   the "ลงนามแทน" line moves up under the signer's name in small type, then the letter is measured at A4 width and its type
   and spacing step down until it fits the page under the letterhead. */
document.head.insertAdjacentHTML('beforeend',`<style>
#print .lt2 .esig-for{display:block;font-size:12px;line-height:1.4;font-weight:400;color:#333}
#print .lt2.ltf1{font-size:14.5px;line-height:1.65}#print .lt2.ltf1 .lt-p{margin-top:10px}#print .lt2.ltf1 .lt-date{margin-bottom:10px}#print .lt2.ltf1 .lt-r{margin-bottom:5px}#print .lt2.ltf1 .lt-sign{margin-top:16px;line-height:1.55}#print .lt2.ltf1 .lt-ct{margin-top:18px}
#print .lt2.ltf2{font-size:13.5px;line-height:1.55}#print .lt2.ltf2 .lt-p{margin-top:7px}#print .lt2.ltf2 .lt-date{margin-bottom:6px}#print .lt2.ltf2 .lt-r{margin-bottom:3px}#print .lt2.ltf2 .lt-sign{margin-top:10px;line-height:1.45}#print .lt2.ltf2 .lt-ln{height:38px}#print .lt2.ltf2 .lt-ct{margin-top:10px}
#print .lt2.ltf3{font-size:12.5px;line-height:1.45}#print .lt2.ltf3 .lt-p{margin-top:5px}#print .lt2.ltf3 .lt-date{margin-bottom:4px}#print .lt2.ltf3 .lt-r{margin-bottom:2px}#print .lt2.ltf3 .lt-sign{margin-top:6px;line-height:1.35}#print .lt2.ltf3 .lt-ln{height:34px}#print .lt2.ltf3 .lt-ct{margin-top:6px}
</style>`);
const LTF_MM=96/25.4;
function ltFit(){const el=$('#print');if(!el)return;const L=[...el.querySelectorAll('.lt2')];if(!L.length)return;
  // the signed-for line sits under the name, not after the company name at the very bottom
  L.forEach(lt=>lt.querySelectorAll('.lt-sign .esig-for').forEach(f=>{const sg=f.closest('.lt-sign'),nm=[...sg.children].find(d=>/^\(.*\)$/.test(d.textContent.trim()));
    if(nm&&nm.nextSibling!==f)nm.after(f)}));
  // measure on screen at the printed width (A4 210 mm less the 10 mm sides of 720's frame)
  const old=el.getAttribute('style');el.style.cssText='display:block;position:absolute;left:-10000px;top:0;width:190mm;visibility:hidden';
  try{L.forEach(lt=>{lt.classList.remove('ltf1','ltf2','ltf3');
      // 297 mm less the frame's 10 mm top and 15 mm foot, less about 24 mm of letterhead (phead / ohead) above the letter
      const room=(297-10-15-24)*LTF_MM;let k=0;
      while(lt.offsetHeight>room&&k<3){if(k)lt.classList.remove('ltf'+k);k++;lt.classList.add('ltf'+k)}})}
  finally{if(old==null)el.removeAttribute('style');else el.setAttribute('style',old)}}
window.addEventListener('beforeprint',()=>{try{ltFit()}catch(e){}});
