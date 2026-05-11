import { useMemo, useRef, useState } from "react";
import { Check, Search, X, ShoppingBag, BadgeCheck, Sun, Plus } from "lucide-react";

/** Minimal classnames helper. */
function cn(...inputs) {
  const out = [];
  const walk = (v) => {
    if (!v) return;
    if (typeof v === "string" || typeof v === "number") out.push(String(v));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === "object") for (const k in v) if (v[k]) out.push(k);
  };
  inputs.forEach(walk);
  return out.join(" ");
}

/** Fixed, padronized palette per category. Independent of completion state. */
const CATEGORY_STYLES = {
  Hortifruti: { dot: "bg-emerald-500", bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", soft: "bg-emerald-50/60" },
  Padaria:    { dot: "bg-amber-500",   bar: "bg-amber-500",   chip: "bg-amber-50 text-amber-700 ring-amber-200",     soft: "bg-amber-50/60" },
  Açougue:    { dot: "bg-rose-500",    bar: "bg-rose-500",    chip: "bg-rose-50 text-rose-700 ring-rose-200",         soft: "bg-rose-50/60" },
  Laticínios: { dot: "bg-sky-500",     bar: "bg-sky-500",     chip: "bg-sky-50 text-sky-700 ring-sky-200",            soft: "bg-sky-50/60" },
  Mercearia:  { dot: "bg-orange-500",  bar: "bg-orange-500",  chip: "bg-orange-50 text-orange-700 ring-orange-200",   soft: "bg-orange-50/60" },
  Bebidas:    { dot: "bg-violet-500",  bar: "bg-violet-500",  chip: "bg-violet-50 text-violet-700 ring-violet-200",   soft: "bg-violet-50/60" },
  Limpeza:    { dot: "bg-cyan-500",    bar: "bg-cyan-500",    chip: "bg-cyan-50 text-cyan-700 ring-cyan-200",         soft: "bg-cyan-50/60" },
  Higiene:    { dot: "bg-fuchsia-500", bar: "bg-fuchsia-500", chip: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200", soft: "bg-fuchsia-50/60" },
  Congelados: { dot: "bg-indigo-500",  bar: "bg-indigo-500",  chip: "bg-indigo-50 text-indigo-700 ring-indigo-200",   soft: "bg-indigo-50/60" },
  Outros:     { dot: "bg-zinc-500",    bar: "bg-zinc-500",    chip: "bg-zinc-100 text-zinc-700 ring-zinc-200",        soft: "bg-zinc-50/60" },
};
const FALLBACK = CATEGORY_STYLES.Outros;

function fmtBRL(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
  } catch {
    return `R$ ${Number(value).toFixed(2)}`;
  }
}

function normalize(s) {
  return String(s ?? "")
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Levenshtein distance (small strings) for tolerant search.
function editDistance(a, b) {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (!al) return bl;
  if (!bl) return al;
  if (Math.abs(al - bl) > 3) return Math.abs(al - bl);
  let prev = new Array(bl + 1);
  let curr = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;
  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[bl];
}

// Token-based fuzzy match: each query token must match by substring
// or by approximate match against any token in the haystack.
function fuzzyMatch(haystack, needle) {
  if (!needle) return true;
  if (!haystack) return false;
  if (haystack.includes(needle)) return true;
  const hayTokens = haystack.split(/\s+/).filter(Boolean);
  const queryTokens = needle.split(/\s+/).filter(Boolean);
  return queryTokens.every((qt) => {
    if (qt.length <= 2) {
      return hayTokens.some((ht) => ht.startsWith(qt));
    }
    const tol = qt.length >= 6 ? 2 : 1;
    return hayTokens.some((ht) => {
      if (ht.includes(qt)) return true;
      if (Math.abs(ht.length - qt.length) > tol + 1) {
        // still allow if qt is prefix-ish of ht with small edits
        if (ht.length > qt.length) {
          return editDistance(ht.slice(0, qt.length), qt) <= tol;
        }
        return false;
      }
      return editDistance(ht, qt) <= tol;
    });
  });
}

/**
 * ShoppingListPage3 — visual-only component for the in-store ("Página 3") view.
 *
 * Props:
 *   title, subtitle: header strings
 *   categories: [{ key, label?, items: [{ id, name, qty?, unit?, unitPrice?, totalPrice?, bought }] }]
 *   onToggleItem(id, categoryKey)
 *   onEditItem(id, categoryKey)
 *   onAddExtraItem()
 */
export default function ShoppingListPage3({
  title = "Compras da semana",
  subtitle = "Tá na Lista",
  categories = [],
  onToggleItem,
  onEditItem,
  onAddExtraItem,
}) {
  const [query, setQuery] = useState("");
  const [comfort, setComfort] = useState(false);
  const [hideBought, setHideBought] = useState(false);

  // Stable ordering: when bought toggles, the item animates to the bottom
  // of its section without reshuffling siblings — avoids "visual jump".
  const orderRef = useRef(new Map());
  const orderCounter = useRef(0);
  for (const cat of categories) {
    for (const it of cat.items ?? []) {
      if (!orderRef.current.has(it.id)) {
        orderRef.current.set(it.id, orderCounter.current++);
      }
    }
  }

  const q = normalize(query.trim());

  const sections = useMemo(() => {
    return categories
      .map((cat) => {
        const items = (cat.items ?? []).filter((i) => {
          if (hideBought && i.bought) return false;
          if (!q) return true;
          return (
            fuzzyMatch(normalize(i.name), q) ||
            fuzzyMatch(normalize(cat.label ?? cat.key), q)
          );
        });
        // Pending first, bought last; stable within each group.
        items.sort((a, b) => {
          const ab = a.bought ? 1 : 0;
          const bb = b.bought ? 1 : 0;
          if (ab !== bb) return ab - bb;
          return (orderRef.current.get(a.id) ?? 0) - (orderRef.current.get(b.id) ?? 0);
        });
        const total = (cat.items ?? []).length;
        const done = (cat.items ?? []).filter((i) => i.bought).length;
        return { ...cat, items, total, done, allDone: total > 0 && done === total };
      })
      .filter((c) => c.items.length > 0 || (q === "" && !hideBought));
  }, [categories, q, hideBought]);

  const totals = useMemo(() => {
    const total = categories.reduce((a, c) => a + (c.items?.length ?? 0), 0);
    const done = categories.reduce(
      (a, c) => a + (c.items?.filter((i) => i.bought).length ?? 0),
      0,
    );
    const sum = categories.reduce((a, c) => {
      return (
        a +
        (c.items ?? []).reduce((acc, it) => {
          const t = it.totalPrice ?? (it.unitPrice != null && it.qty != null ? Number(it.unitPrice) * Number(it.qty) : 0);
          return acc + (Number.isFinite(Number(t)) ? Number(t) : 0);
        }, 0)
      );
    }, 0);
    return { total, done, sum, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, [categories]);

  const handleToggle = (id, key) => {
    const y = typeof window !== "undefined" ? window.scrollY : 0;
    onToggleItem?.(id, key);
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => window.scrollTo({ top: y }));
    }
  };

  const padY = comfort ? "py-4" : "py-3";
  const nameSize = comfort ? "text-[16px]" : "text-[14.5px]";
  const metaSize = comfort ? "text-[13px]" : "text-[12px]";
  const checkSize = comfort ? "h-7 w-7" : "h-6 w-6";
  const checkIcon = comfort ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <div className={cn("min-h-screen bg-gradient-to-b from-violet-50/60 via-background to-violet-50/40 pb-28", comfort && "contrast-[1.04]")}>
      <div className="mx-auto w-full max-w-md px-4 pt-5">
        {/* Header */}
        <header className="mb-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              {subtitle && (
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600/90">
                  {subtitle}
                </p>
              )}
              <h1 className="mt-0.5 truncate bg-gradient-to-br from-slate-900 via-violet-900 to-violet-700 bg-clip-text text-[24px] font-bold tracking-tight text-transparent">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setComfort((v) => !v)}
                aria-pressed={comfort}
                aria-label="Modo supermercado"
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl border transition active:scale-95",
                  comfort
                    ? "border-transparent bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/40"
                    : "border-violet-100 bg-white text-slate-500 shadow-sm hover:text-violet-700",
                )}
              >
                <Sun className="h-4.5 w-4.5" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-md shadow-violet-500/40">
                <ShoppingBag className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>

          {/* Progress + spent */}
          <div className="mt-4 overflow-hidden rounded-3xl border border-violet-100 bg-white/90 p-4 shadow-[0_4px_20px_-6px_rgba(124,58,237,0.18)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="bg-gradient-to-br from-violet-700 to-fuchsia-600 bg-clip-text text-[24px] font-bold tabular-nums text-transparent">
                  {totals.percent}%
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  concluído
                </span>
              </div>
              <span className="rounded-full bg-violet-100/80 px-2.5 py-1 text-[11px] font-bold tabular-nums text-violet-700">
                {totals.done}/{totals.total}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100/70">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-violet-500 via-violet-600 to-fuchsia-500 shadow-[0_0_12px_rgba(124,58,237,0.5)] transition-[width] duration-700 ease-out"
                style={{ width: `${totals.percent}%` }}
              >
                <span className="absolute inset-y-0 right-0 w-6 bg-gradient-to-r from-transparent to-white/30" />
              </div>
            </div>
            {totals.sum > 0 && (
              <div className="mt-3 flex items-center justify-between border-t border-violet-100 pt-3 text-[12px]">
                <span className="font-semibold uppercase tracking-wide text-slate-500">
                  Total estimado
                </span>
                <span className="font-bold tabular-nums text-slate-800">{fmtBRL(totals.sum)}</span>
              </div>
            )}
          </div>

          {/* Search + compact */}
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                inputMode="search"
                placeholder="Buscar item (sem acento)"
                className="h-11 w-full rounded-2xl border-[1.5px] border-violet-100 bg-white pl-10 pr-9 text-sm font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.14)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-violet-100 hover:text-violet-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setHideBought((v) => !v)}
              aria-pressed={hideBought}
              className={cn(
                "h-11 shrink-0 rounded-2xl border-[1.5px] px-4 text-xs font-bold transition active:scale-95",
                hideBought
                  ? "border-transparent bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-md shadow-violet-500/30"
                  : "border-violet-100 bg-white text-slate-600 hover:text-violet-700",
              )}
            >
              {hideBought ? "Ver todos" : "Compactar"}
            </button>
          </div>
        </header>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((cat) => {
            const styles = CATEGORY_STYLES[cat.key] ?? FALLBACK;
            const pending = cat.items.filter((i) => !i.bought).length;
            return (
              <section key={cat.key}>
                {/* Section header — keeps category color even when complete */}
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-background", styles.dot)} />
                    <h2 className="truncate text-[13px] font-semibold tracking-wide text-foreground">
                      {cat.label ?? cat.key}
                    </h2>
                    {cat.allDone && (
                      <span className={cn(
                        "ml-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1",
                        styles.chip,
                      )}>
                        <BadgeCheck className="h-3 w-3" />
                        concluída
                      </span>
                    )}
                  </div>
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums ring-1", styles.chip)}>
                    {pending}/{cat.total}
                  </span>
                </div>

                <ul className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
                  {/* Category color bar — preserved even when section is complete */}
                  <span aria-hidden className={cn("absolute inset-y-0 left-0 w-[3px]", styles.bar, cat.allDone && "opacity-60")} />

                  {cat.items.map((item, idx) => {
                    const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : null;
                    const qty = item.qty != null ? Number(item.qty) : null;
                    const total =
                      item.totalPrice != null
                        ? Number(item.totalPrice)
                        : unitPrice != null && qty != null
                          ? unitPrice * qty
                          : null;

                    return (
                      <li
                        key={item.id}
                        className={cn(
                          "group relative flex items-center gap-3 px-4 transition-[background-color,opacity] duration-500",
                          padY,
                          item.bought ? "bg-muted/40" : "bg-card",
                        )}
                      >
                        {/* Visual divider between items */}
                        {idx > 0 && (
                          <span aria-hidden className="pointer-events-none absolute inset-x-4 top-0 h-px bg-border/70" />
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggle(item.id, cat.key)}
                          aria-label={item.bought ? "Desmarcar item" : "Marcar como comprado"}
                          className={cn(
                            "flex shrink-0 items-center justify-center rounded-full border-2 transition",
                            checkSize,
                            item.bought
                              ? "border-transparent bg-primary text-primary-foreground"
                              : "border-border bg-background hover:border-primary",
                          )}
                        >
                          <Check className={cn(checkIcon, "transition", item.bought ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditItem?.(item.id, cat.key)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "truncate font-medium",
                              nameSize,
                              item.bought ? "text-muted-foreground/70 line-through decoration-muted-foreground/40" : "text-foreground",
                            )}>
                              {item.name}
                            </p>
                            {total != null && (
                              <span className={cn(
                                "shrink-0 rounded-md px-1.5 py-0.5 font-semibold tabular-nums ring-1",
                                metaSize,
                                item.bought
                                  ? "bg-muted text-muted-foreground/80 ring-border"
                                  : cn(styles.chip),
                              )}>
                                {fmtBRL(total)}
                              </span>
                            )}
                          </div>

                          {/* Meta line: qty + unit + unit price */}
                          {(qty != null || item.unit || unitPrice != null) && (
                            <p className={cn("mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 tabular-nums", metaSize, item.bought ? "text-muted-foreground/60" : "text-muted-foreground")}>
                              {qty != null && (
                                <span className="font-medium text-foreground/80">
                                  {qty}
                                  {item.unit ? ` ${item.unit}` : ""}
                                </span>
                              )}
                              {qty != null && unitPrice != null && <span aria-hidden>·</span>}
                              {unitPrice != null && (
                                <span>
                                  {fmtBRL(unitPrice)}
                                  {item.unit ? `/${item.unit}` : " un"}
                                </span>
                              )}
                            </p>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          {sections.length === 0 && (
            <div className="rounded-3xl border-[1.5px] border-dashed border-violet-200 bg-white/60 p-10 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                {q ? `Nenhum item para "${query}".` : hideBought ? "Tudo comprado por aqui." : "Sua lista está vazia."}
              </p>
            </div>
          )}
        </div>
      </div>

      {onAddExtraItem && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-10 flex justify-center px-4" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <button
            type="button"
            onClick={() => onAddExtraItem()}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(124,58,237,0.65),0_4px_12px_-4px_rgba(76,29,149,0.45)] ring-1 ring-white/20 transition hover:scale-[1.03] hover:shadow-[0_22px_50px_-12px_rgba(124,58,237,0.75)] active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Adicionar extra
          </button>
        </div>
      )}
    </div>
  );
}
