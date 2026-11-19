/* ---------- 4.99.55 TOR งานบำรุงรักษา → ใบเสนอราคา PM/MA ----------
   User (2026-11-19, after the TOR page 4.99.46): "มาเริ่มงานที่ต้องทำ TOR กันต่อ". The next step is to price a maintenance TOR, so
   one button on the TOR makes its PM/MA quotation (981 qmaNew fields), or adds to the one it is already picked onto:
   - every machine the TOR lists ("… จำนวน 5 เครื่อง", also several "- …" machines in one clause) becomes a quote line with its
     count, price left blank for the estimator;
   - the check items (headings ความถี่ PM, รายงาน, อะไหล่, เวลาเข้าซ่อม) become the quote's own scope of work (Q.maScope), one
     group per TOR heading, so the printed scope is the customer's own words;
   - contract months, visits a year and the repair time come from the TOR's fields (or "12 ครั้ง/ปี" in its clauses).
   The quotation and the TOR stay picked onto each other (t.q / Q.tor). */
// clauses about the work itself go into the scope; terms of the contract (qualifications, bonds, fines, payment …) stay in the TOR
const TORQ_NOSC=['qual','safe','sub','bond','fine','pay','acc','term','oth','doc','war'];
const torCount=s=>{const m=String(s).match(/(?:จำนวน|จานวน|จ านวน)\s*(\d+)\s*(เครื่อง|ชุด|ตัว|ระบบ|ตู้|เครื่องฯ)/);return m?{q:+m[1],u:m[2].replace('ฯ',''),i:m.index,len:m[0].length}:null};
function torMachines(t){const out=[];
  (t.req||[]).filter(r=>r.cat==='eq').forEach(r=>{const A=String(r.t||'').split(/\s+-\s+|\s*•\s*/).map(seg=>({seg,c:torCount(seg)}));let pre='';
    // a building name at the end of a piece ("… อาคารบวรเวชรักษ์") names the machines that follow it
    const bld=s=>{const M=[...s.matchAll(/(?:^|\s|ดังนี้|ดังนี|:)อาคาร/g)],L=M[M.length-1],i=L?L.index+L[0].length-5:-1;return i>=0&&s.length-i<=32?s.slice(i).trim():''};
    const S=A.filter(x=>{if(!x.c){const g=bld(x.seg);if(g)x.pre=g}return x.c});
    // "… 6 เครื่อง ดังนี้ - 3 เครื่อง - 1 เครื่อง - 2 เครื่อง": the total before the list is not a machine of its own
    const tot=S.length>2&&S[0].c.q===S.slice(1).reduce((a,x)=>a+x.c.q,0);
    A.forEach(x=>{if(!x.c){if(x.pre)pre=x.pre;return}const c=x.c,af=x.seg.slice(c.i+c.len).trim(),g=bld(af);
      if(!(tot&&x===S[0])){let d=x.seg.slice(0,c.i).replace(/^[^:]{0,60}:\s*/,'').replace(/\s+/g,' ').replace(/[,:;\s]+$/,'').trim();
        if(af&&!g&&af.length<=20)d+=' '+af;if(pre&&!d.includes(pre))d=pre+' · '+d;
        if(d.length>140)d=d.slice(0,140).replace(/\s\S*$/,'')+'…';if(d)out.push({desc:d,q:c.q,unit:c.u})}
      if(g)pre=g})});
  return out}
function torScope(t){const G=[];let h='',hc='';
  (t.req||[]).forEach(r=>{const ref=String(r.ref||''),txt=String(r.t||'').trim();if(!txt)return;
    if(!ref.includes('.')){h=txt.split(':')[0].trim();if(h.length>70)h=h.slice(0,70).replace(/\s\S*$/,'')+'…';hc=r.cat;return}
    // a heading about the contract's terms (คุณสมบัติ, หลักประกัน …) keeps its sub-clauses out of the scope too
    if(TORQ_NOSC.includes(r.cat)||(TORQ_NOSC.includes(hc)&&hc!=='oth'))return;const n0=h||'ขอบเขตงานตาม TOR';let g=G.find(x=>x.n===n0);if(!g)G.push(g={n:n0,L:[]});g.L.push(txt.length>220?txt.slice(0,220).replace(/\s\S*$/,'')+'…':txt)});
  return G.filter(g=>g.L.length)}
