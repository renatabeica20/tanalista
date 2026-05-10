import { useMemo, useRef, useState } from "react";
import {
  Check,
  Plus,
  Pencil,
  ShoppingBag,
  Sparkles,
  Search,
  X,
  ChevronDown,
  Sun,
} from "lucide-react";

/** Minimal classnames helper (no external deps). */
function cn(...inputs) {
  const out = [];
  const walk = (v) => {
    if (!v) return;
    if (typeof v === "string" || typeof v === "number") {
      out.push(String(v));
    } else if (Array.isArray(v)) {
      v.forEach(walk);
    } else if (typeof v === "object") {
      for (const k in v) if (v[k]) out.push(k);
    }
  };
  inputs.forEach(walk);
  return out.join(" ");
}

const CATEGORY_STYLES = {
  Hortifruti: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500/30",
    soft: "from-emerald-500/10 to-emerald-500/0",
    bar: "bg-emerald-500",
  },
  Padaria: {
    dot: "bg-amber-500",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500/30",
    soft: "from-amber-500/10 to-amber-500/0",
    bar: "bg-amber-500",
  },
  Açougue: {
    dot: "bg-rose-500",
    chip: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    ring: "ring-rose-500/30",
    soft: "from-rose-500/10 to-rose-500/0",
    bar: "bg-rose-500",
  },
  Laticínios: {
    dot: "bg-sky-500",
    chip: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    ring: "ring-sky-500/30",
    soft: "from-sky-500/10 to-sky-500/0",
    bar: "bg-sky-500",
  },
  Bebidas: {
    dot: "bg-violet-500",
    chip: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    ring: "ring-violet-500/30",
    soft: "from-violet-500/10 to-violet-500/0",
    bar: "bg-violet-500",
  },
  Limpeza: {
    dot: "bg-cyan-500",
    chip: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    ring: "ring-cyan-500/30",
    soft: "from-cyan-500/10 to-cyan-500/0",
    bar: "bg-cyan-500",
  },
  Outros: {
    dot: "bg-zinc-500",
    chip: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
    ring: "ring-zinc-500/30",
    soft: "from-zinc-500/10 to-zinc-500/0",
    bar: "bg-zinc-500",
  },
};

const FALLBACK_STYLE = CATEGORY_STYLES.Outros;

function formatCurrency(value, currency = "BRL") {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `R$ ${Number(value).toFixed(2)}`;
  }
}

