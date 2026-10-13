/* ---------- 3.4.1: the printed schedule carries the Gantt chart ----------
   Landscape A3 or A4. Bars are placed in percent of the chart column so the timeline always fits the page
   width; the header row (task columns + month/week scale) repeats on every printed page. */
function ganttPrint(paper,withS){const s=sched(),T=P.tasks,td=today(),A3=paper!=='A4';
  let a=s.st,b=s.fin;T.forEach(t=>{if(okD(t.bs)&&t.bs<a)a=t.bs;if(okD(t.bf)&&t.bf>b)b=t.bf;if(s.R[t.id].es<a)a=s.R[t.id].es});
  const ad=pd(a);ad.setDate(ad.getDate()-((ad.getDay()+6)%7)-7);a=iso(ad);b=addD(b,7);
  const days=diffD(a,b)+1,X=d=>Math.max(0,Math.min(100,diffD(a,d)/days*100)),W=(d1,d2)=>Math.max(.25,(diffD(d1,d2)+1)/days*100);
  // scale: month bands, then week (or fortnight / month) ticks depending on how long the job is
  const mon=[];{const m=pd(a);m.setDate(1);while(iso(m)<=b){const s0=iso(m)<a?a:iso(m);m.setMonth(m.getMonth()+1);const e0=addD(iso(m),-1)>b?b:addD(iso(m),-1);mon.push([s0,e0])}}
  const step=days<=120?7:days<=300?14:0,ticks=[];if(step)for(let k=0;k<days;k+=step)ticks.push(addD(a,k));
  const grid=(step?ticks:mon.map(m=>m[0])).map(d=>`<i class="gp-v" style="left:${X(d)}%"></i>`).join('')+mon.slice(1).map(m=>`<i class="gp-v m" style="left:${X(m[0])}%"></i>`).join('');
  const tdl=td>=a&&td<=b?`<i class="gp-td" style="left:${X(td)}%"></i>`:'';
  const head=`<div class="gp-sc"><div class="gp-mo">${mon.map(([x,y])=>`<span style="left:${X(x)}%;width:${W(x,y)}%">${pd(x).toLocaleDateString('th-TH',{month:'short',year:'2-digit'})}</span>`).join('')}</div>
    ${step?`<div class="gp-wk">${ticks.map(d=>`<span style="left:${X(d)}%">${pd(d).getDate()}</span>`).join('')}</div>`:''}${tdl?`<b class="gp-tdl" style="left:${X(td)}%">วันนี้</b>`:''}</div>`;
  const rows=T.map((t,i)=>{const r=s.R[t.id],d=r.sum?r.d:durOf(t),p=Math.min(100,n(t.pct)),late=!r.done&&r.ef<td,lv=s.O.lv[i];
    const base=okD(t.bs)&&okD(t.bf)?`<i class="gp-bl" style="left:${X(t.bs)}%;width:${W(t.bs,t.bf)}%"></i>`:'';
    const bar=r.sum?`<i class="gp-b gp-sum" style="left:${X(r.es)}%;width:${W(r.es,r.ef)}%"><i style="width:${p}%"></i></i>`:d>0?`<i class="gp-b${r.crit&&!r.done?' crit':''}${late?' late':''}" style="left:${X(r.es)}%;width:${W(r.es,r.ef)}%"><i style="width:${p}%"></i></i>`:`<i class="gp-ms${p>=100?' done':''}" style="left:${X(r.es)}%"></i>`;
    const lbl=d>0&&X(r.ef)<78?`<em style="left:calc(${X(r.es)+W(r.es,r.ef)}% + 3px)">${p}%</em>`:'';
    return `<tr class="${r.crit&&!r.done?'cr':''}"><td class="r">${i+1}</td><td class="gp-n" style="padding-left:${3+lv*9}px${r.sum?';font-weight:700':''}"><span style="color:#64748b">${s.O.wbs[t.id]}</span> ${esc(t.name)}</td><td>${thD(r.es)}</td><td${late?' class="lt"':''}>${thD(r.ef)}</td><td class="r">${d}</td><td>${esc(depTxt(t))}</td><td class="r">${fmt(p,0)}</td><td class="gp-c"><div>${grid}${base}${bar}${lbl}${tdl}</div></td></tr>`}).join('');
  const plan=s.planAt(td),act=s.act();
  return `<style>@page{size:${A3?'A3':'A4'} landscape;margin:8mm}</style><div class="gp${A3?'':' a4'}">`+phead('แผนงานโครงการ',`ความคืบหน้า ${pct(act)} (แผน ${pct(plan)}) · ${thD(s.st)} – ${thD(s.fin)} ${fmt(diffD(s.st,s.fin)+1)} วัน`)+
  `<table class="gp-t"><colgroup><col style="width:${A3?7:6}mm"><col style="width:${A3?78:58}mm"><col style="width:${A3?17:15}mm"><col style="width:${A3?17:15}mm"><col style="width:${A3?9:8}mm"><col style="width:${A3?16:12}mm"><col style="width:${A3?9:8}mm"><col></colgroup>
  <thead><tr><th>#</th><th>งาน</th><th>เริ่ม</th><th>เสร็จ</th><th>วัน</th><th>ก่อนหน้า</th><th>%</th><th class="gp-h">${head}</th></tr></thead><tbody>${rows||'<tr><td colspan="8">ยังไม่มีแผนงาน</td></tr>'}</tbody></table>
  <div class="gp-lg"><span><i class="gp-b"><i style="width:55%"></i></i>แผน / ทำแล้ว</span><span><i class="gp-b crit"><i style="width:40%"></i></i>สายงานวิกฤต</span><span><i class="gp-bl"></i>แผนฐาน</span><span><i class="gp-ms"></i>หมุดหมาย</span><span><i class="gp-tdk"></i>วันนี้ ${thD(td)}</span><span><b class="lt">วันที่สีแดง</b> = เลยกำหนดยังไม่เสร็จ</span></div>
  ${withS?`<div class="gp-s"><h3>S-Curve</h3>${scurve(A3?1400:1000,A3?330:260)}</div>`:''}</div>`}
