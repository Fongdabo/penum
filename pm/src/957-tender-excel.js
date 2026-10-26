/* ---------- 4.89: ดาวน์โหลด Excel ปร.4 / ปร.5 / ปร.6 (user: "ไฟล์ ปร.4 โหลดเป็น Excel ได้ไหม ... หมายถึงใน PM") ----------
   A button beside พิมพ์ ปร.4 / ปร.5 / ปร.6 on a bid saves the same forms as one Excel file, a sheet per form. Each sheet is
   read from the print itself (PRINT.pr4 / pr5 / pr6): headings and lines as text rows, tables cell by cell with numbers kept
   as numbers, so the file always shows exactly what prints (ราคากลาง, Factor F, parts, rounding). Uses the bundled xlsx.js.
   4.90 (user: "ทำสวยๆ ให้เหมือน ปร.4 ได้ไหม"): the sheets look like the print. SheetJS community writes no styles, so each
   sheet's XML is written here (borders, the two-row heads merged and shaded, 1,234.00 numbers, shaded subtotal rows, title,
   signature lines, no grid lines, A4 fit to width with the table head repeated on every page) and swapped into the file. */
const TDXL=[['pr4','ปร.4',[7,52,10,9,14,15,14,15,17,22]],['pr5','ปร.5',[7,52,18,11,20,22]],['pr6','ปร.6',[7,52,18,11,20,22]]];
const TDXL_C={hd:'EEF4F4',st:'F2F6F6',bd:'C9D4D6',ink:'1F2E36'};
// one style table for the file: a spec {b, sz, fill, bd, h, v, wrap, nf, top} → cellXfs index
function tdXlStyles(){const F=[],FL=['<fill><patternFill patternType="none"/></fill>','<fill><patternFill patternType="gray125"/></fill>'],
    B=['<border><left/><right/><top/><bottom/><diagonal/></border>'],NF=[],X=[],memo={};
  const add=(A,x)=>{let i=A.indexOf(x);if(i<0){A.push(x);i=A.length-1}return i};
  const font=s=>add(F,`<font>${s.b?'<b/>':''}<sz val="${s.sz||10}"/><color rgb="FF${TDXL_C.ink}"/><name val="Tahoma"/><family val="2"/></font>`);
  const id=s=>{const k=JSON.stringify(s);if(k in memo)return memo[k];
    const side=(k,c)=>c?`<${k} style="thin"><color rgb="FF${c}"/></${k}>`:`<${k}/>`,g=s.bd?TDXL_C.bd:'',fo=font(s),fi=s.fill?add(FL,`<fill><patternFill patternType="solid"><fgColor rgb="FF${s.fill}"/><bgColor indexed="64"/></patternFill></fill>`):0,
      bo=s.bd||s.top?add(B,`<border>${side('left',g)}${side('right',g)}${side('top',s.top?'000000':g)}${side('bottom',g)}<diagonal/></border>`):0,
      nf=!s.nf?0:s.nf==='#,##0.00'?4:s.nf==='#,##0'?3:164+add(NF,s.nf);
    X.push(`<xf numFmtId="${nf}" fontId="${fo}" fillId="${fi}" borderId="${bo}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment${s.h?` horizontal="${s.h}"`:''} vertical="${s.v||'top'}"${s.wrap?' wrapText="1"':''}/></xf>`);
    return memo[k]=X.length-1};
  id({});
  const xml=()=>`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`+
    (NF.length?`<numFmts count="${NF.length}">${NF.map((f,i)=>`<numFmt numFmtId="${164+i}" formatCode="${f}"/>`).join('')}</numFmts>`:'')+
    `<fonts count="${F.length}">${F.join('')}</fonts><fills count="${FL.length}">${FL.join('')}</fills><borders count="${B.length}">${B.join('')}</borders>`+
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${X.length}">${X.join('')}</cellXfs>`+
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0"/></styleSheet>`;
  return {id,xml}}
