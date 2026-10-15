import { createFileRoute } from "@tanstack/react-router";
import { FeatureCards } from "@/components/FeatureCards";
import { AccountMenu } from "@/components/AccountMenu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ghost, Upload, Sparkles, Settings as Cog, Moon, Sun, Plus, Trash2, ArrowLeft, ShieldAlert,
  ShieldCheck, AlertTriangle, X, Copy, Download, FileText, Loader2, Check, ScanSearch, History, TrendingUp,
} from "lucide-react";
import {
  type Charge, type Finding, type Settings, type Status, type Trend, DEFAULT_SETTINGS, PARSE_MODELS, REASON_MODELS,
  sampleCharges, mockAudit, draftLetter, parseCSV, liveAudit, liveLetter, liveParse, extractPdfText, uid, mockTrends, liveTrends, fmtMoney,
  type Scenario, SCENARIOS, scenarioCharges, auditCSV, auditReportHTML,
} from "@/lib/ledger";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LedgerGhost — Audit hidden fees & dispute charges" },
      { name: "description", content: "An autonomous agent that audits statements for stealth price hikes, duplicate charges and quiet fees, then drafts dispute letters." },
      { property: "og:title", content: "LedgerGhost — Audit hidden fees & dispute charges" },
      { property: "og:description", content: "Find stealth price hikes, duplicates and quiet fees. Draft polite dispute letters in one click." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type Step = "home" | "review" | "results";
const money = (n: number, currency?: string) => fmtMoney(n, currency);

type AuditRecord = { id: string; at: number; source: string; charges: Charge[]; findings: Finding[] };
const loadHistory = (): AuditRecord[] => { try { return JSON.parse(localStorage.getItem("lg-history") ?? "[]"); } catch { return []; } };

function App() {
  const [step, setStep] = useState<Step>("home");
  const [charges, setCharges] = useState<Charge[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [dark, setDark] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [history, setHistory] = useState<AuditRecord[]>([]);
  const { user, profile, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!user) { setHistory(loadHistory()); return; }
    supabase.from("audits").select("id, record, created_at").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setHistory((data ?? []).map((r) => ({ ...(r.record as unknown as AuditRecord), id: r.id }))));
  }, [user, ready]);

  const saveRecord = async (source: string, list: Charge[], f: Finding[]) => {
    const rec: AuditRecord = { id: uid(), at: Date.now(), source, charges: list, findings: f };
    if (user) {
      const { data } = await supabase.from("audits").insert({ user_id: user.id, record: rec as never }).select("id").single();
      if (data) rec.id = data.id;
      setHistory((h) => [rec, ...h]);
      return;
    }
    const next = [rec, ...history].slice(0, 20);
    setHistory(next);
    localStorage.setItem("lg-history", JSON.stringify(next));
  };
  const deleteRecord = async (id: string) => {
    const next = history.filter((r) => r.id !== id);
    setHistory(next);
    if (user) { await supabase.from("audits").delete().eq("id", id); return; }
    localStorage.setItem("lg-history", JSON.stringify(next));
  };
  const openRecord = (r: AuditRecord) => { setCharges(r.charges); setFindings(r.findings); setSourceName(r.source); setStep("results"); };

  useEffect(() => {
    const s = localStorage.getItem("lg-settings");
    if (s) {
      const p = { ...DEFAULT_SETTINGS, ...JSON.parse(s) } as Settings;
      if (!/Nemotron-3|nemotron-3/.test(p.parseModel)) p.parseModel = DEFAULT_SETTINGS.parseModel;
      if (!/Nemotron-3|nemotron-3/.test(p.reasonModel)) p.reasonModel = DEFAULT_SETTINGS.reasonModel;
      setSettings(p);
    }
    setDark(localStorage.getItem("lg-dark") === "1");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("lg-dark", dark ? "1" : "0");
  }, [dark]);
  const saveSettings = (s: Settings) => { setSettings(s); localStorage.setItem("lg-settings", JSON.stringify(s)); };

  const runAudit = async (list = charges, source = sourceName) => {
    setBusy(true); setError("");
    try {
      await new Promise((r) => setTimeout(r, 1100));
      const f = settings.mock ? mockAudit(list) : await liveAudit(settings, list);
      setFindings(f); setStep("results");
      saveRecord(source || "Untitled audit", list, f);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const trySample = (sc: Scenario = SCENARIOS[0]!) => { const s = scenarioCharges(sc); setSourceName(sc.source); setCharges(s); runAudit(s, sc.source); };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button onClick={() => setStep("home")} className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Ghost className="h-4 w-4" /></span>
            LedgerGhost
          </button>
          <nav className="ml-6 hidden gap-1 text-sm sm:flex">
            {(["home", "review", "results"] as Step[]).map((s, i) => (
              <button key={s} disabled={s !== "home" && !charges.length || (s === "results" && !findings.length)} onClick={() => setStep(s)}
                className={`rounded-md px-3 py-1.5 capitalize disabled:opacity-40 ${step === s ? "bg-secondary font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                {i + 1}. {s === "home" ? "Launch" : s}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={busy} aria-label={settings.mock ? "Switch to Live Nemotron" : "Switch to Instant Demo"} title={settings.mock ? "Switch to Live Nemotron" : "Switch to Instant Demo"} onClick={() => saveSettings({ ...settings, mock: !settings.mock })}>
              {settings.mock ? <Sparkles /> : <ScanSearch />}
              <span className="hidden lg:inline">{settings.mock ? "Instant Demo" : "Live Nemotron"}</span>
            </Button>
            <IconBtn label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</IconBtn>
            <IconBtn label="AI settings" onClick={() => setShowSettings(true)}><Cog className="h-4 w-4" /></IconBtn>
            {ready && <AccountMenu user={user} profile={profile} />}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error && <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {step === "home" && <Home busy={busy} settings={settings} onSample={trySample} history={history} onOpenRecord={openRecord} onDeleteRecord={deleteRecord} onLoaded={(c, name) => { setCharges(c); setSourceName(name); setFindings([]); setStep("review"); }} />}
        {step === "review" && <Review charges={charges} setCharges={setCharges} source={sourceName} busy={busy} onRun={() => runAudit()} onBack={() => setStep("home")} />}
        {step === "results" && <Results charges={charges} findings={findings} settings={settings} source={sourceName} onBack={() => setStep("review")} />}
      </main>

      {showSettings && <SettingsModal settings={settings} onSave={(s) => { saveSettings(s); setShowSettings(false); }} onClose={() => setShowSettings(false)} />}
    </div>
  );
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return <button aria-label={label} onClick={onClick} className="grid h-9 w-9 place-items-center rounded-lg border bg-card hover:bg-secondary">{children}</button>;
}

function Home({ busy, settings, onSample, onLoaded, history, onOpenRecord, onDeleteRecord }: {
  busy: boolean; settings: Settings; onSample: (s?: Scenario) => void; onLoaded: (c: Charge[], name: string) => void;
  history: AuditRecord[]; onOpenRecord: (r: AuditRecord) => void; onDeleteRecord: (id: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [note, setNote] = useState("");
  const [parsing, setParsing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState("");

  const stage = (list: FileList | null) => {
    if (!list?.length) return;
    setNote("");
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...Array.from(list).filter((f) => !names.has(f.name + f.size))];
    });
  };

  const parseOne = async (file: File): Promise<Charge[]> => {
    if (file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv") {
      const rows = parseCSV(await file.text());
      if (!rows.length) throw new Error(`Couldn't find any charges in ${file.name}.`);
      return rows;
    }
    if (file.name.toLowerCase().endsWith(".pdf") && !settings.mock) {
      const text = await extractPdfText(file);
      if (!text.trim()) throw new Error(`${file.name}: no readable text (scanned documents aren't supported yet).`);
      const rows = await liveParse(settings, text);
      if (!rows.length) throw new Error(`${file.name}: the parser found no charges.`);
      return rows;
    }
    // Mock mode or image: simulate extraction with the sample set
    return sampleCharges();
  };

  const analyze = async () => {
    if (!files.length) return;
    setParsing(true); setNote("");
    const all: Charge[] = [];
    const errs: string[] = [];
    const simulated = settings.mock || files.some((f) => !/\.(csv|pdf)$/i.test(f.name));
    for (const [i, f] of files.entries()) {
      setProgress(`${f.name} (${i + 1}/${files.length})`);
      try { all.push(...(await parseOne(f))); }
      catch (e) { errs.push((e as Error).message); }
    }
    setParsing(false); setProgress("");
    if (!all.length) return setNote(errs.join(" ") || "No charges found.");
    setFiles([]);
    const names = files.map((f) => f.name).join(", ");
    onLoaded(all, files.length > 1 ? `${files.length} statements: ${names}` : simulated ? `${names} (simulated extraction)` : names);
    if (errs.length) setNote(errs.join(" "));
  };

  return (
    <div>
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <section>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 font-mono text-xs text-muted-foreground"><ScanSearch className="h-3.5 w-3.5" /> autonomous billing auditor</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Your statement has ghosts.<br /><span className="text-primary">We find them.</span></h1>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">LedgerGhost reads your statements and invoices, flags charges that quietly crept up, and drafts polite dispute letters so you can get your money back.</p>
          <FeatureCards />
          <button onClick={() => onSample()} disabled={busy || parsing} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {busy ? "Auditing sample…" : "Try Sample Statement Audit"}
          </button>
          <p className="mt-5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Or try a scenario</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {SCENARIOS.slice(1).map((sc) => (
              <button key={sc.id} onClick={() => onSample(sc)} disabled={busy || parsing} className="rounded-xl border bg-card p-3 text-left transition hover:border-primary/60 disabled:opacity-60">
                <span className="block text-sm font-semibold">{sc.title}</span>
                <span className="block text-xs text-muted-foreground">{sc.blurb}</span>
              </button>
            ))}
          </div>
        </section>
        <section>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); stage(e.dataTransfer.files); }}
            onClick={() => ref.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${drag ? "border-primary bg-accent" : "bg-card hover:border-primary/60"}`}>
            <input ref={ref} type="file" multiple accept=".pdf,.csv,image/*" className="hidden" onChange={(e) => { stage(e.target.files); e.target.value = ""; }} />
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary"><Upload className="h-6 w-6 text-primary" /></div>
            <p className="mt-4 font-semibold">Drop statements here</p>
            <p className="text-sm text-muted-foreground">PDF, CSV or image · add as many as you like, then analyze them together</p>
            <p className="mt-4 font-mono text-xs text-muted-foreground">CSV columns: merchant, date, category, description, amount</p>
          </div>
          {!!files.length && (
            <div className="mt-3 rounded-xl border bg-card p-3">
              <ul className="divide-y text-sm">
                {files.map((f, i) => (
                  <li key={f.name + f.size} className="flex items-center gap-2 py-1.5">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                    <button aria-label={`Remove ${f.name}`} disabled={parsing} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"><X className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
              <button onClick={analyze} disabled={parsing} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                {parsing ? `Reading ${progress}…` : `Analyze ${files.length} statement${files.length > 1 ? "s" : ""}`}
              </button>
              {parsing && !settings.mock && <p className="mt-2 text-center text-xs text-muted-foreground">Nemotron Nano is extracting charges from each file</p>}
            </div>
          )}
          {note && <p className="mt-3 text-sm text-destructive">{note}</p>}
        </section>
      </div>

      {!!history.length && (
        <section className="mt-14">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><History className="h-5 w-5 text-primary" /> Audit history</h2>
          <div className="mt-3 divide-y rounded-xl border bg-card">
            {history.map((r) => {
              const flagged = r.findings.filter((f) => f.status !== "clear");
              const savings = flagged.reduce((s, f) => s + f.overcharge, 0);
              return (
                <div key={r.id} className="flex flex-wrap items-center gap-3 p-4 hover:bg-secondary/40">
                  <button onClick={() => onOpenRecord(r)} className="min-w-0 flex-1 text-left">
                    <p className="truncate font-medium">{r.source}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.at).toLocaleString()} · {r.charges.length} charges · {flagged.length ? `${flagged.length} flagged · ${money(savings, r.charges[0]?.currency)} recoverable` : "all clear"}
                    </p>
                  </button>
                  {flagged.length > 0 && <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">{flagged.length} flagged</span>}
                  <button aria-label="Delete audit" onClick={() => onDeleteRecord(r.id)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

const field = "w-full rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Review({ charges, setCharges, source, busy, onRun, onBack }: { charges: Charge[]; setCharges: (c: Charge[]) => void; source: string; busy: boolean; onRun: () => void; onBack: () => void }) {
  const upd = (id: string, k: keyof Charge, v: string) =>
    setCharges(charges.map((c) => c.id === id ? { ...c, [k]: k === "amount" || k === "priorAmount" ? (v === "" ? (k === "priorAmount" ? null : 0) : parseFloat(v)) : v } : c));
  const add = () => setCharges([...charges, { id: uid(), merchant: "", date: new Date().toISOString().slice(0, 10), category: "Other", description: "", amount: 0, priorAmount: null }]);
  const total = charges.reduce((s, c) => s + (c.amount || 0), 0);
  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to upload</button>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-2xl font-bold">Review extracted charges</h2><p className="text-sm text-muted-foreground">{source} · {charges.length} items · {money(total, charges[0]?.currency)}</p></div>
        <div className="flex gap-2">
          <button onClick={add} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-secondary"><Plus className="h-4 w-4" /> Add charge</button>
          <button onClick={onRun} disabled={busy || !charges.length} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />} {busy ? "Agent auditing…" : "Run audit"}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>{["Merchant", "Date", "Category", "Line item", "Amount", "Prior", ""].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {charges.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2"><input className={field} value={c.merchant} onChange={(e) => upd(c.id, "merchant", e.target.value)} /></td>
                <td className="p-2"><input type="date" className={field} value={c.date} onChange={(e) => upd(c.id, "date", e.target.value)} /></td>
                <td className="p-2"><input className={field} value={c.category} onChange={(e) => upd(c.id, "category", e.target.value)} /></td>
                <td className="p-2"><input className={field} value={c.description} onChange={(e) => upd(c.id, "description", e.target.value)} /></td>
                <td className="w-28 p-2"><input type="number" step="0.01" className={`${field} font-mono`} value={c.amount} onChange={(e) => upd(c.id, "amount", e.target.value)} /></td>
                <td className="w-28 p-2"><input type="number" step="0.01" placeholder="—" className={`${field} font-mono`} value={c.priorAmount ?? ""} onChange={(e) => upd(c.id, "priorAmount", e.target.value)} /></td>
                <td className="p-2"><button aria-label="Remove" onClick={() => setCharges(charges.filter((x) => x.id !== c.id))} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">"Prior" is last period's amount — the agent uses it to spot creeping prices.</p>
    </div>
  );
}

const BADGE: Record<Status, { label: string; cls: string; Icon: typeof ShieldCheck }> = {
  clear: { label: "Clear", cls: "bg-success/15 text-success", Icon: ShieldCheck },
  review: { label: "Needs Review", cls: "bg-warning/25 text-warning-foreground dark:text-warning", Icon: AlertTriangle },
  high: { label: "High Risk", cls: "bg-destructive/15 text-destructive", Icon: ShieldAlert },
};
const Badge = ({ s }: { s: Status }) => { const b = BADGE[s]; return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${b.cls}`}><b.Icon className="h-3 w-3" />{b.label}</span>; };

