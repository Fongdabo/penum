// PENUM PM ผู้ช่วย AI (PM 3.71) — Supabase Edge Function "penum-ai".
// The page sends the conversation; this function adds the instructions and the list of app actions, asks Claude,
// and returns Claude's answer. The actions themselves (open a page, read records, draft a document) run in the
// page, on the person's own data, and every change waits for the person to press ยืนยัน there.
// The Anthropic API key is the secret ANTHROPIC_API_KEY (Supabase › Edge Functions › Secrets); it never reaches the page.
// Limits per device per day and per month: tools/ai-setup.sql (rpc penum_ai_take, run with the person's own sign-in).
import Anthropic from "npm:@anthropic-ai/sdk@0.131.0";

const MODEL = "claude-opus-5-5";
const EFFORT = "low"; // quick replies in a chat window; "medium" thinks longer on hard questions
const MAX_BODY = 900_000; // bytes of conversation the page may send

const SYSTEM = `You are "ผู้ช่วย AI", the assistant built into PENUM PM, a project-management web app for Thai MEP / building-systems contractors (projects, BOQ, schedule, purchasing PR/PO, site daily reports, RFI, VO, QA/QC, claims and invoices, sales quotations, HR, accounting, after-sales service).

Who you talk to: staff of one contractor company, usually writing in Thai. Answer in the language they write in (Thai by default), short and plain, like a helpful colleague. Use Thai number and date style the app uses; money is Thai baht.

What you can do, only through the tools:
- find_pages / open_page: find where a feature is and open it for the person ("ใบขอซื้ออยู่ไหน", "เปิดหน้า WIR").
- read_screen: what is on the person's screen now. Each message also starts with a short [หน้าจอ] line saying where they are.
- list_projects, project_summary, read_records: read the company's data to answer questions and summarise (progress, open RFIs, POs not delivered, today's daily reports).
- propose_changes: create or edit records (draft a daily report, a PR or PO, a quotation, an RFI, a VO, a service job, fill fields). The app shows your proposal to the person with ยืนยัน / ยกเลิก; nothing changes until they confirm, and they can undo it afterwards (ย้อนกลับ). Documents you draft are marked "AI ร่าง" and a person must review them (กด ตรวจแล้ว) before they print as final.

Rules:
- Never say something was created or changed unless propose_changes returned "applied". If it returns "cancelled", accept it and ask what to change.
- Read before you write: use read_records to see the fields and a few existing records of a collection before proposing new ones, and use the field names exactly as they appear there. Dates are YYYY-MM-DD. Numbers are plain numbers (no commas).
- Do not invent facts, quantities or prices. If something needed is missing, ask one short question, or leave the field empty and say so.
- Group what belongs together into one propose_changes call (for example a PR with all its item lines in "items").
- You cannot approve, sign, mark as reviewed, change licence/PIN/permissions/salaries, delete records, or send anything outside the app; tell the person which button to press instead.
- The person only sees pages their position allows; if a tool says "no access", tell them who in the company can do it.
- Keep answers short. Use a short list when listing several things. After opening a page or making a change, say in one line what you did.

Collections (use these keys; project collections take project_id, default = the project open now):
project: daily รายงานประจำวัน · rfis RFI · vos งานเพิ่มลด VO · safe ตรวจความปลอดภัย · permits ใบอนุญาตทำงาน · incid อุบัติเหตุ · prs ใบขอซื้อ PR (items: desc, unit, q, bud) · pos ใบสั่งซื้อ PO (items: desc, unit, q, p) · vendors ผู้ขาย · tasks แผนงาน · costs ค่าใช้จ่ายอื่น · wir ขอตรวจงาน WIR · ncr NCR · punch Punch list · subm เอกสารส่งอนุมัติ · bills เบิกงวด (read only) · boq รายการ BOQ (read only)
company: co.quotes ใบเสนอราคา (items: desc, unit, q, sp = unit selling price) · co.customers ลูกค้า · co.leads งานที่กำลังติดตาม · co.tickets งานซ่อม/บริการ · co.staff พนักงาน (read only, no pay data)`;

