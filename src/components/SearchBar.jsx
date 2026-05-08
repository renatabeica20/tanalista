export default function SearchBar({
  searchRef,
  search,
  setSearch,
  inputStyle,
  highlightStyle = {},
  placeholder = "Buscar item na lista...",
}) {
  return (
    <div style={{ margin: "14px 20px 0", position: "relative", ...highlightStyle }}>
      <span
        style={{
          position: "absolute",
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 16,
          color: "#9CA3AF",
        }}
      >
        🔍
      </span>
      <input
        ref={searchRef}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={(e) => {
          e.target.style.borderColor = "#6D28D9";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#E5E7EB";
        }}
      />
      {search && (
        <button
          onClick={() => {
            setSearch("");
            searchRef.current?.focus?.();
          }}
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "#6B7280",
            fontSize: 18,
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