function Results({ charges, findings, settings, onBack }: { charges: Charge[]; findings: Finding[]; settings: Settings; onBack: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [letterFor, setLetterFor] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "flagged">("all");
  const map = useMemo(() => new Map(findings.map((f) => [f.chargeId, f])), [findings]);
  const flagged = findings.filter((f) => f.status !== "clear");
  const total = charges.reduce((s, c) => s + c.amount, 0);
  const savings = flagged.reduce((s, f) => s + f.overcharge, 0);
  const order: Record<Status, number> = { high: 0, review: 1, clear: 2 };
  const rows = charges.filter((c) => map.has(c.id) && (filter === "all" || map.get(c.id)!.status !== "clear"))
    .sort((a, b) => order[map.get(a.id)!.status] - order[map.get(b.id)!.status]);
  const openC = charges.find((c) => c.id === open);
  const letterC = charges.find((c) => c.id === letterFor);

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Edit charges</button>
      <h2 className="text-2xl font-bold">Audit findings</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Total audited" value={money(total, charges[0]?.currency)} sub={`${charges.length} charges`} />
        <Stat label="Potential overcharges" value={String(flagged.length)} sub={`${findings.filter((f) => f.status === "high").length} high risk`} tone="destructive" />
        <Stat label="Savings opportunity" value={money(savings, charges[0]?.currency)} sub={`≈ ${money(savings * 12, charges[0]?.currency)}/yr if recurring`} tone="primary" />
      </div>
      <PriceWatch charges={charges} settings={settings} />
      <div className="mt-6 flex gap-1 text-sm">
        {(["all", "flagged"] as const).map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-3 py-1.5 capitalize ${filter === f ? "bg-secondary font-medium" : "text-muted-foreground"}`}>{f}</button>)}
      </div>
      <div className="mt-3 divide-y rounded-xl border bg-card">
        {rows.map((c) => { const f = map.get(c.id)!; return (
          <div key={c.id} className="flex flex-wrap items-center gap-3 p-4 hover:bg-secondary/40">
            <button onClick={() => setOpen(c.id)} className="min-w-0 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{c.merchant}</span><Badge s={f.status} /><span className="font-mono text-xs text-muted-foreground">{c.date}</span></div>
              <p className="truncate text-sm text-muted-foreground">{c.description}</p>
              {f.status !== "clear" && <p className="mt-1 text-sm">{f.reason}</p>}
            </button>
            <span className="font-mono font-medium">{money(c.amount, c.currency)}</span>
            {f.status !== "clear" && <button onClick={() => setLetterFor(c.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"><FileText className="h-4 w-4" /> Draft dispute</button>}
          </div>
        ); })}
        {!rows.length && <p className="p-6 text-center text-sm text-muted-foreground">No flagged charges. Your ledger looks clean.</p>}
      </div>

      {openC && (
        <Drawer onClose={() => setOpen(null)} title="Charge inspection">
          {(() => { const f = map.get(openC.id)!; return (
            <div className="space-y-5">
              <div><Badge s={f.status} /><h3 className="mt-2 text-xl font-semibold">{openC.merchant}</h3><p className="text-sm text-muted-foreground">{openC.description}</p></div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[["Date", openC.date], ["Category", openC.category], ["Amount", money(openC.amount, openC.currency)], ["Prior period", openC.priorAmount != null ? money(openC.priorAmount, openC.currency) : "—"]].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-secondary/60 p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-mono">{v}</dd></div>
                ))}
              </dl>
              <div className="rounded-lg border p-4">
                <p className="mb-1 font-mono text-xs uppercase text-muted-foreground">Agent reasoning</p>
                <p className="font-medium">{f.reason}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{f.details.map((d) => <li key={d}>{d}</li>)}</ul>
              </div>
              {f.status !== "clear" && <>
                <p className="text-sm">Estimated recoverable: <span className="font-mono font-semibold text-primary">{money(f.overcharge, openC?.currency)}</span></p>
                <button onClick={() => { setLetterFor(openC.id); setOpen(null); }} className="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground">Draft dispute letter</button>
              </>}
            </div>
          ); })()}
        </Drawer>
      )}
      {letterC && <LetterDrawer charge={letterC} finding={map.get(letterC.id)!} settings={settings} onClose={() => setLetterFor(null)} />}
    </div>
  );
}

function PriceWatch({ charges, settings }: { charges: Charge[]; settings: Settings }) {
  const [trends, setTrends] = useState<Trend[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const run = async () => {
    setErr(null); setTrends(null);
    try { setTrends(settings.mock ? mockTrends(charges) : await liveTrends(settings, charges)); }
    catch (e) { setErr(e instanceof Error ? e.message : "Could not analyze price trends."); setTrends([]); }
  };
  useEffect(() => { void run(); }, [charges, settings.mock]); // eslint-disable-line react-hooks/exhaustive-deps
  const label: Record<Trend["verdict"], string> = { hike: "Price hike", stable: "Stable", "promo-ended": "Promo ended", "above-market": "Above market" };
  return (
    <section className="mt-6 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> 6-month price watch</h3>
          <p className="text-xs text-muted-foreground">Price history for your subscriptions — no past bills needed.{settings.mock ? " (Demo data)" : " Estimated by AI from public pricing; verify before disputing."}</p>
        </div>
        <button onClick={run} className="text-xs text-muted-foreground hover:text-foreground">Refresh</button>
      </div>
      {trends === null ? <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Checking price history…</p>
      : err ? <p className="mt-4 text-sm text-destructive">{err}</p>
      : !trends.length ? <p className="mt-4 text-sm text-muted-foreground">No recurring subscriptions detected.</p>
      : <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {trends.map((t) => (
            <div key={t.merchant} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="truncate font-medium">{t.merchant}</p><p className="truncate text-xs text-muted-foreground">{t.service}</p></div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${t.verdict === "stable" ? "bg-secondary text-muted-foreground" : "bg-destructive/15 text-destructive"}`}>{label[t.verdict] ?? t.verdict}{t.changePct ? ` +${Math.round(t.changePct)}%` : ""}</span>
              </div>
              <Spark data={t.history} currency={charges[0]?.currency} />
              <p className="text-sm">{t.insight}</p>
              <p className="mt-1 text-xs text-muted-foreground">💡 {t.tip}</p>
            </div>
          ))}
        </div>}
    </section>
  );
}

