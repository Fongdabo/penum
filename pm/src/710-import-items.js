/* ---------- 3.21: line items from files made outside the program (Excel, CSV, PDF, or a pasted table) ----------
   Works for a quotation, a tender price and a project BOQ. Everything is read in the browser; nothing is uploaded.
   Excel/CSV go through SheetJS, text PDFs through pdf.js (both shipped in files/lib and loaded only when needed).
   Steps: pick the sheet and the header row → say which column is which (remembered per header layout) → check and
   fix the rows → import (replace or add to the end). Section rows become groups; subtotal / VAT / total rows are skipped. */
const IMP={};// the open import: {t, id, name, sheets:{name:rows}, sheet, hr, map, rows}
const IMPF=[['','– ไม่ใช้ –'],['no','ลำดับ'],['desc','รายการ'],['q','จำนวน'],['unit','หน่วย'],['m','ค่าวัสดุ/หน่วย'],['l','ค่าแรง/หน่วย'],['up','ราคา/หน่วย (รวม)'],['amt','จำนวนเงินรวม']];
const IMPKEY='pmImpMap';
function libLoad(src){return new Promise((ok,no)=>{if(document.querySelector(`script[data-lib="${src}"]`)){const t=setInterval(()=>{if(src.includes('xlsx')?window.XLSX:window.pdfjsLib){clearInterval(t);ok()}},50);return}
  const s=document.createElement('script');s.src='files/lib/'+src;s.dataset.lib=src;s.onload=()=>ok();s.onerror=()=>no(new Error('โหลดตัวอ่านไฟล์ไม่สำเร็จ ต้องต่ออินเทอร์เน็ตครั้งแรก'));document.head.appendChild(s)})}
const impNum=v=>{if(typeof v==='number')return v;let s=String(v??'').replace(/[,\s฿]|บาท/g,'').trim();if(!s||s==='-')return 0;const neg=/^\(.*\)$/.test(s);s=s.replace(/[()]/g,'');if(!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s))return NaN;const x=parseFloat(s);return neg?-x:x};
const impIsNum=v=>{const s=String(v??'').trim();return s!==''&&s!=='-'&&!isNaN(impNum(s))};
// PDFs often carry Thai marks as private-use glyphs (U+F700–F71A) and ำ as ํ+า; put them back so headers and words match
const IMPPUA='\u0E10\u0E34\u0E35\u0E36\u0E37\u0E48\u0E49\u0E4A\u0E4B\u0E4C\u0E48\u0E49\u0E4A\u0E4B\u0E4C\u0E0D\u0E31\u0E4D\u0E47\u0E48\u0E49\u0E4A\u0E4B\u0E4C\u0E38\u0E39\u0E3A';
// Windows "Microsoft Print to PDF" writes some tone marks as É Ê … ("สืÉอสาร" = สื่อสาร, "นํÊา" = น้ำ)
const impThai=s=>s.replace(/([\u0E01-\u0E4E])[\u0400-\u04FF]+/g,'$1').replace(/([\u0E01-\u0E4E])([\u00C9-\u00CD])/g,(x,a,b)=>a+'\u0E48\u0E49\u0E4A\u0E4B\u0E4C'[b.charCodeAt(0)-0xC9]).replace(/[\uF700-\uF71A]/g,c=>IMPPUA[c.charCodeAt(0)-0xF700]).replace(/\u0E4D([\u0E48-\u0E4B]?)\u0E32/g,'$1\u0E33').replace(/([\u0E48-\u0E4B]?)\u0E32\s?\u0E4D/g,'$1\u0E33').replace(/\s+(?=[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E])/g,'');
const impTxt=v=>impThai(String(v??'')).replace(/\s+/g,' ').trim();
// ---- readers ----
async function impReadSheet(file){await libLoad('xlsx.full.min.js');const buf=await file.arrayBuffer(),wb=XLSX.read(buf,{type:'array',cellDates:false,codepage:874,cellStyles:true});
  const out={};wb.SheetNames.forEach(n=>{const ws=wb.Sheets[n];if(!ws['!ref'])return;const r0=XLSX.utils.decode_range(ws['!ref']).s.r,
    rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:'',blankrows:true}),hid=ws['!rows']||[];
    if(r0)rows.unshift(...Array(r0).fill(null).map(()=>[]));
    // a merged header cell is copied across the columns it covers, so two-row headers read as "ค่าวัสดุ ราคาต่อหน่วย"
    (ws['!merges']||[]).forEach(m=>{const v=(rows[m.s.r]||[])[m.s.c];for(let r=m.s.r;r<=m.e.r;r++)for(let c=m.s.c;c<=m.e.c;c++){rows[r]=rows[r]||[];if(rows[r][c]===''||rows[r][c]==null)rows[r][c]=v}});
    // rows hidden in Excel (filter details the sender folded away) are not part of what the customer sees
    const R=rows.filter((r,i)=>r&&!(hid[i]&&hid[i].hidden)&&r.some(c=>impTxt(c)));if(R.length)out[n]=R});return out}
