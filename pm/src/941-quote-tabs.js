/* ---------- 4.60 แบ่งจอ: the quotation as it prints, beside the work (user: "แท็บ 2 รายการทุกอย่างอัปเดตฟอร์มไปด้วย"; 4.61 kept only แบ่งจอ) ----------
   ◫ แบ่งจอ in the open quotation's title row: the work on the left, the printed quotation on the right, redrawn with every change
   (a narrow window gets the full-screen preview instead). The preview is PRINT.quote itself in a
   shadow root, with the page's own styles and its print rules switched on, framed like 720's page frame (A4, 10 mm sides), so it reads
   as the printout does; forced page breaks show as a grey gap. The choice is kept per computer (penum.pm.qtab). */
const QTAB_K='penum.pm.qtab',qtabW=()=>window.innerWidth>=1100;
let QTAB=(()=>{try{return localStorage.getItem(QTAB_K)==='split'?'split':'edit'}catch(e){return 'edit'}})();
const qtabMode=()=>QTAB==='split'&&qtabW()?'split':'edit';
// 4.61 (user: "2 แท็บเอาออกเลย เหลือไว้แค่แบ่งจอพอ"): one ◫ แบ่งจอ button in the title row; on a narrow window it opens the preview full screen (937, ปิด / Esc)
ACT.qsplit=b=>{if(!qtabW()){if(typeof ACT.qfsPv==='function')ACT.qfsPv({dataset:{id:b.dataset.id}});return}
  QTAB=QTAB==='split'?'edit':'split';try{localStorage.setItem(QTAB_K,QTAB)}catch(e){}render()};
const qtabBtn=Q=>{const on=qtabMode()==='split';return `<button type="button" class="btn sm qsp-b${on?' on':''}" data-a="qsplit" data-id="${Q.id}" aria-pressed="${on}" title="${on?'ปิดแบ่งจอ':'ทำใบด้านซ้าย ตัวอย่างใบด้านขวา หน้าตาจริงตอนพิมพ์ เปลี่ยนตามทันทีที่แก้'}">◫ ${on?'ปิดแบ่งจอ':'แบ่งจอ'}</button>`};
// the page's styles for the preview: every sheet in order, print rules made to apply on screen, @page left out; rebuilt when sheets change
let QPV_SH=null,QPV_N=-1;
function qpvSheet(){const L=[...document.styleSheets];if(QPV_SH&&QPV_N===L.length)return QPV_SH;const out=[];
  const walk=rules=>{for(const r of rules){if(r.type===4){if(/\bprint\b/.test(r.media.mediaText)||/\ball\b|screen/.test(r.media.mediaText)&&!/prefers-color-scheme/.test(r.media.mediaText))walk(r.cssRules)}else if(r.type!==6&&r.type!==3&&r.type!==5)out.push(r.cssText)}};
  L.forEach(s=>{try{walk(s.cssRules)}catch(e){}});
  out.push(`#print{display:block!important;position:relative!important;width:210mm;margin:0 auto;background:#fff;color:#000;font-size:12px;box-shadow:0 6px 24px rgba(0,0,0,.35);text-align:left}
#print.land{width:297mm}#print .ofoot{position:static!important;margin:6mm 10mm 0}#print .fs-wm{display:none}
.qpv-brk{height:18px;margin:10mm -10mm 10mm;background:#56626B}.qpv-wrap{padding:14px 10px;background:#56626B;min-height:100%}`);
  try{const s=new CSSStyleSheet();s.replaceSync(out.join('\n'));QPV_SH=s}catch(e){QPV_SH=out.join('\n')}QPV_N=L.length;return QPV_SH}