function Spark({ data, currency }: { data: { month: string; price: number }[]; currency?: string | undefined }) {
  const ps = data.map((d) => Number(d.price) || 0);
  const min = Math.min(...ps), max = Math.max(...ps), r = max - min || 1;
  const pts = ps.map((p, i) => `${(i / Math.max(ps.length - 1, 1)) * 100},${30 - ((p - min) / r) * 24 - 3}`).join(" ");
  return (
    <div className="my-2">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-10 w-full"><polyline points={pts} fill="none" stroke="var(--primary)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
      <div className="flex justify-between font-mono text-[10px] text-muted-foreground"><span>{data[0]?.month} {money(ps[0] ?? 0, currency)}</span><span>{data.at(-1)?.month} {money(ps.at(-1) ?? 0, currency)}</span></div>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "primary" | "destructive" }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className={`mt-1 font-mono text-3xl font-semibold ${tone === "primary" ? "text-primary" : tone === "destructive" ? "text-destructive" : ""}`}>{value}</p><p className="text-xs text-muted-foreground">{sub}</p></div>;
}

function Drawer({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-xl overflow-y-auto border-l bg-card p-6 shadow-2xl animate-in slide-in-from-right">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-semibold">{title}</h2><button aria-label="Close" onClick={onClose} className="rounded p-1 hover:bg-secondary"><X className="h-5 w-5" /></button></div>
        {children}
      </aside>
    </div>
  );
}

