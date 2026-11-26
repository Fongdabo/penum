/* 4.99.81 claim papers of a project made from a quotation with แยกค่าเครื่อง follow each quotation (user, INSEE: "ปรับให้ตรงตามใบเสนอราคา
   ดีกว่าไหม"):
   - ใบสรุปผลงานประจำงวด: each งวด shows its quotation number and its % of that quotation (มัดจำ 50% of QT-001-1), not of the contract.
   - แผนเบิกงวดงาน (PROGRESS PAYMENT): a ค่าเครื่อง งวด is spread only over the BOQ's equipment, a ค่าติดตั้ง งวด only over the rest
     (it used to take the same % of every section, so a deposit on the air-conditioners "claimed" 73% of the pipework). The
     retention row shows whenever a claim holds one, and the retention / withholding rows say which quotation and what rate.
   - Every claim paper and the tax invoice print the rate the claim really used (3% on installation, not the contract's 0.8%; 5%
     retention, not 0%). */
const sqpOn=()=>!!P&&(P.inst||[]).some(x=>/^[ES]\d/.test(String(x.no||'')))&&typeof iqQuote==='function'&&!!iqQuote(P);
const sqpRates=b=>{const c=billCalc(b);return {c,r:c.amt?c.ret*100/c.amt:0,w:c.base?c.wht*100/c.base:0}};
const sqpLab=(h,b)=>{if(!b||!sqpOn())return h;const x=sqpRates(b),q=v=>fmtq(Math.round(v*100)/100),it=(P.inst||[]).find(z=>z.id===b.inst),k=it&&iqKind(it),Q=iqQuote(P);
  let rl=q(x.r)+'%',wl=q(x.w)+'%';if(k&&typeof sqdParts==='function'){const G=sqdParts(),t=sqdNow(G[k]),qn=iqNo(Q,it);
    if(x.c.ret&&t.r)rl=`${q(t.r)}% ของ ${qn}`;if(x.c.wht)wl=`${q(x.w)}% (${qn})`}
  return h.replace(/(หัก(?:เงิน)?ประกันผลงาน) [\d.,]+%/g,(m,a)=>`${a} ${rl}`).replace(/(หัก(?:ภาษี)? ณ ที่จ่าย) [\d.,]+%/g,(m,a)=>`${a} ${wl}`)};
// the share of each BOQ line that is equipment (QT-…-1), matched back to the quotation's lines
function sqpEqShare(i,Q){if(i.g===(typeof QADD_G==='string'?QADD_G:''))return 0;const qi=(Q.items||[]).find(x=>x.g===i.g&&String(x.desc||'')===String(i.desc||''));
  if(!qi||!qmIsEq(qi))return 0;const m=n(qi.m),l=n(qi.l);return m&&l?m/(m+l):1}
{const f=subSummary;subSummary=function(b,x){let h=f.apply(this,arguments);if(!sqpOn()||P.info.billMode!=='pct')return sqpLab(h,b);
  const Q=iqQuote(P),sh={E:iqShare(Q,'E'),S:iqShare(Q,'S')};if(!sh.E||!sh.S)return sqpLab(h,b);
  const d=document.createElement('div');d.innerHTML=h;const t=[...d.querySelectorAll('table')].find(z=>/งวดที่/.test((z.querySelector('thead')||{}).textContent||''));
  if(t){const th=t.querySelectorAll('thead th');if(th[2])th[2].textContent='% ของใบเสนอราคา';
    t.querySelectorAll('tbody tr').forEach(tr=>{const td=tr.children,it=(P.inst||[]).find(z=>String(z.no)===td[0].textContent.trim()),k=it&&iqKind(it);if(!k)return;
      td[1].textContent=`${it.desc||''} (${iqNo(Q,it)})`;td[2].textContent=fmtq(Math.round(n(it.pct)*1e4/sh[k])/100)})}
  return sqpLab(d.innerHTML,b)}}
{const f=taxInv;taxInv=function(id){const h=f.apply(this,arguments);return sqpLab(h,(P.bills||[]).find(x=>x.id===id))}}
{const f=costBill;costBill=function(){const h=f.apply(this,arguments);const bs=billsSorted(),sel=P.bills.find(b=>b.id===S.sel.bill)||bs[bs.length-1];
  if(!sel||!sqpOn())return h;const k=h.indexOf('<dl class="stats"');if(k<0)return h;const e=h.indexOf('</dl>',k);return h.slice(0,k)+sqpLab(h.slice(k,e),sel)+h.slice(e)}}
