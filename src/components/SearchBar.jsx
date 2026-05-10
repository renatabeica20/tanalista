import { useState } from "react";

/**
 * SearchBar — modernized visual-only refactor.
 *
 * Mantém TODAS as props e lógica original:
 *   - searchRef, search, setSearch
 *   - inputStyle (mesclado por cima do estilo base — sobrescreve quando fornecido)
 *   - highlightStyle (aplicado ao container)
 *   - placeholder
 *
 * Melhorias:
 *   - Foco premium com anel suave (box-shadow) e borda animada
 *   - Ícones SVG nítidos (substituem emoji) com aria-hidden
 *   - Botão "limpar" acessível (aria-label) e com área de toque ≥ 32px
 *   - Transições suaves em borda, sombra e cor
 *   - role="search" no container e type="search" no input
 *   - Mobile-first: altura confortável, fontes legíveis, sem zoom no iOS (16px)
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

  const baseInputStyle = {
    width: "100%",
    height: 46,
    padding: "0 42px 0 42px",
    fontSize: 16, // evita zoom no iOS
    color: "#111827",
    background: "#FFFFFF",
    border: `1.5px solid ${focused ? "#6D28D9" : "#E5E7EB"}`,
    borderRadius: 14,
    outline: "none",
    boxShadow: focused
      ? "0 0 0 4px rgba(109, 40, 217, 0.14), 0 1px 2px rgba(17, 24, 39, 0.04)"
      : "0 1px 2px rgba(17, 24, 39, 0.04)",
    transition:
      "border-color 180ms ease, box-shadow 220ms ease, background-color 180ms ease",
    WebkitAppearance: "none",
    appearance: "none",
    fontWeight: 500,
    letterSpacing: "-0.005em",
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
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: focused ? "#6D28D9" : "#9CA3AF",
          transition: "color 180ms ease",
          pointerEvents: "none",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
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
        onFocus={(e) => {
          setFocused(true);
          if (inputStyle?.borderColor === undefined) {
            e.target.style.borderColor = "#6D28D9";
          }
        }}
        onBlur={(e) => {
          setFocused(false);
          if (inputStyle?.borderColor === undefined) {
            e.target.style.borderColor = "#E5E7EB";
          }
        }}
      />

      {search && (
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
            width: 32,
            height: 32,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F3F4F6",
            border: "none",
            borderRadius: 999,
            color: "#4B5563",
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
            transition:
              "background-color 160ms ease, color 160ms ease, transform 120ms ease",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(-50%) scale(0.92)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            e.currentTarget.style.background = "#F3F4F6";
            e.currentTarget.style.color = "#4B5563";
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#EDE9FE";
            e.currentTarget.style.color = "#6D28D9";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
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
