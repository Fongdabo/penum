/* ---------- schedule: forward/backward pass, weights, plan vs actual ---------- */
const durOf=t=>Math.max(0,Math.round(n(t.dur)));
// outline (MS Project style): t.lv = indent level; a task followed by a deeper one is a summary of the rows under it
const lvOf=t=>Math.max(0,Math.round(n(t.lv)));
function outline(T){const lv=[],par={},anc={},kids={},sumF={},wbs={},cnt=[];
  T.forEach((t,i)=>{let l=lvOf(t);if(i===0)l=0;else if(l>lv[i-1]+1)l=lv[i-1]+1;lv[i]=l});
  const stack=[];T.forEach((t,i)=>{while(stack.length>lv[i])stack.pop();const p=stack[stack.length-1];par[t.id]=p?p.id:'';anc[t.id]=stack.map(x=>x.id);
    if(p)(kids[p.id]=kids[p.id]||[]).push(t.id);cnt.length=lv[i]+1;cnt[lv[i]]=(cnt[lv[i]]||0)+1;wbs[t.id]=cnt.slice(0,lv[i]+1).join('.');stack.push(t)});
  T.forEach((t,i)=>{sumF[t.id]=i+1<T.length&&lv[i+1]>lv[i]});return {lv,par,anc,kids,sum:sumF,wbs}}