// progress payment sheet: each BOQ section's budget is its equipment share of QT-…-1 plus its share of QT-…-2, so the sections add up
// to the two quotations exactly (the BOQ's own unit values spread the discount over everything); r.e / r.s keep the two parts
{const f=ppRows;ppRows=function(){const R=f.apply(this,arguments);if(!sqpOn()||P.info.billMode!=='pct')return R;const Q=iqQuote(P),sE=iqShare(Q,'E');if(!sE)return R;
  const uv=unitVal(),I=R.filter(r=>r.items);I.forEach(r=>{r.e0=sum(r.items,i=>n(i.q)*uv(i)*sqpEqShare(i,Q));r.s0=r.bud-r.e0});
  const TE=sum(I,r=>r.e0),TS=sum(I,r=>r.s0),C=contract().total-sum(R.filter(r=>r.vo),r=>r.bud),vE=C*sE/100,vS=C-vE;if(TE<=0||TS<=0)return R;
  I.forEach(r=>{r.e=r.e0/TE*vE;r.s=r.s0/TS*vS;r.bud=r.e+r.s});return R}}
{const f=ppAmt;ppAmt=function(row,col,cols){if(!sqpOn()||P.info.billMode!=='pct'||!col||!col.it||!col.b||row.e==null)return f.apply(this,arguments);
  const k=iqKind(col.it),Q=iqQuote(P),sh=k&&iqShare(Q,k);if(!sh)return f.apply(this,arguments);
  return (k==='E'?row.e:row.s)*n(col.it.pct)/sh}}
{const f=ppTable;ppTable=function(cur){let h=f.apply(this,arguments);if(!sqpOn()||P.info.billMode!=='pct')return h;
  const Q=iqQuote(P),cols=ppCols(),calc=cols.map(c=>c.b?billCalc(c.b):null),cu=j=>cols[j].b&&cur&&cols[j].b.id===cur.id?' cur':'',G=typeof sqdParts==='function'?sqdParts():null;
  const qn=k=>Q.no?`${Q.no}-${k==='E'?1:2}`:(k==='E'?'ค่าเครื่อง':'ค่าติดตั้ง'),rt=G&&typeof sqdNow==='function'?{E:sqdNow(G.E),S:sqdNow(G.S)}:null;
  const say=(f2)=>rt?['E','S'].filter(k=>f2(rt[k])).map(k=>`${fmtq(Math.round(f2(rt[k])*100)/100)}% ${qn(k)}`).join(' · '):'';
  const rl=say(x=>x.r),wl=say(x=>x.w);
  h=h.replace(/(<td colspan="2" class="l">)หัก ณ ที่จ่าย [^<]*</,`$1หัก ณ ที่จ่าย ${wl||''}<`);
  if(calc.some(c=>c&&c.ret)){const lab=`ประกันผลงาน ${rl}`,row=`<tr class="bl"><td colspan="2" class="l">${lab}</td><td class="gap"></td><td class="r"></td><td></td>${calc.map((c,j)=>`<td class="r${cu(j)}">${c&&Math.abs(c.ret)>=0.005?fmt(c.ret,2):'-'}</td><td class="${cu(j)}"></td>`).join('')}<td class="r"></td><td></td></tr>`;
    if(/<td colspan="2" class="l">ประกันผลงาน /.test(h))h=h.replace(/(<td colspan="2" class="l">)ประกันผลงาน [^<]*</,`$1${lab}<`);
    else{const k=h.indexOf('<td colspan="2" class="l">ภาษีมูลค่าเพิ่ม');const s=k<0?-1:h.lastIndexOf('<tr',k);if(s>=0)h=h.slice(0,s)+row+h.slice(s)}}
  return h}}
