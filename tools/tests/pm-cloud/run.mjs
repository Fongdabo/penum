// Multi-device test of PENUM PM on PENUM's cloud (4.99.39). Each Playwright browser context is one device of one company; all
// of them work at the same time on an in-memory stand-in for the cloud (sbmock.mjs), and the test checks that nothing is lost.
//   node tools/build-pages.mjs site pm
//   node tools/tests/pm-cloud/run.mjs [race|view|delete|soak|all] [--norev] [--minutes=2] [--devices=4]
// --norev plays a cloud that has not run the 4.99.39 part of tools/pm-cloud-setup.sql yet.
// Needs Playwright with Chromium. It serves site/ itself on a free port and gives the pages a throwaway licence key pair that
// lives only in memory, so its test code opens PM and no real code can be made. Nothing reaches the real cloud.
import {createRequire} from 'module';import fs from 'fs';import path from 'path';import http from 'http';import {webcrypto as wc} from 'crypto';import {fileURLToPath} from 'url';
import {newState,attach} from './sbmock.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..'),SITE=path.join(ROOT,'site');
const opt=(k,d)=>{const a=process.argv.find(x=>x.startsWith('--'+k+'='));return a?+a.split('=')[1]:d};
const NOREV=process.argv.includes('--norev'),MIN=opt('minutes',2),NDEV=Math.max(2,Math.min(6,opt('devices',4)));
const WHICH=process.argv.slice(2).find(x=>!x.startsWith('--'))||'all';
if(!fs.existsSync(path.join(SITE,'pm/index.html'))){console.error('Build first: node tools/build-pages.mjs site pm');process.exit(2)}

// the public key the pages carry (shared/licence.js) is swapped for a throwaway one while serving; the cloud address is PM's
const KEY=fs.readFileSync(path.join(ROOT,'shared/licence.js'),'utf8').match(/crv:'P-256',x:'([^']+)',y:'([^']+)'/);
const HOST=fs.readFileSync(path.join(ROOT,'pm/src/830-cloud.js'),'utf8').match(/url:'(https:\/\/[^']+)'/)[1];
const kp=await wc.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']),pub=await wc.subtle.exportKey('jwk',kp.publicKey);
const b64u=u=>Buffer.from(u).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const pl=b64u(new TextEncoder().encode(JSON.stringify({v:1,id:'T99-0001',no:'T99-0001-1',co:'บริษัท ทดสอบหลายเครื่อง จำกัด',an:'ผู้ทดสอบ',pl:'biz',mx:10,exp:'2099-12-31',iat:'2026-11-01',ap:['pm']})));
const CODE='PNM1.'+pl+'.'+b64u(new Uint8Array(await wc.subtle.sign({name:'ECDSA',hash:'SHA-256'},kp.privateKey,new TextEncoder().encode('PNM1.'+pl))));
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.woff2':'font/woff2','.pdf':'application/pdf','.txt':'text/plain'};
const srv=http.createServer((q,s)=>{const u=decodeURIComponent(new URL(q.url,'http://x').pathname);let f=path.join(SITE,u.replace(/^\/penum\//,''));
  if(!u.startsWith('/penum/')||!f.startsWith(SITE)){s.writeHead(404);return s.end()}
  try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');let b=fs.readFileSync(f);const ext=path.extname(f);
    if(ext==='.html'||ext==='.js'){const t=b.toString('utf8');if(t.includes(KEY[1]))b=Buffer.from(t.replaceAll(KEY[1],pub.x).replaceAll(KEY[2],pub.y))}
    s.writeHead(200,{'content-type':TYPES[ext]||'application/octet-stream','cache-control':'no-store'});s.end(b)}catch(e){s.writeHead(404);s.end()}});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));const BASE=`http://127.0.0.1:${srv.address().port}/penum/`;
const browser=await chromium.launch();