const DTY=['FS','SS','FF','SF'];
function sched(){
  const T=P.tasks,by={},st=okD(P.info.start)?P.info.start:today(),R={},O=outline(T);
  T.forEach((t,i)=>{by[t.id]=t;R[t.id]={es:okD(t.start)?t.start:st,ef:'',d:durOf(t)};if(O.lv[i]!==lvOf(t))t.lv=O.lv[i]});
  const isS=t=>O.sum[t.id],leaves=T.filter(t=>!isS(t)),sums=T.filter(isS).reverse();
  const deps=t=>(t.dep||[]).filter(d=>by[d.id]&&d.id!==t.id&&!O.anc[t.id].includes(d.id)&&!O.anc[d.id].includes(t.id));
  const chain=t=>[t,...O.anc[t.id].map(id=>by[id])];
  const gapOf=id=>R[id].d>0?1:0;
  const roll=()=>{let ch=false;sums.forEach(t=>{const k=O.kids[t.id].map(id=>R[id]);const es=k.reduce((m,r)=>r.es<m?r.es:m,k[0].es),ef=k.reduce((m,r)=>r.ef>m?r.ef:m,k[0].ef);
    if(R[t.id].es!==es||R[t.id].ef!==ef){R[t.id].es=es;R[t.id].ef=ef;R[t.id].d=diffD(es,ef)+1;ch=true}});return ch};
  for(let pass=0;pass<=T.length+2;pass++){let ch=false;
    leaves.forEach(t=>{const d=durOf(t);let es=st;
      chain(t).forEach(c=>{if(okD(c.start)&&c.start>es)es=c.start;
        deps(c).forEach(x=>{const r=R[x.id];if(!r.ef)return;const ty=x.ty||'FS',lag=n(x.lag);let c2;
          if(ty==='SS')c2=addD(r.es,lag);else if(ty==='FF')c2=addD(r.ef,lag-Math.max(0,d-1));else if(ty==='SF')c2=addD(r.es,lag-Math.max(1,d));else c2=addD(r.ef,gapOf(x.id)+lag);
          if(c2>es)es=c2})});
      const ef=d>0?addD(es,d-1):es;if(R[t.id].es!==es||R[t.id].ef!==ef){R[t.id].es=es;R[t.id].ef=ef;ch=true}});
    if(roll())ch=true;if(!ch)break}
  const fin=T.reduce((m,t)=>R[t.id].ef>m?R[t.id].ef:m,st),succ={};
  T.forEach(t=>deps(t).forEach(x=>(succ[x.id]=succ[x.id]||[]).push({t,lag:n(x.lag),ty:x.ty||'FS'})));
  T.forEach(t=>{R[t.id].lf=fin;R[t.id].ls=addD(fin,-Math.max(0,R[t.id].d-1))});
  for(let pass=0;pass<=T.length+2;pass++){let ch=false;
    leaves.forEach(t=>{const d=durOf(t);let lf=fin;
      chain(t).forEach(c=>(succ[c.id]||[]).forEach(s=>{const r=R[s.t.id];let c2;
        if(s.ty==='SS')c2=addD(r.ls,-s.lag+Math.max(0,d-1));else if(s.ty==='FF'||s.ty==='SF')c2=addD(r.lf,-s.lag);else c2=addD(r.ls,-((d>0?1:0)+s.lag));
        if(c2<lf)lf=c2}));
      const ls=d>0?addD(lf,-(d-1)):lf;if(R[t.id].lf!==lf||R[t.id].ls!==ls){R[t.id].lf=lf;R[t.id].ls=ls;ch=true}});
    sums.forEach(t=>{const k=O.kids[t.id].map(id=>R[id]),ls=k.reduce((m,r)=>r.ls<m?r.ls:m,k[0].ls),lf=k.reduce((m,r)=>r.lf>m?r.lf:m,k[0].lf);if(R[t.id].ls!==ls||R[t.id].lf!==lf){R[t.id].ls=ls;R[t.id].lf=lf;ch=true}});
    if(!ch)break}
  // weights: BOQ value of the task's work group, shared among that group's tasks by duration; manual value wins. Summary rows carry no weight of their own.
  const gT={},gD={};P.boq.items.forEach(i=>gT[i.g]=(gT[i.g]||0)+n(i.t||boqCost(i)));
  leaves.forEach(t=>{if(t.g&&gT[t.g])gD[t.g]=(gD[t.g]||0)+Math.max(1,durOf(t))});
  const linked=leaves.some(t=>t.g&&gT[t.g]);
  T.forEach(t=>{const r=R[t.id];r.sum=isS(t);r.w=r.sum?0:n(t.w)>0?n(t.w):t.g&&gT[t.g]?gT[t.g]*Math.max(1,durOf(t))/gD[t.g]:linked?0:durOf(t);
    r.fl=diffD(r.es,r.ls);r.crit=!r.sum&&r.fl<=0&&T.length>1});
  // summary rows: weight, % and duration roll up from the rows under them (kept on the task so lists elsewhere read sensibly)
  sums.forEach(t=>{const k=O.kids[t.id].map(id=>({r:R[id],t:by[id]})),w=sum(k,x=>x.r.sum?x.r.ws:x.r.w),dw=sum(k,x=>Math.max(1,x.r.d));
    R[t.id].ws=w;const p=w>0?sum(k,x=>(x.r.sum?x.r.ws:x.r.w)*Math.min(100,n(x.t.pct)))/w:dw?sum(k,x=>Math.max(1,x.r.d)*Math.min(100,n(x.t.pct)))/dw:0;
    t.pct=Math.round(p*10)/10;t.dur=R[t.id].d;t.sum=1});
  leaves.forEach(t=>{if(t.sum)delete t.sum});
  T.forEach(t=>{R[t.id].done=n(t.pct)>=100});
  const W=sum(leaves,t=>R[t.id].w)||1;
  return {R,st,fin,W,O,
    planAt(d){return 100*sum(leaves,t=>{const r=R[t.id],a=okD(t.bs)?t.bs:r.es,b=okD(t.bf)?t.bf:r.ef;if(d<a)return 0;if(d>=b)return r.w;return r.w*(diffD(a,d)+1)/(diffD(a,b)+1)})/W},
    act(){return sum(leaves,t=>R[t.id].w*Math.min(100,n(t.pct))/100)*100/W},
    gAct(g){const L=leaves.filter(t=>t.g===g),w=sum(L,t=>Math.max(1,durOf(t)));return w?sum(L,t=>Math.max(1,durOf(t))*Math.min(100,n(t.pct)))/w:null}};
}
HOOK.push(p=>{if(/^tasks\.[^.]+\.pct$/.test(p)){P.hist[today()]=Math.round(sched().act()*10)/10}});
// predecessors as in MS Project: row number, link type and lag, e.g. 2  2FS+15  109SS  26FS-22  (old form 2+5 still works)
const depParse=v=>String(v).toUpperCase().split(/[,;\s]+/).filter(Boolean).map(s=>{const k=s.match(/^(\d+)(FS|SS|FF|SF)?([+-]\d+)?(D|DAYS?|วัน)?$/);if(!k)return null;const p=P.tasks[+k[1]-1];
  return p?{id:p.id,lag:k[3]?n(k[3]):0,...(k[2]&&k[2]!=='FS'?{ty:k[2]}:{})}:null}).filter(Boolean);
