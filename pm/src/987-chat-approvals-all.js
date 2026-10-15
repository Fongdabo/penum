/* ---------- 3.94 every approval in the chat: รอคุณอนุมัติ lists all of them, not only the 7 kinds of 3.69 ----------
   Added here, with the same people and the same records as their pages:
   - ใบขอเบิกของหน้างาน (หน้างาน › ขอเบิกของ): the foreman, a project manager or management (mrBoss), like คลังวัสดุหน้างาน
   - ใบอนุญาตทำงาน (Work permit, ความปลอดภัย): management, safety, a project manager; it can now be ไม่อนุมัติ too
   - ใบลาออก: each step (head of department › HR › management) for the person the page lets approve it (canStage)
   - แบบประเมินทักษะ: HR checks, then management approves; ไม่อนุมัติ sends it back to the assessor with the reason
   - ขอแก้ไขงาน PENUM MEP / BIM (shared/team.js): the owner of the work, or the administrator
   Each answer is told in the chat like the others: privately to the person who asked, or in the project room for a work permit. */
Object.assign(CHAP,{mr:['ใบขอเบิกของหน้างาน','MR','#b5793a'],wp:['ใบอนุญาตทำงาน','WP','#c2410c'],quit:['ใบลาออก','ออก','#6b7280'],ska:['แบบประเมินทักษะ','ทษ','#0e7490'],mreq:['ขอแก้ไขงาน','✎','#2F7F88']});
const wpBoss=()=>{const u=me();return !u||u.dept==='MGT'||u.dept==='SHE'||(u.dept==='PRJ'&&isHead(u))};
const CHW={w0:'แก้ไขข้อมูล',w1:'ทำต่อ',w2:'อัปเดตตามแบบแก้',w3:'แก้ BOQ / ราคา',w4:'อื่น ๆ'};
const chTeamId=u=>u===''?'admin':u==null?'':String(u);          // shared/team.js names the administrator '', the chat 'admin'
{const f=chQueue;chQueue=function(){const Q=f();if(!cmMe())return Q;const C=CO(),nm=x=>staffName(x)||'(ไม่ทราบชื่อ)';
  projects().filter(p=>!p.closed).forEach(p=>{
    if(mrBoss())(p.mreq||[]).filter(r=>r.status==='req').forEach(r=>{const L=(r.items||[]).filter(i=>n(i.q)>0);
      Q.push({k:'mr',id:r.id,pid:p.id,no:r.no,who:r.by,sub:p.name+' · '+nm(r.by),det:[`${L.length} รายการ`,L.slice(0,3).map(i=>`${i.desc} ${fmtq(n(i.q))} ${i.unit||''}`.trim()).join(', ')+(L.length>3?' …':''),r.where,r.note].filter(Boolean).join(' · ')})});
    if(wpBoss())(p.permits||[]).filter(r=>r.status==='req').forEach(r=>{const T=(PTY.find(t=>t[0]===r.type)||['',r.type||''])[1];
      Q.push({k:'wp',id:r.id,pid:p.id,no:r.no,sub:p.name+(T?' · '+T:''),det:[thD(r.date)+(r.time?' '+r.time:''),r.loc,r.who&&'ผู้ปฏิบัติงาน '+r.who,r.sup&&'ผู้ควบคุม '+r.sup].filter(Boolean).join(' · ')})})});
  (C.quits||[]).filter(q=>['pend','hr','mgt'].includes(q.status)&&q.staff&&canStage(q.status,q.staff)).forEach(q=>Q.push({k:'quit',id:q.id,no:q.no,who:q.staff,sub:nm(q.staff)+' · '+QFLOW[q.status][1],
    det:[(QTYPE.find(t=>t[0]===q.type)||['',''])[1],'วันสุดท้าย '+thD(q.last),q.reason].filter(Boolean).join(' · ')}));
  (C.ska||[]).filter(e=>(e.status==='sub'&&canHR())||(e.status==='hr'&&canApprove())).forEach(e=>{const s=CO().staff.find(x=>x.id===e.staff);
    Q.push({k:'ska',id:e.id,no:e.no,who:chStaff(e.by)?chStaff(e.by).id:'',sub:(s?s.name:'')+' · '+(e.status==='sub'?'รอฝ่ายบุคคลตรวจ':'รอผู้บริหารอนุมัติ'),det:[e.by&&'ผู้ประเมิน '+e.by,e.note].filter(Boolean).join(' · ')})});
  if(window.penumTeam)penumTeam.reqs().forEach(q=>Q.push({k:'mreq',id:q.id,no:String(q.app||'').toUpperCase(),who:chTeamId(q.by.u),sub:(q.pn||'–')+' · '+(staffName(q.by.u)||q.by.n||''),
    det:[CHW[q.what]||CHW.w4,q.note,q.till?'ถึง '+thD(new Date(q.till).toISOString().slice(0,10)):'จนกว่าจะยกเลิก'].filter(Boolean).join(' · ')}));
  return Q}}
