import ModalSheet from "./ModalSheet";

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      style={{ display: "inline-block", flexShrink: 0, verticalAlign: "middle" }}
    >
      <circle cx="16" cy="16" r="15.5" fill="#25D366" />
      <path
        fill="#FFFFFF"
        d="M16.02 6.4c-5.32 0-9.64 4.31-9.64 9.62 0 1.7.45 3.36 1.3 4.82L6.3 25.9l5.17-1.35a9.6 9.6 0 0 0 4.55 1.16h.01c5.31 0 9.63-4.31 9.63-9.62S21.34 6.4 16.02 6.4Zm0 17.68h-.01a7.99 7.99 0 0 1-4.06-1.11l-.29-.17-3.07.8.82-2.99-.19-.31a7.96 7.96 0 0 1-1.22-4.27c0-4.42 3.6-8.01 8.03-8.01a7.98 7.98 0 0 1 5.68 2.35 7.97 7.97 0 0 1 2.35 5.67c0 4.43-3.6 8.04-8.04 8.04Z"
      />
      <path
        fill="#FFFFFF"
        d="M20.42 17.93c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.18-.71-.64-1.19-1.42-1.33-1.66-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"
      />
    </svg>
  );
}

export default function SharedListModal({
  open,
  senderName,
  onClose,
  onSenderNameChange,
  onShareWhatsApp,
}) {
  if (!open) return null;

  return (
    <ModalSheet onClose={onClose}>
      <div style={{fontWeight:900,fontSize:18,color:"#111827",marginBottom:4,textAlign:"center"}}>Compartilhar lista</div>
      <div style={{fontSize:13,color:"#6B7280",marginBottom:16,textAlign:"center"}}>Envio disponível pelo WhatsApp</div>
      <div style={{background:"#F9FAFB",border:"1px solid #E5E7EB",borderRadius:18,padding:12,marginBottom:12}}>
        <label style={{display:"block",fontSize:12,fontWeight:800,color:"#4B5563",marginBottom:7}}>Seu nome</label>
        <input
          value={senderName}
          onChange={(e) => onSenderNameChange?.(e.target.value)}
          placeholder="Ex: Cadu"
          style={{width:"100%",boxSizing:"border-box",border:"1px solid #D9DDE6",borderRadius:14,padding:"11px 12px",fontSize:14,fontWeight:700,color:"#111827",outline:"none",fontFamily:"inherit",background:"#FFFFFF"}}
        />
        <div style={{fontSize:12,color:"#6B7280",fontStyle:"italic",marginTop:7}}>Quem receberá a lista verá seu nome</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <button
          onClick={onShareWhatsApp}
          style={{width:"100%",padding:16,borderRadius:20,background:"#25D366",border:"none",color:"white",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:12}}
        >
          <WhatsAppIcon size={20} /> WhatsApp
        </button>
      </div>
    </ModalSheet>
  );
}
