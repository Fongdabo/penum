/* ---------- 3.64 ทุกโครงการ: every project on one page, above each project's ภาพรวม ----------
   ฝ่ายปฏิบัติการ › โครงการ › ทุกโครงการ: one row per project with progress (actual against plan), claimed and received,
   expected gross profit and what needs attention. The numbers come from pjKpi(), the same function as the project's ภาพรวม,
   and the attention items from alerts(), the same list as its "ต้องดูในโครงการนี้" card, so the two pages always agree.
   A project behind plan by more than 5% or expected to lose money is red; click a row to open that project's ภาพรวม.
   Closed projects are left out unless asked for. */
NAVD.find(d=>d[0]==='pj')[2].unshift(['pj','pjall','','ทุกโครงการ']);
Object.values(ACCESS).forEach(a=>{if(a&&a!=='*'&&Array.isArray(a.pj)&&a.pj.includes('dash'))a.pj.push('pjall')});
ICO.pjall='<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 9v11"/>';
SBKW['pj.pjall']='ทุกโครงการ รวมโครงการ สรุปโครงการ portfolio all projects ภาพรวมทุกโครงการ โครงการช้า ขาดทุน';
const PA_RANK={bad:0,warn:1,ok:2,none:3,done:4,closed:5};
function paRow(p,A){const k=pjKpi(p),I=p.info,has=p.tasks.length>0,td=k.td;
  const late=has?k.plan-k.act:0,done=has&&k.act>=99.9,margin=k.C.total-k.T.fc;
  const el=okD(I.start)&&okD(I.finish)?Math.max(0,Math.min(100,diffD(I.start,td)*100/Math.max(1,diffD(I.start,I.finish)))):null;
  // the project's own alerts, one pill per kind, the urgent kinds first
  const G=new Map();A.filter(a=>a.p&&a.p.id===p.id).forEach(a=>{const g=G.get(a.kind);if(g){g.n++;if(a.lv==='bad')g.lv='bad'}else G.set(a.kind,{kind:a.kind,lv:a.lv,n:1,go:a.go})});
  const att=[...G.values()].sort((a,b)=>(a.lv==='bad'?0:1)-(b.lv==='bad'?0:1)||b.n-a.n);
  const why=[];if(late>5)why.push(`ช้ากว่าแผน ${fmt(late,1)}%`);if(margin<0)why.push('คาดว่าขาดทุน');
  const lv=p.closed?'closed':done?'done':why.length?'bad':late>0.5||att.some(a=>a.lv==='bad')?'warn':has?'ok':'none';
  const st=lv==='bad'?why.join(' · '):lv==='warn'?(late>0.5?`ช้ากว่าแผน ${fmt(late,1)}%`:'มีเรื่องด่วน'):lv==='ok'?(late<-0.5?`เร็วกว่าแผน ${fmt(-late,1)}%`:'ตามแผน'):lv==='done'?'งานเสร็จแล้ว':lv==='closed'?'ปิดโครงการแล้ว':'ยังไม่มีแผนงาน';
  return {p,k,I,has,late,done,margin,el,att,lv,st}}
function paRows(){const A=alerts(),all=projects(),R=all.filter(p=>S.paClosed||!p.closed).map(p=>paRow(p,A)),by=S.paSort||'att';
  const nm=(a,b)=>a.p.name.localeCompare(b.p.name,'th');
  R.sort(by==='name'?nm:by==='start'?(a,b)=>(a.I.start||'9').localeCompare(b.I.start||'9')||nm(a,b):by==='val'?(a,b)=>b.k.C.total-a.k.C.total||nm(a,b):
    by==='profit'?(a,b)=>a.margin-b.margin||nm(a,b):(a,b)=>PA_RANK[a.lv]-PA_RANK[b.lv]||b.late-a.late||nm(a,b));
  return {R,closed:all.filter(p=>p.closed).length}}
