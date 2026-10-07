# PENUM

ชุดเครื่องมือออกแบบงานระบบอาคารที่ทำงานในเบราว์เซอร์ (ไฟล์ HTML ไฟล์เดียว ไม่ต้องติดตั้ง)

| โฟลเดอร์ | เนื้อหา | รุ่น |
|---|---|---|
| `mep/` | **PENUM MEP** คำนวณโหลดความเย็น, ท่อลม, น้ำเย็น, ควันไฟ, ดับเพลิง, ไฟฟ้า, BOQ | v60 (`MEP_BUILD=60`) |
| `bim/` | **PENUM BIM** โปรแกรมแบบ Revit ในเบราว์เซอร์ (IFC, แบบ, ตาราง) | V1.39 |
| `tools/dental-revit/` | สคริปต์ Dynamo/Revit งานทันตกรรม (ยังไม่ได้ทดสอบใน Revit) | |
| `docs/` | roadmap และสถานะงาน (`status-2026-10-07.md` เป็นฉบับล่าสุด) | |

## ใช้งาน

เปิด `mep/index.html` หรือ `bim/index.html` ในเบราว์เซอร์ได้ทันที
ไฟล์เป็นซอร์สของ Claude Artifact (ไม่มีส่วน `<!doctype…<body>`); ฟีเจอร์ที่พึ่ง Artifact runtime
(ฐานข้อมูล `meta/release` สำหรับปุ่มตรวจหาอัปเดต, ดาวน์โหลด, ข้อมูลผู้ใช้) จะทำงานเฉพาะในหน้า Artifact

- PENUM MEP: https://claude.ai/artifact/89886eHGkANsq5qJL74P6u
- PENUM BIM: https://claude.ai/artifact/Vq6P1YQRkfUKiEjjDcPsha

## ติดตั้งเป็นแอปบน Windows (GitHub Pages)

ทุกครั้งที่ push เข้า `main` workflow `.github/workflows/pages.yml` จะรัน `tools/build-pages.mjs` เพื่อห่อซอร์สแต่ละแอปเป็นหน้าเว็บเต็ม
พร้อม manifest และ service worker แล้วขึ้น GitHub Pages ผู้ใช้เปิดหน้าแอปใน Edge หรือ Chrome แล้วกด "ติดตั้งแอป"
แอปจะเปิดเป็นหน้าต่างของตัวเอง ใช้ได้แม้ไม่มีอินเทอร์เน็ต และได้รุ่นใหม่เมื่อเปิดขณะออนไลน์

- ตั้งค่าครั้งแรก: Settings › Pages › Source เลือก **GitHub Actions** (GitHub Pages แบบฟรีต้องเป็น repo สาธารณะ)
- ลองในเครื่อง: `node tools/build-pages.mjs site` แล้วเปิด `site/` ผ่านเว็บเซิร์ฟเวอร์ใดก็ได้
- นอกหน้า Artifact ปุ่มตรวจหาอัปเดตจะแจ้งว่าตรวจไม่ได้ (แอปอัปเดตเองตอนเปิดอยู่แล้ว) และการบันทึกไฟล์ใช้การดาวน์โหลดของเบราว์เซอร์

## อัปเดตโค้ด

หลัง publish รุ่นใหม่ในโปรเจกต์ Claude ให้นำซอร์สล่าสุดมา commit ที่นี่ โดยตัดโครงหน้า
(`<!doctype…<body>` และ `</body></html>`) ออกก่อน
