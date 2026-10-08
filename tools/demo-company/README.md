# Demo company (AEROVA)

Sample data for PENUM PM: a simulated MEP/HVAC contractor, บริษัท แอโรว่า จำกัด (AEROVA Co., Ltd.) (39 staff in 10 departments,
7 customers, 4 projects at different stages, sales pipeline, quotations, service contracts and repair jobs).

Open it in PENUM PM with เมนู → เปิดไฟล์สำรอง and pick `AEROVA-demo-company.json`.
It replaces the company settings in that browser, so try it in a private window first.

Rebuild: `node tools/demo-company/run.mjs` (needs Playwright + Chromium). `seed.js` runs inside pm/index.html and uses the app's own helpers.
