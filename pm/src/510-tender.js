/* ---------- 3.7: tender pricing ----------
   A bid starts from the BOQ (PENUM MEP, a project or a quotation), adds the site costs (preliminaries) and
   prices it two ways: government work with Factor F and the ปร.4 / ปร.5 forms, or private work with a mark-up
   and VAT on top. Factor F is built from overhead, profit, financing and VAT so the estimator can see each part;
   the overhead and profit table is assumed and editable, and an official F can be typed over it.
   A second page works out the price adjustment (ค่า K) for each billing of a project. */
COTABS.splice(COTABS.findIndex(t=>t[0]==='sales')+1,0,['tender','ประมูลและทำราคา']);
NAVD.find(d=>d[0]==='est')[2].splice(1,0,['co','tender','bid','ทำราคาประมูล'],['co','tender','k','ค่า K (ปรับราคา)'],['co','tender','tf','ตาราง Factor F']);
NAVD.find(d=>d[0]==='sales')[2].push(['co','tender','bid','งานประมูล']);
['SAL','EST','ACC'].forEach(k=>ACCESS[k].co.push('tender'));
DOC_EN.push([/แบบแสดงรายการ ปริมาณงาน/,'BILL OF QUANTITIES (FORM POR.4)'],[/แบบสรุปค่าก่อสร้าง/,'COST SUMMARY (FORM POR.5)'],[/สรุปการทำราคาประมูล/,'BID PRICING SUMMARY'],[/การคำนวณค่า K/,'PRICE ADJUSTMENT (K) CALCULATION']);
ICO.tender=ICO.est;
const TDS=[['draft','กำลังทำราคา'],['sent','ยื่นซองแล้ว'],['won','ได้งาน'],['lost','ไม่ได้งาน'],['drop','ไม่ยื่น']];
// overhead and profit by direct cost (million baht); in between, the values are interpolated like the official table
const TF0=[[1,12,8],[5,10.5,7],[10,9.5,6.5],[20,8.5,6],[50,7.5,5.5],[100,6.5,5],[200,6,4.5],[500,5.5,4]];
function tdCfg(){const C=CO();C.tenders=C.tenders||[];C.kidx=C.kidx||[];if(!C.tf)C.tf=TF0.map(([m,oh,pr])=>({id:uid(),m,oh,pr}));return C}
NEW.tenders=arr=>({no:nextNo('TD-',arr),date:today(),title:'',owner:'',cust:'',site:'',drw:'',mode:'gov',open:addD(today(),14),budget:0,items:[],pre:[],
  months:6,mAdj:0,lAdj:0,adv:0,ret:0,int:7,fm:3,oh:'',pr:'',risk:0,vat:7,Fo:'',round:1000,disc:0,status:'draft',winner:'',winPrice:0,by:'',note:'',src:''});
NEW.pre=()=>({desc:'',unit:'งาน',q:1,rate:0});
NEW.tf=()=>({m:0,oh:0,pr:0});
NEW.kidx=arr=>{const L=arr.map(x=>x.m).filter(Boolean).sort(),m=L.length?ymAdd(L[L.length-1],1):today().slice(0,7);return {m,I:0,C:0,M:0,S:0,E:0,F:0}};
const ymAdd=(m,k)=>{const d=pd(m+'-01');d.setMonth(d.getMonth()+k);return iso(d).slice(0,7)};
const thYM=m=>/^\d{4}-\d{2}$/.test(m||'')?pd(m+'-01').toLocaleDateString('th-TH',{month:'short',year:'2-digit'}):'–';
const curTd=()=>{const C=tdCfg();return C.tenders.find(t=>t.id===S.sel.td)||C.tenders[C.tenders.length-1]};

// --- the money ---
function tfAt(D){const T=tdCfg().tf.slice().filter(r=>n(r.m)>0).sort((a,b)=>n(a.m)-n(b.m));if(!T.length)return {oh:10,pr:6};const m=D/1e6;
  if(m<=n(T[0].m))return {oh:n(T[0].oh),pr:n(T[0].pr)};const L=T[T.length-1];if(m>=n(L.m))return {oh:n(L.oh),pr:n(L.pr)};
  for(let i=1;i<T.length;i++)if(m<=n(T[i].m)){const a=T[i-1],b=T[i],k=(m-n(a.m))/(n(b.m)-n(a.m));return {oh:n(a.oh)+k*(n(b.oh)-n(a.oh)),pr:n(a.pr)+k*(n(b.pr)-n(a.pr))}}}
const tdM=(t,i)=>n(i.m)*(1+n(t.mAdj)/100),tdL=(t,i)=>n(i.l)*(1+n(t.lAdj)/100);
function tdCalc(t){const dm=sum(t.items,i=>n(i.q)*tdM(t,i)),dl=sum(t.items,i=>n(i.q)*tdL(t,i)),dp=sum(t.pre||[],x=>n(x.q)*n(x.rate)),D=dm+dl+dp;
  const T=tfAt(D),oh=t.oh===''||t.oh==null?T.oh:n(t.oh),pr=t.pr===''||t.pr==null?T.pr:n(t.pr);
  // money tied up: a few months of work before the first payment (less any advance), plus the retention held for half the job
  const fin=n(t.int)*n(t.fm)/12*Math.max(0,1-n(t.adv)/100)+n(t.int)*n(t.ret)/100*n(t.months)/2/12;
  const k=1+(oh+pr+fin+n(t.risk))/100,vat=n(t.vat)/100,gov=t.mode!=='pvt',Fc=k*(gov?1+vat:1),F=gov&&n(t.Fo)>0?n(t.Fo):Fc;
  const raw=D*F,rd=Math.max(1,n(t.round)),bid=Math.max(0,Math.floor(raw/rd)*rd-n(t.disc));
  const net=gov?bid/(1+vat):bid,vt=gov?bid-net:bid*vat,gross=gov?bid:bid+vt;
  const mk=D?net/D:1,margin=net-D,profitLeft=net-D*(1+(oh+fin+n(t.risk))/100);
  const bud=n(t.budget),diff=bud?(gross-bud)/bud*100:null;
  return {dm,dl,dp,D,oh,pr,fin,risk:n(t.risk),k,F,Fc,raw,bid,net,vat:vt,gross,mk,margin,profitLeft,bud,diff,auto:T}}
