/* ---------- 4.82 Excel แบบ ORIEN Modern (user: "ถ้าผมจะส่งไฟล์ Excel ให้ลูกค้า อยากได้หน้าตาแบบนี้ทำยังไง", with the ORIEN Modern print) ----------
   A button beside Excel แบบ ORIEN makes the customer's Excel file look like the printed ORIEN Modern quotation: a cover sheet
   ใบเสนอราคา with the logo, form code, title band and number box, customer and project boxes, the summary by section, totals,
   amount in words, payment, notes and signature boxes, then the BOQ sheet in the same colours. The words and numbers are the
   print's own (qmPrint in 981): same language choice, Rev. number, extras, discount, VAT and withholding. The file is the ORIEN
   form underneath (files/lib/orien-boq.js), so นำเข้าจากไฟล์ reads it back; the layout is files/lib/orien-quote-xl.js.
   The low-profit check (924) asks first, as for every customer file. */
async function oqLib(){const X=await obLib();if(!window.orienQuoteXl)await new Promise((ok,no)=>{const s=document.createElement('script');s.src=OB_LIB+'orien-quote-xl.js';s.onload=ok;
  s.onerror=()=>no(new Error('โหลดตัวเขียนไฟล์ Excel ไม่สำเร็จ ต้องต่ออินเทอร์เน็ตครั้งแรก'));document.head.appendChild(s)});return X}
// the logo as a PNG of a sensible size, whatever it was saved as
function oqLogo(src){return new Promise(ok=>{if(!src){ok(null);return}const im=new Image();im.onload=()=>{try{const h=Math.min(240,im.naturalHeight||240),w=Math.round((im.naturalWidth||h)*h/(im.naturalHeight||h)),c=document.createElement('canvas');
    c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);ok({b64:c.toDataURL('image/png').split(',')[1],w,h})}catch(e){ok(null)}};im.onerror=()=>ok(null);im.src=src})}
