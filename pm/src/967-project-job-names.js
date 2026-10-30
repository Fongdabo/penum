/* ---------- 4.99.4 โครงการ กับ งาน on claim documents (user: "ทำใบเบิกงวดงาน โปรแกรมไม่แยกโครงการ และงานให้", LT-007) ----------
   Letters, the claim set, the PP sheet, invoices and every project printout split the project's name at " - " ("โครงการ - งาน",
   3.32/3.99). A project made from a won quote got only the quote's โครงการ box as its name, so its งาน never reached the letter
   ("ขอเบิกเงินค่างาน บริษัท โนเบิ้ล…" with no job). Now:
   - pjJob(p) gives the project and the job: from the name, or else the job is the title of the quotation the project was won from
     (projects already made that way read right without being renamed);
   - a won quote with both boxes names its project "โครงการ - งาน";
   - ข้อมูลโครงการ has the two boxes โครงการ / งาน in place of the one name.
   A file's header line "ที่อยู่ : … วันที่ : 19 ตุลาคม 2569" put the date into the site: the import stops at the next label,
   sites already saved that way are cleaned once, and letters print the site alone. */
const PJ_SEP=/\s+[-–—]\s+/;
function pjJob(p){p=p||P;const nm=String(p&&p.name||'').trim(),m=nm.match(PJ_SEP);
  if(m&&m.index)return {pj:nm.slice(0,m.index).trim(),job:nm.slice(m.index+m[0].length).trim()};
  const q=p&&(CO().quotes||[]).find(x=>x.pj===p.id),t=q?String(q.title||'').trim():'';
  if(t&&!pjKey(nm).includes(pjKey(t))&&!pjKey(t).includes(pjKey(nm)))return {pj:nm,job:t};
  return {pj:'',job:nm}}
// "งาน … โครงการ …" for letters (escaped); cut drops a leading "งาน" where the sentence already says it ("ค่างาน งานติดตั้ง…")
const pjWhat=(p,cut)=>{const J=pjJob(p),j=cut&&J.pj?J.job.replace(/^งาน\s*/,'')||J.job:J.job;return J.pj?`${esc(j)} โครงการ ${esc(J.pj)}`:esc(j)};
// the place only: a date (or document number) read in with it from a file's header line is dropped
const siteOnly=s=>String(s||'').replace(/\s*(?:ลงวันที่|วันที่|date)\s*[:：]\s*.*$/i,'').trim();

// a file's header: each value stops where the next label of the same line starts ("ที่อยู่ : …  วันที่ : …" on one line in a PDF)
{const f=impMeta;impMeta=function(){const M=f.apply(this,arguments);
  ['title','pname','attn','site','ref','dlv'].forEach(k=>{if(typeof M[k]==='string'){const v=M[k].replace(/\s+(?:ลงวันที่|วันที่|date|เลขที่เอกสาร|เลขที่ใบเสนอราคา|ยืนราคา|valid\w*)\s*[:：].*$/i,'').trim();if(v)M[k]=v;else delete M[k]}});return M}}
// sites saved before this version
function siteFixAll(){let ch=0;const fx=o=>{if(o&&typeof o.site==='string'){const v=siteOnly(o.site);if(v!==o.site&&v){o.site=v;ch=1}}};
  Object.values(DB.projects||{}).forEach(p=>fx(p.info));((DB.co||{}).quotes||[]).forEach(fx);((DB.co||{}).tenders||[]).forEach(fx);return ch}
{const r=render;render=function(){try{if(siteFixAll())save()}catch(e){}return r.apply(this,arguments)}}

// a won quote with both โครงการ and งาน: the new project is "โครงการ - งาน" (qFillProject copies the name to an existing project too)
{const f=ACT.qWon;ACT.qWon=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),had=Q&&Q.pj&&DB.projects[Q.pj];f(b);
  const p=Q&&!had&&Q.pj&&DB.projects[Q.pj];if(!p||PJ_SEP.test(p.name))return;
  const pn=pjName(Q.pname),t=String(Q.title||'').trim();if(!pn||!t||pjKey(pn)===pjKey(t)||pjKey(p.name)!==pjKey(pn))return;
  p.name=`${pn} - ${t}`;if(pjDup(p).length)p.name+=` (${Q.no})`;save();render()}}
{const f=ACT.qWonDlg;ACT.qWonDlg=b=>{f(b);const Q=CO().quotes.find(q=>q.id===b.dataset.id),e=document.querySelector('#dlg p');if(!Q||!e)return;
  const pn=pjName(Q.pname),t=String(Q.title||'').trim();if(!pn||!t||pjKey(pn)===pjKey(t))return;
  e.innerHTML=e.innerHTML.replace(/ชื่อโครงการ “[^”]*”/,`โครงการ “${esc(pn)}” งาน “${esc(t)}”`)}}

// ข้อมูลโครงการ: two boxes, โครงการ and งาน, written back as "โครงการ - งาน"
{const f=VIEWS.setup;VIEWS.setup=()=>{const h=f(),J=pjJob(P),pj=J.pj||J.job,job=J.pj?J.job:'';
  return h.replace(/<label class="w2">ชื่อโครงการ<input data-p="name" value="[^"]*"><\/label>/,
    `<label class="w2">ชื่อโครงการ<input data-pjn="pj" value="${esc(pj)}"></label><label class="w2" title="ใช้ในหนังสือเบิกงวดและเอกสาร: ขอเบิกเงินค่างาน … โครงการ …">ชื่องาน<input data-pjn="job" value="${esc(job)}" placeholder="เช่น ติดตั้งระบบปรับอากาศ"></label>`)}}
document.addEventListener('change',e=>{const el=e.target;if(!el.dataset||!el.dataset.pjn)return;
  const v=k=>String((document.querySelector(`#view [data-pjn="${k}"]`)||{}).value||'').trim(),pj=v('pj'),job=v('job');
  if(!pj&&!job){toast('ใส่ชื่อโครงการ');render();return}
  P.name=pj&&job&&pjKey(pj)!==pjKey(job)?`${pj} - ${job}`:pj||job;save();render()});
Object.assign(SBKW,{'pj.setup':(SBKW['pj.setup']||'')+' ชื่องาน งาน แยกโครงการกับงาน'});
// the job and the project make the subject a line or two longer: keep the letter on one page
document.head.insertAdjacentHTML('beforeend','<style>#print .lt2 .lt-sign{margin-top:22px}#print .lt2 .lt-ln{height:44px}#print .lt2 .lt-ct{margin-top:18px}</style>');
