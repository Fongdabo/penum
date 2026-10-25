/* ---------- 4.65 หนังสือเรื่องเลื่อนเช็ค (user: "แล้วในกรณีเลื่อนเลื่อนเช็คลูกค้าละ" · "ทำเพิ่มเลย") ----------
   Two more kinds in the list of 942 (โครงการ › ออกเอกสาร › หนังสือหยุดงาน, group เช็ค), numbered SW- like the rest:
   - chqok: the employer asked to move the date of a cheque it gave us: the company answers ยินยอม, ยินยอมโดยมีเงื่อนไข
     (new cheque in exchange for the old one, interest for the days moved, once only, the right to stop work and to more time)
     or ไม่ยินยอม. The claims the cheque pays are ticked as in the other money letters.
   - chqreq: the company asks a supplier (ผู้ขาย, from the PO) or a subcontractor (ผู้รับเหมาช่วง) to move the date of a cheque
     the company gave them, with a ready reason (รอรับเงินค่างวดจากผู้ว่าจ้าง, บริหารกระแสเงินสด, or typed), and may offer a new
     cheque in exchange. The receiver's block has ☐ ยินยอม ☐ ไม่ยินยอม for the reply.
   Prints with the same letterhead, layout, signer and form codes (LG-10, LG-11) as the other letters. */
SWK.push(['chqok','ตอบรับลูกค้าขอเลื่อนเช็ค','หนังสือตอบรับการขอเลื่อนวันที่เช็ค'],['chqreq','ขอเลื่อนเช็คที่บริษัทจ่าย','หนังสือขอเลื่อนวันที่สั่งจ่ายเช็ค']);
SWNOWHY.push('chqok','chqreq');
const SWCQ=['chqok','chqreq'],swCq=s=>SWCQ.includes(s.kind);
const SWCQR={cust:{l:'รอรับเงินค่างวดจากผู้ว่าจ้าง',t:'บริษัทยังไม่ได้รับชำระเงินค่างวดจากผู้ว่าจ้างของโครงการตามกำหนด ทำให้เงินที่เตรียมไว้สำหรับเช็คฉบับดังกล่าวยังไม่เพียงพอ'},
  cash:{l:'บริหารกระแสเงินสด',t:'บริษัทมีความจำเป็นต้องบริหารกระแสเงินสดให้สอดคล้องกับกำหนดการรับเงินค่างานของโครงการ'},
  bank:{l:'รอวงเงินสินเชื่อจากธนาคาร',t:'บริษัทอยู่ระหว่างรอการอนุมัติวงเงินสินเชื่อจากธนาคาร'},other:{l:'เหตุอื่น (เขียนเอง)',t:''}};
// the cheque in words: ธนาคาร… เลขที่ … ลงวันที่ … จำนวนเงิน … บาท
const swCqW=s=>[s.chqBank?`ธนาคาร${esc(s.chqBank)}`:'',s.chqNo?`เลขที่ ${esc(s.chqNo)}`:'',okD(s.chqDate)?`ลงวันที่ ${thDL(s.chqDate)}`:'',n(s.chqAmt)?`จำนวนเงิน ${fmt(s.chqAmt,2)} บาท (${bahtText(n(s.chqAmt))})`:''].filter(Boolean).join(' ');
const swCqDays=s=>okD(s.chqDate)&&okD(s.chqNew)?Math.max(0,diffD(s.chqDate,s.chqNew)):0;
const swCqInt=s=>Math.round(n(s.chqAmt)*n(s.rate)/100*swCqDays(s)/365*100)/100;
// the payee of a chqreq letter: a PO's vendor or a subcontractor
const swCqPay=s=>s.pt==='s'?P.subs.find(x=>x.id===s.pid):P.vendors.find(x=>x.id===s.pid);
{const f=swNew;swNew=function(kind,from){if(!SWCQ.includes(kind))return f.apply(this,arguments);
  const s=f('remind');Object.assign(s,{kind,why:'',bills:[],link:'',chqBank:'',chqNo:'',chqDate:'',chqNew:'',chqAmt:'',nd:7});
  if(from&&from.why==='chq')['chqBank','chqNo','chqDate','chqNew','chqAmt'].forEach(k=>{if(from[k])s[k]=from[k]});
  if(kind==='chqok'){Object.assign(s,{ans:'cond',rep:true,int:false,rate:5,once:true,eot:false,reqNo:'',reqDate:'',bills:from?(from.bills||[]).slice():swDefBills()});
    s.att='สำเนาหนังสือขอเลื่อนวันที่เช็คของผู้ว่าจ้าง'}
  else{const po=P.pos.slice(-1)[0];Object.assign(s,{pt:po?'v':'s',pid:po?po.vid:(P.subs[0]||{}).id||'',po:po?po.id:'',rs:'cust',rep:true,cc:''});s.to=(swCqPay(s)||{}).name||'';
    if(po&&!n(s.chqAmt))s.chqAmt=Math.round(poTotal(po).t*100)/100;s.att=''}
  return s}}
