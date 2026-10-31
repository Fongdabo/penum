/* ---------- 4.99.20–4.99.21 a letter stays on one A4 page (user: "กระดาษหลุด", "ยังหลุดอยู่นะ", "ปรับตัวหนังสือลงอีกไหม") ----------
   The Thai letters (.lt2: ชุดส่งงวด 620, หยุดงาน 942, เช็ค 944) ran onto a second page once a signature picture and the
   "ลงนามแทนโดย …" line (860, added at print time) were in. The type is a little smaller for every letter now, the signature
   block (ขอแสดงความนับถือ → signature → name → title → company → ลงนามแทนโดย) never splits, and just before printing the
   letter is measured with the print rules switched on (the letterhead as printed included) and steps its type and spacing
   down until it ends on the first page. 4.99.20 measured on screen and guessed the letterhead, which was too short. */
document.head.insertAdjacentHTML('beforeend',`<style>
#print .lt2{font-size:14.5px;line-height:1.7}
#print .lt2 .lt-p{margin-top:10px}
#print .lt2 .lt-sign{break-inside:avoid;page-break-inside:avoid}
#print .lt2 .esig-for{display:block;font-size:11.5px;line-height:1.4;font-weight:400;color:#333;margin-top:2px}
#print .lt2.ltf1{font-size:14px;line-height:1.6}#print .lt2.ltf1 .lt-p{margin-top:7px}#print .lt2.ltf1 .lt-date{margin-bottom:8px}#print .lt2.ltf1 .lt-r{margin-bottom:4px}#print .lt2.ltf1 .lt-sign{margin-top:12px;line-height:1.5}#print .lt2.ltf1 .lt-ct{margin-top:12px}
#print .lt2.ltf2{font-size:13.5px;line-height:1.5}#print .lt2.ltf2 .lt-p{margin-top:5px}#print .lt2.ltf2 .lt-date{margin-bottom:5px}#print .lt2.ltf2 .lt-r{margin-bottom:2px}#print .lt2.ltf2 .lt-sign{margin-top:8px;line-height:1.4}#print .lt2.ltf2 .lt-ln{height:40px}#print .lt2.ltf2 .lt-ct{margin-top:8px}
#print .lt2.ltf3{font-size:13px;line-height:1.42}#print .lt2.ltf3 .lt-p{margin-top:3px}#print .lt2.ltf3 .lt-top{margin-top:4px}#print .lt2.ltf3 .lt-date{margin-bottom:3px}#print .lt2.ltf3 .lt-r{margin-bottom:1px}#print .lt2.ltf3 .lt-sign{margin-top:4px;line-height:1.32}#print .lt2.ltf3 .lt-ln{height:36px}#print .lt2.ltf3 .lt-ct{margin-top:5px}
</style>`);
const LTF_MM=96/25.4;
// the page's own @media print rules, to switch them on for a moment while measuring
function ltPrintCss(){const out=[];const walk=R=>{for(const r of R){if(r.media&&r.cssRules){const m=r.media.mediaText||'';if(/\bprint\b/.test(m)&&!/\bscreen\b/.test(m))for(const x of r.cssRules)out.push(x.cssText);else if(!/\bprint\b/.test(m))walk(r.cssRules)}}};
  for(const s of document.styleSheets){try{walk(s.cssRules)}catch(e){}}return out.join('\n')}
function ltFit(){const el=$('#print');if(!el)return;const L=[...el.querySelectorAll('.lt2')];if(!L.length)return;
  // the signed-for line goes at the very end of the signature block, under the company name (4.99.20 put it under the name)
  L.forEach(lt=>lt.querySelectorAll('.lt-sign .esig-for').forEach(f=>{const sg=f.closest('.lt-sign');if(sg.lastElementChild!==f)sg.appendChild(f)}));
  const st=document.createElement('style');st.textContent=ltPrintCss()+'\nhtml body #print{display:block!important;position:absolute!important;left:0!important;top:0!important;width:210mm!important;margin:0!important;padding:0!important;visibility:hidden!important}';
  document.head.appendChild(st);
  try{const brk=[...el.querySelectorAll('div')].filter(d=>/page-break-before:\s*always|break-before:\s*page/.test(d.getAttribute('style')||''));
    const room=(297-10-15-3)*LTF_MM;// A4 less 720's frame (10 mm top, 15 mm foot) and 3 mm to spare
    L.forEach(lt=>{lt.classList.remove('ltf1','ltf2','ltf3');
      // the letter's page starts at the last forced break before it, or at the top of the printout
      const b=brk.filter(d=>d.compareDocumentPosition(lt)&Node.DOCUMENT_POSITION_FOLLOWING).pop(),c=lt.closest('.pgc'),
        top=b?b.getBoundingClientRect().bottom:(c||el).getBoundingClientRect().top;
      const h=()=>lt.getBoundingClientRect().bottom-top,h0=Math.round(h()/LTF_MM);let k=0;
      while(h()>room&&k<3){if(k)lt.classList.remove('ltf'+k);k++;lt.classList.add('ltf'+k)}
      lt.dataset.fit=k+':'+h0+'→'+Math.round(h()/LTF_MM)+'mm'})}
  finally{st.remove()}}
window.addEventListener('beforeprint',()=>{const el=$('#print');if(el)el.classList.toggle('mixo',!!el.querySelector('.sub-pp'));try{ltFit()}catch(e){}});
/* 4.99.21 landscape sheets of the set (Progress Payment 745, แผนงาน + S-Curve 943): Chrome draws the page footer (720's fixed
   .ofoot) at its portrait-page place on them too, which lands across the middle of the sheet (user's S-Curve page). The sheet now
   paints over it with a white background, and the S-Curve page is a full page so the footer never shows through. Portrait pages
   after a landscape one got a second footer across their middle: in a set with landscape sheets the page body (720's frame cell)
   also paints over the footer, which still shows in the frame's empty foot. */
document.head.insertAdjacentHTML('beforeend',`<style>@media print{
#print .sub-pp{position:relative;z-index:3;background:#fff}
#print.mixo table.pgw>tbody>tr>td.pgc{position:relative;z-index:3;background:#fff}
#print .sub-plan .gp-s{min-height:168mm;background:#fff}
#print .sub-plan .gp-s svg{max-height:140mm}
}</style>`);