function qpvFill(el){const Q=CO().quotes.find(q=>q.id===el.dataset.id);if(!Q)return;let h='';try{h=PRINT.quote(Q.id)}catch(e){console.error(e)}
  const R=el.shadowRoot||el.attachShadow({mode:'open'}),sh=qpvSheet(),land=/size:A4 landscape/.test(h);
  if(typeof sh==='string'){R.innerHTML=`<style>${sh}</style>`}else{R.adoptedStyleSheets=[sh];R.innerHTML=''}
  if(!h){R.innerHTML+=`<div class="qpv-wrap" style="color:#fff;padding:24px">ยังแสดงตัวอย่างใบนี้ไม่ได้</div>`;return}
  // 720's page frame: a table whose header/footer rows keep the top and bottom of each page free, 10 mm sides
  R.innerHTML+=`<div class="qpv-wrap"><div id="print" class="${land?'land':''}"><table class="pgw"><thead><tr><td><div></div></td></tr></thead><tfoot><tr><td><div></div></td></tr></tfoot><tbody><tr><td class="pgc">${h}</td></tr></tbody></table></div></div>`;
  const P=R.getElementById('print'),c=P.querySelector('.pgc');c.querySelectorAll('script').forEach(x=>x.remove());c.querySelectorAll('.ofoot').forEach((f,i)=>{if(i)f.remove();else P.appendChild(f)});
  if(typeof fmStamp==='function')try{fmStamp(P)}catch(e){}
  if(typeof fillPhotos==='function')fillPhotos(P);
  let first=true;c.querySelectorAll('*').forEach(x=>{const b=getComputedStyle(x).breakBefore;if(b==='page'||b==='always'){if(!first||x.getBoundingClientRect().top-c.getBoundingClientRect().top>4)x.insertAdjacentHTML('beforebegin','<div class="qpv-brk" aria-hidden="true"></div>')}first=false});
  // fit the paper to the space: smaller in แบ่งจอ, never larger than real size
  const W=el.clientWidth-20,pw=P.offsetWidth;P.style.zoom=pw>W&&W>0?(W/pw).toFixed(3):''}
// salesQuote is wrapped by 981 and 983 after this file: add the tabs at render time, on top of the open quotation's card
let qtabOn=false;const qtabWrap=()=>{if(qtabOn||typeof salesQuote!=='function')return;qtabOn=true;const f=salesQuote;salesQuote=function(){const h=f.apply(this,arguments);
  const C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];if(!Q)return h;
  const a=h.indexOf('<div class="fsg">');if(a<0)return h;const e=h.lastIndexOf('</h2>',a);if(e<0)return h;
  // the แบ่งจอ button at the end of the title row, the preview right after it (in the right-hand column when split)
  return h.slice(0,e)+qtabBtn(Q)+'</h2>'+`<div class="qpv" data-id="${Q.id}"></div>`+h.slice(e+5)}};
{const r=render;render=function(){try{qtabWrap()}catch(e){}const x=r.apply(this,arguments);
  try{const v=$('.qpv[data-id]');if(v){const s=v.parentElement,sp=qtabMode()==='split';s.classList.toggle('qtab-sp',sp);if(sp)qpvFill(v)}}catch(e){console.error(e)}
  return x}}
// แบ่งจอ turns on and off with the window width
{let t;window.addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(()=>{if(QTAB==='split'&&$('.qpv[data-id]'))render()},250)})}
document.head.insertAdjacentHTML('beforeend',`<style>.qsp-b.on{background:var(--accent,#1C8F9B);color:#fff;border-color:var(--accent,#1C8F9B)}
.qpv{display:none}
section.qtab-sp{display:grid;grid-template-columns:minmax(0,1fr) minmax(380px,40%);column-gap:16px;align-items:start}
section.qtab-sp>*{grid-column:1;min-width:0}section.qtab-sp>h2{grid-column:1/-1}
section.qtab-sp>.qpv{display:block;grid-column:2;grid-row:2/span 99;position:sticky;top:96px;max-height:calc(100vh - 116px);overflow:auto;border-radius:10px}
@media print{.qpv{display:none!important}}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'◫ แบ่งจอ':'◫ Split','◫ ปิดแบ่งจอ':'◫ Close split','ตัวอย่างใบ':'Preview'});
