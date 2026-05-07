export default function ModuleIcon({
  type = "compras",
  size = 72,
  active = false,
}) {
  const iconMap = {
    compras: "/compras.svg",
    festa: "/festa.svg",
    conta: "/conta.svg",
    saude: "/saude.svg",
    eventos: "/eventos.svg",
    condominio: "/condominio.svg",
  };

  const fallbackMap = {
    compras: "🛒",
    festa: "🎉",
    conta: "💳",
    saude: "💊",
    eventos: "🎟️",
    condominio: "🏢",
  };

  const src = iconMap[type] || iconMap.compras;
  const fallback = fallbackMap[type] || "🛒";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: active ? 24 : 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active
          ? "linear-gradient(135deg,#FFFFFF,#EEF2FF)"
          : "#FFFFFF",
        boxShadow: active
          ? "0 18px 38px rgba(109,40,217,0.22)"
          : "0 10px 24px rgba(17,24,39,0.08)",
        border: active
          ? "2px solid rgba(124,58,237,0.25)"
          : "1px solid rgba(229,231,235,0.9)",
        overflow: "hidden",
      }}
    >
      <img
        src={src}
        alt={type}
        style={{
          width: Math.round(size * 0.72),
          height: Math.round(size * 0.72),
          objectFit: "contain",
          display: "block",
        }}
        onError={(event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget.parentElement.textContent = fallback;
        }}
      />
    </div>
  );
}