VIEWS.pjall=()=>{const {R,closed}=paRows(),O=R.filter(r=>!r.p.closed),tot=f=>sum(O,f);
  const bad=O.filter(r=>r.lv==='bad'),lateN=O.filter(r=>r.late>5).length,lossN=O.filter(r=>r.margin<0).length;
  const T={c:tot(r=>r.k.C.total),b:tot(r=>r.k.billed),r:tot(r=>r.k.recv),m:tot(r=>r.margin)};
  const pill=(lv,t)=>`<span class="pill ${lv==='closed'||lv==='none'?'':lv==='done'?'ok':lv}">${t}</span>`;
  const row=r=>{const {p,k,I,has}=r,red=has&&k.act<k.plan-0.5,go=`data-a="go" data-m="pj" data-k="dash" data-p="${p.id}"`;
    return `<tr class="pa-r pa-${r.lv}" ${go} title="เปิดภาพรวมของโครงการนี้">
    <td data-l="โครงการ"><button type="button" class="pa-nm" ${go}>${esc(p.name)}</button><small class="muted">${[I.client,okD(I.start)?`${thD(I.start)} – ${thD(I.finish)}`:''].filter(Boolean).map(esc).join(' · ')||'ยังไม่ได้ใส่ข้อมูลโครงการ'}</small>${pill(r.lv,r.st)}</td>
    <td class="r" data-l="มูลค่าสัญญา"><b>${fmt(k.C.total)}</b>${k.C.vo?`<small class="muted">งานเพิ่มลด ${k.C.vo>0?'+':''}${fmt(k.C.vo)}</small>`:''}</td>
    <td data-l="ความคืบหน้า จริง / แผน">${has?`<div class="pa-v"><b style="${red?'color:var(--danger)':''}">${pct(k.act)}</b> <small>/ ${pct(k.plan)}</small></div><div class="bar pa-bar"><i style="width:${Math.min(100,k.act)}%;${red?'background:var(--danger)':''}"></i><u style="left:${Math.min(100,k.plan)}%" title="แผน ${pct(k.plan)}"></u></div>`:'<span class="muted">ยังไม่มีแผนงาน</span>'}${r.el!=null?`<small class="muted">เวลาผ่านไป ${fmt(r.el,0)}%</small>`:''}</td>
    <td data-l="เบิกแล้ว / รับเงินแล้ว"><div class="pa-v"><b>${fmt(k.billed)}</b> <small>/ ${fmt(k.recv)}</small></div><div class="bar pa-bar"><i style="width:${k.billed?Math.min(100,k.recv*100/k.billed):0}%"></i></div><small class="muted">เบิกผลงานแล้ว ${k.C.total?fmt(k.work*100/k.C.total,0):0}% ของสัญญา${k.billed-k.recv>0.5?` · ค้างรับ ${fmt(k.billed-k.recv)}`:''}</small></td>
    <td class="r" data-l="กำไรขั้นต้นคาดการณ์"><b style="color:${r.margin>=0?'var(--good)':'var(--danger)'}">${k.C.total?fmt(r.margin*100/k.C.total,1):'0'}%</b><small class="muted">${fmt(r.margin)}</small></td>
    <td data-l="เรื่องที่ต้องดูแล">${r.att.length?`<div class="pa-att">${r.att.slice(0,3).map(a=>`<button type="button" class="pill ${a.lv}" data-a="go" data-m="${a.go.m}" data-k="${a.go.k}"${a.go.s?` data-s="${a.go.s}"`:''} data-p="${p.id}">${a.kind}${a.n>1?` ${a.n}`:''}</button>`).join('')}${r.att.length>3?`<small class="muted">และอีก ${r.att.length-3} เรื่อง</small>`:''}</div>`:'<span class="muted">ไม่มี</span>'}</td></tr>`};
  const sorts=[['att','ต้องดูแลก่อน'],['name','ชื่อโครงการ'],['start','วันเริ่มงาน'],['val','มูลค่าสัญญามากไปน้อย'],['profit','กำไรน้อยไปมาก']];
  return `<dl class="stats">
    <div><dt>โครงการที่กำลังทำ</dt><dd>${O.filter(r=>!r.done).length} <small>/ ${O.length} โครงการ</small></dd>${closed?`<small class="muted">ปิดแล้ว ${closed} โครงการ</small>`:''}</div>
    <div><dt>มูลค่าสัญญารวม</dt><dd>${fmt(T.c)} <small>บาท</small></dd></div>
    <div><dt>เบิกแล้ว / รับเงินแล้ว</dt><dd style="font-size:18px">${fmt(T.b)} <small>/ ${fmt(T.r)}</small></dd><div class="bar"><i style="width:${T.b?Math.min(100,T.r*100/T.b):0}%"></i></div><small class="muted">ยอดสุทธิรวม VAT</small></div>
    <div><dt>กำไรขั้นต้นคาดการณ์รวม</dt><dd style="color:${T.m>=0?'var(--good)':'var(--danger)'}">${T.c?fmt(T.m*100/T.c,1):'0'}% <small>${fmt(T.m)}</small></dd></div>
    <div><dt>ต้องดูแล</dt><dd style="color:${bad.length?'var(--danger)':'var(--good)'}">${bad.length} <small>โครงการ</small></dd><small class="muted">${bad.length?`ช้ากว่าแผนเกิน 5% ${lateN} · คาดว่าขาดทุน ${lossN}`:'ไม่มีโครงการช้าหรือขาดทุน'}</small></div></dl>
  <section class="card"><h2><span>ทุกโครงการ</span><small>กดที่โครงการเพื่อเปิดภาพรวมของโครงการนั้น · แดง = ช้ากว่าแผนเกิน 5% หรือคาดว่าขาดทุน</small></h2>
    <div class="row" style="margin-bottom:10px"><label class="pa-sort">เรียงตาม <select id="paSort">${sorts.map(([v,l])=>`<option value="${v}"${(S.paSort||'att')===v?' selected':''}>${l}</option>`).join('')}</select></label>
      ${closed?`<button type="button" class="btn sm${S.paClosed?' pri':''}" data-a="paClosed" aria-pressed="${!!S.paClosed}">${S.paClosed?'ซ่อนโครงการที่ปิดแล้ว':`แสดงโครงการที่ปิดแล้ว (${closed})`}</button>`:''}</div>
    <div class="tw"><table class="pa-t"><thead><tr><th>โครงการ</th><th class="r">มูลค่าสัญญา</th><th>ความคืบหน้า จริง / แผน</th><th>เบิกแล้ว / รับเงินแล้ว <small class="muted">(สุทธิรวม VAT)</small></th><th class="r">กำไรขั้นต้นคาดการณ์</th><th>เรื่องที่ต้องดูแล</th></tr></thead><tbody>
    ${R.length?R.map(row).join('')+(O.length>1?`<tr class="tot pa-tot"><td>รวม ${O.length} โครงการ${S.paClosed&&closed?' <small class="muted">(ไม่รวมที่ปิดแล้ว)</small>':''}</td><td class="r" data-l="มูลค่าสัญญา">${fmt(T.c)}</td><td></td><td data-l="เบิกแล้ว / รับเงินแล้ว">${fmt(T.b)} <small>/ ${fmt(T.r)}</small></td><td class="r" data-l="กำไรขั้นต้นคาดการณ์" style="color:${T.m>=0?'var(--good)':'var(--danger)'}">${fmt(T.m)}</td><td></td></tr>`:''):'<tr><td colspan="6" class="empty">ยังไม่มีโครงการ</td></tr>'}</tbody></table></div>
    <p class="hint" style="margin-top:10px">ตัวเลขชุดเดียวกับหน้าภาพรวมของแต่ละโครงการ · ความคืบหน้าคิดจากแผนงาน · กำไรขั้นต้นคาดการณ์ = มูลค่าสัญญา − ต้นทุนคาดว่าจะใช้จริง</p></section>`};
