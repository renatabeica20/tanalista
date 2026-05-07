export default function AppLogo({
  size = 48,
  radius = 16,
  shadow = true,
}) {
  return (
    <img
      src="/icon-192.png"
      alt="Tá na Lista"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: "cover",
        display: "block",
        boxShadow: shadow
          ? "0 14px 30px rgba(109,40,217,0.24)"
          : "none",
        border: "1px solid rgba(255,255,255,0.28)",
      }}
    />
  );
}
