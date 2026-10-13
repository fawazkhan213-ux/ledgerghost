export type Charge = {
  id: string;
  merchant: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  priorAmount?: number | null;
};

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
  parseModel: "nvidia/Llama-3_1-Nemotron-Nano-8B-v1",
  reasonModel: "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1",
};

export const PARSE_MODELS = [
  { id: "nvidia/Llama-3_1-Nemotron-Nano-8B-v1", label: "Nemotron Nano" },
  { id: "nvidia/Llama-3_3-Nemotron-Super-49B-v1", label: "Nemotron Super" },
];
export const REASON_MODELS = [
  { id: "nvidia/Llama-3_1-Nemotron-Ultra-253B-v1", label: "Nemotron Ultra" },
  { id: "nvidia/Llama-3_3-Nemotron-Super-49B-v1", label: "Nemotron Super" },
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

const FEE_RX = /(surcharge|recovery|regulatory|administrative|admin fee|service fee|convenience|processing|maintenance fee|delivery fee|service & delivery|facility)/i;

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
      details.push(`Matches another ${c.merchant} charge of $${c.amount.toFixed(2)} on ${c.date}.`, "Recurring subscriptions should bill once per period.");
    } else if (c.priorAmount && c.amount > c.priorAmount * 1.05) {
      const pct = ((c.amount - c.priorAmount) / c.priorAmount) * 100;
      status = pct >= 15 ? "high" : "review";
      overcharge = +(c.amount - c.priorAmount).toFixed(2);
      reason = `Price increased ${pct.toFixed(0)}% compared to prior period without notice.`;
      details.push(`Prior period: $${c.priorAmount.toFixed(2)} → Current: $${c.amount.toFixed(2)}.`, pct >= 15 ? "Increase exceeds typical 5–10% annual adjustment — likely a stealth plan bump." : "Could be usage-based; verify against your meter reading or usage.");
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

Re: Request for review of charge dated ${c.date} — $${c.amount.toFixed(2)}

Dear ${c.merchant} Billing Team,

I am writing to respectfully request a review of the following charge on my recent statement:

  • Description: ${c.description}
  • Date: ${c.date}
  • Amount: $${c.amount.toFixed(2)}

Upon reviewing my account, I noticed the following: ${f.reason} ${f.details.join(" ")}

I do not recall receiving prior notice of this charge or change. I would be grateful if you could review it and, if appropriate, issue a refund or credit of $${f.overcharge.toFixed(2)} to my account. If the charge is valid, I would appreciate an itemized explanation of what it covers.

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
  return lines.slice(hasHead ? 1 : 0).map((l) => {
    const r = split(l);
    return {
      id: uid(),
      merchant: r[im] ?? "Unknown",
      date: r[id] ?? "",
      category: ic >= 0 ? r[ic] ?? "Other" : "Other",
      description: ides >= 0 ? r[ides] ?? "" : "",
      amount: Math.abs(parseFloat((r[ia] ?? "0").replace(/[^0-9.-]/g, "")) || 0),
      priorAmount: null,
    };
  });
}

async function chat(s: Settings, model: string, system: string, user: string) {
  const res = await fetch(`${s.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: 0.2 }),
  });
  if (!res.ok) throw new Error(`Model request failed (${res.status})`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content as string;
}

export async function liveAudit(s: Settings, charges: Charge[]): Promise<Finding[]> {
  const out = await chat(
    s,
    s.reasonModel,
    "You are a forensic billing auditor. Return ONLY a JSON array of objects {chargeId,status:'clear'|'review'|'high',reason,details:string[],overcharge:number} for every charge. Flag duplicates, price hikes vs priorAmount, and hidden fees.",
    JSON.stringify(charges),
  );
  const m = out.match(/\[[\s\S]*\]/);
  if (!m) throw new Error("Model returned no findings");
  return JSON.parse(m[0]);
}

export async function liveLetter(s: Settings, c: Charge, f: Finding) {
  return chat(s, s.reasonModel, "Write a polite, professional dispute letter to a merchant asking them to review or refund a charge. Plain text with placeholders for sender name/address.", JSON.stringify({ charge: c, finding: f }));
}
