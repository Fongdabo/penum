/* ---------- 3.10: 3-week look-ahead and manpower histogram ----------
   The schedule page gets three tabs: the Gantt, a three-week look-ahead (this week and the next two, day by day,
   with who is responsible, the crew and what must be ready first) and a manpower histogram (planned crew per week
   from the tasks, against the men actually on site from the daily reports).
   A task's crew is typed as text, e.g. "ช่างท่อลม 4, ผู้ช่วยช่าง 2", and kept as t.crew=[{trade,n}].
   Work days are Monday to Saturday; Sunday is shown but not counted. */
const crewOf=t=>Array.isArray(t.crew)?t.crew.filter(c=>c&&c.trade&&n(c.n)>0):[];
const crewN=t=>sum(crewOf(t),c=>n(c.n));
const crewTxt=t=>crewOf(t).map(c=>`${c.trade} ${n(c.n)}`).join(', ');
function crewParse(s){const out=[];String(s||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean).forEach(x=>{const m=x.match(/^(.*?)\s*[x×:=]?\s*(\d+(?:\.\d+)?)\s*(?:คน)?$/);
  const trade=(m?m[1]:x).trim()||'ช่าง',k=m?+m[2]:1;const o=out.find(c=>c.trade===trade);if(o)o.n+=k;else out.push({trade,n:k})});return out}
HOOK.push((p,v)=>{const m=p.match(/^tasks\.([^.]+)\.crewTxt$/);if(!m)return;const t=P.tasks.find(x=>x.id===m[1]);if(!t)return;delete t.crewTxt;t.crew=crewParse(v)});
// a starting crew for a task, from its BOQ work group or its name; office work (submittals, drawings, buying) has none
const CREW_G={eq:[['ช่างแอร์',3],['ผู้ช่วยช่าง',3]],pipe:[['ช่างแอร์',4],['ผู้ช่วยช่าง',2]],duct:[['ช่างท่อลม',4],['ผู้ช่วยช่าง',2]],chw:[['ช่างท่อ',4],['ผู้ช่วยช่าง',2]],
  el:[['ช่างไฟฟ้า',3],['ผู้ช่วยช่าง',1]],smk:[['ช่างท่อลม',3],['ผู้ช่วยช่าง',1]],fp:[['ช่างท่อ',4],['ผู้ช่วยช่าง',2]],elb:[['ช่างไฟฟ้า',4],['ผู้ช่วยช่าง',2]],
  plb:[['ช่างประปา',3],['ผู้ช่วยช่าง',2]],civ:[['ช่างปูน',3],['ผู้ช่วยช่าง',2]]};
const CREW_N=[[/ทดสอบแรงดัน|ฉนวน/,[['ช่างแอร์',2],['ผู้ช่วยช่าง',2]]],[/T&C|เดินระบบ/i,[['ช่างแอร์',2],['ช่างไฟฟ้า',1]]],[/TAB|สมดุล/i,[['ช่างแอร์',2]]],
  [/Punch|งานค้าง|แก้ไข/i,[['ช่างแอร์',2],['ช่างไฟฟ้า',1]]],[/ท่อลม|หัวจ่าย/,CREW_G.duct],[/ท่อน้ำ|น้ำยา/,CREW_G.pipe],[/ไฟฟ้า|สายไฟ/,CREW_G.el],[/ติดตั้ง.*(เครื่อง|FCU|AHU|Chiller)/i,CREW_G.eq],[/โยธา|ฐาน/,CREW_G.civ]];
function crewGuess(t){if(durOf(t)<=0||/Submittal|Shop Drawing|สั่งซื้อ|ส่งอนุมัติ|ลงนาม|ส่งมอบงาน$/i.test(t.name||''))return [];
  const g=t.g&&CREW_G[t.g]||(CREW_N.find(([re])=>re.test(t.name||''))||[])[1]||[];return g.map(([trade,k])=>({trade,n:k}))}
