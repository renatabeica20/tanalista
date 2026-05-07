export default function ExpandableSection({
  id,
  title,
  subtitle,
  openSection,
  setOpenSection,
  children,
}) {
  const isOpen = openSection === id;

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 24,
        marginBottom: 12,
        boxShadow: "0 12px 28px rgba(17,24,39,0.055)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpenSection(isOpen ? null : id)}
        style={{
          width: "100%",
          border: "none",
          background: isOpen
            ? "linear-gradient(135deg,#F5F3FF,#FFFFFF)"
            : "#FFFFFF",
          padding: "16px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: "#4C1D95",
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>

          {subtitle ? (
            <div
              style={{
                fontSize: 12,
                color: "#6B7280",
                fontWeight: 700,
                marginTop: 4,
                lineHeight: 1.35,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6D28D9",
            background: "#F5F3FF",
            border: "1px solid #DDD6FE",
            fontWeight: 900,
            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform .2s",
            flexShrink: 0,
          }}
        >
          ›
        </div>
      </button>

      {isOpen && (
        <div style={{ padding: "0 16px 16px" }}>
          {children}
        </div>
      )}
    </div>
  );
}
