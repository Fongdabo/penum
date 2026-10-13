/* ---------- 3.16.1: close a finished project, delete one safely ----------
   Close (ปิดโครงการ): the project stays with all its data for looking back, moves to "ปิดแล้ว" at the end of the project list
   and stops raising alerts; it can be reopened. Delete (ลบโครงการนี้): offers a backup file first, then asks to type ลบ;
   deleting the last project leaves an empty "โครงการใหม่" so the app always has one to show. */
const pjOpen=()=>Object.values(DB.projects).filter(p=>!p.closed);
ACT.projClose=()=>{if(!confirm(`ปิดโครงการ “${P.name}”?\n\nข้อมูลทั้งหมดยังอยู่ครบ ดูย้อนหลังและพิมพ์เอกสารได้ โครงการจะย้ายไปอยู่กลุ่ม “ปิดแล้ว” ท้ายรายชื่อโครงการ และไม่ขึ้นแจ้งเตือนอีก เปิดใหม่ได้ทุกเมื่อ`))return;
  P.closed=today();save();render();toast(`ปิดโครงการ ${P.name} แล้ว`)};
ACT.projOpen=()=>{delete P.closed;save();render();toast(`เปิดโครงการ ${P.name} อีกครั้งแล้ว`)};
ACT.delProj=async()=>{const nm=P.name,id=P.id;
  if(confirm(`ก่อนลบโครงการ “${nm}” ดาวน์โหลดไฟล์สำรองเก็บไว้ก่อนไหม (แนะนำ)\n\nตกลง = ดาวน์โหลดไฟล์สำรอง แล้วไปขั้นต่อไป\nยกเลิก = ข้ามไม่สำรอง`))await ACT.backup();
  const t=(prompt(`ลบโครงการ “${nm}” และข้อมูลทั้งหมดของโครงการนี้ (แผนงาน จัดซื้อ เบิกงวด เอกสาร) ลบแล้วกู้คืนไม่ได้ นอกจากจากไฟล์สำรอง\n\nพิมพ์คำว่า ลบ เพื่อยืนยัน`,'')||'').trim().toLowerCase();
  if(!['ลบ','delete'].includes(t)){toast('ยังไม่ได้ลบ');return}
  delete DB.projects[id];if(!Object.keys(DB.projects).length){const p=blankProject('โครงการใหม่');DB.projects[p.id]=p}
  const nx=pjOpen()[0]||Object.values(DB.projects)[0];DB.cur=nx.id;P=nx;S.sel={};save();S.tab='dash';render();toast(`ลบโครงการ ${nm} แล้ว`)};
{const f=VIEWS.setup;VIEWS.setup=()=>{let h=f();const btn=P.closed?`<button type="button" class="btn pri" data-a="projOpen">เปิดโครงการอีกครั้ง</button>`:`<button type="button" class="btn" data-a="projClose">ปิดโครงการ (งานจบแล้ว)</button>`;
  h=h.replace('<button type="button" class="btn del" data-a="delProj">ลบโครงการนี้</button>',btn+'<button type="button" class="btn del" data-a="delProj">ลบโครงการนี้</button><span class="hint" style="margin:0">ปิดโครงการ = เก็บไว้ดูย้อนหลัง · ลบ = ลบทิ้งถาวร เช่น โครงการตัวอย่าง</span>');
  return (P.closed?`<div class="pj-closed">โครงการนี้ปิดแล้วเมื่อ ${thD(P.closed)} ข้อมูลยังดูและพิมพ์ได้ตามปกติ</div>`:'')+h}}
// open projects first, closed ones grouped at the end of both project lists
const pjOpts=()=>{const by=(a,b)=>a.name.localeCompare(b.name,'th'),A=Object.values(DB.projects),o=A.filter(p=>!p.closed).sort(by),c=A.filter(p=>p.closed).sort(by),
  op=p=>`<option value="${p.id}"${p.id===P.id?' selected':''}>${esc(p.name)}</option>`;return o.map(op).join('')+(c.length?`<optgroup label="ปิดแล้ว">${c.map(op).join('')}</optgroup>`:'')};
{const r=render;render=function(){const x=r.apply(this,arguments);['sbProj','projSel'].forEach(i=>{const s=document.getElementById(i);if(s&&Object.values(DB.projects).some(p=>p.closed))s.innerHTML=pjOpts()});
  const b=document.querySelector('.pj-closed');if(b&&!P.closed)b.remove();return x}}
// a closed project raises no more alerts (its overdue items are history now)
{const f=alerts;alerts=function(){return f().filter(a=>!(a.p&&a.p.closed))}}
document.head.insertAdjacentHTML('beforeend',`<style>.pj-closed{margin:0 0 12px;padding:10px 14px;border-radius:12px;background:var(--warn-soft,var(--sunk));color:var(--ink);border:1px solid var(--line);font-size:14px}</style>`);