const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "find_pages",
    description: "Search the app's menu for pages and tabs by words people use (Thai or English), e.g. 'ใบขอซื้อ', 'สลิป', 'WIR', 'ปร.4'. Empty query lists every page the person may open. Returns page_id, label and menu path.",
    input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
  {
    name: "open_page",
    description: "Open a page for the person. page_id comes from find_pages (e.g. 'pj.site.daily', 'co.sales.quote'). For a project page pass project_id to switch project. record_id selects a document on pages that show one at a time (PR, PO, daily report, quotation, claim, WIR, NCR).",
    input_schema: {
      type: "object",
      properties: { page_id: { type: "string" }, project_id: { type: "string" }, record_id: { type: "string" } },
      required: ["page_id"],
    },
  },
  {
    name: "read_screen",
    description: "Text currently shown on the person's screen (page title, tables, forms), trimmed. Use when they ask about 'this page' or 'ตรงนี้'.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "list_projects",
    description: "All projects: id, name, client, start, finish, contract value, progress, and which one is open now.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "project_summary",
    description: "One project's facts as text: contract, BOQ by group, schedule progress, open RFI/VO/NCR/punch, POs not delivered, latest daily reports.",
    input_schema: { type: "object", properties: { project_id: { type: "string" } } },
  },
  {
    name: "read_records",
    description: "Read records of one collection (newest first). Returns the field names a new record has, and the records (photos and private fields removed). search filters by text in any field.",
    input_schema: {
      type: "object",
      properties: {
        collection: { type: "string" },
        project_id: { type: "string" },
        search: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 50 },
      },
      required: ["collection"],
    },
  },
  {
    name: "propose_changes",
    description: "Propose creating or editing records. The person sees the list and presses ยืนยัน or ยกเลิก; the result says 'applied' (with new record ids) or 'cancelled'. op 'create' adds a record with the collection's defaults plus fields (document numbers are given automatically unless you set no). op 'update' sets the given fields on record_id. Arrays such as items replace the whole list on update.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "One line in the person's language, e.g. 'สร้างรายงานประจำวัน 12 ต.ค.'" },
        changes: {
          type: "array",
          minItems: 1,
          maxItems: 20,
          items: {
            type: "object",
            properties: {
              op: { type: "string", enum: ["create", "update"] },
              collection: { type: "string" },
              project_id: { type: "string" },
              record_id: { type: "string" },
              fields: { type: "object" },
              why: { type: "string" },
            },
            required: ["op", "collection", "fields"],
          },
        },
      },
      required: ["title", "changes"],
    },
  },
];

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};
const out = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function rpc(name: string, args: unknown, auth: string, apikey: string) {
  const url = Deno.env.get("SUPABASE_URL") + "/rest/v1/rpc/" + name;
  return await fetch(url, {
    method: "POST",
    headers: { apikey, Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return out({ error: "method" }, 405);
  if (!Deno.env.get("ANTHROPIC_API_KEY")) return out({ error: "nokey" }, 503);
  const auth = req.headers.get("Authorization") ?? "";
  const apikey = req.headers.get("apikey") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!auth.startsWith("Bearer ")) return out({ error: "signin" }, 401);

  const raw = await req.text();
  if (raw.length > MAX_BODY) return out({ error: "toolong" }, 413);
  let messages: Anthropic.Beta.BetaMessageParam[];
  try {
    messages = JSON.parse(raw).messages;
    if (!Array.isArray(messages) || !messages.length || messages.length > 400) throw 0;
  } catch {
    return out({ error: "bad" }, 400);
  }

  // the person's own sign-in counts one request against the limits
  const t = await rpc("penum_ai_take", {}, auth, apikey);
  if (t.status === 404) return out({ error: "nosql" }, 503);
  if (!t.ok) return out({ error: "signin" }, 401);
  const take = await t.json();
  if (!take.ok) return out({ error: take.why || "limit", max: take.max }, 429);

  try {
    const r = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      tools: TOOLS,
      messages,
      output_config: { effort: EFFORT },
      cache_control: { type: "ephemeral" },
      betas: ["server-side-fallback-2026-07-01"],
      // a request a safety check declines is re-run on the model Anthropic recommends for it
      fallbacks: "default",
    });
    const u = r.usage;
    await rpc("penum_ai_used", {
      p_in: (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0),
      p_out: u.output_tokens ?? 0,
    }, auth, apikey).catch(() => {});
    return out({ content: r.content, stop_reason: r.stop_reason, left: Math.max(0, (take.max ?? 0) - (take.n ?? 0)) });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return out({ error: "badkey" }, 502);
    if (e instanceof Anthropic.PermissionDeniedError) return out({ error: "badkey" }, 502);
    if (e instanceof Anthropic.RateLimitError) return out({ error: "rate" }, 429);
    if (e instanceof Anthropic.BadRequestError) return out({ error: "bad", detail: String(e.message).slice(0, 300) }, 400);
    if (e instanceof Anthropic.APIError) return out({ error: "busy", detail: String(e.message).slice(0, 300) }, 502);
    return out({ error: "busy", detail: String(e).slice(0, 300) }, 502);
  }
});
