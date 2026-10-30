/* ---------- 4.99.6 ใบเสนอราคา by customer or by project, with a chart (user: "เลือกได้ว่าจะดูแค่ลูกค้ามีกี่งาน หรือโครงการมีกี่งาน
   … ทำกราฟด้วย แต่ละลูกค้ามีงานให้เรากี่งาน มูลค่ารวมเท่าไหร่ กำไรขาดทุนเท่าไร") ----------
   The quotation list gets ดูแบบ: รายการ / ตามลูกค้า / ตามโครงการ. Grouped, each customer or project gets a heading row (quotes, won,
   value quoted, value won, profit) that folds its quotes away, and a chart card above the list compares the groups by value, number
   of jobs or profit. Profit of a won job is the project's forecast (contract − forecast cost, as on ทุกโครงการ) once the project
   exists, else the quotation's own gross profit; quotes not won add nothing to it. The project filter (968) still applies. */
const QG_NONE={c:'(ไม่ระบุลูกค้า)',p:'(ยังไม่ระบุโครงการ)'};
function qgProfit(q,c){const p=q.status==='won'&&q.pj&&DB.projects[q.pj];if(p){try{const k=pjKpi(p);return {v:k.C.total-k.T.fc,fc:1}}catch(e){}}return {v:c.net-c.cost,fc:0}}
function qgStats(L,by){const M=new Map();L.forEach(q=>{const nm=by==='c'?custName(q.cust):qPjOf(q),k=pjKey(nm||'')||'~',c=qCalc(q);
    const g=M.get(k)||M.set(k,{k,nm:nm||QG_NONE[by],L:[],n:0,won:0,lost:0,val:0,wval:0,gp:0}).get(k);g.L.push(q);g.n++;g.val+=c.net;
    if(q.status==='won'){const pr=qgProfit(q,c);g.won++;g.wval+=c.net;g.gp+=pr.v}else if(q.status==='lost')g.lost++});
  return [...M.values()].sort((a,b)=>(a.k==='~')-(b.k==='~')||b.wval-a.wval||b.val-a.val)}
const qgVw=()=>['c','p'].includes(S.qView)?S.qView:'';
function qgSwitch(){const v=S.qView==='a'?'a':qgVw(),b=(k,l)=>`<button type="button" class="btn sm${v===k?' pri':''}" data-a="qgView" data-k="${k}" aria-pressed="${v===k}">${l}</button>`;
  return `<span class="qg-sw"><small class="muted">ดูแบบ</small>${b('','รายการ')}${b('c','ตามลูกค้า')}${b('p','ตามโครงการ')}${b('a','วิเคราะห์')}</span>`}
