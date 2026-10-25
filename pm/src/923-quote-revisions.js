/* ---------- 4.41 revisions of a quotation (user: "ถ้าแก้ใบหลายครั้ง (Rev.) เราจะเก็บข้อมูลเดิมยังไงดี") ----------
   Each time the customer copy is printed or the status becomes ส่งแล้ว, the quote as it stands is kept as a read-only copy inside the
   quote (Q.revs: Rev.0, Rev.1, …), so it syncs with it. A copy is made only when something changed since the last one; edits after
   that become the next Rev. by themselves, and "บันทึกเป็น Rev. ใหม่" keeps one by hand. The customer copy prints "Rev.N" after the
   number from Rev.1 on. Any Rev. can be printed again as it was, and any two (or a Rev. and the current one) compared line by line:
   added, removed and changed lines, and the change in price and profit. */
const QRV_SKIP=['revs','cmts','appr','lowReq','lowOk','lowNo','status','pj'],QRV_NOSIG=['hid'];
const qrvSnap=Q=>{const o={};Object.keys(Q).forEach(k=>{if(QRV_SKIP.includes(k)||k[0]==='_')return;const v=Q[k];if(typeof v==='string'&&v.length>40000)return;o[k]=v});return JSON.parse(JSON.stringify(o))};
// the hanger lines (982 qlHs) are brought up to date first, as the page and the print do, so they never count as an edit
const qrvSig=Q=>{if(typeof qlHs==='function')try{qlHs(Q)}catch(e){}const o=qrvSnap(Q);QRV_NOSIG.forEach(k=>delete o[k]);const s=JSON.stringify(o);let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)+s.length.toString(36)};
const qrvLast=Q=>(Q.revs||[])[(Q.revs||[]).length-1]||null;
// the number the quote has now: the last Rev. when nothing changed, else the next one
const qrvCur=Q=>{const L=qrvLast(Q);if(!L)return {n:0,dirty:true,none:true};const d=L.sig!==qrvSig(Q);return {n:d?L.n+1:L.n,dirty:d}};
const qrvSum=Q=>{try{const R=typeof qrNow==='function'?qrNow(Q):null,c=R?R.c:qCalc(Q);return {net:c.net,cost:c.cost,grand:c.grand,np:R?R.np:c.net-c.cost,npc:R?R.npc:(c.net?(c.net-c.cost)*100/c.net:0)}}catch(e){return {}}};
function qrvSave(Q,why,note){const L=qrvLast(Q),sig=qrvSig(Q);if(L&&L.sig===sig)return null;const u=typeof me==='function'&&me();
  const r={id:uid(),n:L?L.n+1:0,at:new Date().toISOString(),by:u?u.name:'ผู้ดูแลระบบ',why,note:note||'',sig,snap:qrvSnap(Q),sum:qrvSum(Q)};Q.revs=Q.revs||[];Q.revs.push(r);return r}