// price of one item as it goes into ปร.4 (cost) or into a quotation (cost × the job's mark-up)
const tdGroups=t=>{const G=[];t.items.forEach(i=>{let g=G.find(x=>x.g===i.g);if(!g)G.push(g={g:i.g,name:gName(i.g),items:[]});g.items.push(i)});if((t.pre||[]).length)G.push({g:'pre',name:'ค่าใช้จ่ายหน้างานและค่าใช้จ่ายพิเศษตามข้อกำหนด',pre:t.pre});return G};
const tdGCost=(t,g)=>g.pre?sum(g.pre,x=>n(x.q)*n(x.rate)):sum(g.items,i=>n(i.q)*(tdM(t,i)+tdL(t,i)));

// --- filling the BOQ ---
function tdFill(t,items,src){t.items=items.map(i=>({id:uid(),g:i.g||'',head:i.head||'',type:i.type||'',desc:i.desc||'',unit:i.unit||'',q:n(i.q),m:n(i.m),l:n(i.l)}));
  // a BOQ line with only a total: put it all in material so the job total stays right
  t.items.forEach((i,k)=>{if(!i.m&&!i.l&&n(items[k].t)&&i.q)i.m=n(items[k].t)/i.q});t.src=src}
const tdById=id=>tdCfg().tenders.find(x=>x.id===id);
ACT.tdMep=b=>{const t=tdById(b.dataset.id),L=mepLink();if(!t||!L)return;if(t.items.length&&!confirm('แทนที่รายการเดิม?'))return;
  tdFill(t,L.boq.items.map(i=>({g:i.g,head:i.head,type:i.type,desc:i.desc,unit:i.unit,q:i.q,m:i.m,l:i.l,t:i.total})),'PENUM MEP · '+(L.project||''));if(!t.title)t.title=L.project||'';save();render();toast(`ดึง ${t.items.length} รายการแล้ว`)};
ACT.tdQt=b=>{const t=tdById(b.dataset.id),q=CO().quotes.find(x=>x.id===$('#tdQ').value);if(!t||!q||!q.items.length){toast('ใบเสนอราคานี้ยังไม่มีรายการ');return}if(t.items.length&&!confirm('แทนที่รายการเดิม?'))return;
  tdFill(t,q.items,'ใบเสนอราคา '+q.no);if(!t.title)t.title=q.title;if(!t.cust)t.cust=q.cust;save();render();toast(`ดึง ${t.items.length} รายการแล้ว`)};
ACT.tdPaste=b=>{dialog('วาง BOQ จาก PENUM MEP',`<ol class="steps"><li>เปิด PENUM MEP ไปที่หน้า BOQ</li><li>กดปุ่ม <b>คัดลอก BOQ (วางใน Excel)</b></li><li>คลิกในช่องด้านล่าง แล้วกด Ctrl+V</li></ol><textarea id="boqTxt" rows="8"></textarea>`,`<button type="button" class="btn pri" data-a="tdPasteGo" data-id="${b.dataset.id}">นำเข้า</button>`)};
ACT.tdPasteGo=b=>{const t=tdById(b.dataset.id),r=parseBoqTSV($('#boqTxt').value);if(!t||!r.items.length){toast('ไม่พบรายการ BOQ');return}tdFill(t,r.items,'วางจาก PENUM MEP');$('#dlg').close();save();render()};
ACT.tdLine=b=>{const t=tdById(b.dataset.id);if(!t)return;t.items.push({id:uid(),g:b.dataset.g||'oth',head:'',type:'',desc:'',unit:'',q:1,m:0,l:0});save();render()};
ACT.tdDel=b=>{const t=tdById(b.dataset.id);if(!t)return;t.items=t.items.filter(i=>i.id!==b.dataset.i);save();render()};
// site costs worked out from the job's length and size (assumed rates; change them to the company's own)
ACT.tdPre=b=>{const t=tdById(b.dataset.id);if(!t)return;const mo=Math.max(1,n(t.months)),c=tdCalc(t),D0=c.dm+c.dl;
  if((t.pre||[]).length&&!confirm('แทนที่ค่าใช้จ่ายหน้างานเดิม?'))return;
  const lgFee=Math.round(D0*1.25*.05*n(CO().lgFee??1.75)/100*(mo+12)/12);
  t.pre=[['วิศวกรโครงการ','เดือน',mo,45000],['โฟร์แมนคุมงาน','เดือน',mo,28000],['เจ้าหน้าที่ความปลอดภัย (จป.)','เดือน',Math.ceil(mo/2),22000],
    ['สำนักงานสนามและที่เก็บของ','เดือน',mo,9000],['ค่าน้ำ ค่าไฟชั่วคราว ค่าโทรศัพท์','เดือน',mo,6000],['นั่งร้าน เครื่องมือ และรถขนส่ง','เดือน',mo,12000],
    ['ประกันภัยงานก่อสร้าง (CAR) 0.15%','งาน',1,Math.round(D0*.0015)],['ทดสอบและปรับแต่งระบบ (T&C) 1%','งาน',1,Math.round(D0*.01)],
    ['แบบก่อสร้างจริง (As-built) คู่มือ และอบรม','งาน',1,35000],['ค่าธรรมเนียมหนังสือค้ำประกันสัญญาและผลงาน','งาน',1,lgFee]].map(([desc,unit,q,rate])=>({id:uid(),desc,unit,q,rate}));
  save();render();if(!b.quiet)toast('ใส่ค่าใช้จ่ายหน้างานตามระยะเวลางานแล้ว (ราคาสมมติ ปรับได้)')};
