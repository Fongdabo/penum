/* ---------- 3.36 printouts fit the page by themselves ----------
   When a document runs a little past a page (signature boxes alone on page 2, say), it is shrunk just enough to
   finish on one page fewer, instead of the user setting the scale by hand. Long documents keep their size.
   The print layout is measured in a hidden frame that applies the print styles as screen styles, at the paper's width. */
const MMPX=96/25.4;let FITF=null;
function fitFrame(){const css=[...document.querySelectorAll('style')].map(s=>s.textContent).join('\n').replace(/@media\s+print/g,'@media all'),
    links=[...document.querySelectorAll('link[rel=stylesheet]')].map(l=>l.outerHTML).join(''),key=css.length+':'+links.length;
  if(FITF&&FITF.key===key)return FITF.doc;
  if(!FITF){const f=document.createElement('iframe');f.setAttribute('aria-hidden','true');f.tabIndex=-1;f.style.cssText='position:fixed;left:-10000px;top:0;width:400mm;height:300mm;visibility:hidden;border:0';document.body.appendChild(f);FITF={f}}
  const d=FITF.f.contentDocument;d.open();d.write(`<!doctype html><html><head><meta charset="utf-8">${links}<style>${css}</style><style>body{margin:0}#print{display:block!important}</style></head><body><div id="print"></div></body></html>`);d.close();
  FITF.key=key;FITF.doc=d;return d}
// paper from the document's own @page rule (A3/A4/A5, portrait or landscape); an unknown size is left alone
const PAPER={A3:[297,420],A4:[210,297],A5:[148,210]};
function fitPage(){const el=$('#print');if(!el||el.querySelector('.env')||!el.querySelector('table.pgw'))return null;
  const m=[...el.innerHTML.matchAll(/@page\s*\{[^}]*?size\s*:\s*([^;}]+)/gi)].map(x=>x[1].trim()).pop()||'A4';
  const q=m.match(/^(A[345])(?:\s+(landscape|portrait))?$/i);if(!q)return null;const [a,b]=PAPER[q[1].toUpperCase()],land=/landscape/i.test(q[2]||'');
  const w=land?b:a,h=land?a:b;return {w,cw:w-24,h:h-25-3}}
function fitMeasure(z){const d=fitFrame(),pg=fitPage(),P0=d.getElementById('print');P0.style.width=pg.w+'mm';P0.innerHTML=$('#print').innerHTML;
  const c=P0.querySelector('.pgc');if(!c)return 0;const x=c.querySelector(':scope>.fitz');if(x){x.style.zoom=z;x.style.width=(pg.cw/z)+'mm'}
  return c.getBoundingClientRect().height/MMPX}
function fitPrint(){const el=$('#print'),pg=fitPage();if(!pg)return;const c=el.querySelector('table.pgw .pgc');if(!c)return;
  let w=c.querySelector(':scope>.fitz');if(!w){w=document.createElement('div');w.className='fitz';while(c.firstChild)w.appendChild(c.firstChild);c.appendChild(w)}
  w.style.zoom='';w.style.width='';const h=fitMeasure(1);
  // a document that starts its own new pages (S-curve, ปร.5 sheet…) is laid out on purpose: leave its size alone
  const fw=FITF.doc.defaultView;if([...FITF.doc.querySelectorAll('#print .pgc *')].some(e=>/page|always/.test(fw.getComputedStyle(e).breakBefore))){el.dataset.fitZ='1';el.dataset.fitPages='brk';return}
  const pages=h/pg.h;el.dataset.fitPages=pages.toFixed(2);if(pages<=1.002){el.dataset.fitZ='1';return}
  const N=Math.ceil(pages),over=pages-(N-1),target=N===2?(pages<=1.45?1:0):over<=.3?N-1:0;if(!target){el.dataset.fitZ='1';return}
  // largest zoom that still fits: a wider (zoomed) column wraps less, so the first guess is usually too small
  const lim=target*pg.h-(target>1?6:0),ok=z=>fitMeasure(z)<=lim;let lo=.66,hi=1;if(!ok(lo)){el.dataset.fitZ='1';return}
  for(let i=0;i<7;i++){const m=(lo+hi)/2;if(ok(m))lo=m;else hi=m}const z=lo;w.style.zoom=z.toFixed(3);w.style.width=(pg.cw/z).toFixed(1)+'mm';el.dataset.fitZ=z.toFixed(3)}
{const el=$('#print');if(el)new MutationObserver(m=>{if(m.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&n.classList&&n.classList.contains('fitz'))))return;requestAnimationFrame(()=>{try{pgWrap();fitPrint()}catch(e){}})}).observe(el,{childList:true})}
document.head.insertAdjacentHTML('beforeend','<style>@media print{#print table.pgw{table-layout:fixed}}</style>');
window.addEventListener('beforeprint',()=>{try{pgWrap();if(!$('#print .fitz'))fitPrint()}catch(e){}});