ACT.crewFill=()=>{let k=0;P.tasks.forEach(t=>{if(crewOf(t).length)return;const c=crewGuess(t);if(c.length){t.crew=c;k++}});save();render();toast(k?`ใส่ทีมช่างตั้งต้นให้ ${k} งาน แก้จำนวนได้ในตาราง`:'ทุกงานมีทีมช่างแล้ว')};

const isSun=d=>pd(d).getDay()===0;
const monOf=d=>{const x=pd(d);x.setDate(x.getDate()-((x.getDay()+6)%7));return iso(x)};
const thDow=d=>['อา','จ','อ','พ','พฤ','ศ','ส'][pd(d).getDay()];
const onD=(r,d)=>r.es<=d&&d<=r.ef;
// planned men on a day, by trade
function menOn(s,d){const by={};if(isSun(d))return by;P.tasks.forEach(t=>{const r=s.R[t.id];if(durOf(t)<=0||!onD(r,d))return;crewOf(t).forEach(c=>by[c.trade]=(by[c.trade]||0)+n(c.n))});return by}
const actOn=d=>{const L=(P.daily||[]).filter(x=>x.date===d);return L.length?sum(L,x=>sum(x.men||[],m=>n(m.n))):null};

/* --- look-ahead --- */
function laData(off){const s=sched(),a=addD(monOf(today()),7*(off|0)),b=addD(a,20),days=[...Array(21)].map((_,i)=>addD(a,i));
  const T=P.tasks.map((t,i)=>({t,i,r:s.R[t.id]})).filter(({t,r})=>r&&r.es<=b&&r.ef>=a&&!(n(t.pct)>=100&&r.ef<a));
  const po=(P.pos||[]).filter(x=>okD(x.due)&&x.due<=b&&poState(x).k!=='ok').sort((x,y)=>x.due<y.due?-1:1);
  return {s,a,b,days,T,po}}
