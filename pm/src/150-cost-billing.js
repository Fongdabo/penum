/* ---------- cost control: budget (BOQ cost) vs committed vs paid ---------- */
NEW.subs=()=>({name:'',scope:'',g:'',value:0,ret:5,phone:''});
NEW.spay=()=>({date:today(),sub:P.subs[0]?P.subs[0].id:'',desc:'',amt:0});
NEW.costs=()=>({date:today(),g:'',desc:'',amt:0,ref:''});
function costTable(){
  const G={},row=g=>G[g]||(G[g]={g,bud:0,po:0,sub:0,exp:0,paid:0});
  P.boq.items.forEach(i=>row(i.g).bud+=boqCost(i));
  P.pos.forEach(p=>{const k=p.novat?1:1;p.items.forEach(l=>{const v=n(l.q)*n(l.p)*k;row(l.g||'').po+=v;if(p.paid)row(l.g||'').paid+=v})});
  P.subs.forEach(s=>row(s.g||'').sub+=n(s.value));
  P.spay.forEach(x=>{const s=P.subs.find(y=>y.id===x.sub);row(s?s.g||'':'').paid+=n(x.amt)});
  P.costs.forEach(c=>{row(c.g||'').exp+=n(c.amt);row(c.g||'').paid+=n(c.amt)});
  if(typeof labCost==='function'){const v=labCost(P.id);if(v){row('lab').exp+=v;row('lab').paid+=v}}
  const L=Object.values(G).map(r=>Object.assign(r,{com:r.po+r.sub+r.exp,fc:Math.max(r.bud,r.po+r.sub+r.exp)}));
  const order=[...Object.keys(BOQ_G),'lab'];L.sort((a,b)=>(order.indexOf(a.g)+99*!a.g)-(order.indexOf(b.g)+99*!b.g));
  const T={bud:sum(L,r=>r.bud),com:sum(L,r=>r.com),paid:sum(L,r=>r.paid),fc:sum(L,r=>r.fc)};return {L,T};
}

