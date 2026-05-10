import { useState } from "react";

/**
 * SearchBar — modernized visual-only refactor.
 *
 * Mantém TODAS as props e lógica original:
 *   - searchRef, search, setSearch
 *   - inputStyle (mesclado por cima do estilo base — sobrescreve quando fornecido)
 *   - highlightStyle (aplicado ao container)
 *   - placeholder
 */
export default function SearchBar({
  searchRef,
  search,
  setSearch,
  inputStyle,
  highlightStyle = {},
  placeholder = "Buscar item na lista...",
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hasValue = Boolean(search);

  const borderColor = focused
    ? "#7C3AED"
    : hovered
      ? "#C4B5FD"
      : "#E0D9FF";

  const baseInputStyle = {
    width: "100%",
    height: 50,
    padding: "0 46px 0 46px",
    fontSize: 16, // evita zoom no iOS
    color: "#0F172A",
    background: focused ? "#FFFFFF" : "#FBFAFF",
    border: `1.5px solid ${borderColor}`,
    borderRadius: 16,
    outline: "none",
    boxShadow: focused
      ? "0 0 0 4px rgba(124, 58, 237, 0.14), 0 6px 18px -8px rgba(124, 58, 237, 0.25)"
      : "0 1px 2px rgba(17, 24, 39, 0.04), inset 0 0 0 1px rgba(255,255,255,0.6)",
    transition:
      "border-color 200ms ease, box-shadow 240ms ease, background-color 200ms ease",
    WebkitAppearance: "none",
    appearance: "none",
    fontWeight: 500,
    letterSpacing: "-0.01em",
    fontFamily: "inherit",
  };

  return (
    <div
      role="search"
      style={{
        margin: "14px 20px 0",
        position: "relative",
        ...highlightStyle,
      }}
    >
      {/* Ícone de busca */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 16,
          top: "50%",
          transform: "translateY(-50%)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          borderRadius: 8,
          background: focused
            ? "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(159,103,250,0.10))"
            : "transparent",
          color: focused ? "#7C3AED" : "#94A3B8",
          transition: "color 200ms ease, background 240ms ease",
          pointerEvents: "none",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>

      <input
        ref={searchRef}
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="search"
        style={{ ...baseInputStyle, ...inputStyle }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={(e) => {
          setFocused(true);
          if (inputStyle?.borderColor === undefined) {
            e.target.style.borderColor = "#7C3AED";
          }
        }}
        onBlur={(e) => {
          setFocused(false);
          if (inputStyle?.borderColor === undefined) {
            e.target.style.borderColor = "#E0D9FF";
          }
        }}
      />

      {hasValue && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            searchRef?.current?.focus?.();
          }}
          aria-label="Limpar busca"
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            width: 34,
            height: 34,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F3EFFF",
            border: "1px solid rgba(124, 58, 237, 0.12)",
            borderRadius: 999,
            color: "#6D28D9",
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
            boxShadow: "0 2px 6px -2px rgba(124, 58, 237, 0.18)",
            transition:
              "background-color 160ms ease, color 160ms ease, transform 140ms ease, box-shadow 180ms ease",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(-50%) scale(0.9)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            e.currentTarget.style.background = "#F3EFFF";
            e.currentTarget.style.color = "#6D28D9";
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#7C3AED";
            e.currentTarget.style.color = "#FFFFFF";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
