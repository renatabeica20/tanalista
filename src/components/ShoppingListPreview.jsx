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
            normalize(i.name).includes(q) ||
            normalize(cat.label ?? cat.key).includes(q)
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
    <div className={cn("min-h-screen bg-gradient-to-b from-background to-muted/30 pb-28", comfort && "contrast-[1.04]")}>
      <div className="mx-auto w-full max-w-md px-4 pt-5">
        {/* Header */}
        <header className="mb-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              {subtitle && (
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {subtitle}
                </p>
              )}
              <h1 className="mt-0.5 truncate text-[22px] font-semibold tracking-tight text-foreground">
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
                  "flex h-10 w-10 items-center justify-center rounded-xl border transition",
                  comfort
                    ? "border-transparent bg-amber-500 text-white shadow shadow-amber-500/30"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <Sun className="h-4.5 w-4.5" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow shadow-primary/20">
                <ShoppingBag className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>

          {/* Progress + spent */}
          <div className="mt-4 rounded-2xl border bg-card/90 p-3.5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-semibold tabular-nums text-foreground">{totals.percent}%</span>
                <span className="text-[11px] text-muted-foreground">concluído</span>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {totals.done}/{totals.total}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/80 via-primary to-primary/90 transition-[width] duration-700 ease-out"
                style={{ width: `${totals.percent}%` }}
              />
            </div>
            {totals.sum > 0 && (
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-[12px]">
                <span className="text-muted-foreground">Total estimado</span>
                <span className="font-semibold tabular-nums text-foreground">{fmtBRL(totals.sum)}</span>
              </div>
            )}
          </div>

          {/* Search + compact */}
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                inputMode="search"
                placeholder="Buscar item (sem acento)"
                className="h-11 w-full rounded-2xl border bg-card pl-9 pr-9 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setHideBought((v) => !v)}
              aria-pressed={hideBought}
              className={cn(
                "h-11 shrink-0 rounded-2xl border px-3 text-xs font-medium transition",
                hideBought
                  ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:text-foreground",
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
            <div className="rounded-2xl border border-dashed bg-card/40 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {q ? `Nenhum item para "${query}".` : hideBought ? "Tudo comprado por aqui." : "Sua lista está vazia."}
              </p>
            </div>
          )}
        </div>
      </div>

      {onAddExtraItem && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-10 flex justify-center px-4">
          <button
            type="button"
            onClick={() => onAddExtraItem()}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Adicionar extra
          </button>
        </div>
      )}
    </div>
  );
}
