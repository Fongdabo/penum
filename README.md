# PENUM

ชุดเครื่องมือออกแบบงานระบบอาคารที่ทำงานในเบราว์เซอร์ (ไฟล์ HTML ไฟล์เดียว ไม่ต้องติดตั้ง)

| โฟลเดอร์ | เนื้อหา | รุ่น |
|---|---|---|
| `mep/` | **PENUM MEP** คำนวณโหลดความเย็น, ท่อลม, น้ำเย็น, ควันไฟ, ดับเพลิง, ไฟฟ้า, BOQ | v60 (`MEP_BUILD=60`) |
| `bim/` | **PENUM BIM** โปรแกรมแบบ Revit ในเบราว์เซอร์ (IFC, แบบ, ตาราง) | V1.34 |
| `tools/dental-revit/` | สคริปต์ Dynamo/Revit งานทันตกรรม (ยังไม่ได้ทดสอบใน Revit) | |
| `docs/` | roadmap และสถานะงาน (`status-2026-10-07.md` เป็นฉบับล่าสุด) | |

## ใช้งาน

เปิด `mep/index.html` หรือ `bim/index.html` ในเบราว์เซอร์ได้ทันที
ไฟล์เป็นซอร์สของ Claude Artifact (ไม่มีส่วน `<!doctype…<body>`); ฟีเจอร์ที่พึ่ง Artifact runtime
(ฐานข้อมูล `meta/release` สำหรับปุ่มตรวจหาอัปเดต, ดาวน์โหลด, ข้อมูลผู้ใช้) จะทำงานเฉพาะในหน้า Artifact

- PENUM MEP: https://claude.ai/artifact/89886eHGkANsq5qJL74P6u
- PENUM BIM: https://claude.ai/artifact/Vq6P1YQRkfUKiEjjDcPsha

## อัปเดตโค้ด

หลัง publish รุ่นใหม่ในโปรเจกต์ Claude ให้นำซอร์สล่าสุดมา commit ที่นี่ โดยตัดโครงหน้า
(`<!doctype…<body>` และ `</body></html>`) ออกก่อน
