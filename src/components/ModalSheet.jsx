export default function ModalSheet({ onClose, children }) {
  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,0.46)",
        zIndex: 400,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 24,
          padding: "20px",
          width: "100%",
          maxWidth: 430,
          boxShadow: "0 -12px 40px rgba(17,24,39,0.25)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