// hand the bid on: a quotation priced at the bid, a bid bond, and the lead in the sales pipeline
ACT.tdQuote=b=>{const t=tdById(b.dataset.id);if(!t||!t.items.length){toast('ยังไม่มีรายการ');return}const C=CO(),c=tdCalc(t);
  if(t.quote&&C.quotes.find(q=>q.id===t.quote)){S.ctab='sales';S.sub.sales='quote';S.sel.quote=t.quote;render();return}
  const q=Object.assign({id:uid()},NEW.quotes(C.quotes),{cust:t.cust||'',title:t.title,site:t.site||'',by:t.by||'',src:'ราคาประมูล '+t.no});
  // site costs are spread over the items so the quotation total matches the bid
  const spread=c.dm+c.dl?c.D/(c.dm+c.dl):1;
  q.items=t.items.map(i=>({id:uid(),g:i.g,head:i.head,type:i.type,desc:i.desc,unit:i.unit,q:n(i.q),m:tdM(t,i),l:tdL(t,i),t:n(i.q)*(tdM(t,i)+tdL(t,i)),sp:Math.round((tdM(t,i)+tdL(t,i))*spread*c.mk*100)/100}));
  const sub=sum(q.items,i=>n(i.q)*n(i.sp));q.disc=Math.max(0,Math.round((sub-c.net)*100)/100);
  C.quotes.push(q);t.quote=q.id;S.ctab='sales';S.sub.sales='quote';S.sel.quote=q.id;save();render();toast(`สร้าง ${q.no} จากราคาประมูลแล้ว`)};
ACT.tdBond=b=>{const t=tdById(b.dataset.id);if(!t)return;const c=tdCalc(t),C=lgCfg();
  const x=Object.assign({id:uid()},NEW.lg(),{kind:'bid',benef:t.owner||custName(t.cust)||'',amt:Math.ceil(c.gross*.05/1000)*1000,issue:today(),exp:addD(okD(t.open)?t.open:today(),180),note:`ค้ำประกันซอง ${t.no} ${t.title} 5% ของราคาเสนอ ${fmt(c.gross)} บาท`});
  C.lg.push(x);t.lg=x.id;save();render();toast(`เพิ่ม ${x.no} ในทะเบียนหนังสือค้ำประกันแล้ว`)};
ACT.tdLead=b=>{const t=tdById(b.dataset.id);if(!t)return;const C=CO(),c=tdCalc(t);let l=C.leads.find(x=>x.id===t.lead);
  if(!l){l=Object.assign({id:uid()},NEW.leads(),{name:t.title||t.no,cust:t.cust||'',close:t.open||addD(today(),30)});C.leads.push(l);t.lead=l.id}
  l.value=Math.round(c.net);l.stage=t.status==='won'?'won':t.status==='lost'||t.status==='drop'?'lost':t.status==='sent'?'sent':'quote';save();render();toast('อัปเดตงานในรายการติดตามการขายแล้ว')};
ACT.tdCopy=b=>{const t=tdById(b.dataset.id);if(!t)return;const C=tdCfg(),x=JSON.parse(JSON.stringify(t));Object.assign(x,{id:uid(),no:nextNo('TD-',C.tenders),date:today(),status:'draft',quote:'',lg:'',lead:'',winner:'',winPrice:0,title:t.title+' (สำเนา)'});
  x.items.forEach(i=>i.id=uid());(x.pre||[]).forEach(i=>i.id=uid());C.tenders.push(x);S.sel.td=x.id;save();render()};
document.addEventListener('change',e=>{if(e.target.id==='kvP'){S.sel.kvp=e.target.value;render()}});

