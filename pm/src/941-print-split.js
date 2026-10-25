/* ---------- 4.60–4.61 ◫ แบ่งจอ: a document as it prints, beside the work (user: "ทำให้เหมือนทุกงานด้วยนะ เช่นใบเบิกงวด") ----------
   Every card whose title row has a พิมพ์ button (data-a="print": quotation, ใบเบิกงวด, PO, PR, รายงานประจำวัน, แบบฟอร์ม, ประมูล …) gets
   ◫ แบ่งจอ next to it: the work on the left, the printout on the right, redrawn with every change. A window under 1100 px gets the
   printout full screen instead (ปิด / Esc). The preview is PRINT[k](id) itself in a shadow root, with the page's own styles and its print
   rules switched on, framed like 720's page frame (A4, 10 mm sides), so it reads as the printout does; forced page breaks show as a grey
   gap. Split stays on per computer (penum.pm.qtab) and follows the kind of document last split. 4.60 had ทำใบ / ตัวอย่างใบ tabs (quotes only). */
const QTAB_K='penum.pm.qtab',qtabW=()=>window.innerWidth>=1100;
let QTAB=(()=>{try{return localStorage.getItem(QTAB_K)==='split'?'split':'edit'}catch(e){return 'edit'}})(),PSPK='';
const pspOn=()=>QTAB==='split'&&qtabW();
// the printout of one document, as ACT.print would put it in #print (no numbering, dialogs or revisions: those stay with พิมพ์)
const pspHtml=(k,id)=>{const f=PRINT[k];if(typeof f!=='function')return '';try{return f(id)||''}catch(e){console.error(e);return ''}};
// a narrow window: the printout full screen, in 983's on-screen paper
ACT.spPv=b=>{const k=b.dataset.k,id=b.dataset.id,h=pspHtml(k,id);if(!h){toast('ยังแสดงตัวอย่างเอกสารนี้ไม่ได้');return}
  let bar=$('#fsPvb');if(!bar){bar=document.createElement('div');bar.id='fsPvb';bar.className='fs-pvb';document.body.appendChild(bar)}
  bar.innerHTML=`<b>ตัวอย่างเอกสาร</b><small>หน้าตาจริงตอนพิมพ์</small><span style="flex:1"></span><button type="button" class="btn sm pri" data-a="print" data-k="${esc(k)}"${id!=null?` data-id="${esc(id)}"`:''}>พิมพ์</button><button type="button" class="btn sm" data-a="fsPvClose">ปิด</button>`;
  const p=$('#print');p.innerHTML=`<div class="fs-paper${/size:A4 landscape/.test(h)?' land':''}">${h}</div>`;if(typeof fillPhotos==='function')fillPhotos(p);document.body.classList.add('fs-pv');p.scrollTop=0};
ACT.qsplit=b=>{if(!qtabW()){ACT.spPv(b);return}
  const k=b.dataset.k||'quote',cur=$('.qsp-b.on');if(QTAB==='split'&&cur&&cur.dataset.k===k)QTAB='edit';else{QTAB='split';PSPK=k}try{localStorage.setItem(QTAB_K,QTAB)}catch(e){}render()};
// the page's styles for the preview: every sheet in order, print rules made to apply on screen, @page left out; rebuilt when sheets change
let QPV_SH=null,QPV_N=-1;
function qpvSheet(){const L=[...document.styleSheets];if(QPV_SH&&QPV_N===L.length)return QPV_SH;const out=[];
  const walk=rules=>{for(const r of rules){if(r.type===4){if(/\bprint\b/.test(r.media.mediaText)||/\ball\b|screen/.test(r.media.mediaText)&&!/prefers-color-scheme/.test(r.media.mediaText))walk(r.cssRules)}else if(r.type!==6&&r.type!==3&&r.type!==5)out.push(r.cssText)}};
  L.forEach(s=>{try{walk(s.cssRules)}catch(e){}});
  out.push(`#print{display:block!important;position:relative!important;width:210mm;margin:0 auto;background:#fff;color:#000;font-size:12px;box-shadow:0 6px 24px rgba(0,0,0,.35);text-align:left}
#print.land{width:297mm}#print .ofoot{position:static!important;margin:6mm 10mm 0}#print .fs-wm{display:none}
.qpv-brk{height:18px;margin:10mm -10mm 10mm;background:#56626B}.qpv-wrap{padding:14px 10px;background:#56626B;min-height:100%}`);
  try{const s=new CSSStyleSheet();s.replaceSync(out.join('\n'));QPV_SH=s}catch(e){QPV_SH=out.join('\n')}QPV_N=L.length;return QPV_SH}
