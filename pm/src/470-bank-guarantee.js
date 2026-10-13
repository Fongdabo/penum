/* ---------- round 3.4: bank guarantee register ----------
   Every letter of guarantee the bank issues for the company (bid, performance, advance payment, retention,
   warranty) with its project, beneficiary, amount, expiry and fee. Alerts come before a letter expires and
   when the customer has handed one back but it has not gone back to the bank yet (the fee keeps running). */
DOC_EN.push([/ทะเบียนหนังสือค้ำประกัน/,'LETTER OF GUARANTEE REGISTER'],[/ขอให้ออกหนังสือค้ำประกัน/,'APPLICATION FOR LETTER OF GUARANTEE']);
// kind, label, default % of the contract (0 = from the project's advance / retention terms)
const LGT=[['bid','ค้ำประกันซอง',5],['perf','ค้ำประกันสัญญา',5],['adv','ค้ำประกันเงินล่วงหน้า',0],['ret','ค้ำประกันแทนเงินประกันผลงาน',0],['warr','ค้ำประกันความชำรุดบกพร่อง',5],['oth','อื่นๆ',0]];
const LGS=[['req','ขอออก'],['act','ส่งลูกค้าแล้ว'],['back','ลูกค้าคืนแล้ว รอคืนธนาคาร'],['closed','คืนธนาคารแล้ว'],['claim','ถูกเรียกเงิน']];
const LGLIVE=['req','act','back'];
function lgCfg(){const C=CO();C.lg=C.lg||[];C.lgLine=C.lgLine||[];if(C.lgFee==null)C.lgFee=1.75;return C}
NEW.lg=()=>({no:nextNo('LG-',CO().lg||[]),kind:'perf',proj:'',benef:'',bank:'KBANK',lgNo:'',amt:0,issue:today(),exp:addMo(today(),12),fee:CO().lgFee??1.75,dep:0,status:'req',note:''});
NEW.lgLine=()=>({bank:'KBANK',limit:0,dep:0,note:''});
const lgProj=x=>DB.projects[x.proj];
// contract value of the project; the guarantee is usually a share of it
const lgBase=p=>p?withP(p,()=>contract().total):0;
const lgPct=x=>{const b=lgBase(lgProj(x));return b?n(x.amt)/b*100:0};
const lgDays=x=>{if(!okD(x.issue))return 0;const end=x.status==='closed'&&okD(x.closed)?x.closed:x.status==='claim'?(x.closed||today()):today();return Math.max(0,diffD(x.issue,end<x.issue?x.issue:end))};
const lgFeeAmt=x=>Math.round(n(x.amt)*n(x.fee)/100*lgDays(x)/365);
const lgLeft=x=>okD(x.exp)?diffD(today(),x.exp):null;
function lgState(x){const k=lgLeft(x);if(x.status==='closed')return '<span class="pill">ปิดแล้ว</span>';if(x.status==='claim')return '<span class="pill bad">ถูกเรียกเงิน</span>';
  if(x.status==='back')return '<span class="pill warn">นำต้นฉบับคืนธนาคาร</span>';if(k==null)return '';return k<0?`<span class="pill bad">หมดอายุ ${-k} วัน</span>`:k<=60?`<span class="pill warn">เหลือ ${k} วัน</span>`:'<span class="pill ok">ใช้งาน</span>'}
const lgUsed=bank=>sum((CO().lg||[]).filter(x=>LGLIVE.includes(x.status)&&(!bank||x.bank===bank)),x=>n(x.amt));
ACT.lgFrom=b=>{const p=DB.projects[b.dataset.p];if(!p)return;const k=b.dataset.k,t=LGT.find(z=>z[0]===k)||LGT[1],I=p.info,base=lgBase(p);
  const pct=k==='adv'?n(I.adv):k==='ret'?n(I.ret):t[2],C=lgCfg(),c=(C.customers||[]).find(z=>z.id===I.cust);
  const x=Object.assign({id:uid()},NEW.lg(),{kind:k,proj:p.id,benef:(c&&c.name)||I.client||'',amt:Math.round(base*pct/100),exp:k==='warr'&&okD(I.handover)?addMo(I.handover,24):okD(I.finish)?addMo(I.finish,k==='perf'?3:0):addMo(today(),12),note:`${t[1]} ${fmtq(pct)}% ของมูลค่าสัญญา ${fmt(base)} บาท`});
  C.lg.push(x);S.sub.acct='lg';S.sel.lgf='';save();render();toast(`เพิ่ม ${x.no} แล้ว ตรวจวันหมดอายุตามสัญญาอีกครั้ง`)};