HOOK.push((p,v)=>{const m=p.match(/^tasks\.([^.]+)\.depTxt$/);if(!m)return;const t=P.tasks.find(x=>x.id===m[1]);if(!t)return;delete t.depTxt;
  t.dep=depParse(String(v).replace(/\s*([+-])\s*/g,'$1')).filter(d=>d.id!==t.id);
  // a new predecessor means "follow it": drop the old typed start so the task moves right after it
  if(t.dep.length)t.start=''});
HOOK.push((p,v)=>{const m=p.match(/^tasks\.([^.]+)\.start$/);if(m&&!v){const t=P.tasks.find(x=>x.id===m[1]);if(t)t.start=''}});
const depTxt=t=>(t.dep||[]).map(d=>{const i=P.tasks.findIndex(x=>x.id===d.id);if(i<0)return '';const ty=d.ty&&d.ty!=='FS'?d.ty:'',lg=n(d.lag);return `${i+1}${ty||(lg?'FS':'')}${lg?(lg>0?'+':'')+lg:''}`}).filter(Boolean).join(',');
NEW.tasks=arr=>{const l=arr.length?arr[arr.length-1]:null;return {name:'งานใหม่',dur:5,pct:0,g:'',lv:l?lvOf(l):0,dep:l?[{id:l.id,lag:0}]:[]}};

/* template schedule from the BOQ work groups */
function genTasks(){
  const st=okD(P.info.start)?P.info.start:today(),have=new Set(groupsInBoq()),T=[];let LV=0;const add=(name,dur,dep,g,ms)=>{const t={id:uid(),name,dur,pct:0,g:g||'',lv:LV,dep:(dep||[]).filter(Boolean).map(id=>({id,lag:0})),ms:!!ms};if(!T.length)t.start=st;T.push(t);return t.id},hd=name=>{LV=0;add(name,0);LV=1};
  const k0=add('เริ่มงาน / ลงนามสัญญา',0,[],'',1);
  hd('งานเตรียมการและจัดซื้อ');
  const sub=add('ส่งอนุมัติวัสดุและอุปกรณ์ (Submittal)',14,[k0]);
  const shop=add('เขียนแบบ Shop Drawing และขออนุมัติ',21,[k0]);
  const buy=add('สั่งซื้อเครื่องจักรและรอส่งของ',45,[sub]);
  const L=[['civ','งานโยธาที่เกี่ยวข้อง (ฐานเครื่อง เจาะช่อง)',15,[shop]],['duct','ติดตั้งท่อลม หัวจ่าย และแดมเปอร์',35,[shop]],['pipe','ติดตั้งท่อน้ำยาและท่อน้ำทิ้ง',30,[shop]],['chw','ติดตั้งท่อน้ำเย็นและวาล์ว',35,[shop]],
    ['eq','ติดตั้งเครื่องปรับอากาศ FCU / CDU / AHU / Chiller',25,[buy]],['el','งานไฟฟ้าระบบปรับอากาศ',30,[shop]],['smk','งานระบบควบคุมควันไฟ',25,[shop]],['fp','งานระบบดับเพลิง',40,[shop]],['elb','งานระบบไฟฟ้าอาคาร',45,[shop]],['fa','งานระบบแจ้งเหตุเพลิงไหม้',30,[shop]],['com','งานระบบสื่อสาร',30,[shop]],['cctv','งานระบบกล้องวงจรปิด',20,[shop]],['acc','งานระบบควบคุมการเข้า-ออก',20,[shop]],['pa','งานระบบเสียงประกาศ',20,[shop]],['bms','งานระบบควบคุมอาคารอัตโนมัติ (BMS)',30,[shop]],['lp','งานระบบป้องกันฟ้าผ่าและสายดิน',15,[shop]],['genr','งานเครื่องกำเนิดไฟฟ้าและ UPS',20,[buy]],['sol','งานระบบโซลาร์เซลล์',20,[buy]],['wwt','งานระบบบำบัดน้ำเสีย',30,[shop]],['mg','งานระบบก๊าซทางการแพทย์',30,[shop]],['plb','งานระบบสุขาภิบาล',35,[shop]]];
  hd('งานติดตั้ง');
  const inst=L.filter(x=>have.has(x[0])||!have.size&&['duct','pipe','eq','el'].includes(x[0])).map(x=>add(x[1],x[2],x[3],have.has(x[0])?x[0]:''));
  hd('ทดสอบระบบและส่งมอบ');
  const pt=add('ทดสอบแรงดันท่อและหุ้มฉนวน',10,inst.filter((_,i)=>true).slice(-3));
  const tc=add('ทดสอบและเดินระบบ (T&C)',10,[...inst,pt],have.has('oth')?'oth':'');
  const tab=add('ปรับสมดุลลมและน้ำ (TAB)',7,[tc]);
  const pl=add('ตรวจรับงานและแก้ไขงานค้าง (Punch list)',10,[tab],have.has('ex')?'ex':'');
  LV=0;add('ส่งมอบงาน',0,[pl],'',1);
  return T;
}
ACT.genTasks=()=>{if(P.tasks.length&&!confirm('แทนที่แผนงานเดิมทั้งหมดด้วยแผนตั้งต้นจาก BOQ?'))return;P.tasks=genTasks();P.hist={};save();render();toast('สร้างแผนงานแล้ว ปรับจำนวนวันและงานก่อนหน้าได้ในตาราง')};
ACT.baseline=()=>{const s=sched();P.tasks.forEach(t=>{t.bs=s.R[t.id].es;t.bf=s.R[t.id].ef});P.info.baseAt=today();save();render();toast('บันทึกแผนฐานแล้ว เส้นแผนจะใช้วันที่ชุดนี้')};
ACT.addMs=()=>{P.tasks.push({id:uid(),name:'หมุดหมาย / งวดงาน',dur:0,pct:0,g:'',ms:true,lv:P.tasks.length?lvOf(P.tasks[P.tasks.length-1]):0,dep:P.tasks.length?[{id:P.tasks[P.tasks.length-1].id,lag:0}]:[]});save();render()};
// a row moves together with the rows under it, past the neighbouring block at the same level
const tBlock=i=>{const T=P.tasks,l=lvOf(T[i]);let j=i+1;while(j<T.length&&lvOf(T[j])>l)j++;return [i,j]};
ACT.mvTask=b=>{const T=P.tasks,i=T.findIndex(t=>t.id===b.dataset.id);if(i<0)return;const [a,e]=tBlock(i),l=lvOf(T[i]),blk=T.slice(a,e);
  if(+b.dataset.d<0){let k=a-1;while(k>=0&&lvOf(T[k])>l)k--;if(k<0||lvOf(T[k])<l)return;T.splice(a,e-a);T.splice(k,0,...blk)}
  else{if(e>=T.length||lvOf(T[e])<l)return;const [,e2]=tBlock(e);T.splice(a,e-a);T.splice(e2-blk.length,0,...blk)}save();render()};