const qrvWhen=s=>{const d=new Date(s);return isNaN(d)?'':thD(s.slice(0,10))+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const QRV_WHY={print:'พิมพ์ใบลูกค้า',sent:'ส่งลูกค้า',hand:'บันทึกเอง'};
// a Rev. as a quote object the price functions can read
const qrvObj=(Q,r)=>Object.assign(JSON.parse(JSON.stringify(r.snap)),{id:Q.id,status:Q.status,revs:Q.revs});
// ---- the customer copy: "Rev.N" after the number from Rev.1 on (QRV_P while printing an old Rev.)
let QRV_P=null;
// 981 replaces PRINT.quote after this file, so the wrapper goes on at render time (and again if anything replaces it later)
const qrvWrap=()=>{if(!PRINT.quote||PRINT.quote.__qrv)return;const f=PRINT.quote;PRINT.quote=function(id){let h=f.apply(this,arguments);const Q=CO().quotes.find(q=>q.id===id);if(!h||!Q||!Q.no||!(Q.revs||[]).length)return h;
  const k=QRV_P!=null?QRV_P:qrvCur(Q).n;if(!(k>0))return h;const no=esc(Q.no).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return h.replace(new RegExp(no+'(?![\\w.\\-/])','g'),esc(Q.no)+' Rev.'+k)};PRINT.quote.__qrv=1};
{const r=render;render=function(){try{qrvWrap()}catch(e){}return r.apply(this,arguments)}}
// printing the customer copy or sending it keeps a Rev. first
{const f=ACT.print;ACT.print=function(b){if(b&&b.dataset&&b.dataset.k==='quote'){qrvWrap();const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(Q&&(Q.items||[]).length&&qrvSave(Q,'print'))save()}return f.apply(this,arguments)}}
HOOK.push((p,v)=>{const m=p.match(/^co\.quotes\.([^.]+)\.status$/);if(!m||v!=='sent')return;const Q=CO().quotes.find(x=>x.id===m[1]);if(Q&&Q.status==='sent'&&(Q.items||[]).length&&!(typeof qlNeed==='function'&&qlNeed(Q))&&qrvSave(Q,'sent'))save()});
ACT.qrvNew=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;const L=qrvLast(Q);if(L&&L.sig===qrvSig(Q)){toast(`ยังไม่ได้แก้อะไรจาก Rev.${L.n}`);return}
  const note=prompt('หมายเหตุของ Rev. นี้ (เช่น ลูกค้าขอลดราคา, ตัดงานท่อออก) เว้นว่างได้','');if(note===null)return;const r=qrvSave(Q,'hand',note.trim());save();render();toast(`บันทึก Rev.${r.n} แล้ว`)};
ACT.qrvPrint=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),r=Q&&(Q.revs||[]).find(x=>x.id===b.dataset.r);if(!r)return;qrvWrap();const C=CO(),k=C.quotes.indexOf(Q),T=qrvObj(Q,r);let h='';
  C.quotes[k]=T;QRV_P=r.n;try{h=PRINT.quote(Q.id)}finally{C.quotes[k]=Q;QRV_P=null}$('#print').innerHTML=h;fillPhotos($('#print'));setTimeout(()=>print(),300)};