// the payee's choices: their POs or their payments
const swCqRefs=s=>s.pt==='s'?(P.spay||[]).filter(x=>x.sub===s.pid).map(x=>[x.id,`${thD(x.date)} ${x.desc||'งวดงาน'} ${fmt(x.amt,2)}`]):P.pos.filter(x=>x.vid===s.pid).map(x=>[x.id,`${x.no} ${thD(x.date)} ${fmt(poTotal(x).t,2)}`]);
HOOK.push((p,v)=>{const m=String(p).match(/^stops\.([^.]+)\.(pt|pid|po)$/);if(!m)return;const s=swArr().find(x=>x.id===m[1]);if(!s||s.kind!=='chqreq')return;
  if(m[2]==='pt'){s.pid='';s.po=''}
  if(m[2]==='pid'){s.to=(swCqPay(s)||{}).name||s.to;const r=swCqRefs(s);s.po=r.length===1?r[0][0]:''}
  if(s.po&&s.pt!=='s'&&m[2]!=='pt'){const po=P.pos.find(x=>x.id===s.po);if(po)s.chqAmt=Math.round(poTotal(po).t*100)/100}
  if(s.po&&s.pt==='s'&&m[2]!=='pt'){const y=(P.spay||[]).find(x=>x.id===s.po);if(y)s.chqAmt=n(y.amt)}});
HOOK.push((p,v)=>{const m=String(p).match(/^stops\.([^.]+)\.kind$/);if(!m||!SWCQ.includes(v))return;const s=swArr().find(x=>x.id===m[1]);if(!s)return;
  const d=swNew(v);swArr().pop();Object.keys(d).forEach(k=>{if(!['id','no','date','kind','chqBank','chqNo','chqDate','chqNew','chqAmt'].includes(k)&&s[k]==null)s[k]=d[k]});
  s.why='';if(v==='chqreq'){s.to=d.to;s.cc='';s.att=''}});

