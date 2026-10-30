/* ---------- 4.99.7 รอบ 2: บัญชีและรายงานรวมยอดได้ทั้งโครงการและแต่ละงาน (user: "ต้องแก้ทั้งโปรแกรมเลย ไม่งั้นหน้างานก็จะมัว
   บัญชีก็จะมัวไปหมด") ----------
   Each job is still its own project record (โครงการ - งาน, 968). Now the company pages add the jobs of one project up:
   - บัญชี has "ดูยอดของ" on every tab: ทุกโครงการ, a whole project (all its jobs) or one job; ลูกหนี้, เจ้าหนี้, กระแสเงินสด,
     ภาษี and the rest then count only those jobs. The picker replaces the old project box of กระแสเงินสด.
   - กระแสเงินสด adds a table of money in and out per project, its jobs under it.
   - ภาพรวมผู้บริหาร (220) puts the jobs of a project under one project row with the project's totals.
   - the accounting export files get a งาน column next to โครงการ, and their descriptions read "งาน … โครงการ …".
   รอบ 3: the documents that still printed the whole name in one line now say งาน … โครงการ …: the subcontract, the handover
   certificate, the receipt, the bank guarantee request, LINE messages and the project overview heading (the rest use phead, 330).
   A chosen project or job only narrows what is shown: every document number is still counted across the company (they are
   given when a button is pressed, never while a page is drawn), and a save asked for while drawing waits for the full data. */
function pjGroupsOf(L){const M=new Map();L.forEach(p=>{const k=pjGk(p);(M.get(k)||M.set(k,{k,nm:pjSplit(p).base,L:[]}).get(k)).L.push(p)});return [...M.values()]}
// plain text for exports ("งาน ติดตั้งท่อลม โครงการ บริษัท โนเบิ้ล"), and a table cell: the project, its job under it
const pjJobW=j=>/^งาน/.test(j)?j:'งาน '+j;// "งาน ติดตั้ง…", but "งานเพิ่ม …" stays as typed
const pjTxt=p=>{const J=pjJob(p);return J.pj?`${pjJobW(J.job)} โครงการ ${J.pj}`:`โครงการ ${J.job}`};
const pjJobLbl=p=>pjJobW(pjSplit(p).job||'งานหลัก');
const pjCell=p=>{const J=pjJob(p);return J.pj?`${esc(J.pj)}<br><small class="muted">${esc(pjJobW(J.job))}</small>`:esc(J.job)};

// ดูยอดของ: '' = ทุกโครงการ, 'g:<key>' = every job of one project, else one job's id
function acScope(){const v=S.acPj||'';if(!v)return null;
  if(v.startsWith('g:')){const L=projects().filter(p=>pjGk(p)===v.slice(2));return L.length?L:null}
  return DB.projects[v]?[DB.projects[v]]:null}
function acScopeBar(){const v=S.acPj||'',A=projects(),G=pjGroupsOf(A),o=(val,l)=>`<option value="${esc(val)}"${v===val?' selected':''}>${l}</option>`;
  const opts=G.map(g=>{if(g.L.length<2){const p=g.L[0],j=pjSplit(p).job;return o(p.id,esc(g.nm)+(j?` · งาน ${esc(j)}`:''))}
    return `<optgroup label="${esc(g.nm)}">${o('g:'+g.k,`ทั้งโครงการ ${esc(g.nm)} · ${g.L.length} งาน`)}${g.L.map(p=>o(p.id,esc(pjJobLbl(p)))).join('')}</optgroup>`}).join('');
  const T=acScope(),vt=['vat','wht'].includes(S.sub.acct)&&T;
  return `<div class="ac-pj"><label>ดูยอดของ <select id="acPj" data-pjg="1" aria-label="ดูยอดของโครงการหรืองาน">${o('',`ทุกโครงการ (${G.length} โครงการ · ${A.length} งาน)`)}${opts}</select></label>
    ${T?`<span class="pill info">แสดงเฉพาะ ${T.length>1?`${T.length} งานของโครงการนี้`:'งานนี้'}</span><button type="button" class="btn sm ghost" data-a="acPjAll">ดูทุกโครงการ</button>`:''}
    ${vt?'<small class="muted">ยื่นภาษีให้ดูแบบ “ทุกโครงการ” เพราะแบบยื่นต้องรวมทั้งบริษัท</small>':''}</div>`}
document.addEventListener('change',e=>{if(e.target.id==='acPj'){S.acPj=e.target.value;render()}});
ACT.acPjAll=()=>{S.acPj='';render()};

// a save asked for while a narrowed page is drawn runs after the full list of projects is back
let acNarrow=0,acSaveA=null;
{const s=save;save=function(){if(acNarrow){acSaveA=[...arguments];return}return s.apply(this,arguments)}}
function acWith(L,fn){if(!L)return fn();const all=DB.projects,sub={};L.forEach(p=>sub[p.id]=p);DB.projects=sub;acNarrow=1;
  try{return fn()}finally{DB.projects=all;acNarrow=0;if(acSaveA){const a=acSaveA;acSaveA=null;save.apply(null,a)}}}

// กระแสเงินสด per project: what came in and went out up to this month, and what is still expected until the job ends
function cfPjRow(p){const L=cashflow([p]),td=ym(today()),A=L.filter(x=>x.k<=td),F=L.filter(x=>x.k>td),o=x=>x.po+x.sub+x.exp;
  const r={inP:sum(A,x=>x.in),outP:sum(A,o),inF:sum(F,x=>x.in+x.fin),outF:sum(F,x=>o(x)+x.fout)};r.netP=r.inP-r.outP;r.net=r.netP+r.inF-r.outF;return r}
