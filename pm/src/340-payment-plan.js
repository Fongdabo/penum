/* ---------- round 2.2: scope of work and payment terms on quotations, payment plan per project ---------- */
const SOWSYS=[['gen','ทั่วไป'],['ac','ระบบปรับอากาศและระบายอากาศ'],['el','ระบบไฟฟ้า'],['pl','ระบบประปาและสุขาภิบาล'],['fp','ระบบป้องกันอัคคีภัย'],['lv','ระบบไฟฟ้ากำลังต่ำและสื่อสาร'],['bms','ระบบควบคุมอาคารอัตโนมัติ (BMS)']];
const SOWK=[['inc','รวมในราคา'],['exc','ไม่รวมในราคา'],['note','หมายเหตุ']];
const SOWLIB={
  gen:{inc:['จัดหาวัสดุ อุปกรณ์ และแรงงานติดตั้งตามรายการในใบเสนอราคา','จัดทำแบบขยาย (Shop Drawing) ส่งอนุมัติก่อนติดตั้ง','ทดสอบและเดินระบบ (Testing & Commissioning) พร้อมรายงานผล','จัดทำแบบสร้างจริง (As-built Drawing) และคู่มือใช้งานและบำรุงรักษา','อบรมการใช้งานให้เจ้าหน้าที่ของผู้ว่าจ้าง','รับประกันผลงาน 1 ปี นับจากวันส่งมอบ'],
    exc:['งานโยธา เจาะ สกัด และซ่อมผนัง ฝ้า พื้น หลังติดตั้ง','งานสี ตกแต่ง และงานซ่อมผิวที่ไม่ได้ระบุ','ค่าธรรมเนียม ใบอนุญาต และค่าขอใช้ไฟฟ้า น้ำประปาจากหน่วยงานราชการ','ค่าน้ำ ค่าไฟฟ้าระหว่างก่อสร้างและทดสอบระบบ','งานที่ไม่ได้ระบุไว้ในใบเสนอราคานี้']},
  ac:{inc:['เครื่องปรับอากาศ พัดลมระบายอากาศ ตามยี่ห้อและขนาดที่ระบุ','ท่อน้ำยา ท่อน้ำทิ้ง พร้อมฉนวนหุ้มท่อ','ท่อลม หัวจ่ายลม หัวรับลมกลับ ฉนวนท่อลม และแดมเปอร์','ฐานรองเครื่อง ขาแขวน และอุปกรณ์กันสั่นสะเทือน','ปรับสมดุลลมและน้ำ (TAB) และวัดค่าอุณหภูมิ ความชื้น'],
    exc:['สายไฟเมนและเบรกเกอร์ที่ตู้ไฟหลักของอาคาร','งานรื้อถอนเครื่องปรับอากาศเดิม (ถ้ามี)','โครงเหล็กรองรับคอนเดนซิ่งบนหลังคาที่ต้องคำนวณโครงสร้าง']},
  el:{inc:['ตู้ไฟฟ้า MDB / DB และเบรกเกอร์ตามแบบ','สายไฟฟ้า ท่อร้อยสาย รางเดินสาย ตามมาตรฐาน วสท.','ดวงโคม สวิตช์ เต้ารับ ตามรายการ','ระบบสายดินและล่อฟ้าตามแบบ','ทดสอบความเป็นฉนวนและค่าความต้านทานดิน พร้อมรายงาน'],
    exc:['หม้อแปลงไฟฟ้าและงานระบบไฟฟ้าแรงสูงของการไฟฟ้า','ค่าขอใช้ไฟฟ้าและค่ามิเตอร์','เครื่องกำเนิดไฟฟ้าสำรอง (ถ้าไม่ได้ระบุ)']},
  pl:{inc:['ท่อน้ำดี ท่อน้ำเสีย ท่อระบายอากาศ ตามแบบ','สุขภัณฑ์และอุปกรณ์ตามรายการ','ปั๊มน้ำ ถังเก็บน้ำ และระบบควบคุมตามแบบ','ทดสอบแรงดันท่อและทดสอบการไหล'],
    exc:['บ่อบำบัดน้ำเสียและงานต่อเชื่อมท่อสาธารณะนอกอาคาร','ค่าขอใช้น้ำประปาและมิเตอร์']},
  fp:{inc:['ท่อดับเพลิง หัวกระจายน้ำดับเพลิง ตู้สายฉีดน้ำดับเพลิง','ปั๊มดับเพลิงและชุดควบคุมตามแบบ','ระบบแจ้งเหตุเพลิงไหม้ อุปกรณ์ตรวจจับ และกระดิ่ง','ทดสอบแรงดันและทดสอบการทำงานร่วมกับระบบอื่น'],
    exc:['ค่าตรวจสอบและรับรองจากหน่วยงานภายนอก','ถังดับเพลิงชนิดมือถือ (ถ้าไม่ได้ระบุ)']},
  lv:{inc:['ระบบสายสัญญาณ LAN โทรศัพท์ ตามแบบ','ระบบกล้องวงจรปิดและเครื่องบันทึก','ระบบเสียงประกาศและระบบควบคุมการเข้าออกตามรายการ','ทดสอบสายสัญญาณพร้อมรายงานผล'],
    exc:['อุปกรณ์เครือข่ายและค่าบริการอินเทอร์เน็ต','การตั้งค่าซอฟต์แวร์ของผู้ว่าจ้าง']},
  bms:{inc:['ตัวควบคุม DDC เซนเซอร์ และอุปกรณ์ขับตามรายการจุดควบคุม','ซอฟต์แวร์แสดงผลและตั้งเวลาทำงาน','เชื่อมต่อเครื่องปรับอากาศ ปั๊ม และพัดลมตามรายการ','ทดสอบจุดควบคุมทุกจุด (Point-to-point)'],
    exc:['คอมพิวเตอร์และจอแสดงผล (ถ้าไม่ได้ระบุ)','การเชื่อมต่อกับระบบของผู้ผลิตรายอื่นที่ไม่เปิดโปรโตคอล']}};