// --- page ---
// the department's page row already picks between these, so no second row of sub-tabs
CVIEWS.tender=()=>{tdCfg();const cur=['bid','k','tf'].includes(S.sub.tender)?S.sub.tender:(S.sub.tender='bid');return ({bid:tdView,k:kView,tf:tfView}[cur])()};
function tdList(){const C=tdCfg(),L=C.tenders.slice().reverse(),sel=curTd(),done=C.tenders.filter(t=>t.status==='won'||t.status==='lost'),won=done.filter(t=>t.status==='won');
  return `<dl class="stats"><div><dt>กำลังทำ / ยื่นแล้ว</dt><dd>${C.tenders.filter(t=>t.status==='draft').length} / ${C.tenders.filter(t=>t.status==='sent').length}</dd></div><div><dt>มูลค่าที่ยื่นรอผล</dt><dd>${fmt(sum(C.tenders.filter(t=>t.status==='sent'),t=>tdCalc(t).gross))}</dd></div><div><dt>อัตราได้งาน</dt><dd>${done.length?fmt(won.length*100/done.length,0)+'%':'–'}</dd></div><div><dt>ราคาเราเทียบผู้ชนะ (งานที่แพ้)</dt><dd>${(()=>{const L=C.tenders.filter(t=>t.status==='lost'&&n(t.winPrice));if(!L.length)return '–';const v=sum(L,t=>(tdCalc(t).gross-n(t.winPrice))/n(t.winPrice)*100)/L.length;return (v>0?'+':'')+fmt(v,1)+'%'})()}</dd></div></dl>
  <section class="card"><h2><span>งานประมูลและการทำราคา</span><span class="sp"></span><button type="button" class="btn sm pri" data-a="add" data-c="co.tenders" data-sel="td">+ งานประมูลใหม่</button></h2>
  <div class="tw"><table><thead><tr><th>เลขที่</th><th>งาน</th><th>เจ้าของงาน</th><th>วันยื่นซอง</th><th>แบบ</th><th class="r">ราคาที่ยื่น</th><th class="r">ราคากลาง</th><th class="r">ต่าง</th><th>สถานะ</th></tr></thead><tbody>
  ${L.length?L.map(t=>{const c=tdCalc(t),st=TDS.find(s=>s[0]===t.status)||TDS[0];return `<tr class="${sel&&sel.id===t.id?'sel':''}"><td><button type="button" class="btn ghost sm" data-a="sel" data-k="td" data-id="${t.id}"><b>${esc(t.no)}</b></button></td><td>${esc(t.title)}</td><td>${esc(t.owner||custName(t.cust)||'')}</td><td>${thD(t.open)}</td><td>${t.mode==='pvt'?'เอกชน':'ราชการ'}</td><td class="r">${fmt(c.gross)}</td><td class="r">${c.bud?fmt(c.bud):''}</td><td class="r">${c.diff==null?'':`<span style="color:${c.diff>0?'var(--danger)':'var(--good)'}">${c.diff>0?'+':''}${fmt(c.diff,1)}%</span>`}</td><td><span class="pill ${t.status==='won'?'ok':t.status==='lost'?'bad':t.status==='sent'?'info':''}">${st[1]}</span></td></tr>`}).join(''):'<tr><td colspan="9" class="muted">ยังไม่มีงานประมูล กด “+ งานประมูลใหม่” แล้วดึง BOQ จาก PENUM MEP หรือจากโครงการ</td></tr>'}</tbody></table></div></section>`}
