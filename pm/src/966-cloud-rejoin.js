/* ---------- 4.99.2 a cloud device whose sign-in was revoked joins again by itself (user's tablet lost the cloud on 12 ต.ค.) ----------
   Supabase revokes a device's sign-in when an old refresh token is used again (a tablet that froze mid-refresh, two tabs);
   until now the device then needed a new admin or invite link. The device now keeps the code of the link it joined with
   (admin devices read theirs once while signed in) and, when the sign-in is dead, signs in afresh and joins with that code.
   A staff code made new by "ยกเลิกลิงก์เชิญเดิมทั้งหมด" stops this too, so cancelled links stay cancelled.
   Refreshes that run at the same time now share one request, so this device never sends the same refresh token twice. */
{const f=ACT.sbJoin;ACT.sbJoin=async function(){const o=joinP();const x=await f.apply(this,arguments);
  if(o&&o.sp==='sb'&&o.k&&sbOn()&&SB.cid===o.sc){SB.k=o.k;SB.kl=o.wn||'';delete SB.dead;sbSave()}return x}}
let SBTP=null;
// a device whose code no longer works stays "หลุด" (its fresh sign-in has no access) until a new link is opened
const sbDeadErr=()=>Object.assign(new Error('เครื่องนี้หลุดจากคลาวด์ PENUM (สิทธิ์เข้าระบบของเครื่องนี้หมดอายุ) ข้อมูลในเครื่องยังอยู่ครบ ให้ผู้ดูแลระบบส่งลิงก์ผู้ดูแลหรือลิงก์เชิญ แล้วเปิดลิงก์นั้นในเครื่องนี้'),{pass:true});
{const f=sbTok;sbTok=function(){if(SB.dead&&!SBREJ)return Promise.reject(sbDeadErr());if(SB.at&&Date.now()<SB.exp)return Promise.resolve(SB.at);if(SBTP)return SBTP;
  SBTP=(async()=>{try{return await f()}
    catch(e){if(!(e&&e.pass&&SB.k&&SB.cid))throw e;
      delete SB.at;delete SB.rt;SB.exp=0;sbSave();await sbAuth('signup',{data:{}});
      try{const r=await sbRpc('pm_join',{p_company:SB.cid,p_code:SB.k,p_label:SB.kl||''});SB.role=r.role||SB.role;sbSave();return SB.at}
      catch(j){if(/bad code|no such/i.test(String(j&&j.message||j))){delete SB.k;SB.dead=1;sbSave()}throw e}}
    finally{SBTP=null}})();
  return SBTP}}
// an admin device that was on the cloud before 4.99.2 keeps its own admin code once it is signed in
{const f=folderSync;folderSync=async function(){const x=await f.apply(this,arguments);
  if(sbOn()&&SB.role==='admin'&&!SB.k&&FS.state==='ok'){try{const k=await sbCodes();if(k&&k.admin){SB.k=k.admin;SB.kl='';sbSave()}}catch(e){}}return x}}
