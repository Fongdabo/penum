/* ---------- 3.63 เลขที่เอกสารไม่ชนกันข้ามโครงการ ----------
   Claims (INV-), POs, PRs and the project forms (DN/WO/SC/HO) used to count inside one project, so every project started at INV-001.
   nextNo() now counts them across the company (NO_CO at the top). A number already issued is never changed by itself:
   one used twice is flagged "เลขซ้ำ" in its list, and claims still in ร่าง get the next free number in one click. */
const NO_K={bill:'INV-',po:'PO-',pr:'PR-',fddn:'DN-',fdwo:'WO-',fdsc:'SC-',fdho:'HO-'};
const noKey=s=>String(s||'').trim().toUpperCase();
function noDups(pre){const g=NO_CO[pre],M=new Map();if(!g)return M;
  projects().forEach(p=>(g(p)||[]).forEach(d=>{const k=noKey(d.no);if(!k)return;if(!M.has(k))M.set(k,[]);M.get(k).push({p,d})}));
  for(const [k,v] of [...M])if(v.length<2)M.delete(k);return M}
// the claim drafts that would get a new number: every draft sharing a number with an issued claim, and all but the earliest of drafts sharing one
function noFixList(){const L=[];for(const v of noDups('INV-').values()){const dr=v.filter(x=>x.d.status==='draft'),iss=v.length>dr.length;
  dr.sort((a,b)=>(a.d.date||'').localeCompare(b.d.date||'')||(a.p.info.start||'').localeCompare(b.p.info.start||'')).slice(iss?0:1).forEach(x=>L.push(x))}
  return L.sort((a,b)=>(a.d.date||'').localeCompare(b.d.date||''))}
function markDups(h){const ks=Object.keys(NO_K).filter(k=>h.includes(`data-k="${k}"`));if(!ks.length)return h;
  ks.forEach(k=>{const M=noDups(NO_K[k]);if(!M.size)return;const by=new Map();for(const v of M.values())v.forEach(x=>by.set(x.d.id,v));
    h=h.replace(new RegExp(`(data-a="sel" data-k="${k}" data-id="([^"]+)"[^>]*>[\\s\\S]*?</button>)`,'g'),(m,a,id)=>{const v=by.get(id);if(!v)return m;
      const o=v.filter(x=>x.d.id!==id).map(x=>`${x.p.name}${x.p.id===P.id?' (โครงการนี้)':''}`);
      return a+` <span class="pill warn no-dup" title="${esc('เลขเดียวกับ: '+o.join(', '))}">เลขซ้ำ</span>`})});
  return h}
{const f=VIEWS.cost;VIEWS.cost=()=>{let h=markDups(f());if((S.sub.cost||'sum')!=='bill')return h;
  const M=noDups('INV-'),mine=[...M.values()].filter(v=>v.some(x=>x.p.id===P.id));if(!mine.length)return h;
  const fix=noFixList(),at=h.indexOf('<div class="tw"><table class="bl-list">');if(at<0)return h;
  const nb=`<div class="no-warn"><b>เลขที่ใบเบิกงวดซ้ำกับใบอื่น ${mine.length} เลข</b> (${mine.map(v=>esc(v[0].d.no)).join(', ')}) ตั้งแต่รุ่นนี้ใบใหม่จะรันเลขต่อกันทั้งบริษัท ไม่เริ่ม INV-001 ใหม่ทุกโครงการ
    <br>${fix.length?`ใบที่ยังเป็น <b>ร่าง</b> ${fix.length} ใบ ให้เลขใหม่ได้เลย `:''}ใบที่ส่งเบิกหรือรับเงินแล้วคงเลขเดิมไว้ ถ้าจะแก้ ให้พิมพ์ที่ช่อง “เลขที่” ของใบนั้นแล้วแจ้งลูกค้า
    ${fix.length?`<div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="noFix">ให้เลขใหม่กับใบร่างที่ซ้ำ (${fix.length} ใบ)</button></div>`:''}</div>`;
  return h.slice(0,at)+nb+h.slice(at)}}
{const f=VIEWS.buy;VIEWS.buy=()=>markDups(f())}
{const f=VIEWS.forms;VIEWS.forms=()=>markDups(f())}
ACT.noFix=()=>{const L=noFixList();if(!L.length)return;
  if(!confirm(`เปลี่ยนเลขใบเบิกงวดที่ยังเป็นร่าง ${L.length} ใบ เป็นเลขถัดไปของบริษัท?\n\n${L.map(x=>`${x.p.name}: ${x.d.no}`).join('\n')}`))return;
  const ch=L.map(x=>{const old=x.d.no;x.d.no=nextNo('INV-',[]);return `<tr><td>${esc(x.p.name)}</td><td>${esc(old)}</td><td><b>${esc(x.d.no)}</b></td></tr>`});
  save();render();dialog('เปลี่ยนเลขใบร่างแล้ว',`<div class="tw"><table><thead><tr><th>โครงการ</th><th>เลขเดิม</th><th>เลขใหม่</th></tr></thead><tbody>${ch.join('')}</tbody></table></div>`,'')};
