/* ---------- 3.94 อัปเดตของบริษัท: PENUM PM joins the company updates of PENUM MEP and BIM ----------
   shared/team.js (app.json "team": true) keeps the company's MEP and BIM projects in ORIEN's Supabase, encrypted with a key found
   through the licence code. PM uses it for two things only (no project list, no edit lock: PM has its own cloud and folder):
   - a project changed on this computer goes into the updates (who, when, progress / contract / billed) a few seconds after the
     change, at most once a minute per project. PM's data itself does not go there. Changes that arrive from another computer
     (cloud, folder) are not sent from here: that computer sends its own, under its own name.
   - หน้าแรก › อัปเดตของบริษัท: every save of PM, MEP and BIM of the company, newest first, and the MEP / BIM edit requests
     waiting for this person (also in the chat, 987-chat-approvals-all.js).
   The company is the licence code (ตั้งค่า › สิทธิ์การใช้งาน); without one the page says so and nothing is sent. */
const CU={base:{},db:null,dirty:0,inp:0,ct:0,t:0,last:{},wait:new Set(),fresh:new Set()};
const cuLic=()=>{const st=licState(),p=licP();return {code:String(DB.co.lic||'').replace(/\s+/g,''),st:st==='bad'||st==='rev'?'none':st,co:p?p.co:'',cid:p?String(p.id||'').replace(/-R\d+$/,'')||String(p.co||''):''}};
function cuSum(p){try{const k=pjKpi(p);return {pct:Math.round(n(k.act)*10)/10,val:Math.round(n(k.C.total)),bill:Math.round(n(k.billed))}}catch(e){return null}}
const cuHash=p=>{try{return penumTeam.hash(JSON.stringify(p))}catch(e){return ''}};
// what every project looks like now; a new data set (another company, a file, the cloud's copy) starts again from here
function cuBase(){CU.db=DB;CU.base={};Object.values(DB.projects||{}).forEach(p=>{CU.base[p.id]=cuHash(p)})}
function cuCheck(){if(DEMOPG||!window.penumTeam)return;if(CU.db!==DB){cuBase();CU.dirty=0;return}const mine=CU.dirty;CU.dirty=0;
  for(const p of Object.values(DB.projects||{})){const h=cuHash(p),b=CU.base[p.id];CU.base[p.id]=h;if(!mine||b===h)continue;if(b===undefined)CU.fresh.add(p.id);CU.wait.add(p.id)}
  cuSend()}
async function cuSend(){clearTimeout(CU.t);const now=Date.now();let later=0;
  for(const id of [...CU.wait]){const p=DB.projects[id];if(!p){CU.wait.delete(id);continue}const w=60e3-(now-(CU.last[id]||0));if(w>0){later=Math.max(later,w);continue}
    CU.wait.delete(id);CU.last[id]=now;const I=p.info||{},fresh=CU.fresh.delete(id);
    const r=await penumTeam.pmPut({id,name:p.name||'',client:I.client||'',code:I.contractNo||'',sum:cuSum(p),fresh});
    if(r&&r.err&&r.err!=='nolic'&&r.err!=='bad'){CU.wait.add(id);if(fresh)CU.fresh.add(id);later=later||120e3}}          // offline: again in two minutes
  if(later)CU.t=setTimeout(cuSend,later+500)}
if(window.penumTeam&&!DEMOPG){
  penumTeam.attach({app:'pm',lic:cuLic,cur:()=>null,has:()=>false,
    openPm:id=>{if(DB.projects[id])ACT.go({dataset:{m:'pj',k:'dash',p:id}});else toast('โครงการนี้ไม่ได้อยู่ในข้อมูลของเครื่องนี้')}});
  setTimeout(cuBase,1500);
  // a change counts as this person's when a key or a click came just before the save
  ['pointerdown','keydown','input','change'].forEach(k=>addEventListener(k,()=>{CU.inp=Date.now()},{capture:true,passive:true}));
  {const s=save;save=function(){const x=s.apply(this,arguments);if(Date.now()-CU.inp<5000)CU.dirty=1;clearTimeout(CU.ct);CU.ct=setTimeout(cuCheck,8000);return x}}}

// หน้าแรก › อัปเดตของบริษัท (everyone may open it; what each person sees is the company's)
NAVD.find(d=>d[0]==='home')[2].push(['co','feed','','อัปเดตของบริษัท']);
ICO.feed='<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
SBKW['co.feed']='อัปเดตของบริษัท อัปเดต ใครแก้ ใครบันทึก ล่าสุด คำขอแก้ไข ขอแก้ไขงาน MEP BIM recent updates feed';
{const f=allowed;allowed=function(mode,tab){return mode==='co'&&tab==='feed'?true:f(mode,tab)}}
CVIEWS.feed=()=>`<section class="card"><h2><span>อัปเดตของบริษัท</span><small>ใครบันทึกงานอะไรล่าสุด ใน PENUM PM, PENUM MEP และ PENUM BIM ของบริษัท และคำขอแก้ไขงาน MEP / BIM ที่รอคุณ</small></h2>
  ${window.penumTeam&&!DEMOPG?'<div id="cuFeed"></div>':'<p class="hint">ใช้ได้ในข้อมูลจริงของบริษัท ไม่ใช่ข้อมูลตัวอย่าง</p>'}</section>`;
{const r=render;render=function(){const x=r.apply(this,arguments);const el=document.getElementById('cuFeed');
  if(el&&window.penumTeam){const tab=S.cuTab;S.cuTab='';penumTeam.render(el,tab?{tab}:{})}return x}}