// a print as a grid of cells {v, n (number), s (style spec)}, merges, row heights, page breaks and the table-head rows
function tdXlGrid(html,cols){const box=document.createElement('div');box.innerHTML=html;
  const N=cols.length,rows=[],merges=[],hts={},brk=[],TR=[];let r=0,head=null,nt=0;
  const put=(rr,c,v,s,isN)=>{(rows[rr]=rows[rr]||[])[c]={v,n:isN,s}};
  const merge=(r1,c1,r2,c2,s)=>{for(let y=r1;y<=r2;y++)for(let x=c1;x<=c2;x++)if(!(rows[y]||[])[x])put(y,x,'',s);if(r2>r1||c2>c1)merges.push([r1,c1,r2,c2])};
  const wide=(c1,c2)=>cols.slice(c1,c2+1).reduce((a,b)=>a+b,0);
  const len=s=>s.replace(/[ัิ-ฺ็-๎]/g,'').length;   // Thai vowels above/below take no width
  const lines=(s,w)=>s.split('\n').reduce((a,p)=>a+Math.max(1,Math.ceil(len(p)*0.9/Math.max(4,w))),0);
  const tall=(rr,s,w,sz)=>{const h=lines(s,w)*((sz||10)*1.5)+3;if(h>(hts[rr]||0))hts[rr]=h};
  const txt=el=>(el.innerText||el.textContent||'').replace(/[ \t ]+/g,' ').replace(/ *\n */g,'\n').trim();
  const num=s=>{const m=s.match(/^(-?)[\d,]+(?:\.(\d+))?$/);if(!m||!/\d/.test(s))return null;const d=(m[2]||'').length;
    return {v:+s.replace(/,/g,''),nf:d?'#,##0.'+'0'.repeat(d):'#,##0'}};
  const line=(s,o={})=>{if(!s)return;const st={wrap:1,...o};put(r,0,s,st);merge(r,0,r,N-1,st);tall(r,s,wide(0,N-1),o.sz);r++};
  const table=tb=>{if(tb.classList.contains('kv')){tb.querySelectorAll('tr').forEach(tr=>{const d=tr.children;if(!d.length)return;
      put(r,0,txt(d[0]),{});merge(r,0,r,1,{});const v=d[1]?txt(d[1]):'';put(r,2,v,{wrap:1});merge(r,2,r,N-1,{wrap:1});tall(r,v,wide(2,N-1));r++});r++;return}
    const occ={},r0=r,ti=nt++;let hd=0;
    [...tb.rows].forEach((tr,y)=>{const th=tr.parentElement.tagName==='THEAD',st=tr.classList.contains('st')||!th&&!!tr.querySelector('td b')&&!tr.querySelector('td[colspan]');
      let c=0;if(!th&&tr.cells.length)TR.push({r:r0+tr.rowIndex,st,t:ti,no:txt(tr.cells[0]),lb:tr.cells[1]?txt(tr.cells[1]):''});
      [...tr.cells].forEach(td=>{while(occ[(r0+y)+','+c])c++;const cs=td.colSpan||1,rs=td.rowSpan||1,rr=r0+y,v=txt(td),al=td.style.textAlign;
        const b=th||!!td.querySelector('b'),base={bd:1,b:b?1:0,...(th?{fill:TDXL_C.hd,h:'center',v:'center',wrap:1}:st?{fill:TDXL_C.st}:{})};
        const nm=!th&&c>0&&cs===1?num(v):null,s={...base,...(nm?{nf:nm.nf,h:al==='center'?'center':'right'}:al?{h:al}:{}),...(!th&&(c===1||cs>1)?{wrap:1}:{})};
        if(!th&&!nm&&!al&&cs===1&&(c===0||c>1&&v.length<=8))s.h='center';   // ลำดับ, หน่วย
        put(rr,c,nm?nm.v:v,s,!!nm);for(let a=0;a<rs;a++)for(let k=0;k<cs;k++)occ[(rr+a)+','+(c+k)]=1;
        merge(rr,c,rr+rs-1,Math.min(N-1,c+cs-1),s);if(v&&(s.wrap||th))tall(rr+rs-1,v,wide(c,Math.min(N-1,c+cs-1))-1);
        c+=cs});
      for(let x=0;x<N;x++)if(!occ[(r0+y)+','+x]&&!(rows[r0+y]||[])[x])put(r0+y,x,'',{bd:1,...(th?{fill:TDXL_C.hd}:st?{fill:TDXL_C.st}:{})});
      if(th&&!head)hd=1,head=[r0+y,r0+y];else if(th&&hd)head[1]=r0+y;
      if(th&&!hts[r0+y])hts[r0+y]=19});
    r=r0+tb.rows.length+1};
  const signs=el=>{const K=[...el.children];if(!K.length)return;r+=2;const per=N/K.length;
    K.forEach((k,i)=>{const c1=Math.round(i*per),c2=Math.round((i+1)*per)-1,v='ลงชื่อ ..................................\n'+txt(k),s={h:'center',wrap:1};put(r,c1,v,s);merge(r,c1,r,c2,s);tall(r,v,wide(c1,c2)-4)});r++};
  const walk=el=>{for(const c of el.childNodes){
    if(c.nodeType===3){line(c.textContent.replace(/\s+/g,' ').trim());continue}
    if(c.nodeType!==1||c.tagName==='STYLE'||c.tagName==='SCRIPT')continue;
    if(c.tagName==='TABLE'){table(c);continue}
    if(c.style.pageBreakBefore==='always'||c.style.breakBefore==='page'){if(r)brk.push(r);continue}
    if(c.tagName==='H1'){line(txt(c),{b:1,sz:14,h:'center',v:'center'});continue}
    if(c.querySelector('table')){walk(c);continue}
    const kids=[...c.children],d=getComputedStyle(c).display;
    if((d==='grid'||c.classList.contains('sign'))&&kids.length>1){signs(c);continue}
    if(d==='flex'&&kids.length>1){const a=txt(kids[0]),z=kids.slice(1).map(txt).join('   ');put(r,0,a,{});put(r,N-3,z,{h:'right'});merge(r,N-3,r,N-1,{h:'right'});r++;continue}
    line(txt(c),c.tagName==='P'&&c.firstElementChild&&c.firstElementChild.tagName==='B'&&txt(c)===txt(c.firstElementChild)?{b:1}:{})}};
  box.style.cssText='position:absolute;left:-9999px;top:0;width:1100px';document.body.appendChild(box);
  try{walk(box)}finally{box.remove()}
  return {rows,merges,hts,brk,head,TR,land:/size:\s*A4\s+landscape/.test(html)}}
