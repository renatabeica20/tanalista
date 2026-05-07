export default function ModuleIcon({
  icon,
  bg = "#EEF2FF",
  color = "#4338CA",
  size = 52,
  iconSize = 24,
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.32),
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: iconSize,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
      }}
    >
      {icon}
    </div>
  );
}