const SOW_G={eq:'ac',pipe:'ac',duct:'ac',chw:'ac',el:'ac',smk:'ac',fp:'fp',elb:'el',plb:'pl',fa:'fp',com:'lv',cctv:'lv',acc:'lv',pa:'lv',bms:'lv',lp:'el',genr:'el',sol:'el',wwt:'pl',mg:'pl'};
const PAYSTD=[['เงินล่วงหน้าเมื่อลงนามสัญญา',30],['เมื่ออุปกรณ์หลักเข้าหน้างาน',30],['เมื่อติดตั้งแล้วเสร็จ',30],['เมื่อทดสอบและส่งมอบงาน',10]];
NEW.sow=()=>({sys:'gen',kind:'inc',text:''});
NEW.qpay=arr=>({no:String(arr.length+1),desc:'',pct:0});
const qEnsure=Q=>{Q.sow=Q.sow||[];Q.qpay=Q.qpay||[];return Q};
const sowSort=L=>L.slice().sort((a,b)=>SOWSYS.findIndex(x=>x[0]===a.sys)-SOWSYS.findIndex(x=>x[0]===b.sys)||SOWK.findIndex(x=>x[0]===a.kind)-SOWK.findIndex(x=>x[0]===b.kind));
function sowFill(Q,sys){qEnsure(Q);let k=0;sys.forEach(s=>{const L=SOWLIB[s];if(!L)return;['inc','exc'].forEach(kind=>L[kind].forEach(text=>{if(!Q.sow.some(x=>x.sys===s&&x.text===text)){Q.sow.push({id:uid(),sys:s,kind,text});k++}}))});return k}
const sowDetect=Q=>['gen',...new Set(Q.items.map(i=>SOW_G[i.g]).filter(Boolean))];
ACT.sowStd=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;const k=sowFill(Q,sowDetect(Q));save();render();toast(k?`เพิ่มขอบเขตงานมาตรฐาน ${k} ข้อ แก้ข้อความหรือลบข้อที่ไม่ใช้ได้เลย`:'มีขอบเขตงานมาตรฐานครบแล้ว')};
ACT.sowSys=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),s=$('#sowSys').value;if(!Q)return;const k=sowFill(Q,[s]);save();render();toast(k?`เพิ่ม${SOWSYS.find(x=>x[0]===s)[1]} ${k} ข้อ`:'ระบบนี้มีครบแล้ว')};
ACT.qpayStd=b=>{const Q=qEnsure(CO().quotes.find(q=>q.id===b.dataset.id)||{});if(!Q.id)return;if(Q.qpay.length&&!confirm('แทนที่งวดเดิม?'))return;Q.qpay=PAYSTD.map(([d,p],i)=>({id:uid(),no:String(i+1),desc:d,pct:p}));save();render()};
{const f=salesQuote;salesQuote=function(){const h=f(),C=CO(),sel=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes[C.quotes.length-1];if(!sel)return h;qEnsure(sel);
  const b=`co.quotes.${sel.id}`,c=qCalc(sel),tp=sum(sel.qpay,x=>x.pct),rows=sowSort(sel.sow);
  const pay=`<section class="card"><h2><span>เงื่อนไขการชำระเงิน (งวดเงิน)</span><small>พิมพ์ในใบเสนอราคา และเมื่อกด “ได้งาน” จะกลายเป็นแผนงวดเงินของโครงการ${sel.qpay.length&&Math.abs(tp-100)>0.01?` · <span class="pill warn">รวม ${fmt(tp,1)}% ยังไม่เท่ากับ 100%</span>`:''}</small></h2>
    ${gtable(`${b}.qpay`,sel.qpay,[{k:'no',h:'งวด',w:50},{k:'desc',h:'เมื่อ',w:320},{k:'pct',h:'% ของราคา',t:'num',w:80,sum:x=>x.pct},{k:'amt',h:'จำนวนเงิน (ไม่รวม VAT)',t:'num',w:130},{h:'รวม VAT',t:'calc',r:1,f:x=>fmt(c.grand*n(x.pct)/100)}].map(x=>x.k==='amt'?Object.assign(x,{t:'calc',r:1,f:y=>`<input class="r" inputmode="decimal" data-qamt="${b}.qpay.${y.id}" data-base="${c.net}" value="${fmt(c.net*n(y.pct)/100,2)}" aria-label="จำนวนเงิน">`}):x),{empty:'ยังไม่กำหนดงวดเงิน'})}
    <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="${b}.qpay">+ เพิ่มงวด</button><button type="button" class="btn sm" data-a="qpayStd" data-id="${sel.id}">ใช้งวดมาตรฐาน 30/30/30/10</button></div></section>`;
  const sow=`<section class="card"><h2><span>ขอบเขตงาน (Scope of Work)</span><small>แนบท้ายใบเสนอราคาเมื่อพิมพ์ แยกตามระบบ บอกชัดว่าอะไรรวมและไม่รวมในราคา · ${rows.length} ข้อ</small></h2>
    ${gtable(`${b}.sow`,rows,[{k:'sys',h:'ระบบ',t:'sel',o:SOWSYS,w:190},{k:'kind',h:'ประเภท',t:'sel',o:SOWK,w:120},{k:'text',h:'รายละเอียด',t:'area',w:420}],{empty:'ยังไม่มีขอบเขตงาน กด “เติมขอบเขตงานมาตรฐาน” แล้วแก้ตามงานจริง',rowCls:r=>r.kind==='exc'?'sow-exc':''})}
    <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="sowStd" data-id="${sel.id}">เติมขอบเขตงานมาตรฐานตามหมวดในใบเสนอราคา</button><select id="sowSys" aria-label="ระบบ">${SOWSYS.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select><button type="button" class="btn sm" data-a="sowSys" data-id="${sel.id}">เพิ่มระบบนี้</button><button type="button" class="btn sm" data-a="add" data-c="${b}.sow">+ เพิ่มข้อ</button></div></section>`;
  return h+pay+sow}}