const tdXlA=(r,c)=>{let s='';c++;while(c){const m=(c-1)%26;s=String.fromCharCode(65+m)+s;c=(c-m-1)/26}return s+(r+1)};
const tdXlE=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function tdXlSheetXml(g,cols,S){const N=cols.length,last=tdXlA(Math.max(0,g.rows.length-1),N-1);
  const rows=g.rows.map((R,y)=>{if(!R)return '';const cells=R.map((c,x)=>{if(!c)return '';const a=tdXlA(y,x),s=S.id(c.s||{});
      if(c.f)return `<c r="${a}" s="${s}"${c.n?'':' t="str"'}><f>${tdXlE(c.f)}</f><v>${tdXlE(c.v)}</v></c>`;
      return c.n?`<c r="${a}" s="${s}"><v>${c.v}</v></c>`:c.v===''?`<c r="${a}" s="${s}"/>`:`<c r="${a}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${tdXlE(c.v)}</t></is></c>`}).join('');
    return `<row r="${y+1}"${g.hts[y]?` ht="${Math.round(g.hts[y]*4)/4}" customHeight="1"`:''}>${cells}</row>`}).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`+
    `<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${last}"/><sheetViews><sheetView showGridLines="0" workbookViewId="0"/></sheetViews>`+
    `<sheetFormatPr defaultRowHeight="15"/><cols>${cols.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>`+
    `<sheetData>${rows}</sheetData>`+(g.merges.length?`<mergeCells count="${g.merges.length}">${g.merges.map(([a,b,c,d])=>`<mergeCell ref="${tdXlA(a,b)}:${tdXlA(c,d)}"/>`).join('')}</mergeCells>`:'')+
    `<printOptions horizontalCentered="1"/><pageMargins left="0.4" right="0.4" top="0.5" bottom="0.6" header="0.3" footer="0.3"/>`+
    `<pageSetup paperSize="9" orientation="${g.land?'landscape':'portrait'}" fitToWidth="1" fitToHeight="0"/>`+
    `<headerFooter><oddFooter>&amp;Cหน้า &amp;P / &amp;N</oddFooter></headerFooter>`+
    (g.brk.length?`<rowBreaks count="${g.brk.length}" manualBreakCount="${g.brk.length}">${g.brk.map(b=>`<brk id="${b}" max="16383" man="1"/>`).join('')}</rowBreaks>`:'')+`</worksheet>`}