function LetterDrawer({ charge, finding, settings, onClose }: { charge: Charge; finding: Finding; settings: Settings; onClose: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      try {
        const t = settings.mock ? (await new Promise((r) => setTimeout(r, 700)), draftLetter(charge, finding)) : await liveLetter(settings, charge, finding);
        if (live) setText(t);
      } catch (e) { if (live) setText(`${draftLetter(charge, finding)}\n\n[Live drafting failed: ${(e as Error).message}. Showing template draft.]`); }
      finally { if (live) setLoading(false); }
    })();
    return () => { live = false; };
  }, [charge, finding, settings]);
  const copy = async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a"); a.href = url; a.download = `dispute-${charge.merchant.replace(/\W+/g, "-").toLowerCase()}.txt`; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <Drawer title={`Dispute letter · ${charge.merchant}`} onClose={onClose}>
      {loading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Drafting with {settings.mock ? "mock agent" : "Nemotron Ultra"}…</div> : (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="h-[60vh] w-full resize-none rounded-lg border bg-background p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring" />
          <div className="mt-4 flex gap-2">
            <button onClick={copy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 font-medium hover:bg-secondary">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy"}</button>
            <button onClick={download} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-medium text-primary-foreground"><Download className="h-4 w-4" /> Download</button>
          </div>
        </>
      )}
    </Drawer>
  );
}