const CHAPX=['mr','wp','quit','ska','mreq'];
// tell the result like 3.69 does: in the project room for a work permit, else privately to the person who asked
function chApTell(it,ok,why){if(CH.apN===false)return '';const u=cmMe(),t=`${ok?'✅ อนุมัติ':'❌ ไม่อนุมัติ'} ${chApTitle(it)} · ${it.sub}${why?'\nเหตุผล: '+why:''}`;
  const room=it.k==='wp'?'p:'+it.pid:it.who&&it.who!==u?chDm(u,it.who):'';if(!room)return '';chPost(room,t);return room[0]==='p'?' · แจ้งในห้องโครงการแล้ว':' · แจ้ง '+chFirst(it.who)+' ทางแชทแล้ว'}
{const f=ACT.chAp;ACT.chAp=async b=>{if(!CHAPX.includes(b.dataset.k))return f(b);
  const it=chQueue().find(x=>x.k===b.dataset.k&&x.id===b.dataset.id);if(!it){toast('รายการนี้ไม่ต้องอนุมัติแล้ว');CH.rej='';chDraw();return}
  const ok=!!b.dataset.ok,wi=$('#chPop [data-chwhy]'),why=!ok&&wi?wi.value.trim():'',who=(me()||{}).name||'ผู้ดูแลระบบ',fake=d=>({dataset:Object.assign({id:it.id},d||{})});let done=false;
  if(it.k==='mr'||it.k==='wp'){const p=DB.projects[it.pid],r=p&&(p[it.k==='mr'?'mreq':'permits']||[]).find(x=>x.id===it.id);
    if(r&&r.status==='req'){r.status=ok?'ok':'no';r.apBy=who;r.apAt=today();if(why)r.why=why;save();render();done=true}}
  else if(it.k==='quit'){const q=(CO().quits||[]).find(x=>x.id===it.id),st=q&&q.status;if(q){ACT[ok?'qOk':'qNo'](fake());done=q.status!==st;if(done&&why)q.why=why}}
  else if(it.k==='ska'){const e=(CO().ska||[]).find(x=>x.id===it.id),st=e&&e.status;
    if(e){if(ok)ACT.skaNext(fake());else{e.note=(e.note?e.note+'\n':'')+`ส่งกลับ: ${why||'ไม่อนุมัติในแชท'}`;skaStep(e,'back','ส่งกลับให้หัวหน้าแก้ไข')}done=e.status!==st}}
  else if(it.k==='mreq'){b.disabled=true;try{done=await penumTeam.decide(it.id,ok,why)}finally{b.disabled=false}}
  if(!done){chDraw();return}CH.rej='';if(it.k!=='mr'&&it.k!=='wp')toast((ok?'อนุมัติแล้ว':'บันทึกไม่อนุมัติแล้ว')+chApTell(it,ok,why));else{const m=chApTell(it,ok,why);toast(`${ok?'อนุมัติ':'ไม่อนุมัติ'} ${it.no||''} แล้ว${m}`)}
  chBadge();chDraw()}}
{const f=ACT.chApGo;ACT.chApGo=b=>{if(!CHAPX.includes(b.dataset.k))return f(b);const it=chQueue().find(x=>x.k===b.dataset.k&&x.id===b.dataset.id);if(!it)return;
  if(it.k==='mr')return ACT.go({dataset:{m:'pj',k:'buy',s:'stock',p:it.pid}});
  if(it.k==='wp')return ACT.go({dataset:{m:'pj',k:'site',s:'wp',p:it.pid}});
  if(it.k==='mreq'){S.cuTab='req';return ACT.go({dataset:{m:'co',k:'feed'}})}
  if(it.k==='quit')S.sel.quit=it.id;const s=it.k==='quit'?'quit':'eval';if(me()&&!allowed('co','hr')){toast('หน้านี้ไม่ได้เปิดให้ชื่อผู้ใช้งานนี้');return}
  S.mode='co';S.ctab='hr';S.sub.hr=s;render();window.scrollTo(0,0)}}
// requests from MEP / BIM arrive by themselves: the count on the chat button and the open list follow
addEventListener('penumteam',()=>{try{chBadge();if(CH.open&&CH.view==='appr')chDraw()}catch(e){}});
