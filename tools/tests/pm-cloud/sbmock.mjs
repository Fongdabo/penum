// In-memory stand-in for ORIEN's Supabase, for tests only: no real company data is read or written.
// Written from tools/pm-cloud-setup.sql, team-setup.sql, link-setup.sql and licence-setup.sql: sign-up and refresh, storage of
// bucket "pm" (list with times, download, upsert, delete), rpc pm_create_company / pm_join / pm_get_codes / pm_rev / pm_lock /
// pm_unlock and the penum_team_* / penum_link_* / penum_lic_get / penum_fb_send ones the apps call at start.
// attach(ctx, st, {host, name, delay}) routes every request of one browser context (= one device) to the shared state st.
// st.noRev = true plays a cloud that has not run the 4.99.39 part of pm-cloud-setup.sql (pm_rev/pm_lock/pm_unlock missing).
import {randomUUID,randomBytes} from 'crypto';
export function newState(){return {users:new Map(),co:new Map(),store:new Map(),link:new Map(),tkey:new Map(),team:new Map(),lic:new Map(),fb:[],log:[],clock:0,off:new Set(),revs:new Map(),noRev:false,lockMs:60000}}
const CORS={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS','access-control-expose-headers':'*'};
const now=st=>{const t=Math.max(Date.now(),st.clock+1);st.clock=t;return t};
const iso=t=>new Date(t).toISOString();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
export async function attach(ctx,st,opt={}){const name=opt.name||'dev';
  await ctx.route(opt.host+'/**',async route=>{const req=route.request(),u=new URL(req.url()),m=req.method(),path=u.pathname;
    const reply=(status,body,ct='application/json')=>route.fulfill({status,headers:{...CORS,'content-type':ct},body:typeof body==='string'?body:JSON.stringify(body)}).catch(()=>{});
    if(m==='OPTIONS')return reply(204,'');
    if(st.off.has(name)||(opt.offline&&opt.offline()))return route.abort('internetdisconnected').catch(()=>{});
    const d=opt.delay?await opt.delay({m,path,name}):0;if(d)await wait(d);
    if(opt.fail){const f=opt.fail({m,path,name});if(f)return reply(f,{message:'mock failure'})}
    let body=null;try{body=req.postDataJSON()}catch(e){body=req.postData()}
    const auth=(req.headers()['authorization']||'').replace(/^Bearer /,''),uid=st.users.get(auth);
    st.log.push({t:Date.now(),name,m,path:path.slice(0,90),sz:(req.postData()||'').length});
    try{
    if(path.startsWith('/auth/v1/')){
      if(path==='/auth/v1/signup'){const id=randomUUID(),at='at-'+randomBytes(8).toString('hex'),rt='rt-'+randomBytes(8).toString('hex');st.users.set(at,id);st.users.set(rt,id);return reply(200,{access_token:at,refresh_token:rt,expires_in:3600,user:{id}})}
      if(path==='/auth/v1/token'){const id=st.users.get(body&&body.refresh_token);if(!id)return reply(400,{error_description:'Invalid Refresh Token: Refresh Token Not Found'});const at='at-'+randomBytes(8).toString('hex');st.users.set(at,id);return reply(200,{access_token:at,refresh_token:body.refresh_token,expires_in:3600,user:{id}})}
      return reply(404,{})}
    if(path.startsWith('/rest/v1/rpc/')){const fn=path.split('/').pop(),a=body||{};
      if(fn==='pm_create_company'){if(!uid)return reply(401,{message:'not signed in'});const id=randomUUID(),c={id,name:a.p_name,lic:a.p_lic,staff:randomBytes(18).toString('hex'),admin:randomBytes(18).toString('hex'),members:new Map([[uid,'admin']])};st.co.set(id,c);return reply(200,{id,staff:c.staff,admin:c.admin})}
      if(fn==='pm_join'){const c=st.co.get(a.p_company);if(!uid)return reply(401,{message:'not signed in'});if(!c)return reply(400,{message:'no such company'});const r=a.p_code===c.admin?'admin':a.p_code===c.staff?'staff':null;if(!r)return reply(400,{message:'bad code'});if(c.members.get(uid)!=='admin')c.members.set(uid,r);return reply(200,{id:c.id,role:r,name:c.name})}
      if(fn==='pm_get_codes'){const c=st.co.get(a.p_company);if(!c||c.members.get(uid)!=='admin')return reply(400,{message:'admins only'});if(a.p_new)c.staff=randomBytes(18).toString('hex');return reply(200,{staff:c.staff,admin:c.admin})}
      if(fn==='penum_link_put'){const t=now(st);st.link.set(a.p_k+'|'+a.p_s,{iv:a.p_iv,ct:a.p_ct,at:iso(t)});return reply(200,JSON.stringify(iso(t)))}
      if(fn==='penum_link_get'){const r=st.link.get(a.p_k+'|'+a.p_s);return reply(200,r?r:'null')}
      if(fn==='penum_link_at'){const o={};for(const k of a.p_k||[])for(const s of ['mep','bim','hand']){const r=st.link.get(k+'|'+s);if(r)(o[k]=o[k]||{})[s]=r.at}return reply(200,o)}
      if(fn==='penum_team_key_get'){const e=st.tkey.get(a.p_k);return reply(200,e?JSON.stringify(e):'null')}
      if(fn==='penum_team_key_add'){if(!st.tkey.has(a.p_k))st.tkey.set(a.p_k,a.p_e);return reply(200,JSON.stringify(st.tkey.get(a.p_k)))}
      if(fn==='penum_team_list'){const t=Date.now();const L=[...st.team.values()].filter(r=>r.t===a.p_t&&r.a===a.p_a).sort((x,y)=>y.mat-x.mat).slice(0,500).map(r=>{const live=r.lat&&r.lat>t-150000;return {p:r.p,m:r.m,at:iso(r.at),mat:iso(r.mat),off:r.off,size:r.d.length,ld:live?r.ld:'',lw:live?r.lw:'',lat:r.lat?iso(r.lat):null}});return reply(200,L)}
      if(fn==='penum_team_get'){const r=st.team.get(a.p_t+'|'+a.p_p);return reply(200,r?{d:r.d,at:iso(r.at),m:r.m}:'null')}
      if(fn==='penum_team_put'){const key=a.p_t+'|'+a.p_p,r=st.team.get(key),n=now(st);
        if(!r){if(a.p_d==null)return reply(200,{none:true});st.team.set(key,{t:a.p_t,p:a.p_p,a:a.p_a,m:a.p_m,d:a.p_d,at:n,mat:n,off:false,ld:a.p_dev,lw:'',lat:n});return reply(200,{at:iso(n)})}
        if(a.p_d==null){r.m=a.p_m;r.mat=n;return reply(200,{at:iso(r.at)})}
        if(r.off)return reply(200,{off:true});
        if(r.ld&&r.ld!==a.p_dev&&r.lat>n-150000)return reply(200,{lock:true,ld:r.ld,lw:r.lw,lat:iso(r.lat)});
        if(a.p_base==null||Date.parse(a.p_base)!==r.at)return reply(200,{stale:iso(r.at)});
        Object.assign(r,{m:a.p_m,d:a.p_d,at:n,mat:n,ld:a.p_dev,lat:n});return reply(200,{at:iso(n)})}
      if(fn==='penum_team_lock'){const r=st.team.get(a.p_t+'|'+a.p_p),n=now(st);if(!r)return reply(200,{none:true});if(r.off)return reply(200,{off:true,at:iso(r.at)});
        if(r.ld&&r.ld!==a.p_dev&&r.lat>n-150000&&!a.p_force)return reply(200,{ok:false,ld:r.ld,lw:r.lw,lat:iso(r.lat),at:iso(r.at)});
        Object.assign(r,{ld:a.p_dev,lw:a.p_lw,lat:n});return reply(200,{ok:true,at:iso(r.at)})}
      if(fn==='penum_team_unlock'){const r=st.team.get(a.p_t+'|'+a.p_p);if(r&&r.ld===a.p_dev){r.ld='';r.lw='';r.lat=null}return reply(200,'null')}
      if(fn==='penum_team_off'){const r=st.team.get(a.p_t+'|'+a.p_p);if(r){r.off=!!a.p_off;r.mat=now(st)}return reply(200,'null')}
      // 4.99.39 tools/pm-cloud-setup.sql: pm_rev / pm_lock / pm_unlock (st.noRev = the SQL not run yet)
      if(/^pm_(rev|lock|unlock)$/.test(fn)){if(st.noRev)return reply(404,{code:'PGRST202',message:'Could not find the function public.'+fn});
        const c=st.co.get(a.p_company);if(!uid||!c||!c.members.has(uid)||String(a.p_path||'').split('/')[0]!==a.p_company)return reply(400,{code:'P0001',message:'not a member'});
        let r=st.revs.get(a.p_path);const t=Date.now();
        if(fn==='pm_rev'){st.log.push({t,name,m:'RPC',path:'rev '+(r?r.rev:0)});return reply(200,{rev:r?r.rev:0,at:r&&r.at?iso(r.at):null})}
        if(fn==='pm_lock'){if(!r){r={rev:0,lk:null,until:0,at:0};st.revs.set(a.p_path,r)}
          if(r.lk&&r.lk!==a.p_dev&&r.until>t){st.log.push({t,name,m:'RPC',path:'lock busy'});return reply(200,{busy:true,rev:r.rev,wait:Math.ceil((r.until-t)/1000)})}
          if(r.rev!==(a.p_base==null?-1:+a.p_base)){st.log.push({t,name,m:'RPC',path:'lock stale '+a.p_base+'<'+r.rev});return reply(200,{stale:true,rev:r.rev})}
          r.lk=a.p_dev;r.until=t+st.lockMs;st.log.push({t,name,m:'RPC',path:'lock ok '+r.rev});return reply(200,{ok:true,rev:r.rev})}
        if(!r)return reply(200,{lost:true,rev:0});
        if(a.p_saved!==false){r.rev++;r.at=t}
        if(r.lk!==a.p_dev){st.log.push({t,name,m:'RPC',path:'unlock lost '+r.rev});return reply(200,{lost:true,rev:r.rev})}
        r.lk=null;r.until=0;st.log.push({t,name,m:'RPC',path:'unlock '+r.rev});return reply(200,{ok:true,rev:r.rev})}
      if(fn==='penum_lic_get'){const o={};for(const k of a.p_k||[])if(st.lic.has(k))o[k]=st.lic.get(k);return reply(200,o)}
      if(fn==='penum_fb_send'){st.fb.push(a);return reply(200,'true')}
      return reply(404,{code:'PGRST202',message:'Could not find the function '+fn})}
    if(path.startsWith('/storage/v1/object')){if(!uid)return reply(401,{message:'no auth'});
      const member=p=>{const c=st.co.get(p.split('/')[0]);return !!(c&&c.members.has(uid))};
      if(path==='/storage/v1/object/list/pm'){const pre=(body.prefix||'').replace(/\/$/,'');if(!member(pre))return reply(200,[]);const seen=new Map();
        for(const [k,v] of st.store){if(!k.startsWith(pre+'/'))continue;const rest=k.slice(pre.length+1),i=rest.indexOf('/');
          if(i<0){if(!body.search||rest.includes(body.search))seen.set(rest,{name:rest,id:v.id,updated_at:iso(v.m),created_at:iso(v.c)})}else{const dn=rest.slice(0,i);if(!seen.has(dn)&&(!body.search||dn.includes(body.search)))seen.set(dn,{name:dn,id:null})}}
        const L=[...seen.values()].sort((x,y)=>x.name.localeCompare(y.name));return reply(200,L.slice(body.offset||0,(body.offset||0)+(body.limit||100)))}
      if(m==='GET'&&path.startsWith('/storage/v1/object/authenticated/pm/')){const k=decodeURIComponent(path.slice('/storage/v1/object/authenticated/pm/'.length));if(!member(k))return reply(400,{message:'not allowed'});const v=st.store.get(k);if(!v)return reply(404,{message:'not found'});return reply(200,v.t,'text/plain')}
      if(m==='POST'&&path.startsWith('/storage/v1/object/pm/')){const k=decodeURIComponent(path.slice('/storage/v1/object/pm/'.length));if(!member(k))return reply(403,{message:'not allowed'});const t=now(st),o=st.store.get(k);st.store.set(k,{t:req.postData()||'',m:t,c:o?o.c:t,id:o?o.id:randomUUID()});if(opt.onWrite)opt.onWrite(k,name);return reply(200,{Key:'pm/'+k})}
      if(m==='DELETE'&&path==='/storage/v1/object/pm'){for(const k of body.prefixes||[])if(member(k))st.store.delete(k);return reply(200,[])}
      return reply(404,{})}
    return reply(404,{})
    }catch(e){console.log('MOCK ERR',path,e.message);return reply(500,{message:e.message})}});
  // the chat's realtime socket: none in the mock
  await ctx.routeWebSocket?.(/realtime\/v1\/websocket/,ws=>{ws.onMessage(()=>{})}).catch(()=>{});
}