function SettingsModal({ settings, onSave, onClose }: { settings: Settings; onSave: (s: Settings) => void; onClose: () => void }) {
  const [s, setS] = useState(settings);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="ai-settings-title" onClick={(e) => e.stopPropagation()} className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-lg border bg-card p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between"><h2 id="ai-settings-title" className="text-lg font-semibold">AI settings</h2><Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}><X /></Button></div>
        <div role="group" aria-label="Audit mode" className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
          <Button variant={s.mock ? "default" : "ghost"} aria-pressed={s.mock} onClick={() => setS({ ...s, mock: true })}><Sparkles /> Instant Demo</Button>
          <Button variant={!s.mock ? "default" : "ghost"} aria-pressed={!s.mock} onClick={() => setS({ ...s, mock: false })}><ScanSearch /> Live Nemotron</Button>
        </div>
        <div className="flex items-center gap-3 py-5">
          <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
          <div><p className="text-sm font-medium">{s.mock ? "Sample audit agent" : "Nebius · NVIDIA Nemotron"}</p><p className="mt-1 text-xs text-muted-foreground">{s.mock ? "No credentials required" : s.apiKey ? "Custom credentials selected" : "Uses your saved server key"}</p></div>
        </div>
        <details className="border-t pt-4">
          <summary className="cursor-pointer text-sm text-muted-foreground">Advanced configuration</summary>
          <fieldset disabled={s.mock} className="mt-4 space-y-3 disabled:opacity-50">
            <Lbl t="Parsing model"><select className={field} value={s.parseModel} onChange={(e) => setS({ ...s, parseModel: e.target.value })}>{PARSE_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></Lbl>
            <Lbl t="Reasoning & dispute model"><select className={field} value={s.reasonModel} onChange={(e) => setS({ ...s, reasonModel: e.target.value })}>{REASON_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></Lbl>
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground">Custom connection</summary>
              <div className="mt-3 space-y-3">
                <Lbl t="API key"><input type="password" autoComplete="off" className={field} placeholder="Optional — saved server key by default" value={s.apiKey} onChange={(e) => setS({ ...s, apiKey: e.target.value })} /></Lbl>
                <Lbl t="Base URL"><input className={`${field} font-mono`} value={s.baseUrl} onChange={(e) => setS({ ...s, baseUrl: e.target.value })} /></Lbl>
                <p className="text-xs text-muted-foreground">Custom connection settings are saved in this browser.</p>
              </div>
            </details>
          </fieldset>
        </details>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(s)}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}
const Lbl = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block space-y-1 text-sm"><span className="text-muted-foreground">{t}</span>{children}</label>;