// 4.91 (user: "ไม่ผูกสูตรหรอ"): the money cells are formulas, as in a ปร.4 made by hand. ปร.4: จำนวนเงิน = จำนวน × ราคาต่อหน่วย,
// รวม = วัสดุ + แรง, each หมวด total a SUM, the job total adds the หมวด totals; ปร.5 takes each หมวด from ปร.4 × Factor F, ปร.6 each
// part from ปร.5, then rounding down to the bid's step (less the discount), VAT on a private job (the amount in words stays text:
// BAHTTEXT is #NAME? outside Thai-aware Excel).
// Every formula keeps the printed number as its value, so the file shows the same figures before Excel recalculates.
function tdXlLink(G,forms,t){const A=tdXlA,rd=Math.max(1,n(t.round)),disc=n(t.disc),vat=n(t.vat)/100;
  const cell=(g,r,c)=>(g.rows[r]||[])[c],F=(g,r,c,f)=>{const x=cell(g,r,c);if(x&&x.n)x.f=f};
  const by=g=>{const o={};g.TR.forEach(x=>(o[x.t]=o[x.t]||[]).push(x));return Object.keys(o).map(i=>o[i])}
  const sh=nm=>`'${nm}'!`,ix=nm=>forms.findIndex(f=>f[0]===nm),p4=G[ix('ปร.4')],p5=G[ix('ปร.5')];
  if(p4){p4.subs=[];by(p4).forEach((L,ti)=>{let it=[];const subs=p4.subs[ti]=[];
    L.forEach(x=>{const r=x.r;if(/^\d+\.\d+$/.test(x.no)&&!x.st){F(p4,r,5,`C${r+1}*E${r+1}`);F(p4,r,7,`C${r+1}*G${r+1}`);
        const h=cell(p4,r,7);F(p4,r,8,h&&h.n?`F${r+1}+H${r+1}`:`F${r+1}`);it.push(r);return}
      if(!x.st)return;
      if(/^รวมค่างานต้นทุน/.test(x.lb)){[5,7,8].forEach(c=>{const L_=subs.filter(s=>(cell(p4,s,c)||{}).n);if(L_.length)F(p4,r,c,L_.map(s=>A(s,c)).join('+'))});return}
      if(it.length){[5,7,8].forEach(c=>F(p4,r,c,`SUM(${A(it[0],c)}:${A(it[it.length-1],c)})`));subs.push(r);it=[]}})})}
  const money=(g,L,src)=>{let rows=[],tot=null,rnd=null,vt=null;
    L.forEach(x=>{const r=x.r;
      if(/^\d+$/.test(x.no)&&!x.st){const ref=src(rows.length);if(ref)F(g,r,2,ref);F(g,r,4,`C${r+1}*D${r+1}`);rows.push(r);return}
      if(/^รวมค่าก่อสร้าง/.test(x.lb)&&rows.length){tot=r;[2,4].forEach(c=>F(g,r,c,`SUM(${A(rows[0],c)}:${A(rows[rows.length-1],c)})`));return}
      if(tot==null)return;const E=k=>`E${k+1}`;
      if(/^ปัดเศษ/.test(x.lb)){rnd=r;F(g,r,4,`ROUNDDOWN(${E(tot)}/${rd},0)*${rd}${disc?'-'+disc:''}-${E(tot)}`);return}
      if(/^ภาษีมูลค่าเพิ่ม/.test(x.lb)){vt=r;F(g,r,4,`ROUND((${E(tot)}${rnd!=null?'+'+E(rnd):''})*${vat},2)`);return}
      if(/^(ราคากลาง|ราคาที่เสนอ|รวมราคาที่เสนอ)/.test(x.lb)){F(g,r,4,[tot,rnd,vt].filter(k=>k!=null).map(E).join('+'));return}
});
    return tot};
  if(p5){p5.tot=[];by(p5).forEach((L,ti)=>{const S=p4&&p4.subs[ti];p5.tot[ti]=money(p5,L,i=>S&&S[i]!=null?sh('ปร.4')+'I'+(S[i]+1):null)})}
  const p6=G[ix('ปร.6')];if(p6)by(p6).forEach(L=>money(p6,L,i=>p5&&p5.tot[i]!=null?sh('ปร.5')+'C'+(p5.tot[i]+1):null));}
