/* ---------- 4.60 ทำใบ / ตัวอย่างใบ: the quotation as it prints, beside the work (user: "ทำเป็น 2 แท็บ แท็บแรกเราทำงาน แท็บ 2 รายการทุกอย่างอัปเดตฟอร์มไปด้วย") ----------
   Under the quotation's title row: ✎ ทำใบ (the page as before), 🖨 ตัวอย่างใบ (only the printed quotation) and, on a wide screen,
   ◫ แบ่งจอ (the work on the left, the printed quotation on the right, redrawn with every change). The preview is PRINT.quote itself in a
   shadow root, with the page's own styles and its print rules switched on, framed like 720's page frame (A4, 10 mm sides), so it reads
   as the printout does; forced page breaks show as a grey gap. The choice is kept per computer (penum.pm.qtab). */
const QTAB_K='penum.pm.qtab',qtabW=()=>window.innerWidth>=1600;
let QTAB=(()=>{try{return localStorage.getItem(QTAB_K)||'edit'}catch(e){return 'edit'}})();
const qtabMode=()=>QTAB==='split'&&!qtabW()?'pv':QTAB;
ACT.qtab=b=>{QTAB=b.dataset.v||'edit';try{localStorage.setItem(QTAB_K,QTAB)}catch(e){}render();const t=$('.qtab');if(t&&QTAB!=='edit'){const r=t.getBoundingClientRect();if(r.top<0||r.top>innerHeight*.6)t.scrollIntoView({block:'start'})}};
function qtabBar(Q){const m=qtabMode(),bt=(v,t,tip)=>`<button type="button" role="tab" class="${m===v?'on':''}" aria-selected="${m===v}" data-a="qtab" data-v="${v}" title="${tip}">${t}</button>`;
  return `<div class="qtab" role="tablist">${bt('edit','✎ ทำใบ','กรอกรายการ ราคา และตั้งค่าใบ')}${bt('pv','🖨 ตัวอย่างใบ','หน้าตาใบที่จะพิมพ์ออกมาจริง')}${qtabW()?bt('split','◫ แบ่งจอ','ทำใบด้านซ้าย ตัวอย่างใบด้านขวา เปลี่ยนตามทันทีที่แก้'):''}
    <small>ตัวอย่างใบ = หน้าตาจริงตอนพิมพ์ แก้ที่ ทำใบ แล้วตัวอย่างเปลี่ยนตามทันที</small></div><div class="qpv" data-id="${Q.id}"></div>`}
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
// salesQuote is wrapped by 981 and 983 after this file: add the tabs at render time, under the open quotation's title row
let qtabOn=false;const qtabWrap=()=>{if(qtabOn||typeof salesQuote!=='function')return;qtabOn=true;const f=salesQuote;salesQuote=function(){const h=f.apply(this,arguments);
  const C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];if(!Q)return h;
  const a=h.indexOf('<div class="fsg">');if(a<0)return h;const e=h.lastIndexOf('</h2>',a);if(e<0)return h;
  return h.slice(0,e+5)+qtabBar(Q)+h.slice(e+5)}};
{const r=render;render=function(){try{qtabWrap()}catch(e){}const x=r.apply(this,arguments);
  try{const t=$('.qtab');if(t){const s=t.parentElement,m=qtabMode();s.classList.add('qtab-s');s.classList.toggle('qtab-pv',m==='pv');s.classList.toggle('qtab-sp',m==='split');if(m!=='edit')qpvFill(s.querySelector('.qpv'))}}catch(e){console.error(e)}
  return x}}
// แบ่งจอ appears and goes with the window width
{let t;window.addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(()=>{if($('.qtab'))render()},250)})}
document.head.insertAdjacentHTML('beforeend',`<style>.qtab{display:flex;align-items:center;flex-wrap:wrap;gap:6px 4px;margin:0 0 12px;padding:0 0 0;border-bottom:1px solid var(--line)}
.qtab button{appearance:none;border:1px solid transparent;border-bottom:0;margin-bottom:-1px;background:none;color:var(--muted);font:inherit;font-size:14px;font-weight:600;padding:8px 16px;border-radius:10px 10px 0 0;cursor:pointer}
.qtab button:hover{color:var(--ink)}.qtab button.on{color:var(--accent,#1C8F9B);background:var(--surface);border-color:var(--line);box-shadow:inset 0 3px 0 var(--accent,#1C8F9B)}
.qtab small{margin-left:auto;color:var(--muted);font-size:12px;padding:0 4px 6px}
.qpv{display:none}
section.qtab-pv>*:not(h2):not(.qtab):not(.qpv):not(style){display:none!important}
section.qtab-pv>.qpv{display:block;border-radius:10px;overflow:auto;max-height:calc(100vh - 150px)}
section.qtab-sp{display:grid;grid-template-columns:minmax(0,1fr) minmax(420px,38%);column-gap:16px;align-items:start}
section.qtab-sp>*{grid-column:1;min-width:0}section.qtab-sp>h2,section.qtab-sp>.qtab{grid-column:1/-1}
section.qtab-sp>.qpv{display:block;grid-column:2;grid-row:3/span 99;position:sticky;top:96px;max-height:calc(100vh - 116px);overflow:auto;border-radius:10px}
@media print{.qpv{display:none!important}}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'✎ ทำใบ':'✎ Edit','🖨 ตัวอย่างใบ':'🖨 Preview','◫ แบ่งจอ':'◫ Split','ตัวอย่างใบ':'Preview',
  'ตัวอย่างใบ = หน้าตาจริงตอนพิมพ์ แก้ที่ ทำใบ แล้วตัวอย่างเปลี่ยนตามทันที':'Preview = the printout as it will look; changes made under Edit show at once'});