function tdView(){const sel=curTd(),list=tdList();if(!sel)return list;S.sel.td=sel.id;
  const C=CO(),t=sel,b=`co.tenders.${t.id}`,c=tdCalc(t),gov=t.mode!=='pvt',ml=mepLink();
  const f=(k,l,o={})=>`<label class="${o.cls||''}">${l}<input${o.num?' data-t="num" inputmode="decimal"':''}${o.type?` type="${o.type}"`:''} data-p="${b}.${k}" value="${esc(t[k]??'')}"${o.ph!=null?` placeholder="${esc(o.ph)}"`:''}></label>`;
  const head=`<section class="card"><h2><span>${esc(t.no)} ${esc(t.title)}</span><span class="sp"></span>
    <button type="button" class="btn sm" data-a="print" data-k="pr4" data-id="${t.id}">พิมพ์ ปร.4</button><button type="button" class="btn sm" data-a="print" data-k="pr5" data-id="${t.id}">พิมพ์ ปร.5</button><button type="button" class="btn sm" data-a="print" data-k="tdsum" data-id="${t.id}">สรุปการทำราคา (ภายใน)</button><button type="button" class="btn sm" data-a="tdCopy" data-id="${t.id}">ทำสำเนา</button></h2>
  <div class="form"><label>เลขที่<input data-p="${b}.no" value="${esc(t.no)}"></label><label class="w2">ชื่องาน<input data-p="${b}.title" value="${esc(t.title)}"></label>
    <label>ประเภทงาน<select data-p="${b}.mode"><option value="gov"${gov?' selected':''}>ราชการ / รัฐวิสาหกิจ (Factor F)</option><option value="pvt"${gov?'':' selected'}>เอกชน (บวกกำไร + VAT)</option></select></label>
    <label>ลูกค้าในระบบ<select data-p="${b}.cust">${[['','–'],...C.customers.map(x=>[x.id,x.name])].map(([k,l])=>`<option value="${k}"${k===t.cust?' selected':''}>${esc(l)}</option>`).join('')}</select></label>
    ${f('owner','หน่วยงาน / เจ้าของงาน',{ph:custName(t.cust)||''})}${f('site','สถานที่ก่อสร้าง')}${f('drw','แบบเลขที่ / เลขที่ประกาศ')}
    ${f('date','วันที่ประมาณราคา',{type:'date'})}${f('open','วันยื่นซอง',{type:'date'})}${f('months','ระยะเวลางาน (เดือน)',{num:1})}${f('budget','ราคากลาง / งบประมาณ (รวม VAT)',{num:1})}${f('by','ผู้ประมาณราคา')}
    <label>สถานะ<select data-p="${b}.status">${TDS.map(([k,l])=>`<option value="${k}"${k===t.status?' selected':''}>${l}</option>`).join('')}</select></label>
    ${t.status==='won'||t.status==='lost'?f('winner','ผู้ชนะ')+f('winPrice','ราคาผู้ชนะ',{num:1}):''}</div></section>`;
  // the price build-up
  const row=(l,v,p,cls='')=>`<tr class="${cls}"><td>${l}</td><td class="r">${p==null?'':p}</td><td class="r">${fmt(v,2)}</td></tr>`;
  const calc=`<section class="card"><h2><span>${gov?'คำนวณ Factor F และราคาที่ยื่น':'คำนวณราคาเสนอ'}</span><small>${gov?'ราคาที่ยื่นรวม VAT แล้ว':'VAT บวกเพิ่มท้ายราคา'}</small></h2>
    <div class="form" style="margin-bottom:10px">${f('mAdj','ปรับราคาวัสดุ (%)',{num:1,ph:'0'})}${f('lAdj','ปรับค่าแรง (%)',{num:1,ph:'0'})}${f('oh','ค่าอำนวยการ (%)',{num:1,ph:fmt(c.auto.oh,2)+' อัตโนมัติ'})}${f('pr','กำไร (%)',{num:1,ph:fmt(c.auto.pr,2)+' อัตโนมัติ'})}
      ${f('int','ดอกเบี้ยเงินกู้ (%/ปี)',{num:1})}${f('fm','เงินทุนหมุนเวียน (เดือน)',{num:1})}${f('adv','เงินล่วงหน้า (%)',{num:1})}${f('ret','เงินประกันผลงานหัก (%)',{num:1})}${f('risk','เผื่อความเสี่ยง (%)',{num:1,ph:'0'})}${f('vat','VAT (%)',{num:1})}
      ${gov?f('Fo','Factor F ตามตารางทางราชการ (ถ้ามี)',{num:1,ph:fmt(c.Fc,4)}):''}${f('round','ปัดเศษลงหลัก (บาท)',{num:1})}${f('disc','ลดราคาเพิ่ม (บาท)',{num:1,ph:'0'})}</div>
    <div class="tw"><table><thead><tr><th>รายการ</th><th class="r">%</th><th class="r">บาท</th></tr></thead><tbody>
    ${row('ค่าวัสดุ',c.dm)}${row('ค่าแรงงาน',c.dl)}${row('ค่าใช้จ่ายหน้างาน',c.dp)}${row('<b>ค่างานต้นทุน (Direct cost)</b>',c.D,null,'grp')}
    ${row('ค่าอำนวยการ',c.D*c.oh/100,fmt(c.oh,2))}${row('ดอกเบี้ยเงินทุน',c.D*c.fin/100,fmt(c.fin,2))}${c.risk?row('เผื่อความเสี่ยง',c.D*c.risk/100,fmt(c.risk,2)):''}${row('กำไร',c.D*c.pr/100,fmt(c.pr,2))}
    ${gov?row(`ภาษีมูลค่าเพิ่ม ${fmtq(t.vat)}%`,c.D*c.k*n(t.vat)/100)+row(`<b>Factor F ${n(t.Fo)>0?'(ตามตารางทางราชการ)':'(คำนวณ)'}</b>`,c.raw,fmt(c.F,4),'grp'):row('<b>ราคาก่อนปัดเศษ</b>',c.raw,`× ${fmt(c.F,4)}`,'grp')}
    ${row(`ปัดเศษ${n(t.disc)?' และลดราคา':''}`,c.bid-c.raw)}${gov?row('<b>ราคาที่ยื่น (รวม VAT)</b>',c.gross,null,'grp'):row('<b>ราคาเสนอ ไม่รวม VAT</b>',c.net,null,'grp')+row(`VAT ${fmtq(t.vat)}%`,c.vat)+row('<b>รวม VAT</b>',c.gross,null,'grp')}
    </tbody></table></div>
    <dl class="stats" style="margin-top:12px"><div><dt>ราคาที่ยื่น</dt><dd>${fmt(c.gross)}</dd></div><div><dt>ต่อราคากลาง</dt><dd>${c.diff==null?'–':`<span style="color:${c.diff>0?'var(--danger)':'var(--good)'}">${c.diff>0?'+':''}${fmt(c.diff,2)}%</span>`}</dd></div>
      <div><dt>กำไรที่เหลือหลังหักค่าอำนวยการ</dt><dd style="color:${c.profitLeft>=0?'var(--good)':'var(--danger)'}">${fmt(c.profitLeft)} <small>${c.net?fmt(c.profitLeft*100/c.net,1)+'%':''}</small></dd></div><div><dt>ลดได้อีกก่อนขาดทุน</dt><dd>${c.net?fmt(Math.max(0,c.profitLeft)*100/c.net,1)+'%':'–'}</dd></div></dl>
    ${c.diff!=null&&c.diff>0?`<p class="hint" style="color:var(--danger)">ราคาสูงกว่าราคากลาง ${fmt(c.diff,2)}% งานราชการมักต้องต่ำกว่าราคากลางจึงจะได้งาน</p>`:''}
    <p class="hint">ตารางค่าอำนวยการและกำไรเป็นค่าสมมติ ดูและแก้ได้ที่แท็บ “ตาราง Factor F” ก่อนยื่นงานราชการให้ใส่ Factor F จากตารางของกรมบัญชีกลางฉบับปัจจุบันในช่อง Factor F</p>
    <div class="row" style="margin-top:8px"><button type="button" class="btn sm pri" data-a="tdQuote" data-id="${t.id}">${t.quote&&C.quotes.find(q=>q.id===t.quote)?'เปิดใบเสนอราคา':'สร้างใบเสนอราคาจากราคานี้'}</button>
      <button type="button" class="btn sm" data-a="tdBond" data-id="${t.id}">${t.lg?'ขอหนังสือค้ำซองอีกใบ':'ขอหนังสือค้ำประกันซอง 5%'}</button><button type="button" class="btn sm" data-a="tdLead" data-id="${t.id}">${t.lead?'อัปเดตงานที่ติดตาม':'เพิ่มในงานที่ติดตาม'}</button></div></section>`;
  // the BOQ
  let lg='';const pb=`${b}.items`;
  const boq=`<section class="card"><h2><span>รายการ ปริมาณงาน และราคาต้นทุน</span><small>${t.items.length} รายการ${t.src?' · ที่มา '+esc(t.src):''}</small></h2>
    <div class="row" style="margin-bottom:10px">${ml?`<button type="button" class="btn sm" data-a="tdMep" data-id="${t.id}">ดึงจาก PENUM MEP (${esc(ml.project||'')})</button>`:''}<button type="button" class="btn sm" data-a="tdPaste" data-id="${t.id}">วาง BOQ จาก PENUM MEP</button>
      
      ${C.quotes.some(q=>q.items.length)?`<select id="tdQ" aria-label="ใบเสนอราคา">${C.quotes.filter(q=>q.items.length).map(q=>`<option value="${q.id}">${esc(q.no)} ${esc(q.title)}</option>`).join('')}</select><button type="button" class="btn sm" data-a="tdQt" data-id="${t.id}">ใช้รายการจากใบเสนอราคา</button>`:''}</div>
    ${t.items.length?`<div class="tw" style="max-height:520px;overflow:auto"><table><thead><tr><th>รายการ</th><th>หน่วย</th><th class="r">จำนวน</th><th class="r">วัสดุ/หน่วย</th><th class="r">ค่าแรง/หน่วย</th><th class="r">รวมต้นทุน</th><th class="r">ราคาขาย/หน่วย</th><th></th></tr></thead><tbody>
    ${t.items.map(i=>{const h=i.g!==lg?`<tr class="grp"><td colspan="8">${gName(i.g)} <button type="button" class="btn ghost sm" data-a="tdLine" data-id="${t.id}" data-g="${esc(i.g)}">+ เพิ่มรายการ</button></td></tr>`:'';lg=i.g;const u=tdM(t,i)+tdL(t,i);
      return h+`<tr><td style="min-width:240px"><input data-p="${pb}.${i.id}.desc" value="${esc(i.desc)}" aria-label="รายการ" title="${esc(itemName(i))}">${i.head||i.type?`<small class="muted">${esc([i.head,i.type].filter(Boolean).join(' · '))}</small>`:''}</td><td style="width:70px"><input data-p="${pb}.${i.id}.unit" value="${esc(i.unit)}" aria-label="หน่วย"></td>
        <td style="width:80px"><input class="r" data-t="num" inputmode="decimal" data-p="${pb}.${i.id}.q" value="${n(i.q)}" aria-label="จำนวน"></td><td style="width:100px"><input class="r" data-t="num" inputmode="decimal" data-p="${pb}.${i.id}.m" value="${n(i.m)}" aria-label="วัสดุต่อหน่วย"></td><td style="width:100px"><input class="r" data-t="num" inputmode="decimal" data-p="${pb}.${i.id}.l" value="${n(i.l)}" aria-label="ค่าแรงต่อหน่วย"></td>
        <td class="r">${fmt(n(i.q)*u)}</td><td class="r muted">${fmt(u*(gov?c.F:c.mk),2)}</td><td><button type="button" class="x" data-a="tdDel" data-id="${t.id}" data-i="${i.id}" aria-label="ลบ">✕</button></td></tr>`}).join('')}
    <tr class="grp"><td colspan="5">รวมค่าวัสดุและค่าแรง</td><td class="r">${fmt(c.dm+c.dl)}</td><td colspan="2"></td></tr></tbody></table></div>`:`<p class="hint">ยังไม่มีรายการ ดึง BOQ จากปุ่มด้านบน หรือ <button type="button" class="btn sm" data-a="tdLine" data-id="${t.id}" data-g="oth">เพิ่มรายการเอง</button></p>`}</section>`;
  const pre=`<section class="card"><h2><span>ค่าใช้จ่ายหน้างานและค่าใช้จ่ายพิเศษ</span><small>รวม ${fmt(c.dp)} บาท</small><span class="sp"></span><button type="button" class="btn sm" data-a="tdPre" data-id="${t.id}">คำนวณตามระยะเวลางาน</button></h2>
    ${gtable(`${b}.pre`,t.pre||[],[{k:'desc',h:'รายการ',w:260},{k:'unit',h:'หน่วย',w:70},{k:'q',h:'จำนวน',t:'num',w:70},{k:'rate',h:'ราคา/หน่วย',t:'num',w:100},{h:'รวม',t:'calc',r:1,f:x=>fmt(n(x.q)*n(x.rate)),sum:x=>n(x.q)*n(x.rate)}],{empty:'ยังไม่มี กด “คำนวณตามระยะเวลางาน” เพื่อเริ่มจากรายการมาตรฐาน'})}
    <div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-a="add" data-c="${b}.pre">+ เพิ่มรายการ</button></div></section>`;
  return list+head+calc+boq+pre}
