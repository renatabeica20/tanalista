import AppLogo from "./AppLogo";

export default function BrandWordmark({
  compact = false,
  color = "#111827",
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 8 : 12,
        justifyContent: "center",
      }}
    >
      <AppLogo
        size={compact ? 42 : 64}
        radius={compact ? 14 : 20}
      />

      <div
        style={{
          fontWeight: 900,
          fontSize: compact ? 22 : "clamp(28px, 9vw, 34px)",
          color,
          letterSpacing: "-0.03em",
        }}
      >
        Tá na Lista
      </div>
    </div>
  );
}