async function impReadPdf(file){await libLoad('pdf.min.js');pdfjsLib.GlobalWorkerOptions.workerSrc='files/lib/pdf.worker.min.js';
  const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise,pages=[];let chars=0;
  const mark=/^[ัิ-ฺ็-๎-]/;// a Thai vowel/tone mark that belongs to the letter before it
  for(let pg=1;pg<=pdf.numPages;pg++){const page=await pdf.getPage(pg),tc=await page.getTextContent(),L=[];
    tc.items.forEach(it=>{const s=it.str;if(!s||!s.trim())return;chars+=s.trim().length;const x=it.transform[4],y=it.transform[5],w=it.width||s.length*4;
      let ln=L.find(l=>Math.abs(l.y-y)<3.5);if(!ln){ln={y,it:[]};L.push(ln)}ln.it.push({x,e:x+w,s})});
    pages.push(L.sort((a,b)=>b.y-a.y).map(l=>{l.it.sort((a,b)=>a.x-b.x);const cells=[];l.it.forEach(t=>{const c=cells[cells.length-1];
      if(c&&t.x-c.e<4.5){c.s+=(t.x-c.e>1.5&&!mark.test(t.s)?' ':'')+t.s;c.e=Math.max(c.e,t.e)}else cells.push({x:t.x,e:t.e,s:t.s})});return {y:l.y,cells,pg}}))}
  if(chars<20)return {scan:true};
  // fonts without a character map read as junk ("G(VV4..4ÿ9W/4"): a priced table always has a 1,234 somewhere
  if(chars>200&&!pages.some(L=>L.some(l=>l.cells.some(c=>/\d,\d{3}/.test(c.s)))))return {junk:true};
  const txt=l=>l.cells.map(c=>impTxt(c.s)).join('').replace(/\s/g,''),num=l=>l.cells.some(c=>impIsNum(c.s)),isHdr=l=>impHits(l.cells.map(c=>c.s))>=2&&!num(l)&&l.cells.some(c=>/รายการ|รายละเอียด|description|จำนวน(?!เงิน)|ปริมาณ|q'?ty|quantity/i.test(impTxt(c.s)));
  // running headers/footers (address, e-mail) repeat on every page: drop them
  const seen={};pages.forEach((L,pi)=>L.forEach(l=>{(seen[txt(l)]=seen[txt(l)]||new Set()).add(pi)}));
  // a table starts at each header line; the next page's identical header continues it unless the table already
  // reached its grand total / VAT. Lines just above/below a header ("MATERIAL  LABOR", "TOTAL  TOTAL") belong to it.
  const band=(l,h)=>l&&!num(l)&&!isHdr(l)&&l.cells.length<=6&&Math.abs(l.y-h.y)<26&&l.cells.every(c=>impTxt(c.s).length<=20);
  const segs=[];let cur=null;
  pages.forEach(L=>{const skip=new Set();L.forEach((l,i)=>{if(!isHdr(l))return;if(band(L[i-1],l))skip.add(i-1);if(band(L[i+1],l))skip.add(i+1)});
    L.forEach((l,i)=>{if(isHdr(l)){const lab=l.cells.map(c=>impTxt(c.s)).filter(Boolean).join('|');
        if(cur&&cur.lab===lab&&!cur.end&&cur.last!==l.pg){// continuation: line its columns up with the first page of the table
          const d=[];l.cells.forEach(c=>{const o=cur.hdr.cells.find(k=>impTxt(k.s)===impTxt(c.s));if(o)d.push(o.x-c.x)});d.sort((a,b)=>a-b);cur.dx=d.length?d[d.length>>1]:0;cur.last=l.pg;cur.pages.push(l.pg);return}
        cur={lab,hdr:l,above:skip.has(i-1)?L[i-1]:null,below:skip.has(i+1)?L[i+1]:null,lines:[],dx:0,end:false,last:l.pg,pages:[l.pg]};segs.push(cur);return}
      if(!cur||skip.has(i))return;if(seen[txt(l)].size>1&&!num(l))return;
      if(num(l))cur.pages.push(l.pg);cur.lines.push({y:l.y,cells:l.cells.map(c=>({x:c.x+cur.dx,e:c.e+cur.dx,s:c.s}))});
      if(/^(grand total|รวมทั้งสิ้น|vat|ภาษีมูลค่าเพิ่ม)/i.test(impTxt(l.cells.find(c=>!impIsNum(c.s))?.s)))cur.end=true})});
  const grid=seg=>{const lines=[seg.hdr,...seg.lines];// columns: cluster cell middles, then place every cell in its column
    const mids=lines.flatMap(l=>l.cells.map(c=>(c.x+c.e)/2)).sort((a,b)=>a-b),cols=[];mids.forEach(m=>{const k=cols[cols.length-1];if(k&&m-k.hi<14){k.hi=m;k.n++}else cols.push({lo:m,hi:m,n:1})});
    const C=cols.filter(k=>k.n>=2||seg.hdr.cells.some(c=>{const m=(c.x+c.e)/2;return m>=k.lo&&m<=k.hi})),col=c=>{const m=(c.x+c.e)/2;let best=0,d=1e9;C.forEach((k,i)=>{const dd=m<k.lo?k.lo-m:m>k.hi?m-k.hi:0;if(dd<d){d=dd;best=i}});return best};
    const row=l=>{const r=Array(C.length).fill('');l.cells.forEach(c=>{const i=col(c);r[i]=r[i]?r[i]+' '+c.s:c.s});return r};
    // the header: its own words, else the nearest word of the line above (MATERIAL over price and amount), plus the word below (TOTAL)
    const H=row(seg.hdr),mid=k=>(k.lo+k.hi)/2,near=(l,k,max)=>{if(!l)return '';let b=null,d=max;l.cells.forEach(c=>{const dd=Math.abs((c.x+c.e)/2-mid(k));if(dd<d){d=dd;b=c}});return b?b.s:''};
    const ab=seg.above?C.map(k=>near(seg.above,k,140)):[],be=seg.below?C.map(k=>near(seg.below,k,30)):[];
    const head=C.map((k,i)=>impTxt([H[i]||ab[i]||'',be[i]||''].join(' ')));
    // a header centred over right-aligned numbers (or left-aligned text) in a wide column clusters apart from them: an empty
    // headed column takes the cells of the unheaded column beside it
    const D=seg.lines.map(row),cnt=c=>D.filter(r=>impTxt(r[c])).length;
    head.forEach((h,c)=>{if(!h||cnt(c))return;const N=[c-1,c+1].filter(k=>k>=0&&k<head.length&&!head[k]&&cnt(k));if(!N.length)return;
      const k=N.length>1&&cnt(N[0])>cnt(N[1])?N[0]:N[N.length-1];D.forEach(r=>{r[c]=r[k];r[k]=''})});
    return [head,...D]};
  if(!segs.length){segs.push({hdr:{cells:[]},lines:pages.flat(),pages:[1]})}
  const out={};segs.forEach(sg=>{const a=Math.min(...sg.pages),b=Math.max(...sg.pages);let k='ตารางหน้า '+(a===b?a:a+'–'+b);while(out[k])k+=' ';out[k]=grid(sg)});
  // lines outside the tables (summary rows on another page) are still read for the overhead / discount rows
  return {sheets:out,lines:pages.flat().map(l=>l.cells.map(c=>impTxt(c.s)).filter(Boolean).join('  '))}}
// Thai CSV from older Excel is TIS-620 (windows-874), newer files are UTF-8
async function impDecode(file){const b=new Uint8Array(await file.arrayBuffer());let t;try{t=new TextDecoder('utf-8',{fatal:true}).decode(b)}catch(e){t=new TextDecoder('windows-874').decode(b)}return t.replace(/^\ufeff/,'')}
function impReadText(txt){const lines=String(txt||'').replace(/\r/g,'').split('\n').filter(l=>l.trim());if(!lines.length)return {};
  const tab=lines.some(l=>l.includes('\t')),sep=tab?'\t':(lines[0].split(';').length>lines[0].split(',').length?';':',');
  const cut=l=>{if(sep==='\t')return l.split('\t');const out=[];let cur='',q=false;for(const ch of l){if(ch==='"'){q=!q;continue}if(ch===sep&&!q){out.push(cur);cur=''}else cur+=ch}out.push(cur);return out};
  return {'ตารางที่วาง':lines.map(cut)}}
// ---- understanding the table ----
const IMPHD=[['no',/^(ลำดับ|ที่|no\.?|item|#)$/i],['desc',/รายการ|รายละเอียด|description|desc|ชื่อ/i],['q',/จำนวน(?!เงิน)|ปริมาณ|q'?ty|quantity/i],['unit',/(?<!ต่อ|\/|ละ)หน่วย(?!ละ)(?!.*ราคา)|^unit$/i],
  ['m',/(วัสดุ|ของ|material).*(ต่อหน่วย|\/หน่วย|unit|ราคา)|(ต่อหน่วย|ราคา).*(วัสดุ|material)|^(ค่า)?(วัสดุ|ของ|materials?)( cost)?(\s*@)?$/i],
  ['l',/(แรง|labou?r|ติดตั้ง).*(ต่อหน่วย|\/หน่วย|unit|ราคา)|(ต่อหน่วย|ราคา).*(แรง|labou?r)|^(ค่า)?(แรง|แรงงาน|labou?r|ติดตั้ง)( cost)?(\s*@)?$/i],
  ['up',/ราคา\s*ต่อ\s*หน่วย|ราคา\s*\/\s*หน่วย|unit ?price|rate/i],['amt',/^(รวม|รวมเงิน|จำนวน\s*เงิน|ราคารวม|amount|total|grand total|รวมทั้งสิ้น)/i]];
const impHits=r=>(r||[]).filter(c=>IMPHD.some(([,re])=>re.test(impTxt(c)))).length;
function impHeaderRow(rows){let best=0,score=-1;rows.slice(0,40).forEach((r,i)=>{const s=impHits(r);if(s>score){score=s;best=i}});if(score<2)return 0;
  // the second line of a two-line header ("ราคาต่อหน่วย | จำนวนเงิน" under "ค่าวัสดุ | ค่าแรง") scores well too: start at the line above it
  return best>0&&impHits(rows[best-1])>=2&&!rows[best].some(impIsNum)?best-1:best}
function impLabels(rows,hr){const h=rows[hr]||[],nx=rows[hr+1]||[],nt=nx.map(impTxt).filter(Boolean);
  // a second header line has header words, or only short words; a section heading ("1  งานระบบปรับอากาศ") is not one
  const two=nx.length&&!nx.some(impIsNum)&&nt.length>=2&&(impHits(nx)>=1||nt.every(t=>t.length<=20&&!/^\d/.test(t)));
  const n=Math.max(...rows.slice(hr,hr+30).map(r=>r.length),0);return {two,lab:Array.from({length:n},(_,c)=>[...new Set([h[c],two?nx[c]:''].map(impTxt).filter(Boolean))].join(' '))}}
function impGuess(lab){const used=new Set(),map=lab.map(()=>'');
  // the most specific fields first, so "ค่าวัสดุ ราคาต่อหน่วย" is material and not the combined price
  for(const f of ['m','l','desc','q','unit','no','up','amt'])lab.forEach((t,c)=>{if(map[c]||used.has(f))return;const re=IMPHD.find(x=>x[0]===f)[1];
    if(re.test(t)&&!(f==='q'&&/เงิน|ราคา/.test(t))){map[c]=f;used.add(f)}});
  return map}
// price columns without a header of their own: a column whose values are quantity × the column on its left is an
// amount, and that left column is a unit price (the first pair is material, the second labour)
function impPairs(rows,hr,two,map){if(['m','l','up'].some(f=>map.includes(f))||!map.includes('q'))return map;const qc=map.indexOf('q'),D=rows.slice(hr+(two?2:1)),P=[];
  for(let a=qc+1;a<map.length-1;a++){if(map[a]||P.some(p=>p[1]===a))continue;for(let b=a+1;b<=Math.min(a+3,map.length-1);b++){if(map[b])continue;let ok=0,tot=0;
    D.forEach(r=>{const q=impNum(r[qc]),x=impNum(r[a]),y=impNum(r[b]);if(!(q>0)||isNaN(x)||isNaN(y)||!x||!y)return;tot++;if(Math.abs(y-q*x)<=Math.max(1,y*0.005))ok++});
    if(tot>=2&&ok>=tot*0.6){P.push([a,b]);break}}}
  const M=map.slice();if(P.length===1)M[P[0][0]]='up';else if(P.length>=2){M[P[0][0]]='m';M[P[1][0]]='l'}return M}
// no column is headed "รายการ" (a PDF header split over three lines): the description is the column with the longest text
function impDescCol(rows,hr,two,map){if(map.includes('desc'))return map;const D=rows.slice(hr+(two?2:1),hr+(two?2:1)+80);let best=-1,bl=5;
  map.forEach((f,c)=>{if(f)return;const T=D.map(r=>impTxt(r[c])).filter(t=>t&&!impIsNum(t));if(T.length<3)return;const a=T.reduce((x,t)=>x+t.length,0)/T.length;if(a>bl){bl=a;best=c}});
  if(best<0)return map;const M=map.slice();M[best]='desc';return M}
const impMapFor=(rows,hr,two,lab)=>impPairs(rows,hr,two,impDescCol(rows,hr,two,impMapOf(lab)));
const impSig=lab=>lab.map(t=>t.slice(0,24)).join('|');
function impMapOf(lab){try{const M=JSON.parse(localStorage.getItem(IMPKEY)||'{}')[impSig(lab)];if(M&&M.length===lab.length)return M}catch(e){}return impGuess(lab)}
function impRemember(lab,map){try{const M=JSON.parse(localStorage.getItem(IMPKEY)||'{}');M[impSig(lab)]=map;const k=Object.keys(M);if(k.length>40)delete M[k[0]];localStorage.setItem(IMPKEY,JSON.stringify(M))}catch(e){}}
const IMPEXTRA=/^(safety|ค่าความปลอดภัย|over ?head|ค่าดำเนินการ|ค่าใช้จ่ายทั่วไป|กำไร(?!.*สุทธิ)|profit|factor|transportation|ค่าขนส่ง)/i,IMPDISC=/^(discount|ส่วนลด)/i;
const IMPSKIP=/^(รวม|ยอดรวม|รวมทั้งสิ้น|รวมเงิน|รวมราคา|รวมค่า|มูลค่ารวม|ภาษี|vat|total|toltal|sub ?total|sum\b|grand total|ส่วนลด|discount|หมายเหตุ|note|safety|ค่าความปลอดภัย|over ?head|ค่าดำเนินการ|ค่าใช้จ่ายทั่วไป|กำไร|profit)/i;
const IMPEND=/^(grand total|รวมทั้งสิ้น|มูลค่ารวม|toltal|vat|ภาษีมูลค่าเพิ่ม)/i;
const impNoOk=t=>/^(\d+(\.\d+)*\.?|[a-zก-ฮ][.)]?)$/i.test(t);
function impItems(rows,hr,two,map){const col=f=>map.indexOf(f),get=(r,f)=>{const c=col(f);return c<0?'':r[c]};const out=[],heads=new Set();let g='',sys='',sec='',hd='',hdNo='',sub='',numbered=false,stop=false;
  // the description is all the text between the number column and the first price/quantity column: PDFs and merged
  // cells often spread it over several columns ("- 15,400 BTU/hr" | "Cassette Type Model : FDT45KXE6F")
  const dc=col('desc'),nc=col('no'),stopC=map.findIndex((f,i)=>i>Math.max(dc,nc)&&f&&f!=='desc'&&f!=='no'),
    tcols=dc<0?[]:map.map((f,i)=>i).filter(i=>i===dc||(!map[i]&&i>nc&&(stopC<0||i<stopC)));
  rows.slice(hr+(two?2:1)).forEach(r=>{if(stop)return;
    let no=impTxt(get(r,'no')),desc=impTxt(tcols.map(i=>i!==dc&&impIsNum(r[i])?'':r[i]).join(' '));
    // "1.1 Fan Coil Unit" read as one cell, or a description that started in the number column
    if(no&&!impNoOk(no)){const k=no.match(/^(\d+(?:\.\d+)*)\.?\s+(.+)$/);if(k){no=k[1];desc=impTxt(k[2]+' '+desc)}else{desc=impTxt(no+' '+desc);no=''}}
    if(!no){const k=desc.match(/^(\d+\.\d+(?:\.\d+)*)\s+(.+)$/);if(k&&col('no')>=0){no=k[1];desc=k[2]}}
    if(!desc&&!no)return;
    const q=impNum(get(r,'q')),m=impNum(get(r,'m')),l=impNum(get(r,'l')),up=impNum(get(r,'up')),amt=impNum(get(r,'amt'));
    const has=v=>!isNaN(v)&&v!==0,text=desc||no;
    if(IMPEND.test(text)){stop=true;return}
    if(IMPSKIP.test(text)||IMPSKIP.test(no))return;
    if(/^(transportation|ค่าขนส่ง)/i.test(text)&&!has(q))return;// a below-the-line charge, read by impExtras
    if(!has(q)&&!has(m)&&!has(l)&&!has(up)&&!has(amt)){if(text.length<2)return;// a heading: group (1), sub-heading (1.1) or a plain line under it
      const t=impTxt((no?no+' ':'')+desc).slice(0,80);
      if(/^\d+$/.test(no)){g=desc.slice(0,80)||t;sec=t;hd='';hdNo='';sub='';numbered=true;heads.add(no)}else if(no){hd=t;hdNo=no;sub='';numbered=true}else if(numbered)sub=desc.slice(0,60);else g=sys=t;return}
    if(/^\d+(\.\d+)+$/.test(no)&&hdNo&&!no.startsWith(hdNo+'.')){hd='';sub='';hdNo=''}
    // no quantity and a blank / '-' amount ("SOCKET OUTLET  SET  234  -  85  -  -"): priced but not counted
    let Q=has(q)?q:(col('q')>=0&&col('amt')>=0&&!has(amt)&&(has(m)||has(l)||has(up))?0:1),M=has(m)?m:0,Lb=has(l)?l:0;if(!M&&!Lb){M=has(up)?up:(has(amt)?amt/Q:0)}
    // 4.99.3: "OWNER" in the material column of a subcontractor's quote (labour only, the owner supplies the material)
    const own=/by owner|\bowner\b|โดยเจ้าของ|ผู้ว่าจ้าง/i.test(r.join(' '));if(own&&!M&&!Lb)desc+=' (By Owner)';else if(own&&!M)desc+=' (วัสดุ By Owner)';
    out.push({on:true,top:/^\d+$/.test(no)?no:'',pre:!numbered,sys,sec,no,g,head:[hd,sub].filter(Boolean).join(' · '),desc:desc||no,unit:impTxt(get(r,'unit'))||(has(q)?'':'งาน'),q:Q,m:Math.round(M*100)/100,l:Math.round(Lb*100)/100})});
  // a summary block ("1 Air Handling Unit  1 LOT  848,240") whose numbers come back later as headings with the detail: keep the detail only
  const S=out.filter(i=>i.pre&&i.top);if(!S.some(i=>heads.has(i.top)))return out;
  // that is the original's layout: a system ("ระบบปรับอากาศ") summed by sections 1, 2, 3 … then the detail.
  // Keep it: the system is the group and the section ("1 Air Handling Unit") the first heading line
  return out.filter(i=>!S.includes(i)).map(i=>i.sys&&i.sec?{...i,g:i.sys,head:[i.sec,i.head].filter(Boolean).join(' · '),desc:/^\d+\.\d+$/.test(i.no)?i.no+' '+i.desc:i.desc}:i)}
// below-the-line rows anywhere in the file (often on the summary page): overhead/profit, discount, and the totals to check against
// overhead / discount count only below a TOTAL line: a side box ("OVERHEAD & PROJECT MANAGEMENT  1,105,683") above the table is not one
function impExtras(sheets,lines){const ex={},dc={},tot=new Set();Object.values(sheets||{}).forEach(rows=>{let below=false;rows.forEach((r,i)=>{const li=r.findIndex(c=>impTxt(c)&&!impIsNum(c)),lab=impTxt(r[li]),nums=r.filter(impIsNum).map(impNum).filter(v=>v>0),
      // an amount sits right of its label; a number left of it is the line's item number ("4 | ค่าขนส่ง" is a heading, not 4 baht)
      amt=r.slice(li+1).filter(impIsNum).map(impNum).filter(v=>v>0);
    if(!lab)return;if(/^(total|รวม|มูลค่ารวม|toltal|sum\b)/i.test(lab))below=true;if(IMPEXTRA.test(lab)&&amt.length){if(below)ex[lab]=amt[amt.length-1]}else if(IMPDISC.test(lab)&&amt.length){if(below)dc[lab]=amt[amt.length-1]}
    else if(/^(รวม|ยอดรวม|มูลค่ารวม|toltal|total|sub ?total|sum\b|รวมเป็นเงิน|รวมทั้งหมด)/i.test(lab)&&!/vat|ภาษี/i.test(lab)){const N=nums.length?nums:(rows[i+1]||[]).every(c=>!impTxt(c)||impIsNum(c))?(rows[i+1]||[]).filter(impIsNum).map(impNum):[];N.forEach(v=>tot.add(Math.round(v*100)/100))}})});
  return {extra:Object.values(ex).reduce((a,b)=>a+b,0),disc:Object.values(dc).reduce((a,b)=>a+b,0),labs:[...Object.keys(ex),...Object.keys(dc)],rows:Object.entries(ex),tot:[...tot],...impPay(lines?{...sheets,'':lines.map(l=>[l])}:sheets)}}
// payment terms ("10% Down Payment With PO", "20% เมื่อ…") and the validity days, wherever they sit in the file
function impPay(sheets){let pay=[],valid=0;Object.values(sheets||{}).forEach(rows=>{rows.forEach((r,i)=>{const t=impTxt(r.join(' '));
    if(!valid){const v=t.match(/(?:validity|ยืนราคา|กำหนดยืน)\D{0,30}?(\d{1,3})\s*วัน/i);if(v)valid=+v[1]}
    if(pay.length||!/payment|ชำระเงิน|งวดการจ่าย|เงื่อนไขการชำระ/i.test(t))return;const L=[];
    for(let k=i;k<Math.min(rows.length,i+15);k++){const x=impTxt(rows[k].join(' ')),m=(k===i?x.match(/(\d{1,3}(?:\.\d+)?)\s*%\s*(.+)$/):x.match(/^(\d{1,3}(?:\.\d+)?)\s*%\s*(.+)$/));if(!m){if(L.length)break;continue}L.push({pct:+m[1],desc:m[2].slice(0,120)})}
    if(L.length&&Math.abs(L.reduce((a,b)=>a+b.pct,0)-100)<0.01)pay=L})});return {pay,valid}}
// the letter part of the file: subject, project, addressee, delivery, remarks and who signs ("(นายอาทิตย์ บับภาสิทธิ์)" / กรรมการผู้จัดการ)
function impMeta(lines){const M={},
    // cells of a row are joined by two spaces: keep that gap (impTxt would close it) so a value stops at the next cell ("เรื่อง : งาน…  เลขที่เอกสาร : …")
    L=(lines||[]).map(t=>String(t??'').split(/\s{2,}/).map(impTxt).filter(Boolean).join('  ')).filter(Boolean),val=(re,t)=>{const m=t.match(re);return m?impTxt(m[1].replace(/\s{2,}.*$/,'')):''};
  L.forEach((t,i)=>{const set=(k,v)=>{if(v&&v!=='-'&&!M[k])M[k]=v.slice(0,160)};
    set('ref',val(/^ref\s*\.?\s*:\s*(.+)/i,t));set('title',val(/^เรื่?อง\s*:\s*(.+)/,t).replace(/^(เสนอราคา|ขอเสนอราคา)\s*/,''));
    set('pname',val(/^โครงการ\s*:?\s+(.+)/,t));set('attn',val(/^เรียน\s*:?\s*(.+)/,t));set('site',val(/^(?:ที่อยู่|สถานที่)\s*:\s*(.+)/,t));
    set('dlv',val(/^(?:กำหนดแล้วเสร็จ|กำหนดส่งมอบ|ระยะเวลาดำเนินการ|delivery)[^:]*?:?\s+(.+)/i,t));
    if(/^\((นาย|นาง|นางสาว|น\.ส\.|mr\.?|ms\.?|mrs\.?)\s*[^)]+\)$/i.test(t)&&!M.sign){M.sign=t.slice(1,-1).trim();if(L[i+1]&&L[i+1].length<40&&!/^\(/.test(L[i+1]))M.signPos=L[i+1]}
    if(!M.notes&&/^(หมายเหตุ|remark|note)/i.test(t)){const N=[],first=t.replace(/^(หมายเหตุ|remarks?|note)\s*[/:]*\s*(not\w*\s*)?/i,'').trim();if(/^[-•]/.test(first))N.push(first);
      for(let k=i+1;k<Math.min(L.length,i+12);k++){if(/^[-•]/.test(L[k]))N.push(L[k]);else if(N.length)break}if(N.length)M.notes=N.map(x=>impTxt(x).replace(/^[-•]\s*/,'- '))}});
  M.letter=L.some(t=>/ขอแสดงความนับถือ|จึงเรียนมาเพื่อ/.test(t));return M}
const IMPMETA=[['title','เรื่อง'],['pname','โครงการ'],['attn','เรียน'],['site','ที่อยู่'],['ref','Ref'],['dlv','กำหนดแล้วเสร็จ'],['sign','ผู้ลงนาม']];
// ---- the dialog ----
ACT.impFile=b=>{Object.keys(IMP).forEach(k=>delete IMP[k]);Object.assign(IMP,{t:b.dataset.t,id:b.dataset.id||''});
  dialog('นำเข้ารายการจากไฟล์',`<p class="hint" style="margin-top:0">เลือกไฟล์ Excel (.xlsx .xls) CSV หรือ PDF ที่ทำจากโปรแกรมอื่น ระบบอ่านในเครื่องนี้ ไม่ส่งไฟล์ออกไปไหน</p>
  <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn pri" data-a="impPick">เลือกไฟล์…</button><span class="muted" id="impName"></span></div>
  <details style="margin-top:10px"><summary>หรือวางตารางที่คัดลอกมา (จาก Excel หรือที่ AI อ่านจากไฟล์สแกน)</summary><textarea id="impTxt" rows="6" placeholder="วางตารางที่นี่ แล้วกด อ่านตาราง"></textarea><button type="button" class="btn sm" data-a="impPaste" style="margin-top:6px">อ่านตาราง</button></details>
  <div id="impBody"></div>`,`<button type="button" class="btn pri" data-a="impGo" id="impGoBtn" disabled>นำเข้า</button>`);dlgWide(true)};
const dlgWide=on=>{const d=$('#dlg');if(d)d.classList.toggle('dlg-wide',on)};
ACT.impPick=()=>pickFile(async file=>{const nm=file.name,el=$('#impName');if(el)el.textContent='กำลังอ่าน '+nm+' …';IMP.name=nm;IMP.file=file;
  try{let r;if(/\.pdf$/i.test(nm)||file.type==='application/pdf'){r=await impReadPdf(file);if(r.scan){impMsg('ไฟล์ PDF นี้เป็นภาพสแกน ไม่มีตัวอักษรให้อ่าน ให้ส่งไฟล์ให้ AI (เช่น Claude) อ่านออกมาเป็นตาราง แล้ววางในช่อง “หรือวางตาราง…” ด้านบน หรือใช้ปุ่ม วางจาก AI ในใบเสนอราคา');if(el)el.textContent=nm;return}
      if(r.junk){impMsg('ไฟล์ PDF นี้ใช้ฟอนต์ที่อ่านตัวอักษรออกมาไม่ได้ (ได้เป็นตัวอักษรเพี้ยน) ขอไฟล์ Excel ต้นฉบับจากผู้ส่ง หรือส่งไฟล์ให้ AI (เช่น Claude) อ่านออกมาเป็นตาราง แล้ววางในช่อง “หรือวางตาราง…” ด้านบน');if(el)el.textContent=nm;return}IMP.lines=r.lines;r=r.sheets}
    else if(/\.(csv|txt|tsv)$/i.test(nm))r=impReadText(await impDecode(file));else r=await impReadSheet(file);
    if(el)el.textContent=nm;impOpen(r)}catch(e){impMsg('อ่านไฟล์ไม่ได้: '+e.message);if(el)el.textContent=nm}});
ACT.impPaste=()=>{IMP.name='ตารางที่วาง';impOpen(impReadText($('#impTxt').value))};
const impMsg=t=>{const b=$('#impBody');if(b)b.innerHTML=`<p class="hint" style="color:var(--warn-c)">${esc(t)}</p>`};
function impOpen(sheets){const names=Object.keys(sheets||{});if(!names.length){impMsg('ไม่พบตารางในไฟล์นี้');return}
  IMP.sheets=sheets;IMP.ex=impExtras(sheets,IMP.lines);IMP.meta=impMeta(IMP.lines||Object.values(sheets).flatMap(R=>R.map(r=>r.map(impTxt).filter(Boolean).join('  '))));
  // the sheet / PDF table with the most line items (a detailed BOQ over its one-page summary)
  const cnt=nm=>{try{return impSheetItems(nm).length}catch(e){return 0}};
  IMP.sheet=names.reduce((b,nm)=>cnt(nm)>cnt(b)?nm:b,names[0]);
  // a BOQ split over several tables (air conditioning, then electrical) whose sum is the file's total: take them all
  if(names.length>1){const A=impAll();if(A.used>1&&IMP.ex.tot.some(v=>Math.abs(v-A.sum)<1))IMP.sheet=IMPALL}
  impSetSheet()}
const IMPALL='*';
function impSheetItems(nm){const R=IMP.sheets[nm],hr=impHeaderRow(R),{two,lab}=impLabels(R,hr);return impItems(R,hr,two,impMapFor(R,hr,two,lab))}
// every table together, each with its own columns; a table whose total is the sum of the others is the summary page
function impAll(){const T=Object.keys(IMP.sheets).map(nm=>{let it=[];try{it=impSheetItems(nm)}catch(e){}return {it,s:sum(it,r=>r.q*(r.m+r.l))}}).filter(t=>t.it.length),S=sum(T,t=>t.s);
  const big=T.reduce((b,t)=>t.it.length>b.it.length?t:b,T[0]),K=T.filter(t=>!(t!==big&&t.s>0&&Math.abs(2*t.s-S)<1)&&!(t.s===0&&S>0));return {rows:K.flatMap(t=>t.it),used:K.length,sum:sum(K,t=>t.s)}}
function impSetSheet(){if(IMP.sheet===IMPALL){impShow();return}const rows=IMP.sheets[IMP.sheet];IMP.hr=impHeaderRow(rows);impLay()}
function impLay(){const rows=IMP.sheets[IMP.sheet],{two,lab}=impLabels(rows,IMP.hr);IMP.two=two;IMP.lab=lab;IMP.map=impMapFor(rows,IMP.hr,two,lab);impShow()}
// the imported total against the totals written in the file, and the overhead / discount rows the file carries
function impCheck(){const S0=sum(IMP.rows.filter(r=>r.on),r=>n(r.q)*(n(r.m)+n(r.l))),E=IMP.ex||{tot:[]},t=IMP.t;let h='';
  if(S0&&E.tot.length){const hit=E.tot.find(v=>Math.abs(v-S0)<1);if(hit)h+=`<p class="hint" style="color:var(--ok-c,#1a7f37)">✓ ยอดรวมตรงกับยอดในไฟล์ ${fmt(hit,2)} บาท</p>`;
    else{const near=E.tot.reduce((b,v)=>Math.abs(v-S0)<Math.abs(b-S0)?v:b,E.tot[0]);h+=`<p class="hint" style="color:var(--warn-c)">ยอดรวม ${fmt(S0,2)} บาท ไม่ตรงกับยอดในไฟล์ ${fmt(near,2)} บาท (ต่าง ${fmt(S0-near,2)}) ตรวจรายการหรือคอลัมน์อีกครั้ง</p>`}}
  if((E.extra||E.disc)&&(t==='q'||t==='pj')&&S0)h+=`<label style="display:flex;gap:8px;align-items:flex-start;margin:6px 0"><input type="checkbox" id="impEx" checked> <span><b>ใส่ค่าดำเนินการและส่วนลดตามไฟล์ด้วย</b>${E.extra?` · <span>ค่าดำเนินการ/กำไร ${fmt(E.extra,2)} บาท (${fmt(E.extra/S0*100,2)}%)</span>`:''}${E.disc?` · <span>ส่วนลด ${fmt(E.disc,2)} บาท</span>`:''} · <span>ยอดก่อน VAT ${fmt(S0+E.extra-E.disc,2)} บาท</span> <small class="muted">(${esc(E.labs.join(', '))})</small></span></label>`;
  if(E.pay&&E.pay.length&&t==='q')h+=`<label style="display:flex;gap:8px;align-items:flex-start;margin:6px 0"><input type="checkbox" id="impPayOn" checked> <span><b>ใส่งวดชำระเงินตามไฟล์ด้วย</b> · <span>${E.pay.length} งวด (${E.pay.map(x=>x.pct+'%').join(' / ')})</span>${E.valid?` · <span>ยืนราคา ${E.valid} วัน</span>`:''}</span></label>`;
  // only the boxes this quotation still has empty (4.99.3): a name the user typed is never replaced by the file's
  const MQ=t==='q'&&(CO().quotes||[]).find(x=>x.id===IMP.id),MT=IMP.meta||{},mf=IMPMETA.filter(([k])=>MT[k]&&!(MQ&&String(MQ[k==='sign'?'signName':k]||'').trim()));
  if(t==='q'&&(mf.length||MT.notes))h+=`<label style="display:flex;gap:8px;align-items:flex-start;margin:6px 0"><input type="checkbox" id="impMetaOn" checked> <span><b>ใส่หัวเอกสารและเงื่อนไขตามไฟล์ด้วย</b> <small class="muted">(เฉพาะช่องที่ยังว่าง)</small> · ${mf.map(([k,l])=>`<span>${l}: ${esc(MT[k])}</span>`).join(' · ')}${MT.notes?` · <span>หมายเหตุ ${MT.notes.length} ข้อ</span>`:''}</span></label>`;
  return h}
function impShow(){const all=IMP.sheet===IMPALL,rows=all?[]:IMP.sheets[IMP.sheet],names=Object.keys(IMP.sheets);IMP.rows=all?impAll().rows:impItems(rows,IMP.hr,IMP.two,IMP.map);
  const ok=(all||IMP.map.includes('desc'))&&IMP.rows.length,tgt=impTarget(),btn=$('#impGoBtn');if(btn)btn.disabled=!ok;
  $('#impBody').innerHTML=`<div class="form" style="margin-top:12px">${names.length>1?`<label>ชีต / ตาราง<select id="impSheet"><option value="${IMPALL}"${all?' selected':''}>ทุกตารางรวมกัน</option>${names.map(n=>`<option${n===IMP.sheet?' selected':''}>${esc(n)}</option>`).join('')}</select></label>`:''}
    ${all?'':`<label>หัวตารางอยู่แถวที่<input id="impHr" type="number" min="1" value="${IMP.hr+1}" style="width:90px"></label>`}
    ${tgt&&tgt.has?`<label>รายการเดิม ${tgt.has} รายการ<select id="impMode"><option value="rep">แทนที่ทั้งหมด</option><option value="add">เพิ่มต่อท้าย</option></select></label>`:''}</div>
  ${all?'<p class="hint">รวมรายการจากทุกตารางในไฟล์ (ข้ามหน้าสรุปให้แล้ว) ถ้ารายการผิด ให้เลือกทีละตารางเพื่อแก้คอลัมน์ แล้วนำเข้าแบบ เพิ่มต่อท้าย</p>':`<h3 style="font-size:15px;margin:12px 0 6px">คอลัมน์ไหนคืออะไร</h3><div class="tw"><table class="imp-map"><thead><tr>${IMP.lab.map((t,c)=>`<th><select data-impc="${c}" aria-label="คอลัมน์ ${c+1}">${IMPF.map(([k,l])=>`<option value="${k}"${IMP.map[c]===k?' selected':''}>${l}</option>`).join('')}</select><small>${esc(t||'คอลัมน์ '+(c+1))}</small></th>`).join('')}</tr></thead>
  <tbody>${rows.slice(IMP.hr+(IMP.two?2:1),IMP.hr+(IMP.two?2:1)+4).map(r=>`<tr>${IMP.lab.map((_,c)=>`<td>${esc(impTxt(r[c]).slice(0,40))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
  ${IMP.map.includes('desc')?'':'<p class="hint" style="color:var(--warn-c)">เลือกคอลัมน์ “รายการ” อย่างน้อยหนึ่งคอลัมน์</p>'}`}
  <h3 style="font-size:15px;margin:12px 0 6px">ตรวจรายการก่อนนำเข้า <small class="muted">${IMP.rows.length} รายการ · รวม ${fmt(sum(IMP.rows,r=>r.q*(r.m+r.l)),2)} บาท · แถวรวม/ภาษีถูกข้ามให้แล้ว แก้ไขหรือเอาเครื่องหมายออกได้</small></h3>
  <div id="impChk">${impCheck()}</div>
  <div class="tw" style="max-height:340px;overflow:auto"><table class="imp-pv"><thead><tr><th></th><th>หมวด</th><th>หัวข้อย่อย</th><th>รายการ</th><th class="r">จำนวน</th><th>หน่วย</th><th class="r">ค่าวัสดุ/หน่วย</th><th class="r">ค่าแรง/หน่วย</th><th class="r">รวม</th></tr></thead><tbody>
  ${IMP.rows.map((r,i)=>`<tr><td><input type="checkbox" data-impr="${i}" data-f="on"${r.on?' checked':''} aria-label="นำเข้า"></td><td><input data-impr="${i}" data-f="g" value="${esc(r.g)}"></td><td><input data-impr="${i}" data-f="head" value="${esc(r.head)}"></td><td><input data-impr="${i}" data-f="desc" value="${esc(r.desc)}" style="min-width:220px"></td>
    <td><input class="r" data-impr="${i}" data-f="q" value="${r.q}" style="width:70px"></td><td><input data-impr="${i}" data-f="unit" value="${esc(r.unit)}" style="width:60px"></td>
    <td><input class="r" data-impr="${i}" data-f="m" value="${r.m}" style="width:96px"></td><td><input class="r" data-impr="${i}" data-f="l" value="${r.l}" style="width:96px"></td><td class="r">${fmt(r.q*(r.m+r.l),2)}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">ยังไม่พบรายการ ลองเปลี่ยนแถวหัวตาราง หรือเลือกคอลัมน์ใหม่</td></tr>'}</tbody></table></div>`}
document.addEventListener('change',e=>{const t=e.target;if(!t||!$('#impBody')||!t.closest('#dlg'))return;
  if(t.id==='impSheet'){IMP.sheet=t.value;impSetSheet()}
  else if(t.id==='impHr'){IMP.hr=Math.max(0,Math.min((IMP.sheets[IMP.sheet]||[]).length-1,(parseInt(t.value)||1)-1));impLay()}
  else if(t.dataset.impc!=null){IMP.map[+t.dataset.impc]=t.value;impRemember(IMP.lab,IMP.map);impShow()}
  else if(t.dataset.impr!=null){const r=IMP.rows[+t.dataset.impr],f=t.dataset.f;if(!r)return;r[f]=f==='on'?t.checked:['q','m','l'].includes(f)?(impNum(t.value)||0):t.value;const c=$('#impChk'),x=$('#impEx');if(c){const on=x?x.checked:true;c.innerHTML=impCheck();const y=$('#impEx');if(y)y.checked=on}}});
function impTarget(){const t=IMP.t;if(t==='q'){const Q=CO().quotes.find(x=>x.id===IMP.id);return Q&&{has:Q.items.length,o:Q}}
  if(t==='td'){const T=typeof tdById==='function'&&tdById(IMP.id);return T&&{has:(T.items||[]).length,o:T}}if(t==='pj')return {has:P.boq.items.length,o:P};return null}
ACT.impGo=()=>{const tg=impTarget();if(!tg)return;const add=($('#impMode')||{}).value==='add',src='นำเข้าจาก '+(IMP.name||'ไฟล์');
  if(IMP.sheet!==IMPALL)impRemember(IMP.lab,IMP.map);
  const L=IMP.rows.filter(r=>r.on&&impTxt(r.desc)).map(r=>({g:impTxt(r.g),head:impTxt(r.head),type:'',desc:impTxt(r.desc),unit:impTxt(r.unit),q:n(r.q),m:n(r.m),l:n(r.l),t:n(r.q)*(n(r.m)+n(r.l))}));
  if(!L.length){toast('ไม่มีรายการที่เลือกไว้');return}
  const E=IMP.ex||{},useEx=!!($('#impEx')||{}).checked,S0=sum(L,i=>i.t);
  if(IMP.t==='q'){const Q=tg.o,old=add?Q.items:[];qFill(Q,[...old,...L],{src});if(add)Q.items.splice(0,old.length,...old);
    // a priced BOQ file has its own hanger lines (or none on purpose): no automatic 5% Hanger Support line (982) on its sections,
    // or the quote ends up above the file's total; the tick on the section row still adds it
    Q.noHs=Q.noHs||{};L.forEach(i=>{Q.noHs[i.g]=1});
    // each overhead row stays its own named row under the total, as a % when the file's amount is a whole % of it
    if(useEx&&S0){Q.mk=0;Q.mkSep=false;Q.adds=(E.rows||[]).map(([name,v])=>{const pc=Math.round(v/S0*1e4)/100;return Math.abs(S0*pc/100-v)<0.01?{id:uid(),name,pct:pc,amt:''}:{id:uid(),name,pct:'',amt:v}});Q.disc=Math.round(n(E.disc)*100)/100}
    if(($('#impPayOn')||{}).checked&&E.pay&&E.pay.length){qEnsure(Q).qpay=E.pay.map((x,k)=>({id:uid(),no:String(k+1),desc:x.desc,pct:x.pct}));if(E.valid)Q.valid=E.valid}
    // the file's own header and terms, so the printed quotation reads like the original
    if(($('#impMetaOn')||{}).checked){const MT=IMP.meta||{};// 4.99.3 (user: "ทำไมชื่องาน มาอยู่ที่โครงการ", a subcontractor's PDF over their own quotation): the file fills only boxes still empty
      ['title','pname','attn','site','ref','dlv'].forEach(k=>{if(MT[k]&&!String(Q[k]||'').trim())Q[k]=MT[k]});if(MT.sign&&!String(Q.signName||'').trim()){Q.signName=MT.sign;Q.signPos=MT.signPos||''}
      if(MT.notes)Q.terms=MT.notes.join('\n');if(E.valid)Q.valid=E.valid;Q.cover=MT.letter?'letter':(Q.cover||'')}}
  else if(IMP.t==='td'){const T=tg.o,old=add?(T.items||[]):[];tdFill(T,L,src);if(add)T.items=[...old,...T.items]}
  else{const items=[...(add?P.boq.items:[]),...L.map(i=>{const {t,...x}=i;return x})],sub=sum(items,boqCost);const ohp=useEx?n(E.extra)-n(E.disc):(add?n(P.boq.ohp):0);setBoq(items,{src,sub,ohp,vat:(sub+ohp)*0.07,grand:(sub+ohp)*1.07})}
  dlgWide(false);$('#dlg').close();save();render();toast(`นำเข้า ${L.length} รายการแล้ว`)};
{const c=ACT.dlgClose;ACT.dlgClose=b=>{dlgWide(false);return c?c(b):($('#dlg').close())}}
// the button sits next to the existing "วาง BOQ" buttons
{const put=()=>{[['qPaste','q'],['tdPaste','td'],['pasteBoq','pj']].forEach(([a,t])=>document.querySelectorAll(`#view [data-a="${a}"]`).forEach(x=>{if(x.nextElementSibling&&x.nextElementSibling.dataset.a==='impFile')return;
    x.insertAdjacentHTML('afterend',`<button type="button" class="${x.className.replace(/\bpri\b/,'')}" data-a="impFile" data-t="${t}" data-id="${x.dataset.id||''}">นำเข้าจากไฟล์ (Excel / PDF / CSV)</button>`)}))};
  const r=render;render=function(){const x=r.apply(this,arguments);try{put()}catch(e){}return x}}
document.head.insertAdjacentHTML('beforeend',`<style>
#dlg.dlg-wide{width:min(1100px,96vw);max-width:96vw}
.imp-map th{vertical-align:top;min-width:120px}.imp-map th select{width:100%;font-weight:400}.imp-map th small{display:block;font-weight:400;color:var(--muted);white-space:normal;margin-top:4px}
.imp-map td{font-size:12.5px;color:var(--muted);white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis}
.imp-pv input{width:100%;min-width:60px;padding:4px 6px}.imp-pv td{padding:3px 4px}
</style>`);