function tdXlBook(X,forms,t){const wb=X.utils.book_new(),S=tdXlStyles(),G=forms.map(([nm,html,cols])=>{X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet([['']]),nm);return tdXlGrid(html,cols)});
  if(t)tdXlLink(G,forms,t);
  wb.Workbook={Names:G.map((g,i)=>g.head&&{Name:'_xlnm.Print_Titles',Sheet:i,Ref:`'${forms[i][0]}'!$${g.head[0]+1}:$${g.head[1]+1}`}).filter(Boolean)};
  const raw=X.write(wb,{type:'array',bookType:'xlsx',compression:true}),C=X.CFB,z=C.read(new Uint8Array(raw),{type:'array'}),enc=new TextEncoder();
  const put=(p,t)=>{const e=C.find(z,p);if(!e)throw new Error('xlsx: '+p);e.content=enc.encode(t)};
  G.forEach((g,i)=>put(`/xl/worksheets/sheet${i+1}.xml`,tdXlSheetXml(g,forms[i][2],S)));put('/xl/styles.xml',S.xml());
  return C.write(z,{fileType:'zip',type:'array',compression:true})}
ACT.tdXl=async b=>{const t=tdById(b.dataset.id);if(!t)return;let X;
  try{X=await obLib()}catch(e){toast(e.message);return}
  const forms=TDXL.map(([k,nm,cols])=>[nm,PRINT[k]?PRINT[k](t.id):'',cols]).filter(f=>f[1]);
  const name=`${t.no||'TD'} ${t.purpose==='ref'?'ราคากลาง':'ปร.4-ปร.6'} ${(t.title||'').slice(0,60)}`.replace(/[\\/:*?"<>|]+/g,' ').trim()+'.xlsx';
  let data;try{data=tdXlBook(X,forms,t)}catch(e){toast('สร้างไฟล์ Excel ไม่สำเร็จ: '+e.message);return}
  toast(await download(name,data,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')?'ดาวน์โหลด Excel ปร.4 / ปร.5 / ปร.6 แล้ว':'ดาวน์โหลดไม่สำเร็จ')};
{const f=tdView;tdView=function(){let h=f();const t=curTd();if(!t)return h;
  const btn=`<button type="button" class="btn sm" data-a="tdXl" data-id="${t.id}">ดาวน์โหลด Excel ปร.4–ปร.6</button>`;
  const m=h.match(/<button type="button" class="btn sm( pri)?" data-a="print" data-k="pr6" data-id="[^"]+">พิมพ์ ปร\.6<\/button>/)||h.match(/<button type="button" class="btn sm" data-a="print" data-k="pr5" data-id="[^"]+">พิมพ์ ปร\.5<\/button>/);
  return m?h.replace(m[0],m[0]+btn):h}}
// 4.91 (user: "พื้นที่มี ทำไมเป็น 2 แถว"): the ปร.4–ปร.6 heading table (ชื่อโครงการ, แบบเลขที่ ...) took the payroll .kv grid look and
// squeezed its values into half the page; it is a full-width table again
document.head.insertAdjacentHTML('beforeend','<style>table.kv{display:table;width:100%;gap:0}</style>');