ACT.lgSt=b=>{const x=(CO().lg||[]).find(z=>z.id===b.dataset.id);if(!x)return;x.status=b.dataset.s;if(x.status==='closed'||x.status==='claim')x.closed=x.closed||today();if(x.status==='back')x.backAt=today();save();render()};
ACT.lgExt=b=>{const x=(CO().lg||[]).find(z=>z.id===b.dataset.id);if(!x)return;const v=prompt('ขยายวันหมดอายุเป็น (ปปปป-ดด-วว)',addMo(okD(x.exp)?x.exp:today(),6));if(!v||!okD(v))return;
  (x.ext=x.ext||[]).push({from:x.exp,to:v,at:today()});x.exp=v;save();render();toast('ขยายวันหมดอายุแล้ว')};
document.addEventListener('change',e=>{if(e.target.id==='lgF'){S.sel.lgf=e.target.value;render()}});

function lgRows(f){const L=(CO().lg||[]).slice().sort((a,b)=>(LGLIVE.includes(a.status)?0:1)-(LGLIVE.includes(b.status)?0:1)||String(a.exp).localeCompare(String(b.exp)));
  return f==='live'?L.filter(x=>LGLIVE.includes(x.status)):f==='soon'?L.filter(x=>LGLIVE.includes(x.status)&&lgLeft(x)!=null&&lgLeft(x)<=60):f&&f.startsWith('p:')?L.filter(x=>x.proj===f.slice(2)):L}
function lgTable(L){const po=()=>[['','–'],...projects().map(p=>[p.id,p.name])];
  const cols=[{k:'no',h:'เลขที่',w:92},{k:'kind',h:'ประเภท',t:'sel',o:LGT.map(t=>[t[0],t[1]]),w:170},{k:'proj',h:'โครงการ',t:'sel',o:po,w:170},{k:'benef',h:'ผู้รับผลประโยชน์',w:170},
    {k:'bank',h:'ธนาคาร',t:'sel',o:BANKS,w:110},{k:'lgNo',h:'เลขที่หนังสือ',w:130},{k:'amt',h:'วงเงิน (บาท)',t:'num',w:110,sum:x=>LGLIVE.includes(x.status)?n(x.amt):0},{h:'% สัญญา',t:'calc',r:1,f:x=>{const v=lgPct(x);return v?fmt(v,2)+'%':''}},
    {k:'issue',h:'วันที่ออก',t:'date'},{k:'exp',h:'วันหมดอายุ',t:'date'},{h:'สถานะวันที่',t:'calc',f:lgState},{k:'status',h:'สถานะ',t:'sel',o:LGS,w:150},
    {k:'fee',h:'ค่าธรรมเนียม %/ปี',t:'num',w:60},{h:'ค่าธรรมเนียมสะสม',t:'calc',r:1,f:x=>fmt(lgFeeAmt(x)),sum:x=>lgFeeAmt(x)},{k:'dep',h:'เงินฝากค้ำ',t:'num',w:90},{k:'note',h:'หมายเหตุ',w:180}];
  return gtable('co.lg',L,cols,{rowCls:x=>x.status==='closed'?'muted':'',extra:x=>`${LGLIVE.includes(x.status)?`<button type="button" class="btn sm" data-a="lgExt" data-id="${x.id}">ขยาย</button>`:''}${x.status==='act'?` <button type="button" class="btn sm" data-a="lgSt" data-s="back" data-id="${x.id}">ลูกค้าคืน</button>`:''}${x.status==='back'?` <button type="button" class="btn sm pri" data-a="lgSt" data-s="closed" data-id="${x.id}">คืนธนาคารแล้ว</button>`:''}${x.status==='req'?` <button type="button" class="btn sm" data-a="print" data-k="lgreq" data-id="${x.id}">หนังสือขอออก</button>`:''}`})}