function qpvFill(el,h){const R=el.shadowRoot||el.attachShadow({mode:'open'}),sh=qpvSheet(),land=/size:A4 landscape/.test(h);
  if(typeof sh==='string'){R.innerHTML=`<style>${sh}</style>`}else{R.adoptedStyleSheets=[sh];R.innerHTML=''}
  if(!h){R.innerHTML+=`<div class="qpv-wrap" style="color:#fff;padding:24px">ยังแสดงตัวอย่างเอกสารนี้ไม่ได้</div>`;return}
  // 720's page frame: a table whose header/footer rows keep the top and bottom of each page free, 10 mm sides
  R.innerHTML+=`<div class="qpv-wrap"><div id="print" class="${land?'land':''}"><table class="pgw"><thead><tr><td><div></div></td></tr></thead><tfoot><tr><td><div></div></td></tr></tfoot><tbody><tr><td class="pgc">${h}</td></tr></tbody></table></div></div>`;
  const P=R.getElementById('print'),c=P.querySelector('.pgc');c.querySelectorAll('script').forEach(x=>x.remove());c.querySelectorAll('.ofoot').forEach((f,i)=>{if(i)f.remove();else P.appendChild(f)});
  if(typeof fmStamp==='function')try{fmStamp(P)}catch(e){}
  if(typeof fillPhotos==='function')fillPhotos(P);
  let first=true;c.querySelectorAll('*').forEach(x=>{const b=getComputedStyle(x).breakBefore;if(b==='page'||b==='always'){if(!first||x.getBoundingClientRect().top-c.getBoundingClientRect().top>4)x.insertAdjacentHTML('beforebegin','<div class="qpv-brk" aria-hidden="true"></div>')}first=false});
  // fit the paper to the space, never larger than real size
  const W=el.clientWidth-20,pw=P.offsetWidth;P.style.zoom=pw>W&&W>0?(W/pw).toFixed(3):''}
// after each render: ◫ แบ่งจอ beside the first พิมพ์ in each card's title row; the card being split gets the preview column
function pspDecorate(){const L=[];document.querySelectorAll('section h2 [data-a="print"][data-k]').forEach(pb=>{const s=pb.closest('section'),h2=pb.closest('h2');
    if(!s||h2.parentElement!==s||L.some(x=>x.s===s)||s.querySelector(':scope>h2 .qsp-b')||typeof PRINT[pb.dataset.k]!=='function'||!pb.offsetParent)return;L.push({s,h2,pb})});
  if(!L.length)return;const on=pspOn(),cur=on?(L.find(x=>x.pb.dataset.k===PSPK)||L[0]):null;
  L.forEach(x=>{const k=x.pb.dataset.k,id=x.pb.dataset.id,sp=x===cur,b=document.createElement('button');
    b.type='button';b.className='btn sm qsp-b'+(sp?' on':'');b.dataset.a='qsplit';b.dataset.k=k;if(id!=null)b.dataset.id=id;b.setAttribute('aria-pressed',sp);
    b.title=sp?'ปิดแบ่งจอ':'ทำงานด้านซ้าย ตัวอย่างเอกสารด้านขวา หน้าตาจริงตอนพิมพ์ เปลี่ยนตามทันทีที่แก้';b.textContent=sp?'◫ ปิดแบ่งจอ':'◫ แบ่งจอ';x.pb.after(b);
    if(!sp)return;const v=document.createElement('div');v.className='qpv';x.h2.after(v);
    // everything above the preview spans both columns; the preview starts on the row after the title
    let n=0;for(const e of x.s.children){if(e===v)break;if(getComputedStyle(e).display!=='none'){e.classList.add('sp-top');n++}}
    v.style.gridRow=`${n+1} / span 199`;x.s.classList.add('qtab-sp');qpvFill(v,pspHtml(k,id))})}
{const r=render;render=function(){const x=r.apply(this,arguments);try{pspDecorate()}catch(e){console.error(e)}return x}}
// แบ่งจอ turns on and off with the window width
{let t;window.addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(()=>{if(QTAB==='split'&&$('.qsp-b'))render()},250)})}
document.head.insertAdjacentHTML('beforeend',`<style>.qsp-b.on{background:var(--accent,#1C8F9B);color:#fff;border-color:var(--accent,#1C8F9B)}
section.qtab-sp{display:grid;grid-template-columns:minmax(0,1fr) minmax(380px,40%);column-gap:16px;align-items:start}
section.qtab-sp>*{grid-column:1;min-width:0}section.qtab-sp>.sp-top{grid-column:1/-1}
section.qtab-sp>.qpv{display:block;grid-column:2;position:sticky;top:96px;max-height:calc(100vh - 116px);overflow:auto;border-radius:10px}
@media print{.qpv{display:none!important}}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'◫ แบ่งจอ':'◫ Split','◫ ปิดแบ่งจอ':'◫ Close split','ตัวอย่างใบ':'Preview','ตัวอย่างเอกสาร':'Preview',
  'หน้าตาจริงตอนพิมพ์':'as it will print'});
