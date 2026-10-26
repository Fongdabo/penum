/* ORIEN Modern quotation as an Excel file (PENUM PM 4.82), made to look like the printed ORIEN Modern quotation:
   a cover sheet ใบเสนอราคา (logo and company, a navy-to-teal title band with the number box, customer and project boxes,
   the summary by section, the totals box, the amount in words, payment, notes and three signature boxes), then the BOQ sheet
   of orien-boq.js in the same colours. The BOQ, the hidden marker column and the hidden PENUM sheet are orien-boq.js's own,
   so นำเข้าจากไฟล์ still reads the file back line for line.
   window.orienQuoteXl.build(XLSX, doc, cover) → workbook; .bytes(XLSX, workbook) → the file
   doc   = orien-boq.js's doc (obQuoteDoc in PM)
   cover = {logo:{b64,w,h}|null, coName, coLines:[], fm, band:{small,title,sub}, info:[[label,value]], cards:[{h, rows:[[label,value,big]]}],
            intro, sum:{heads:[], keys:['m','l'], rows:[{name,v:{e,m,l,t}}], total:[label,v]}, left:{h, rows:[[label,value]]},
            tot:[{l, v, k}] (k lines/add/sum/disc/net/vat/gt/wht/nt), words:{h, rows:[]}, pays:[{h, heads:[], rows:[[no,when,pct,amt]]}],
            notes:{h, rows:[]}, signs:[{h,q,who,ok}], date, foot:{l,r}, title}
   The cover sheet is written as XML here (SheetJS community writes no styles); every style comes from one table built on demand. */