function tfView(){const C=tdCfg();return `<section class="card"><h2><span>ตารางค่าอำนวยการและกำไรตามขนาดงาน</span><span class="sp"></span><button type="button" class="btn sm" data-a="tfReset">คืนค่าเริ่มต้น</button></h2>
  <p class="hint">ค่างานต้นทุนอยู่ระหว่างแถวจะเฉลี่ยตามสัดส่วน เหมือนการอ่านตาราง Factor F · Factor F = (1 + ค่าอำนวยการ + กำไร + ดอกเบี้ย + ความเสี่ยง) × (1 + VAT) · ค่าในตารางเป็นค่าสมมติของบริษัท</p>
  ${gtable('co.tf',C.tf.slice().sort((a,b)=>n(a.m)-n(b.m)),[{k:'m',h:'ค่างานต้นทุน (ล้านบาท)',t:'num',w:110},{k:'oh',h:'ค่าอำนวยการ %',t:'num',w:90},{k:'pr',h:'กำไร %',t:'num',w:90},
    {h:'Factor F ตัวอย่าง (ดอกเบี้ย 7% 3 เดือน VAT 7%)',t:'calc',r:1,f:r=>fmt((1+(n(r.oh)+n(r.pr)+7*3/12)/100)*1.07,4)}])}
  <div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-a="add" data-c="co.tf">+ เพิ่มแถว</button></div></section>`}