document.addEventListener('change',e=>{const t=e.target;if(!t.dataset||!t.dataset.qamt)return;e.stopImmediatePropagation();const base=n(t.dataset.base);setPath(t.dataset.qamt+'.pct',base?Math.round(n(t.value)*1e6/base)/1e4:0);save();render()},true);
function sowPrint(Q){const rows=qEnsure(Q).sow.filter(x=>String(x.text||'').trim());if(!rows.length)return '';
  const by=SOWSYS.filter(([k])=>rows.some(x=>x.sys===k)),li=(s,k)=>rows.filter(x=>x.sys===s&&x.kind===k).map(x=>`<li>${esc(x.text)}</li>`).join('');
  return `<div style="page-break-before:always"></div><div class="sow-h"><small>SCOPE OF WORK</small><b>ขอบเขตงาน</b> แนบท้ายใบเสนอราคาเลขที่ ${esc(Q.no)}</div>
  ${by.map(([s,l])=>{const i=li(s,'inc'),x=li(s,'exc'),nt=li(s,'note');return `<div class="sow-s"><h3>${l}</h3><div class="sow-2"><div><h4>รวมในราคา</h4>${i?`<ol>${i}</ol>`:'<p>–</p>'}</div><div><h4>ไม่รวมในราคา</h4>${x?`<ol>${x}</ol>`:'<p>–</p>'}</div></div>${nt?`<h4>หมายเหตุ</h4><ul>${nt}</ul>`:''}</div>`}).join('')}`}
function qpayPrint(Q){const L=qEnsure(Q).qpay;if(!L.length)return '';const c=qCalc(Q);
  return `<h3 style="margin-top:12px">เงื่อนไขการชำระเงิน</h3><table><thead><tr><th>งวด</th><th>เมื่อ</th><th>%</th><th>จำนวนเงิน (ไม่รวม VAT)</th><th>รวม VAT</th></tr></thead><tbody>${L.map(x=>`<tr><td>${esc(x.no)}</td><td>${esc(x.desc)}</td><td style="text-align:right">${fmt(x.pct,1)}%</td><td style="text-align:right">${fmt(c.net*n(x.pct)/100,2)}</td><td style="text-align:right">${fmt(c.grand*n(x.pct)/100,2)}</td></tr>`).join('')}</tbody></table>`}
{const f=PRINT.quote;PRINT.quote=id=>{const Q=CO().quotes.find(q=>q.id===id);let h=f(id);if(!Q)return h;const k=h.indexOf('<h3 style="margin-top:12px">เงื่อนไข</h3>');if(k>=0)h=h.slice(0,k)+qpayPrint(Q)+h.slice(k);return h+sowPrint(Q)}}
{const f=ACT.qWon;ACT.qWon=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),had=Q&&Q.pj&&DB.projects[Q.pj];f(b);if(!Q||had||!Q.pj||!DB.projects[Q.pj])return;const p=DB.projects[Q.pj];qEnsure(Q);
  if(Q.qpay.length&&!(p.inst||[]).length){p.inst=Q.qpay.map(x=>({id:uid(),no:x.no,desc:x.desc,pct:n(x.pct),task:'',date:''}));p.info.billMode='pct'}
  if(Q.sow.length)p.sow=Q.sow.map(x=>Object.assign({},x,{id:uid()}));save();render()}}