(function(){
const NAVY='16324F',TEAL='1C8F9B',SOFT='EAF5F6',ZEB='F6FAFB',LINE='D3E2E5',HAIR='E6EEF0',GREY='6B7F87',ORNG='F59E0B',MID='24506A',INK='1F2E36',DK='2C4A5A';
const FONT='Tahoma',COVER='ใบเสนอราคา',W=[6,11,14,16,15,16,16],AZ='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const r2=v=>Math.round((+v||0)*100)/100,xe=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const L=c=>AZ[c];
// ---- one style table for the whole workbook: a spec {font:{b,i,sz,c}, fill:'hex' | ['hex','hex'], bd:{l,r,t,b:[style,hex]}, al:{h,v,wrap,ind}, nf}
function Styles(){const F=[`<font><sz val="9"/><color rgb="FF${INK}"/><name val="${FONT}"/><family val="2"/></font>`],FL=['<fill><patternFill patternType="none"/></fill>','<fill><patternFill patternType="gray125"/></fill>'],
    B=['<border><left/><right/><top/><bottom/><diagonal/></border>'],X=['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'],memo={'{}':0};
  const add=(A,x)=>{let i=A.indexOf(x);if(i<0){A.push(x);i=A.length-1}return i};
  const font=f=>!f?0:add(F,`<font>${f.b?'<b/>':''}${f.i?'<i/>':''}<sz val="${f.sz||9}"/><color rgb="FF${f.c||INK}"/><name val="${FONT}"/><family val="2"/></font>`);
  const fill=f=>!f?0:add(FL,Array.isArray(f)?`<fill><gradientFill degree="0"><stop position="0"><color rgb="FF${f[0]}"/></stop><stop position="1"><color rgb="FF${f[1]}"/></stop></gradientFill></fill>`
    :`<fill><patternFill patternType="solid"><fgColor rgb="FF${f}"/><bgColor indexed="64"/></patternFill></fill>`);
  const side=(k,s)=>s?`<${k} style="${s[0]}"><color rgb="FF${s[1]}"/></${k}>`:`<${k}/>`;
  const bord=b=>!b||!(b.l||b.r||b.t||b.b)?0:add(B,`<border>${side('left',b.l)}${side('right',b.r)}${side('top',b.t)}${side('bottom',b.b)}<diagonal/></border>`);
  function id(s){const k=JSON.stringify(s||{});if(memo[k]!=null)return memo[k];const a=s.al||{},al=a.h||a.v||a.wrap||a.ind?`<alignment${a.h?` horizontal="${a.h}"`:''} vertical="${a.v||'center'}"${a.wrap?' wrapText="1"':''}${a.ind?` indent="${a.ind}"`:''}/>`:'<alignment vertical="center"/>';
    const fo=font(s.font),fi=fill(s.fill),bo=bord(s.bd),nf=s.nf||0;
    X.push(`<xf numFmtId="${nf}" fontId="${fo}" fillId="${fi}" borderId="${bo}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${al}</xf>`);return memo[k]=X.length-1}
  const xml=()=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="0.0%"/><numFmt numFmtId="165" formatCode="#,##0.00;-#,##0.00;&quot;–&quot;"/></numFmts>
<fonts count="${F.length}">${F.join('')}</fonts><fills count="${FL.length}">${FL.join('')}</fills><borders count="${B.length}">${B.join('')}</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${X.length}">${X.join('')}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0"/></styleSheet>`;
  return {id,xml}}
const merge=(a,b)=>{const o=Object.assign({},a);for(const k in b)o[k]=b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])?Object.assign({},a[k]||{},b[k]):b[k];return o};
// how many lines a text takes in a box this many characters wide (Thai vowel and tone marks take no width)
const vis=s=>String(s||'').replace(/[ัิ-ฺ็-๎]/g,'').length;
const nLines=(s,wch,sz)=>String(s||'').split('\n').reduce((a,p)=>a+Math.max(1,Math.ceil(vis(p)*(sz||9)/9/Math.max(4,wch*1.25))),0);

// ---- the cover sheet, as rows of cells with a style spec each
function Sheet(){const R=[],M=[];let r=0;
  const row=k=>R[k]||(R[k]={h:null,c:{}}),cell=(k,c)=>row(k).c[c]||(row(k).c[c]={s:{}});
  const api={
    get r(){return r},next(h){r++;row(r);if(h)R[r].h=h;return r},
    h(k,v){row(k).h=Math.max(row(k).h||0,v);return api},
    put(k,c,v,s,f){const x=cell(k,c);x.v=v;if(f)x.f=f;if(s)x.s=merge(x.s,s);return api},
    sty(k1,c1,k2,c2,s){for(let k=k1;k<=k2;k++)for(let c=c1;c<=c2;c++){const x=cell(k,c);x.s=merge(x.s,s)}return api},
    mg(k1,c1,k2,c2){if(k1!==k2||c1!==c2)M.push(`${L(c1)}${k1}:${L(c2)}${k2}`);for(let k=k1;k<=k2;k++)for(let c=c1;c<=c2;c++)cell(k,c);return api},
    // a box: a thin outline in one colour round a rectangle of cells
    box(k1,c1,k2,c2,col,w){const s=[w||'thin',col||LINE];for(let k=k1;k<=k2;k++)for(let c=c1;c<=c2;c++){const x=cell(k,c),b=Object.assign({},(x.s.bd||{}));
      if(c===c1)b.l=s;if(c===c2)b.r=s;if(k===k1)b.t=s;if(k===k2)b.b=s;x.s=merge(x.s,{bd:b})}return api},
    // a text in merged cells, with the row made tall enough for it
    txt(k,c1,c2,v,s,k2){api.put(k,c1,v,s).mg(k,c1,k2||k,c2).sty(k,c1,k2||k,c2,{al:merge({v:'center',wrap:true},(s||{}).al||{})});
      if(!k2){const wch=W.slice(c1,c2+1).reduce((a,b)=>a+b,0),sz=(s&&s.font&&s.font.sz)||9;api.h(k,Math.max(14,nLines(v,wch-1,sz)*sz*1.5+3))}return api},
    xml(S,o){const out=[];R.forEach((x,k)=>{if(!x)return;const cs=Object.keys(x.c).map(Number).sort((a,b)=>a-b).map(c=>{const z=x.c[c],ref=L(c)+k,st=S.id(z.s);
        if(z.f)return `<c r="${ref}" s="${st}"><f>${xe(z.f)}</f><v>${r2(z.v)}</v></c>`;
        if(typeof z.v==='number')return `<c r="${ref}" s="${st}"><v>${z.v}</v></c>`;
        if(z.v==null||z.v==='')return `<c r="${ref}" s="${st}"/>`;
        return `<c r="${ref}" s="${st}" t="inlineStr"><is><t xml:space="preserve">${xe(z.v)}</t></is></c>`});
        out.push(`<row r="${k}"${x.h?` ht="${x.h.toFixed(1)}" customHeight="1"`:''}>${cs.join('')}</row>`)});
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${L(W.length-1)}${r}"/>
<sheetViews><sheetView workbookViewId="0" showGridLines="0" tabSelected="1"/></sheetViews><sheetFormatPr defaultRowHeight="14"/><cols>${W.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w+0.7}" customWidth="1"/>`).join('')}</cols>
<sheetData>${out.join('')}</sheetData>${M.length?`<mergeCells count="${M.length}">${M.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells>`:''}
<pageMargins left="0.45" right="0.45" top="0.4" bottom="0.55" header="0.2" footer="0.25"/><pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="${o.fitH}"/>${o.foot}${o.logo?'<drawing r:id="rIdLogo"/>':''}</worksheet>`}};
  return api}
const footXml=f=>f&&(f.l||f.r)?`<headerFooter><oddFooter>${xe(`&L&"${FONT},Regular"&7${(f.l||'').replace(/&/g,'&&')}&R&"${FONT},Regular"&7${(f.r||'').replace(/&/g,'&&')}  &P/&N`)}</oddFooter></headerFooter>`:'';

function cover(Q,secRows,boq){const S=Sheet(),N=W.length-1,lab={font:{sz:8,c:GREY}},val={font:{sz:9,b:true}},K=v=>({nf:165,al:{h:'right'},font:{sz:9}});
  // colour bar like the print's: navy, teal, light teal, orange
  S.next(4.5);[[0,2,NAVY],[3,4,TEAL],[5,5,'5CC6C9'],[6,6,ORNG]].forEach(([a,b,c])=>S.sty(S.r,a,S.r,b,{fill:c}));
  S.next(12);if(Q.fm)S.put(S.r,3,Q.fm,{font:{sz:7,c:GREY},al:{h:'right'}}).mg(S.r,3,S.r,N);
  // logo left, the company right
  const top=S.r+1,cl=(Q.coLines||[]).filter(Boolean);S.next();S.put(S.r,3,Q.coName||'',{font:{b:true,sz:11,c:NAVY},al:{h:'right'}}).mg(S.r,3,S.r,N);S.h(S.r,17);
  if(!Q.logo)S.put(top,0,Q.coName||'',{font:{b:true,sz:15,c:NAVY}}).mg(top,0,top,2);
  cl.forEach(t=>{S.next();S.txt(S.r,3,N,t,{font:{sz:8,c:'4A5D66'},al:{h:'right'}})});
  while(S.r<top+3)S.next(12);const logoRows=S.r-top+1;S.next(6);
  // title band (left) and the number box (right)
  const I=Q.info||[],n=Math.max(3,I.length),b0=S.r+1;for(let k=0;k<n;k++)S.next(15);const b1=S.r,band={fill:[NAVY,'1F6F80']};
  S.sty(b0,0,b1,3,band);
  S.put(b0,0,Q.band.small||'',merge(band,{font:{sz:7.5,b:true,c:'BFE7EA'},al:{ind:1,v:'bottom'}})).mg(b0,0,b0,3);
  const tEnd=n>3?b1-1:b0+1;S.put(b0+1,0,Q.band.title||'',merge(band,{font:{sz:17,b:true,c:'FFFFFF'},al:{ind:1}})).mg(b0+1,0,tEnd,3);
  S.put(b1,0,Q.band.sub||'',merge(band,{font:{sz:9,c:'E3F1F3'},al:{ind:1,v:'top',wrap:true}})).mg(b1,0,b1,3);S.h(b1,nLines(Q.band.sub,45,9)*13.5+3);
  for(let k=0;k<n;k++){const x=I[k]||['',''],rr=b0+k;S.put(rr,4,x[0],merge(lab,{al:{ind:1}})).put(rr,5,x[1],k?merge(val,{al:{wrap:true}}):{font:{b:true,sz:10.5,c:NAVY}}).mg(rr,5,rr,N);S.h(rr,nLines(x[1],31,9)*13.5+2);
    if(!k)S.sty(rr,4,rr,N,{fill:SOFT});if(k)S.sty(rr,4,rr,N,{bd:{t:['hair',LINE]}})}
  S.box(b0,4,b1,N,LINE);S.next(6);
  // customer and project boxes
  const C=Q.cards||[],cr=Math.max(...C.map(c=>c.rows.length),1),c0=S.r+1;S.next(16);
  const cardCols=[[0,1,3],[4,4,N]];C.slice(0,2).forEach((c,j)=>{const [a,m,e]=cardCols[j];S.put(c0,a,'◆  '+c.h,{font:{b:true,sz:9.5,c:TEAL},al:{ind:1}}).mg(c0,a,c0,e)});
  for(let k=0;k<cr;k++){S.next();C.slice(0,2).forEach((c,j)=>{const [a,m,e]=cardCols[j],x=c.rows[k];if(!x){S.mg(S.r,a,S.r,m).mg(S.r,m+1,S.r,e);return}
    S.put(S.r,a,x[0],merge(lab,{al:{ind:1,v:'top'}})).mg(S.r,a,S.r,m);S.txt(S.r,m+1,e,x[1],x[2]?{font:{b:true,sz:10,c:NAVY},al:{v:'top'}}:{font:{sz:9},al:{v:'top'}})})}
  S.next(4);C.slice(0,2).forEach((c,j)=>{const [a,,e]=cardCols[j];S.box(c0,a,S.r,e,LINE)});S.next(6);
  if(Q.intro){S.next();S.txt(S.r,0,N,Q.intro,{font:{sz:9.5}})}S.next(4);
  // summary by section; with no equipment column the cells point at the section totals on the BOQ sheet
  const U=Q.sum,ks=U.keys||[],dE=N-ks.length-1,hd={fill:NAVY,font:{b:true,sz:9,c:'FFFFFF'},al:{h:'center',wrap:true},bd:{r:['thin','3A5A75']}};
  S.next();const hr=S.r;S.put(hr,0,U.heads[0],hd).put(hr,1,U.heads[1],hd).mg(hr,1,hr,dE);ks.forEach((k,j)=>S.put(hr,dE+1+j,U.heads[2+j],hd));S.put(hr,N,U.heads[U.heads.length-1],hd);
  S.h(hr,Math.max(...U.heads.map(h=>String(h).split('\n').length))*12+6);
  const ref=(boq&&['','m,l'].includes(ks.join())&&secRows&&secRows.length===U.rows.length)?`'${boq}'!`:null,col={m:'F',l:'H'},s0=S.r+1;
  U.rows.forEach((x,k)=>{S.next(16);const z=k%2?{fill:ZEB}:{},rr=S.r,bd={bd:{b:['thin',HAIR]}};S.sty(rr,0,rr,N,merge(z,bd));
    S.put(rr,0,k+1,{al:{h:'center'},font:{sz:9,c:GREY}}).put(rr,1,x.name,{al:{wrap:true}}).mg(rr,1,rr,dE);S.h(rr,Math.max(16,nLines(x.name,W.slice(1,dE+1).reduce((a,b)=>a+b,0),9)*13.5+3));
    ks.forEach((q,j)=>S.put(rr,dE+1+j,r2(x.v[q]),K(),ref?`${ref}${col[q]}${secRows[k]}`:null));
    S.put(rr,N,r2(x.v.t),K(),ks.length?ks.map((q,j)=>L(dE+1+j)+rr).join('+'):ref?`${ref}I${secRows[k]}`:null)});
  S.next(18);const tr=S.r,tt={fill:NAVY,font:{b:true,sz:9.5,c:'FFFFFF'}};S.sty(tr,0,tr,N,tt);S.put(tr,1,U.total[0],tt).mg(tr,1,tr,dE);
  ks.forEach((q,j)=>S.put(tr,dE+1+j,r2(U.rows.reduce((a,x)=>a+(+x.v[q]||0),0)),merge(tt,{nf:165,al:{h:'right'}}),`SUM(${L(dE+1+j)}${s0}:${L(dE+1+j)}${tr-1})`));
  S.put(tr,N,r2(U.total[1]),merge(tt,{nf:4,al:{h:'right'}}),`SUM(${L(N)}${s0}:${L(N)}${tr-1})`);S.next(8);
  // terms (left) and the totals box (right): every amount a formula from the one above it
  const T=Q.tot||[],LF=Q.left||{rows:[]},f0=S.r+1,rows=Math.max(T.length,LF.rows.length+1);let cur=`${L(N)}${tr}`,adds=[],gt='',vt='',wh='';
  for(let k=0;k<rows;k++){S.next(16);const rr=S.r;
    if(!k&&LF.h)S.put(rr,0,'◆  '+LF.h,{font:{b:true,sz:9.5,c:TEAL},al:{ind:1}}).mg(rr,0,rr,3);
    const lx=k?LF.rows[k-1]:null;if(lx){S.put(rr,0,lx[0],merge(lab,{al:{ind:1,v:'top'}})).mg(rr,0,rr,1);S.txt(rr,2,3,lx[1],{font:{sz:9},al:{v:'top'}})}
    const x=T[k];if(!x)continue;let f=null;const v=r2(x.v);
    if(x.k==='lines')f=cur;else if(x.k==='add'){adds.push(L(N)+rr)}else if(x.k==='sum'){f=[cur,...adds].join('+');adds=[]}else if(x.k==='disc'){adds.push(L(N)+rr)}
    else if(x.k==='net'){f=[cur,...adds].join('+');adds=[]}else if(x.k==='vat'){f=`${cur}*${+x.pct||7}/100`;vt=L(N)+rr}else if(x.k==='gt'){f=`${cur}+${vt}`;gt=L(N)+rr}
    else if(x.k==='wht')wh=L(N)+rr;else if(x.k==='nt')f=`${gt}+${wh}`;
    if(['lines','sum','net'].includes(x.k))cur=L(N)+rr;
    const big=x.k==='gt',bx=big?{fill:[NAVY,TEAL],font:{b:true,sz:10.5,c:'FFFFFF'}}:x.k==='nt'?{fill:SOFT,font:{b:true,sz:9,c:NAVY}}:{font:{sz:9}};
    S.sty(rr,4,rr,N,merge(bx,k&&!big?{bd:{t:['hair',LINE]}}:{}));if(big)S.h(rr,21);
    S.put(rr,4,x.l,merge(bx,{al:{ind:1,wrap:true}})).mg(rr,4,rr,5);S.h(rr,nLines(x.l,30,9)*13+3).put(rr,N,v,merge(bx,{nf:4,al:{h:'right'},font:merge(bx.font||{},{b:true,c:x.k==='disc'||x.k==='wht'?'C2410C':(bx.font||{}).c||INK})}),f)}
  if(T.length)S.box(f0,4,f0+T.length-1,N,LINE);S.next(5);
  // amount in words: a soft band with an orange edge
  if(Q.words&&Q.words.rows.length){S.next(13);const w0=S.r,ws={fill:SOFT};S.put(w0,0,Q.words.h,merge(ws,{font:{sz:7.5,c:GREY},al:{ind:1}})).mg(w0,0,w0,N).sty(w0,0,w0,N,ws);
    Q.words.rows.forEach((t,k)=>{S.next();S.txt(S.r,0,N,t,merge(ws,{font:{b:!k,sz:k?8.5:9.5,c:k?'4A5D66':NAVY},al:{ind:1}}));S.sty(S.r,0,S.r,N,ws)});
    S.sty(w0,0,S.r,0,{bd:{l:['thick',ORNG]}});S.next(6)}
  // payment schedules and notes
  (Q.pays||[]).forEach(P=>{S.next(16);S.put(S.r,0,'◆  '+P.h,{font:{b:true,sz:9.5,c:TEAL},al:{ind:1}}).mg(S.r,0,S.r,N);
    S.next(14);const h=S.r,ph={font:{sz:8,c:GREY},bd:{b:['thin',LINE]}};S.sty(h,0,h,N,ph);S.put(h,0,P.heads[0],merge(ph,{al:{h:'center'}})).put(h,1,P.heads[1],ph).mg(h,1,h,4).put(h,5,P.heads[2],merge(ph,{al:{h:'right'}})).put(h,N,P.heads[3],merge(ph,{al:{h:'right'}}));
    P.rows.forEach(x=>{S.next(15);const rr=S.r,b={bd:{b:['thin',HAIR]}};S.sty(rr,0,rr,N,b);S.put(rr,0,x[0],{al:{h:'center'}});S.txt(rr,1,4,x[1],{});
      S.put(rr,5,(+x[2]||0)/100,{nf:9,al:{h:'right'}}).put(rr,N,r2(x[3]),{nf:4,al:{h:'right'}},gt&&P.f!==false?`${gt}*${L(5)}${rr}`:null)});S.next(6)});
  if(Q.notes&&Q.notes.rows.length){S.next(16);S.put(S.r,0,'◆  '+Q.notes.h,{font:{b:true,sz:9.5,c:TEAL},al:{ind:1}}).mg(S.r,0,S.r,N);
    Q.notes.rows.forEach((t,k)=>{S.next();S.put(S.r,0,(k+1)+'.',{al:{h:'right',v:'top'},font:{sz:9,c:GREY}});S.txt(S.r,1,N,String(t).replace(/^[-–•]\s*/,''),{font:{sz:9},al:{v:'top'}})});S.next(8)}
  // three signature boxes; the customer's in teal
  const SG=Q.signs||[],sc=[[0,2],[3,4],[5,6]];if(SG.length){const g0=S.r+1;S.next(16);S.next(13);S.next(30);S.next(15);S.next(13);S.next(14);
    SG.slice(0,3).forEach((x,j)=>{const [a,e]=sc[j],ok=x.ok?{fill:SOFT}:{},c={al:{h:'center',wrap:true}};S.sty(g0,a,g0+5,e,ok);
      S.put(g0,a,x.h,merge(c,{font:{b:true,sz:9.5,c:NAVY}})).mg(g0,a,g0,e).put(g0+1,a,x.q||'',merge(c,{font:{sz:7.5,c:'4A5D66'}})).mg(g0+1,a,g0+1,e).mg(g0+2,a,g0+2,e)
       .put(g0+3,a,x.who||'',merge(c,{font:{b:true,sz:9}})).mg(g0+3,a,g0+3,e).put(g0+4,a,Q.date||'',merge(c,{font:{sz:8,c:GREY}})).mg(g0+4,a,g0+4,e).mg(g0+5,a,g0+5,e)
       .sty(g0+3,a,g0+3,e,{bd:{t:['thin','8FA3AA']}});S.box(g0,a,g0+5,e,x.ok?TEAL:LINE,x.ok?'medium':'thin')})}
  return S}

function build(X,doc,Q){// a line under a heading gets its dash from orien-boq.js, so its own dash goes
  doc=Object.assign({},doc,{items:(doc.items||[]).map(i=>i.head&&/^[-–]/.test(i.desc||'')?Object.assign({},i,{desc:i.desc.replace(/^[-–]\s*/,'')}):i)});
  const wb=orienBoq.build(X,doc,false),SH=orienBoq.SHEET,O=wb.__ob||{};
  // the standard summary sheet gives way to the cover; the BOQ's section totals are its rows marked T, not รวมทุกหมวด
  const bk=(O[SH.boq]||{}).k||[],sec=[];bk.forEach((k,i)=>{if(k==='tot')sec.push(i+1)});
  delete wb.Sheets[SH.sum];wb.SheetNames=wb.SheetNames.filter(n=>n!==SH.sum);delete O[SH.sum];
  wb.Sheets[COVER]=X.utils.aoa_to_sheet([['']]);wb.SheetNames.unshift(COVER);
  wb.Workbook={Sheets:wb.SheetNames.map(n=>({Hidden:n===SH.meta?1:0}))};
  // the hidden meta says which look made the file
  const m=wb.Sheets[SH.meta];if(m&&m.A2)try{const j=JSON.parse(m.A2.v);j.look='modern';m.A2={t:'s',v:JSON.stringify(j)}}catch(e){}
  wb.__oq={Q,sec,boq:SH.boq};return wb}

// the BOQ sheet in the ORIEN Modern colours: navy header, soft teal sections, faint zebra lines, navy grand total
function boqStyle(kind,col,num,o,zebra){const c=col===0||col===2||col===3,sz=9;switch(kind){
  case 'co':return col?{}:{font:{b:true,sz:13,c:NAVY}};case 'title':return {fill:[NAVY,TEAL],font:{b:true,sz:11,c:'FFFFFF'},al:{ind:1}};
  case 'hdr':return {fill:NAVY,font:{b:true,sz,c:'FFFFFF'},al:{h:'center',wrap:true},bd:{r:['thin','3A5A75']}};
  case 'sec':return {fill:SOFT,font:{b:true,sz:9.5,c:NAVY},bd:{b:['thin','C8DFE3']},al:col===0?{h:'center'}:{}};
  case 'head':return {font:{b:true,sz,c:DK},al:col===0?{h:'center'}:{},nf:num?4:0};
  case 'type':return {font:{i:true,sz,c:GREY}};
  case 'item':return merge(zebra?{fill:ZEB}:{},{font:{sz,c:col===0?GREY:INK},bd:{b:['thin',HAIR]},al:{h:c?'center':num?'right':undefined,v:'top',wrap:col===1},nf:num&&!c?(o.pct||[]).includes(col)?164:4:0});
  case 'tot':return {font:{b:true,sz,c:NAVY},bd:{t:['thin',TEAL],b:['thin',TEAL]},nf:num?(o.pct||[]).includes(col)?164:4:0,al:num?{h:'right'}:{}};
  case 'htot':return {font:{b:true,sz,c:DK},bd:{t:['dashed',TEAL],b:['thin',HAIR]},nf:num?(o.pct||[]).includes(col)?164:4:0,al:num?{h:'right'}:{}};
  case 'grand':return {fill:NAVY,font:{b:true,sz:9.5,c:'FFFFFF'},nf:num?(o.pct||[]).includes(col)?164:4:0,al:num?{h:'right'}:{}};
  case '':return {font:{sz:8.5,c:GREY}};default:return {}}}
function polish(xml,o,S,foot){const n=o.n,box=['hdr','sec','head','type','item','tot','htot','grand','title'];let z=0;
  xml=xml.replace(/<row r="(\d+)"([^>]*)>([\s\S]*?)<\/row>/g,(m,r,a,body)=>{const kind=o.k[r-1]||'',cells={};if(kind==='item')z++;else if(kind!=='type'&&kind!=='head')z=0;
    body.replace(/<c r="([A-Z]+)\d+"([^>]*?)(\/>|>[\s\S]*?<\/c>)/g,(c,col,at,rest)=>{cells[col]={at:at.replace(/\s*s="\d+"/,''),rest};return ''});
    const keys=box.includes(kind)?[...new Set([...AZ.slice(0,n),...Object.keys(cells)])]:Object.keys(cells);keys.sort((x,y)=>x.length-y.length||(x<y?-1:1));
    const ht=kind==='hdr'?' ht="30" customHeight="1"':kind==='title'?' ht="20" customHeight="1"':kind==='sec'?' ht="17" customHeight="1"':'';
    return `<row r="${r}"${a.replace(/\s*(ht|customHeight)="[^"]*"/g,'')}${ht}>`+keys.map(col=>{const c=cells[col],ci=AZ.indexOf(col);if(ci>=n)return c?`<c r="${col}${r}"${c.at}${c.rest}`:'';
      const num=c&&!/t="(s|str|b|e|inlineStr)"/.test(c.at)&&/<v>/.test(c.rest),st=S.id(boqStyle(kind,ci,num,o,z%2===0));return c?`<c r="${col}${r}"${c.at} s="${st}"${c.rest}`:`<c r="${col}${r}" s="${st}"/>`}).join('')+'</row>'});
  xml=xml.replace(/(<worksheet[^>]*>)/,'$1<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>').replace(/<sheetView ([^>]*?)\/?>/,(m,a)=>`<sheetView showGridLines="0" ${a.replace(/showGridLines="\d"\s*/,'')}${m.endsWith('/>')?'/>':'>'}`);
  if(!/<sheetView/.test(xml))xml=xml.replace(/(<dimension[^>]*\/>)/,'$1<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>');
  const ps=`<pageSetup paperSize="9" orientation="${o.land?'landscape':'portrait'}" fitToWidth="1" fitToHeight="0"/>${foot}`;
  return /<pageMargins[^>]*\/>/.test(xml)?xml.replace(/(<pageMargins[^>]*\/>)/,'$1'+ps):xml.replace('</worksheet>',ps+'</worksheet>')}

