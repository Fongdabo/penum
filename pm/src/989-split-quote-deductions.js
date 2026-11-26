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
/* 4.99.79 (user: "ผมว่าแยกตามเลขใบเสนอราคาเลยดีไหมจะได้ไม่งง"): with งวด from both quotations the blended boxes หักประกันผลงาน,
   หักเมื่อไร and หัก ณ ที่จ่าย give way to one row per quotation number (<no>-1 ค่าเครื่อง, <no>-2 ค่าติดตั้ง): its value, withholding %
   and baht, retention %, when it is held and baht. Typing there sets that quotation's งวด (it.wp; it.rp every claim, or it.rx on its
   last งวด), which is what claims use. A retention held at the end follows the งวด % when they are edited later (P.info.qpr). */
const sqdParts=()=>{const I=P.inst||[];return {E:I.filter(x=>/^E\d/.test(String(x.no||''))),S:I.filter(x=>/^S\d/.test(String(x.no||'')))}};
const sqdNow=L=>{const pc=sum(L,x=>n(x.pct)),rx=sum(L,x=>n(x.rx)),rp=Math.max(0,...L.map(x=>n(x.rp)));
  return {pc,w:Math.max(0,...L.map(x=>n(x.wp))),m:rx?"last":"",r:rx?(pc?Math.round(rx*1e6/pc)/1e4:0):rp}};
function sqdRet(L,r,m){const pc=sum(L,x=>n(x.pct));L.forEach(x=>{x.rp=0;delete x.rx});if(!r||!L.length)return;
  if(m==='last'){const z=L[L.length-1];z.rx=Math.round(r*pc*1e4)/1e6}else L.forEach(x=>x.rp=r)}
// a retention held at the end follows the งวด as they change
{const f=VIEWS.cost;VIEWS.cost=()=>{try{const Q=P.info.qpr;if(Q&&P.info.billMode==='pct'){const G=sqdParts();['E','S'].forEach(k=>{const q=Q[k];if(q&&q.m==='last'&&G[k].length){
  const want=Math.round(n(q.r)*sum(G[k],x=>n(x.pct))*1e4)/1e6,z=G[k][G[k].length-1];if(Math.abs(n(z.rx)-want)>1e-6||G[k].some(x=>x!==z&&n(x.rx)))sqdRet(G[k],n(q.r),'last')}})}}catch(e){}return f()}}
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.classList||!t.classList.contains('sqd')||!P)return;e.stopImmediatePropagation();
  const k=t.dataset.k,G=sqdParts()[k];if(!G||!G.length)return;const cur=sqdNow(G),v=t.dataset.f==='m'?t.value:n(String(t.value).replace(/,/g,''));
  if(t.dataset.f==='w')G.forEach(x=>x.wp=v);
  else{const r=t.dataset.f==='r'?v:cur.r,m=t.dataset.f==='m'?v:cur.m;sqdRet(G,r,m);P.info.qpr=P.info.qpr||{};P.info.qpr[k]={r,m}}
  P.info.ret=0;P.info.iqAuto=1;save();rerender()},true);
{const f=VIEWS.cost;VIEWS.cost=()=>{let h=f();if((S.sub.cost||'sum')!=='bill'||P.info.billMode!=='pct')return h;const G=sqdParts();if(!G.E.length||!G.S.length)return h;
  const C=contract(),Q=(typeof iqQuote==='function'&&iqQuote(P))||{},no=Q.no||'',d=document.createElement('div');d.innerHTML=h;
  const kill=sel=>{const e=d.querySelector(sel),l=e&&e.closest('label');if(l)l.remove();return l};
  const l1=d.querySelector('input[data-p="info.ret"]'),form=l1&&l1.closest('.form');if(!form)return h;
  kill('input[data-p="info.ret"]');kill('select[data-p="info.retMode"]');kill('input[data-p="info.wht"]');
  const row=(k,lab)=>{const L=G[k],x=sqdNow(L),a=C.total*x.pc/100,id=no?`${no}-${k==='E'?1:2}`:(k==='E'?'ค่าเครื่อง':'ค่าติดตั้ง');
    return `<tr><td><b>${esc(id)}</b></td><td>${lab}</td><td class="r">${fmt(a,2)}</td>
      <td><input class="r sqd" inputmode="decimal" data-k="${k}" data-f="w" value="${fmtq(x.w)}" aria-label="หัก ณ ที่จ่าย ${esc(id)}"></td><td class="r">${fmt(a*x.w/100,2)}</td>
      <td><input class="r sqd" inputmode="decimal" data-k="${k}" data-f="r" value="${x.r?fmtq(x.r):'0'}" aria-label="หักประกันผลงาน ${esc(id)}"></td>
      <td><select class="sqd" data-k="${k}" data-f="m" aria-label="หักประกันผลงานเมื่อไร ${esc(id)}"><option value=""${x.m?'':' selected'}>หักทุกงวด</option><option value="last"${x.m==='last'?' selected':''}>หักครั้งเดียวในงวดสุดท้าย</option></select></td>
      <td class="r">${fmt(a*x.r/100,2)}</td></tr>`};
  const t=document.createElement('div');t.className='sqd-box';
  t.innerHTML=`<h3 style="margin:14px 0 6px;font-size:15px">หัก ณ ที่จ่าย และประกันผลงาน แยกตามเลขใบเสนอราคา</h3><div class="tw"><table><thead><tr><th>เลขที่ใบเสนอราคา</th><th>ส่วน</th><th class="r">มูลค่า (ไม่รวม VAT)</th><th class="r">หัก ณ ที่จ่าย (%)</th><th class="r">หัก ณ ที่จ่าย (บาท)</th><th class="r">หักประกันผลงาน (%)</th><th>หักเมื่อไร</th><th class="r">ประกันผลงาน (บาท)</th></tr></thead>
    <tbody>${row('E','ค่าเครื่อง (สินค้า)')}${row('S','ค่าติดตั้ง วัสดุ และค่าแรง')}</tbody></table></div><p class="hint" style="margin:4px 0 0">ใบเบิกแต่ละงวดหักตามใบเสนอราคาของงวดนั้น แก้ตัวเลขในตารางนี้ได้เลย</p>`;
  form.after(t);return d.innerHTML}}
document.head.insertAdjacentHTML('beforeend','<style>.sqd-box input.sqd{width:100%;min-width:80px;border:1px solid var(--line);border-radius:8px;padding:5px 8px;background:transparent;color:inherit;font:inherit}.sqd-box select.sqd{min-width:190px}</style>');