/* --- payment plan: planned instalments against what was actually billed and received --- */
NEW.inst=arr=>({no:String(arr.length+1),desc:'',pct:0,task:'',date:''});
function instPlan(){const L=P.inst||[],s=sched(),C=contract(),cr=pjCredit(P);let cum=0;
  return L.map(x=>{const r=x.task&&s.R[x.task],d=okD(x.date)?x.date:r?(r.ef||r.es):'';cum+=n(x.pct);return {x,d,auto:!okD(x.date)&&!!d,amt:C.total*n(x.pct)/100,cum,cumAmt:C.total*cum/100,rcv:d?addD(d,cr):''}})}
function instActual(L){const C=contract(),pct=P.info.billMode==='pct',prog=billsSorted().filter(b=>(b.kind||'prog')==='prog'&&b.status!=='draft').map(b=>({b,c:billCalc(b)}));let run=0;prog.forEach(r=>{run+=r.c.amt;r.run=run});
  return L.map(r=>{const m=pct?prog.find(y=>y.b.inst===r.x.id):prog.find(y=>y.run>=r.cumAmt-0.5);return m?{b:m.b,date:m.b.date,paid:m.b.status==='paid'?(m.b.paid||m.b.date):'',rc:billRecv(m.b),net:m.c.net}:null})}
ACT.instDates=q=>{const s=sched(),span=Math.max(1,(pd(s.fin)-pd(s.st))/864e5);let cum=0,k=0;(P.inst||[]).forEach(x=>{cum+=n(x.pct);if(okD(x.date)||x.task)return;
  let d=s.st;for(let i=0;i<=span+1;i++){d=addD(s.st,i);if(s.planAt(d)>=Math.min(99.9,cum)-0.01)break}x.date=d;k++});save();render();if(q!=='quiet')toast(k?`ตั้งวันตามแผนงานให้ ${k} งวด`:'ทุกงวดมีวันแล้ว')};
