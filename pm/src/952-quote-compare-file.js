/* ---------- 4.79 เทียบกับไฟล์ฉบับเก่า: a quotation beside an older BOQ file (R1 in Excel or PDF), line by line ----------
   User (2026-10-26, TOYOTA CANTEEN R1 → R3): "ทำด้วยครับ" / "ลูกค้าจะได้เช็คได้ ผมว่าดี". 923 compares the Revs kept inside the quote; an
   older version that was never in PENUM (the R1 Excel the customer already has) comes in through the usual import dialog (710, target
   'qv'), is kept with the quote (Q.vf, newest 3: {id, nm, at, items:[{g, head, desc, unit, q, m, l}], ex:{extra, disc}}) and shown
   beside the quote as it is now: quantity, selling price per unit and amount, added / removed / changed, totals before and with VAT.
   Lines meet by their wording (numbering left out), unit, then section and heading. "พิมพ์ให้ลูกค้า" prints the same table with
   selling prices only (PRINT.qvf, A4 landscape), so the customer can check what changed.
   4.80 user: "เทียบดึงราคาจากคลังมาเทียบด้วยดีไหม แต่ตอนปริ้นให้เลือกส่งลูกค้าหรือภายใน" / "จะได้รู้ราคาตามกระทรวงด้วย". The internal copy adds
   the cost per unit of each line beside the คลังราคากลาง price (965 tdLibMatch, the same match as the quote's library card) and the
   official price among that line's sources (สนค. / ว 480 / สำนักงบฯ, 970 plOffs), with the gap in %. Print asks: customer or internal. */