function laView(){const off=S.laOff|0,{s,a,b,days,T,po}=laData(off),td=today();
  const need=T.filter(({t})=>(t.cons||'').trim()&&n(t.pct)<100),noCrew=P.tasks.filter(t=>durOf(t)>0&&!crewOf(t).length).length;
  const cell=(x,d)=>{const act=durOf(x.t)>0?onD(x.r,d):x.r.es===d;if(!act)return `<td class="la-d${isSun(d)?' su':''}${d===td?' td':''}"></td>`;
    return `<td class="la-d${isSun(d)?' su':''}${d===td?' td':''}"><i class="${durOf(x.t)<=0?'ms':x.r.crit&&n(x.t.pct)<100?'cr':''}${n(x.t.pct)>=100?' dn':''}"></i></td>`};
  const head=`<tr><th rowspan="2">#</th><th rowspan="2" class="la-n">งาน</th><th rowspan="2">ผู้รับผิดชอบ</th><th rowspan="2">ทีมช่าง (คน)</th><th rowspan="2">เสร็จ</th><th rowspan="2">%</th>
    ${[0,1,2].map(w=>`<th colspan="7" class="la-w">สัปดาห์ ${thD(days[w*7]).replace(/ \d{2,4}$/,'')} – ${thD(days[w*7+6]).replace(/ \d{2,4}$/,'')}${off+w===0?' (สัปดาห์นี้)':''}</th>`).join('')}
    <th rowspan="2" class="la-c">ต้องเตรียม / ข้อจำกัด</th></tr><tr>${days.map(d=>`<th class="la-d${isSun(d)?' su':''}${d===td?' td':''}"><small>${thDow(d)}</small><br>${pd(d).getDate()}</th>`).join('')}</tr>`;
  const rows=T.map(x=>{const t=x.t,late=n(t.pct)<100&&x.r.ef<td;return `<tr class="${x.r.crit&&n(t.pct)<100?'crit':''}"><td class="muted r">${x.i+1}</td><td class="la-n">${esc(t.name)}</td>
    <td><input data-p="tasks.${t.id}.who" value="${esc(t.who||'')}" placeholder="ชื่อ / ทีม" aria-label="ผู้รับผิดชอบ" style="width:110px"></td>
    <td><input data-p="tasks.${t.id}.crewTxt" value="${esc(crewTxt(t))}" placeholder="${durOf(t)<=0?'':'เช่น '+esc(crewGuess(t).map(c=>c.trade+' '+c.n).join(', ')||'ช่างแอร์ 3, ผู้ช่วยช่าง 2')}" aria-label="ทีมช่าง" style="width:170px"></td>
    <td class="${late?'':'muted'}" style="white-space:nowrap;${late?'color:var(--danger)':''}">${thD(x.r.ef).replace(/ \d{2,4}$/,'')}</td>
    <td><input class="r" inputmode="numeric" data-p="tasks.${t.id}.pct" data-t="num" value="${n(t.pct)}" aria-label="ร้อยละ" style="width:46px"></td>
    ${days.map(d=>cell(x,d)).join('')}
    <td class="la-c"><input data-p="tasks.${t.id}.cons" value="${esc(t.cons||'')}" placeholder="เช่น แบบอนุมัติ ของเข้า พื้นที่ว่าง" aria-label="ต้องเตรียม" style="width:220px"></td></tr>`}).join('');
  const men=days.map(d=>{const v=sum(Object.values(menOn(s,d)));return `<td class="la-d r${isSun(d)?' su':''}${d===td?' td':''}">${isSun(d)||!v?'':v}</td>`}).join('');
  const act=days.map(d=>{const v=actOn(d);return `<td class="la-d r${isSun(d)?' su':''}${d===td?' td':''}">${v==null?'':v}</td>`}).join('');
  return `<section class="card"><h2><span>แผนงาน 3 สัปดาห์ล่วงหน้า</span><small>${thD(a)} – ${thD(b)} · งานที่ทำในช่วงนี้ ${T.length} งาน · ใช้ประชุมหน้างานทุกสัปดาห์ ตกลงว่าใครทำอะไร ใช้กี่คน และต้องเตรียมอะไรก่อน</small><span class="sp"></span>
    <button type="button" class="btn sm" data-a="laOff" data-d="-1" aria-label="สัปดาห์ก่อน">‹</button><button type="button" class="btn sm${off?'':' pri'}" data-a="laOff" data-d="0">สัปดาห์นี้</button><button type="button" class="btn sm" data-a="laOff" data-d="1" aria-label="สัปดาห์ถัดไป">›</button>
    <button type="button" class="btn sm" data-a="print" data-k="la">พิมพ์</button></h2>
    ${noCrew?`<p class="hint" style="margin:0 0 10px">ยังไม่ได้ใส่ทีมช่าง ${noCrew} งาน <button type="button" class="btn sm" data-a="crewFill">ใส่ทีมช่างตั้งต้นตามหมวดงาน</button></p>`:''}
    ${T.length?`<div class="tw"><table class="la-t"><thead>${head}</thead><tbody>${rows}
      <tr class="la-sum"><td></td><td class="la-n" colspan="5"><b>กำลังคนตามแผน (คน/วัน)</b></td>${men}<td></td></tr>
      <tr class="la-sum"><td></td><td class="la-n" colspan="5">คนที่มาจริง (จากรายงานประจำวัน)</td>${act}<td></td></tr></tbody></table></div>
      <div class="legend" style="margin-top:8px"><span><i style="background:var(--plan)"></i>วันที่ทำงาน</span><span><i style="background:var(--danger)"></i>งานวิกฤต</span><span><i style="background:var(--good)"></i>เสร็จแล้ว</span><span><i style="background:#E0A100"></i>หมุดหมาย</span></div>`
      :'<p class="empty">ไม่มีงานในช่วง 3 สัปดาห์นี้ ลองเลื่อนสัปดาห์ หรือสร้างแผนงานในแท็บแผนงาน Gantt</p>'}</section>
  <div class="grid2"><section class="card"><h2><span>ต้องเตรียมก่อนเริ่มงาน</span><small>${need.length} งาน</small></h2>${need.length?`<ul class="la-l">${need.map(({t,r})=>`<li><b>${esc(t.name)}</b> <small class="muted">${r.es>td?'เริ่ม '+thD(r.es):'กำลังทำ ถึง '+thD(r.ef)}${t.who?' · '+esc(t.who):''}</small><br>${esc(t.cons)}</li>`).join('')}</ul>`:'<p class="empty">ยังไม่มี ใส่ในช่อง "ต้องเตรียม / ข้อจำกัด" ของแต่ละงาน</p>'}</section>
  <section class="card"><h2><span>ของที่ต้องเข้าหน้างาน</span><small>ใบสั่งซื้อที่กำหนดส่งภายใน ${thD(b)} และยังรับไม่ครบ</small></h2>${po.length?`<ul class="la-l">${po.map(x=>`<li><b>${esc(x.no)}</b> ${esc(vName(x.vid))} <small class="${x.due<td?'':'muted'}" style="${x.due<td?'color:var(--danger)':''}">กำหนดส่ง ${thD(x.due)}${x.due<td?' · เลยกำหนด':''}</small><br><small class="muted">${esc((x.items||[]).slice(0,3).map(l=>l.desc).join(', '))}${(x.items||[]).length>3?' …':''}</small></li>`).join('')}</ul>`:'<p class="empty">ไม่มีของค้างส่งในช่วงนี้</p>'}</section></div>`}