// every project's claims in one list, drafts included, so a number used twice shows up in one place (บริษัท › บัญชี › ลูกหนี้)
function allBillsCard(){const L=projects().flatMap(p=>withP(p,()=>p.bills.map(b=>({p,b,c:billCalc(b)})))).sort((x,y)=>String(x.b.no).localeCompare(String(y.b.no),undefined,{numeric:true})||(x.b.date||'').localeCompare(y.b.date||''));
  const M=noDups('INV-'),dup=new Set([...M.values()].flat().map(x=>x.d.id)),fix=noFixList();
  return `<section class="card" id="allBills"><h2><span>ใบเบิกงวดทุกโครงการ (รวมใบร่าง)</span><small>${L.length} ใบ · เรียงตามเลขที่${M.size?` · <span class="pill warn">เลขซ้ำ ${M.size} เลข</span>`:''}</small><span class="sp"></span>${fix.length?`<button type="button" class="btn sm pri" data-a="noFix">ให้เลขใหม่กับใบร่างที่ซ้ำ (${fix.length} ใบ)</button>`:''}</h2>
  <div class="tw"><table><thead><tr><th>เลขที่</th><th>โครงการ</th><th>วันที่</th><th>ประเภท</th><th class="r">ยอดเบิก</th><th class="r">รับสุทธิ</th><th>สถานะ</th><th></th></tr></thead><tbody>
  ${L.length?L.map(({p,b,c})=>{const st=BSTAT.find(s=>s[0]===b.status)||BSTAT[0];return `<tr><td style="white-space:nowrap"><b>${esc(b.no)}</b>${dup.has(b.id)?' <span class="pill warn no-dup">เลขซ้ำ</span>':''}</td><td>${esc(p.name)}</td><td>${thD(b.date)}</td><td>${(BKIND.find(x=>x[0]===(b.kind||'prog'))||['',''])[1]}</td><td class="r">${fmt(c.amt)}</td><td class="r"><b>${fmt(c.net)}</b></td><td><span class="pill ${b.status==='paid'?'ok':b.status==='draft'?'':'info'}">${st[1]}</span></td><td><button type="button" class="btn ghost sm" data-a="blOpen" data-p="${p.id}" data-id="${b.id}">เปิด</button></td></tr>`}).join(''):'<tr><td colspan="8" class="empty">ยังไม่มีใบเบิกงวด</td></tr>'}</tbody></table></div></section>`}
{const f=CVIEWS.acct;CVIEWS.acct=()=>{const h=f();return S.sub.acct==='ar'?h+allBillsCard():h}}
ACT.blOpen=b=>{const p=DB.projects[b.dataset.p];if(!p)return;DB.cur=p.id;P=p;S.sel={bill:b.dataset.id};S.mode='pj';S.tab='cost';S.sub.cost='bill';save();render();scrollTo({top:0})};
// the project's claim page links to that list
{const f=VIEWS.cost;VIEWS.cost=()=>{const h=f();if((S.sub.cost||'sum')!=='bill'||me()&&!allowed('co','acct'))return h;
  return h.replace('class="btn sm pri" data-a="add" data-c="bills" data-sel="bill">','class="btn sm" data-a="go" data-m="co" data-k="acct" data-s="ar" title="รายการใบเบิกงวดของทุกโครงการ อยู่ที่ บริษัท › บัญชี › ลูกหนี้">ดูทุกโครงการ</button> <button type="button" class="btn sm pri" data-a="add" data-c="bills" data-sel="bill">')}}