ACT.tInd=b=>{const T=P.tasks,i=T.findIndex(t=>t.id===b.dataset.id);if(i<0)return;const [a,e]=tBlock(i),d=+b.dataset.d;
  if(d>0&&(i===0||lvOf(T[i])>lvOf(T[i-1])))return;if(d<0&&!lvOf(T[i]))return;
  for(let k=a;k<e;k++)T[k].lv=Math.max(0,lvOf(T[k])+d);if(d>0&&i>0)T[i-1].col=false;save();render()};
// insert a new row right under this one (a heading gets it as its first sub-item), so nothing has to be moved up row by row
ACT.tIns=b=>{const T=P.tasks,i=T.findIndex(t=>t.id===b.dataset.id);if(i<0)return;const t=T[i],O=outline(T),hd=!!O.sum[t.id];
  const x={id:uid(),name:'งานใหม่',dur:5,pct:0,g:hd?'':t.g||'',lv:hd?lvOf(t)+1:lvOf(t),dep:hd?[]:[{id:t.id,lag:0}]};if(hd)t.col=false;
  T.splice(i+1,0,x);save();render();requestAnimationFrame(()=>{const e=document.querySelector(`#view input[data-p="tasks.${x.id}.name"]`);if(e){e.focus();e.select()}})};
ACT.tCol=b=>{const t=P.tasks.find(x=>x.id===b.dataset.id);if(!t)return;t.col=!t.col;save();render()};
ACT.tColAll=b=>{const O=outline(P.tasks);P.tasks.forEach(t=>{if(O.sum[t.id])t.col=b.dataset.k==='1'&&O.lv[P.tasks.indexOf(t)]>=0});save();render()};
ACT.addSum=()=>{const l=P.tasks[P.tasks.length-1],h={id:uid(),name:'หัวข้อใหญ่ใหม่',dur:0,pct:0,g:'',lv:0,dep:l?[{id:l.id,lag:0}]:[]};
  P.tasks.push(h,{id:uid(),name:'งานย่อย',dur:5,pct:0,g:'',lv:1,dep:[]});save();render()};