ACT.laOff=b=>{const d=+b.dataset.d;S.laOff=d?(S.laOff|0)+d:0;render()};

/* --- manpower histogram --- */
const MP_C=['#2A9DAB','#7C5CFF','#E0A100','#D9534F','#3C9D5D','#8A6D3B','#4A78C2','#C2569B','#6B7B8C'];
function mpData(){const s=sched();if(!P.tasks.length)return null;const a=monOf(s.st),b=s.fin>today()?s.fin:today(),W=[];
  for(let w=a;w<=b;w=addD(w,7)){const by={};let wd=0,mx=0,ad=0,an=0;for(let i=0;i<7;i++){const d=addD(w,i);if(isSun(d))continue;wd++;const m=menOn(s,d);let t=0;
      Object.entries(m).forEach(([k,v])=>{by[k]=(by[k]||0)+v;t+=v});mx=Math.max(mx,t);const x=actOn(d);if(x!=null){ad++;an+=x}}
    Object.keys(by).forEach(k=>by[k]=by[k]/wd);W.push({w,by,tot:sum(Object.values(by)),mx,act:ad?an/ad:null,md:sum(Object.values(by))*wd})}
  const trades=[...new Set(W.flatMap(x=>Object.keys(x.by)))].sort((x,y)=>sum(W,w=>w.by[y]||0)-sum(W,w=>w.by[x]||0));
  return {s,W,trades,peak:W.reduce((m,x)=>x.tot>m.tot?x:m,W[0]||{tot:0})}}