ACT.tfReset=()=>{if(!confirm('คืนตารางเป็นค่าเริ่มต้น?'))return;CO().tf=TF0.map(([m,oh,pr])=>({id:uid(),m,oh,pr}));save();render()};

// --- prints ---
const prMeta=(t,form)=>`<div style="display:flex;justify-content:space-between;font-size:11px"><span>แบบ ${form}</span><span>แผ่นที่ ...... / ......</span></div>`;
const prHead=t=>`<table class="kv" style="margin-bottom:6px"><tbody><tr><td style="width:22%">ชื่อโครงการ / งานก่อสร้าง</td><td>${esc(t.title)}</td></tr><tr><td>สถานที่ก่อสร้าง</td><td>${esc(t.site||'')}</td></tr><tr><td>หน่วยงานเจ้าของโครงการ</td><td>${esc(t.owner||custName(t.cust)||'')}</td></tr>
  <tr><td>แบบเลขที่</td><td>${esc(t.drw||'')}</td></tr><tr><td>ประมาณราคาโดย</td><td>${esc(CO().name||'')} ${t.by?'· '+esc(t.by):''} เมื่อวันที่ ${thDL(t.date)}</td></tr></tbody></table>`;
PRINT.pr4=id=>{const t=tdById(id);if(!t)return '';const G=tdGroups(t),c=tdCalc(t);let k=0;const R=v=>`<td style="text-align:right">${v}</td>`;
  return `<style>@page{size:A4 landscape;margin:10mm}</style>`+prMeta(t,'ปร.4')+`<h1 style="text-align:center">แบบแสดงรายการ ปริมาณงาน และราคา</h1>`+prHead(t)+
  `<table class="pr4"><thead><tr><th rowspan="2">ลำดับ</th><th rowspan="2">รายการ</th><th rowspan="2">จำนวน</th><th rowspan="2">หน่วย</th><th colspan="2">ราคาค่าวัสดุ</th><th colspan="2">ราคาค่าแรงงาน</th><th rowspan="2">รวมค่าวัสดุและค่าแรงงาน</th><th rowspan="2">หมายเหตุ</th></tr>
  <tr><th>ราคาต่อหน่วย</th><th>จำนวนเงิน</th><th>ราคาต่อหน่วย</th><th>จำนวนเงิน</th></tr></thead><tbody>
  ${G.map((g,gi)=>{const head=`<tr><td><b>${gi+1}</b></td><td colspan="9"><b>${esc(g.name)}</b></td></tr>`;
    const body=g.pre?g.pre.map((x,j)=>`<tr><td>${gi+1}.${j+1}</td><td>${esc(x.desc)}</td>${R(fmtq(x.q))}<td>${esc(x.unit)}</td>${R(fmt(x.rate,2))}${R(fmt(n(x.q)*n(x.rate),2))}${R('–')}${R('–')}${R(fmt(n(x.q)*n(x.rate),2))}<td></td></tr>`).join('')
      :g.items.map((i,j)=>{const m=tdM(t,i),l=tdL(t,i);return `<tr><td>${gi+1}.${j+1}</td><td>${esc(itemName(i))}</td>${R(fmtq(i.q))}<td>${esc(i.unit)}</td>${R(fmt(m,2))}${R(fmt(n(i.q)*m,2))}${R(fmt(l,2))}${R(fmt(n(i.q)*l,2))}${R(fmt(n(i.q)*(m+l),2))}<td></td></tr>`}).join('');
    const sm=g.pre?tdGCost(t,g):sum(g.items,i=>n(i.q)*tdM(t,i)),sl=g.pre?0:sum(g.items,i=>n(i.q)*tdL(t,i));
    return head+body+`<tr class="st"><td></td><td style="text-align:right">รวม${esc(g.name)}</td><td></td><td></td><td></td>${R(fmt(sm,2))}<td></td>${R(fmt(sl,2))}${R(fmt(sm+sl,2))}<td></td></tr>`}).join('')}
  <tr class="st"><td></td><td style="text-align:right"><b>รวมค่างานต้นทุนทั้งหมด</b></td><td></td><td></td><td></td>${R('<b>'+fmt(c.dm+c.dp,2)+'</b>')}<td></td>${R('<b>'+fmt(c.dl,2)+'</b>')}${R('<b>'+fmt(c.D,2)+'</b>')}<td></td></tr></tbody></table>`+signs(['ผู้ประมาณราคา','ผู้ตรวจสอบ','ผู้อนุมัติ'])};