ACT.qgView=b=>{S.qView=b.dataset.k;render()};
ACT.qgFold=b=>{const F=S.qgFold=S.qgFold||{};F[b.dataset.k]=!F[b.dataset.k];render()};
ACT.qgMet=b=>{S.qgMet=b.dataset.k;render()};
// the chart: one bar per group, the won part darker; value, number of jobs or profit
function qgChart(G,by){const m=['val','n','gp'].includes(S.qgMet)?S.qgMet:'val',top=G.slice(0,12);
  const tot=x=>m==='val'?x.val:m==='n'?x.n:x.gp,won=x=>m==='val'?x.wval:m==='n'?x.won:x.gp,mx=Math.max(1,...top.map(x=>Math.abs(tot(x))));
  const f=v=>m==='n'?fmt(v,0):fmt(v,0),mb=(k,l)=>`<button type="button" class="btn sm${m===k?' pri':''}" data-a="qgMet" data-k="${k}" aria-pressed="${m===k}">${l}</button>`;
  const T={n:sum(G,x=>x.n),won:sum(G,x=>x.won),val:sum(G,x=>x.val),wval:sum(G,x=>x.wval),gp:sum(G,x=>x.gp)};
  return `<section class="card qg-ch"><h2><span>ภาพรวม${by==='c'?'ตามลูกค้า':'ตามโครงการ'}</span><small>${G.length} ${by==='c'?'ลูกค้า':'โครงการ'} · ${T.n} ใบเสนอราคา · ได้งาน ${T.won} (${T.n?fmt(T.won*100/T.n,0):0}%) · มูลค่าได้งาน ${fmt(T.wval,0)} บาท · กำไร ${fmt(T.gp,0)} บาท</small></h2><div class="qg-bar"><small class="muted">กราฟ</small>${mb('val','มูลค่า')}${mb('n','จำนวนงาน')}${mb('gp','กำไร / ขาดทุน')}</div>
  <div class="qg-bars">${top.map(x=>{const a=tot(x),w=won(x),neg=m==='gp'&&a<0;
    return `<div class="qg-r"><div class="qg-nm" title="${esc(x.nm)}">${esc(x.nm)}</div><div class="qg-tr"><div class="qg-b${m==='gp'?' qg-gp':''}${neg?' neg':''}" style="width:${Math.abs(a)/mx*100}%"></div>${m!=='gp'?`<div class="qg-w" style="width:${Math.abs(w)/mx*100}%"></div>`:''}</div>
    <div class="qg-v">${m==='gp'?`<b${neg?' class="qg-neg"':''}>${f(a)}</b>`:`<b>${f(w)}</b> <small class="muted">/ ${f(a)}</small>`}</div></div>`}).join('')}</div>
  <p class="hint" style="margin:8px 0 0">${m==='gp'?'กำไร / ขาดทุนของงานที่ได้: งานที่เปิดโครงการแล้วใช้ค่าคาดการณ์ของโครงการ (มูลค่าสัญญา − ต้นทุนคาดการณ์) ที่เหลือใช้กำไรขั้นต้นในใบเสนอราคา':'<span class="qg-k qg-kw"></span> ได้งาน &nbsp; <span class="qg-k"></span> เสนอราคาทั้งหมด'}${G.length>top.length?` · แสดง ${top.length} อันดับแรก`:''}</p></section>`}
{const f=salesQuote;salesQuote=function(){let h=f.apply(this,arguments);
  const C=CO(),L0=C.quotes.slice().reverse();h=h.replace(/(<section class="card"><h2><span>ใบเสนอราคา<\/span>[\s\S]*?<\/h2>)/,`$1<div class="qg-bar">${qgSwitch()}</div>`);
  const by=qgVw();if(!by)return h;
  const L=L0.filter(q=>(!S.qPjF||pjKey(qPjOf(q)||'-')===S.qPjF)&&qByOk(q)),G=qgStats(L,by),F=S.qgFold||{};
  const m=h.match(/<div class="tw"><table class="q-list"><thead><tr><th>เลขที่<\/th>[\s\S]*?<\/thead><tbody>([\s\S]*?)<\/tbody><\/table><\/div>/);if(!m)return h;
  const R={};(m[1].match(/<tr class="[^"]*"><td><button type="button" class="btn ghost sm" data-a="sel" data-k="quote" data-id="[^"]+">[\s\S]*?<\/tr>/g)||[]).forEach(r=>{R[r.match(/data-id="([^"]+)"/)[1]]=r});
  const body=G.map(g=>{const fk=by+':'+g.k,fo=!!F[fk];
    return `<tr class="qg-h"><td colspan="14"><button type="button" class="qg-hb" data-a="qgFold" data-k="${esc(fk)}" aria-expanded="${!fo}"><span aria-hidden="true">${fo?'▸':'▾'}</span> <b>${esc(g.nm)}</b></button>
      <span class="qg-st">${g.n} ใบ · ได้งาน ${g.won}${g.lost?` · ไม่ได้ ${g.lost}`:''} · เสนอ ${fmt(g.val,0)} · ได้งาน ${fmt(g.wval,0)} บาท${g.won?` · กำไร <b${g.gp<0?' class="qg-neg"':''}>${fmt(g.gp,0)}</b>`:''}</span></td></tr>${fo?'':g.L.map(q=>R[q.id]||'').join('')}`}).join('');
  h=h.replace(m[0],m[0].replace(m[1],body||'<tr><td colspan="14" class="empty">ยังไม่มีใบเสนอราคา</td></tr>'));
  return h.replace(/<section class="card"><h2><span>ใบเสนอราคา<\/span>/,qgChart(G,by)+'$&')}}
document.head.insertAdjacentHTML('beforeend',`<style>
.qg-bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:-4px 0 10px}.qg-sw{display:inline-flex;gap:4px;align-items:center;flex-wrap:wrap}.qg-sw small{margin-right:2px}
tr.qg-h td{background:var(--surface-2,rgba(127,127,127,.08));padding:8px 10px}.qg-hb{background:none;border:0;color:inherit;font:inherit;cursor:pointer;padding:0;margin-right:10px}
.qg-st{font-size:13px;color:var(--muted)}.qg-neg{color:var(--danger)}
.qg-ch h2 small{font-weight:400}
.qg-bars{display:grid;gap:6px}.qg-r{display:grid;grid-template-columns:minmax(120px,240px) 1fr minmax(110px,auto);gap:10px;align-items:center;font-size:13px}
.qg-nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.qg-tr{position:relative;height:18px;background:var(--line);border-radius:4px;overflow:hidden}
.qg-b{position:absolute;inset:0 auto 0 0;background:color-mix(in srgb,var(--accent,#0e7490) 30%,transparent);border-radius:4px}.qg-w{position:absolute;inset:0 auto 0 0;background:var(--accent,#0e7490);border-radius:4px}
.qg-b.qg-gp{background:var(--good)}.qg-b.qg-gp.neg{background:var(--danger)}.qg-v{text-align:right;white-space:nowrap}
.qg-k{display:inline-block;width:12px;height:10px;border-radius:2px;background:color-mix(in srgb,var(--accent,#0e7490) 30%,transparent);vertical-align:middle}.qg-k.qg-kw{background:var(--accent,#0e7490)}
@media (max-width:640px){.qg-r{grid-template-columns:1fr;gap:2px}.qg-v{text-align:left}}
</style>`);
Object.assign(SBKW,{'co.sales.quote':(SBKW['co.sales.quote']||'')+' ตามลูกค้า ตามโครงการ กราฟลูกค้า มูลค่าได้งาน กำไรขาดทุน อัตราได้งาน'});