function payChart(R,A){const td=today(),bl=billsSorted().filter(b=>(b.kind||'prog')==='prog'&&b.status!=='draft');if(!R.some(r=>r.d))return '';
  // 3.62: labelled like the S-Curve: each instalment's date and running total, today's planned / billed / received figures, and plain baht on the axis
  const ds=[...R.map(r=>r.d),...bl.map(b=>b.date),td].filter(okD).sort(),d0=ds[0],d1=ds[ds.length-1],span=Math.max(1,(pd(d1)-pd(d0))/864e5),C=contract(),top=Math.max(1,C.total,sum(bl,b=>billCalc(b).amt));
  const st0=top/4,mg=10**Math.floor(Math.log10(st0)),stp=[1,2,2.5,5,10].map(k=>k*mg).find(v=>v>=st0),mx=Math.ceil(top/stp-1e-9)*stp;
  const wd=900,ht=240,l=78,r=14,t=14,bt=26,X=d=>l+(pd(d)-pd(d0))/864e5/span*(wd-l-r),Y=v=>t+(ht-t-bt)*(1-v/mx);
  const mb=v=>Math.abs(v)>=1e6?`${(v/1e6).toLocaleString('th-TH',{maximumFractionDigits:2})} ล้าน`:fmt(v);
  const steps=(L,end)=>{let v=0;const o=[[d0,0]];L.forEach(([d,a])=>{if(d>end)return;o.push([d,v]);v+=a;o.push([d,v])});o.push([end,v]);return {o,v}};
  const end=td<d1?td:d1,PR=R.filter(r=>r.d).sort((a,b)=>a.d.localeCompare(b.d));
  const PLs=steps(PR.map(r=>[r.d,r.amt]),d1),BI=steps(bl.map(b=>[b.date,billCalc(b).amt]),end),RC=steps(bl.flatMap(b=>{const c=billCalc(b);return c.net?billRcList(b).map(x=>[x.date,c.amt*x.amt/c.net]):[]}).sort((a,b)=>a[0].localeCompare(b[0])),end);
  const path=o=>o.map(([d,v],i)=>`${i?'L':'M'}${X(d).toFixed(1)},${Y(v).toFixed(1)}`).join(''),planNow=sum(PR.filter(r=>r.d<=td),r=>r.amt);
  const mons=[];let m=pd(d0.slice(0,7)+'-01');while(iso(m)<=d1){if(iso(m)>=d0)mons.push(iso(m));m.setMonth(m.getMonth()+1)}
  const grid=Array.from({length:Math.round(mx/stp)+1},(_,i)=>i*stp).map(v=>`<line x1="${l}" x2="${wd-r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${l-6}" y="${Y(v)+4}" text-anchor="end" font-size="10.5" fill="var(--muted)">${mb(v)}</text>`).join('');
  const inT=td>=d0&&td<=d1,tx=inT?`<line x1="${X(td)}" x2="${X(td)}" y1="${t}" y2="${ht-bt}" stroke="var(--danger)" stroke-dasharray="4 3"/><text x="${X(td)+(X(td)+36>wd-r?-4:4)}" y="${t+10}" font-size="11" text-anchor="${X(td)+36>wd-r?'end':'start'}" fill="var(--danger)">วันนี้</text>`:'';
  let cum=0;const dots=PR.map(x=>{cum+=x.amt;return {x,cum}});
  const LB=[],lab=(x,y,tt,col,o={})=>LB.push(Object.assign({x,y,t:tt,col,fs:11,w:600},o));
  if(inT){lab(X(td),Y(planNow),`ควรเบิกถึงวันนี้ ${mb(planNow)}`,'var(--muted)',{pri:2});if(bl.length){lab(X(end),Y(BI.v),`เบิกแล้ว ${mb(BI.v)}`,'var(--accent)',{pri:2});if(Math.abs(BI.v-RC.v)>0.5)lab(X(end),Y(RC.v),`รับแล้ว ${mb(RC.v)}`,'var(--good)',{pri:2})}}
  dots.forEach(({x,cum})=>lab(X(x.d),Y(cum),`งวด ${x.x.no} · ${thD(x.d).replace(/ \d+$/,'')} · ${mb(cum)}`,'var(--muted)',{fs:10.5,w:500,side:'l'}));
  const SG=[],xy=o=>o.map(([d,v])=>[X(d),Y(v)]);chartSeg(SG,xy(PLs.o));if(bl.length){chartSeg(SG,xy(BI.o));chartSeg(SG,xy(RC.o))}
  const box=inT?[[X(td)+36>wd-r?X(td)-34:X(td)+2,t-2,32,15]]:[],labels=chartLabels(LB,SG,box,{wd,ht,L:l,T:t,B:bt});
  const gap=planNow-BI.v,wait=BI.v-RC.v;
  return `<svg class="chart" viewBox="0 0 ${wd} ${ht}" role="img" aria-label="แผนงวดเงินเทียบเบิกจริง">${grid}
  ${mons.filter((_,i)=>mons.length<=14||i%2===0).map(d=>`<text x="${X(d)}" y="${ht-8}" text-anchor="middle" font-size="10.5" fill="var(--muted)">${thM(d.slice(0,7))}</text>`).join('')}${tx}
  <path d="${path(PLs.o)}" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="6 4"/>${dots.map(({x,cum})=>`<circle cx="${X(x.d)}" cy="${Y(cum)}" r="3.5" fill="var(--surface)" stroke="var(--muted)" stroke-width="1.5"><title>งวด ${esc(x.x.no)} · ${thD(x.d)} · ${fmt(x.amt)} บาท (สะสม ${fmt(cum)})</title></circle>`).join('')}
  ${bl.length?`<path d="${path(BI.o)}" fill="none" stroke="var(--accent)" stroke-width="2.5"/><path d="${path(RC.o)}" fill="none" stroke="var(--good)" stroke-width="2.5"/>`:''}${labels}</svg>
  <div class="legend"><span><i style="background:var(--muted)"></i>ตามแผนงวดเงิน (สะสม)</span><span><i style="background:var(--accent)"></i>เบิกจริงสะสม ${fmt(BI.v)} บาท</span><span><i style="background:var(--good)"></i>รับเงินแล้วสะสม ${fmt(RC.v)} บาท</span>
  ${inT?`<span style="color:${gap>0.5?'var(--danger)':'var(--good)'}">${gap>0.5?`เบิกช้ากว่าแผน ${fmt(gap)} บาท`:'เบิกตามแผนหรือเร็วกว่า'}</span>`:''}${wait>0.5?`<span>รอรับเงิน ${fmt(wait)} บาท</span>`:''}<span class="muted">เส้นประสีแดง = วันนี้ ${thD(td)} · ยอดไม่รวม VAT</span></div>`}