function acctLg(){const C=lgCfg(),f=S.sel.lgf||'live',L=lgRows(f),live=C.lg.filter(x=>LGLIVE.includes(x.status)),lim=sum(C.lgLine,l=>n(l.limit)),used=lgUsed(),soon=live.filter(x=>lgLeft(x)!=null&&lgLeft(x)<=60).length,yr=today().slice(0,4);
  const feeY=sum(C.lg,x=>{if(!okD(x.issue))return 0;const s=x.issue>yr+'-01-01'?x.issue:yr+'-01-01',e=x.status==='closed'&&okD(x.closed)?x.closed:today();return e<s?0:Math.round(n(x.amt)*n(x.fee)/100*diffD(s,e)/365)});
  const PO=projects().filter(p=>lgBase(p)>0);
  return `<section class="card"><h2><span>ทะเบียนหนังสือค้ำประกัน (LG)</span><select id="lgF" aria-label="แสดง"><option value="live"${f==='live'?' selected':''}>ที่ยังใช้งาน</option><option value="soon"${f==='soon'?' selected':''}>ใกล้หมดอายุ 60 วัน</option><option value="all"${f==='all'?' selected':''}>ทั้งหมด</option>${projects().map(p=>`<option value="p:${p.id}"${f==='p:'+p.id?' selected':''}>${esc(p.name)}</option>`).join('')}</select><span class="sp"></span>
    <button type="button" class="btn sm" data-a="print" data-k="lgreg" data-id="${esc(f)}">พิมพ์ทะเบียน</button><button type="button" class="btn sm pri" data-a="add" data-c="co.lg">+ เพิ่มหนังสือค้ำประกัน</button></h2>
  <dl class="stats"><div><dt>ใช้งานอยู่</dt><dd>${live.length} ฉบับ</dd></div><div><dt>วงเงินค้ำประกันคงค้าง</dt><dd>${fmt(used)}</dd></div><div><dt>วงเงินธนาคารคงเหลือ</dt><dd>${lim?fmt(lim-used):'–'}${lim?` <small>จาก ${fmt(lim)}</small>`:''}</dd></div><div><dt>ใกล้หมดอายุ 60 วัน</dt><dd>${soon?`<span class="pill warn">${soon}</span>`:'0'}</dd></div><div><dt>ค่าธรรมเนียมปีนี้ (ประมาณ)</dt><dd>${fmt(feeY)}</dd></div></dl>
  ${lgTable(L)}
  <p class="hint" style="margin-top:8px">ค่าธรรมเนียมคิดตามวันจากวันที่ออกถึงวันที่คืนธนาคาร ถ้ายังไม่คืนต้นฉบับ ธนาคารยังคิดค่าธรรมเนียมต่อ · เตือนก่อนหมดอายุ 60 วันที่หน้าแรก</p></section>
  ${PO.length?`<section class="card"><h2><span>ขอออกจากโครงการ</span><small>คิดวงเงินจากมูลค่าสัญญาและเงื่อนไขเงินล่วงหน้า / เงินประกันผลงานของโครงการ</small></h2><div class="tw"><table><thead><tr><th>โครงการ</th><th class="r">มูลค่าสัญญา</th><th>LG ที่มี</th><th></th></tr></thead><tbody>
  ${PO.map(p=>{const H=C.lg.filter(x=>x.proj===p.id);return `<tr><td>${esc(p.name)}</td><td class="r">${fmt(lgBase(p))}</td><td>${H.map(x=>`<span class="pill${LGLIVE.includes(x.status)?' ok':''}">${esc((LGT.find(t=>t[0]===x.kind)||LGT[5])[1].replace('ค้ำประกัน',''))}</span>`).join(' ')||'<span class="muted">–</span>'}</td>
    <td style="white-space:nowrap">${LGT.slice(0,5).map(t=>`<button type="button" class="btn sm" data-a="lgFrom" data-p="${p.id}" data-k="${t[0]}">${t[1].replace('ค้ำประกัน','')}</button>`).join(' ')}</td></tr>`}).join('')}</tbody></table></div></section>`:''}
  <section class="card"><h2><span>วงเงินหนังสือค้ำประกันกับธนาคาร</span><span class="sp"></span><button type="button" class="btn sm" data-a="add" data-c="co.lgLine">+ เพิ่มวงเงิน</button></h2>
  ${gtable('co.lgLine',C.lgLine,[{k:'bank',h:'ธนาคาร',t:'sel',o:BANKS,w:140},{k:'limit',h:'วงเงิน (บาท)',t:'num',w:120},{h:'ใช้ไป',t:'calc',r:1,f:l=>fmt(lgUsed(l.bank))},{h:'คงเหลือ',t:'calc',r:1,f:l=>{const v=n(l.limit)-lgUsed(l.bank);return `<span class="pill ${v<0?'bad':'ok'}">${fmt(v)}</span>`}},{k:'dep',h:'เงินฝากค้ำประกันวงเงิน',t:'num',w:120},{k:'note',h:'หมายเหตุ',w:200}])}
  <div class="form" style="margin-top:8px"><label>ค่าธรรมเนียมตั้งต้น %/ปี<input data-t="num" data-p="co.lgFee" value="${esc(C.lgFee)}"></label></div></section>`}