ACT.paClosed=()=>{S.paClosed=!S.paClosed;render()};
document.addEventListener('change',e=>{if(e.target.id==='paSort'){S.paSort=e.target.value;render()}});
// this page is about every project, so the header does not name the one picked in the menu
{const f=sbCrumb;sbCrumb=function(){f();if(S.mode==='pj'&&S.tab==='pjall'){const s=document.querySelector('#crumb small');if(s)s.remove()}}}
document.head.insertAdjacentHTML('beforeend',`<style>
.pa-t td{vertical-align:top}
.pa-t td small{display:block;margin-top:3px}
.pa-r{cursor:pointer}
.pa-r:hover td{background:var(--sunk)}
.pa-r.pa-bad td{background:var(--danger-soft)}
.pa-r.pa-bad td:first-child{box-shadow:inset 4px 0 var(--danger)}
.pa-r.pa-warn td:first-child{box-shadow:inset 4px 0 var(--warn-c)}
.pa-r.pa-closed td{opacity:.7}
.pa-nm{all:unset;cursor:pointer;font-weight:700;color:var(--ink);font-size:15px;line-height:1.35}
.pa-nm:hover,.pa-nm:focus-visible{color:var(--accent);text-decoration:underline}
.pa-t td .pill{margin-top:6px}
.pa-v{white-space:nowrap}
.pa-t td .pa-v small{display:inline;margin:0}
.pa-bar{position:relative;overflow:visible;margin-top:6px;min-width:120px}
.pa-bar u{position:absolute;top:-3px;bottom:-3px;width:2px;margin-left:-1px;background:var(--ink);opacity:.55;border-radius:1px}
.pa-att{display:flex;flex-wrap:wrap;gap:5px;max-width:260px}
.pa-att .pill{margin:0;cursor:pointer;font-family:inherit}
.pa-att small{flex-basis:100%;margin:0}
.pa-sort{display:inline-flex;align-items:center;gap:8px}
@media (max-width:760px){
  .pa-t thead{display:none}
  .pa-t,.pa-t tbody,.pa-t tr,.pa-t td{display:block;width:auto}
  .pa-t tr{border-bottom:1px solid var(--line);padding:10px 12px;display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}
  .pa-t td:first-child,.pa-t td:nth-child(3),.pa-t td:nth-child(4),.pa-t td:nth-child(6){grid-column:1/-1}
  .pa-t td:nth-child(2){order:1}.pa-t td:nth-child(5){order:2}.pa-t td:nth-child(3){order:3}.pa-t td:nth-child(4){order:4}.pa-t td:nth-child(6){order:5}
  .pa-t tr .empty{grid-column:1/-1}
  .pa-t td{border:0;padding:4px 0;text-align:left}
  .pa-t td.r{text-align:left}
  .pa-t td:empty{display:none}
  .pa-t td[data-l]:not(:first-child)::before{content:attr(data-l);display:block;font-size:12px;color:var(--muted)}
  .pa-r.pa-bad td,.pa-r:hover td{background:none}
  .pa-r.pa-bad{background:var(--danger-soft);box-shadow:inset 4px 0 var(--danger)}
  .pa-r.pa-warn{box-shadow:inset 4px 0 var(--warn-c)}
  .pa-r td:first-child{box-shadow:none!important}
  .pa-att{max-width:none}}
</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ทุกโครงการ':'All projects','ยอดสุทธิรวม VAT':'Net incl. VAT','มูลค่าสัญญารวม':'Total contract value','กำไรขั้นต้นคาดการณ์รวม':'Total expected gross profit',
  'ต้องดูแล':'Needs attention','เรื่องที่ต้องดูแล':'Needs attention','ต้องดูแลก่อน':'Needs attention first','ชื่อโครงการ':'Project name','วันเริ่มงาน':'Start date','มูลค่าสัญญามากไปน้อย':'Contract value, largest first',
  'กำไรน้อยไปมาก':'Profit, lowest first','เรียงตาม':'Sort by','ซ่อนโครงการที่ปิดแล้ว':'Hide closed projects','ตามแผน':'On plan','มีเรื่องด่วน':'Urgent items','งานเสร็จแล้ว':'Work complete',
  'ปิดโครงการแล้ว':'Project closed','ยังไม่มีแผนงาน':'No schedule yet','คาดว่าขาดทุน':'Expected loss','ไม่มี':'None','ไม่มีโครงการช้าหรือขาดทุน':'No project is late or losing money',
  'เปิดภาพรวมของโครงการนี้':'Open this project\'s overview','กดที่โครงการเพื่อเปิดภาพรวมของโครงการนั้น · แดง = ช้ากว่าแผนเกิน 5% หรือคาดว่าขาดทุน':'Click a project to open its overview · red = more than 5% behind plan or expected loss',
  'ตัวเลขชุดเดียวกับหน้าภาพรวมของแต่ละโครงการ · ความคืบหน้าคิดจากแผนงาน · กำไรขั้นต้นคาดการณ์ = มูลค่าสัญญา − ต้นทุนคาดว่าจะใช้จริง':'Same figures as each project\'s overview · progress comes from the schedule · expected gross profit = contract value − forecast cost'});
if(typeof I18N==='object'&&I18N.en&&I18N.en.p)Object.assign(I18N.en.p,{'แสดงโครงการที่ปิดแล้ว ({0})':'Show closed projects ({0})','ช้ากว่าแผน {0}%':'{0}% behind plan','เร็วกว่าแผน {0}%':'{0}% ahead of plan','รวม {0} โครงการ':'Total {0} projects','ปิดแล้ว {0} โครงการ':'{0} closed','ช้ากว่าแผนเกิน 5% {0} · คาดว่าขาดทุน {1}':'More than 5% behind plan {0} · expected loss {1}','และอีก {0} เรื่อง':'and {0} more','เบิกผลงานแล้ว {0}% ของสัญญา':'{0}% of contract claimed','เบิกผลงานแล้ว {0}% ของสัญญา · ค้างรับ {1}':'{0}% of contract claimed · outstanding {1}'});

