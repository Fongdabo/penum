/* ---------- 3.8: navigation as a side tree, like a file explorer ----------
   ฝ่าย ▸ แผนก ▸ หน้า in one tree on the left, folding away the division and department tab rows. A division with
   only one department lists its pages straight away. The open branches are remembered, the tree can shrink to
   icons only, and the project picker sits at its top while a project page is open.
   Below 1000 px the tree is a drawer behind the ☰ button, and the current department's page row stays above the page. */
const SBW=1000,sbWide=()=>innerWidth>=SBW;
const sbSv=a=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${a||''}</svg>`;
const SB_CHEV='<path d="m9 6 6 6-6 6"/>';
document.body.insertAdjacentHTML('afterbegin',`<aside id="side" class="side" aria-label="เมนูหลัก"></aside><div id="sideBg" class="side-bg" data-a="sbClose" hidden></div>`);
document.querySelector('.brand').insertAdjacentHTML('afterbegin',`<button type="button" class="sb-burger" data-a="sbOpen" aria-label="เปิดเมนู" aria-controls="side">${sbSv('<path d="M4 6h16M4 12h16M4 18h16"/>')}</button><div class="crumb" id="crumb" aria-live="polite"></div>`);
document.body.classList.add('sb');
const sbPages=d=>d[2].filter(pgOk);
function sbOnIdx(d){if(d[0]!==S.dept)return -1;const L=sbPages(d);let i=L.findIndex(pg=>pgOn(pg,true));if(i<0)i=L.findIndex(pg=>pgOn(pg));return i}
function sbTree(){S.sbx=S.sbx||{};const X=S.sbx,cur=divOf(S.dept),mini=S.sbMini&&sbWide();
  const pageBtn=(d,pg,i,lvl)=>`<button type="button" role="treeitem" class="sb-it lv${lvl}${i===sbOnIdx(d)?' on':''}" data-a="sbPg" data-d="${d[0]}" data-i="${i}" aria-current="${i===sbOnIdx(d)?'page':'false'}" title="${esc(pg[3])}"><i class="sb-tw"></i>${d[0]==='pj'&&ICO[pg[1]]?sbSv(ICO[pg[1]]):'<i class="sb-dot"></i>'}<span>${esc(pg[3])}</span></button>`;
  // a node that opens and closes; a click on its name also goes to its first page
  const node=(key,label,ico,lvl,kids,active,go)=>{const open=X[key]!=null?!!X[key]:active;
    return `<div class="sb-n" role="none"><button type="button" role="treeitem" class="sb-it lv${lvl}${active?' in':''}" aria-expanded="${open}" data-a="sbNode" data-k="${key}" ${go} title="${esc(label)}"><i class="sb-tw" data-a="sbTw" data-k="${key}">${sbSv(SB_CHEV)}</i>${sbSv(ico)}<span>${esc(label)}</span></button>${open?`<div role="group" class="sb-g">${kids}</div>`:''}</div>`};
  const leaf=(label,ico,lvl,active,go)=>`<button type="button" role="treeitem" class="sb-it lv${lvl}${active?' on':''}" ${go} aria-current="${active?'page':'false'}" title="${esc(label)}"><i class="sb-tw"></i>${sbSv(ico)}<span>${esc(label)}</span></button>`;
  if(mini)return DIVS.flatMap(v=>divDepts(v)).map(d=>leaf(d[1],ICO[d[0]],0,d[0]===S.dept,`data-a="dept" data-k="${d[0]}"`)).join('');
  return DIVS.filter(v=>divDepts(v).length).map(v=>{const D=divDepts(v),act=v[0]===cur[0];
    if(D.length===1){const d=D[0],P=sbPages(d);if(P.length<2)return leaf(v[1],ICO[v[0]]||ICO[d[0]],0,d[0]===S.dept,`data-a="dept" data-k="${d[0]}"`);
      return node('v:'+v[0],v[1],ICO[v[0]]||ICO[d[0]],0,P.map((pg,i)=>pageBtn(d,pg,i,1)).join(''),act,`data-d="${d[0]}"`)}
    return node('v:'+v[0],v[1],ICO[v[0]],0,D.map(d=>{const P=sbPages(d);if(P.length<2)return leaf(d[1],ICO[d[0]],1,d[0]===S.dept,`data-a="dept" data-k="${d[0]}"`);
      return node('d:'+d[0],d[1],ICO[d[0]],1,P.map((pg,i)=>pageBtn(d,pg,i,2)).join(''),d[0]===S.dept,`data-d="${d[0]}"`)}).join(''),act,'')}).join('')}
// logos often come with a wide white margin; trim it once so the mark fills the small tile (the stored logo is untouched)
const SBL={};function sbLogo(src){if(SBL[src])return SBL[src]==='…'?src:SBL[src];SBL[src]='…';const im=new Image();
  im.onload=()=>{try{const c=document.createElement('canvas'),w=c.width=im.naturalWidth,h=c.height=im.naturalHeight,x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,w,h).data;
    let t=h,l=w,r=0,b=0;for(let y=0;y<h;y++)for(let i=0;i<w;i++){const k=(y*w+i)*4;if(d[k+3]>20&&(d[k]<235||d[k+1]<235||d[k+2]<235)){if(y<t)t=y;if(y>b)b=y;if(i<l)l=i;if(i>r)r=i}}
    if(r<=l||b<=t){SBL[src]=src;return}const p=Math.round(Math.max(r-l,b-t)*.06),sw=r-l+1+2*p,sh=b-t+1+2*p,o=document.createElement('canvas');o.width=sw;o.height=sh;const ox=o.getContext('2d');ox.fillStyle='#fff';ox.fillRect(0,0,sw,sh);
    ox.drawImage(c,l-p,t-p,sw,sh,0,0,sw,sh);SBL[src]=o.toDataURL('image/png');sbDraw()}catch(e){SBL[src]=src}};im.onerror=()=>{SBL[src]=src};im.src=src;return src}
function sbDraw(){const el=$('#side');if(!el)return;const top=(el.querySelector('.sb-tree')||{}).scrollTop||0,mini=S.sbMini&&sbWide(),pj=S.mode==='pj';
  document.body.classList.toggle('sb-mini',!!mini);
  const projs=Object.values(DB.projects).sort((a,b)=>a.name.localeCompare(b.name,'th'));
  const C=CO();
  // the company's own logo and name head the menu; the P mark is only for a company without a logo
  el.innerHTML=`<div class="sb-hd"><button type="button" class="sb-cob" data-a="coPick" title="เลือกบริษัท" aria-label="เลือกบริษัท">${C.logo?`<img class="sb-logo" src="${sbLogo(C.logo)}" alt="">`:'<span class="mark" aria-hidden="true">P</span>'}<b class="sb-co">${esc(C.name||'PENUM PM')}<small>PENUM PM ▾</small></b></button><span class="sp"></span><button type="button" class="sb-x" data-a="sbClose" aria-label="ปิดเมนู">✕</button></div>
  ${pj&&!mini?`<div class="sb-pj"><label>โครงการ<select id="sbProj" aria-label="โครงการ">${projs.map(p=>`<option value="${p.id}"${p.id===P.id?' selected':''}>${esc(p.name)}</option>`).join('')}</select></label><button type="button" class="btn sm ghost" data-a="newProj">+ โครงการใหม่</button></div>`:''}
  <nav class="sb-tree" role="tree" aria-label="ฝ่ายและแผนก">${sbTree()}</nav>
  <div class="sb-ft"><button type="button" class="sb-it" data-a="sbMini" title="${mini?'ขยายเมนู':'ย่อเมนูเหลือไอคอน'}">${sbSv(mini?'<path d="m9 6 6 6-6 6M4 4v16"/>':'<path d="m15 6-6 6 6 6M20 4v16"/>')}<span>${mini?'ขยายเมนู':'ย่อเมนู'}</span></button></div>`;
  const t=el.querySelector('.sb-tree');if(t){t.scrollTop=top;const a=t.querySelector('.on');if(a&&!sbDraw.seen){sbDraw.seen=1;a.scrollIntoView({block:'nearest'})}}}
{const r=render;render=function(){const x=r.apply(this,arguments);if(S.dept&&S.dept!==sbDraw.last){sbDraw.last=S.dept;S.sbx=S.sbx||{};S.sbx['v:'+divOf(S.dept)[0]]=true;S.sbx['d:'+S.dept]=true;sbDraw.seen=0}
  // the tab rows stay in the page for anything that still reads them, but the tree replaces them on screen
  sbDraw();sbCrumb();return x}}
// where you are, since the tab rows are gone: ฝ่าย › แผนก › หน้า (and the project on project pages)
function sbCrumb(){const el=$('#crumb');if(!el)return;const d=NAVD.find(x=>x[0]===S.dept),v=divOf(S.dept);if(!d){el.innerHTML='';return}
  const i=sbOnIdx(d),pg=sbPages(d)[i],L=[];if(v[2].length>1)L.push(v[1]);L.push(d[1]);if(pg&&sbPages(d).length>1)L.push(pg[3]);
  el.innerHTML=L.map((t,k)=>`<span${k===L.length-1?' class="last"':''}>${esc(t)}</span>`).join('<i>›</i>')+(S.mode==='pj'&&P?`<small>${esc(P.name)}</small>`:'')}
// a department (or a one-department division) goes to its page the first time and folds after that; a division only folds
ACT.sbNode=b=>{const d=b.dataset.d,k=b.dataset.k;S.sbx=S.sbx||{};if(d&&S.dept!==d){S.sbx[k]=true;ACT.dept({dataset:{k:d}});return}
  S.sbx[k]=b.getAttribute('aria-expanded')!=='true';saveUI();sbDraw()};
// the chevron only folds; it never changes page (the click handler picks the nearest data-a, so it wins over the node)
ACT.sbTw=b=>{const it=b.closest('.sb-it');S.sbx=S.sbx||{};S.sbx[b.dataset.k]=!(it&&it.getAttribute('aria-expanded')==='true');saveUI();sbDraw()};
ACT.sbPg=b=>{const d=NAVD.find(x=>x[0]===b.dataset.d);if(!d)return;const L=sbPages(d),i=+b.dataset.i,pg=L[i];if(!pg)return;S.dept=d[0];S.dpage=S.dpage||{};S.dpage[d[0]]=i;pgGo(pg);ACT.sbClose();render();scrollTo({top:0})};
ACT.sbMini=()=>{S.sbMini=!S.sbMini;render()};
ACT.sbOpen=()=>{document.body.classList.add('sb-open');$('#sideBg').hidden=false;sbDraw();const a=$('#side .on');if(a)a.scrollIntoView({block:'nearest'})};
ACT.sbClose=()=>{document.body.classList.remove('sb-open');$('#sideBg').hidden=true};
// a page change from the drawer closes it
{const f=ACT.dept;ACT.dept=b=>{ACT.sbClose();return f(b)}}
document.addEventListener('change',e=>{if(e.target.id==='sbProj'){DB.cur=e.target.value;P=DB.projects[DB.cur];save();S.sel={};ACT.sbClose();render()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('sb-open'))ACT.sbClose()});
addEventListener('resize',()=>{clearTimeout(sbDraw.t);sbDraw.t=setTimeout(()=>{if(sbWide())ACT.sbClose();sbDraw()},120)});
document.head.insertAdjacentHTML('beforeend',`<style>
:root{--sbw:256px}
/* full width on wide screens: no centred column, the bar runs edge to edge */
.wrap,.band-in{max-width:none!important}
body.sb-mini{--sbw:64px}
.side{position:fixed;top:0;left:0;bottom:0;width:var(--sbw);z-index:40;display:flex;flex-direction:column;background:var(--surface);border-right:1px solid var(--line);box-shadow:var(--shadow)}
.sb-hd{display:flex;align-items:center;gap:9px;padding:14px 14px 10px;font-family:var(--f-display);font-size:15px}
.sb-hd .mark{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:8px;background:var(--accent);color:#fff;font-weight:800;flex:none}
.sb-hd .sp{flex:1}
.sb-cob{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:9px;min-width:0;cursor:pointer;border-radius:10px;padding:3px 6px 3px 3px;margin:-3px -6px -3px -3px}
.sb-cob:hover{background:var(--line,rgba(127,127,127,.12))}.sb-cob:focus-visible{outline:2px solid var(--accent)}
.co-l{display:grid;gap:8px;margin:4px 0}.co-l button{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--line,#ccc);border-radius:12px;cursor:pointer}
.co-l button:hover{border-color:var(--accent)}.co-l button.on{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}
.co-l img,.co-l .mark{width:56px;height:36px;object-fit:contain;border-radius:8px;background:#fff;flex:none;display:grid;place-items:center}
.co-l .mark{width:36px;background:var(--accent);color:#fff;font-weight:800}.co-l b{display:block}.co-l small{color:var(--muted)}.co-l .ck{margin-left:auto;color:var(--accent);font-weight:700}
.sb-logo{height:46px;width:auto;max-width:104px;border-radius:12px;object-fit:contain;background:#fff;padding:3px;flex:none;box-shadow:0 1px 3px rgba(0,0,0,.15)}
.sb-co{display:grid;line-height:1.25;font-size:14px;min-width:0}.sb-co small{font-family:var(--f-body,inherit);font-weight:500;font-size:11.5px;color:var(--muted);letter-spacing:.04em}
body.sb-mini .sb-co{display:none}body.sb-mini .sb-logo{max-width:44px;height:auto;max-height:44px}
.sb-x{display:none;border:0;background:none;color:var(--muted);font-size:18px;cursor:pointer;padding:4px 8px}
.sb-pj{padding:4px 12px 10px;border-bottom:1px solid var(--line);display:grid;gap:6px}
.sb-pj label{font-size:12px;color:var(--muted);display:grid;gap:4px}
.sb-pj select{width:100%}
.sb-tree{flex:1;overflow:auto;padding:8px 8px 12px}
.sb-it{display:flex;align-items:center;gap:8px;width:100%;border:0;background:none;color:var(--ink);text-align:left;border-radius:11px;padding:7px 8px;font:inherit;font-size:14px;cursor:pointer;min-height:36px}
.sb-it span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sb-it>svg{width:18px;height:18px;flex:none;color:var(--muted)}
.sb-it.lv0{font-family:var(--f-display);font-weight:600}
.sb-it.lv1{padding-left:22px}.sb-it.lv2{padding-left:40px;font-size:13.5px}
.sb-it:hover{background:var(--sunk)}
.sb-it.in>svg,.sb-it.in{color:var(--accent)}
.sb-it.on{background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent);font-weight:700}
.sb-it.on>svg{color:var(--accent)}
.sb-tw{width:16px;height:16px;flex:none;display:grid;place-items:center;border-radius:5px;color:var(--muted)}
.sb-tw svg{width:14px;height:14px;transition:transform .15s}
.sb-tw[data-a]:hover{background:var(--line)}
.sb-it[aria-expanded="true"]>.sb-tw svg{transform:rotate(90deg)}
.sb-dot{width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.45;flex:none;margin:0 6.5px}
.sb-ft{border-top:1px solid var(--line);padding:6px 8px}
.sb-ft .sb-it{color:var(--muted);font-size:13px}
body.sb-mini .sb-hd b.x,body.sb-mini .sb-it span,body.sb-mini .sb-tw{display:none}
body.sb-mini .sb-hd{justify-content:center;padding-inline:0}body.sb-mini .sb-it{justify-content:center;padding-inline:0}
.sb-burger{display:none;border:0;background:rgba(255,255,255,.14);color:inherit;border-radius:9px;width:38px;height:38px;place-items:center;cursor:pointer;flex:none}
.sb-burger svg{width:20px;height:20px}
.crumb{display:flex;align-items:center;flex-wrap:wrap;gap:2px 7px;font-family:var(--f-display);font-size:14px;opacity:.82;min-width:0}
.crumb .last{font-weight:700;font-size:17px;opacity:1}.crumb i{font-style:normal;opacity:.6}
.crumb small{flex-basis:100%;font-family:var(--f-body,inherit);font-size:12.5px;opacity:.85}
@media (max-width:700px){.crumb span:not(.last),.crumb i{display:none}.crumb .last{font-size:15px}}
.side-bg{position:fixed;inset:0;background:rgba(10,20,25,.42);z-index:39}
@media (min-width:${SBW}px){
 /* the menu and the header float as rounded panels with a small gap to the window edge */
 body.sb{padding-left:calc(var(--sbw) + 28px)}
 body.sb .side{top:12px;left:12px;bottom:12px;border-radius:18px;border:1px solid var(--line);overflow:hidden}
 body.sb .band{margin:12px 0 0;top:12px;border-radius:18px;padding:14px 20px 12px;box-shadow:var(--band-shadow)}
 /* cover the gap above the floating header so scrolled content does not show through it */
 body.sb .band::before{content:'';position:absolute;left:-16px;right:-16px;top:-13px;bottom:0;background:var(--bg);z-index:-2}
 body.sb .band{background:transparent}
 body.sb .band::after{content:'';position:absolute;inset:0;border-radius:inherit;background:var(--band-g);z-index:-1}
 body.sb .wrap>main{margin-top:16px}
 body.sb #tabs,body.sb .depts,body.sb .pages,body.sb #projBox{display:none!important}
 body.sb .brand h1{display:none}
 body.sb .band{padding-bottom:12px}
}
@media (max-width:${SBW-1}px){
 .side{width:min(300px,86vw);transform:translateX(-104%);transition:transform .2s ease;box-shadow:none;top:8px;bottom:8px;left:8px;border-radius:18px;border:1px solid var(--line);overflow:hidden}
 body.sb .band{border-radius:0 0 18px 18px}
 body.sb-open .side{transform:none;box-shadow:0 0 40px rgba(0,0,0,.3)}
 body.sb-open{overflow:hidden}
 .sb-x{display:block}.sb-ft{display:none}
 .sb-burger{display:inline-grid}
 body.sb #tabs,body.sb .depts,body.sb #projBox{display:none!important}
 body.sb .band{padding-bottom:12px}
 .sb-it{min-height:42px}
 body.sb .brand h1{display:none}
 .crumb{flex:1 1 calc(100% - 60px)}
}
@media print{.side,.side-bg,.sb-burger{display:none!important}body.sb{padding-left:0!important}}
</style>`);