PRINT.lgreg=f=>{const L=lgRows(f==='live'||f==='soon'||String(f).startsWith('p:')?f:'all');
  return cphead('ทะเบียนหนังสือค้ำประกัน',`ณ วันที่ ${thD(today())}`)+`<table><thead><tr><th>#</th><th>ประเภท</th><th>โครงการ / ผู้รับผลประโยชน์</th><th>ธนาคาร / เลขที่</th><th>วงเงิน</th><th>ออก</th><th>หมดอายุ</th><th>สถานะ</th></tr></thead><tbody>
  ${L.map((x,i)=>`<tr><td>${i+1}</td><td>${esc((LGT.find(t=>t[0]===x.kind)||LGT[5])[1])}</td><td>${esc((lgProj(x)||{}).name||'')}<br><small>${esc(x.benef||'')}</small></td><td>${esc((BANKS.find(k=>k[0]===x.bank)||['',''])[1])}<br><small>${esc(x.lgNo||'')}</small></td><td style="text-align:right">${fmt(x.amt,2)}</td><td>${thD(x.issue)}</td><td>${thD(x.exp)}</td><td>${esc((LGS.find(s=>s[0]===x.status)||LGS[0])[1])}</td></tr>`).join('')}
  <tr><td colspan="4" style="text-align:right"><b>รวมที่ยังใช้งาน</b></td><td style="text-align:right"><b>${fmt(sum(L.filter(x=>LGLIVE.includes(x.status)),x=>n(x.amt)),2)}</b></td><td colspan="3"></td></tr></tbody></table>`+signs(['ผู้จัดทำ (ฝ่ายบัญชี)','ผู้ตรวจสอบ','กรรมการผู้จัดการ'])};
// the company's request to its bank, ready to sign
PRINT.lgreq=id=>{const x=(CO().lg||[]).find(z=>z.id===id);if(!x)return '';const C=CO(),p=lgProj(x),t=(LGT.find(z=>z[0]===x.kind)||LGT[5])[1],bk=(BANKS.find(k=>k[0]===x.bank)||['',''])[1];
  return cphead('หนังสือขอให้ออกหนังสือค้ำประกัน',`เลขที่ ${esc(x.no)}`)+`<p>วันที่ ${thDL(today())}</p><p>เรียน ผู้จัดการ ธนาคาร${esc(bk)}</p>
  <p style="text-indent:2em;line-height:1.9">${esc(C.name||'บริษัท')} ขอให้ธนาคารออก<b>หนังสือ${esc(t)}</b> ในนามบริษัท ให้แก่ <b>${esc(x.benef||'..............................')}</b> สำหรับ${p?`โครงการ ${esc(p.name)}${p.info.contractNo?` สัญญาเลขที่ ${esc(p.info.contractNo)}`:''}`:'งานตามสัญญา'}
  วงเงิน <b>${fmt(x.amt,2)} บาท</b> (${bahtText(n(x.amt))}) มีผลตั้งแต่วันที่ ${thDL(x.issue)} ถึงวันที่ ${thDL(x.exp)} โดยให้ตัดวงเงินจากวงเงินหนังสือค้ำประกันของบริษัท และหักค่าธรรมเนียมจากบัญชีของบริษัท</p>
  ${x.note?`<p>หมายเหตุ ${esc(x.note)}</p>`:''}<p style="text-indent:2em">แนบสำเนาสัญญาหรือเอกสารประกวดราคาและแบบฟอร์มหนังสือค้ำประกันของผู้รับผลประโยชน์ (ถ้ามี)</p>`+signs(['ผู้มีอำนาจลงนาม และประทับตราบริษัท','ผู้ประสานงาน (ฝ่ายบัญชี)'])};