function b64bytes(s){const b=atob(String(s).replace(/^data:[^,]*,/,'')),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
function bytes(X,wb){const O=wb.__ob||{},QQ=wb.__oq;if(!QQ)return orienBoq.bytes(X,wb);
  wb.Workbook.Names=Object.keys(O).filter(n=>O[n].hr>=0&&O[n].hr!=null).map(n=>({Name:'_xlnm.Print_Titles',Sheet:wb.SheetNames.indexOf(n),Ref:`'${n}'!$${O[n].hr+1}:$${O[n].hr+1}`}));
  wb.SheetNames.forEach(n=>{wb.Sheets[n]['!margins']={left:0.4,right:0.4,top:0.45,bottom:0.55,header:0.2,footer:0.25}});
  const raw=X.write(wb,{type:'array',bookType:'xlsx',compression:true}),C=X.CFB,z=C.read(new Uint8Array(raw),{type:'array'}),dec=new TextDecoder(),enc=new TextEncoder(),St=Styles();
  const get=p=>{const e=C.find(z,p);return e?dec.decode(e.content):''},put=(p,t)=>{const e=C.find(z,p);if(e)e.content=typeof t==='string'?enc.encode(t):t;else C.utils.cfb_add(z,p,typeof t==='string'?enc.encode(t):t)};
  const Q=QQ.Q,foot=footXml(Q.foot),logo=Q.logo&&Q.logo.b64?Q.logo:null,S=cover(Q,QQ.sec,QQ.boq),nRows=S.r;
  put('/xl/worksheets/sheet1.xml',S.xml(St,{fitH:nRows>70?0:1,foot,logo}));
  wb.SheetNames.forEach((n,i)=>{const o=O[n],p=`/xl/worksheets/sheet${i+1}.xml`;if(o&&i)put(p,polish(get(p),o,St,foot))});
  if(logo){// the logo as a picture on the cover: about 40 pt high, at most 165 pt wide
    let h=40,w=logo.w&&logo.h?h*logo.w/logo.h:120;if(w>165){h=h*165/w;w=165}const E=v=>Math.round(v*12700);
    put('/xl/media/logo1.png',b64bytes(logo.b64));
    put('/xl/drawings/drawing1.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>2</xdr:row><xdr:rowOff>${E(3)}</xdr:rowOff></xdr:from><xdr:ext cx="${E(w)}" cy="${E(h)}"/>
<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="Logo"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${E(w)}" cy="${E(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`);
    put('/xl/drawings/_rels/drawing1.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/logo1.png"/></Relationships>');
    const rel='<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>',rp='/xl/worksheets/_rels/sheet1.xml.rels',old=get(rp);
    put(rp,old?old.replace('</Relationships>',rel+'</Relationships>'):'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+rel+'</Relationships>');
    let ct=get('/[Content_Types].xml');if(!/Extension="png"/i.test(ct))ct=ct.replace(/(<Types[^>]*>)/,'$1<Default Extension="png" ContentType="image/png"/>');
    ct=ct.replace('</Types>','<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>');put('/[Content_Types].xml',ct)}
  put('/xl/styles.xml',St.xml());
  return C.write(z,{fileType:'zip',type:'array',compression:true})}
window.orienQuoteXl={COVER,build,bytes};
})();