function costPlan(){P.inst=P.inst||[];const R=instPlan(),A=instActual(R),C=contract(),td=today(),tp=sum(P.inst,x=>x.pct),s=sched();
  const late=R.filter((r,i)=>!A[i]&&r.d&&r.d<td),next=R.find((r,i)=>!A[i]&&r.d&&r.d>=td);
  const billed=sum(billsSorted().filter(b=>(b.kind||'prog')==='prog'&&b.status!=='draft'),b=>billCalc(b).amt),planNow=sum(R.filter(r=>r.d&&r.d<=td),r=>r.amt);
  const ms=()=>[['','–'],...P.tasks.filter(t=>durOf(t)===0||t.ms).map(t=>[t.id,t.name])];
  const cols=[{k:'no',h:'งวด',w:46},{k:'desc',h:'เงื่อนไข / งานที่ต้องเสร็จ',t:'area',w:280},{k:'pct',h:'%',t:'num',w:64,sum:x=>x.pct},
    {h:'จำนวนเงิน',t:'calc',r:1,f:x=>`<input class="r" inputmode="decimal" data-iamt="inst.${x.id}" data-base="${C.total}" value="${fmt(C.total*n(x.pct)/100,2)}" aria-label="จำนวนเงิน" style="min-width:110px">`,tv:x=>fmt(C.total*n(x.pct)/100,2)},
    {k:'task',h:'ผูกกับหมุดหมายในแผน',t:'sel',w:170,o:ms},
    {h:'วันที่ตามแผน',t:'calc',f:x=>{const r=R.find(y=>y.x===x);return `<input type="date" data-p="inst.${x.id}.date" value="${esc(okD(x.date)?x.date:'')}" aria-label="วันที่ตามแผน">${r&&r.auto?`<br><small class="muted">ตามแผนงาน ${thD(r.d)}</small>`:''}`},tv:x=>{const r=R.find(y=>y.x===x);return r&&r.d||''}},
    {h:'คาดรับเงิน',t:'calc',f:x=>{const r=R.find(y=>y.x===x);return r&&r.rcv?thD(r.rcv):''}},
    {h:'เบิกจริง',t:'calc',f:x=>{const i=R.findIndex(y=>y.x===x),a=A[i],r=R[i];if(!a)return r.d&&r.d<td?`<span class="pill bad">เลยกำหนด ${Math.round((pd(td)-pd(r.d))/864e5)} วัน</span>`:'<span class="pill">ยังไม่ถึง</span>';const dd=r.d?Math.round((pd(a.date)-pd(r.d))/864e5):0;return `${esc(a.b.no)} · ${thD(a.date)}${r.d?` <span class="pill ${dd>7?'warn':'ok'}">${dd>0?'ช้า '+dd:dd<0?'เร็ว '+(-dd):'ตรง'}${dd?' วัน':''}</span>`:''}`},tv:x=>{const a=A[R.findIndex(y=>y.x===x)];return a?a.b.no+' '+a.date:''}},
    {h:'รับเงิน',t:'calc',f:x=>{const a=A[R.findIndex(y=>y.x===x)];return a&&a.paid?`<span class="pill ok">ครบ ${thD(a.paid)}</span>`:a&&a.rc>0.005?`<span class="pill warn">รับไม่ครบ</span>`:a?'<span class="pill info">รอรับ</span>':''},tv:x=>{const a=A[R.findIndex(y=>y.x===x)];return a&&a.paid||''}},
    {h:'รับจริง (ตามสลิป)',t:'calc',r:1,f:x=>{const a=A[R.findIndex(y=>y.x===x)];if(!a||a.rc<=0.005)return '';const l=billRcList(a.b);return `<b style="color:var(--good)">${fmt(a.rc,2)}</b>${l.map(r=>`<br><small class="muted">${thD(r.date)} · ${fmt(r.amt,2)}</small>`).join('')}`},tv:x=>{const a=A[R.findIndex(y=>y.x===x)];return a?fmt(a.rc,2):''}},
    {h:'ค้างรับ',t:'calc',r:1,f:x=>{const a=A[R.findIndex(y=>y.x===x)];if(!a)return '';const o=a.net-a.rc;return o>0.005?`<b style="color:var(--danger)">${fmt(o,2)}</b>`:'<span class="muted">–</span>'},tv:x=>{const a=A[R.findIndex(y=>y.x===x)];return a?fmt(Math.max(0,a.net-a.rc),2):''}}];
  TABLES.inst={rows:()=>P.inst,cols};
  return `<dl class="stats"><div><dt>มูลค่าสัญญา</dt><dd>${fmt(C.total)}</dd><small class="muted">แผนรวม ${fmt(tp,1)}% ${Math.abs(tp-100)>0.01&&P.inst.length?'<span class="pill warn">ยังไม่ครบ 100%</span>':''}</small></div>
    <div><dt>ควรเบิกถึงวันนี้ตามแผน</dt><dd>${fmt(planNow)}</dd></div><div><dt>เบิกจริงแล้ว</dt><dd style="color:${billed+0.5<planNow?'var(--danger)':'inherit'}">${fmt(billed)}</dd><small class="muted">${billed+0.5<planNow?'ช้ากว่าแผน '+fmt(planNow-billed):'ตามแผนหรือเร็วกว่า'}</small></div>
    <div><dt>งวดถัดไป</dt><dd style="font-size:17px">${next?`งวด ${esc(next.x.no)} · ${thD(next.d)}`:'–'}</dd>${next?`<small class="muted">${fmt(next.amt)} บาท</small>`:''}</div>
    <div><dt>รับเงินแล้ว</dt><dd style="color:var(--good)">${fmt(sum(A.filter(Boolean),a=>a.rc))}</dd>${(o=>o>0.005?`<small style="color:var(--danger)">ค้างรับ ${fmt(o)}</small>`:'')(sum(A.filter(Boolean),a=>a.net-a.rc))}</div>
    <div><dt>งวดที่เลยกำหนดยังไม่เบิก</dt><dd style="color:${late.length?'var(--danger)':'inherit'}">${late.length}</dd></div></dl>
  <section class="card"><h2><span>แผนงวดงาน งวดเงิน</span><small>กำหนดงวดเป็น % หรือพิมพ์จำนวนเงิน ผูกกับหมุดหมายในแผนงานหรือใส่วันเอง แล้วเทียบกับที่เบิกจริง ยอดที่ยังไม่เบิกไปลงกระแสเงินสดตามวันในแผนนี้ · ตอนนี้เบิกแบบ${P.info.billMode==='pct'?'เปอร์เซ็นต์ตามงวด (ใบเบิกผูกกับงวด)':'ตามปริมาณงาน (เทียบกับยอดเบิกสะสม)'}</small><span class="sp"></span>${copyBtn('inst')}</h2>
    ${gtable('inst',P.inst,cols,{empty:'ยังไม่มีแผนงวดเงิน',rowCls:x=>{const i=R.findIndex(y=>y.x===x);return !A[i]&&R[i].d&&R[i].d<td?'late':''}})}
    <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="inst">+ เพิ่มงวด</button><button type="button" class="btn sm" data-a="instGen">ตั้งงวดตัวอย่าง 5 งวด</button>${P.tasks.length?'<button type="button" class="btn sm" data-a="instDates">ตั้งวันที่ว่างตามแผนงาน (S-curve)</button>':''}<button type="button" class="btn sm" data-a="go" data-m="pj" data-k="cost" data-s="bill">ไปหน้าเบิกงวด</button></div></section>
  ${R.some(r=>r.d)?`<section class="card"><h2><span>แผนเงินเทียบเบิกจริง</span><small>เส้นประ = ยอดสะสมตามแผนงวดเงิน</small></h2>${payChart(R,A)}</section>`:''}
  ${(P.sow||[]).length?`<section class="card"><h2><span>ขอบเขตงานตามใบเสนอราคา</span><small>${P.sow.length} ข้อ</small></h2>${SOWSYS.filter(([k])=>P.sow.some(x=>x.sys===k)).map(([k,l])=>`<h3 class="fm-g">${l}</h3><ul class="sow-l">${sowSort(P.sow.filter(x=>x.sys===k)).map(x=>`<li class="${x.kind}">${x.kind==='exc'?'<span class="pill">ไม่รวม</span> ':x.kind==='note'?'<span class="pill info">หมายเหตุ</span> ':''}${esc(x.text)}</li>`).join('')}</ul>`).join('')}</section>`:''}`}