function cfByPj(ps){const G=pjGroupsOf(ps);if(!ps.length)return '';const F=S.cfFold||{},R={};ps.forEach(p=>{try{R[p.id]=cfPjRow(p)}catch(e){R[p.id]={inP:0,outP:0,inF:0,outF:0,netP:0,net:0}}});
  const tot=L=>{const t={inP:0,outP:0,inF:0,outF:0,netP:0,net:0};L.forEach(p=>Object.keys(t).forEach(k=>t[k]+=R[p.id][k]));return t};
  const num=(v,b)=>`<td class="r"${v<0?' style="color:var(--danger)"':''}>${b?'<b>':''}${v?fmt(v):''}${b?'</b>':''}</td>`;
  const cells=(r,b)=>num(r.inP,b)+num(-r.outP,b)+num(r.netP,b)+num(r.inF,b)+num(-r.outF,b)+num(r.net,b);
  const rows=G.map(g=>{if(g.L.length<2)return `<tr><td>${pjCell(g.L[0])}</td>${cells(R[g.L[0].id])}</tr>`;const fo=!!F[g.k];
    return `<tr class="ex-pj"><td><button type="button" class="qg-hb" data-a="cfFold" data-k="${esc(g.k)}" aria-expanded="${!fo}"><span aria-hidden="true">${fo?'▸':'▾'}</span> <b>${esc(g.nm)}</b> <small class="muted">· ${g.L.length} งาน</small></button></td>${cells(tot(g.L),1)}</tr>
      ${fo?'':g.L.map(p=>`<tr class="ex-job"><td>${esc(pjJobLbl(p))}</td>${cells(R[p.id])}</tr>`).join('')}`}).join('');
  return `<section class="card"><h2><span>เงินเข้า-ออกแยกตามโครงการ</span><small>ถึงเดือนนี้ = ยอดจริงรวมเดือนนี้ · ต่อจากนี้ = ใบที่ออกแล้วและคาดการณ์ตามแผนงาน</small></h2>
  <div class="tw"><table class="cf-pj"><thead><tr><th rowspan="2">โครงการ / งาน</th><th colspan="3" class="c">ถึงเดือนนี้</th><th colspan="3" class="c">ต่อจากนี้ถึงจบงาน</th></tr>
  <tr><th class="r">รับเข้า</th><th class="r">จ่ายออก</th><th class="r">คงเหลือ</th><th class="r">คาดรับ</th><th class="r">คาดจ่าย</th><th class="r">คงเหลือเมื่อจบงาน</th></tr></thead>
  <tbody>${rows}${G.length>1?`<tr class="tot"><td>รวม</td>${cells(tot(ps))}</tr>`:''}</tbody></table></div></section>`}
ACT.cfFold=b=>{const F=S.cfFold=S.cfFold||{};F[b.dataset.k]=!F[b.dataset.k];render()};

{const f=CVIEWS.acct;CVIEWS.acct=function(){
  if(S.sel&&S.sel.cfp){if(!S.acPj&&DB.projects[S.sel.cfp])S.acPj=S.sel.cfp;S.sel.cfp=''}// the old กระแสเงินสด box
  let L=acScope();if(!L&&S.acPj)S.acPj='';
  let h=acWith(L,()=>f.apply(this,arguments));
  h=h.replace(/<div class="row" style="margin-bottom:10px"><select id="cfSel"[\s\S]*?<\/select><\/div>/,'');
  if(S.sub.acct==='cf'){const c=cfByPj(L||projects());const i=h.lastIndexOf('</section>');if(c&&i>=0)h=h.slice(0,i+10)+c+h.slice(i+10)}
  const i=[h.indexOf('<dl class="stats"'),h.indexOf('<section')].filter(x=>x>=0).sort((a,b)=>a-b)[0];
  return i===undefined?h+acScopeBar():h.slice(0,i)+acScopeBar()+h.slice(i)}}

// export files: งาน next to โครงการ (the programs' own import layouts stay as they are)
{const f=accFile;accFile=function(){const T=f.apply(this,arguments);if(!T.length)return T;const i=T[0].indexOf('โครงการ');if(i<0)return T;
  const by={};projects().forEach(p=>by[String(p.name)]=p);
  return T.map((r,n)=>{const x=r.slice();if(!n){x.splice(i+1,0,'งาน');return x}const p=by[String(r[i])];if(!p){x.splice(i+1,0,'');return x}
    const J=pjJob(p);x[i]=J.pj||J.job;x.splice(i+1,0,J.pj?J.job:'');return x})}}

document.head.insertAdjacentHTML('beforeend',`<style>
.ac-pj{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 12px}.ac-pj label{display:flex;gap:6px;align-items:center;font-weight:600}.ac-pj select{min-width:260px;max-width:100%}
td.ex-nm{min-width:170px}td.ex-nm+td{min-width:130px}td.ex-nm>.btn{text-align:left;justify-content:flex-start;white-space:normal}
tr.ex-pj td{background:var(--surface-2,rgba(127,127,127,.08))}tr.ex-job td:first-child{padding-left:26px}
table.cf-pj th.c{text-align:center}
@media (max-width:640px){.ac-pj select{min-width:0;width:100%}.ac-pj label{flex-wrap:wrap;width:100%}}
</style>`);
Object.assign(SBKW,{'co.acct':(SBKW['co.acct']||'')+' ดูยอดของ แยกตามโครงการ ยอดแต่ละงาน เงินเข้าออกตามโครงการ','co.exec':(SBKW['co.exec']||'')+' รวมตามโครงการ งานในโครงการ'});