function mpChart(D,wd=900,ht=300){const {W,trades}=D,L=40,R=12,T=16,B=34,mx=Math.max(4,...W.map(x=>Math.max(x.tot,x.act||0)))*1.12,bw=(wd-L-R)/W.length,td=monOf(today());
  const Y=v=>T+(ht-T-B)*(1-v/mx),step=mx>60?20:mx>30?10:mx>12?5:2;let g='';for(let v=0;v<=mx;v+=step)g+=`<line x1="${L}" x2="${wd-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${v}</text>`;
  const ev=Math.ceil(W.length/(wd/60));
  const bars=W.map((x,i)=>{let y0=Y(0),o='';trades.forEach((k,j)=>{const v=x.by[k]||0;if(!v)return;const y1=Y(0)-(Y(0)-Y(v));const h=Y(0)-Y(v);o+=`<rect x="${(L+i*bw+bw*.12).toFixed(1)}" y="${(y0-h).toFixed(1)}" width="${(bw*.76).toFixed(1)}" height="${h.toFixed(1)}" fill="${MP_C[j%MP_C.length]}"><title>${thD(x.w)} ${esc(k)} ${fmt(v,1)} คน</title></rect>`;y0-=h});
    const lb=i%ev===0?`<text x="${(L+i*bw+bw/2).toFixed(1)}" y="${ht-B+15}" text-anchor="middle" font-size="10.5" fill="var(--muted)">${pd(x.w).getDate()}/${pd(x.w).getMonth()+1}</text>`:'';
    return o+lb+(x.w===td?`<rect x="${(L+i*bw).toFixed(1)}" y="${T}" width="${bw.toFixed(1)}" height="${ht-T-B}" fill="none" stroke="var(--danger)" stroke-dasharray="4 3"/><text x="${(L+i*bw+bw/2).toFixed(1)}" y="${T-4}" text-anchor="middle" font-size="10.5" fill="var(--danger)">สัปดาห์นี้</text>`:'')}).join('');
  const pts=W.map((x,i)=>x.act==null?null:[L+i*bw+bw/2,Y(x.act)]),seg=[];let cur=[];pts.forEach(p=>{if(p)cur.push(p);else if(cur.length){seg.push(cur);cur=[]}});if(cur.length)seg.push(cur);
  const line=seg.map(s=>`<path d="${s.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('')}" fill="none" stroke="var(--ink,#222)" stroke-width="2.5"/>`).join('')+pts.filter(Boolean).map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="var(--ink,#222)"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${wd} ${ht}" role="img" aria-label="กราฟกำลังคนรายสัปดาห์">${g}${bars}${line}<text x="${L}" y="${ht-4}" font-size="10.5" fill="var(--muted)">สัปดาห์ที่เริ่มวันจันทร์</text></svg>
    <div class="legend">${trades.map((k,j)=>`<span><i style="background:${MP_C[j%MP_C.length]}"></i>${esc(k)}</span>`).join('')}<span><i style="background:var(--ink,#222);height:3px"></i>คนที่มาจริง</span></div>`}
function mpView(){const D=mpData();if(!D)return '<section class="card"><p class="empty">ยังไม่มีแผนงาน สร้างแผนในแท็บแผนงาน Gantt ก่อน</p></section>';
  const {W,trades,peak}=D,noCrew=P.tasks.filter(t=>durOf(t)>0&&!crewOf(t).length).length,td=monOf(today()),cw=W.find(x=>x.w===td),nx=W.filter(x=>x.w>td).slice(0,3);
  const md=sum(W,x=>x.md),actMd=sum(P.daily||[],d=>sum(d.men||[],m=>n(m.n))),mdTo=sum(W.filter(x=>x.w<=td),x=>x.md);
  const tbl=`<div class="tw"><table><thead><tr><th>ประเภทช่าง</th><th class="r">สูงสุด (คน)</th><th class="r">เฉลี่ยช่วงที่ทำ</th><th class="r">แรงงานรวม (คน-วัน)</th>${nx.map(x=>`<th class="r">สัปดาห์ ${pd(x.w).getDate()}/${pd(x.w).getMonth()+1}</th>`).join('')}</tr></thead><tbody>
    ${trades.map(k=>{const v=W.map(x=>x.by[k]||0),on=v.filter(Boolean);return `<tr><td>${esc(k)}</td><td class="r">${fmt(Math.max(...v),1)}</td><td class="r">${fmt(on.length?sum(on,x=>x)/on.length:0,1)}</td><td class="r">${fmt(sum(W,x=>(x.by[k]||0)*x.md/(x.tot||1)))}</td>${nx.map(x=>`<td class="r">${x.by[k]?fmt(x.by[k],1):''}</td>`).join('')}</tr>`}).join('')}
    <tr><td><b>รวม</b></td><td class="r"><b>${fmt(peak.tot,1)}</b></td><td></td><td class="r"><b>${fmt(md)}</b></td>${nx.map(x=>`<td class="r"><b>${fmt(x.tot,1)}</b></td>`).join('')}</tr></tbody></table></div>`;
  return `<dl class="stats"><div><dt>กำลังคนสูงสุดตามแผน</dt><dd>${fmt(peak.tot,1)} <small>คน · สัปดาห์ ${thD(peak.w)}</small></dd></div>
    <div><dt>สัปดาห์นี้ ตามแผน / มาจริง</dt><dd>${cw?fmt(cw.tot,1):'–'} <small>/ ${cw&&cw.act!=null?fmt(cw.act,1):'–'} คน</small></dd></div>
    <div><dt>แรงงานตามแผนถึงสัปดาห์นี้</dt><dd>${fmt(mdTo)} <small>คน-วัน</small></dd></div>
    <div><dt>แรงงานที่มาจริง (รายงาน)</dt><dd>${fmt(actMd)} <small>คน-วัน · จาก ${new Set((P.daily||[]).map(d=>d.date)).size} วันที่มีรายงาน</small></dd></div></dl>
  <section class="card"><h2><span>กราฟกำลังคน (Manpower Histogram)</span><small>แท่ง = จำนวนช่างเฉลี่ยต่อวันตามแผน แยกประเภท (จันทร์–เสาร์) · เส้น = คนที่มาจริงเฉลี่ยจากรายงานประจำวัน</small><span class="sp"></span><button type="button" class="btn sm" data-a="print" data-k="mp">พิมพ์</button></h2>
    ${noCrew?`<p class="hint" style="margin:0 0 10px">ยังไม่ได้ใส่ทีมช่าง ${noCrew} งาน กราฟจึงยังไม่ครบ <button type="button" class="btn sm" data-a="crewFill">ใส่ทีมช่างตั้งต้นตามหมวดงาน</button> หรือใส่เองในแท็บแผน 3 สัปดาห์</p>`:''}
    ${trades.length?mpChart(D):'<p class="empty">ยังไม่มีงานที่ใส่ทีมช่าง</p>'}</section>
  ${trades.length?`<section class="card"><h2><span>กำลังคนแยกประเภทช่าง</span><small>ใช้วางแผนจ้างช่างและผู้รับเหมาช่วงล่วงหน้า</small></h2>${tbl}</section>`:''}`}

/* --- prints --- */
PRINT.la=()=>{const {s,a,b,days,T,po}=laData(S.laOff|0),td=today();
  const c=(x,d)=>{const act=durOf(x.t)>0?onD(x.r,d):x.r.es===d;return `<td class="lp-d${isSun(d)?' su':''}">${act?`<i class="${durOf(x.t)<=0?'ms':x.r.crit&&n(x.t.pct)<100?'cr':''}"></i>`:''}</td>`};
  return `<style>@page{size:A4 landscape;margin:8mm}.lp{font-size:10px}.lp table{width:100%;border-collapse:collapse;table-layout:fixed}.lp th,.lp td{border:1px solid #bbb;padding:2px 3px;vertical-align:middle}
  .lp th{background:#eef3f5;font-weight:600}.lp .lp-d{padding:0;text-align:center;font-size:9px}.lp .su{background:#f3f3f3}.lp .lp-d i{display:block;height:9px;margin:0 -1px;background:#2A9DAB}.lp .lp-d i.cr{background:#D9534F}
  .lp .lp-d i.ms{width:8px;height:8px;margin:auto;background:#E0A100;transform:rotate(45deg)}.lp .r{text-align:right}.lp h3{font-size:12px;margin:10px 0 4px}.lp ul{margin:0;padding-left:16px}</style>
  <div class="lp">${phead('แผนงาน 3 สัปดาห์ล่วงหน้า',`${thD(a)} – ${thD(b)} · พิมพ์ ${thD(td)}`)}
  <table><colgroup><col style="width:6mm"><col style="width:52mm"><col style="width:22mm"><col style="width:30mm">${days.map(()=>'<col>').join('')}<col style="width:42mm"></colgroup>
  <thead><tr><th rowspan="2">#</th><th rowspan="2">งาน</th><th rowspan="2">ผู้รับผิดชอบ</th><th rowspan="2">ทีมช่าง</th>${[0,1,2].map(w=>`<th colspan="7">${thD(days[w*7]).replace(/ \d{2,4}$/,'')} – ${thD(days[w*7+6]).replace(/ \d{2,4}$/,'')}</th>`).join('')}<th rowspan="2">ต้องเตรียม / ข้อจำกัด</th></tr>
  <tr>${days.map(d=>`<th class="lp-d${isSun(d)?' su':''}">${thDow(d)}<br>${pd(d).getDate()}</th>`).join('')}</tr></thead>
  <tbody>${T.map(x=>`<tr><td class="r">${x.i+1}</td><td>${esc(x.t.name)}${n(x.t.pct)?` <small>(${n(x.t.pct)}%)</small>`:''}</td><td>${esc(x.t.who||'')}</td><td>${esc(crewTxt(x.t))}</td>${days.map(d=>c(x,d)).join('')}<td>${esc(x.t.cons||'')}</td></tr>`).join('')||`<tr><td colspan="26">ไม่มีงานในช่วงนี้</td></tr>`}
  <tr><td></td><td colspan="3"><b>กำลังคนตามแผน (คน/วัน)</b></td>${days.map(d=>{const v=sum(Object.values(menOn(s,d)));return `<td class="lp-d${isSun(d)?' su':''}">${v||''}</td>`}).join('')}<td></td></tr></tbody></table>
  ${po.length?`<h3>ของที่ต้องเข้าหน้างาน</h3><ul>${po.map(x=>`<li>${esc(x.no)} ${esc(vName(x.vid))} กำหนดส่ง ${thD(x.due)}</li>`).join('')}</ul>`:''}
  <table style="margin-top:14px;table-layout:auto"><tr><td style="height:40px;width:33%">ผู้จัดทำ<br><br>.............................</td><td style="width:33%">ผู้จัดการโครงการ<br><br>.............................</td><td>รับทราบ (ผู้รับเหมาช่วง / หัวหน้าช่าง)<br><br>.............................</td></tr></table></div>`};
PRINT.mp=()=>{const D=mpData();if(!D)return phead('กราฟกำลังคน','')+'<p>ยังไม่มีแผนงาน</p>';
  return `<style>@page{size:A4 landscape;margin:10mm}.mpp svg{width:100%;height:auto}.mpp .legend{display:flex;gap:12px;flex-wrap:wrap;font-size:11px}.mpp .legend i{display:inline-block;width:12px;height:10px;margin-right:4px}
  .mpp table{width:100%;border-collapse:collapse;font-size:11px;margin-top:10px}.mpp th,.mpp td{border:1px solid #bbb;padding:3px 5px}.mpp .r{text-align:right}</style>
  <div class="mpp">${phead('กราฟกำลังคน (Manpower Histogram)',`กำลังคนสูงสุดตามแผน ${fmt(D.peak.tot,1)} คน สัปดาห์ ${thD(D.peak.w)}`)}${mpChart(D,1000,330)}
  <table><thead><tr><th>ประเภทช่าง</th><th class="r">สูงสุด (คน)</th><th class="r">แรงงานรวม (คน-วัน)</th></tr></thead><tbody>${D.trades.map(k=>`<tr><td>${esc(k)}</td><td class="r">${fmt(Math.max(...D.W.map(x=>x.by[k]||0)),1)}</td><td class="r">${fmt(sum(D.W,x=>(x.by[k]||0)*x.md/(x.tot||1)))}</td></tr>`).join('')}</tbody></table></div>`};

/* --- the schedule page gets its tabs --- */
{const f=VIEWS.sched;VIEWS.sched=()=>{const {cur,html}=subTabs('sched',[['g','แผนงาน Gantt'],['la','แผน 3 สัปดาห์'],['mp','กราฟกำลังคน']]);return html+(cur==='la'?laView():cur==='mp'?mpView():f())}}
SBSUB['pj.sched']='g=แผนงาน Gantt|la=แผน 3 สัปดาห์ล่วงหน้า|mp=กราฟกำลังคน';
Object.assign(SBKW,{'pj.sched.la':'3 week look ahead lookahead แผนสัปดาห์ ประชุมหน้างาน 3wla','pj.sched.mp':'manpower histogram กำลังคน แรงงาน ช่าง คน-วัน'});

// demo: crews on the tasks, and a few things to prepare
{const f=ACT.loadDemo;ACT.loadDemo=b=>{const r=f(b);projects().forEach(p=>{const keep=P;P=p;let k=0;p.tasks.forEach(t=>{if(!crewOf(t).length){const c=crewGuess(t);if(c.length)t.crew=c}});
  const s=sched(),td=today(),soon=p.tasks.filter(t=>durOf(t)>0&&n(t.pct)<100&&s.R[t.id].ef>=td).slice(0,6);
  const C=['รอแบบ Shop Drawing อนุมัติ','ต้องให้โยธาเปิดฝ้าก่อน','รอเครื่องเข้าหน้างาน ตาม PO','ขอใบอนุญาตทำงานที่สูง','นัดที่ปรึกษาตรวจก่อนปิดฝ้า','ยืนยันจำนวนช่างกับผู้รับเหมาช่วง'];
  const W=['คุณสมชาย','ทีมช่างแอร์ A','ทีมท่อลม B','ทีมไฟฟ้า C'];soon.forEach((t,i)=>{if(!t.who)t.who=W[i%W.length];if(!t.cons&&i%2===0)t.cons=C[k++%C.length]});P=keep});save();render();return r}}

document.head.insertAdjacentHTML('beforeend',`<style>
.la-t{border-collapse:separate;border-spacing:0;font-size:13px;min-width:100%}
.la-t th,.la-t td{padding:5px 6px;border-bottom:1px solid var(--line);white-space:nowrap}
.la-t th{font-weight:600;font-size:12px;color:var(--muted);background:var(--sunk)}
.la-t .la-n{min-width:200px;white-space:normal}
.la-t .la-w{text-align:center;border-left:2px solid var(--line)}
.la-t .la-d{width:26px;min-width:26px;padding:4px 0;text-align:center;font-size:11.5px}
.la-t th.la-d{line-height:1.15}
.la-t .la-d.su{background:color-mix(in srgb,var(--line) 45%,transparent)}
.la-t .la-d.td{box-shadow:inset 1px 0 var(--danger),inset -1px 0 var(--danger)}
.la-t .la-d i{display:block;height:12px;margin:0 -1px;background:var(--plan);border-radius:2px}
.la-t .la-d i.cr{background:var(--danger)}.la-t .la-d i.dn{background:var(--good)}
.la-t .la-d i.ms{width:10px;height:10px;margin:auto;background:#E0A100;transform:rotate(45deg)}
.la-t tr.crit .la-n{color:var(--danger)}
.la-t .la-sum td{background:var(--sunk);font-size:12.5px}
.la-t .r{text-align:right}
.la-l{margin:0;padding-left:18px;display:grid;gap:8px;font-size:14px}
</style>`);