// ---- compare two Revs (or a Rev. and the quote as it is now)
const qrvPick=(Q,x)=>x==='cur'?{Q,l:'ฉบับปัจจุบัน'}:(r=>r?{Q:qrvObj(Q,r),l:'Rev.'+r.n}:null)((Q.revs||[]).find(r=>r.id===x));
function qrvCmp(Q,a,b){const A=qrvPick(Q,a),B=qrvPick(Q,b);if(!A||!B)return '';const SA=qrvSum(A.Q),SB=qrvSum(B.Q),nm=i=>[i.type,i.desc].filter(Boolean).join(' ');
  const IA=(A.Q.items||[]).filter(i=>!i.hs),IB=(B.Q.items||[]).filter(i=>!i.hs),ma={};IA.forEach(i=>ma[i.id]=i);const seen=new Set(),rows=[];let k=0;
  const tot=(X,i)=>n(i.q)*qUnit(X,i),cell=(x,y,f)=>x===y?f(y):`<s>${f(x)}</s> ${f(y)}`;
  IB.forEach(i=>{const o=ma[i.id];seen.add(i.id);if(!o){rows.push(`<tr class="qv-add"><td>+</td><td>${esc(nm(i))}</td><td class="r">${fmtq(n(i.q))} ${esc(i.unit||'')}</td><td class="r">${fmt(qUnit(B.Q,i),2)}</td><td class="r">${fmt(tot(B.Q,i),2)}</td><td class="r">${qrvD(tot(B.Q,i))}</td></tr>`);return}
    const ua=qUnit(A.Q,o),ub=qUnit(B.Q,i),ta=tot(A.Q,o),tb=tot(B.Q,i),ch=nm(o)!==nm(i)||n(o.q)!==n(i.q)||Math.abs(ua-ub)>0.004||(o.unit||'')!==(i.unit||'');if(ch)k++;
    rows.push(`<tr class="${ch?'qv-ch':'qv-same'}"><td>${ch?'✎':''}</td><td>${nm(o)!==nm(i)?`<s>${esc(nm(o))}</s><br>`:''}${esc(nm(i))}</td><td class="r">${cell(fmtq(n(o.q))+' '+esc(o.unit||''),fmtq(n(i.q))+' '+esc(i.unit||''),x=>x)}</td><td class="r">${cell(fmt(ua,2),fmt(ub,2),x=>x)}</td><td class="r">${fmt(tb,2)}</td><td class="r">${qrvD(tb-ta)}</td></tr>`)});
  IA.filter(i=>!seen.has(i.id)).forEach(i=>rows.push(`<tr class="qv-del"><td>−</td><td><s>${esc(nm(i))}</s></td><td class="r"><s>${fmtq(n(i.q))} ${esc(i.unit||'')}</s></td><td class="r"><s>${fmt(qUnit(A.Q,i),2)}</s></td><td class="r">0.00</td><td class="r">${qrvD(-tot(A.Q,i))}</td></tr>`));
  const add=IB.filter(i=>!ma[i.id]).length,del=IA.filter(i=>!seen.has(i.id)).length,sr=(l,x,y,p,c)=>`<tr><td>${l}</td><td class="r">${fmt(x,2)}${p?` <small>${fmt(p[0],1)}%</small>`:''}</td><td class="r">${fmt(y,2)}${p?` <small>${fmt(p[1],1)}%</small>`:''}</td><td class="r">${c?qbDf(y-x):qrvD(y-x)}</td></tr>`;
  return `<p class="qv-n">เทียบ <b>${A.l}</b> กับ <b>${B.l}</b>: เพิ่ม ${add} รายการ · ตัดออก ${del} รายการ · แก้ ${k} รายการ</p>
  <table class="qv-s"><thead><tr><th></th><th class="r">${A.l}</th><th class="r">${B.l}</th><th class="r">เปลี่ยนไป</th></tr></thead><tbody>${sr('ราคาเสนอ ไม่รวม VAT',n(SA.net),n(SB.net))}${sr('ต้นทุน',n(SA.cost),n(SB.cost),null,1)}${sr('กำไรสุทธิ',n(SA.np),n(SB.np),[n(SA.npc),n(SB.npc)])}${sr('รวม VAT',n(SA.grand),n(SB.grand))}</tbody></table>
  <label class="qv-o"><input type="checkbox" data-qv-only="1" checked> แสดงเฉพาะรายการที่เปลี่ยน</label>
  <div class="tw qv-w only"><table class="qv-t"><thead><tr><th></th><th>รายการ</th><th class="r">จำนวน</th><th class="r">ราคาขาย/หน่วย</th><th class="r">รวม (${B.l})</th><th class="r">เปลี่ยนไป</th></tr></thead><tbody>${rows.join('')||'<tr><td colspan="6" class="empty">ไม่มีรายการ</td></tr>'}</tbody></table></div>`}
const qrvD=v=>`<span class="qb-d ${v>0.005?'dn':v<-0.005?'up':''}">${v>0.005?'+':''}${fmt(v,2)}</span>`;
ACT.qrvCmp=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;const a=($('#qrvA')||{}).value,c=($('#qrvB')||{}).value;if(!a||!c||a===c){toast('เลือกสองฉบับที่ต่างกัน');return}
  dialog(`เทียบ Rev. · ${esc(Q.no||'')}`,`<div class="qv">${qrvCmp(Q,a,c)}</div>`,'')};