document.addEventListener('change',e=>{const t=e.target;if(!t.dataset||!t.dataset.iamt)return;e.stopImmediatePropagation();const base=n(t.dataset.base);setPath(t.dataset.iamt+'.pct',base?Math.round(n(t.value)*1e6/base)/1e4:0);save();render()},true);
VIEWS.cost=()=>{const {cur,html}=subTabs('cost',[['sum','สรุปงบประมาณ'],['plan','แผนงวดเงิน'],['bill','เบิกงวด'],['sub','ผู้รับเหมาช่วง'],['exp','ค่าใช้จ่ายอื่น']]);return html+({sum:costSum,plan:costPlan,bill:costBill,sub:costSub,exp:costExp}[cur])()};

/* --- cash flow: unbilled money arrives on the payment plan's dates when the project has one --- */
{const f=cashflow;cashflow=function(ps,months){const plan=ps.filter(p=>withP(p,()=>(p.inst||[]).length&&instPlan().every(r=>r.d)));if(!plan.length)return f(ps,months);
  // run the original, take back its curve forecast of receipts for planned projects, then add the plan
  const L=f(ps,months);
  const td=today(),M={};plan.forEach(p=>withP(p,()=>{const R=instPlan(),C=contract(),k=1+n(p.info.vat)/100-n(p.info.wht)/100-n(p.info.ret)/100,
      billed=sum(p.bills.filter(b=>b.status!=='draft'&&(b.kind||'prog')==='prog'),b=>billCalc(b).amt),s=p.tasks.length?sched():null;
    // remove the curve forecast this project added
    if(s){const now=s.planAt(td);if(now<99.9){const leftIn=Math.max(0,C.total-billed);let prev=now;for(let i=0;i<36;i++){const d0=pd(td);d0.setDate(1);d0.setMonth(d0.getMonth()+i+1);const e=iso(new Date(d0-864e5)),v=s.planAt(e<td?td:e),fr=(v-prev)/(100-now);prev=v;if(fr<=0)continue;const m=ym(addD(e,30));M[m]=(M[m]||0)-leftIn*fr*k;if(v>=99.9)break}}}
    let lo=0;R.forEach((r,i)=>{const hi=i===R.length-1?Math.max(r.cumAmt,C.total):r.cumAmt,a=Math.max(0,hi-Math.max(lo,billed));lo=hi;if(a>0.5){const m=ym(maxD(r.rcv||r.d,td));M[m]=(M[m]||0)+a*k}})}));
  const by={};L.forEach(x=>by[x.k]=x);Object.keys(M).forEach(m=>{if(!by[m]){by[m]={k:m,in:0,po:0,sub:0,exp:0,fin:0,fout:0,net:0,cum:0}}by[m].fin=Math.max(0,by[m].fin+M[m])});
  const keys=Object.keys(by).sort(),out=[];let cum=0,m=pd(keys[0]+'-01');while(ym(iso(m))<=keys[keys.length-1]&&out.length<60){const k=ym(iso(m)),r=by[k]||{k,in:0,po:0,sub:0,exp:0,fin:0,fout:0};r.k=k;r.net=r.in+r.fin-r.po-r.sub-r.exp-r.fout;cum+=r.net;r.cum=cum;out.push(r);m.setMonth(m.getMonth()+1)}
  return out}}

