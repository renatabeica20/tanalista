export default function ToastMessage({ message }) {
  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 100,
        left: 16,
        right: 16,
        margin: "0 auto",
        maxWidth: 460,
        transform: "translateY(0)",
        zIndex: 700,
      }}
    >
      <div
        style={{
          background: "#111827",
          color: "#FFFFFF",
          borderRadius: 18,
          padding: "14px 16px",
          fontSize: 14,
          fontWeight: 800,
          boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
          textAlign: "center",
        }}
      >
        {message}
      </div>
    </div>
  );
}