// ---- devices and a company ----
const state=()=>{const st=newState();st.noRev=NOREV;return st};
async function device(st,name,delay){const ctx=await browser.newContext({viewport:{width:1440,height:900},locale:'th-TH',timezoneId:'Asia/Bangkok'});
  await attach(ctx,st,{host:HOST,name,delay});const p=await ctx.newPage(),errs=[],D={ctx,p,errs,name,answer:null};
  p.on('pageerror',e=>errs.push(name+' PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_|net::/.test(m.text()))errs.push(name+' CONSOLE '+m.text().slice(0,300))});
  p.on('dialog',async d=>{const a=D.answer?D.answer(d):undefined;if(a===false)await d.dismiss().catch(()=>{});else await d.accept(typeof a==='string'?a:undefined).catch(()=>{})});return D}
// device A makes the company on the cloud (licence code, setup form, คลาวด์ PENUM); each other device joins with a staff invite link
async function company(st,n,lat){const delay=({m,path})=>lat+Math.random()*lat+(m==='POST'&&/penum-pm\.json$/.test(path)?150:0);
  const A=await device(st,'A',delay),p=A.p;
  await p.goto(BASE+'pm/#lic='+encodeURIComponent(CODE),{waitUntil:'load'});await p.waitForTimeout(2000);
  await p.click('#wzPin');await p.keyboard.type('1234');await p.click('#wzPin2');await p.keyboard.type('1234');
  await p.click('[data-a="wizDone"]');await p.waitForTimeout(800);
  await p.click('[data-a="sbStart"]');await p.waitForFunction(()=>sbOn()&&FS.state==='ok',null,{timeout:60000});
  const people=[['สมชาย ฝ่ายขาย','SAL'],['สมหญิง จัดซื้อ','PUR'],['สมศักดิ์ โครงการ','PRJ'],['สมใจ บัญชี','ACC'],['สมปอง ช่าง','PRJ']].slice(0,n-1),links=[];
  for(const who of people){const id=await p.evaluate(([nm,dept])=>{ACT.add({dataset:{c:'co.staff'}});const r=DB.co.staff[DB.co.staff.length-1];Object.assign(r,{name:nm,dept,role:'พนักงาน'});save();render();return r.id},who);
    A.answer=d=>d.type()==='prompt'?'5678':undefined;await p.evaluate(id=>ACT.pinSet({dataset:{id}}),id);await p.waitForTimeout(300);
    await p.evaluate(id=>ACT.joinLink({dataset:{id}}),id);await p.waitForSelector('#dlg textarea');
    links.push(((await p.$eval('#dlg textarea',e=>e.value)).match(/https?:\S+/)||[])[0]);await p.evaluate(()=>document.querySelector('#dlg').close())}
  A.answer=null;await p.evaluate(()=>folderSync(true));await idle([A]);
  const D=[A];for(let i=0;i<links.length;i++){const B=await device(st,String.fromCharCode(66+i),delay),q=B.p;
    await q.goto(links[i].replace(/^https?:\/\/[^/]+\/penum\//,BASE),{waitUntil:'load'});await q.waitForTimeout(1500);
    await q.click('[data-a="sbJoin"]');await q.waitForFunction(()=>sbOn()&&!FS.busy,null,{timeout:60000});await q.waitForTimeout(600);
    if(await q.$('#pinVal')){await q.fill('#pinVal','5678');await q.click('[data-a="pinIn"]');await q.waitForTimeout(800)}
    D.push(B)}
  return D}
const idle=async D=>{for(const d of D)await d.p.waitForFunction(()=>!FS.busy&&(typeof SSV==='undefined'||!SSV.run)&&FS.state==='ok',null,{timeout:150000})};
// every device has made its 20-second check at least `rounds` times since now
const settle=async(D,rounds=1)=>{await idle(D);for(let i=0;i<rounds;i++){await D[0].p.waitForTimeout(22000);await idle(D)}};
const cloud=st=>JSON.parse([...st.store.entries()].find(([k])=>k.endsWith('/penum-pm.json'))[1].t);
const names=o=>o.co.customers.map(c=>c.name).sort();
const custs=d=>d.p.evaluate(()=>DB.co.customers.map(c=>c.name).sort());
const uploads=(st,from,name)=>st.log.slice(from).filter(x=>x.m==='POST'&&/^\/storage\/v1\/object\/pm\/[^/]+\/penum-pm\.json$/.test(x.path)&&(!name||x.name===name)).length;
const add=(d,nm,at=0)=>d.p.evaluate(([nm,at])=>new Promise(r=>setTimeout(()=>{ACT.add({dataset:{c:'co.customers'}});const x=DB.co.customers[DB.co.customers.length-1];x.name=nm;save();render();r(x.id)},Math.max(0,at-Date.now()))),[nm,at]);
const del=(d,nm,at=0)=>d.p.evaluate(([nm,at])=>new Promise(r=>setTimeout(()=>{const x=DB.co.customers.find(c=>c.name===nm);ACT.delRow({dataset:{c:'co.customers',id:x.id}});r(x.id)},Math.max(0,at-Date.now()))),[nm,at]);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const close=async D=>{for(const d of D)await d.ctx.close().catch(()=>{})};
const results=[];
function report(name,ok,info,D){const errs=D.flatMap(d=>d.errs);ok=ok&&!errs.length;results.push(ok);
  console.log(`${ok?'PASS':'FAIL'} ${name}${NOREV?' (cloud without the 4.99.39 SQL)':''}: ${JSON.stringify(info)}${errs.length?' errors: '+JSON.stringify(errs.slice(0,5)):''}`)}

// ---- scenarios ----
// two devices add a customer 0.2 s apart: both stay, on both devices and in the cloud (until 4.99.38 the first one vanished)
async function race(){const st=state(),D=await company(st,2,150),[A,B]=D;await settle(D);
  await add(A,'ลูกค้าเดิม');await settle(D);
  const T=Date.now()+1500;await Promise.all([add(A,'ลูกค้าจากเครื่อง A',T),add(B,'ลูกค้าจากเครื่อง B',T+200)]);await settle(D,2);
  const c=names(cloud(st)),a=await custs(A),b=await custs(B);
  report('race',c.includes('ลูกค้าจากเครื่อง A')&&c.includes('ลูกค้าจากเครื่อง B')&&same(a,c)&&same(b,c),{cloud:c,A:a,B:b},D);await close(D)}
// a device that only opens pages sends nothing; one edit sends one upload and the other device gets it
async function view(){const st=state(),D=await company(st,2,60),[A,B]=D;await settle(D);
  const walk=async d=>{let n=0;const pages=await d.p.evaluate(()=>NAVD.filter(deptOk).map(x=>[x[0],sbPages(x).length]));
    for(const [dk,np] of pages)for(let i=0;i<np;i++){
      await d.p.evaluate(([dk,i])=>{const b=document.createElement('button');b.type='button';b.dataset.a='sbPg';b.dataset.d=dk;b.dataset.i=i;document.body.appendChild(b);b.click();b.remove()},[dk,i]);await d.p.waitForTimeout(90);n++;
      for(const k of await d.p.evaluate(()=>[...document.querySelectorAll('#view .sub [data-a="sub"]')].map(x=>x.dataset.k))){
        await d.p.evaluate(k=>{const bt=[...document.querySelectorAll('#view .sub [data-a="sub"]')].find(x=>x.dataset.k===k);if(bt)bt.click()},k);await d.p.waitForTimeout(90);n++}}
    return n};
  const m0=st.log.length,opened=[await walk(A),await walk(B)];await settle(D,2);const looking=[uploads(st,m0,'A'),uploads(st,m0,'B')];
  const m1=st.log.length;await add(B,'ลูกค้าจากเครื่อง B');await settle(D,2);const edit=[uploads(st,m1,'A'),uploads(st,m1,'B')],got=(await custs(A)).includes('ลูกค้าจากเครื่อง B');
  report('view',looking[0]===0&&looking[1]===0&&edit[0]===0&&edit[1]===1&&got,{pagesOpened:opened,uploadsWhileLooking:looking,uploadsAfterOneEdit:edit,otherDeviceGotIt:got},D);await close(D)}
// a deletion reaches every device and stays deleted; a deletion on one device and an addition on the other 0.2 s apart both hold
async function remove(){const st=state(),D=await company(st,2,80),[A,B]=D;await settle(D);
  await add(A,'X1');await add(A,'X2');await settle(D);
  const x1=await del(B,'X1');await settle(D,2);const gone1=!(await custs(A)).includes('X1')&&!names(cloud(st)).includes('X1'),noted=!!(cloud(st).co.tomb||{})[x1];
  const T=Date.now()+1500;await Promise.all([del(A,'X2',T),add(B,'Y',T+200)]);await settle(D,3);
  const c=names(cloud(st)),a=await custs(A),b=await custs(B);
  // without the SQL nothing stops the other device's save, read just before the deletion, from bringing X2 back (as before 4.99.39)
  report('delete',gone1&&noted&&c.includes('Y')&&(NOREV||same(c,['Y']))&&same(a,c)&&same(b,c),{X1goneEverywhere:gone1,deletionNoted:noted,cloud:c,A:a,B:b},D);await close(D)}
// every device adds its own customers every 4-12 s for MIN minutes: none may be missing at the end
async function soak(){const st=state(),D=await company(st,NDEV,120);await settle(D);
  const end=Date.now()+MIN*60000;
  await Promise.all(D.map(d=>d.p.evaluate(([nm,end])=>{window.__n=0;const step=()=>{if(Date.now()>end)return;ACT.add({dataset:{c:'co.customers'}});const r=DB.co.customers[DB.co.customers.length-1];r.name=nm+'-'+(++window.__n);save();setTimeout(step,4000+Math.random()*8000)};setTimeout(step,Math.random()*12000)},[d.name,end])));
  await D[0].p.waitForTimeout(MIN*60000+2000);await settle(D,3);
  const made={};for(const d of D)made[d.name]=await d.p.evaluate(()=>window.__n);
  const c=names(cloud(st)),lost=[];for(const [k,n] of Object.entries(made))for(let i=1;i<=n;i++)if(!c.includes(k+'-'+i))lost.push(k+'-'+i);
  let equal=true;for(const d of D)equal=equal&&same(await custs(d),c);
  const rpc={};for(const x of st.log)if(x.m==='RPC'){const k=x.path.split(' ').slice(0,2).join(' ').replace(/ \d+$/,'');rpc[k]=(rpc[k]||0)+1}
  report('soak',!lost.length&&equal,{devices:NDEV,minutes:MIN,made:Object.values(made).reduce((a,b)=>a+b,0),inCloud:c.length,lost:lost.length,allDevicesEqual:equal,uploads:uploads(st,0),rpc},D);await close(D)}

const ALL={race,view,delete:remove,soak};
for(const k of WHICH==='all'?Object.keys(ALL):[WHICH]){if(!ALL[k]){console.error('unknown test '+k);process.exit(2)}
  try{await ALL[k]()}catch(e){results.push(false);console.log('FAIL '+k+': '+(e&&e.stack||e).toString().slice(0,600))}}
await browser.close();srv.close();
console.log(results.every(Boolean)?'all passed':'FAILED');process.exit(results.every(Boolean)?0:1);
