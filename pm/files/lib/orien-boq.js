/* ORIEN standard BOQ Excel form (ORIEN-BOQ/1), written by PENUM PM and PENUM MEP with SheetJS.
   Sheets: สรุป (summary by section, overhead, discount, VAT, total in Thai words), BOQ (line items, material and labour
   apart, totals as formulas), ภายใน-ราคาทุน (internal copy only: cost, sell, profit per line) and a hidden PENUM sheet
   that names the format. Every line row carries a marker in a hidden last column (S section, H heading, Y type,
   I item, T total) so PENUM PM reads the file back line for line, including rows people edit or add in Excel.
   window.orienBoq.build(XLSX, doc, internal) → workbook
   doc = {co:{name, lines:[]}, meta:{src, title, pname, cust, no, date, site, mk, mkSep, vat},
          items:[{g, gname, head, type, desc, unit, q, mc, lc, ms, ls, rm}],   mc/lc cost per unit, ms/ls price per unit as
                                                                                  printed, ims/ils (optional) the real selling price on the internal sheet
          sum:{rows:[{name, v}], disc}}                                           rows: overhead and other lines under the total */
(function(){
const ID='ORIEN-BOQ/1',Z='#,##0.00',ZQ='General',SHEET={sum:'สรุป',boq:'BOQ',int:'ภายใน-ราคาทุน',meta:'PENUM'};
const r2=v=>Math.round((+v||0)*100)/100;
function bahtText(v){v=r2(v);const neg=v<0;v=Math.abs(v);const D=['','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'],U=['','สิบ','ร้อย','พัน','หมื่น','แสน'];
  const rd=s=>{let o='';const L=s.length;for(let i=0;i<L;i++){const d=+s[i],p=L-1-i;if(!d)continue;
    o+=p===1&&d===1?'สิบ':p===1&&d===2?'ยี่สิบ':p===0&&d===1&&L>1&&/[1-9]/.test(s.slice(0,-1))?'เอ็ด':D[d]+U[p]}return o};
  const big=s=>s.length<=6?rd(s):big(s.slice(0,-6))+'ล้าน'+rd(s.slice(-6));
  const b=Math.floor(v),st=Math.round((v-b)*100);if(!b&&!st)return 'ศูนย์บาทถ้วน';
  return (neg?'ลบ':'')+(b?big(String(b))+'บาท':'')+(st?rd(String(st).padStart(2,'0'))+'สตางค์':'ถ้วน')}
// numbers printed in the ลำดับ column: section 1, heading 1.1, item 1.1.1 (or 1.1 when the section has no headings);
// a heading that already starts with its own number (an imported BOQ) keeps it
function number(items){let gi=0,hi=0,li=0,lg=null,lh=null,hn='';return items.map(i=>{const r={};
  if(i.g!==lg){lg=i.g;gi++;hi=0;li=0;lh=null;hn='';r.sec=String(gi)}
  if((i.head||'')!==lh){lh=i.head||'';li=0;if(lh){hi++;let m=lh.match(/^(\d+(?:\.\d+)*)\s+(.*)$/);if(m&&m[1].includes('.')&&m[1].split('.')[0]!==String(gi))m=[m[0],gi+'.'+hi,m[2]];hn=m?m[1]:gi+'.'+hi;r.head=hn;r.headTxt=m?m[2]:lh}else hn=''}
  li++;const own=String(i.desc||'').match(/^(\d+(?:\.\d+)+)\s+(.*)$/);r.no=own?own[1]:hn?hn+'.'+li:gi+'.'+(hi+li);r.desc=own?own[2]:i.desc;if(!hn&&!own)hi++,li--;return r})}
function build(X,doc,internal){
  const wb=X.utils.book_new(),M=doc.meta||{},co=doc.co||{},its=doc.items||[],N=number(its),vat=M.vat==null?7:+M.vat;
  const head=(ws,rows,title)=>{const L=[co.name||'',...(co.lines||[]).filter(Boolean)];L.forEach((t,k)=>rows.push([t]));rows.push([title]);
    rows.push([[M.pname?'โครงการ: '+M.pname:'',M.title?'งาน: '+M.title:'',M.cust?'ลูกค้า: '+M.cust:''].filter(Boolean).join('   ')]);
    rows.push([[M.no?'เลขที่: '+M.no:'',M.date?'วันที่: '+M.date:'',M.site?'สถานที่: '+M.site:''].filter(Boolean).join('   ')]);rows.push([])};
  const cell=(v,z)=>typeof v==='number'?{t:'n',v:r2(v),z:z||Z}:v;
  const F=(f,v,z)=>({t:'n',f,v:r2(v),z:z||Z});
  // ---- BOQ (and the internal copy, same rows with cost columns)
  function lines(kind){const rows=[],I=kind==='int';head(null,rows,I?'เอกสารภายใน ห้ามส่งลูกค้า · ราคาทุน ราคาขาย และกำไรต่อรายการ':'BILL OF QUANTITIES · ใบแสดงรายการปริมาณงานและราคา');
    const H=I?['ลำดับ','รายการ','จำนวน','หน่วย','ทุนวัสดุ/หน่วย','ทุนค่าแรง/หน่วย','รวมทุน','ขายวัสดุ/หน่วย','ขายค่าแรง/หน่วย','รวมราคาขาย','กำไร (บาท)','กำไร % ของราคาขาย','PENUM']
      :['ลำดับ','รายการ','จำนวน','หน่วย','ค่าวัสดุ/หน่วย','รวมค่าวัสดุ','ค่าแรง/หน่วย','รวมค่าแรง','รวมเป็นเงิน','หมายเหตุ','PENUM'];
    rows.push(H);const mc=H.length-1,secTot=[];let s0=0,cur=null,lt='';
    const pad=(a,mark)=>{while(a.length<mc)a.push('');a[mc]=mark;return a};
    // a subtotal under each heading (meta.hsub, as the quotation prints it) when its section has more than one block; the section
    // total then adds only the lines (SUMIF on the marker column), so the subtotals are not counted twice
    const ML=String.fromCharCode(65+mc),multi=g=>{const I=its.filter(i=>i.g===g),H=new Set(I.map(i=>i.head||'').filter(Boolean));return !!M.hsub&&(H.size>1||H.size===1&&I.some(i=>!i.head))};
    let hc=null;const endH=()=>{if(!hc)return;const s=hc.s,e=rows.length,S=c=>`SUM(${c}${s}:${c}${e})`,v=hc.v,a=rows.length+1;
      rows.push(pad(I?['','รวม '+hc.no+' '+hc.txt,'','','','',F(S('G'),v.c),'','',F(S('J'),v.s),F(S('K'),v.s-v.c),F(`IF(J${a}=0,0,K${a}/J${a})`,v.s?(v.s-v.c)/v.s:0,'0.0%')]
        :['','รวม '+hc.no+' '+hc.txt,'','','',F(S('F'),v.m),'',F(S('H'),v.l),F(S('I'),v.m+v.l)],'T'));cur.ht=1;hc=null};
    const close=()=>{endH();if(!cur)return;const a=rows.length+1,s=s0,e=rows.length;const S=c=>cur.ht?`SUMIF(${ML}${s}:${ML}${e},"I",${c}${s}:${c}${e})`:`SUM(${c}${s}:${c}${e})`,v=f=>cur.v[f];
      rows.push(pad(I?['','รวมหมวด '+cur.no+' '+cur.name,'','','','',F(S('G'),v('c')),'','',F(S('J'),v('s')),F(S('K'),v('s')-v('c')),F(`IF(J${a}=0,0,K${a}/J${a})`,v('s')?(v('s')-v('c'))/v('s'):0,'0.0%')]
        :['','รวมหมวด '+cur.no+' '+cur.name,'','','',F(S('F'),v('m')),'',F(S('H'),v('l')),F(S('I'),v('m')+v('l'))],'T'));secTot.push(Object.assign({row:a},cur));rows.push([]);cur=null};
    its.forEach((i,k)=>{const n=N[k],q=+i.q||0;
      if(n.sec){close();cur={no:n.sec,name:i.gname||i.g||'',g:i.g,v:{m:0,l:0,c:0,s:0}};rows.push(pad([n.sec,cur.name],'S|'+(i.g||'')));s0=rows.length+1;lt=''}
      if(n.head||(!i.head&&hc)){endH();if(n.head){rows.push(pad([n.head,n.headTxt],'H|'+i.head));lt='';if(multi(i.g))hc={no:n.head,txt:n.headTxt,s:rows.length+1,v:{m:0,l:0,c:0,s:0}}}}
      if((i.type||'')!==lt){lt=i.type||'';if(lt)rows.push(pad(['','  '+lt],'Y|'+lt))}
      const r=rows.length+1,ms=+(I&&i.ims!=null?i.ims:i.ms)||0,ls=+(I&&i.ils!=null?i.ils:i.ls)||0,mc_=+i.mc||0,lc=+i.lc||0;[cur.v,hc&&hc.v].forEach(x=>{if(!x)return;x.m+=q*ms;x.l+=q*ls;x.c+=q*(mc_+lc);x.s+=q*(ms+ls)});
      const d=(i.head?'- ':'')+(n.desc||'');
      rows.push(pad(I?[n.no,d,cell(q,ZQ),i.unit||'',cell(mc_),cell(lc),F(`C${r}*(E${r}+F${r})`,q*(mc_+lc)),cell(ms),cell(ls),F(`C${r}*(H${r}+I${r})`,q*(ms+ls)),F(`J${r}-G${r}`,q*(ms+ls-mc_-lc)),F(`IF(J${r}=0,0,K${r}/J${r})`,ms+ls?(ms+ls-mc_-lc)/(ms+ls):0,'0.0%')]
        :[n.no,d,cell(q,ZQ),i.unit||'',cell(ms),F(`C${r}*E${r}`,q*ms),cell(ls),F(`C${r}*G${r}`,q*ls),F(`F${r}+H${r}`,q*(ms+ls)),i.rm||''],'I'))});
    close();
    const a=rows.length+1,T=f=>secTot.reduce((x,s)=>x+s.v[f],0),SS=c=>secTot.map(s=>c+s.row).join('+')||'0';
    rows.push(pad(I?['','รวมทุกหมวด','','','','',F(SS('G'),T('c')),'','',F(SS('J'),T('s')),F(SS('K'),T('s')-T('c')),F(`IF(J${a}=0,0,K${a}/J${a})`,T('s')?(T('s')-T('c'))/T('s'):0,'0.0%')]
      :['','รวมทุกหมวด','','','',F(SS('F'),T('m')),'',F(SS('H'),T('l')),F(SS('I'),T('m')+T('l'))],'T'));
    const ws=X.utils.aoa_to_sheet(rows);
    ws['!cols']=(I?[8,48,9,8,13,13,14,13,13,14,13,8]:[8,52,9,8,13,14,13,14,15,18]).map(w=>({wch:w})).concat([{wch:4,hidden:true}]);
    ws['!merges']=rows.map((r,k)=>r.length===1&&r[0]!==''?{s:{r:k,c:0},e:{r:k,c:mc-1}}:/^[SHY]/.test(String(r[mc]||''))?{s:{r:k,c:1},e:{r:k,c:I?mc-1:mc-2}}:null).filter(Boolean);
    return {ws,secTot,total:a,rows,mc}}
  const B=lines('boq');
  // ---- summary page: one row per section from the BOQ sheet, then the lines under the total, VAT and the amount in words
  const rows=[];head(null,rows,'ใบสรุปราคา · PRICE SUMMARY');rows.push(['ลำดับ','หมวดงาน','ค่าวัสดุ','ค่าแรง','รวมเป็นเงิน']);
  const Q=`'${SHEET.boq}'!`;B.secTot.forEach((s,k)=>rows.push([k+1,s.name,F(Q+'F'+s.row,s.v.m),F(Q+'H'+s.row,s.v.l),F(Q+'I'+s.row,s.v.m+s.v.l)]));
  const tm=B.secTot.reduce((x,s)=>x+s.v.m,0),tl=B.secTot.reduce((x,s)=>x+s.v.l,0),t0=rows.length+1,s1=rows.length-B.secTot.length+1;
  rows.push(['','รวมค่าวัสดุและค่าแรง',F(`SUM(C${s1}:C${t0-1})`,tm),F(`SUM(D${s1}:D${t0-1})`,tl),F(`SUM(E${s1}:E${t0-1})`,tm+tl)]);
  const sr=(doc.sum&&doc.sum.rows||[]).filter(x=>x&&(x.v||x.name));let tot=tm+tl,refs=['E'+t0];
  sr.forEach(x=>{rows.push(['',x.name||'','','',cell(+x.v||0)]);refs.push('E'+rows.length);tot+=+x.v||0});
  let last='E'+t0;if(sr.length){rows.push(['','รวม','','',F(refs.join('+'),tot)]);last='E'+rows.length}
  const disc=+(doc.sum&&doc.sum.disc)||0;if(disc){rows.push(['','ส่วนลด','','',cell(-disc)]);const d=rows.length;rows.push(['','รวมหลังหักส่วนลด','','',F(`${last}+E${d}`,tot-disc)]);last='E'+rows.length;tot-=disc}
  const vv=r2(tot*vat/100);rows.push(['',`ภาษีมูลค่าเพิ่ม ${vat}%`,'','',F(`ROUND(${last}*${vat}/100,2)`,vv)]);const vr=rows.length;
  rows.push(['','รวมเป็นเงินทั้งสิ้น','','',F(`${last}+E${vr}`,tot+vv)]);rows.push(['','('+bahtText(tot+vv)+')']);
  const S=X.utils.aoa_to_sheet(rows);S['!cols']=[{wch:8},{wch:52},{wch:16},{wch:16},{wch:18}];
  S['!merges']=rows.map((r,k)=>r.length===1&&r[0]!==''?{s:{r:k,c:0},e:{r:k,c:4}}:null).filter(Boolean);
  X.utils.book_append_sheet(wb,S,SHEET.sum);X.utils.book_append_sheet(wb,B.ws,SHEET.boq);const IN=internal&&lines('int');
  if(IN)X.utils.book_append_sheet(wb,IN.ws,SHEET.int);
  // what each row is, for the borders, bold totals and print setup added in bytes()
  const nh=1+(co.lines||[]).filter(Boolean).length,kinds=(R,mc)=>R.map((r,k)=>{if(k<nh)return k?'':'co';if(k===nh)return 'title';if(k<nh+3)return '';
    if(r[0]==='ลำดับ')return 'hdr';const m=mc!=null?String(r[mc]||'').charAt(0):'',d=String(r[1]||'');
    if(mc!=null)return m==='S'?'sec':m==='H'?'head':m==='Y'?'type':m==='I'?'item':m==='T'?(/^รวมทุกหมวด/.test(d)?'grand':/^รวมหมวด/.test(d)?'tot':'htot'):'';
    return typeof r[0]==='number'?'item':/^รวมเป็นเงินทั้งสิ้น/.test(d)?'grand':/^\(/.test(d)?'words':/^รวม/.test(d)?'tot':r.length>1?'item':''});
  wb.__ob={[SHEET.sum]:{k:kinds(rows),n:5,land:0},[SHEET.boq]:{k:kinds(B.rows,B.mc),n:B.mc,land:1,hr:B.rows.findIndex(r=>r[0]==='ลำดับ')}};
  if(IN)wb.__ob[SHEET.int]={k:kinds(IN.rows,IN.mc),n:IN.mc,land:1,pct:[11],hr:IN.rows.findIndex(r=>r[0]==='ลำดับ'),warn:1};
  const meta=Object.assign({},M,{kind:internal?'internal':'customer',rows:sr.map(x=>Object.assign({name:x.name||'',v:r2(x.v),pct:x.pct||''},x.mk?{mk:1}:{})),disc:r2(disc),total:r2(tot+vv)});
  if(!internal){delete meta.mk;delete meta.mkSep}
  X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet([[ID],[JSON.stringify(meta)],['ไฟล์นี้ทำจาก PENUM ตามแบบฟอร์ม BOQ มาตรฐาน ORIEN นำเข้ากลับใน PENUM PM ได้ครบทุกบรรทัด']]),SHEET.meta);
  wb.Workbook={Sheets:wb.SheetNames.map(n=>({Hidden:n===SHEET.meta?1:0}))};
  return wb}
async function load(base){const has=()=>window.XLSX;if(!has())await new Promise((ok,no)=>{const s=document.createElement('script');s.src=base+'xlsx.full.min.js';s.onload=ok;s.onerror=()=>no(new Error('โหลดตัวเขียนไฟล์ Excel ไม่สำเร็จ ต้องต่ออินเทอร์เน็ตครั้งแรก'));document.head.appendChild(s)});return window.XLSX}
// the file as bytes: XLSX.write keeps the formulas with their values, so the file opens with every total filled in
// SheetJS (community) writes no cell styles: the borders, header colour, bold totals, A4 fit-to-width and a header row that
// repeats on every printed page are put into the file's XML afterwards
const STY=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.0%"/></numFmts>
<fonts count="6"><font><sz val="10"/><name val="Tahoma"/><family val="2"/></font><font><b/><sz val="10"/><name val="Tahoma"/><family val="2"/></font><font><b/><sz val="14"/><name val="Tahoma"/><family val="2"/></font><font><b/><sz val="12"/><color rgb="FFB42318"/><name val="Tahoma"/><family val="2"/></font><font><i/><sz val="10"/><name val="Tahoma"/><family val="2"/></font><font><b/><sz val="12"/><name val="Tahoma"/><family val="2"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDAF2D0"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEF2F1"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="17">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="4" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="4" fontId="1" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="164" fontId="1" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="4" fontId="1" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>
</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0"/></styleSheet>`;
const COLS=n=>Array.from({length:n},(_,i)=>String.fromCharCode(65+i));
function styleOf(kind,col,num,o){const pc=(o.pct||[]).includes(col);switch(kind){
  case 'co':return col?0:10;case 'title':return col?0:o.warn?11:9;case 'hdr':return 4;case 'sec':return 5;case 'head':return num?2:15;case 'type':return 16;
  case 'item':return pc?7:col===0||col===2&&o.land||col===3&&o.land?3:num?2:1;case 'tot':case 'htot':return pc?8:num?6:5;case 'grand':return pc?8:num?12:13;case 'words':return 14;default:return 0}}
function polish(xml,o){const L=COLS(o.n);
  xml=xml.replace(/<row r="(\d+)"([^>]*)>([\s\S]*?)<\/row>/g,(m,r,a,body)=>{const kind=o.k[r-1]||'',box=['hdr','sec','head','type','item','tot','htot','grand'].includes(kind);const cells={};
    body.replace(/<c r="([A-Z]+)\d+"([^>]*?)(\/>|>[\s\S]*?<\/c>)/g,(c,col,at,rest)=>{cells[col]={at:at.replace(/\s*s="\d+"/,''),rest};return ''});
    const keys=box?[...new Set([...L,...Object.keys(cells)])]:Object.keys(cells);keys.sort((x,y)=>x.length-y.length||(x<y?-1:1));
    return `<row r="${r}"${a}>`+keys.map(col=>{const c=cells[col],ci=col.charCodeAt(0)-65;if(ci>=o.n)return c?`<c r="${col}${r}"${c.at}${c.rest}`:'';
      const num=c&&!/t="(s|str|b|e|inlineStr)"/.test(c.at)&&/<v>/.test(c.rest),st=styleOf(kind,ci,num,o);return c?`<c r="${col}${r}"${c.at} s="${st}"${c.rest}`:`<c r="${col}${r}" s="${st}"/>`}).join('')+'</row>'});
  xml=xml.replace(/(<worksheet[^>]*>)/,'$1<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>');
  const ps=`<pageSetup paperSize="9" orientation="${o.land?'landscape':'portrait'}" fitToWidth="1" fitToHeight="0"/>`;
  return /<pageMargins[^>]*\/>/.test(xml)?xml.replace(/(<pageMargins[^>]*\/>)/,'$1'+ps):xml.replace('</worksheet>',ps+'</worksheet>')}
function bytes(X,wb){const O=wb.__ob;
  if(O)wb.Workbook.Names=Object.keys(O).filter(n=>O[n].hr>=0&&O[n].hr!=null).map(n=>({Name:'_xlnm.Print_Titles',Sheet:wb.SheetNames.indexOf(n),Ref:`'${n}'!$${O[n].hr+1}:$${O[n].hr+1}`}));
  wb.SheetNames.forEach(n=>{wb.Sheets[n]['!margins']={left:0.4,right:0.4,top:0.5,bottom:0.5,header:0.3,footer:0.3}});
  const raw=X.write(wb,{type:'array',bookType:'xlsx',compression:true});if(!O||!X.CFB)return raw;
  try{const C=X.CFB,z=C.read(new Uint8Array(raw),{type:'array'}),dec=new TextDecoder(),enc=new TextEncoder();
    const put=(p,t)=>{const e=C.find(z,p);if(e)e.content=enc.encode(t)};put('/xl/styles.xml',STY);
    wb.SheetNames.forEach((n,i)=>{const o=O[n],e=C.find(z,`/xl/worksheets/sheet${i+1}.xml`);if(o&&e)put(`/xl/worksheets/sheet${i+1}.xml`,polish(dec.decode(e.content),o))});
    return C.write(z,{fileType:'zip',type:'array',compression:true})}catch(e){return raw}}
window.orienBoq={ID,SHEET,build,bytes,load,bahtText};
})();