/** Lower-cases and strips diacritics for accent-insensitive search. */
function normalize(s) {
  return String(s)
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function ShoppingList({
  title = "Compras da semana",
  subtitle = "Tá na Lista",
  categories = [],
  progress,
  budget,
  onToggleItem,
  onEditItem,
  onAddExtraItem,
}) {
  const [query, setQuery] = useState("");
  const [comfort, setComfort] = useState(false);
  const [hideBought, setHideBought] = useState(false);
  const [recentlyToggled, setRecentlyToggled] = useState(new Set());

  // Stable ordering map keeps siblings in place when bought toggles.
  const orderRef = useRef(new Map());
  const orderCounter = useRef(0);
  for (const cat of categories) {
    for (const item of cat.items) {
      if (!orderRef.current.has(item.id)) {
        orderRef.current.set(item.id, orderCounter.current++);
      }
    }
  }

  const normalizedQuery = normalize(query.trim());

  const sortedCategories = useMemo(() => {
    return categories
      .map((cat) => {
        const filtered = cat.items.filter((i) => {
          if (hideBought && i.bought) return false;
          if (!normalizedQuery) return true;
          return (
            normalize(i.name).includes(normalizedQuery) ||
            normalize(cat.label ?? cat.key).includes(normalizedQuery)
          );
        });
        return {
          ...cat,
          items: filtered.sort((a, b) => {
            const ab = a.bought ? 1 : 0;
            const bb = b.bought ? 1 : 0;
            if (ab !== bb) return ab - bb;
            return (
              (orderRef.current.get(a.id) ?? 0) -
              (orderRef.current.get(b.id) ?? 0)
            );
          }),
        };
      })
      .filter((c) => c.items.length > 0);
  }, [categories, normalizedQuery, hideBought]);

  const computed = useMemo(() => {
    const total = categories.reduce((acc, c) => acc + c.items.length, 0);
    const done = categories.reduce(
      (acc, c) => acc + c.items.filter((i) => i.bought).length,
      0,
    );
    return { total, done };
  }, [categories]);

  const total = progress?.total ?? computed.total;
  const done = progress?.done ?? computed.done;
  const percent =
    progress?.percent ?? (total === 0 ? 0 : Math.round((done / total) * 100));

  const handleToggle = (itemId, categoryKey) => {
    const y = typeof window !== "undefined" ? window.scrollY : 0;
    onToggleItem?.(itemId, categoryKey);
    setRecentlyToggled((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    window.setTimeout(() => {
      setRecentlyToggled((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }, 600);
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => window.scrollTo({ top: y }));
    }
  };

  const itemPad = comfort ? "px-5 py-5" : "px-4 py-3.5";
  const nameSize = comfort ? "text-[17px]" : "text-[15px]";
  const qtySize = comfort ? "text-sm" : "text-xs";
  const checkSize = comfort ? "h-8 w-8" : "h-6 w-6";
  const checkIcon = comfort ? "h-5 w-5" : "h-3.5 w-3.5";

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-b from-background to-muted/40 pb-32",
        comfort && "contrast-[1.04]",
      )}
    >
      <div className={cn("mx-auto max-w-md px-4 pt-6", comfort && "max-w-lg")}>
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-center justify-between">
            <div>
              {subtitle && (
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {subtitle}
                </p>
              )}
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
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
                  "flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-200",
                  comfort
                    ? "border-transparent bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <Sun className="h-5 w-5" />
              </button>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Progress + budget */}
          <div className="mt-5 rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                  {percent}%
                </span>
                <span className="text-xs text-muted-foreground">concluído</span>
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                {done}/{total}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-primary/80 via-primary to-primary/90 transition-[width] duration-700 ease-out"
                style={{ width: `${percent}%` }}
              >
                <span className="absolute inset-y-0 right-0 w-6 bg-gradient-to-r from-transparent to-white/30" />
              </div>
            </div>

            {budget &&
              (budget.spent !== undefined || budget.limit !== undefined) && (
                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                  <span className="text-muted-foreground">Orçamento</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {budget.spent !== undefined
                      ? formatCurrency(budget.spent, budget.currency)
                      : "—"}
                    {budget.limit !== undefined && (
                      <span className="text-muted-foreground">
                        {" "}
                        / {formatCurrency(budget.limit, budget.currency)}
                      </span>
                    )}
                  </span>
                </div>
              )}
          </div>

          {/* Search + compact toggle */}
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                inputMode="search"
                placeholder="Buscar item (sem acento)"
                className={cn(
                  "h-11 w-full rounded-2xl border bg-card pl-9 pr-9 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground",
                  "focus:border-primary/40 focus:ring-2 focus:ring-primary/20",
                )}
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
                "h-11 shrink-0 rounded-2xl border px-3 text-xs font-medium transition-colors",
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
        <div className="space-y-5">
          {sortedCategories.map((cat) => {
            const styles = CATEGORY_STYLES[cat.key] ?? FALLBACK_STYLE;
            const pending = cat.items.filter((i) => !i.bought).length;
            const allDone = pending === 0;

            return (
              <section key={cat.key} className="animate-fade-in">
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full ring-2 ring-background",
                        styles.dot,
                      )}
                    />
                    <h2 className="text-sm font-semibold tracking-wide text-foreground">
                      {cat.label ?? cat.key}
                    </h2>
                    {allDone && (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        ok
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                      styles.chip,
                    )}
                  >
                    {pending}/{cat.items.length}
                  </span>
                </div>

                <ul className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-0 left-0 w-[3px] opacity-90",
                      styles.bar,
                    )}
                  />
                  {cat.items.map((item, idx) => {
                    const flashing = recentlyToggled.has(item.id);
                    return (
                      <li
                        key={item.id}
                        className={cn(
                          "group relative flex items-center gap-3",
                          itemPad,
                          "transition-[background-color,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                          "active:scale-[0.995]",
                          item.bought && "bg-muted/40",
                          flashing && "bg-primary/5",
                        )}
                      >
                        {idx > 0 && (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent"
                          />
                        )}

                        <button
                          onClick={() => handleToggle(item.id, cat.key)}
                          aria-label={item.bought ? "Desmarcar" : "Marcar"}
                          className={cn(
                            "flex shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                            checkSize,
                            item.bought
                              ? "border-transparent bg-primary text-primary-foreground"
                              : "border-border bg-background hover:border-primary",
                          )}
                        >
                          <Check
                            className={cn(
                              checkIcon,
                              "transition-all duration-200",
                              item.bought
                                ? "scale-100 opacity-100"
                                : "scale-50 opacity-0",
                            )}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditItem?.(item.id, cat.key)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <p
                              className={cn(
                                "truncate font-medium transition-colors duration-300",
                                nameSize,
                                item.bought
                                  ? "text-muted-foreground/70 line-through decoration-muted-foreground/40"
                                  : "text-foreground",
                              )}
                            >
                              {item.name}
                            </p>
                            {item.extra && !item.bought && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r px-1.5 py-px text-[9px] font-medium uppercase tracking-wide text-foreground/80 ring-1",
                                  styles.soft,
                                  styles.ring,
                                )}
                              >
                                <Sparkles className="h-2.5 w-2.5" />
                                extra
                              </span>
                            )}
                          </div>
                          {item.qty && (
                            <p
                              className={cn(
                                "mt-0.5 tabular-nums transition-colors duration-300",
                                qtySize,
                                item.bought
                                  ? "text-muted-foreground/60"
                                  : "text-muted-foreground",
                              )}
                            >
                              {item.qty}
                            </p>
                          )}
                        </button>

                        {onEditItem && !comfort && (
                          <button
                            onClick={() => onEditItem(item.id, cat.key)}
                            aria-label="Editar"
                            className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-active:opacity-100 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          {sortedCategories.length === 0 && (
            <div className="rounded-2xl border border-dashed bg-card/40 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {normalizedQuery
                  ? `Nenhum item encontrado para "${query}".`
                  : hideBought
                    ? "Tudo comprado por aqui."
                    : "Sua lista está vazia."}
              </p>
              {(normalizedQuery || hideBought) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setHideBought(false);
                  }}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  Mostrar tudo
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating add button */}
      {onAddExtraItem && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-10 flex justify-center px-4">
          <button
            onClick={() => onAddExtraItem()}
            className={cn(
              "pointer-events-auto inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              comfort
                ? "px-7 py-4 text-base font-semibold"
                : "px-5 py-3 text-sm font-semibold",
            )}
          >
            <Plus className={comfort ? "h-5 w-5" : "h-4 w-4"} />
            Adicionar extra
          </button>
        </div>
      )}
    </div>
  );
}