ACT.zoom=b=>{S.zoom=b.dataset.k;render()};
ACT.gCols=()=>{S.gcols=!S.gcols;render()};

/* S-curve */
function scurve(wd=760,ht=260){
  const s=sched();if(!P.tasks.length)return '<p class="empty">ยังไม่มีแผนงาน</p>';
  const a=P.tasks.reduce((m,t)=>{const x=okD(t.bs)&&t.bs<m?t.bs:m;return s.R[t.id].es<x?s.R[t.id].es:x},s.st),b=P.tasks.reduce((m,t)=>okD(t.bf)&&t.bf>m?t.bf:m,s.fin),span=Math.max(1,diffD(a,b));
  const L=44,Rr=14,T=14,B=30,X=d=>L+(wd-L-Rr)*Math.max(0,Math.min(1,diffD(a,d)/span)),Y=v=>T+(ht-T-B)*(1-v/100);
  const step=Math.max(1,Math.round(span/40)),pts=[];for(let k=0;k<=span;k+=step)pts.push(addD(a,k));pts.push(b);
  const plan=pts.map((d,i)=>`${i?'L':'M'}${X(d).toFixed(1)},${Y(s.planAt(d)).toFixed(1)}`).join('');
  const hk=Object.keys(P.hist).filter(okD).sort(),td=today(),cur=s.act();
  const ah=[...hk.filter(d=>d<td).map(d=>[d,P.hist[d]]),[td,cur]].filter(x=>x[0]>=a);
  const act=ah.map(([d,v],i)=>`${i?'L':'M'}${X(d).toFixed(1)},${Y(v).toFixed(1)}`).join('');
  const grid=[0,25,50,75,100].map(v=>`<line x1="${L}" x2="${wd-Rr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${v}%</text>`).join('');
  const months=[];let m=pd(a);m.setDate(1);m.setMonth(m.getMonth()+1);while(iso(m)<=b){months.push(iso(m));m.setMonth(m.getMonth()+1)}
  const ev=Math.ceil(months.length/8)||1;
  const mx=months.filter((_,i)=>i%ev===0).map(d=>`<line x1="${X(d)}" x2="${X(d)}" y1="${T}" y2="${ht-B}" stroke="var(--line)" stroke-dasharray="2 3"/><text x="${X(d)}" y="${ht-B+16}" text-anchor="middle" font-size="11" fill="var(--muted)">${pd(d).toLocaleDateString('th-TH',{month:'short',year:'2-digit'})}</text>`).join('');
  const tx=td>=a&&td<=b?`<line x1="${X(td)}" x2="${X(td)}" y1="${T}" y2="${ht-B}" stroke="var(--danger)" stroke-dasharray="4 3"/><text x="${X(td)+4}" y="${T+10}" font-size="11" fill="var(--danger)">วันนี้</text>`:'';
  return `<svg class="chart" viewBox="0 0 ${wd} ${ht}" role="img" aria-label="กราฟความคืบหน้าแผนเทียบจริง">${grid}${mx}${tx}
    <path d="${plan}" fill="none" stroke="var(--plan)" stroke-width="2.5"/><path d="${act}" fill="none" stroke="var(--act)" stroke-width="3"/>
    ${ah.length?`<circle cx="${X(td)}" cy="${Y(cur)}" r="4.5" fill="var(--act)"/>`:''}</svg>
    <div class="legend"><span><i style="background:var(--plan)"></i>ตามแผน ${pct(s.planAt(td))}</span><span><i style="background:var(--act)"></i>ทำได้จริง ${pct(cur)}</span></div>`;
}

