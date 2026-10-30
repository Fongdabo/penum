/* ---------- 4.99.1 a device that cannot read the shared data never writes its own copy over it (user: tablet stuck at QT-003) ----------
   fRead (290) turned every failure into "no file", so a sync whose download failed but whose upload went through wrote this
   device's older data over penum-pm.json; the next sync on the computer then took the missing quotes as deleted (merge3).
   Now only a file that is really not there counts as missing; any other failure stops the sync with its message and writes nothing.
   A cloud device whose sign-in was revoked (Supabase "Invalid Refresh Token") gets a Thai message saying what to do, and opening
   the admin link or an invite link again signs it in afresh instead of failing on the dead token. */
{const f=fRead;fRead=async function(dir,name){if(name!==FNAME)return f.apply(this,arguments);
  try{const fl=await (await dir.getFileHandle(name)).getFile();return {txt:await fl.text(),mtime:fl.lastModified}}
  catch(e){if(e&&(e.name==='NotFoundError'||e.name==='TypeMismatchError'))return null;if(e&&e.pass)throw e;
    throw new Error('อ่านข้อมูลกลางไม่ได้ ('+((e&&e.message)||e)+') ยังไม่ได้บันทึกทับ ข้อมูลในเครื่องนี้ยังอยู่ครบ ลองใหม่อีกครั้ง')}}}
const sbDead=e=>/refresh.?token/i.test(String(e&&e.message||e));
let SBREJ=false;
{const f=sbTok;sbTok=async function(){try{return await f.apply(this,arguments)}
  catch(e){if(!sbDead(e))throw e;
    if(SBREJ){delete SB.at;delete SB.rt;SB.exp=0;sbSave();return sbAuth('signup',{data:{}})}
    throw Object.assign(new Error('เครื่องนี้หลุดจากคลาวด์ PENUM (สิทธิ์เข้าระบบของเครื่องนี้หมดอายุ) ข้อมูลในเครื่องยังอยู่ครบ ให้ผู้ดูแลระบบส่งลิงก์ผู้ดูแลหรือลิงก์เชิญ แล้วเปิดลิงก์นั้นในเครื่องนี้'),{pass:true})}}}
{const f=ACT.sbJoin;ACT.sbJoin=async function(){SBREJ=true;try{return await f.apply(this,arguments)}finally{SBREJ=false}}}