PRINT.pr5=id=>{const t=tdById(id);if(!t)return '';const G=tdGroups(t),c=tdCalc(t),gov=t.mode!=='pvt',F=gov?c.F:c.mk;
  return prMeta(t,'ปร.5')+`<h1 style="text-align:center">แบบสรุปค่าก่อสร้าง</h1>`+prHead(t)+`<p style="margin:4px 0">ระยะเวลาก่อสร้าง ${fmtq(t.months)} เดือน · ราคาจากแบบ ปร.4 จำนวน ${G.length} หมวด</p>
  <table><thead><tr><th>ลำดับ</th><th>รายการ</th><th>ค่างานต้นทุน (บาท)</th><th>${gov?'Factor F':'ตัวคูณ'}</th><th>ค่าก่อสร้าง (บาท)</th><th>หมายเหตุ</th></tr></thead><tbody>
  ${G.map((g,i)=>{const v=tdGCost(t,g);return `<tr><td>${i+1}</td><td>${esc(g.name)}</td><td style="text-align:right">${fmt(v,2)}</td><td style="text-align:center">${fmt(F,4)}</td><td style="text-align:right">${fmt(v*F,2)}</td><td></td></tr>`}).join('')}
  <tr><td></td><td style="text-align:right"><b>รวมค่าก่อสร้าง</b></td><td style="text-align:right"><b>${fmt(c.D,2)}</b></td><td></td><td style="text-align:right"><b>${fmt(c.raw,2)}</b></td><td></td></tr>
  <tr><td></td><td style="text-align:right">ปัดเศษ${n(t.disc)?' และลดราคา':''}</td><td></td><td></td><td style="text-align:right">${fmt(c.bid-c.raw,2)}</td><td></td></tr>
  ${gov?'':`<tr><td></td><td style="text-align:right">ภาษีมูลค่าเพิ่ม ${fmtq(t.vat)}%</td><td></td><td></td><td style="text-align:right">${fmt(c.vat,2)}</td><td></td></tr>`}
  <tr><td></td><td style="text-align:right"><b>${gov?'ราคาที่เสนอ (รวมภาษีมูลค่าเพิ่ม)':'รวมราคาที่เสนอ'}</b></td><td></td><td></td><td style="text-align:right"><b>${fmt(c.gross,2)}</b></td><td></td></tr>
  <tr><td colspan="6" style="text-align:center"><b>(${bahtText(c.gross)})</b></td></tr></tbody></table>
  <p style="margin-top:8px"><b>เงื่อนไขที่ใช้คำนวณ</b> เงินล่วงหน้าจ่าย ${fmtq(t.adv)}% · เงินประกันผลงานหัก ${fmtq(t.ret)}% · ดอกเบี้ยเงินกู้ ${fmtq(t.int)}% ต่อปี · ภาษีมูลค่าเพิ่ม ${fmtq(t.vat)}%${gov&&n(t.Fo)>0?' · Factor F ตามตารางทางราชการ':gov?` · Factor F คำนวณจากค่าอำนวยการ ${fmt(c.oh,2)}% กำไร ${fmt(c.pr,2)}% ดอกเบี้ย ${fmt(c.fin,2)}%`:''}</p>`+signs(['ผู้ประมาณราคา','ผู้ตรวจสอบ','กรรมการผู้จัดการ'])};
PRINT.tdsum=id=>{const t=tdById(id);if(!t)return '';const c=tdCalc(t),G=tdGroups(t),R=(l,v,p='')=>`<tr><td>${l}</td><td style="text-align:right">${p}</td><td style="text-align:right">${fmt(v,2)}</td></tr>`;
  return cphead('สรุปการทำราคาประมูล',`${esc(t.no)} · เอกสารภายใน`)+`<p>งาน <b>${esc(t.title)}</b> · ${esc(t.owner||custName(t.cust)||'')} · ยื่นซอง ${thDL(t.open)} · ${t.mode==='pvt'?'งานเอกชน':'งานราชการ'}</p>
  <table><thead><tr><th>หมวด</th><th>สัดส่วน</th><th>ค่างานต้นทุน</th></tr></thead><tbody>${G.map(g=>{const v=tdGCost(t,g);return R(esc(g.name),v,c.D?fmt(v*100/c.D,1)+'%':'')}).join('')}</tbody></table>
  <table style="margin-top:8px"><thead><tr><th>โครงสร้างราคา</th><th>%</th><th>บาท</th></tr></thead><tbody>${R('ค่าวัสดุ',c.dm)}${R('ค่าแรงงาน',c.dl)}${R('ค่าใช้จ่ายหน้างาน',c.dp)}${R('<b>ค่างานต้นทุน</b>',c.D)}
  ${R('ค่าอำนวยการ',c.D*c.oh/100,fmt(c.oh,2))}${R('ดอกเบี้ยเงินทุน',c.D*c.fin/100,fmt(c.fin,2))}${R('เผื่อความเสี่ยง',c.D*c.risk/100,fmt(c.risk,2))}${R('กำไรตามตาราง',c.D*c.pr/100,fmt(c.pr,2))}
  ${R('<b>ราคาไม่รวม VAT</b>',c.net,'ตัวคูณ '+fmt(c.mk,4))}${R('VAT',c.vat)}${R('<b>ราคาที่ยื่น รวม VAT</b>',c.gross,t.mode!=='pvt'?'F '+fmt(c.F,4):'')}${c.bud?R('ราคากลาง',c.bud,(c.diff>0?'+':'')+fmt(c.diff,2)+'%'):''}
  ${R('<b>กำไรที่เหลือหลังหักค่าอำนวยการและดอกเบี้ย</b>',c.profitLeft,c.net?fmt(c.profitLeft*100/c.net,1)+'%':'')}</tbody></table>`+signs(['ผู้ประมาณราคา','ผู้อำนวยการฝ่ายธุรกิจ','กรรมการผู้จัดการ (อนุมัติราคายื่น)'])};

