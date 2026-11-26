/* 4.99.78 deductions of a project made from a quotation with แยกค่าเครื่อง (user, INSEE: "อันนี้ก็ไม่ตรง ปกติค่าเครื่องจะไม่หัก 3
   และประกันผลงานถูกต้องไหม"). The boxes on เบิกงวด showed one blended rate for the whole contract (หัก ณ ที่จ่าย 0.8 = 3% of the
   installation's 26.67% share; ประกันผลงาน 1.3333 = 5% of the installation, held once from the last งวด), while each งวด carries its
   own rates (it.wp, it.rp/rx, 981) that claims really use. The boxes now say so in baht: ค่าเครื่อง งวด withhold nothing, ค่าติดตั้ง
   งวด withhold 3% of their claim, and the retention is N% of the installation = X baht.
   A new project also started with เงินล่วงหน้า 15%, so every claim of a quotation-made project deducted 15% as advance repayment
   though no advance was ever claimed (a deposit is a งวด there). A won quotation now sets it to 0, and an existing such project with no
   advance claim and no issued claim yet is set to 0 once. */
const sqdQ=p=>(CO().quotes||[]).find(q=>q.pj===p.id&&q.status==='won')||null;
{const f=ACT.qWon;ACT.qWon=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),had=Q&&Q.pj&&DB.projects[Q.pj];const r=f(b);
  const p=Q&&!had&&Q.pj&&DB.projects[Q.pj];if(p&&!(p.bills||[]).some(x=>x.kind==='adv')){p.info.adv=0;p.info.advQ=1;save()}return r}}
function sqdAdvFix(){let ch=0;Object.values(DB.projects||{}).forEach(p=>{const I=p.info;if(!I||I.advQ||!n(I.adv))return;let Q;try{Q=sqdQ(p)}catch(e){return}if(!Q)return;
  const B=p.bills||[];if(B.some(x=>x.kind==='adv'||((x.kind||'prog')==='prog'&&x.status&&x.status!=='draft')))return;I.adv=0;I.advQ=1;ch=1});return ch}
{const r=render;render=function(){try{if(sqdAdvFix())save()}catch(e){}return r.apply(this,arguments)}}
{const f=VIEWS.cost;VIEWS.cost=()=>{let h=f();if((S.sub.cost||'sum')!=='bill'||P.info.billMode!=='pct')return h;const I=P.inst||[];
  const E=I.filter(x=>/^E\d/.test(String(x.no||''))),Sv=I.filter(x=>/^S\d/.test(String(x.no||'')));if(!E.length||!Sv.length)return h;
  const C=contract(),pE=sum(E,x=>n(x.pct)),pS=sum(Sv,x=>n(x.pct)),aE=C.total*pE/100,aS=C.total*pS/100,
    wS=Math.max(0,...Sv.map(x=>n(x.wp))),wE=Math.max(0,...E.map(x=>n(x.wp)));
  if(I.some(x=>x.wp!==undefined&&x.wp!==''))h=h.replace(/(<input data-t="num" data-p="info\.wht" value="[^"]*">)/,
    `$1<small class="muted">แต่ละงวดหักตามใบเสนอราคา: ค่าเครื่อง ${wE?`หัก ${fmtq(wE)}%`:'ไม่หัก'} · ค่าติดตั้ง หัก ${fmtq(wS)}% ของยอดเบิกงวดนั้น (${fmt(aS*wS/100,2)} บาท จากค่าติดตั้ง ${fmt(aS,2)}) · ช่องนี้เป็นค่าเฉลี่ยทั้งสัญญา</small>`);
  const rx=sum(I,x=>n(x.rx)),rpS=Math.max(0,...Sv.map(x=>n(x.rp))),rpE=Math.max(0,...E.map(x=>n(x.rp)));
  if(rx||rpS){const base=rpE||E.some(x=>n(x.rx))?aE+aS:aS,pc=rx?C.total*rx/base:rpS,amt=rx?C.total*rx/100:base*rpS/100;
    h=h.replace(/(<input data-t="num" data-p="info\.ret" value="[^"]*">(?:<small class="muted">[^<]*<\/small>)?)/,
      `$1<small class="muted">= ${fmtq(pc)}% ของ${base===aS?'ค่าติดตั้ง':'มูลค่าสัญญา'} ${fmt(base,2)} = <b>${fmt(amt,2)} บาท</b>${base===aS?' · ค่าเครื่องไม่หักประกันผลงาน':''}</small>`)}
  return h}}