// สรุปงบประมาณ: a short per-project roll-up of every project's claims, the full list stays in บัญชี › ลูกหนี้
function allBillsSum(){const M=noDups('INV-'),dup=new Set([...M.values()].flat().map(x=>x.d.id)),T={n:0,dr:0,ar:0,rc:0,dup:0};
  const R=projects().map(p=>withP(p,()=>{const r={p,n:p.bills.length,dr:0,ar:0,rc:0,dup:0};p.bills.forEach(b=>{const c=billCalc(b);if(dup.has(b.id))r.dup++;
    if(b.status==='draft')r.dr+=c.net;else if(b.status==='paid')r.rc+=c.net;else{const g=Math.min(c.net,billRecv(b));r.rc+=g;r.ar+=c.net-g}});return r})).filter(r=>r.n);
  R.forEach(r=>['n','dr','ar','rc','dup'].forEach(k=>T[k]+=r[k]));
  const go=!me()||allowed('co','acct')?`<span class="sp"></span><button type="button" class="btn sm" data-a="go" data-m="co" data-k="acct" data-s="ar">ดูใบเบิกทุกใบ</button>`:'';
  return `<section class="card" id="allBillsSum"><h2><span>ใบเบิกงวดทุกโครงการ</span><small>${T.n} ใบ จาก ${R.length} โครงการ${T.dup?` · <span class="pill warn">เลขซ้ำ ${T.dup} ใบ</span>`:''}</small>${go}</h2>
  <div class="tw"><table><thead><tr><th>โครงการ</th><th class="r">ใบเบิก</th><th class="r">ร่าง (ยังไม่ส่ง)</th><th class="r">ส่งเบิกแล้ว ค้างรับ</th><th class="r">รับเงินแล้ว</th><th>เลขซ้ำ</th></tr></thead><tbody>
  ${R.length?R.map(r=>`<tr class="${r.p.id===P.id?'sel':''}"><td>${esc(r.p.name)}${r.p.id===P.id?' <small class="muted">(โครงการนี้)</small>':''}</td><td class="r">${r.n}</td><td class="r">${r.dr?fmt(r.dr):'–'}</td><td class="r">${r.ar?`<b>${fmt(r.ar)}</b>`:'–'}</td><td class="r">${r.rc?fmt(r.rc):'–'}</td><td>${r.dup?`<span class="pill warn no-dup">${r.dup} ใบ</span>`:''}</td></tr>`).join('')
   +`<tr class="tot"><td>รวม</td><td class="r">${T.n}</td><td class="r">${fmt(T.dr)}</td><td class="r">${fmt(T.ar)}</td><td class="r">${fmt(T.rc)}</td><td></td></tr>`:'<tr><td colspan="6" class="empty">ยังไม่มีใบเบิกงวด</td></tr>'}</tbody></table></div><p class="hint">ยอดเป็นรับสุทธิ (รวม VAT แล้ว หักเงินล่วงหน้า ประกันผลงาน และภาษีหัก ณ ที่จ่ายแล้ว)</p></section>`}
{const f=VIEWS.cost;VIEWS.cost=()=>{const h=f();return (S.sub.cost||'sum')==='sum'?h+allBillsSum():h}}
document.head.insertAdjacentHTML('beforeend',`<style>.no-warn{border:1px solid var(--warn-c);background:var(--warn-soft);border-radius:10px;padding:10px 12px;margin:0 0 10px;font-size:14px;line-height:1.6}.pill.no-dup{font-size:11px;padding:1px 7px;vertical-align:middle;cursor:help}</style>`);
Object.assign(SBKW,{'pj.cost.bill':(SBKW['pj.cost.bill']||'')+' เลขซ้ำ เลขที่ชน รันเลข duplicate number'});