function oqCover(Q,logo){const C=CO(),L=qmLang(Q),EN=L==='en',ma=qmMa(Q),eqs=!ma&&!!Q.eqSep,sp=!ma&&(qSplit(Q)||eqs),sep=qSep(Q),c=qCalc(Q);
  const t=(th,en)=>L==='en'?en:L==='th'?th:`${th} ${en}`,tn=(th,en)=>L==='en'?en:L==='th'?th:`${th}\n${en}`,tx=(th,en)=>EN?en:th,un=s=>String(s||'').replace(/&amp;/g,'&');
  const gN=g=>{const s=gName(g);return EN&&typeof I18N==='object'&&I18N.en&&I18N.en.x&&I18N.en.x[s]||s};
  const dt=s=>{if(!okD(s))return '';const d=pd(s);return EN?d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):thDL(s)};
  const cu=C.customers.find(x=>x.id===Q.cust)||{},cuN=EN&&cu.nameEn||cu.name||'',cuA=EN&&cu.addrEn||cu.addr||'',bi=(a,b)=>L==='bi'&&b&&b!==a?a+'\n'+b:a,st=(C.staff||[]).find(s=>s.name&&Q.by&&s.name===Q.by)||{};
  const G={},order=[];Q.items.forEach(i=>{const x=qLine(Q,i);if(!G[i.g]){G[i.g]={e:0,m:0,l:0,t:0};order.push(i.g)}const g=G[i.g],e=eqs&&qmIsEq(i);g.e+=e?x.mt:0;g.m+=e?0:x.mt;g.l+=x.lt;g.t+=x.t});
  const T=order.reduce((a,k)=>({e:a.e+G[k].e,m:a.m+G[k].m,l:a.l+G[k].l,t:a.t+G[k].t}),{e:0,m:0,l:0,t:0}),mk=sep&&Math.abs(c.lines-T.t)>0.005?c.lines-T.t:0,A=c.adds.filter(a=>a.v);
  const rv=(Q.revs||[]).length&&typeof qrvCur==='function'?qrvCur(Q).n:0,no=(Q.no||'')+(Q.no&&rv>0?' Rev.'+rv:'');
  const valid=okD(Q.date)&&n(Q.valid)?addD(Q.date,n(Q.valid)):'';
  const info=[[t('เลขที่','No.'),no],[t('วันที่','Date'),dt(Q.date)],...(valid?[[t('ยืนราคาถึง','Valid until'),dt(valid)]]:[]),...(Q.ref?[[t('อ้างอิง','Ref.'),Q.ref]]:[]),
    ...(Q.by?[[t('ผู้เสนอราคา','Sales'),Q.by]]:[]),...(st.phone||st.email?[[t('ติดต่อ','Contact'),[st.phone,st.email].filter(Boolean).join(' · ')]]:[])];
  const kv=(k,v,b)=>v?[k,v,b]:null,attn=Q.attn||cu.contact||'';
  const cards=[{h:t('ลูกค้า','Customer'),rows:[kv(t('ชื่อ','Name'),bi(cuN,cu.nameEn),1),kv(t('เรียน','Attn.'),attn),kv(t('ที่อยู่','Address'),bi(cuA,cu.addrEn)),kv(t('เลขผู้เสียภาษี','Tax ID'),cu.tax||''),
      kv(t('โทร','Tel.'),[cu.phone,cu.email].filter(Boolean).join(' · '))].filter(Boolean)},
    {h:t('โครงการ','Project'),rows:[kv(t('โครงการ','Project'),Q.pname||'',1),kv(t('งาน','Work'),Q.title||''),kv(t('สถานที่','Site'),Q.site||''),kv(t('แล้วเสร็จ','Completion'),Q.dlv||'')].filter(Boolean)}];
  const what=Q.title||'',pj=Q.pname||'';
  const intro=[L!=='en'?`บริษัทฯ มีความยินดีขอเสนอราคา${what}${pj?' สำหรับโครงการ '+pj:''} ตามรายละเอียดดังนี้`:'',L!=='th'?`We are pleased to submit our quotation${what?' for '+what:''}${pj?', '+pj:''}, as detailed below.`:''].filter(Boolean).join('\n');
  const MG=eqs?['e','m','l']:sp?['m','l']:[],lab={e:tn('ค่าเครื่อง','Equipment'),m:tn('ค่าวัสดุ','Material'),l:tn('ค่าแรง','Labour')};
  const tot=[{l:t('รวมเป็นเงิน','Subtotal'),v:mk||A.length?T.t:c.sub,k:'lines'}];
  if(mk)tot.push({l:t(`ค่าดำเนินการและกำไร ${qMkTxt(Q)}`,`Overhead & profit ${qMkTxt(Q,1)}`),v:mk,k:'add'});
  A.forEach(a=>tot.push({l:a.name||'',v:a.v,k:'add'}));if(mk||A.length)tot.push({l:t('รวม','Total'),v:c.sub,k:'sum'});
  if(c.disc)tot.push({l:t('ส่วนลด','Discount'),v:-c.disc,k:'disc'},{l:t('ยอดหลังหักส่วนลด','After discount'),v:c.net,k:'net'});
  tot.push({l:t('ภาษีมูลค่าเพิ่ม 7%','VAT 7%'),v:c.vat,k:'vat',pct:7},{l:t('จำนวนเงินรวมทั้งสิ้น','Grand total'),v:c.grand,k:'gt'});
  // withholding 3%, as the print shows it
  const wb=eqs&&Q.whtB!=='none'&&T.t>0?(Q.whtB==='l'?T.l:T.m+T.l):null,PW=eqs&&wb!=null&&qmParts(Q),ww=(PW?qCalc(PW[1]).net*qmWhtShare(PW[1]):wb==null?0:c.net*wb/T.t)*3/100;
  const wn=wb==null&&!eqs&&String(Q.whtN||'')==='1'&&c.net>0?c.net*3/100:0;
  if(wn||ww)tot.push({l:wn?t('หัก ณ ที่จ่าย 3% (ลูกค้านิติบุคคล)','Withholding tax 3% (company customer)'):t('หักภาษี ณ ที่จ่าย 3% (โดยประมาณ)','Withholding tax 3% (approx.)'),v:-(wn||ww),k:'wht'},
    {l:t('ยอดรับสุทธิหลังหัก ณ ที่จ่าย','Net after withholding tax'),v:c.grand-(wn||ww),k:'nt'});
  const pay=qEnsure(Q).qpay||[],PE=eqs&&(Q.qpayE||[]).length?qmParts(Q):null,ph=[tx('งวด','No.'),tx('เมื่อ','When'),'%',tx('จำนวนเงิน (รวม VAT)','Amount (incl. VAT)')];
  const payT=(P,g,h,f)=>P&&P.length?{h,heads:ph,f,rows:P.map((x,k)=>[x.no||String(k+1),x.desc||'',n(x.pct),g*n(x.pct)/100])}:null;
  const pays=(PE?[payT(Q.qpayE,qCalc(PE[0]).grand,t('การชำระเงิน ค่าเครื่อง','Payment: equipment'),false),payT(pay,qCalc(PE[1]).grand,t('การชำระเงิน ค่าติดตั้ง','Payment: installation'),false)]:[payT(pay,c.grand,t('การชำระเงิน','Payment'))]).filter(Boolean);
  const left=[kv(t('ยืนราคา','Validity'),n(Q.valid)?(EN?`${n(Q.valid)} days from the quotation date`:`${n(Q.valid)} วันนับจากวันที่เสนอราคา`):''),ma?null:kv(t('กำหนดแล้วเสร็จ','Completion'),Q.dlv||'')].filter(Boolean);
  const fe=typeof fmOn==='function'&&fmOn()&&fmFind(ma?'ใบเสนอราคาบริการ':'ใบเสนอราคา'),fm=fe&&!fmOf(fe).off?fmText(fe,EN):'';
  return {logo,coName:EN&&C.nameEn||C.name||'',fm,
    coLines:[!EN&&C.nameEn?C.nameEn:'',EN&&C.addrEn||C.addr||'',[C.phone?tx('โทร ','Tel. ')+C.phone:'',C.email||''].filter(Boolean).join(' · '),C.tax?tx('เลขประจำตัวผู้เสียภาษี ','Tax ID ')+C.tax+(C.branch?' ('+C.branch+')':''):''],
    band:{small:EN?'':ma?'MAINTENANCE SERVICE QUOTATION':'QUOTATION',title:ma?(EN?'Service Quotation':'ใบเสนอราคาบริการ'):(EN?'Quotation':'ใบเสนอราคา'),sub:(ma?[Q.title,cuN]:[Q.title,Q.pname]).filter(Boolean).join(' · ')},
    info,cards,intro,
    sum:{heads:[tn('ลำดับ','No.'),tn('รายการ','Description'),...MG.map(k=>lab[k]),tn('จำนวนเงิน','Amount')],keys:MG,rows:order.map(g=>({name:gN(g),v:G[g]})),total:[t('รวม','Total'),T.t]},
    left:{h:t('เงื่อนไข','Terms & conditions'),rows:left},tot,
    words:{h:t('จำนวนเงินตัวอักษร','Amount in words'),rows:[L!=='en'?'('+bahtText(c.grand)+')':'',L!=='th'?qmWords(c.grand):''].filter(Boolean)},
    pays,notes:{h:t('หมายเหตุ','Notes'),rows:qTerms(Q,EN)},
    signs:[{h:t('ผู้เสนอราคา','Prepared by'),who:Q.by?`(${Q.by})`:'( ................................ )'},
      {h:t('ผู้อนุมัติ','Approved by'),who:Q.signName?`(${Q.signName})${Q.signPos?' '+Q.signPos:''}`:'( ................................ )'},
      {h:t('ลูกค้ายืนยันการสั่งซื้อ','Customer acceptance'),q:tx('ขอยืนยันการสั่งซื้อตามรายการและเงื่อนไขในใบเสนอราคานี้','We accept this quotation and its terms'),who:tx('ผู้มีอำนาจลงนามพร้อมประทับตรา','Authorised signature & company seal'),ok:1}],
    date:EN?'Date ........ / ........ / ........':'วันที่ ........ / ........ / ........',
    foot:{l:[C.name,C.email].filter(Boolean).join(' · '),r:[no,C.phone?tx('โทร ','Tel. ')+C.phone:''].filter(Boolean).join(' · ')},noFile:no}}
{const f=ACT.qXl;ACT.qXl=async function(b){if(!b||!b.dataset||b.dataset.m!=='1')return f.apply(this,arguments);
  const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;if(!Q.items.length){toast('ใบเสนอราคายังไม่มีรายการ');return}
  try{const X=await oqLib(),cv=oqCover(Q,await oqLogo(CO().logo)),wb=orienQuoteXl.build(X,obQuoteDoc(Q),cv),nm=`Quotation-${String(cv.noFile||'quote').replace(/[^\w.-]+/g,'-')}.xlsx`;
    toast(await download(nm,orienQuoteXl.bytes(X,wb),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')?'ดาวน์โหลด Excel แบบ ORIEN Modern แล้ว หน้าตาเหมือนใบที่พิมพ์ ส่งให้ลูกค้าได้เลย':'ดาวน์โหลดไม่สำเร็จ')}
  catch(e){console.error(e);toast(e.message||'ทำไฟล์ Excel ไม่สำเร็จ')}}}
// the button, right after Excel แบบ ORIEN
{const f=salesQuote;salesQuote=function(){const h=f.apply(this,arguments);return h.replace(/(<button type="button" class="btn sm" data-a="qXl" data-id="([^"]+)" data-v="0"[^>]*>[^<]*<\/button>)/,
  (m,b,id)=>`${b}<button type="button" class="btn sm" data-a="qXl" data-id="${id}" data-v="0" data-m="1" title="ไฟล์ Excel หน้าตาเหมือนใบเสนอราคาที่พิมพ์ (ORIEN Modern): หน้าแรกมีโลโก้ กล่องลูกค้า สรุปราคา เงื่อนไข ช่องเซ็น แล้วตามด้วย BOQ ส่งให้ลูกค้าได้">Excel แบบ Modern</button>`)}}
if(typeof SBKW==='object')SBKW['co.sales.quote']=(SBKW['co.sales.quote']||'')+' Excel แบบ Modern ไฟล์ Excel ส่งลูกค้า สวย';