VIEWS.sched=()=>{
  const s=sched(),T=P.tasks,td=today(),px={d:26,w:7,m:2.4}[S.zoom]||7;
  let a=s.st,b=s.fin;T.forEach(t=>{if(okD(t.bs)&&t.bs<a)a=t.bs;if(okD(t.bf)&&t.bf>b)b=t.bf;if(s.R[t.id].es<a)a=s.R[t.id].es});
  const ad=pd(a);ad.setDate(ad.getDate()-((ad.getDay()+6)%7));a=iso(ad);b=addD(b,14);
  const days=diffD(a,b)+1,Wd=Math.round(days*px),X=d=>diffD(a,d)*px;
  let hdr='';const m=pd(a);m.setDate(1);while(iso(m)<=b){const d=iso(m);if(d>=a||1){const x=Math.max(0,X(d));hdr+=`<span class="gh m" style="left:${x}px">${pd(d).toLocaleDateString('th-TH',{month:'short',year:'2-digit'})}</span>`}m.setMonth(m.getMonth()+1)}
  const wk=S.zoom==='m'?28:7;for(let k=0;k<days;k+=wk){const d=addD(a,k);hdr+=`<span class="gh w" style="left:${X(d)}px">${S.zoom==='d'?thD(d).split(' ')[0]+' '+thD(d).split(' ')[1]:pd(d).getDate()}</span>`;if(S.zoom==='d')for(let j=1;j<7;j++){}}
  const bg=`background-image:repeating-linear-gradient(to right,var(--line) 0 1px,transparent 1px ${wk*px}px);background-size:${Wd}px 100%`;
  const tdl=td>=a&&td<=b?`<span class="gtd" style="left:${X(td)}px"></span>`:'';
  const O=s.O,hid=t=>O.anc[t.id].some(id=>(T.find(x=>x.id===id)||{}).col),dd=d=>{const x=pd(d);return `${x.getDate()}/${x.getMonth()+1}`};
  const rows=T.map((t,i)=>{if(hid(t))return '';const r=s.R[t.id],d=r.sum?r.d:durOf(t),p=Math.min(100,n(t.pct)),late=!r.done&&r.ef<td,lv=O.lv[i];
    const base=okD(t.bs)&&okD(t.bf)?`<span class="gbl" style="left:${X(t.bs)}px;width:${Math.max(3,(diffD(t.bs,t.bf)+1)*px)}px" title="แผนฐาน ${thD(t.bs)} – ${thD(t.bf)}"></span>`:'';
    const bar=r.sum?`<span class="gsum" data-bid="${t.id}" style="left:${X(r.es)}px;width:${Math.max(4,d*px)}px" title="${esc(t.name)} ${thD(r.es)} – ${thD(r.ef)} · ${fmt(p,0)}%"><i style="width:${p}%"></i></span><em class="glb" style="left:${X(r.es)+Math.max(4,d*px)+6}px">${dd(r.ef)}</em>`
      :d>0?`<span class="gb${r.crit?' crit':''}" data-bid="${t.id}" style="left:${X(r.es)}px;width:${Math.max(3,d*px)}px" title="${esc(t.name)} ${thD(r.es)} – ${thD(r.ef)} · ${p}%"><i style="width:${p}%"></i></span>`
      :`<span class="gm${p>=100?' done':''}" data-bid="${t.id}" style="left:${X(r.es)+px/2}px" title="${esc(t.name)} ${thD(r.es)}"></span><em class="glb" style="left:${X(r.es)+px/2+12}px">${dd(r.es)}</em>`;
    const ro=v=>`<span class="gro">${v}</span>`;
    return `<tr class="${r.crit?'crit':''}${r.sum?' gs':''}" data-tid="${t.id}"><td class="muted r">${i+1}</td><td class="muted gw">${O.wbs[t.id]}</td>
      <td class="nm"><div class="gnm" style="padding-left:${lv*18}px">${r.sum?`<button type="button" class="gtg" data-a="tCol" data-id="${t.id}" aria-label="${t.col?'กางหัวข้อ':'พับหัวข้อ'}">${t.col?'▸':'▾'}</button>`:'<i class="gtg"></i>'}<input data-p="tasks.${t.id}.name" value="${esc(t.name)}" aria-label="ชื่องาน"></div></td>
      <td>${r.sum?ro(`${d} วัน`):`<input class="r" inputmode="numeric" data-p="tasks.${t.id}.dur" data-t="num" value="${d}" aria-label="จำนวนวัน" style="width:52px">`}</td>
      <td>${r.sum?ro(thD(r.es)):`<input type="date" data-p="tasks.${t.id}.start" value="${esc(r.es)}" title="${(t.dep||[]).length?'เริ่มหลังงานก่อนหน้าเสร็จ ใส่วันที่เพื่อกำหนดวันเริ่มไม่ก่อนวันนั้น':''}" aria-label="วันเริ่ม" style="width:128px">`}</td>
      <td class="${late?'':'muted'}" style="${late?'color:var(--danger)':''}">${thD(r.ef)}</td>
      <td>${(()=>{const own=(t.dep||[]).some(d=>(O.anc[t.id]||[]).includes(d.id));return `<input data-p="tasks.${t.id}.depTxt" value="${esc(depTxt(t))}" title="${own?'งานก่อนหน้าเป็นหัวข้อของงานนี้เอง จึงไม่มีผล ให้ใส่เลขแถวงานที่ต้องเสร็จก่อน':'เลขแถวงานก่อนหน้า เช่น 2 · 2FS+5 · 4SS'}" aria-label="งานก่อนหน้า" style="width:84px${own?';border-color:#F59E0B;color:#D97706':''}">${own?'<small style="display:block;color:#D97706;font-size:11px;line-height:1.2">หัวข้อของตัวเอง</small>':''}`})()}</td>
      <td>${r.sum?ro(fmt(p,0)+'%'):`<input class="r" inputmode="numeric" data-p="tasks.${t.id}.pct" data-t="num" value="${n(t.pct)}" aria-label="ร้อยละที่ทำได้" style="width:52px">`}</td>
      ${S.gcols?`<td>${r.sum?'':`<select data-p="tasks.${t.id}.g" aria-label="หมวดงาน BOQ" style="width:140px">${G_OPTS().map(([k,l])=>`<option value="${k}"${k===(t.g||'')?' selected':''}>${esc(l)}</option>`).join('')}</select>`}</td>
      <td class="r muted">${fmt((r.sum?r.ws:r.w)*100/s.W,1)}</td>`:''}
      <td style="white-space:nowrap"><button type="button" class="x t-ins" data-a="tIns" data-id="${t.id}" aria-label="แทรกงานใหม่ใต้แถวนี้" title="แทรกงานใหม่ใต้แถวนี้">＋</button><button type="button" class="x" data-a="tInd" data-id="${t.id}" data-d="-1" aria-label="เลื่อนออก (หัวข้อใหญ่ขึ้น)" title="เลื่อนออก">⇤</button><button type="button" class="x" data-a="tInd" data-id="${t.id}" data-d="1" aria-label="เลื่อนเข้า (เป็นหัวข้อย่อย)" title="เลื่อนเข้าเป็นหัวข้อย่อย">⇥</button><button type="button" class="x" data-a="mvTask" data-id="${t.id}" data-d="-1" aria-label="เลื่อนขึ้น">↑</button><button type="button" class="x" data-a="mvTask" data-id="${t.id}" data-d="1" aria-label="เลื่อนลง">↓</button><button type="button" class="x" data-a="delRow" data-c="tasks" data-id="${t.id}" aria-label="ลบงาน">✕</button></td>
      <td class="ch" style="min-width:${Wd}px;${bg}">${base}${bar}${tdl}</td></tr>`}).join('');
  const plan=s.planAt(td),act=s.act(),spi=plan>0?act/plan:1,crit=T.filter(t=>s.R[t.id].crit&&!s.R[t.id].done).length,late=T.filter(t=>!s.R[t.id].done&&s.R[t.id].ef<td).length;
  return `<dl class="stats">
    <div><dt>ความคืบหน้าจริง</dt><dd>${pct(act)}</dd><div class="bar"><i style="width:${Math.min(100,act)}%"></i></div></div>
    <div><dt>ตามแผนถึงวันนี้</dt><dd>${pct(plan)}</dd><div class="bar"><i style="width:${Math.min(100,plan)}%;background:var(--plan)"></i></div></div>
    <div><dt>เร็ว/ช้ากว่าแผน</dt><dd style="color:${act>=plan-0.5?'var(--good)':'var(--danger)'}">${act>=plan?'+':''}${fmt(act-plan,1)}% <small>SPI ${fmt(spi,2)}</small></dd></div>
    <div><dt>ระยะเวลา</dt><dd>${fmt(diffD(s.st,s.fin)+1)} <small>วัน · เสร็จ ${thD(s.fin)}</small></dd></div>
    <div><dt>งานล่าช้า / วิกฤต</dt><dd>${late} <small>/ ${crit} งาน</small></dd></div></dl>
  <section class="card"><h2><span>แผนงาน (Gantt)</span><small>ใส่จำนวนวันและงานก่อนหน้า (เลขแถว เช่น 2,3 · 2FS+5 = รอ 5 วันหลังงาน 2 เสร็จ · 4SS = เริ่มพร้อมงาน 4) แล้ววันที่จะคำนวณให้ · ＋ แทรกงานใต้แถวนั้น · ⇥ ทำเป็นหัวข้อย่อย ⇤ กลับเป็นหัวข้อใหญ่ · แถบสีส้ม = สายงานวิกฤต</small></h2>
    <div class="row" style="margin-bottom:10px">
      <button type="button" class="btn pri" data-a="add" data-c="tasks">+ เพิ่มงาน</button>
      <button type="button" class="btn" data-a="addSum">+ หัวข้อใหญ่</button>
      <button type="button" class="btn" data-a="addMs">+ หมุดหมาย/งวดงาน</button>
      ${T.some((t,i)=>s.O.sum[t.id])?`<span class="sub"><button type="button" data-a="tColAll" data-k="1">พับทั้งหมด</button><button type="button" data-a="tColAll" data-k="0">กางทั้งหมด</button></span>`:''}
      <button type="button" class="btn" data-a="genTasks">สร้างแผนตั้งต้นจาก BOQ</button>
      <button type="button" class="btn" data-a="baseline" title="เก็บวันที่ปัจจุบันไว้เทียบ">บันทึกแผนฐาน${P.info.baseAt?` <small class="muted">(${thD(P.info.baseAt)})</small>`:''}</button>
      <span class="sp" style="flex:1"></span>
      <span class="sub">${[['d','วัน'],['w','สัปดาห์'],['m','เดือน']].map(([k,l])=>`<button type="button" data-a="zoom" data-k="${k}" aria-selected="${S.zoom===k}">${l}</button>`).join('')}</span>
      <button type="button" class="btn" data-a="gCols" title="หมวด BOQ ใช้คิดน้ำหนักงานจากมูลค่า">${S.gcols?'ซ่อน':'แสดง'}หมวด BOQ/น้ำหนัก</button>
      <button type="button" class="btn" data-a="print" data-k="sched">พิมพ์</button></div>
    <div class="tw"><table class="gt"><thead><tr><th>#</th><th>WBS</th><th>งาน</th><th class="r">ระยะเวลา</th><th>เริ่ม</th><th>เสร็จ</th><th title="เลขแถว + ชนิด FS/SS/FF/SF + วันรอ">ก่อนหน้า</th><th class="r">%</th>${S.gcols?'<th>หมวด BOQ</th><th class="r" title="น้ำหนักงานตามมูลค่า BOQ">น้ำหนัก %</th>':''}<th></th>
      <th class="ch" style="min-width:${Wd}px">${hdr}</th></tr></thead><tbody>${rows||`<tr><td colspan="${S.gcols?12:10}" class="empty">ยังไม่มีแผนงาน กด “สร้างแผนตั้งต้นจาก BOQ” หรือ “+ เพิ่มงาน”</td></tr>`}</tbody></table></div>
    <div class="legend" style="margin-top:8px"><span><i style="background:var(--plan)"></i>ช่วงงาน</span><span><i style="background:var(--act)"></i>ทำแล้ว</span><span><i style="background:var(--crit)"></i>สายงานวิกฤต</span><span><i style="background:var(--base)"></i>แผนฐาน</span><span><i style="background:#334155;height:6px"></i>หัวข้อใหญ่ (รวมงานย่อย)</span><span><i style="background:var(--ink);transform:rotate(45deg);width:9px;height:9px;border-radius:0"></i>หมุดหมาย</span><span><i style="background:none;border-left:2px dashed var(--danger);border-radius:0;width:2px"></i>วันนี้</span></div>
  </section>
  <section class="card"><h2><span>S-Curve ความคืบหน้างานเทียบเงินที่เบิกและรับ</span><small>เส้นงานจริงเก็บค่าทุกวันที่มีการแก้ % งาน · เส้นเงินมาจากใบเบิกงวดในแท็บงบและเบิกงวด</small></h2>${scurve(1300,300)}</section>`;
};
PRINT.sched=()=>{const s=sched();return phead('แผนงานโครงการ',`ความคืบหน้า ${pct(s.act())} (แผน ${pct(s.planAt(today()))})`)+`<table><thead><tr><th>#</th><th>งาน</th><th>เริ่ม</th><th>เสร็จ</th><th>วัน</th><th>ก่อนหน้า</th><th>%</th></tr></thead><tbody>${P.tasks.map((t,i)=>{const r=s.R[t.id];return `<tr><td>${i+1}</td><td>${r.crit?'<b>':''}${esc(t.name)}${r.crit?'</b>':''}</td><td>${thD(r.es)}</td><td>${thD(r.ef)}</td><td>${durOf(t)}</td><td>${depTxt(t)}</td><td>${n(t.pct)}</td></tr>`}).join('')}</tbody></table><h3 style="margin-top:14px">S-Curve</h3>${scurve(900,260)}`};