/* --- the page: a เช็ค group of buttons, and its own card --- */
{const f=swPage;swPage=function(){return f.apply(this,arguments).replace(/(data-k="term">[^<]*<\/button>)/,
  `$1<span class="muted">เช็ค</span><button type="button" class="btn sm" data-a="swAdd" data-k="chqok">+ ${swK('chqok')[1]}</button><button type="button" class="btn sm" data-a="swAdd" data-k="chqreq">+ ${swK('chqreq')[1]}</button>`)}}
{const f=swCard;swCard=function(s){if(!swCq(s))return f.apply(this,arguments);const b=`stops.${s.id}`,k=s.kind,t=swK(k)[2];
  const inp=(f_,l,a='',cl='')=>`<label${cl?` class="${cl}"`:''}>${l}<input data-p="${b}.${f_}" value="${esc(s[f_]??'')}"${a}></label>`,dt=(f_,l)=>`<label>${l}<input type="date" data-p="${b}.${f_}" value="${esc(s[f_]||'')}"></label>`,
    num=(f_,l)=>`<label>${l}<input data-p="${b}.${f_}" data-t="num" inputmode="decimal" value="${esc(s[f_]??'')}"></label>`,
    ck=(f_,l)=>`<label class="chk w2"><input type="checkbox" data-p="${b}.${f_}" data-t="chk"${s[f_]?' checked':''}> ${l}</label>`,
    sel=(f_,l,O,cl='')=>`<label${cl?` class="${cl}"`:''}>${l}<select data-p="${b}.${f_}">${O.map(([v,x])=>`<option value="${esc(v)}"${String(s[f_]??'')===String(v)?' selected':''}>${esc(x)}</option>`).join('')}</select></label>`;
  const days=swCqDays(s);let mid='',extra='',info='';
  if(k==='chqok'){mid=inp('reqNo','หนังสือขอเลื่อนของลูกค้า เลขที่ (ถ้ามี)')+dt('reqDate','ลงวันที่')+
      sel('ans','คำตอบ',[['ok','ยินยอม'],['cond','ยินยอมโดยมีเงื่อนไข'],['no','ไม่ยินยอม']],'w2');
    if(s.ans==='cond')mid+=ck('rep','ขอเช็คฉบับใหม่ลงวันที่ใหม่ แลกกับเช็คฉบับเดิม')+ck('int',`คิดดอกเบี้ยสำหรับวันที่เลื่อน${s.int&&days?` (${days} วัน = ${fmt(swCqInt(s),2)} บาท)`:''}`)+(s.int?num('rate','ดอกเบี้ย (% ต่อปี)'):'')+
      ck('once','ยินยอมครั้งนี้ครั้งเดียว ถ้าเช็คไม่ผ่านอีก บริษัทอาจหยุดงานตามสัญญา')+ck('eot','สงวนสิทธิ์ขอขยายระยะเวลาก่อสร้าง ถ้าการเลื่อนกระทบงาน');
    if(s.ans==='no')mid+=num('nd','ขอให้ชำระภายใน (วัน หลังได้รับหนังสือ)');
    extra=swBillPick(s).replace('งวดที่ค้างชำระ (ติ๊กใบที่จะใส่ในหนังสือ','ค่างวดที่เช็คฉบับนี้จ่าย (ติ๊กใบที่จะใส่ในหนังสือ')}
  else{const pay=swCqPay(s),R=swCqRefs(s);
    mid=sel('pt','จ่ายให้',[['v','ผู้ขาย (ใบสั่งซื้อ)'],['s','ผู้รับเหมาช่วง']])+
      sel('pid',s.pt==='s'?'ผู้รับเหมาช่วง':'ผู้ขาย',[['','– เลือก –'],...(s.pt==='s'?P.subs:P.vendors).map(x=>[x.id,x.name||'(ไม่มีชื่อ)'])],'w2')+
      sel('po',s.pt==='s'?'งวดจ่ายผู้รับเหมาช่วง':'ใบสั่งซื้อ',[['','– ไม่ระบุ –'],...R],'w2')+
      sel('rs','เหตุที่ขอเลื่อน',Object.entries(SWCQR).map(([v,x])=>[v,x.l]),'w2')+ck('rep','เสนอออกเช็คฉบับใหม่ลงวันที่ใหม่ แลกกับเช็คฉบับเดิม');
    info=pay?'':`<div class="sw-info">${(s.pt==='s'?P.subs:P.vendors).length?'เลือกผู้รับเช็คจากรายชื่อ หรือพิมพ์ชื่อที่ช่อง เรียน':`ยังไม่มี${s.pt==='s'?'ผู้รับเหมาช่วง (เพิ่มที่ ต้นทุน › ผู้รับเหมาช่วง)':'ผู้ขาย (เพิ่มที่ จัดซื้อ › ผู้ขาย)'} พิมพ์ชื่อที่ช่อง เรียน ได้เลย`}</div>`}
  return `<section class="card" id="swCard"><h2><span>${esc(s.no)} · ${t}</span>${days?`<small>เลื่อน ${days} วัน</small>`:''}<span class="sp"></span>
    <button type="button" class="btn sm pri" data-a="print" data-k="swl" data-id="${s.id}">พิมพ์หนังสือ</button></h2>
  ${info}
  <div class="form">${inp('no','เลขที่')}${dt('date','ลงวันที่')}
    <label>ประเภท<select data-p="${b}.kind">${SWK.map(([kk,l])=>`<option value="${kk}"${kk===k?' selected':''}>${l}</option>`).join('')}</select></label>
    ${mid}
    ${inp('chqBank','ธนาคาร',' placeholder="เช่น กสิกรไทย สาขาสระบุรี"')}${inp('chqNo','เลขที่เช็ค')}${dt('chqDate','ลงวันที่ในเช็ค (เดิม)')}${dt('chqNew',k==='chqok'?'ลูกค้าขอเลื่อนเป็นวันที่':'ขอเลื่อนเป็นวันที่')}${num('chqAmt','จำนวนเงินในเช็ค (บาท)')}
    ${inp('to','เรียน','','w2')}${inp('cc','สำเนาเรียน','','w2')}
    <label class="full">${k==='chqreq'&&s.rs==='other'?'เหตุที่ขอเลื่อน (เขียนเอง)':'รายละเอียดเพิ่มเติม'}<textarea data-p="${b}.detail" rows="3" placeholder="ถ้ามี">${esc(s.detail||'')}</textarea></label>
    <label class="full">สิ่งที่ส่งมาด้วย (บรรทัดละรายการ)<textarea data-p="${b}.att" rows="2">${esc(s.att||'')}</textarea></label></div>
  ${extra}
  <p class="hint">${k==='chqok'?'ใช้ตอบเมื่อผู้ว่าจ้างขอเลื่อนวันที่เช็คที่จ่ายให้บริษัท · ถ้าเช็คถูกธนาคารคืน (เช็คเด้ง) ให้ใช้ ทวงถามค่างวด / แจ้งเตือนก่อนหยุดงาน เหตุ เลื่อนเช็ค / เช็คเด้ง แทน · ยังไม่ได้แลกเช็คใหม่ อย่าคืนเช็คเดิม'
    :'ส่งก่อนวันที่ในเช็คเดิม ให้ผู้รับมีเวลาตอบ · ด้านล่างหนังสือมีช่อง ยินยอม / ไม่ยินยอม ให้ผู้รับลงชื่อตอบกลับ · ถ้าตกลงแลกเช็คใหม่ ให้รับเช็คเดิมคืนก่อนหรือพร้อมกัน'} · ถ้อยคำเป็นแบบทั่วไป ตรวจกับข้อตกลงจริงก่อนส่ง</p></section>`}}