PRINT.sched=id=>{const [pp,sc]=String(id||'A3|1').split('|');return ganttPrint(pp,sc!=='0')};
{const f=ACT.print;ACT.print=b=>{if(b.dataset.k==='sched'&&!b.dataset.id){
  dialog('พิมพ์แผนงาน',`<p>แผนงานพร้อมแกนต์ชาร์ตพิมพ์แนวนอน หัวตารางและสเกลวันที่ซ้ำทุกหน้า</p><label style="display:flex;gap:6px;align-items:center;margin-top:8px"><input type="checkbox" id="gpS" checked> แนบ S-Curve หน้าถัดไป</label>`,
    `<button type="button" class="btn pri" data-a="gpGo" data-f="A3">A3 แนวนอน</button><button type="button" class="btn" data-a="gpGo" data-f="A4">A4 แนวนอน</button>`);return}return f(b)}}
ACT.gpGo=b=>{const s=$('#gpS'),id=`${b.dataset.f}|${s&&!s.checked?0:1}`;$('#dlg').close();ACT.print({dataset:{k:'sched',id}})};
document.head.insertAdjacentHTML('beforeend',`<style>
@media print{
 #print .gp{-webkit-print-color-adjust:exact;print-color-adjust:exact}
 #print .gp-t{width:100%;table-layout:fixed;border-collapse:collapse;font-size:9.5px}
 #print .gp.a4 .gp-t{font-size:8.5px}
 #print .gp-t thead{display:table-header-group}
 #print .gp-t th,#print .gp-t td{padding:1.5px 3px;border:1px solid #C9D4D6;line-height:1.25;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
 #print .gp-t th{background:#EEF4F4;font-size:9px}
 #print .gp-t td.r{text-align:right}#print .gp-t .gp-n{white-space:nowrap}
 #print .gp-t tr.cr .gp-n{font-weight:700}#print .gp-t .lt{color:#C0392B;font-weight:700}
 #print .gp-t td.gp-c,#print .gp-t th.gp-h{padding:0;position:relative}
 #print .gp-c>div{position:relative;height:15px}#print .gp:not(.a4) .gp-t td{padding-top:3px;padding-bottom:3px}
 #print .gp-sc{position:relative;height:26px}
 #print .gp-mo span{position:absolute;top:0;height:13px;border-left:1px solid #9AB;padding-left:3px;font-size:8.5px;font-weight:700;color:#24343A;box-sizing:border-box;overflow:hidden}
 #print .gp-wk span{position:absolute;top:14px;font-size:7.5px;color:#556;font-weight:400;transform:translateX(-50%)}
 #print .gp-tdl{position:absolute;top:0;font-size:7.5px;color:#C0392B;transform:translateX(3px)}
 #print .gp-v{position:absolute;top:0;bottom:0;border-left:1px solid #E4EBEC}#print .gp-v.m{border-left-color:#B5C5C8}
 #print .gp-td{position:absolute;top:0;bottom:0;border-left:1.3px dashed #C0392B;z-index:3}
 #print i.gp-b{position:absolute;top:3px;height:9px;background:#C9D9DC;border-radius:2px;overflow:hidden;display:block}
 #print i.gp-b>i{display:block;height:100%;background:#2A9DAB}
 #print i.gp-b.crit{background:#F6C9A0}#print i.gp-b.crit>i{background:#E07B24}
 #print i.gp-b.late{outline:1px solid #C0392B}
 #print i.gp-bl{position:absolute;top:12.5px;height:2px;background:#7A8A90;display:block}
 #print i.gp-ms{position:absolute;top:3px;width:9px;height:9px;background:#24343A;transform:translateX(-50%) rotate(45deg);display:block}#print i.gp-ms.done{background:#2A9DAB}
 #print .gp-c em{position:absolute;top:2px;font-size:7.5px;font-style:normal;color:#556}
 #print .gp-lg{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:9px;margin-top:6px;align-items:center}
 #print .gp-lg span{display:inline-flex;align-items:center;gap:5px}
 #print .gp-lg i.gp-b,#print .gp-lg i.gp-bl,#print .gp-lg i.gp-ms{position:relative;top:0;display:inline-block;width:26px}
 #print .gp-lg i.gp-ms{width:8px;height:8px;transform:rotate(45deg)}
 #print .gp-lg .gp-tdk{display:inline-block;width:0;height:12px;border-left:1.3px dashed #C0392B}
 #print .gp-s{page-break-before:always}#print .gp-s svg{width:100%;height:auto}
}
</style>`);

