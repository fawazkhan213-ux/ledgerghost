import { nebiusChat } from "./nebius.functions";
export type Charge = {
  id: string;
  merchant: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  priorAmount?: number | null;
  currency?: string;
};

const CURRENCY_SIGNS: [RegExp, string][] = [
  [/€|\bEUR\b/i, "EUR"],
  [/£|\bGBP\b/i, "GBP"],
  [/₹|\bINR\b/i, "INR"],
  [/¥|\bJPY\b|\bCNY\b/i, "JPY"],
  [/\bSEK\b|\bNOK\b|\bDKK\b|\bkr\b/i, "SEK"],
  [/\bCHF\b/i, "CHF"],
  [/\bAED\b/i, "AED"],
  [/\$|\bUSD\b/i, "USD"],
];

export function detectCurrency(text: string): string {
  for (const [rx, code] of CURRENCY_SIGNS) if (rx.test(text)) return code;
  return "USD";
}

export function fmtMoney(n: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export type Status = "clear" | "review" | "high";

export type Finding = {
  chargeId: string;
  status: Status;
  reason: string;
  details: string[];
  overcharge: number;
};

export type Settings = {
  mock: boolean;
  apiKey: string;
  baseUrl: string;
  parseModel: string;
  reasonModel: string;
};

export const DEFAULT_SETTINGS: Settings = {
  mock: true,
  apiKey: "",
  baseUrl: "https://api.studio.nebius.com/v1",
  parseModel: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
  reasonModel: "nvidia/Nemotron-3-Ultra-550b-a55b",
};

export const PARSE_MODELS = [
  { id: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B", label: "Nemotron Nano" },
  { id: "nvidia/nemotron-3-super-120b-a12b", label: "Nemotron Super" },
  { id: "nvidia/Nemotron-3_5-Lightning", label: "Nemotron Lightning" },
];
export const REASON_MODELS = [
  { id: "nvidia/Nemotron-3-Ultra-550b-a55b", label: "Nemotron Ultra" },
  { id: "nvidia/nemotron-3-super-120b-a12b", label: "Nemotron Super" },
];

let n = 0;
export const uid = () => `c${Date.now().toString(36)}${(n++).toString(36)}`;

export const SAMPLE: Omit<Charge, "id">[] = [
  { merchant: "Verilink Wireless", date: "2026-09-03", category: "Telecom", description: "Unlimited Plus plan – 2 lines", amount: 120.0, priorAmount: 120.0 },
  { merchant: "Verilink Wireless", date: "2026-09-03", category: "Telecom", description: "Administrative & Network Recovery Surcharge", amount: 7.98, priorAmount: null },
  { merchant: "Cloudnote Pro", date: "2026-09-07", category: "Software", description: "Team plan – monthly", amount: 59.99, priorAmount: 49.99 },
  { merchant: "FreshCart", date: "2026-09-10", category: "Groceries", description: "Grocery order #88213", amount: 84.37, priorAmount: null },
  { merchant: "FreshCart", date: "2026-09-10", category: "Groceries", description: "Service & delivery fee", amount: 9.99, priorAmount: null },
  { merchant: "StreamBox", date: "2026-09-12", category: "Entertainment", description: "Premium 4K subscription", amount: 22.99, priorAmount: 22.99 },
  { merchant: "StreamBox", date: "2026-09-12", category: "Entertainment", description: "Premium 4K subscription", amount: 22.99, priorAmount: 22.99 },
  { merchant: "City Power & Gas", date: "2026-09-15", category: "Utilities", description: "Electricity usage – Aug", amount: 96.42, priorAmount: 91.1 },
  { merchant: "PulseFit Gym", date: "2026-09-18", category: "Fitness", description: "Monthly membership", amount: 39.0, priorAmount: 39.0 },
  { merchant: "PulseFit Gym", date: "2026-09-18", category: "Fitness", description: "Annual facility maintenance fee", amount: 49.0, priorAmount: null },
  { merchant: "Bean & Brew", date: "2026-09-20", category: "Dining", description: "Coffee & pastry", amount: 8.75, priorAmount: null },
];

export const sampleCharges = (): Charge[] => SAMPLE.map((c) => ({ ...c, id: uid() }));

export type Scenario = { id: string; title: string; blurb: string; source: string; charges: Omit<Charge, "id">[] };

export const SCENARIOS: Scenario[] = [
  { id: "household", title: "Household mix", blurb: "Telecom surcharge, SaaS bump, delivery fee", source: "Sample statement — Sept 2026", charges: SAMPLE },
  {
    id: "saas", title: "SaaS creep", blurb: "Seat bumps, duplicate billing, tier hikes", source: "Startup card — Sept 2026",
    charges: [
      { merchant: "Slackr", date: "2026-09-01", category: "Software", description: "Pro plan – 12 seats", amount: 105.0, priorAmount: 87.5 },
      { merchant: "Figment", date: "2026-09-02", category: "Software", description: "Professional – 3 editors", amount: 45.0, priorAmount: 45.0 },
      { merchant: "Figment", date: "2026-09-02", category: "Software", description: "Professional – 3 editors", amount: 45.0, priorAmount: 45.0 },
      { merchant: "Notionly", date: "2026-09-05", category: "Software", description: "Plus plan – monthly", amount: 24.0, priorAmount: 20.0 },
      { merchant: "MailRocket", date: "2026-09-08", category: "Marketing", description: "Growth plan", amount: 79.0, priorAmount: 79.0 },
      { merchant: "MailRocket", date: "2026-09-08", category: "Marketing", description: "Payment processing fee", amount: 2.37, priorAmount: null },
      { merchant: "GitVault", date: "2026-09-10", category: "Software", description: "Team – 5 users", amount: 20.0, priorAmount: 20.0 },
    ],
  },
  {
    id: "eu", title: "EU utilities & telco", blurb: "Euro bill with recovery & admin fees", source: "Rechnung — September 2026",
    charges: [
      { merchant: "Telekon DE", date: "2026-09-02", category: "Telecom", description: "MagentaMobil L", amount: 49.95, priorAmount: 39.95, currency: "EUR" },
      { merchant: "Telekon DE", date: "2026-09-02", category: "Telecom", description: "Network recovery surcharge", amount: 4.99, priorAmount: null, currency: "EUR" },
      { merchant: "Stadtwerke Nord", date: "2026-09-05", category: "Utilities", description: "Strom – Abschlag Sept", amount: 112.0, priorAmount: 98.0, currency: "EUR" },
      { merchant: "Stadtwerke Nord", date: "2026-09-05", category: "Utilities", description: "Administrative billing fee", amount: 3.5, priorAmount: null, currency: "EUR" },
      { merchant: "Vodaweb", date: "2026-09-09", category: "Internet", description: "Glasfaser 500", amount: 44.99, priorAmount: 44.99, currency: "EUR" },
      { merchant: "Lieferblitz", date: "2026-09-14", category: "Groceries", description: "Service & delivery fee", amount: 5.9, priorAmount: null, currency: "EUR" },
    ],
  },
  {
    id: "cloud", title: "Cloud & tools (GBP)", blurb: "Ghost support add-on, surprise overage", source: "Business account — Sept 2026",
    charges: [
      { merchant: "NimbusCloud", date: "2026-09-01", category: "Infrastructure", description: "Compute – monthly", amount: 310.0, priorAmount: 240.0, currency: "GBP" },
      { merchant: "NimbusCloud", date: "2026-09-01", category: "Infrastructure", description: "Premium support plan (auto-enrolled) – convenience add-on", amount: 29.0, priorAmount: null, currency: "GBP" },
      { merchant: "EdgeCDN", date: "2026-09-03", category: "Infrastructure", description: "Bandwidth – 2TB", amount: 64.0, priorAmount: 61.0, currency: "GBP" },
      { merchant: "DomainHub", date: "2026-09-06", category: "Web", description: "Domain auto-renewal", amount: 18.99, priorAmount: 12.99, currency: "GBP" },
      { merchant: "LogStack", date: "2026-09-11", category: "Software", description: "Observability – Team", amount: 49.0, priorAmount: 49.0, currency: "GBP" },
      { merchant: "LogStack", date: "2026-09-11", category: "Software", description: "Observability – Team", amount: 49.0, priorAmount: 49.0, currency: "GBP" },
    ],
  },
];

export const scenarioCharges = (s: Scenario): Charge[] => s.charges.map((c) => ({ ...c, id: uid() }));

const csvCell = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export function auditCSV(charges: Charge[], findings: Finding[]): string {
  const m = new Map(findings.map((f) => [f.chargeId, f]));
  const head = ["Merchant", "Date", "Category", "Description", "Amount", "Prior amount", "Currency", "Status", "Potential overcharge", "Reason"];
  const rows = charges.map((c) => { const f = m.get(c.id); return [c.merchant, c.date, c.category, c.description, c.amount.toFixed(2), c.priorAmount ?? "", c.currency ?? "USD", f?.status ?? "", f?.overcharge?.toFixed(2) ?? "", f?.reason ?? ""]; });
  return [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);

export function auditReportHTML(charges: Charge[], findings: Finding[], source: string): string {
  const m = new Map(findings.map((f) => [f.chargeId, f]));
  const cur = charges[0]?.currency;
  const flagged = findings.filter((f) => f.status !== "clear");
  const total = charges.reduce((s, c) => s + c.amount, 0);
  const savings = flagged.reduce((s, f) => s + f.overcharge, 0);
  const label = { high: "High risk", review: "Needs review", clear: "Clear" } as const;
  const rows = charges.map((c) => { const f = m.get(c.id); const st = f?.status ?? "clear"; return `<tr><td>${esc(c.date)}</td><td><b>${esc(c.merchant)}</b><br><small>${esc(c.description)}</small></td><td class="r">${fmtMoney(c.amount, c.currency)}</td><td><span class="b ${st}">${label[st]}</span></td><td>${f && st !== "clear" ? esc(f.reason) + (f.details.length ? `<ul>${f.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>` : "") : ""}</td></tr>`; }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>LedgerGhost Audit Report</title><style>
body{font:14px/1.5 system-ui,sans-serif;color:#111;max-width:900px;margin:32px auto;padding:0 24px}h1{margin:0}small,.muted{color:#666}
.stats{display:flex;gap:12px;margin:20px 0}.stats div{flex:1;border:1px solid #ddd;border-radius:10px;padding:12px}.stats b{display:block;font-size:22px}
table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #eee;padding:8px;text-align:left;vertical-align:top}.r{text-align:right;font-family:monospace;white-space:nowrap}
.b{font-size:11px;padding:2px 8px;border-radius:99px;white-space:nowrap}.high{background:#fde2e2;color:#a40000}.review{background:#fff2cc;color:#7a5600}.clear{background:#dff5e3;color:#16632b}ul{margin:4px 0 0 16px;padding:0;color:#555}
@media print{.np{display:none}}</style></head><body>
<button class="np" onclick="print()" style="float:right;padding:8px 14px">Print / Save as PDF</button>
<h1>LedgerGhost Audit Report</h1><p class="muted">${esc(source)} · generated ${new Date().toLocaleString()}</p>
<div class="stats"><div><small>Total audited</small><b>${fmtMoney(total, cur)}</b><small>${charges.length} charges</small></div><div><small>Flagged charges</small><b>${flagged.length}</b><small>${findings.filter((f) => f.status === "high").length} high risk</small></div><div><small>Savings opportunity</small><b>${fmtMoney(savings, cur)}</b><small>≈ ${fmtMoney(savings * 12, cur)}/yr if recurring</small></div></div>
<table><thead><tr><th>Date</th><th>Charge</th><th class="r">Amount</th><th>Status</th><th>Finding</th></tr></thead><tbody>${rows}</tbody></table>
<p class="muted" style="margin-top:24px">Findings are automated estimates. Verify with your merchant before disputing.</p></body></html>`;
}

export async function buildAuditPdf(charges: Charge[], findings: Finding[], source: string): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const m = new Map(findings.map((f) => [f.chargeId, f]));
  const cur = charges[0]?.currency;
  const flagged = findings.filter((f) => f.status !== "clear");
  const total = charges.reduce((s, c) => s + c.amount, 0);
  const savings = flagged.reduce((s, f) => s + f.overcharge, 0);
  const label = { high: "HIGH RISK", review: "NEEDS REVIEW", clear: "CLEAR" } as const;
  const colors = { high: rgb(0.64, 0, 0), review: rgb(0.48, 0.34, 0), clear: rgb(0.09, 0.39, 0.17), ink: rgb(0.1, 0.1, 0.1), muted: rgb(0.42, 0.42, 0.42) };

  // Standard PDF fonts only support WinAnsi — swap unsupported glyphs
  const safe = (s: string) => s.replace(/→/g, "->").replace(/≈/g, "~").replace(/·/g, "-").replace(/[–—]/g, "-").replace(/€/g, "EUR ").replace(/£/g, "GBP ").replace(/₹/g, "INR ").replace(/¥/g, "JPY ").replace(/•/g, "-").replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
  const W = 595, H = 842, MX = 48;
  let page = doc.addPage([W, H]);
  let y = H - 60;
  const ensure = (need: number) => { if (y - need < 50) { page = doc.addPage([W, H]); y = H - 60; } };
  const wrap = (text: string, size: number, f = font, maxW = W - MX * 2) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(t, size) > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };
  const para = (text: string, size = 10, f = font, color = colors.ink, gap = 4) => {
    for (const line of wrap(text, size, f)) {
      ensure(size + 4);
      page.drawText(line, { x: MX, y, size, font: f, color });
      y -= size + gap;
    }
  };

  page.drawText("LedgerGhost Audit Report", { x: MX, y, size: 20, font: bold, color: colors.ink });
  y -= 18;
  para(`${source} · generated ${new Date().toLocaleString()}`, 9, font, colors.muted);
  y -= 8;
  para(`Total audited: ${fmtMoney(total, cur)} across ${charges.length} charges`, 11, bold);
  para(`Flagged charges: ${flagged.length} (${findings.filter((f) => f.status === "high").length} high risk)`, 11, bold);
  para(`Savings opportunity: ${fmtMoney(savings, cur)}  (~${fmtMoney(savings * 12, cur)}/yr if recurring)`, 11, bold);
  y -= 10;

  for (const c of charges) {
    const f = m.get(c.id);
    const st = f?.status ?? "clear";
    ensure(60);
    page.drawText(`${c.date}  ${c.merchant}`, { x: MX, y, size: 11, font: bold, color: colors.ink });
    const amt = fmtMoney(c.amount, c.currency);
    page.drawText(amt, { x: W - MX - bold.widthOfTextAtSize(amt, 11), y, size: 11, font: bold, color: colors.ink });
    y -= 14;
    page.drawText(label[st], { x: MX, y, size: 8, font: bold, color: colors[st] });
    y -= 12;
    if (c.description) para(c.description, 9, font, colors.muted, 3);
    if (f && st !== "clear") {
      para(f.reason, 9);
      for (const d of f.details) para(`• ${d}`, 9, font, colors.muted, 3);
      if (f.overcharge > 0) para(`Potential overcharge: ${fmtMoney(f.overcharge, c.currency)}`, 9, bold);
    }
    y -= 8;
  }
  ensure(30);
  para("Findings are automated estimates. Verify with your merchant before disputing.", 8, font, colors.muted);
  return doc.save();
}

const FEE_RX =  /(surcharge|recovery|regulatory|administrative|admin fee|service fee|convenience|processing|maintenance fee|delivery fee|service & delivery|facility)/i;

export function mockAudit(charges: Charge[]): Finding[] {
  return charges.map((c) => {
    const details: string[] = [];
    let status: Status = "clear";
    let overcharge = 0;
    let reason = "Consistent with prior billing and expected merchant pattern.";

    const dup = charges.find(
      (o) => o.id !== c.id && o.merchant === c.merchant && o.description === c.description && o.amount === c.amount && o.date === c.date,
    );
    const isSecondDup = dup && charges.indexOf(dup) < charges.indexOf(c);

    if (isSecondDup) {
      status = "high";
      overcharge = c.amount;
      reason = "Duplicate line item: identical charge billed twice on the same date.";
      details.push(`Matches another ${c.merchant} charge of ${fmtMoney(c.amount, c.currency)} on ${c.date}.`, "Recurring subscriptions should bill once per period.");
    } else if (c.priorAmount && c.amount > c.priorAmount * 1.05) {
      const pct = ((c.amount - c.priorAmount) / c.priorAmount) * 100;
      status = pct >= 15 ? "high" : "review";
      overcharge = +(c.amount - c.priorAmount).toFixed(2);
      reason = `Price increased ${pct.toFixed(0)}% compared to prior period without notice.`;
      details.push(`Prior period: ${fmtMoney(c.priorAmount, c.currency)} → Current: ${fmtMoney(c.amount, c.currency)}.`, pct >= 15 ? "Increase exceeds typical 5–10% annual adjustment — likely a stealth plan bump." : "Could be usage-based; verify against your meter reading or usage.");
    } else if (FEE_RX.test(c.description)) {
      status = /regulatory|recovery|surcharge|administrative/i.test(c.description) ? "high" : "review";
      overcharge = c.amount;
      reason = /regulatory|recovery|surcharge|administrative/i.test(c.description)
        ? "Unitemized regulatory/recovery fee added — not a government tax."
        : "Quiet ancillary fee attached to a primary purchase.";
      details.push("No matching charge in the prior period.", "Fees of this kind are set by the merchant and are often negotiable or waivable.");
    }
    return { chargeId: c.id, status, reason, details, overcharge };
  });
}

export function draftLetter(c: Charge, f: Finding, name = "[Your Name]"): string {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return `${name}
[Your Address]
[Account Number]

${today}

${c.merchant}
Customer Billing Department

Re: Request for review of charge dated ${c.date} — ${fmtMoney(c.amount, c.currency)}

Dear ${c.merchant} Billing Team,

I am writing to respectfully request a review of the following charge on my recent statement:

  • Description: ${c.description}
  • Date: ${c.date}
  • Amount: ${fmtMoney(c.amount, c.currency)}

Upon reviewing my account, I noticed the following: ${f.reason} ${f.details.join(" ")}

I do not recall receiving prior notice of this charge or change. I would be grateful if you could review it and, if appropriate, issue a refund or credit of ${fmtMoney(f.overcharge, c.currency)} to my account. If the charge is valid, I would appreciate an itemized explanation of what it covers.

Thank you for your time and attention. I value my relationship with ${c.merchant} and look forward to your response within 30 days.

Sincerely,

${name}`;
}

export function parseCSV(text: string): Charge[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const split = (l: string) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((s) => s.replace(/,$/, "").replace(/^"|"$/g, "").trim()).filter((_, i, a) => i < a.length - 1 || _ !== "");
  const head = split(lines[0] ?? "").map((h) => h.toLowerCase());
  const idx = (...k: string[]) => head.findIndex((h) => k.some((x) => h.includes(x)));
  const hasHead = idx("amount", "merchant", "date", "description") >= 0;
  const im = hasHead ? idx("merchant", "payee", "vendor", "name") : 0;
  const id = hasHead ? idx("date") : 1;
  const ic = hasHead ? idx("category", "type") : 2;
  const ides = hasHead ? idx("description", "memo", "detail") : 3;
  const ia = hasHead ? idx("amount", "debit", "total") : 4;
  const icur = hasHead ? idx("currency") : -1;
  const fileCur = detectCurrency(text);
  return lines.slice(hasHead ? 1 : 0).map((l) => {
    const r = split(l);
    const rawAmt = r[ia] ?? "0";
    const rowCur = icur >= 0 && /^[A-Za-z]{3}$/.test(r[icur] ?? "") ? (r[icur] as string).toUpperCase() : /[€£₹¥]|\b(EUR|GBP|INR|JPY|USD|SEK|CHF|AED)\b/i.test(rawAmt) ? detectCurrency(rawAmt) : fileCur;
    const cleaned = rawAmt.replace(/[^0-9.,-]/g, "");
    // European format: "1.234,56" or "84,37" → comma is the decimal separator
    const amount = /,\d{1,2}$/.test(cleaned) && (!cleaned.includes(".") || cleaned.lastIndexOf(",") > cleaned.lastIndexOf("."))
      ? Math.abs(parseFloat(cleaned.replace(/\./g, "").replace(",", ".")) || 0)
      : Math.abs(parseFloat(cleaned.replace(/,/g, "")) || 0);
    return {
      id: uid(),
      merchant: r[im] ?? "Unknown",
      date: r[id] ?? "",
      category: ic >= 0 ? r[ic] ?? "Other" : "Other",
      description: ides >= 0 ? r[ides] ?? "" : "",
      amount,
      priorAmount: null,
      currency: rowCur,
    };
  });
}

async function chat(s: Settings, model: string, system: string, user: string) {
  const r = await nebiusChat({ data: { apiKey: s.apiKey || undefined, baseUrl: s.baseUrl, model, system, user } });
  if (!r.ok) throw new Error(r.error);
  return r.content;
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const parts: string[] = [];
  for (let p = 1; p <= Math.min(pdf.numPages, 10); p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    parts.push(tc.items.map((i) => ("str" in i ? i.str : "")).join(" "));
  }
  return parts.join("\n").slice(0, 40000);
}

export async function liveParse(s: Settings, text: string): Promise<Charge[]> {
  const out = await chat(
    s,
    s.parseModel,
    "You are a statement parser. Extract every charge/transaction from the statement text. Return ONLY a JSON array of objects {merchant,date,category,description,amount,priorAmount,currency}. date as YYYY-MM-DD, amount as positive number, priorAmount as last period's amount for the same item or null. currency as the 3-letter ISO code of the currency the charge is billed in (e.g. EUR, GBP, USD, INR) — read it from the currency symbol or label in the statement (€ = EUR, £ = GBP, ₹ = INR, $ = USD); never assume USD when another currency is shown. No commentary.",
    text,
  );
  const m = out.match(/\[[\s\S]*\]/);
  if (!m) throw new Error("Parser returned no charges");
  const rows = JSON.parse(m[0]) as Omit<Charge, "id">[];
  const fileCur = detectCurrency(text);
  return rows.map((r) => ({ ...r, id: uid(), amount: Math.abs(Number(r.amount) || 0), priorAmount: r.priorAmount != null ? Number(r.priorAmount) : null, currency: /^[A-Za-z]{3}$/.test(r.currency ?? "") ? (r.currency as string).toUpperCase() : fileCur }));
}

export async function liveAudit(s: Settings, charges: Charge[]): Promise<Finding[]> {
  const out = await chat(
    s,
    s.reasonModel,
    "You are a forensic billing auditor. Return ONLY a JSON array of objects {chargeId,status:'clear'|'review'|'high',reason,details:string[],overcharge:number} for every charge. Flag duplicates, price hikes vs priorAmount, and hidden fees. Each charge has a currency field — quote amounts in that currency in your reasons and details.",
    JSON.stringify(charges),
  );
  const m = out.match(/\[[\s\S]*\]/);
  if (!m) throw new Error("Model returned no findings");
  return JSON.parse(m[0]);
}

export async function liveLetter(s: Settings, c: Charge, f: Finding) {
  return chat(s, s.reasonModel, "Write a polite, professional dispute letter to a merchant asking them to review or refund a charge. State all amounts in the charge's currency using its proper symbol (e.g. € for EUR, £ for GBP). Plain text with placeholders for sender name/address.", JSON.stringify({ charge: c, finding: f }));
}

export type Trend = {
  merchant: string;
  service: string;
  history: { month: string; price: number }[];
  changePct: number;
  verdict: "hike" | "stable" | "promo-ended" | "above-market";
  insight: string;
  tip: string;
};

const DEMO_TRENDS: Record<string, Omit<Trend, "merchant">> = {
  "Verilink Wireless": { service: "Unlimited Plus (2 lines)", history: [["Apr",100],["May",100],["Jun",110],["Jul",110],["Aug",120],["Sep",127.98]].map(([month,price])=>({month:month as string,price:price as number})), changePct: 28, verdict: "hike", insight: "Two quiet plan increases plus a new network surcharge since April.", tip: "Ask for the loyalty rate or switch to the carrier's current 2-line promo (~$100)." },
  "Cloudnote Pro": { service: "Team plan", history: [["Apr",39.99],["May",39.99],["Jun",49.99],["Jul",49.99],["Aug",49.99],["Sep",59.99]].map(([month,price])=>({month:month as string,price:price as number})), changePct: 50, verdict: "promo-ended", insight: "Intro discount expired in June, then a list-price bump in September.", tip: "Annual billing is ~20% cheaper; ask support to restore the prior rate." },
  "StreamBox": { service: "Premium 4K", history: [["Apr",19.99],["May",19.99],["Jun",19.99],["Jul",22.99],["Aug",22.99],["Sep",22.99]].map(([month,price])=>({month:month as string,price:price as number})), changePct: 15, verdict: "hike", insight: "Industry-wide streaming price increase in July.", tip: "The ad-supported tier costs ~$9.99 if you don't need 4K." },
  "PulseFit Gym": { service: "Monthly membership", history: [["Apr",39],["May",39],["Jun",39],["Jul",39],["Aug",39],["Sep",39]].map(([month,price])=>({month:month as string,price:price as number})), changePct: 0, verdict: "stable", insight: "Base price stable, but an annual fee appeared this month.", tip: "Many gyms waive the facility fee if you ask before it posts." },
};

export function mockTrends(charges: Charge[]): Trend[] {
  const seen = new Set(charges.map((c) => c.merchant));
  return Object.entries(DEMO_TRENDS).filter(([m]) => seen.has(m)).map(([merchant, t]) => ({ merchant, ...t }));
}

export async function liveTrends(s: Settings, charges: Charge[]): Promise<Trend[]> {
  const merchants = Array.from(new Map(charges.map((c) => [c.merchant, { merchant: c.merchant, description: c.description, category: c.category, currentAmount: c.amount, date: c.date }])).values());
  const out = await chat(
    s,
    s.reasonModel,
    "You are a consumer pricing analyst. For each recurring/subscription merchant in the list (skip one-off purchases like groceries or dining), use your knowledge of publicly announced price changes, typical plan pricing and expired intro promos to estimate the monthly price over the 6 months up to the charge date. Return ONLY a JSON array of {merchant,service,history:[{month:'Mon',price:number}] (6 entries, oldest first, last = current amount),changePct:number,verdict:'hike'|'stable'|'promo-ended'|'above-market',insight:string (1 sentence),tip:string (1 sentence, how to save)}. If the merchant is unknown, infer from category norms and say so in insight.",
    JSON.stringify(merchants),
  );
  const m = out.match(/\[[\s\S]*\]/);
  if (!m) throw new Error("Model returned no trends");
  return (JSON.parse(m[0]) as Trend[]).filter((t) => Array.isArray(t.history) && t.history.length);
}