/* --- the letters --- */
{const f=swLetter;swLetter=function(s){if(!swCq(s))return f.apply(this,arguments);const I=P.info,CO_=CO(),[sn,sr]=subSigner(),k=s.kind,t=swK(k)[2],at=s.date||today();
  const nm=String(P.name||'').trim(),cut=nm.indexOf(' - '),pjN=cut>0?nm.slice(0,cut).trim():'',job=cut>0?nm.slice(cut+3).trim():nm,what=pjN?`${esc(job)} โครงการ ${esc(pjN)}`:esc(nm);
  const row=(a,v)=>`<div class="lt-r"><b>${a}</b><div>${v}</div></div>`,p=x=>x?`<p class="lt-p">${x}</p>`:'',co=esc(CO_.name||'บริษัท');
  const dtl=s.detail&&s.detail.trim()?esc(s.detail.trim()).replace(/\n/g,' '):'',chq=swCqW(s),nw=okD(s.chqNew)?thDL(s.chqNew):'..........',days=swCqDays(s);
  const att=String(s.att||'').split('\n').map(x=>x.trim()).filter(Boolean),refs=[];let party,subj,body,rcv;
  if(k==='chqok'){party=esc(s.to||swParty());const B=swBills(s),btx=swBillTxt(B,at).replace(/ รวมเป็นเงินค้างชำระทั้งสิ้น [^)]*\)$/,'').replace(/ \(เกินกำหนด \d+ วัน\)/g,''),iv=s.int?swCqInt(s):0;
    if(s.reqNo||okD(s.reqDate))refs.push(`หนังสือของ${party}${s.reqNo?` เลขที่ ${esc(s.reqNo)}`:''}${okD(s.reqDate)?` ลงวันที่ ${thDL(s.reqDate)}`:''}`);
    if(I.contractNo)refs.push(`สัญญาจ้างเลขที่ ${esc(I.contractNo)}${okD(I.signed)?` ลงวันที่ ${thDL(I.signed)}`:''}`);
    subj=`${s.ans==='no'?'แจ้งผลการพิจารณา':'ตอบรับ'}การขอเลื่อนวันที่เช็คค่างวด ${what}`;
    const C=[];if(s.ans==='cond'){
      if(s.rep)C.push(`${party}ออกเช็คฉบับใหม่ลงวันที่ ${nw} จำนวนเงินเท่าเดิม มาแลกกับเช็คฉบับเดิม ภายใน 7 วัน นับแต่วันที่ได้รับหนังสือฉบับนี้ โดยบริษัทจะคืนเช็คฉบับเดิมเมื่อได้รับเช็คฉบับใหม่แล้ว`);
      if(iv)C.push(`${party}ชำระดอกเบี้ยสำหรับระยะเวลาที่เลื่อน ${days} วัน ในอัตราร้อยละ ${fmtq(n(s.rate))} ต่อปี คิดเป็นเงิน ${fmt(iv,2)} บาท (${bahtText(iv)})`);
      if(s.once)C.push('การยินยอมครั้งนี้เป็นการยินยอมเพียงครั้งเดียว หากเช็คฉบับใหม่ไม่สามารถเรียกเก็บเงินได้ตามวันที่ดังกล่าว บริษัทขอสงวนสิทธิ์หยุดงานและดำเนินการตามสัญญาและตามกฎหมายต่อไป โดยไม่ต้องแจ้งเตือนอีก');
      if(s.eot)C.push('หากการเลื่อนการชำระเงินครั้งนี้ส่งผลกระทบต่อการดำเนินงาน บริษัทขอสงวนสิทธิ์ขอขยายระยะเวลาก่อสร้างตามความเป็นจริง')}
    const intro=`ตามที่ ${co} ได้รับจ้าง${pjN?'':'งาน'} ${what}${I.site?` ณ ${esc(I.site)}`:''} จาก ${party}${I.contractNo?' ตามสัญญาที่อ้างถึง':''} และ${party}ได้จ่ายเช็คค่างวด${chq?` ${chq}`:''} ให้แก่บริษัท${btx?` เพื่อชำระค่างาน ${btx}`:''} นั้น`;
    body=p(intro)+(B.length>1?swBillTb(B,at).replace('รวมค้างชำระ','รวม'):'')+
      p(`${party}${refs.length&&(s.reqNo||okD(s.reqDate))?'ได้มีหนังสือที่อ้างถึง':'ได้แจ้ง'}ขอเลื่อนวันที่ของเช็คฉบับดังกล่าว${okD(s.chqDate)?` จากวันที่ ${thDL(s.chqDate)}`:''} ออกไปเป็นวันที่ ${nw}${days?` (${days} วัน)`:''}${dtl?` ${dtl}`:''} นั้น`)+
      (s.ans==='no'?p(`บริษัทได้พิจารณาแล้ว ขอเรียนว่าบริษัทไม่สามารถยินยอมให้เลื่อนวันที่เช็คได้ เนื่องจากบริษัทได้วางแผนใช้เงินดังกล่าวเป็นค่าวัสดุ ค่าแรงงาน และค่าใช้จ่ายของโครงการตามกำหนดแล้ว บริษัทจึงขอให้${party}ดำเนินการให้เช็คฉบับดังกล่าวเรียกเก็บเงินได้ตามวันที่เดิม${n(s.nd)?` หรือชำระเป็นเงินสดหรือโอนเข้าบัญชีของบริษัทภายใน ${n(s.nd)} วัน นับแต่วันที่ได้รับหนังสือฉบับนี้`:''} หากไม่ได้รับชำระเงิน บริษัทมีความจำเป็นต้องดำเนินการตามสัญญา รวมถึงการหยุดงานจนกว่าจะได้รับชำระเงิน`)
        :p(`บริษัทได้พิจารณาแล้ว เพื่อรักษาความสัมพันธ์อันดีและให้การดำเนินงานเป็นไปอย่างต่อเนื่อง บริษัท${s.ans==='cond'&&C.length?'ยินยอมให้เลื่อนวันที่เช็คเป็นวันที่ '+nw+' โดยมีเงื่อนไข ดังนี้':'ยินยอมให้เลื่อนวันที่เช็คเป็นวันที่ '+nw+' ตามที่ขอ'}`)+
          (s.ans==='cond'&&C.length?`<ol class="sw-ol">${C.map(x=>`<li>${x}</li>`).join('')}</ol>`:'')+
          p('ทั้งนี้ การยินยอมดังกล่าวไม่เป็นการสละสิทธิ์ใด ๆ ของบริษัทตามสัญญา และเงื่อนไขอื่นของสัญญายังคงมีผลบังคับตามเดิมทุกประการ'))+
      p(s.ans==='no'?'จึงเรียนมาเพื่อโปรดพิจารณาดำเนินการ':'จึงเรียนมาเพื่อโปรดทราบและดำเนินการ และขอขอบคุณมา ณ โอกาสนี้');
    rcv=`<div class="sw-rcv"><b>สำหรับผู้รับหนังสือ</b> ได้รับหนังสือฉบับนี้แล้ว &nbsp; ลงชื่อ ................................................ &nbsp; วันที่ ........./........./......... &nbsp; เวลา ...........</div>`}
  else{const pay=swCqPay(s)||{},R=SWCQR[s.rs]||SWCQR.other,po=s.pt!=='s'&&P.pos.find(x=>x.id===s.po),sp=s.pt==='s'&&(P.spay||[]).find(x=>x.id===s.po);party=esc(s.to||pay.name||'ผู้รับเช็ค');
    if(po)refs.push(`ใบสั่งซื้อเลขที่ ${esc(po.no)}${okD(po.date)?` ลงวันที่ ${thDL(po.date)}`:''}`);
    subj=`ขอเลื่อนวันที่สั่งจ่ายเช็ค${po?` ตามใบสั่งซื้อเลขที่ ${esc(po.no)}`:''}`;
    const why=s.rs==='other'?dtl:`${R.t}${dtl?` ${dtl}`:''}`;
    const what2=s.pt==='s'?`ได้ว่าจ้าง ${party} ทำงาน${pay.scope?esc(pay.scope)+' สำหรับ':''}${what}${sp?` และได้สั่งจ่ายเช็คค่างวดงาน${sp.desc?` “${esc(sp.desc)}”`:''}`:' และได้สั่งจ่ายเช็คค่างวดงาน'}`
      :`ได้สั่งซื้อสินค้าจาก ${party}${po?' ตามใบสั่งซื้อที่อ้างถึง':''} สำหรับ${what} และได้สั่งจ่ายเช็คค่าสินค้า`;
    body=p(`ตามที่ ${co} ${what2}${chq?` ${chq}`:''} ให้แก่ ${party} นั้น`)+
      p(`เนื่องจาก${why||'บริษัทมีความจำเป็นบางประการ'} บริษัทจึงขอความอนุเคราะห์เลื่อนวันที่สั่งจ่ายเช็คฉบับดังกล่าว${okD(s.chqDate)?` จากวันที่ ${thDL(s.chqDate)}`:''} เป็นวันที่ ${nw}${days?` (${days} วัน)`:''} ${s.rep?`โดยบริษัทจะออกเช็คฉบับใหม่ลงวันที่ ${nw} จำนวนเงินเท่าเดิม มาแลกกับเช็คฉบับเดิม`:`และขอความกรุณาอย่าเพิ่งนำเช็คฉบับดังกล่าวเข้าบัญชีจนถึงวันที่ ${nw}`}`)+
      p(`บริษัทขอยืนยันว่าจะชำระเงินตามจำนวนดังกล่าวครบถ้วนภายในวันที่ขอเลื่อน และขอขอบคุณที่ ${party} ให้ความร่วมมือกับบริษัทด้วยดีเสมอมา หวังเป็นอย่างยิ่งว่าจะได้รับความอนุเคราะห์ โปรดลงนามตอบรับท้ายหนังสือฉบับนี้และส่งคืนบริษัท`)+
      p('จึงเรียนมาเพื่อโปรดพิจารณา และขอขอบพระคุณมา ณ โอกาสนี้');
    rcv=`<div class="sw-rcv sw-rcv2"><b>ตอบรับ (${party})</b> &nbsp; ☐ ยินยอมให้เลื่อนวันที่เช็คเป็นวันที่ ${nw} &nbsp; ☐ ไม่ยินยอม<br>ลงชื่อ ................................................ ผู้มีอำนาจ &nbsp; วันที่ ........./........./.........</div>`}
  return phead(`${t} ${s.no}`,`วันที่ ${thDL(at)}`)+`<div class="let lt2 sw">
  <div class="lt-top"><span>ที่ ${esc(s.no)}</span></div><div class="lt-date">${thDL(at)}</div>
  ${row('เรื่อง',subj)}${row('เรียน',party)}
  ${refs.length?row('อ้างถึง',refs.length>1?`<ol>${refs.map(x=>`<li>${x}</li>`).join('')}</ol>`:refs[0]):''}
  ${att.length?row('สิ่งที่ส่งมาด้วย',att.length>1?`<ol>${att.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:esc(att[0])):''}
  ${body}
  <div class="lt-sign"><div>ขอแสดงความนับถือ</div><div class="lt-ln"></div><div>(${esc(sn||'.................................................')})</div><div>${esc(sr)}</div><div>${esc(CO_.name||'')}</div></div>
  ${s.cc&&s.cc.trim()?`<div class="sw-cc">สำเนาเรียน ${esc(s.cc.trim())}</div>`:''}
  ${I.pm?`<div class="lt-ct">ผู้ประสานงาน: ${esc(I.pm)}${CO_.phone?` โทร ${esc(CO_.phone)}`:''}${CO_.email?` · ${esc(CO_.email)}`:''}</div>`:''}
  ${rcv}</div>`}}
document.head.insertAdjacentHTML('beforeend',`<style>
#print .sw .sw-ol{margin:4px 0 8px 2.2em;padding:0;line-height:1.75}#print .sw .sw-ol li{margin:2px 0;text-align:left}
#print .sw .sw-rcv2{line-height:2}
.pill.sw-chqok{background:#E6F4EA;color:#256b3c}.pill.sw-chqreq{background:#EEE8F8;color:#4b3a85}
</style>`);
{const i=FM_LIST.findIndex(e=>e[0]==='swterm')+1;FM_LIST.splice(i,0,
  ['swchqok','LG',10,'หนังสือตอบรับการขอเลื่อนวันที่เช็ค',/^หนังสือตอบรับการขอเลื่อนวันที่เช็ค/],
  ['swchqreq','LG',11,'หนังสือขอเลื่อนวันที่สั่งจ่ายเช็ค',/^หนังสือขอเลื่อนวันที่สั่งจ่ายเช็ค/])}
DOC_EN.unshift([/ตอบรับการขอเลื่อนวันที่เช็ค/,'REPLY TO CHEQUE POSTPONEMENT REQUEST'],[/ขอเลื่อนวันที่สั่งจ่ายเช็ค/,'REQUEST TO POSTPONE CHEQUE DATE']);
if(typeof SBKW==='object')SBKW['pj.forms.stop']=(SBKW['pj.forms.stop']||'')+' ขอเลื่อนเช็ค ตอบรับเลื่อนเช็ค เปลี่ยนเช็ค แลกเช็ค เช็คลูกค้า เช็คผู้ขาย เช็คผู้รับเหมาช่วง cheque postpone';
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ตอบรับลูกค้าขอเลื่อนเช็ค':'Reply to cheque postponement','ขอเลื่อนเช็คที่บริษัทจ่าย':'Ask to postpone our cheque','เช็ค':'Cheques'});
