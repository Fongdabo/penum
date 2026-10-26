/* ---------- 4.89: ดาวน์โหลด Excel ปร.4 / ปร.5 / ปร.6 (user: "ไฟล์ ปร.4 โหลดเป็น Excel ได้ไหม ... หมายถึงใน PM") ----------
   A button beside พิมพ์ ปร.4 / ปร.5 / ปร.6 on a bid saves the same forms as one Excel file, a sheet per form. Each sheet is
   read from the print itself (PRINT.pr4 / pr5 / pr6): headings and lines as text rows, tables cell by cell with numbers kept
   as numbers, so the file always shows exactly what prints (ราคากลาง, Factor F, parts, rounding). Uses the bundled xlsx.js. */
const TDXL=[['pr4','ปร.4',[7,52,10,9,14,15,14,15,17,22]],['pr5','ปร.5',[7,52,18,11,20,22]],['pr6','ปร.6',[7,52,18,11,20,22]]];
function tdXlSheet(X,html,cols){const box=document.createElement('div');box.innerHTML=html;
  const ws=X.utils.aoa_to_sheet([]),merges=[];let r=0;
  const text=s=>{s=s.replace(/\s+/g,' ').trim();if(!s)return;X.utils.sheet_add_aoa(ws,[[s]],{origin:{r,c:0}});merges.push({s:{r,c:0},e:{r,c:cols.length-1}});r++};
  const walk=el=>{for(const c of el.childNodes){
    if(c.nodeType===3){text(c.textContent);continue}
    if(c.nodeType!==1||c.tagName==='STYLE'||c.tagName==='SCRIPT')continue;
    if(c.tagName==='TABLE'){c.querySelectorAll('tr>td:first-child').forEach(d=>{d.setAttribute('data-t','s');d.setAttribute('data-v',d.textContent.trim())});   // ลำดับ 1.10 stays 1.10
      X.utils.sheet_add_dom(ws,c,{origin:{r,c:0}});const n_=X.utils.decode_range(ws['!ref']).e.r+1;
      (ws['!merges']||[]).forEach(m=>{if(!merges.includes(m))merges.push(m)});ws['!merges']=[];r=n_+1;continue}
    if(c.querySelector('table')){walk(c);continue}
    const kids=[...c.children],d=getComputedStyle(c).display;
    if(kids.length>1&&(d==='flex'||d==='grid'))text(kids.map(k=>(k.innerText||k.textContent).replace(/\s+/g,' ').trim()).filter(Boolean).join('     '));
    else text(c.innerText||c.textContent)}};
  box.style.cssText='position:absolute;left:-9999px;top:0;width:1100px';document.body.appendChild(box);
  try{walk(box)}finally{box.remove()}
  ws['!merges']=merges;ws['!cols']=cols.map(w=>({wch:w}));return ws}
ACT.tdXl=async b=>{const t=tdById(b.dataset.id);if(!t)return;let X;
  try{X=await obLib()}catch(e){toast(e.message);return}
  const wb=X.utils.book_new();
  TDXL.forEach(([k,nm,cols])=>{if(!PRINT[k])return;const h=PRINT[k](t.id);if(h)X.utils.book_append_sheet(wb,tdXlSheet(X,h,cols),nm)});
  const name=`${t.no||'TD'} ${t.purpose==='ref'?'ราคากลาง':'ปร.4-ปร.6'} ${(t.title||'').slice(0,60)}`.replace(/[\\/:*?"<>|]+/g,' ').trim()+'.xlsx';
  const data=X.write(wb,{type:'array',bookType:'xlsx'});
  toast(await download(name,data,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')?'ดาวน์โหลด Excel ปร.4 / ปร.5 / ปร.6 แล้ว':'ดาวน์โหลดไม่สำเร็จ')};
{const f=tdView;tdView=function(){let h=f();const t=curTd();if(!t)return h;
  const btn=`<button type="button" class="btn sm" data-a="tdXl" data-id="${t.id}">ดาวน์โหลด Excel ปร.4–ปร.6</button>`;
  const m=h.match(/<button type="button" class="btn sm( pri)?" data-a="print" data-k="pr6" data-id="[^"]+">พิมพ์ ปร\.6<\/button>/)||h.match(/<button type="button" class="btn sm" data-a="print" data-k="pr5" data-id="[^"]+">พิมพ์ ปร\.5<\/button>/);
  return m?h.replace(m[0],m[0]+btn):h}}
