/* ---------- 4.99.62 พิมพ์ TOR: print the TOR file itself ----------
   User (2026-11-19, after 4.99.61): "ไม่มีให้ปริ้น TOR เลย". พิมพ์ใบตอบ TOR prints only the answer sheet, so ข้อกำหนดสำคัญ now also has
   พิมพ์ TOR, which prints the attached TOR file (the one the split shows, else the first): a Word file as docx-preview draws it (4.99.59,
   with the Thai stand-in font of 4.99.60) on A4 with the file's own page margins, PDF pages one per sheet, a picture fitted to the page.
   It prints from a hidden frame, so nothing on the page changes. */
const torpfFile=t=>{const L=torfvFiles(t);return torfvPick(t)||L.find(f=>f.ft==='tor')||L[0]||null};
{const f=torOne;torOne=function(t){const h=f.apply(this,arguments),x=torfvFiles(t).length&&torpfFile(t),k='<button type="button" class="btn sm" data-a="print" data-k="tor"';
  if(!x||!h.includes(k))return h;
  return h.replace(k,`<button type="button" class="btn sm" data-a="torPrintFile" data-id="${t.id}" title="พิมพ์ไฟล์ TOR: ${esc(x.name||'')}">พิมพ์ TOR</button>`+k)}}
ACT.torPrintFile=async function(el){const t=torCfg().find(x=>x.id===el.dataset.id),x=t&&torpfFile(t);if(!x)return;
  const old=el.textContent;el.disabled=true;el.textContent='กำลังเตรียมพิมพ์…';
  try{let e=TORFV_EL[x.k];const box=(e&&e.done&&e.box?e.box:await torfvDraw(x.k,x.name||'',x.type||'')).cloneNode(true);
    // the split's own look (narrow padding, highlight) is left out: the file's page margins go to @page instead
    box.querySelectorAll('style').forEach(s=>{if(/\.torfv-in section\.docx/.test(s.textContent))s.remove()});box.querySelectorAll('.tq-hl').forEach(n=>n.classList.remove('tq-hl'));
    const fr=document.createElement('iframe');fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';document.body.appendChild(fr);
    const d=fr.contentDocument,fonts=($('#torfvFonts')||{}).textContent||'';
    d.open();d.write(`<!doctype html><html><head><meta charset="utf-8"><base href="${esc(location.href)}"><title>${esc(x.name||'TOR')}</title><style>${fonts}
html,body{margin:0;background:#fff}@page{size:A4;margin:0}
section.docx{box-shadow:none!important;margin:0!important;background:#fff!important;min-height:0!important;width:auto!important;break-after:page}
section.docx:last-of-type{break-after:auto}.torfv-in>img{display:block;width:100%!important;max-width:100%;margin:0!important;border:0!important;break-after:page}
.torfv-in>img:last-child{break-after:auto}</style></head><body></body></html>`);d.close();
    d.body.appendChild(d.importNode(box,true));
    const s1=d.querySelector('section.docx');if(s1){const c=fr.contentWindow.getComputedStyle(s1),m=k=>parseFloat(c['padding'+k])||0;
      if(m('Top')||m('Left'))d.head.insertAdjacentHTML('beforeend',`<style>@page{size:A4;margin:${m('Top')}px ${m('Right')}px ${m('Bottom')}px ${m('Left')}px}section.docx{padding:0!important}</style>`)}
    await Promise.all([...d.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));
    try{await d.fonts.ready}catch(e){}
    const w=fr.contentWindow;w.addEventListener('afterprint',()=>setTimeout(()=>fr.remove(),500));setTimeout(()=>fr.remove(),600000);w.focus();w.print()}
  catch(err){console.warn('torPrintFile',err);toast('พิมพ์ไฟล์นี้ไม่ได้ กด เปิด ที่ช่องไฟล์ TOR แล้วพิมพ์จากโปรแกรมของไฟล์แทน')}
  finally{el.disabled=false;el.textContent=old}};