document.addEventListener('change',e=>{const t=e.target;if(t&&t.dataset&&t.dataset.qvOnly){const w=t.closest('.qv').querySelector('.qv-w');if(w)w.classList.toggle('only',t.checked)}});
// ---- the card on the quote page
function qrvCard(Q){if(!Q||!(Q.items||[]).length)return '';const R=Q.revs||[],cur=qrvCur(Q),L=qrvLast(Q);
  const st=!L?'ยังไม่มี Rev. ระบบจะเก็บ <b>Rev.0</b> ให้เองเมื่อพิมพ์ใบลูกค้าหรือเปลี่ยนสถานะเป็นส่งแล้วครั้งแรก'
    :cur.dirty?`แก้ไขหลัง Rev.${L.n} แล้ว พิมพ์หรือส่งครั้งหน้าจะเก็บเป็น <b>Rev.${cur.n}</b>`:`ตรงกับ <b>Rev.${L.n}</b> ที่เก็บไว้ล่าสุด`;
  const opt=sel=>[...R.map(r=>[r.id,`Rev.${r.n} · ${qrvWhen(r.at)}`]),...(cur.dirty?[['cur','ฉบับปัจจุบัน (ยังไม่เก็บ)']]:[])].map(([v,l])=>`<option value="${v}"${v===sel?' selected':''}>${esc(l)}</option>`).join('');
  const bSel=cur.dirty?'cur':(R[R.length-1]||{}).id,aSel=cur.dirty?(R[R.length-1]||{}).id:(R[R.length-2]||{}).id;
  const rows=R.slice().reverse().map((r,j,all)=>{const p=all[j+1],s=r.sum||{},d=p?n(s.net)-n((p.sum||{}).net):0;
    return `<tr><td><b>Rev.${r.n}</b></td><td>${qrvWhen(r.at)}</td><td>${esc(r.by||'')}</td><td>${esc(QRV_WHY[r.why]||'')}${r.note?` · ${esc(r.note)}`:''}</td><td class="r">${fmt(n(s.net),2)}</td><td class="r">${p?qrvD(d):''}</td><td class="r">${s.npc!=null?fmt(n(s.npc),1)+'%':''}</td>
      <td style="white-space:nowrap"><button type="button" class="btn sm" data-a="qrvPrint" data-id="${Q.id}" data-r="${r.id}" title="พิมพ์ใบลูกค้าตามที่เป็นใน Rev. นี้">พิมพ์ฉบับนี้</button></td></tr>`}).join('');
  return `<section class="card qrv"><h2><span>ประวัติการแก้ไข (Rev.)</span><small>${st}</small><span class="sp"></span><button type="button" class="btn sm" data-a="qrvNew" data-id="${Q.id}">บันทึกเป็น Rev. ใหม่</button></h2>
  ${R.length?`<div class="tw"><table class="qb-t"><thead><tr><th>Rev.</th><th>เมื่อ</th><th>โดย</th><th>เหตุ</th><th class="r">ราคาเสนอ</th><th class="r">เทียบรอบก่อน</th><th class="r">กำไรสุทธิ</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
  ${R.length+(cur.dirty?1:0)>1?`<div class="row qrv-c" style="gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px">เทียบ <select id="qrvA" aria-label="ฉบับแรก">${opt(aSel)}</select> กับ <select id="qrvB" aria-label="ฉบับที่สอง">${opt(bSel)}</select><button type="button" class="btn sm pri" data-a="qrvCmp" data-id="${Q.id}">เทียบ</button></div>`:''}`:''}</section>`}
{const f=salesQuote;salesQuote=function(){const h=f.apply(this,arguments),C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];return Q?qbIns(h,qrvCard(Q)):h}}
document.head.insertAdjacentHTML('beforeend',`<style>.qv{min-width:min(860px,88vw)}.qv-n{margin:0 0 8px}.qv-s{width:auto;min-width:420px;margin-bottom:8px}.qv-s td,.qv-s th{padding:3px 10px}.qv-o{display:flex;gap:6px;align-items:center;font-size:13px;margin:6px 0}
.qv-t tr.qv-add td{background:rgba(30,142,90,.09)}.qv-t tr.qv-del td{background:rgba(192,57,43,.08);color:var(--muted,#567080)}.qv-t tr.qv-ch td{background:rgba(237,137,24,.10)}.qv-t s{color:var(--muted,#567080)}.qv-w.only tr.qv-same{display:none}.qv-w{max-height:55vh;overflow:auto}.qrv select{max-width:260px}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ประวัติการแก้ไข (Rev.)':'Revisions (Rev.)','บันทึกเป็น Rev. ใหม่':'Save as a new Rev.','พิมพ์ฉบับนี้':'Print this one','เทียบ':'Compare','ฉบับปัจจุบัน':'Current',
  'แสดงเฉพาะรายการที่เปลี่ยน':'Show changed lines only','เปลี่ยนไป':'Change','เทียบรอบก่อน':'Vs previous','พิมพ์ใบลูกค้า':'Customer copy printed','ส่งลูกค้า':'Sent to customer','บันทึกเอง':'Saved by hand'});
