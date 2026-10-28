/* ---------- 4.98 ORIEN Modern signature boxes with e-signatures (user: "จัดหน้ากระดาษไม่สวยเลย") ----------
   The three boxes were flex columns with the line pushed down by margin:auto, so a box with more lines under it (ผู้อนุมัติ:
   name + position + ลงนามแทนโดย …) had its line higher than the others, and the signature picture (44 px, 860) was taller than
   the 34 px space above the line and ran into the box title. Each box is now a grid with the same rows in all three: title,
   the customer note (kept empty in the other two), the signing space, the line, name, date, then the ลงนามแทน line in small grey
   type. The lines sit level, the signature fits inside its space and the extra lines grow the boxes downwards.
   The page is measured in a hidden frame (780 fitFrame) to shrink page 1 to one sheet and to push the signatures to the foot of
   the page (981 qmFitP1/qmFill). That frame loads the web fonts (IBM Plex Sans Thai…) by itself and only once text needs them, so
   the first measurement used a fallback font: on Windows (Leelawadee UI / Tahoma, taller lines) the page looked fuller than it
   is, the gap above the signatures came out too small and the bottom of the sheet stayed empty. fitPrint now runs again once
   the frame has the fonts the page uses; the e-signature dialog waits for them before it fits and prints, and the frame is
   warmed up shortly after the program opens.
   4.99 (user: "ขอบไม่เท่ากัน", "ตัวหนังสือเกือบหลุดขอบ"): the BOQ page's running header (.qm-mini: logo, title, then the quote
   number and "project · work" on the right) sits in a table header cell that does not wrap, so a long project/work name made it
   wider than the sheet. Chrome then shrinks the whole printout to the widest line: page 1 came out narrower with a wide right
   margin, and the header itself still ran off the right edge. The right block now wraps inside the page and takes the room
   the logo leaves. */
document.head.insertAdjacentHTML('beforeend',`<style>
#print .qm .qm-mini{min-width:0;max-width:100%}
#print .qm tr.rh>th{white-space:normal}
#print .qm .qm-mini .no{white-space:normal;min-width:0;flex:0 1 auto;max-width:60%;overflow-wrap:anywhere}
#print .qm .qm-mini>div:not(.no){flex:none;white-space:nowrap}
#print .qm .qm-mini img{max-width:28%;object-fit:contain;object-position:left center}
#print .qm .qm-sg{align-items:stretch}
#print .qm .qm-sg>div{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto 25px 46px auto auto auto;align-content:start}
#print .qm .qm-sg>div>h4{grid-row:1}
#print .qm .qm-sg>div>.q{grid-row:2;margin-top:1px;overflow:hidden}
#print .qm .qm-sg>div>.sp{grid-row:3;height:auto}
#print .qm .qm-sg>div>.ln{grid-row:4;margin:0 6px 4px}
#print .qm .qm-sg>div>.who{grid-row:5}
#print .qm .qm-sg>div>.dt{grid-row:6}
#print .qm .qm-sg img.esig{height:40px;max-width:86%;bottom:calc(100% + 1px)}
#print .qm .qm-sg>div>.esig-n{grid-row:7}#print .qm .qm-sg>div>.esig-n+.esig-n{grid-row:8}
#print .qm .qm-sg .esig-n{font-size:8.5px;line-height:1.35;margin-top:3px;color:var(--qg);font-weight:500}
#print .qm .qm-sg .esig-n.esig-for{color:var(--qn)}
</style>`);
// the faces the page has loaded, loaded in the measuring frame too (at most ~1.5 s)
function qslFonts(){let d;try{d=fitFrame()}catch(e){return Promise.resolve(false)}
  const F=[...document.fonts].filter(f=>f.status==='loaded').map(f=>`${f.style} ${f.weight} 12px ${/^["']/.test(f.family)?f.family:'"'+f.family+'"'}`);
  const miss=F.filter(x=>{try{return !d.fonts.check(x)}catch(e){return false}});if(!miss.length)return Promise.resolve(false);
  return Promise.race([Promise.all(miss.map(x=>d.fonts.load(x).catch(()=>0))).then(()=>true),new Promise(r=>setTimeout(()=>r(true),1500))])}
if(typeof fitPrint==='function'){const f=fitPrint;let again=0;fitPrint=function(){const r=f.apply(this,arguments);
  if(!again)qslFonts().then(x=>{if(!x)return;again=1;try{f()}catch(e){}again=0});return r}}
{const g=ACT.esGo;if(g)ACT.esGo=async function(){await qslFonts();return g.apply(this,arguments)}}
setTimeout(()=>{try{document.fonts.ready.then(qslFonts)}catch(e){}},2500);