/* --- reminders: instalments due within a week or overdue --- */
{const f=alerts;alerts=function(){const A=f(),td=today();projects().forEach(p=>withP(p,()=>{if(!(p.inst||[]).length)return;const R=instPlan(),X=instActual(R);
  R.forEach((r,i)=>{if(!X[i]&&r.d&&r.d<=addD(td,7))A.push({lv:r.d<td?'bad':'warn',kind:r.d<td?'งวดเงินเลยกำหนดเบิก':'งวดเงินถึงกำหนดเบิก',p,txt:`งวด ${r.x.no} ${r.x.desc||''} · ${fmt(r.amt)} บาท`,due:r.d,go:{m:'pj',k:'cost',s:'plan'}})})}));return A}}

/* --- demo: give the sample quotation a scope and payment terms, and the projects plan dates --- */
{const f=ACT.loadDemo;ACT.loadDemo=b=>{const r=f(b);CO().quotes.forEach(Q=>{qEnsure(Q);if(!Q.sow.length)sowFill(Q,sowDetect(Q));if(!Q.qpay.length)Q.qpay=PAYSTD.map(([d,p],i)=>({id:uid(),no:String(i+1),desc:d,pct:p}))});
  const keep=P;projects().forEach(p=>{if(!(p.inst||[]).length||!p.tasks.length)return;P=p;ACT.instDates('quiet')});P=keep;save();render();return r}}

/* 3.62: chart labels placed so they overlap neither each other nor any chart line; each sits on a small card */
function chartSeg(SG,o){for(let i=1;i<o.length;i++)SG.push([o[i-1][0],o[i-1][1],o[i][0],o[i][1]])}
function chartLabels(LB,SG,box,{wd,ht,L,T,B}){const tw=(t,fs)=>t.replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g,'').length*fs*0.5+6;LB.sort((p,q)=>(q.pri||0)-(p.pri||0));
  const onLine=(x1,y1,w,h)=>SG.some(([ax,ay,bx,by])=>{if(Math.max(ax,bx)<x1||Math.min(ax,bx)>x1+w||Math.max(ay,by)<y1||Math.min(ay,by)>y1+h)return false;
    const n=Math.max(2,Math.ceil(Math.hypot(bx-ax,by-ay)/2));for(let k=0;k<=n;k++){const x=ax+(bx-ax)*k/n,y=ay+(by-ay)*k/n;if(x>=x1&&x<=x1+w&&y>=y1&&y<=y1+h)return true}return false});
  const hit=(x1,y1,w,h)=>box.some(([a1,b1,w1,h1])=>x1<a1+w1&&a1<x1+w&&y1<b1+h1&&b1<y1+h);
  const LN=[],TX=LB.map(l=>{const w=tw(l.t,l.fs),h=l.fs+7,DY=[];for(let k=0;k<9;k++){const u=k*14;DY.push(...(l.dn?[u+14,-u-10]:[-u-8,u+10]))}
    const fitR=l.x+8+w<wd-2,pref=l.side!=='l'&&fitR,sides=[pref,...((pref?l.x-6-w>=L+2:fitR)?[!pref]:[])];
    const xs=r=>r?l.x+6:Math.max(L+2,l.x-6-w),cand=[];for(const dy of DY)for(const r of sides)cand.push([r,Math.max(T,Math.min(ht-B-h,l.y+dy-h/2)),Math.abs(dy)]);
    const [right,best]=cand.find(([r,yb,dd])=>dd<=40&&!hit(xs(r),yb,w,h)&&!onLine(xs(r),yb,w,h))||cand.find(([r,yb])=>!hit(xs(r),yb,w,h))||[sides[0],Math.max(T,l.y-6-h/2)],x0=xs(right);
    box.push([x0,best,w,h]);const ty=best+h-4,far=Math.abs(best+h/2-l.y)>12||Math.abs((right?x0:x0+w)-l.x)>10;
    if(far)LN.push(`<line x1="${l.x}" y1="${l.y}" x2="${right?x0:x0+w}" y2="${best+h/2}" stroke="${l.col}" stroke-width=".8" opacity=".7"/>`);
    return `<rect x="${x0-1}" y="${best}" width="${w+2}" height="${h}" rx="3" fill="var(--surface)" opacity=".82"/><text x="${right?x0+2:x0+w-2}" y="${ty}" text-anchor="${right?'start':'end'}" font-size="${l.fs}" font-weight="${l.w}" fill="${l.col}" stroke="var(--surface)" stroke-width="2" paint-order="stroke" stroke-linejoin="round">${esc(l.t)}</text>`});return LN.join('')+TX.join('')}
