import { useState } from "react";
import { ChevronDown } from "lucide-react";

function HikeArt() {
  return (
    <svg viewBox="0 0 160 70" className="h-full w-full">
      <line x1="10" y1="60" x2="150" y2="60" className="stroke-border" strokeWidth="1" />
      {[20, 50, 80].map((x) => (
        <rect key={x} x={x} y="35" width="18" height="25" rx="3" className="fill-muted-foreground/40" />
      ))}
      <rect x="110" y="35" width="18" height="25" rx="3" className="fill-destructive">
        <animate attributeName="y" values="35;12;12;35" keyTimes="0;0.35;0.85;1" dur="2.6s" repeatCount="indefinite" />
        <animate attributeName="height" values="25;48;48;25" keyTimes="0;0.35;0.85;1" dur="2.6s" repeatCount="indefinite" />
      </rect>
      <text x="119" y="8" textAnchor="middle" className="fill-destructive font-mono" fontSize="9">
        +20%
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.35;0.85;1" dur="2.6s" repeatCount="indefinite" />
      </text>
    </svg>
  );
}

function DuplicateArt() {
  return (
    <svg viewBox="0 0 160 70" className="h-full w-full">
      <rect x="30" y="10" width="100" height="20" rx="4" className="fill-muted-foreground/30" />
      <rect x="40" y="17" width="45" height="6" rx="2" className="fill-muted-foreground/60" />
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 26;0 26;0 0" keyTimes="0;0.35;0.85;1" dur="2.6s" repeatCount="indefinite" />
        <rect x="30" y="10" width="100" height="20" rx="4" className="fill-destructive/25 stroke-destructive" strokeWidth="1.5" />
        <rect x="40" y="17" width="45" height="6" rx="2" className="fill-destructive" />
        <text x="122" y="24" textAnchor="end" className="fill-destructive font-mono" fontSize="9">×2</text>
      </g>
    </svg>
  );
}

function FeeArt() {
  return (
    <svg viewBox="0 0 160 70" className="h-full w-full">
      <rect x="45" y="4" width="70" height="62" rx="4" className="fill-muted-foreground/20 stroke-border" />
      {[14, 24, 34].map((y) => (
        <rect key={y} x="53" y={y} width="54" height="5" rx="2" className="fill-muted-foreground/50" />
      ))}
      <rect x="53" y="46" width="54" height="7" rx="2" className="fill-destructive">
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.3;0.45;0.85;1" dur="2.6s" repeatCount="indefinite" />
      </rect>
      <circle cx="80" cy="49" r="13" fill="none" className="stroke-primary" strokeWidth="2">
        <animate attributeName="cx" values="40;80;80;40" keyTimes="0;0.35;0.85;1" dur="2.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

const FEATURES = [
  { t: "Stealth price hikes", d: "Plans that bumped without notice", Art: HikeArt },
  { t: "Duplicate line items", d: "Same charge billed twice", Art: DuplicateArt },
  { t: "Quiet fees", d: "Service, recovery & delivery add-ons", Art: FeeArt },
];

export function FeatureCards() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-3">
      {FEATURES.map(({ t, d, Art }, i) => {
        const isOpen = open === i;
        return (
          <li
            key={t}
            onMouseEnter={() => setOpen(i)}
            onMouseLeave={() => setOpen(null)}
            onClick={() => setOpen(isOpen ? null : i)}
            className={`group cursor-pointer rounded-xl border bg-card p-3 transition-all duration-300 ${isOpen ? "border-primary/60 shadow-lg shadow-primary/10 -translate-y-0.5" : "hover:border-primary/40"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{t}</p>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform sm:hidden ${isOpen ? "rotate-180" : ""}`} />
            </div>
            <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <div className="mt-2 h-16 rounded-lg bg-muted/40 p-1">{isOpen && <Art />}</div>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{d}</p>
          </li>
        );
      })}
    </ul>
  );
}