// wiring: a sub-tab under accounting, a card on the project's budget page and alerts on the home page
{const sb=subTabs;subTabs=function(k,list){if(k==='acct'&&!list.some(x=>x[0]==='lg')){const i=list.findIndex(x=>x[0]==='wht');list=i<0?[...list,['lg','หนังสือค้ำประกัน']]:[...list.slice(0,i+1),['lg','หนังสือค้ำประกัน'],...list.slice(i+1)]}return sb(k,list)}}
{const f=CVIEWS.acct;CVIEWS.acct=()=>{lgCfg();if(S.sub.acct==='lg'){const {html}=subTabs('acct',[['ar','ลูกหนี้ (เงินรับ)'],['bn','ใบวางบิล'],['ap','เจ้าหนี้ (เงินจ่าย)'],['cf','กระแสเงินสด'],['vat','ภาษีซื้อ-ภาษีขาย'],['wht','ภาษีหัก ณ ที่จ่าย']]);return html+acctLg()}return f()}}
{const f=VIEWS.cost;VIEWS.cost=()=>{const h=f();if((S.sub.cost||'sum')!=='sum'||!P)return h;const L=(CO().lg||[]).filter(x=>x.proj===P.id);
  return h+`<section class="card"><h2><span>หนังสือค้ำประกันของโครงการ</span><small>${L.filter(x=>LGLIVE.includes(x.status)).length} ฉบับที่ใช้งาน</small><span class="sp"></span>${allowed('co','acct')?`<button type="button" class="btn sm" data-a="go" data-m="co" data-k="acct" data-s="lg">ไปที่ทะเบียน</button>`:''}</h2>
  ${L.length?`<div class="tw"><table><thead><tr><th>ประเภท</th><th>ธนาคาร</th><th class="r">วงเงิน</th><th>หมดอายุ</th><th></th></tr></thead><tbody>${L.map(x=>`<tr><td>${esc((LGT.find(t=>t[0]===x.kind)||LGT[5])[1])}</td><td>${esc((BANKS.find(k=>k[0]===x.bank)||['',''])[1])} ${esc(x.lgNo||'')}</td><td class="r">${fmt(x.amt)}</td><td>${thD(x.exp)}</td><td>${lgState(x)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="hint">ยังไม่มีหนังสือค้ำประกันของโครงการนี้</p>'}</section>`}}
{const f=alerts;alerts=function(){const A=f();if(!allowed('co','acct'))return A;
  (CO().lg||[]).forEach(x=>{const p=lgProj(x)||null,k=lgLeft(x),t=(LGT.find(z=>z[0]===x.kind)||LGT[5])[1],go={m:'co',k:'acct',s:'lg'};
    if((x.status==='act'||x.status==='req')&&k!=null&&k<=60)A.push({lv:k<0?'bad':'warn',kind:k<0?'หนังสือค้ำประกันหมดอายุ':'หนังสือค้ำประกันใกล้หมดอายุ',p,txt:`${x.no} ${t} ${fmt(x.amt)} บาท`,due:x.exp,go});
    if(x.status==='back')A.push({lv:'warn',kind:'คืนต้นฉบับหนังสือค้ำประกันให้ธนาคาร',p,txt:`${x.no} ${t} · ค่าธรรมเนียมยังเดินอยู่`,due:x.backAt||today(),go})});
  return A.sort((a,b)=>(a.lv==='bad'?0:1)-(b.lv==='bad'?0:1)||String(a.due).localeCompare(String(b.due)))}}
// demo: a few letters on the demo projects
{const f=ACT.loadDemo;ACT.loadDemo=b=>{const r=f(b);const C=lgCfg();if(!C.lg.length){const td=today(),L=projects().filter(p=>lgBase(p)>0);
  C.lgLine.push({id:uid(),bank:'KBANK',limit:20000000,dep:2000000,note:'วงเงิน LG รวม'});
  L.slice(0,3).forEach((p,i)=>{const base=lgBase(p),cust=(C.customers||[]).find(z=>z.id===p.info.cust);const bn=(cust&&cust.name)||p.info.client||'';
    C.lg.push({id:uid(),no:nextNo('LG-',C.lg),kind:'perf',proj:p.id,benef:bn,bank:'KBANK',lgNo:`KB-LG-69-${pad(1201+i,4)}`,amt:Math.round(base*.05),issue:addD(td,-200+i*40),exp:addD(td,[45,160,400][i]),fee:1.75,dep:0,status:'act',note:'5% ของมูลค่าสัญญา'});
    if(n(p.info.adv))C.lg.push({id:uid(),no:nextNo('LG-',C.lg),kind:'adv',proj:p.id,benef:bn,bank:'KBANK',lgNo:`KB-LG-69-${pad(1301+i,4)}`,amt:Math.round(base*n(p.info.adv)/100),issue:addD(td,-190+i*40),exp:addD(td,[-5,120,300][i]),fee:1.75,dep:0,status:i===0?'back':'act',backAt:i===0?addD(td,-3):undefined,note:''})});
  C.lg.push({id:uid(),no:nextNo('LG-',C.lg),kind:'bid',proj:'',benef:'การไฟฟ้านครหลวง',bank:'KBANK',lgNo:'KB-LG-69-0990',amt:250000,issue:addD(td,-120),exp:addD(td,-30),closed:addD(td,-25),fee:1.75,dep:0,status:'closed',note:'ประกวดราคางานระบบไฟฟ้าอาคาร ไม่ได้งาน'})}
  return r}}

