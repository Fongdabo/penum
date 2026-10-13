/* ---------- 3.29 แผนงานแบบหัวข้อใหญ่ / หัวข้อย่อย (MS Project style) ----------
   Outline levels, WBS numbers, summary bars that roll up dates and %, FS/SS/FF/SF links with lag,
   milestones as diamonds with their date, and dependency arrows drawn over the chart. */
document.head.insertAdjacentHTML('beforeend',`<style>
.gt td.gw{font-size:12px;white-space:nowrap}
.gt .gnm{display:flex;align-items:center;gap:2px}
.gt .gnm input{flex:1;min-width:250px}
.gt .gtg{flex:none;width:20px;height:20px;border:0;background:none;padding:0;font-size:12px;color:var(--muted);cursor:pointer;display:inline-block}
.gt tr.gs td{background:color-mix(in srgb,var(--ink) 5%,transparent)}
.gt tr.gs td.nm input{font-weight:700}
.gt tr.gs td.ch{background-color:color-mix(in srgb,var(--ink) 3%,transparent)}
.gt .gro{display:inline-block;padding:0 6px;font-size:13px;font-weight:600;white-space:nowrap}
.gsum{position:absolute;top:11px;height:8px;background:#334155;border-radius:1px;overflow:visible}
.gsum:before,.gsum:after{content:"";position:absolute;top:7px;border-style:solid;border-color:#334155 transparent transparent transparent}
.gsum:before{left:0;border-width:7px 6px 0 0}
.gsum:after{right:0;border-width:7px 0 0 6px}
.gsum i{position:absolute;inset:0 auto 0 0;background:#F59E0B;opacity:.85}
.glb{position:absolute;top:9px;font-size:11px;font-style:normal;color:var(--muted);white-space:nowrap;pointer-events:none}
.tw.garr-on{position:relative}
svg.garr{position:absolute;left:0;top:0;pointer-events:none;overflow:visible;z-index:1}
.gt .gstk{position:sticky;z-index:3;background:var(--surface)}
.gt tr.gs .gstk{background:color-mix(in srgb,var(--ink) 5%,var(--surface))}
.gt .gstk-e{box-shadow:6px 0 6px -6px rgba(0,0,0,.25)}
.gt thead .gstk{z-index:4}
svg.garr path{fill:none;stroke:#3B82F6;stroke-width:1.2;opacity:.85}
svg.garr path.cr{stroke:var(--crit)}
#print i.gp-b.gp-sum{background:#334155;height:6px;top:4px;border-radius:0}
#print i.gp-b.gp-sum>i{background:#F59E0B}
</style>`);
// arrows: measured from the bars on screen after each render, so they follow zoom, collapse and scrolling
// the task columns stay put while the chart scrolls sideways (like MS Project's split view)
function gStick(tb,box){const hr=tb.tHead&&tb.tHead.rows[0];if(!hr)return;const cells=[...hr.cells],k=cells.findIndex(c=>c.classList.contains('ch'));if(k<1)return;
  let n0=k;const wAll=cells.slice(0,k).reduce((a,c)=>a+c.offsetWidth,0);if(wAll>box.clientWidth*.7)n0=Math.min(k,3);
  const lefts=[];let x=0;for(let i=0;i<n0;i++){lefts.push(x);x+=cells[i].offsetWidth}
  tb.querySelectorAll('tr').forEach(tr=>{for(let i=0;i<n0&&i<tr.cells.length;i++){const c=tr.cells[i];if(c.colSpan>1)return;c.classList.add('gstk');c.style.left=lefts[i]+'px';if(i===n0-1)c.classList.add('gstk-e')}})}
function gArrows(){const tb=document.querySelector('#view table.gt');if(!tb)return;const box=tb.closest('.tw');if(!box)return;try{gStick(tb,box)}catch(e){}
  box.classList.add('garr-on');box.querySelectorAll('svg.garr').forEach(x=>x.remove());
  const B={};box.querySelectorAll('[data-bid]').forEach(e=>B[e.dataset.bid]=e);const br=box.getBoundingClientRect(),ox=box.scrollLeft-br.left,oy=box.scrollTop-br.top;
  const pos=e=>{const r=e.getBoundingClientRect(),ms=e.classList.contains('gm');return {l:r.left+ox,r:r.right+ox,y:r.top+oy+r.height/2,ms}};
  const crit=new Set([...box.querySelectorAll('tr.crit')].map(r=>r.dataset.tid));let out='';
  P.tasks.forEach(t=>{const sE=B[t.id];if(!sE)return;(t.dep||[]).forEach(d=>{const pE=B[d.id];if(!pE)return;const a=pos(pE),b=pos(sE),ty=d.ty||'FS';
    const up=b.y<a.y?-1:1,cl=crit.has(t.id)&&crit.has(d.id)?' class="cr"':'';let p;
    if(ty==='SS'){const x=Math.min(a.l,b.l)-8;p=`M${a.l} ${a.y}H${x}V${b.y}H${b.l-1}`}
    else if(ty==='FF'){const x=Math.max(a.r,b.r)+8;p=`M${a.r} ${a.y}H${x}V${b.y}H${b.r+1}`}
    else if(ty==='SF'){const x=a.l-8;p=`M${a.l} ${a.y}H${x}V${b.y}H${b.r+1}`}
    else if(b.l>=a.r+10){p=`M${a.r} ${a.y}H${b.l+5}V${b.y-7*up}`}
    else{const ym=b.y-12*up;p=`M${a.r} ${a.y}h6V${ym}H${b.l-8}V${b.y}H${b.l-1}`}
    out+=`<path${cl} d="${p}" marker-end="url(#garrH)"/>`})});
  if(!out)return;box.insertAdjacentHTML('beforeend',`<svg class="garr" width="${box.scrollWidth}" height="${box.scrollHeight}"><defs><marker id="garrH" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L8 4L0 8z" style="fill:#3B82F6;stroke:none"/></marker></defs>${out}</svg>`)}
{const r=render;render=function(){const x=r.apply(this,arguments);try{if(S.mode==='pj'&&S.tab==='sched')requestAnimationFrame(gArrows)}catch(e){}return x}}
window.addEventListener('resize',()=>{if(S.mode==='pj'&&S.tab==='sched')gArrows()});
Object.assign(SBKW,{'pj.sched':(SBKW['pj.sched']||'')+' หัวข้อใหญ่ หัวข้อย่อย wbs outline summary ms project predecessor FS SS'});