const QVF_MAX=3;
const qvfN=s=>String(s||'').toLowerCase().replace(/^\s*[-–•]?\s*(\d+(\.\d+)*\.?\s+)?/,'').replace(/[\s.,:;'"“”()\-–]+/g,'');
const qvfU=s=>String(s||'').toLowerCase().replace(/[\s.]/g,'');
const qvfTok=s=>new Set(String(s||'').toLowerCase().replace(/^\s*\d+(\.\d+)*\.?\s*/,'').split(/[^a-z0-9ก-๙]+/).filter(Boolean));
const qvfSim=(a,b)=>{const A=qvfTok(a),B=qvfTok(b);if(!A.size||!B.size)return 0;let k=0;A.forEach(x=>{if(B.has(x))k++});return k/Math.max(A.size,B.size)};
// pair every line now with a line of the old file: same wording and unit first, the closest section and heading among those
function qvfPair(Q,F){const O=F.items.map((o,k)=>({o,k,d:qvfN(o.desc),u:qvfU(o.unit),used:0})),N=(Q.items||[]).filter(i=>!i.hs),R=[];
  N.forEach(i=>{const d=qvfN(i.desc),u=qvfU(i.unit);let c=O.filter(x=>!x.used&&x.d===d&&x.u===u);if(!c.length)c=O.filter(x=>!x.used&&x.d===d);
    let b=null,bs=-1;c.forEach(x=>{const s=(qvfN(x.o.g)===qvfN(i.g)?2:0)+(qvfN(x.o.head)===qvfN(i.head)?3:0)+2*qvfSim(x.o.head,i.head)+qvfSim(x.o.g,i.g);if(s>bs){bs=s;b=x}});
    if(b)b.used=1;R.push({i,o:b&&b.o})});
  O.filter(x=>!x.used).forEach(x=>R.push({i:null,o:x.o}));return R}
function qvfRows(Q,F){return qvfPair(Q,F).map(({i,o})=>{const q1=o?n(o.q):0,u1=o?n(o.m)+n(o.l):0,q2=i?n(i.q):0,u2=i?qUnit(Q,i):0,a1=q1*u1,a2=q2*u2;
  const st=!o?'add':!i||!q2?'del':!q1?'add':q2!==q1?(q2>q1?'up':'dn'):Math.abs(u2-u1)>0.004?'pr':'same';
  return {i,g:(i||o).g||'',head:(i||o).head||'',desc:(i||o).desc||'',unit:(i||o).unit||'',q1,u1,a1,q2,u2,a2,st}})}
// 4.80 the official kinds of price, best first: สนค. + ว 480 on both halves, then the other government lists, then one half official
const QVF_OFF=['gov','moc','bb','bbc','cgd','offm','offl'];
const qvfSk=s=>(PL_SK[s]||[s||''])[0];
const qvfOff=x=>{const O=plOffs(x);return QVF_OFF.map(k=>O.find(z=>z.s===k&&n(z.m)+n(z.l)>0)).find(Boolean)};
/* A BOQ line is written "S,W,V PIPE (PVC CLASS 8.5) · -Dai 50 มม." where the library says "ท่อ PVC ชั้น 8.5 ขนาด 2 นิ้ว": the word
   likeness of 965 finds next to nothing there. So lines meet first by what they are: the kind of thing (pipe, gate valve, sprinkler…,
   from the line, or from its heading when the line names none), the material, the class / SCH, and the size in inches (mm turned
   into the nominal inch). Every kind and material of the library line must be in the BOQ line and the numbers must agree. */
const QVF_T=[['conduit',/ท่อร้อยสาย|conduit|\bemt\b|\bimc\b/],['flex',/flexible|ท่ออ่อน/],['acdrain',/น้ำทิ้งแอร์/],['duct',/ท่อลม|\bduct/],['insul',/ฉนวน|insulat/],['cabinet',/ตู้/],['pipe',/ท่อ(?!ร้อยสาย|อ่อน)|pipe/],
  ['gatevalve',/gate\s*valve|ประตูน้ำ/],['checkvalve',/check\s*valve|เช็ควาล์ว/],['ballvalve',/ball\s*valve|บอลวาล์ว/],['floordrain',/floor\s*drain|ตะแกรงกันกลิ่น|ท่อระบายพื้น/],
  ['cleanout',/clean\s*out/],['sprinkler',/sprinkler|หัวกระจายน้ำ/],['extinguisher',/extinguisher|ถังดับเพลิง/],['fhc',/hose\s*cabinet|\bfhc\b|ตู้ดับเพลิง/],
  ['meter',/meter|มิเตอร์|มาตรวัดน้ำ/],['tank',/ถัง(?!ดับเพลิง)|tank/],['greasetrap',/ดักไขมัน|grease/],['septic',/บำบัด|septic/],['storage',/เก็บน้ำ/],
  ['pump',/pump|ปั๊ม/],['fitting',/fitting|ข้อต่อ/],['hanger',/hanger|support|แขวนท่อ/],['wire',/สายไฟ|\bthw\b|\bnyy\b|\bvct\b/]];
const QVF_M=[['pvc',/pvc/],['ppr',/ppr/],['pe',/hdpe|\bpe\b|pe(?=\s*แบบ)/],['steel',/เหล็กดำ|black\s*steel|a53/],['galv',/galvan|อาบสังกะสี|\bgsp\b/],
  ['sch40',/sch\.?\s*40/],['bronze',/bronze|ทองเหลือง|บรอนซ์/],['castiron',/cast\s*iron|เหล็กหล่อ/],['stainless',/สแตนเลส|stainless/],['copper',/ทองแดง|copper/],['abc',/\babc\b/]];
const QVF_MM={15:'1/2',18:'1/2',20:'3/4',25:'1',32:'1-1/4',40:'1-1/2',50:'2',65:'2-1/2',80:'3',100:'4',125:'5',150:'6',200:'8',250:'10',300:'12'};
const qvfSz=t=>{const m=t.match(/(\d+[-\s]\d\/\d|\d\/\d|\d+(?:\.\d+)?)\s*"/);if(m)return m[1].replace(/\s+/,'-');const k=t.match(/(\d+)\s*(?:mm|มม)\b/);return k&&QVF_MM[k[1]]||''};
const qvfToks=(t,D)=>new Set(D.filter(([,re])=>re.test(t)).map(([k])=>k));
function qvfFeat(head,desc){const N=x=>pbNorm(plSyn(String(x||''))).replace(/^\s*\d+(\.\d+)*\.?\s*/,'').replace(/(tis|มอก)\.?\s*[\d\-]+/g,' ');
  const h=N(head),d=N(desc),all=h+' '+d,td=qvfToks(d,QVF_T),c=all.match(/(?:class|ชั้น|cl\.)\s*(\d+(?:\.\d+)?)/),cap=d.match(/(\d+(?:\.\d+)?)\s*(ลิตร|ปอนด์|lb)/)||all.match(/\bk\s*(\d+(?:\.\d+)?)/);
  return {t:td.size?td:qvfToks(h,QVF_T),m:qvfToks(all,QVF_M),c:c?c[1]:'',z:qvfSz(d),cap:cap?cap[1]:''}}
let QVFW=null;const qvfLibF=()=>{const L=plCfg();if(!QVFW||QVFW.L!==L||QVFW.n!==L.length)QVFW={L,n:L.length,F:L.map(x=>({x,f:qvfFeat('',x.name+(x.br?' '+x.br:''))}))};return QVFW.F};
// a library line that is only "a pipe" / "a cabinet" with no material says too little: its wording must also be close
const QVF_GEN=['pipe','cabinet','tank','fitting','hanger'];
const qvfSub=(A,B)=>[...A].every(k=>B.has(k));
function qvfFind(i){const u=pbNorm(i.unit||'').replace(/\W/g,'');if(/^(lot|ls|งาน|เหมา)$/.test(u))return null;const q=qvfFeat(i.head,i.desc);if(!q.t.size)return null;
  const C=qvfLibF().filter(({x,f})=>f.t.size&&qvfSub(f.t,q.t)&&qvfSub(f.m,q.m)&&(!f.c||f.c===q.c)&&f.z===q.z&&(!f.cap||f.cap===q.cap)&&(f.m.size||![...f.t].every(k=>QVF_GEN.includes(k))||pbSim(pbBig(i.desc),pbBig(x.name))>=.35)).map(e=>e.x);
  return C.find(qvfOff)||C[0]||null}
function qvfLib(Q,i){if(!i||typeof tdLibMatch!=='function')return null;const o0=(Q.plx||{})[i.id];
  const x=o0&&o0!=='none'?(tdLibMatch(Q,i)||{}).x:qvfFind(i)||(o0!=='none'?(tdLibMatch(Q,i)||{}).x:null);if(!x)return null;const o=qvfOff(x);
  return {nm:x.name,lib:n(x.m)+n(x.l),lk:plSrcK(x),off:o?n(o.m)+n(o.l):0,ok:o?o.s:'',od:o?o.d||'':''}}
const qvfPc=(a,b)=>!a||!b?'<span class="qvf-0">–</span>':(v=>`<span class="${Math.abs(v)<0.5?'qvf-0':v>0?'qvf-m':'qvf-p'}">${v>0?'+':''}${fmt(v,1)}%</span>`)((a-b)/b*100);
const QVF_ST={add:'เพิ่มใหม่',del:'ตัดออก',up:'เพิ่มปริมาณ',dn:'ลดปริมาณ',pr:'ราคาเปลี่ยน',same:'เท่าเดิม'};
function qvfSum(Q,F,R){const l1=sum(R,r=>r.a1),c=qCalc(Q),x=F.ex||{},net1=l1+n(x.extra)-n(x.disc);return {l1,l2:c.lines,net1,net2:c.net,g1:net1*1.07,g2:c.grand}}
const qvfD=v=>Math.abs(v)<0.005?'<span class="qvf-0">–</span>':`<span class="${v>0?'qvf-p':'qvf-m'}">${v>0?'+':''}${fmt(v,2)}</span>`;
const qvfDq=v=>Math.abs(v)<1e-9?'<span class="qvf-0">–</span>':`<span class="${v>0?'qvf-p':'qvf-m'}">${v>0?'+':''}${fmtq(v)}</span>`;
// the table, for the page (only = hide unchanged lines) and the print
function qvfTable(Q,F,only,inn){const R=qvfRows(Q,F),S=qvfSum(Q,F,R),cnt=k=>R.filter(r=>r.st===k).length,W=inn?15:11;let g=null,h='';
  const C={a:0,o:0,k:0,t:0};if(inn)R.forEach(r=>{r.c=r.i?n(r.i.m)+n(r.i.l):0;r.L=r.i&&r.q2?qvfLib(Q,r.i):null;if(r.i&&r.q2){C.t++;if(r.L&&r.L.off){C.k++;C.a+=r.q2*r.c;C.o+=r.q2*r.L.off}}});
  R.forEach(r=>{if(only&&r.st==='same')return;if(r.g!==g){g=r.g;h+=`<tr class="qvf-g"><td colspan="${W}">${esc(g||'ไม่ระบุหมวด')}</td></tr>`}
    h+=`<tr class="qvf-${r.st}"><td>${esc([r.head.replace(/^\s*\d+(\.\d+)*\.?\s*/,''),r.desc].filter(Boolean).join(' · '))}</td><td>${esc(r.unit)}</td>
      <td class="r">${r.q1?fmtq(r.q1):'–'}</td><td class="r">${r.q2?fmtq(r.q2):'–'}</td><td class="r">${qvfDq(r.q2-r.q1)}</td>
      <td class="r">${r.u1?fmt(r.u1,2):'–'}</td><td class="r">${r.u2&&r.q2?fmt(r.u2,2):'–'}</td>
      <td class="r">${r.q1?fmt(r.a1,2):'–'}</td><td class="r">${r.q2?fmt(r.a2,2):'–'}</td><td class="r">${qvfD(r.a2-r.a1)}</td><td class="c"><span class="qvf-st">${QVF_ST[r.st]}</span></td>${inn?qvfInC(r):''}</tr>`});
  const tr=(l,a,b)=>`<tr><td>${l}</td><td class="r">${fmt(a,2)}</td><td class="r">${fmt(b,2)}</td><td class="r">${qvfD(b-a)}</td></tr>`;
  const ins=inn?`<p class="qvf-in">ราคาทุน (ภายใน): ${C.k?`ทุนรวมใบนี้ <b>${fmt(C.a,2)}</b> · ถ้าใช้ราคาทางการ <b>${fmt(C.o,2)}</b> · ต่าง ${qvfD(C.a-C.o)} (${qvfPc(C.a,C.o)})
    คิดจาก ${C.k} จาก ${C.t} รายการที่มีราคาทางการในคลังราคากลาง`:`ยังไม่มีรายการใดที่มีราคาทางการในคลังราคากลาง (${C.t} รายการ) เติมราคา สนค. / ว 480 ได้ที่ ประมาณราคา › คลังราคากลาง`}</p>`:'';
  return {ins,n:{add:cnt('add'),del:cnt('del'),ch:cnt('up')+cnt('dn')+cnt('pr'),same:cnt('same')},
    sum:`<table class="qvf-s"><thead><tr><th></th><th class="r">${esc(F.nm)}</th><th class="r">${esc(Q.no||'ฉบับนี้')}</th><th class="r">ต่างกัน</th></tr></thead><tbody>
      ${tr('รวมรายการ',S.l1,S.l2)}${tr('ยอดก่อน VAT',S.net1,S.net2)}${tr('รวม VAT 7%',S.g1,S.g2)}</tbody></table>`,
    rows:`<table class="qvf-t"><thead><tr><th rowspan="2">รายการ</th><th rowspan="2">หน่วย</th><th colspan="3" class="c">จำนวน</th><th colspan="2" class="c">ราคา/หน่วย</th><th colspan="3" class="c">จำนวนเงิน</th><th rowspan="2" class="c">สถานะ</th>${inn?'<th colspan="4" class="c qvf-ih">ราคาทุน/หน่วย (ภายใน)</th>':''}</tr>
      <tr><th class="r">เดิม</th><th class="r">ใหม่</th><th class="r">ต่าง</th><th class="r">เดิม</th><th class="r">ใหม่</th><th class="r">เดิม</th><th class="r">ใหม่</th><th class="r">ต่าง</th>${inn?'<th class="r qvf-ih">ใบนี้</th><th class="r qvf-ih">คลังราคากลาง</th><th class="r qvf-ih">ราคาทางการ</th><th class="r qvf-ih">ต่างจากทางการ</th>':''}</tr></thead><tbody>${h||`<tr><td colspan="${W}" class="empty">ไม่มีรายการที่เปลี่ยน</td></tr>`}</tbody></table>`}}
const qvfInC=r=>{if(!r.i||!r.q2)return '<td class="qvf-i"></td>'.repeat(4);const L=r.L;
  return `<td class="r qvf-i">${r.c?fmt(r.c,2):'–'}</td><td class="r qvf-i">${L&&L.lib?`${fmt(L.lib,2)}<br><small class="muted" title="${esc(L.nm)}"><span class="qvf-nm">${esc(String(L.nm).slice(0,30))} · </span>${esc(qvfSk(L.lk))}</small>`:'<span class="qvf-0">ไม่มีในคลัง</span>'}</td>
    <td class="r qvf-i">${L&&L.off?`<b>${fmt(L.off,2)}</b><br><small class="muted">${esc(qvfSk(L.ok))}${L.od?' '+thD(L.od):''}</small>`:'<span class="qvf-0">–</span>'}</td><td class="r qvf-i">${L&&L.off?qvfPc(r.c,L.off):'<span class="qvf-0">–</span>'}</td>`};
const qvfGet=id=>{const [qid,fid,k]=String(id||'').split('|'),Q=CO().quotes.find(q=>q.id===qid),F=Q&&(Q.vf||[]).find(f=>f.id===fid);return F?{Q,F,inn:k==='in'}:null};
const QVF_CSS=`.qvf-t{width:100%;border-collapse:collapse;font-size:12.5px}.qvf-t th,.qvf-t td{border:1px solid #d5dde0;padding:3px 6px;vertical-align:top}.qvf-t thead th{background:#123A42;color:#fff;font-weight:600}
.qvf-t tr.qvf-g td{background:#eef3f4;font-weight:700}.qvf-t tr.qvf-add td{background:#e6f5ea}.qvf-t tr.qvf-del td{background:#fbe6e6}.qvf-t tr.qvf-up td,.qvf-t tr.qvf-dn td,.qvf-t tr.qvf-pr td{background:#fff6dc}
.qvf-t td.qvf-i{background:#f3f0fa}.qvf-t th.qvf-ih{background:#4a3f73}.qvf-in{margin:4px 0 8px;padding:5px 9px;border-left:4px solid #4a3f73;background:#f3f0fa;color:#222;font-size:12.5px}
.qvf-p{color:#1e7a46;font-weight:600}.qvf-m{color:#b3261e;font-weight:600}.qvf-0{color:#9aa7ab}.qvf-st{white-space:nowrap;font-size:11.5px}.qvf-s{border-collapse:collapse;margin:6px 0 10px;font-size:13px}.qvf-s td,.qvf-s th{border:1px solid #d5dde0;padding:3px 10px}.qvf-s thead th{background:#eef3f4}`;
const qvfLegend='<p class="qvf-lg"><span class="qvf-k" style="background:#e6f5ea"></span> เพิ่มใหม่ <span class="qvf-k" style="background:#fbe6e6"></span> ตัดออก <span class="qvf-k" style="background:#fff6dc"></span> ปริมาณหรือราคาเปลี่ยน · ราคาไม่รวม VAT</p>';
PRINT.qvf=id=>{const x=qvfGet(id);if(!x)return '';const {Q,F,inn}=x,T=qvfTable(Q,F,false,inn),cu=custName(Q.cust)||Q.cust||'';
  return `<style>@page{size:A4 landscape;margin:9mm}${QVF_CSS}.qvf-p,.qvf-m{font-weight:600}.qvf-lg{font-size:11px;margin:4px 0}.qvf-k{display:inline-block;width:12px;height:10px;border:1px solid #ccd;margin:0 3px 0 8px;vertical-align:middle}
  ${inn?'.qvf-t{font-size:10.5px}.qvf-t th,.qvf-t td{padding:2px 4px}.qvf-t tbody td:first-child{width:30%}.qvf-t .qvf-nm{display:none}.qvf-t td.qvf-i small{font-size:9px}.qvf-band{border:2px solid #b3261e;color:#b3261e;font-weight:700;padding:3px 8px;margin:0 0 6px;text-align:center}':''}</style>
  <div data-doc-name="${esc(`${Q.no||''} เทียบ ${F.nm}${inn?' ภายใน':''} ${cu}`)}"></div>`+cphead(`ตารางเปรียบเทียบรายการ ${esc(Q.no||'')} กับ ${esc(F.nm)}${inn?' (ฉบับภายใน)':''}`,esc(Q.no||''))+
  (inn?'<div class="qvf-band">ฉบับภายใน มีราคาทุน ห้ามส่งให้ลูกค้า</div>':'')+`<p style="margin:2px 0 6px">${cu?`เรียน <b>${esc(cu)}</b> · `:''}${esc([Q.pname,Q.title].filter(Boolean).join(' · '))}</p>
  <p style="margin:0 0 4px">เพิ่มใหม่ ${T.n.add} รายการ · ตัดออก ${T.n.del} รายการ · ปริมาณหรือราคาเปลี่ยน ${T.n.ch} รายการ · เท่าเดิม ${T.n.same} รายการ</p>${T.sum}${T.ins}${qvfLegend}${T.rows}`};
let QVF_IN=1;// the dialog shows the internal columns until hidden (to show the screen to a customer)
const qvfPrBtns=(Q,F)=>`<button type="button" class="btn pri" data-a="print" data-k="qvf" data-id="${Q.id}|${F.id}">พิมพ์ให้ลูกค้า</button><button type="button" class="btn" data-a="print" data-k="qvf" data-id="${Q.id}|${F.id}|in" title="มีราคาทุน ราคาคลังราคากลาง และราคาทางการ">พิมพ์ฉบับภายใน</button>`;
function qvfShow(Q,F){const T=qvfTable(Q,F,true,QVF_IN);
  dialog(`เทียบ ${esc(Q.no||'')} กับ ${esc(F.nm)}`,`<div class="qvf"><p style="margin:0 0 6px">เพิ่มใหม่ <b>${T.n.add}</b> รายการ · ตัดออก <b>${T.n.del}</b> · ปริมาณหรือราคาเปลี่ยน <b>${T.n.ch}</b> · เท่าเดิม ${T.n.same} (ซ่อนไว้ ดูครบในใบพิมพ์)
    <button type="button" class="btn sm" data-a="qvfIn" data-id="${Q.id}|${F.id}" style="margin-left:8px">${QVF_IN?'ซ่อนราคาทุน':'แสดงราคาทุนและราคาทางการ'}</button></p>${T.sum}${T.ins}<div class="tw qvf-w">${T.rows}</div></div>`,
    qvfPrBtns(Q,F));const d=$('#dlg');if(d){d.classList.add('dlg-wide','qvf-dlg');d.addEventListener('close',()=>d.classList.remove('dlg-wide','qvf-dlg'),{once:true})}}
// ---- the old file comes in through the import dialog
// 4.80 data-to = a saved file: the new file's lines join it (R1 sent as one file per system: ประปา, ดับเพลิง)
ACT.qvfAdd=b=>{const to=b.dataset.to||'',x=to&&qvfGet(b.dataset.id+'|'+to);ACT.impFile({dataset:{t:'qv',id:b.dataset.id}});if(x)IMP.to=to;
  const g=$('#impGoBtn');if(g)g.textContent=x?'รวมเข้าใบเทียบ':'เทียบกับใบนี้';
  const p=document.querySelector('#dlg .hint');if(p)p.insertAdjacentHTML('afterend',x?`<p class="hint">เลือกไฟล์ที่จะรวมเข้ากับ “${esc(x.F.nm)}” เช่น BOQ ฉบับเดียวกันของอีกระบบ รายการทั้งสองไฟล์จะเทียบกับใบนี้รวมกัน</p>`:
    '<p class="hint">เลือกไฟล์ BOQ หรือใบเสนอราคาฉบับเก่า (เช่น R1) ระบบจะเทียบทีละรายการกับใบนี้ ใบนี้ไม่ถูกแก้ ตรวจว่าคอลัมน์ราคาเป็นราคาขายที่ลูกค้าเห็น ถ้าฉบับเก่าแยกเป็นหลายไฟล์ เลือกไฟล์แรกก่อน แล้วกด “+ รวมไฟล์” ที่ชื่อไฟล์นั้น</p>')};
{const f=impTarget;impTarget=function(){if(IMP.t==='qv'){const Q=CO().quotes.find(x=>x.id===IMP.id);return Q&&{has:0,o:Q}}return f.apply(this,arguments)}}
{const f=ACT.impGo;ACT.impGo=function(b){if(IMP.t!=='qv')return f.apply(this,arguments);const Q=CO().quotes.find(x=>x.id===IMP.id);if(!Q)return;
  const L=(IMP.rows||[]).filter(r=>r.on&&impTxt(r.desc)).map(r=>({g:impTxt(r.g),head:impTxt(r.head),desc:impTxt(r.desc),unit:impTxt(r.unit),q:n(r.q),m:n(r.m),l:n(r.l)}));
  if(!L.length){toast('ไม่มีรายการที่เลือกไว้');return}const E=IMP.ex||{};
  const nm=String(IMP.name||'ไฟล์เดิม').replace(/\.[a-z0-9]+$/i,''),ex={extra:Math.round(n(E.extra)*100)/100,disc:Math.round(n(E.disc)*100)/100},F0=IMP.to&&(Q.vf||[]).find(f=>f.id===IMP.to);
  if(F0){F0.items.push(...L);F0.nm+=' + '+nm;const r2=v=>Math.round(v*100)/100;F0.ex={extra:r2(n((F0.ex||{}).extra)+ex.extra),disc:r2(n((F0.ex||{}).disc)+ex.disc)};save();render();qvfShow(Q,F0);toast(`รวม ${L.length} รายการจาก “${nm}” เข้าใบเทียบแล้ว`);return}
  const F={id:uid(),nm,at:new Date().toISOString(),items:L,ex};
  Q.vf=[...(Q.vf||[]),F].slice(-QVF_MAX);save();render();qvfShow(Q,F)}}
ACT.qvfIn=b=>{QVF_IN=QVF_IN?0:1;const x=qvfGet(b.dataset.id);if(x)qvfShow(x.Q,x.F)};
// the พิมพ์ button by a saved file asks which copy
ACT.qvfPr=b=>{const x=qvfGet(b.dataset.id);if(!x)return;dialog('พิมพ์ใบเทียบฉบับไหน',`<p style="margin:0 0 8px"><b>ฉบับลูกค้า</b> มีแต่ราคาขาย ส่งให้ลูกค้าเช็คได้</p>
  <p style="margin:0"><b>ฉบับภายใน</b> เพิ่มราคาทุนต่อหน่วย ราคาในคลังราคากลาง และราคาทางการ (สนค. / ว 480 / สำนักงบฯ) ห้ามส่งให้ลูกค้า</p>`,qvfPrBtns(x.Q,x.F))};
ACT.qvfOpen=b=>{const x=qvfGet(b.dataset.id);if(x)qvfShow(x.Q,x.F)};
ACT.qvfDel=b=>{const x=qvfGet(b.dataset.id);if(!x||!confirm(`ลบไฟล์เทียบ “${x.F.nm}” ออกจากใบนี้?`))return;x.Q.vf=x.Q.vf.filter(f=>f!==x.F);save();render()};
// ---- on the quote page, inside the Rev. card (923)
{const f=qrvCard;qrvCard=function(Q){const h=f.apply(this,arguments);if(!h||!Q)return h;const V=Q.vf||[];
  const box=`<div class="qvf-c"><b>เทียบกับไฟล์ฉบับเก่า</b> <small class="muted">เช่น BOQ R1 ที่ส่งลูกค้าไปแล้ว ดูว่าอะไรเพิ่ม ตัด หรือเปลี่ยน แล้วพิมพ์ให้ลูกค้าเช็คได้</small>
    ${V.map(F=>`<span class="qvf-f"><button type="button" class="btn sm" data-a="qvfOpen" data-id="${Q.id}|${F.id}">${esc(F.nm)}</button><button type="button" class="btn sm" data-a="qvfPr" data-id="${Q.id}|${F.id}" title="พิมพ์ตารางเทียบ ฉบับลูกค้าหรือฉบับภายใน">พิมพ์…</button><button type="button" class="btn sm" data-a="qvfAdd" data-id="${Q.id}" data-to="${F.id}" title="รวมไฟล์ฉบับเก่าอีกไฟล์ (เช่น อีกระบบ) เข้าใบเทียบนี้">+ รวมไฟล์</button><button type="button" class="x" data-a="qvfDel" data-id="${Q.id}|${F.id}" title="ลบไฟล์เทียบนี้" aria-label="ลบไฟล์เทียบนี้">✕</button></span>`).join('')}
    <button type="button" class="btn sm pri" data-a="qvfAdd" data-id="${Q.id}">${V.length?'+ ไฟล์อื่น':'เลือกไฟล์ฉบับเก่า…'}</button></div>`;
  const k=h.lastIndexOf('</section>');return k<0?h:h.slice(0,k)+box+h.slice(k)}}
document.head.insertAdjacentHTML('beforeend',`<style>${QVF_CSS}.qvf{min-width:min(1100px,90vw)}#dlg.qvf-dlg{width:min(1440px,97vw)}.qvf-w{max-height:58vh;overflow:auto}.qvf-c{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px dashed var(--line,#cfd8dc)}
.qvf-f{display:inline-flex;gap:3px;align-items:center}.qvf-t thead th{position:sticky;top:0}.qvf-t thead tr+tr th{top:25px}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'เทียบกับไฟล์ฉบับเก่า':'Compare with an older file','เลือกไฟล์ฉบับเก่า…':'Choose the older file…','+ ไฟล์อื่น':'+ Another file','พิมพ์ให้ลูกค้า':'Print for the customer',
  'เทียบกับใบนี้':'Compare with this quote','เพิ่มใหม่':'Added','ตัดออก':'Removed','เพิ่มปริมาณ':'More','ลดปริมาณ':'Less','ราคาเปลี่ยน':'Price changed','เท่าเดิม':'Same','ต่างกัน':'Difference','สถานะ':'Status','เดิม':'Old','ใหม่':'New','ต่าง':'Change','รวมรายการ':'Lines total','ยอดก่อน VAT':'Before VAT','รวม VAT 7%':'With VAT 7%',
  'รวมเข้าใบเทียบ':'Add to this comparison','+ รวมไฟล์':'+ Add a file',
  'พิมพ์ฉบับภายใน':'Print internal copy','ซ่อนราคาทุน':'Hide costs','แสดงราคาทุนและราคาทางการ':'Show costs and official prices','พิมพ์ใบเทียบฉบับไหน':'Which copy to print',
  'ราคาทุน/หน่วย (ภายใน)':'Cost per unit (internal)','ใบนี้':'This quote','คลังราคากลาง':'Price library','ราคาทางการ':'Official price','ต่างจากทางการ':'vs official','ไม่มีในคลัง':'Not in library',
  'ฉบับภายใน มีราคาทุน ห้ามส่งให้ลูกค้า':'Internal copy with costs: do not send to the customer'});
