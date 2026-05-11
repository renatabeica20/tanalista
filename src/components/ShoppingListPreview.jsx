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
    <div
      className={cn("min-h-screen pb-28 relative overflow-hidden", comfort && "contrast-[1.04]")}
      style={{
        background:
          "linear-gradient(180deg,#F5F3FF 0%,#FAFAFF 40%,#FFFFFF 100%)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <style>{`
        @keyframes tnl-slp-shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
        @keyframes tnl-slp-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* decorative top glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: -100,
          right: -80,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(167,139,250,0.32) 0%, rgba(167,139,250,0) 70%)",
          filter: "blur(10px)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: 120,
          left: -90,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0) 70%)",
          filter: "blur(10px)",
        }}
      />

      <div className="mx-auto w-full max-w-md px-4 pt-5 relative">
        {/* Header */}
        <header className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              {subtitle && (
                <p
                  className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: "#6D28D9" }}
                >
                  {subtitle}
                </p>
              )}
              <h1
                className="mt-1 truncate text-[22px] font-extrabold tracking-tight"
                style={{
                  background:
                    "linear-gradient(135deg,#1F2937 0%,#4C1D95 60%,#6D28D9 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "-0.02em",
                }}
              >
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setComfort((v) => !v)}
                aria-pressed={comfort}
                aria-label="Modo supermercado"
                className="flex h-11 w-11 items-center justify-center rounded-2xl transition active:scale-95"
                style={
                  comfort
                    ? {
                        background:
                          "linear-gradient(135deg,#F59E0B 0%,#FBBF24 100%)",
                        color: "#FFFFFF",
                        border: "1px solid rgba(251,191,36,0.55)",
                        boxShadow:
                          "0 12px 24px -8px rgba(245,158,11,0.55), inset 0 1px 0 rgba(255,255,255,0.35)",
                      }
                    : {
                        background:
                          "linear-gradient(180deg,#FFFFFF 0%,#F8F4FF 100%)",
                        color: "#6D28D9",
                        border: "1px solid rgba(167,139,250,0.40)",
                        boxShadow:
                          "0 4px 10px -4px rgba(76,29,149,0.18), inset 0 1px 0 rgba(255,255,255,0.95)",
                      }
                }
              >
                <Sun className="h-4 w-4" />
              </button>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg,#4C1D95 0%,#6D28D9 50%,#8B5CF6 100%)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(167,139,250,0.45)",
                  boxShadow:
                    "0 12px 24px -8px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.30)",
                }}
              >
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Progress + spent */}
          <div
            className="relative mt-4 rounded-3xl p-4 overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg,#FFFFFF 0%,#FDFBFF 60%,#F8F4FF 100%)",
              border: "1px solid rgba(167,139,250,0.32)",
              boxShadow:
                "0 20px 50px -16px rgba(76,29,149,0.25), 0 6px 16px -8px rgba(17,24,39,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                top: -40,
                right: -30,
                width: 140,
                height: 140,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(167,139,250,0.20) 0%, rgba(167,139,250,0) 70%)",
                filter: "blur(6px)",
              }}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-[26px] font-black tabular-nums"
                  style={{
                    background:
                      "linear-gradient(135deg,#4C1D95 0%,#7C3AED 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {totals.percent}%
                </span>
                <span className="text-[12px] font-semibold" style={{ color: "#6B7280" }}>
                  concluído
                </span>
              </div>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-extrabold tabular-nums"
                style={{
                  background:
                    "linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 100%)",
                  color: "#4C1D95",
                  border: "1px solid rgba(167,139,250,0.45)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              >
                {totals.done}/{totals.total}
              </span>
            </div>
            <div
              className="relative mt-3 h-2 overflow-hidden rounded-full"
              style={{
                background:
                  "linear-gradient(180deg, rgba(76,29,149,0.10) 0%, rgba(76,29,149,0.16) 100%)",
                boxShadow: "inset 0 1px 2px rgba(76,29,149,0.10)",
              }}
            >
              <div
                className="relative h-full rounded-full transition-[width] duration-700 ease-out overflow-hidden"
                style={{
                  width: `${totals.percent}%`,
                  background:
                    "linear-gradient(90deg,#4C1D95 0%,#7C3AED 50%,#A855F7 100%)",
                  boxShadow:
                    "0 0 10px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.30)",
                }}
              >
                {totals.percent > 0 && totals.percent < 100 && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "40%",
                      height: "100%",
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)",
                      animation: "tnl-slp-shine 1.8s ease-in-out infinite",
                    }}
                  />
                )}
              </div>
            </div>
            {totals.sum > 0 && (
              <div
                className="relative mt-3 flex items-center justify-between pt-3 text-[12.5px]"
                style={{ borderTop: "1px dashed rgba(167,139,250,0.40)" }}
              >
                <span className="font-semibold" style={{ color: "#6B7280" }}>
                  💰 Total estimado
                </span>
                <span
                  className="font-black tabular-nums"
                  style={{
                    background:
                      "linear-gradient(135deg,#4C1D95 0%,#6D28D9 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontSize: 14,
                  }}
                >
                  {fmtBRL(totals.sum)}
                </span>
              </div>
            )}
          </div>

          {/* Search + compact */}
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "#9333EA" }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                inputMode="search"
                placeholder="Buscar item (sem acento)"
                className="h-12 w-full rounded-2xl pl-10 pr-9 text-sm outline-none transition"
                style={{
                  background:
                    "linear-gradient(180deg,#FFFFFF 0%,#FBFAFF 100%)",
                  border: "1.5px solid rgba(167,139,250,0.40)",
                  color: "#111827",
                  fontWeight: 600,
                  boxShadow:
                    "inset 0 1px 2px rgba(76,29,149,0.06), 0 1px 0 rgba(255,255,255,0.9)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(124,58,237,0.65)";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 4px rgba(124,58,237,0.14), inset 0 1px 2px rgba(76,29,149,0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(167,139,250,0.40)";
                  e.currentTarget.style.boxShadow =
                    "inset 0 1px 2px rgba(76,29,149,0.06), 0 1px 0 rgba(255,255,255,0.9)";
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition"
                  style={{
                    color: "#6D28D9",
                    background: "rgba(167,139,250,0.14)",
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setHideBought((v) => !v)}
              aria-pressed={hideBought}
              className="h-12 shrink-0 rounded-2xl px-4 text-[12.5px] font-extrabold transition active:scale-95"
              style={
                hideBought
                  ? {
                      background:
                        "linear-gradient(135deg,#4C1D95 0%,#6D28D9 50%,#8B5CF6 100%)",
                      color: "#FFFFFF",
                      border: "1px solid rgba(167,139,250,0.45)",
                      boxShadow:
                        "0 12px 24px -8px rgba(76,29,149,0.55), inset 0 1px 0 rgba(255,255,255,0.30)",
                      letterSpacing: "-0.005em",
                    }
                  : {
                      background:
                        "linear-gradient(180deg,#FFFFFF 0%,#F8F4FF 100%)",
                      color: "#4C1D95",
                      border: "1.5px solid rgba(167,139,250,0.40)",
                      boxShadow:
                        "0 4px 10px -4px rgba(76,29,149,0.10), inset 0 1px 0 rgba(255,255,255,0.95)",
                      letterSpacing: "-0.005em",
                    }
              }
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
              <section key={cat.key} style={{ animation: "tnl-slp-in 320ms ease-out" }}>
                {/* Section header */}
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-white", styles.dot)} />
                    <h2
                      className="truncate text-[13px] font-extrabold tracking-wide"
                      style={{ color: "#111827", letterSpacing: "-0.005em" }}
                    >
                      {cat.label ?? cat.key}
                    </h2>
                    {cat.allDone && (
                      <span className={cn(
                        "ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
                        styles.chip,
                      )}>
                        <BadgeCheck className="h-3 w-3" />
                        concluída
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10.5px] font-extrabold tabular-nums ring-1",
                    styles.chip,
                  )}>
                    {pending}/{cat.total}
                  </span>
                </div>

                <ul
                  className="relative overflow-hidden rounded-3xl"
                  style={{
                    background:
                      "linear-gradient(180deg,#FFFFFF 0%,#FDFBFF 100%)",
                    border: "1px solid rgba(167,139,250,0.28)",
                    boxShadow:
                      "0 12px 28px -14px rgba(76,29,149,0.20), 0 4px 10px -6px rgba(17,24,39,0.05), inset 0 1px 0 rgba(255,255,255,0.95)",
                  }}
                >
                  {/* Category color bar */}
                  <span
                    aria-hidden
                    className={cn("absolute inset-y-0 left-0 w-[4px]", styles.bar, cat.allDone && "opacity-60")}
                    style={{ boxShadow: "0 0 8px rgba(0,0,0,0.08)" }}
                  />

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
                          "group relative flex items-center gap-3 pl-5 pr-4 transition-[background-color,opacity] duration-500",
                          padY,
                        )}
                        style={{
                          background: item.bought
                            ? "linear-gradient(90deg, rgba(245,243,255,0.55) 0%, rgba(245,243,255,0.30) 100%)"
                            : "transparent",
                        }}
                      >
                        {idx > 0 && (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-x-5 top-0 h-px"
                            style={{ background: "rgba(167,139,250,0.22)" }}
                          />
                        )}
                        <button
                          type="button"
                          data-tour-step={idx === 0 ? "list_item_check" : undefined}
                          onClick={() => handleToggle(item.id, cat.key)}
                          aria-label={item.bought ? "Desmarcar item" : "Marcar como comprado"}
                          className={cn(
                            "flex shrink-0 items-center justify-center rounded-full transition active:scale-90",
                            checkSize,
                          )}
                          style={
                            item.bought
                              ? {
                                  background:
                                    "linear-gradient(135deg,#4C1D95 0%,#6D28D9 50%,#8B5CF6 100%)",
                                  color: "#FFFFFF",
                                  border: "2px solid transparent",
                                  boxShadow:
                                    "0 6px 14px -4px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.35)",
                                }
                              : {
                                  background:
                                    "linear-gradient(180deg,#FFFFFF 0%,#FBFAFF 100%)",
                                  border: "2px solid rgba(167,139,250,0.50)",
                                  boxShadow:
                                    "inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 2px rgba(76,29,149,0.06)",
                                }
                          }
                        >
                          <Check className={cn(checkIcon, "transition", item.bought ? "scale-100 opacity-100" : "scale-50 opacity-0")} />
                        </button>

                        <button
                          type="button"
                          data-tour-step={idx === 0 ? "list_item_price" : undefined}
                          onClick={() => onEditItem?.(item.id, cat.key)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={cn("truncate font-semibold", nameSize)}
                              style={
                                item.bought
                                  ? {
                                      color: "#9CA3AF",
                                      textDecoration: "line-through",
                                      textDecorationColor: "rgba(156,163,175,0.55)",
                                    }
                                  : { color: "#111827", letterSpacing: "-0.005em" }
                              }
                            >
                              {item.name}
                            </p>
                            {total != null && (
                              <span className={cn(
                                "shrink-0 rounded-lg px-2 py-0.5 font-extrabold tabular-nums ring-1",
                                metaSize,
                                item.bought
                                  ? "bg-muted text-muted-foreground/80 ring-border"
                                  : cn(styles.chip),
                              )}>
                                {fmtBRL(total)}
                              </span>
                            )}
                          </div>
                          {(qty != null || item.unit || unitPrice != null) && (
                            <p
                              className={cn("mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 tabular-nums font-semibold", metaSize)}
                              style={{ color: item.bought ? "#A1A1AA" : "#6B7280" }}
                            >
                              {qty != null && (
                                <span style={{ color: item.bought ? "#A1A1AA" : "#4C1D95" }}>
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

                        <button
                          type="button"
                          data-tour-step={idx === 0 ? "list_item_missing" : undefined}
                          aria-label="Marcar item em falta"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition active:scale-90"
                          style={{
                            background:
                              "linear-gradient(180deg,#FFFFFF 0%,#FBFAFF 100%)",
                            border: "1px solid rgba(167,139,250,0.35)",
                            color: "#B91C1C",
                            boxShadow:
                              "0 1px 2px rgba(76,29,149,0.06)",
                          }}
                        >
                          ∅
                        </button>

                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          {sections.length === 0 && (
            <div
              className="rounded-3xl p-10 text-center"
              style={{
                background:
                  "linear-gradient(180deg,#FFFFFF 0%,#FDFBFF 60%,#F8F4FF 100%)",
                border: "1px dashed rgba(167,139,250,0.50)",
                boxShadow:
                  "0 8px 22px -10px rgba(76,29,149,0.15), inset 0 1px 0 rgba(255,255,255,0.95)",
              }}
            >
              <div
                className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 60%,#DDD6FE 100%)",
                  border: "1px solid rgba(167,139,250,0.40)",
                  fontSize: 28,
                }}
              >
                🛒
              </div>
              <p
                className="text-sm font-bold"
                style={{
                  background:
                    "linear-gradient(135deg,#4C1D95 0%,#6D28D9 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
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
            data-tour-step="list_extra_item"
            onClick={() => onAddExtraItem()}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-extrabold transition active:scale-95"
            style={{
              background:
                "linear-gradient(135deg,#4C1D95 0%,#6D28D9 50%,#8B5CF6 100%)",
              color: "#FFFFFF",
              border: "1px solid rgba(167,139,250,0.45)",
              boxShadow:
                "0 20px 40px -12px rgba(76,29,149,0.55), 0 6px 14px rgba(124,58,237,0.30), inset 0 1px 0 rgba(255,255,255,0.30)",
              letterSpacing: "-0.005em",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Plus className="h-4 w-4" />
            Adicionar extra
          </button>
        </div>
      )}
    </div>
  );
}
