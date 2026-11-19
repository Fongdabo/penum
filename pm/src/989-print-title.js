/* ---------- 4.99.54 the saved PDF's name is the printed document's (user, 2026-11-19, QT-021 saved as PDF offered
   "ระบบปรับอากาศ Variable Refrigerant Flow (VRF) _MITSUBISHI HEAVY DUTY_ – PENUM PM", another project's name: "ชื่องานเป็นอีกกับตอนเซฟ")
   720 names the page after the document when it is put in #print, but the title bar (shared/titlebar.js) writes the open project's
   name back on the next render, and a print often renders first (a Rev. kept, a save). The name is now set again right before the
   browser prints. */
const prtTitle=()=>{try{const el=$('#print');if(el&&el.textContent.trim())pgTitle()}catch(e){}};
window.addEventListener('beforeprint',prtTitle);
{const p=window.print;window.print=function(){prtTitle();return p.apply(this,arguments)}}