/* ---------- progress billing: by measured quantity or by fixed % instalments ---------- */
NEW.inst=arr=>({no:String(arr.length+1),desc:'',pct:0,task:''});
const BKIND=[['prog','เบิกงวดงาน'],['adv','เบิกเงินล่วงหน้า'],['ret','คืนเงินประกันผลงาน']];
const BSTAT=[['draft','ร่าง'],['sent','ส่งเบิกแล้ว'],['ok','ลูกค้าอนุมัติ'],['paid','รับเงินแล้ว']];
function unitVal(){const t=sum(P.boq.items,i=>n(i.t||boqCost(i)));const k=t?contract().base/t:0;return i=>n(i.t||boqCost(i))/Math.max(1e-9,n(i.q))*k}
function billsSorted(){return P.bills.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')||String(a.no).localeCompare(String(b.no),undefined,{numeric:true}))}
function cumVal(b){if(!b)return 0;const uv=unitVal();return sum(P.boq.items,i=>Math.min(n(i.q),n((b.qty||{})[i.id]))*uv(i))+sum(P.vos.filter(v=>v.status==='ok'),v=>(v.type==='omit'?-1:1)*n(v.amt)*Math.min(100,n((b.vo||{})[v.id]))/100)}
function billCalc(b){
  const I=P.info,C=contract(),prog=billsSorted().filter(x=>(x.kind||'prog')==='prog');
  let amt=0,cum=0;
  if(b.kind==='adv')amt=C.base*n(I.adv)/100;
  else if(b.kind==='ret')amt=sum(P.bills.filter(x=>x.id!==b.id&&(x.kind||'prog')==='prog'),x=>billCalc(x).ret);
  else if(I.billMode==='pct'){const it=(P.inst||[]).find(x=>x.id===b.inst);amt=it?C.total*n(it.pct)/100:0;cum=sum(prog.slice(0,prog.indexOf(b)+1),x=>{const k=(P.inst||[]).find(y=>y.id===x.inst);return k?n(k.pct):0})}
  else{const i=prog.indexOf(b);cum=cumVal(b);amt=cum-(i>0?cumVal(prog[i-1]):0);cum=C.total?cum*100/C.total:0}
  const isP=(b.kind||'prog')==='prog',adv=isP?amt*n(I.adv)/100:0,ret=isP?amt*n(I.ret)/100:0,base=amt-adv,vat=base*n(I.vat)/100,wht=base*n(I.wht)/100;
  return {amt,adv,ret,base,vat,wht,net:base+vat-wht-ret,cum};
}
NEW.bills=arr=>{const prev=billsSorted().filter(x=>(x.kind||'prog')==='prog').pop();const used=new Set(arr.map(b=>b.inst));const ni=(P.inst||[]).find(x=>!used.has(x.id));
  return {no:nextNo('INV-',arr),date:today(),kind:'prog',inst:ni?ni.id:'',qty:prev?Object.assign({},prev.qty):{},vo:prev?Object.assign({},prev.vo||{}):{},status:'draft',paid:'',note:''}};
ACT.billFill=b=>{const B=P.bills.find(x=>x.id===b.dataset.id);if(!B)return;const s=sched();B.qty=B.qty||{};
  P.boq.items.forEach(i=>{const a=s.gAct(i.g);if(a!=null)B.qty[i.id]=Math.round(n(i.q)*a)/100});save();render();toast('ใส่ปริมาณสะสมตาม % ความคืบหน้าของงานแต่ละหมวดแล้ว แก้รายบรรทัดได้')};
ACT.billMode=b=>{P.info.billMode=b.dataset.k;save();render()};
ACT.instGen=()=>{if((P.inst||[]).length&&!confirm('แทนที่งวดเดิม?'))return;const L=[[`เบิกงวดที่ 1 เมื่อวัสดุอุปกรณ์หลักเข้าหน้างาน`,20],['งวดที่ 2 งานติดตั้งท่อและเครื่องแล้วเสร็จ 50%',25],['งวดที่ 3 งานติดตั้งแล้วเสร็จ 100%',25],['งวดที่ 4 ทดสอบและเดินระบบแล้วเสร็จ',20],['งวดที่ 5 ส่งมอบงานและเอกสาร',10]];P.inst=L.map((x,i)=>({id:uid(),no:String(i+1),desc:x[0],pct:x[1],task:''}));save();render()};

VIEWS.cost=()=>{
  const {cur,html}=subTabs('cost',[['sum','สรุปงบประมาณ'],['bill','เบิกงวด'],['sub','ผู้รับเหมาช่วง'],['exp','ค่าใช้จ่ายอื่น']]);
  return html+({sum:costSum,bill:costBill,sub:costSub,exp:costExp}[cur])();
};
function costSum(){
  const C=contract(),{L,T}=costTable(),bl=P.bills.map(b=>[b,billCalc(b)]),work=sum(bl.filter(([b])=>b.status!=='draft'&&(b.kind||'prog')==='prog'),x=>x[1].amt),billed=sum(bl.filter(([b])=>b.status!=='draft'),x=>x[1].net),recv=sum(bl.filter(([b])=>b.status!=='draft'),([b])=>billRecv(b)),
    margin=C.total-T.fc,ret=sum(bl.filter(([b])=>(b.kind||'prog')==='prog'&&b.status!=='draft'),x=>x[1].ret)-sum(bl.filter(([b])=>b.kind==='ret'&&b.status==='paid'),x=>x[1].amt);
  const bar=(v,m)=>`<div class="bar"><i style="width:${Math.min(100,m?v*100/m:0)}%;${v>m&&m?'background:var(--danger)':''}"></i></div>`;
  return `<dl class="stats">
    <div><dt>มูลค่าสัญญา (รวมงานเพิ่มลด)</dt><dd>${fmt(C.total)} <small>บาท</small></dd>${C.vo?`<small class="muted">สัญญา ${fmt(C.base)} · งานเพิ่มลด ${C.vo>0?'+':''}${fmt(C.vo)}</small>`:''}</div>
    <div><dt>งบต้นทุน (จาก BOQ)</dt><dd>${fmt(T.bud)}</dd></div>
    <div><dt>ผูกพันแล้ว (PO + ผู้รับเหมา + อื่นๆ)</dt><dd>${fmt(T.com)}</dd>${bar(T.com,T.bud)}</div>
    <div><dt>จ่ายจริงแล้ว</dt><dd>${fmt(T.paid)}</dd>${bar(T.paid,T.bud)}</div>
    <div><dt>กำไรขั้นต้นคาดการณ์</dt><dd style="color:${margin>=0?'var(--good)':'var(--danger)'}">${fmt(margin)} <small>${C.total?fmt(margin*100/C.total,1)+'%':''}</small></dd></div>
    <div><dt>เบิกแล้ว / รับเงินแล้ว</dt><dd style="font-size:17px">${fmt(billed)} / ${fmt(recv)}</dd><small class="muted">ยอดสุทธิตามใบแจ้งหนี้ (รวม VAT หักเงินประกันและภาษี ณ ที่จ่ายแล้ว) · ผลงานที่เบิก ${fmt(work)} ไม่รวม VAT · เงินประกันผลงานค้าง ${fmt(ret)}</small></div></dl>
  <section class="card"><h2><span>งบประมาณเทียบค่าใช้จ่ายจริงรายหมวด</span><small>งบ = ค่าของ + ค่าแรงใน BOQ (ไม่รวมกำไร) · คาดการณ์ = ค่าที่มากกว่าระหว่างงบกับยอดผูกพัน</small></h2>
  <div class="tw"><table><thead><tr><th>หมวดงาน</th><th class="r">งบต้นทุน</th><th class="r">PO วัสดุ</th><th class="r">ผู้รับเหมาช่วง</th><th class="r">ค่าใช้จ่ายอื่น</th><th class="r">ผูกพันรวม</th><th class="r">ใช้ไป %</th><th class="r">คงเหลือ</th><th class="r">จ่ายแล้ว</th><th class="r">คาดการณ์</th></tr></thead><tbody>
  ${L.length?L.map(r=>{const u=r.bud?r.com*100/r.bud:0;return `<tr><td>${gName(r.g)}</td><td class="r">${fmt(r.bud)}</td><td class="r">${fmt(r.po)}</td><td class="r">${fmt(r.sub)}</td><td class="r">${fmt(r.exp)}</td><td class="r">${fmt(r.com)}</td><td class="r"><span class="pill ${u>100?'bad':u>85?'warn':''}">${r.bud?fmt(u,0)+'%':'–'}</span></td><td class="r" style="${r.bud-r.com<0?'color:var(--danger)':''}">${fmt(r.bud-r.com)}</td><td class="r">${fmt(r.paid)}</td><td class="r">${fmt(r.fc)}</td></tr>`}).join('')
   +`<tr class="tot"><td>รวม</td><td class="r">${fmt(T.bud)}</td><td class="r">${fmt(sum(L,r=>r.po))}</td><td class="r">${fmt(sum(L,r=>r.sub))}</td><td class="r">${fmt(sum(L,r=>r.exp))}</td><td class="r">${fmt(T.com)}</td><td class="r">${T.bud?fmt(T.com*100/T.bud,0)+'%':''}</td><td class="r">${fmt(T.bud-T.com)}</td><td class="r">${fmt(T.paid)}</td><td class="r">${fmt(T.fc)}</td></tr>`
   :'<tr><td colspan="10" class="empty">ยังไม่มี BOQ หรือค่าใช้จ่าย</td></tr>'}</tbody></table></div></section>`;
}
function costBill(){
  const I=P.info,mode=I.billMode==='pct'?'pct':'qty',C=contract(),bs=billsSorted(),sel=P.bills.find(b=>b.id===S.sel.bill)||bs[bs.length-1];
  const head=`<section class="card"><h2><span>วิธีเบิกงวดของโครงการนี้</span></h2>
    <div class="sub" style="margin-bottom:10px"><button type="button" data-a="billMode" data-k="qty" aria-selected="${mode==='qty'}">เบิกตามปริมาณงานที่ทำได้จริง</button><button type="button" data-a="billMode" data-k="pct" aria-selected="${mode==='pct'}">เบิกเป็นเปอร์เซ็นต์ตามงวด</button></div>
    <p class="hint">${mode==='qty'?'ใส่ปริมาณงานสะสมของแต่ละรายการ BOQ ในแต่ละงวด ยอดเบิกงวดนี้ = มูลค่าสะสม − มูลค่าสะสมงวดก่อน (ราคาต่อหน่วยรวมกำไรและค่าดำเนินการแล้ว)':'ตั้งงวดงานเป็นเปอร์เซ็นต์ของมูลค่าสัญญา แล้วออกใบเบิกทีละงวด'}</p>
    <div class="form"><label>เงินล่วงหน้า (%)<input data-t="num" data-p="info.adv" value="${n(I.adv)}"></label><label>หักประกันผลงาน (%)<input data-t="num" data-p="info.ret" value="${n(I.ret)}"></label><label>VAT (%)<input data-t="num" data-p="info.vat" value="${n(I.vat)}"></label><label>หัก ณ ที่จ่าย (%)<input data-t="num" data-p="info.wht" value="${n(I.wht)}"></label><label>มูลค่าสัญญา (ไม่รวม VAT)<input readonly value="${fmt(C.total,2)}"></label></div></section>`;
  let inst='';
  if(mode==='pct'){const cols=[{k:'no',h:'งวด',w:50},{k:'desc',h:'เงื่อนไขการเบิก',w:320},{k:'pct',h:'% ของสัญญา',t:'num',w:80,sum:x=>x.pct},{h:'จำนวนเงิน',t:'calc',r:1,f:x=>fmt(C.total*n(x.pct)/100)},{k:'task',h:'ผูกกับหมุดหมายในแผน',t:'sel',w:200,o:()=>[['','–'],...P.tasks.filter(t=>durOf(t)===0||t.ms).map(t=>[t.id,t.name])]},{h:'ถึงกำหนด',t:'calc',f:x=>{if(!x.task)return '';const s=sched(),r=s.R[x.task];return r?thD(r.es):''}},{h:'สถานะ',t:'calc',f:x=>{const b=P.bills.find(y=>y.inst===x.id);return b?`<span class="pill ${b.status==='paid'?'ok':'info'}">${esc(b.no)} · ${BSTAT.find(s=>s[0]===b.status)[1]}</span>`:'<span class="pill">ยังไม่เบิก</span>'}}];
    const tp=sum(P.inst||[],x=>x.pct);
    inst=`<section class="card"><h2><span>งวดงาน</span><small>${Math.abs(tp-100)>0.01&&(P.inst||[]).length?`<span class="pill warn">รวม ${fmt(tp,1)}% ยังไม่เท่ากับ 100%</span>`:''}</small></h2>${gtable('inst',P.inst||[],cols)}
    <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="inst">+ เพิ่มงวด</button><button type="button" class="btn sm" data-a="instGen">ตั้งงวดตัวอย่าง 5 งวด</button></div></section>`}
  const list=`<section class="card"><h2><span>ใบเบิกงวด</span><span class="sp"></span><button type="button" class="btn sm pri" data-a="add" data-c="bills" data-sel="bill">+ ออกใบเบิกงวดใหม่</button></h2>
  <div class="tw"><table class="bl-list"><thead><tr><th>เลขที่</th><th>วันที่</th><th>ประเภท</th><th class="r">${mode==='pct'?'งวด / สะสม %':'ผลงานสะสม %'}</th><th class="r">ยอดเบิก</th><th class="r">หักเงินล่วงหน้า</th><th class="r">หักประกันผลงาน</th><th class="r">VAT</th><th class="r">หัก ณ ที่จ่าย</th><th class="r">รับสุทธิ</th><th>สถานะ</th><th></th></tr></thead><tbody>
  ${bs.length?bs.map(b=>{const c=billCalc(b),k=b.kind||'prog',st=BSTAT.find(s=>s[0]===b.status)||BSTAT[0];return `<tr class="${sel&&sel.id===b.id?'sel':''}"><td><button type="button" class="btn ghost sm" data-a="sel" data-k="bill" data-id="${b.id}"><b>${esc(b.no)}</b></button></td><td>${thD(b.date)}</td><td>${BKIND.find(x=>x[0]===k)[1]}</td>
    <td class="r">${k!=='prog'?'':mode==='pct'?`${esc(((P.inst||[]).find(x=>x.id===b.inst)||{}).no||'–')} / ${fmt(c.cum,1)}%`:fmt(c.cum,1)+'%'}</td><td class="r">${fmt(c.amt)}</td><td class="r">${c.adv?fmt(c.adv):''}</td><td class="r">${c.ret?fmt(c.ret):''}</td><td class="r">${fmt(c.vat)}</td><td class="r">${fmt(c.wht)}</td><td class="r"><b>${fmt(c.net)}</b></td><td><span class="pill ${b.status==='paid'?'ok':b.status==='draft'?'':'info'}">${st[1]}</span></td><td><button type="button" class="x" data-a="delRow" data-c="bills" data-id="${b.id}" aria-label="ลบ">✕</button></td></tr>`}).join(''):'<tr><td colspan="12" class="empty">ยังไม่มีใบเบิกงวด</td></tr>'}</tbody></table></div></section>`;
  if(!sel)return head+inst+list;
  const b=`bills.${sel.id}`,c=billCalc(sel),k=sel.kind||'prog';
  let det='';
  if(k==='prog'&&mode==='qty'){
    const uv=unitVal(),prog=billsSorted().filter(x=>(x.kind||'prog')==='prog'),pi=prog.indexOf(sel),prev=pi>0?prog[pi-1]:null;let lg='';
    det=`<div class="row" style="margin:4px 0 8px"><button type="button" class="btn sm" data-a="billFill" data-id="${sel.id}">ใส่ปริมาณตามความคืบหน้าในแผนงาน</button><span class="hint" style="margin:0">ใส่ “ปริมาณสะสมถึงงวดนี้” ช่องที่เหลือคำนวณให้</span></div>
    <div class="tw" style="max-height:560px;overflow:auto"><table><thead><tr><th>รายการ</th><th>หน่วย</th><th class="r">ปริมาณสัญญา</th><th class="r">ราคา/หน่วย</th><th class="r">สะสมงวดก่อน</th><th class="r" style="min-width:100px">สะสมถึงงวดนี้</th><th class="r">งวดนี้</th><th class="r">มูลค่างวดนี้</th><th class="r">% สะสม</th></tr></thead><tbody>
    ${P.boq.items.map(i=>{const pq=prev?n((prev.qty||{})[i.id]):0,cq=n((sel.qty||{})[i.id]),u=uv(i),g=i.g!==lg?`<tr class="grp"><td colspan="9">${gName(i.g)}</td></tr>`:'';lg=i.g;
      return g+`<tr><td>${esc(itemName(i))}</td><td>${esc(i.unit)}</td><td class="r">${fmtq(i.q)}</td><td class="r">${fmt(u,2)}</td><td class="r muted">${pq?fmtq(pq):''}</td><td><input class="r" data-t="num" data-p="${b}.qty.${i.id}" value="${cq||''}" aria-label="ปริมาณสะสม"${cq>n(i.q)?' style="color:var(--danger)" title="เกินปริมาณสัญญา"':''}></td><td class="r">${cq-pq?fmtq(cq-pq):''}</td><td class="r">${cq-pq?fmt((Math.min(cq,n(i.q))-Math.min(pq,n(i.q)))*u):''}</td><td class="r muted">${n(i.q)?fmt(Math.min(100,cq*100/n(i.q)),0)+'%':''}</td></tr>`}).join('')}
    ${P.vos.filter(v=>v.status==='ok').map(v=>{const pp=prev?n((prev.vo||{})[v.id]):0,cp=n((sel.vo||{})[v.id]),sg=(v.type==='omit'?-1:1)*n(v.amt);return `<tr><td>งานเพิ่มลด ${esc(v.no)} ${esc(v.desc)}</td><td>%</td><td class="r">100</td><td class="r">${fmt(sg/100,2)}</td><td class="r muted">${pp||''}</td><td><input class="r" data-t="num" data-p="${b}.vo.${v.id}" value="${cp||''}" aria-label="% สะสมงานเพิ่มลด"></td><td class="r">${cp-pp||''}</td><td class="r">${cp-pp?fmt(sg*(cp-pp)/100):''}</td><td class="r muted">${cp}%</td></tr>`}).join('')}
    </tbody></table></div>`}
  return head+inst+list+`<section class="card"><h2><span>${esc(sel.no)}</span><span class="sp"></span><button type="button" class="btn sm" data-a="print" data-k="bill" data-id="${sel.id}">พิมพ์ใบเบิกงวด</button></h2>
  <div class="form" style="margin-bottom:12px"><label>เลขที่<input data-p="${b}.no" value="${esc(sel.no)}"></label><label>วันที่<input type="date" data-p="${b}.date" value="${esc(sel.date)}"></label>
    <label>ประเภท<select data-p="${b}.kind">${BKIND.map(([v,l])=>`<option value="${v}"${v===k?' selected':''}>${l}</option>`).join('')}</select></label>
    ${k==='prog'&&mode==='pct'?`<label>งวดที่<select data-p="${b}.inst"><option value="">–</option>${(P.inst||[]).map(x=>`<option value="${x.id}"${x.id===sel.inst?' selected':''}>งวด ${esc(x.no)} · ${fmt(x.pct,1)}%</option>`).join('')}</select></label>`:''}
    <label>สถานะ<select data-p="${b}.status">${BSTAT.map(([v,l])=>`<option value="${v}"${v===sel.status?' selected':''}>${l}</option>`).join('')}</select></label>
    ${sel.status==='paid'?`<label>วันที่รับเงิน<input type="date" data-p="${b}.paid" value="${esc(sel.paid||'')}"></label>`:''}
    <label class="full">หมายเหตุ<input data-p="${b}.note" value="${esc(sel.note||'')}"></label></div>
  <dl class="stats" style="margin-bottom:12px"><div><dt>ยอดเบิกงวดนี้</dt><dd>${fmt(c.amt,2)}</dd></div><div><dt>หักเงินล่วงหน้า ${n(I.adv)}%</dt><dd>${fmt(c.adv,2)}</dd></div><div><dt>หักประกันผลงาน ${n(I.ret)}%</dt><dd>${fmt(c.ret,2)}</dd></div><div><dt>VAT ${n(I.vat)}%</dt><dd>${fmt(c.vat,2)}</dd></div><div><dt>หัก ณ ที่จ่าย ${n(I.wht)}%</dt><dd>${fmt(c.wht,2)}</dd></div><div><dt>รับเงินสุทธิ</dt><dd style="color:var(--accent)">${fmt(c.net,2)}</dd></div></dl>
  ${det}</section>`;
}
PRINT.bill=id=>{const b=P.bills.find(x=>x.id===id);if(!b)return '';const c=billCalc(b),I=P.info,C=contract(),k=b.kind||'prog',mode=I.billMode==='pct'?'pct':'qty';
  let det='';
  if(k==='prog'&&mode==='qty'){const uv=unitVal(),prog=billsSorted().filter(x=>(x.kind||'prog')==='prog'),pi=prog.indexOf(b),prev=pi>0?prog[pi-1]:null;
    det=`<table><thead><tr><th>รายการ</th><th>หน่วย</th><th>ปริมาณสัญญา</th><th>ราคา/หน่วย</th><th>สะสมงวดก่อน</th><th>งวดนี้</th><th>สะสม</th><th>มูลค่างวดนี้</th></tr></thead><tbody>${P.boq.items.filter(i=>n((b.qty||{})[i.id])||prev&&n((prev.qty||{})[i.id])).map(i=>{const pq=prev?n((prev.qty||{})[i.id]):0,cq=n((b.qty||{})[i.id]);return `<tr><td>${esc(itemName(i))}</td><td>${esc(i.unit)}</td><td style="text-align:right">${fmtq(i.q)}</td><td style="text-align:right">${fmt(uv(i),2)}</td><td style="text-align:right">${fmtq(pq)}</td><td style="text-align:right">${fmtq(cq-pq)}</td><td style="text-align:right">${fmtq(cq)}</td><td style="text-align:right">${fmt((Math.min(cq,n(i.q))-Math.min(pq,n(i.q)))*uv(i),2)}</td></tr>`}).join('')}</tbody></table>`}
  const it=(P.inst||[]).find(x=>x.id===b.inst);
  return phead(`ใบเบิกเงิน${BKIND.find(x=>x[0]===k)[1].replace('เบิก','')} ${esc(b.no)}`,`วันที่ ${thDL(b.date)}`)+`<div class="meta"><div>ผู้ว่าจ้าง: ${esc(I.client||'')}</div><div>เลขที่สัญญา: ${esc(I.contractNo||'')}</div><div>มูลค่าสัญญา (ไม่รวม VAT): ${fmt(C.total,2)} บาท</div><div>${k==='prog'?(mode==='pct'&&it?`งวดที่ ${esc(it.no)} · ${esc(it.desc)} (${fmt(it.pct,1)}%)`:`ผลงานสะสม ${fmt(c.cum,2)}%`):''}</div></div>
  <table><tbody><tr><td>ยอดเบิก</td><td style="text-align:right">${fmt(c.amt,2)}</td></tr>${c.adv?`<tr><td>หักคืนเงินล่วงหน้า ${n(I.adv)}%</td><td style="text-align:right">-${fmt(c.adv,2)}</td></tr>`:''}<tr><td>คงเหลือ</td><td style="text-align:right">${fmt(c.base,2)}</td></tr><tr><td>VAT ${n(I.vat)}%</td><td style="text-align:right">${fmt(c.vat,2)}</td></tr>${c.ret?`<tr><td>หักเงินประกันผลงาน ${n(I.ret)}%</td><td style="text-align:right">-${fmt(c.ret,2)}</td></tr>`:''}<tr><td>หักภาษี ณ ที่จ่าย ${n(I.wht)}%</td><td style="text-align:right">-${fmt(c.wht,2)}</td></tr><tr><td><b>ยอดรับสุทธิ</b></td><td style="text-align:right"><b>${fmt(c.net,2)}</b></td></tr></tbody></table>
  ${det?'<h3 style="margin-top:12px">รายละเอียดผลงาน</h3>'+det:''}<div class="sign"><div>ผู้รับจ้าง</div><div>ผู้ควบคุมงาน / ที่ปรึกษา</div><div>ผู้ว่าจ้าง</div></div>`};
function costSub(){
  const paid=s=>sum(P.spay.filter(x=>x.sub===s.id),x=>x.amt);
  const cols=[{k:'name',h:'ผู้รับเหมาช่วง',w:180},{k:'scope',h:'ขอบเขตงาน',w:220},{k:'g',h:'หมวดงาน',t:'sel',o:G_OPTS(),w:150},{k:'value',h:'มูลค่าสัญญา',t:'num',w:110,sum:s=>s.value},{k:'ret',h:'หักประกัน %',t:'num',w:70},{h:'จ่ายแล้ว',t:'calc',r:1,f:s=>fmt(paid(s)),sum:s=>paid(s)},{h:'คงเหลือ',t:'calc',r:1,f:s=>fmt(n(s.value)-paid(s))},{k:'phone',h:'โทร',w:110}];
  const pc=[{k:'date',h:'วันที่',t:'date'},{k:'sub',h:'ผู้รับเหมาช่วง',t:'sel',w:180,o:()=>[['','–'],...P.subs.map(s=>[s.id,s.name])]},{k:'desc',h:'งวด / รายละเอียด',w:240},{k:'amt',h:'จำนวนเงิน',t:'num',w:110,sum:x=>x.amt}];
  TABLES.subs={rows:()=>P.subs,cols};TABLES.spay={rows:()=>P.spay,cols:pc};
  return `<section class="card"><h2><span>ผู้รับเหมาช่วงและค่าแรง</span><span class="sp"></span>${copyBtn('subs')}</h2>${gtable('subs',P.subs,cols)}<div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="subs">+ เพิ่มผู้รับเหมาช่วง</button></div></section>
  <section class="card"><h2><span>การจ่ายเงินผู้รับเหมาช่วง</span><span class="sp"></span>${copyBtn('spay')}</h2>${gtable('spay',P.spay,pc)}<div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-a="add" data-c="spay">+ บันทึกการจ่าย</button></div></section>`;
}
function costExp(){
  const cols=[{k:'date',h:'วันที่',t:'date'},{k:'g',h:'หมวดงาน',t:'sel',o:G_OPTS(),w:150},{k:'desc',h:'รายการ',w:260},{k:'ref',h:'เลขที่เอกสาร',w:110},{k:'amt',h:'จำนวนเงิน',t:'num',w:110,sum:x=>x.amt}];
  TABLES.costs={rows:()=>P.costs,cols};
  return `<section class="card"><h2><span>ค่าใช้จ่ายอื่นของโครงการ</span><small>เช่น ค่าขนส่ง ค่าเช่าเครื่องมือ ค่าที่พักคนงาน ค่าเบ็ดเตล็ด</small><span class="sp"></span>${copyBtn('costs')}</h2>${gtable('costs',P.costs,cols)}<div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="add" data-c="costs">+ เพิ่มค่าใช้จ่าย</button></div></section>`;
}