const torMonths=t=>{if(n(t.months))return n(t.months);for(const r of t.req||[]){const m=String(r.t||'').match(/(?:ระยะเวลา|ระยะสัญญา)\D{0,40}?(\d+)\s*เดือน/);if(m)return +m[1]}return 0};
const torVisits=t=>{if(n(t.visits))return n(t.visits);for(const r of t.req||[]){const m=String(r.t||'').match(/(\d+)\s*(?:ครั้ง|ครัง)\s*(?:\/|ต่อ)\s*ปี/);if(m)return +m[1]}
  for(const r of t.req||[]){const m=String(r.t||'').match(/ทุก\s*(\d+)\s*เดือน/);if(m&&+m[1]>0&&12%+m[1]===0)return 12/+m[1]}return 0};
ACT.torQuote=b=>{const C=CO(),t=torCfg().find(x=>x.id===b.dataset.id);if(!t)return;
  if(typeof ACT.qmaNew!=='function'||typeof qmaLine!=='function'){toast('โปรแกรมรุ่นนี้ยังไม่มีใบเสนอราคา PM/MA');return}
  let Q=torQ(t);if(Q&&Q.kind!=='ma')Q=null;const isNew=!Q;
  if(Q&&!confirm(`เพิ่มเครื่องและขอบเขตงานจาก ${t.no} เข้าใบเสนอราคา ${Q.no||''}?\n(รายการที่มีอยู่แล้วไม่ถูกลบ)`))return;
  if(!Q){const keep=S.sel.quote;ACT.qmaNew();Q=C.quotes.find(q=>q.id===S.sel.quote&&q.id!==keep);if(!Q)return;
    Object.assign(Q,{cust:t.cust||Q.cust,title:t.title||Q.title,site:t.site||Q.site});if(t.owner&&!t.cust)Q.note=[Q.note,'ลูกค้า: '+t.owner].filter(Boolean).join('\n')}
  const v=torVisits(t),mo=torMonths(t);if(mo)Q.maMonths=mo;if(v)Q.maVisits=v;if(n(t.sla)&&!Q.maResp)Q.maResp=`เข้าถึงหน้างานภายใน ${n(t.sla)} ชั่วโมง`;
  Q.tor=t.id;t.q=Q.id;
  // machines: skip one already in the quote under the same name
  const have=new Set(Q.items.map(i=>String(i.desc||'').trim()));let a=0;
  torMachines(t).forEach(m=>{if(have.has(m.desc))return;have.add(m.desc);Q.items.push(qmaLine({desc:m.desc,q:m.q,unit:m.unit,sys:typeof pmGuess==='function'?pmGuess(m.desc):undefined}));a++});
  if(isNew&&!a&&!Q.items.length)Q.items.push(qmaLine({desc:t.title||'งานบำรุงรักษาตาม TOR'}));
  // scope: the TOR's own check items, one group per heading
  const G=torScope(t);let g=0;if(G.length){if(!Array.isArray(Q.maScope))Q.maScope=[];
    G.forEach(x=>{if(Q.maScope.some(y=>String(y.n||'').trim()===x.n))return;Q.maScope.push({id:uid(),n:x.n,t:x.L.join('\n')});g++})}
  save();S.sel.quote=Q.id;ACT.go({dataset:{m:'co',k:'sales',s:'quote'}});
  toast(`${isNew?'สร้าง':'เพิ่มเข้า'}ใบเสนอราคา ${Q.no||''}: เครื่อง ${a} รายการ · ขอบเขตงาน ${g} หัวข้อ · ใส่ราคาต่อครั้งของแต่ละเครื่องต่อได้เลย`)};
// the button on a maintenance TOR, next to ย้ายไป…
{const f=torOne;torOne=function(t){const h=f(t);if(torKind(t)!=='ma')return h;const Q=torQ(t),q=Q&&Q.kind==='ma'?Q:null,
    hint=`${torMachines(t).length} เครื่อง · ${torScope(t).length} หัวข้อขอบเขตงาน`;
  return h.replace('<button type="button" class="btn sm" data-a="torKind"',`<button type="button" class="btn sm pri" data-a="torQuote" data-id="${t.id}" title="${hint}">${q?`ส่งเครื่องและขอบเขตงานเข้า ${esc(q.no||'ใบเสนอราคา')}`:'สร้างใบเสนอราคา PM/MA จาก TOR'}</button><button type="button" class="btn sm" data-a="torKind"`)}}
if(typeof SBKW==='object')SBKW['co.tor.ma']=(SBKW['co.tor.ma']||'')+' สร้างใบเสนอราคาจาก TOR ใบเสนอราคา PM MA จาก TOR';
