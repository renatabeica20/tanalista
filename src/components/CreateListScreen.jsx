import { useState, useEffect } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import AppLogo from "./AppLogo";
import VoiceInput from "./VoiceInput";

const inp = (extra = {}) => ({
  width: "100%",
  padding: "13px 16px",
  border: "2px solid #E5E7EB",
  borderRadius: 18,
  fontSize: 16,
  color: "#111827",
  outline: "none",
  fontFamily: "inherit",
  background: "#FFFFFF",
  boxSizing: "border-box",
  WebkitTapHighlightColor: "transparent",
  transition: "border-color .25s ease, box-shadow .25s ease",
  ...extra,
});

const lbl = {
  fontWeight: 800,
  fontSize: 11,
  color: "#4C1D95",
  marginBottom: 10,
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const createCard = {
  background: "linear-gradient(180deg,#FFFFFF 0%,#FBFAFF 100%)",
  borderRadius: 24,
  padding: 18,
  border: "1px solid rgba(167,139,250,0.22)",
  boxShadow: "0 14px 30px rgba(17,24,39,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
  transition: "border-color .25s ease, box-shadow .25s ease, transform .25s ease",
};

const createSecondaryBtn = {
  width: "100%",
  minHeight: 52,
  padding: "13px 14px",
  borderRadius: 18,
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  color: "#374151",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  boxShadow: "0 8px 20px rgba(17,24,39,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
  WebkitTapHighlightColor: "transparent",
  transition: "transform .2s ease, box-shadow .25s ease, border-color .25s ease",
};

const createPrimaryBtn = {
  width: "100%",
  minHeight: 58,
  padding: "16px 18px",
  borderRadius: 22,
  background: "linear-gradient(135deg,#4C1D95 0%,#6D28D9 50%,#8B5CF6 100%)",
  border: "none",
  color: "white",
  fontWeight: 900,
  fontSize: 17,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  boxShadow: "0 18px 38px rgba(109,40,217,0.34), inset 0 1px 0 rgba(255,255,255,0.18)",
  letterSpacing: "0.01em",
  WebkitTapHighlightColor: "transparent",
  transition: "transform .2s ease, box-shadow .25s ease, opacity .2s ease",
};

function HelpIcon({ text = "" }) {
  return (
    <span
      title={text}
      onClick={(e) => { e.stopPropagation(); if (text) alert(text); }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#EDE9FE,#F5F3FF)",
        color: "#5B21B6",
        fontSize: 11,
        fontWeight: 900,
        cursor: "pointer",
        border: "1px solid #C7D2FE",
        flexShrink: 0,
        fontStyle: "italic",
      }}
    >
      i
    </span>
  );
}

export default function CreateListScreen({
  archiveFinishedListsBeforeHome,
  setPendingItems,
  setCurrentInput,
  setEditingListId,
  setPantryCompared,
  setPantryComparison,
  listName,
  setListName,
  listNameConfirmed,
  setListNameConfirmed,
  listNameSavedPulse,
  triggerListNameSavedPulse,
  startGuidedTour,
  activePantry,
  removeActivePantry,
  shareActivePantry,
  pantryShareStatus,
  formatPantryDate,
  countCategoryItems,
  openPantryViewer,
  openPantryEditor,
  openPantryCreator,
  budgetText,
  setBudgetText,
  maskBRLInput,
  budgetConfirmed,
  setBudgetConfirmed,
  budgetSavedPulse,
  triggerBudgetSavedPulse,
  listType,
  setListType,
  LIST_TYPES,
  currentInput,
  handleAddItem,
  setPasteTarget,
  setShowPasteModal,
  voiceTargetRef,
  setVoiceTarget,
  startVoiceInput,
  voiceProcessing,
  voiceListening,
  pendingItems,
  formatQtyUnit,
  editPendingItem,
  pantryCompared,
  editingListId,
  compareWithActivePantry,
  organizeList,
  organizeListKeepOrder,
  loading,
  isTourStep,
  tourHighlightStyle,
}) {
  const [pantryMenuOpen, setPantryMenuOpen] = useState(false);
  const [confirmDeleteConfig, setConfirmDeleteConfig] = useState(null);

  // Tema visual dinâmico por tipo de lista. Apenas cosmético.
  const THEME_MAP = {
    supermercado: { color: "#6D28D9", dark: "#4C1D95", light: "#8B5CF6", soft: "#F5F3FF", softBorder: "#DDD6FE", icon: "🛒", placeholder: "Digite um item da lista" },
    eventos:      { color: "#EA580C", dark: "#9A3412", light: "#FB923C", soft: "#FFF7ED", softBorder: "#FED7AA", icon: "🎉", placeholder: "Ex: balões, bolo, refrigerante..." },
    construcao:   { color: "#B45309", dark: "#78350F", light: "#D97706", soft: "#FFFBEB", softBorder: "#FDE68A", icon: "🏗️", placeholder: "Ex: cimento, tijolo, prego..." },
    eletrico:     { color: "#1D4ED8", dark: "#1E3A8A", light: "#3B82F6", soft: "#EFF6FF", softBorder: "#BFDBFE", icon: "⚡", placeholder: "Ex: fio, disjuntor, tomada..." },
    escolar:      { color: "#15803D", dark: "#14532D", light: "#22C55E", soft: "#F0FDF4", softBorder: "#BBF7D0", icon: "🏫", placeholder: "Ex: caderno, lápis, mochila..." },
    farmacia:     { color: "#BE185D", dark: "#831843", light: "#EC4899", soft: "#FDF2F8", softBorder: "#FBCFE8", icon: "💊", placeholder: "Ex: remédio, vitamina, curativo..." },
    condominio:   { color: "#0F4C75", dark: "#0B3559", light: "#3282B8", soft: "#EFF6FF", softBorder: "#BFDBFE", icon: "🏢", placeholder: "Ex: lâmpada, sabão, papel toalha..." },
    outras:       { color: "#374151", dark: "#1F2937", light: "#6B7280", soft: "#F9FAFB", softBorder: "#E5E7EB", icon: "📦", placeholder: "Digite um item da lista" },
  };
  const _normalizeKey = (s) => String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z]/g, "");
  const _lookupTheme = (lt) => {
    const k = _normalizeKey(lt);
    if (THEME_MAP[k]) return THEME_MAP[k];
    if (/super|mercado/.test(k)) return THEME_MAP.supermercado;
    if (/event|festa/.test(k)) return THEME_MAP.eventos;
    if (/constru|obra/.test(k)) return THEME_MAP.construcao;
    if (/eletr/.test(k)) return THEME_MAP.eletrico;
    if (/escol|escola/.test(k)) return THEME_MAP.escolar;
    if (/farm|remed/.test(k)) return THEME_MAP.farmacia;
    if (/condom|predio/.test(k)) return THEME_MAP.condominio;
    if (/outr/.test(k)) return THEME_MAP.outras;
    return THEME_MAP.supermercado;
  };
  const theme = _lookupTheme(listType);
  const themeGradient = `linear-gradient(135deg, ${theme.dark} 0%, ${theme.color} 60%, ${theme.light} 100%)`;
  const themeShadowRGBA = (a) => {
    const h = theme.color.replace("#", "");
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "tnl-create-anim";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes tnl-create-in { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: translateY(0);} }
      @keyframes tnl-create-pop { 0% { transform: scale(.96); opacity: 0;} 100% { transform: scale(1); opacity: 1;} }
    `;
    document.head.appendChild(style);
  }, []);

  const closeAndRemovePantry = () => {
    setPantryMenuOpen(false);
    setConfirmDeleteConfig({
      title: "Excluir?",
      message: "Essa ação remove a lista ativa de Itens em Casa deste aparelho.",
      onConfirm: () => removeActivePantry?.(),
    });
  };

  return (
<div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:"linear-gradient(180deg,#F8F7FF 0%,#FAFAFB 60%,#FFFFFF 100%)"}}>
  <div style={{background:`linear-gradient(135deg, ${theme.soft} 0%, #FFFFFF 100%)`,padding:"16px 20px 14px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${theme.softBorder}`,position:"sticky",top:0,zIndex:100,boxShadow:`0 10px 28px ${themeShadowRGBA(0.14)}`,backdropFilter:"saturate(140%) blur(8px)",transition:"background .3s ease, border-color .3s ease, box-shadow .3s ease"}}>
    <button onClick={()=>{archiveFinishedListsBeforeHome();setPendingItems([]);setCurrentInput("");setEditingListId(null);setPantryCompared(false);setPantryComparison(null);}}
      style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg, ${theme.soft}, #FFFFFF)`,border:`1px solid ${theme.softBorder}`,cursor:"pointer",fontSize:18,color:theme.dark,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,boxShadow:`0 6px 16px ${themeShadowRGBA(0.18)}`,WebkitTapHighlightColor:"transparent"}}>←</button>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span aria-hidden style={{fontSize:22,lineHeight:1}}>{theme.icon}</span>
        <div style={{fontWeight:900,fontSize:18,color:"#111827",textAlign:"center",letterSpacing:"-0.01em",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%",background:listName?`linear-gradient(135deg, ${theme.dark}, ${theme.light})`:"none",WebkitBackgroundClip:listName?"text":"unset",WebkitTextFillColor:listName?"transparent":"#111827"}}>{listName?listName:"Nova lista"}</div>
      </div>
    </div>
    <button onClick={()=>startGuidedTour("create")} style={{border:`1px solid ${theme.softBorder}`,background:`linear-gradient(135deg, ${theme.soft}, #FFFFFF)`,color:theme.dark,borderRadius:999,padding:"8px 12px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",boxShadow:`0 6px 14px ${themeShadowRGBA(0.14)}`,WebkitTapHighlightColor:"transparent"}}>✨ Como usar</button>
  </div>
  <div style={{padding:"18px 18px 40px",flex:1,display:"flex",flexDirection:"column",gap:14,overflowY:"auto",animation:"tnl-create-in .35s ease both"}}>
    {/* ITENS EM CASA */}
    <div data-tour-step={isTourStep("create_pantry") ? "create_pantry" : undefined} style={{...createCard,borderColor:activePantry?"rgba(34,197,94,0.45)":"rgba(167,139,250,0.35)",background:activePantry?"linear-gradient(180deg,#F0FDF4 0%,#ECFDF5 100%)":"linear-gradient(180deg,#FAF9FF 0%,#F5F3FF 100%)",position:"relative",overflow:"visible",...tourHighlightStyle(isTourStep("create_pantry"))}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:50,height:50,borderRadius:18,background:activePantry?"linear-gradient(135deg,#16A34A,#22C55E)":"linear-gradient(135deg,#4C1D95 0%,#6D28D9 60%,#8B5CF6 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:activePantry?"0 14px 28px rgba(22,163,74,0.30)":"0 14px 28px rgba(109,40,217,0.30)",flexShrink:0}}>🏠</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{fontWeight:900,fontSize:15,color:"#111827",letterSpacing:"-0.01em"}}>Itens em Casa</div>
            <HelpIcon text="Registre os itens que você já tem em casa. Enquanto a lista de compras estiver aberta, você pode comparar/recomparar para evitar compras desnecessárias." />
            <span style={{fontSize:10,fontWeight:900,borderRadius:999,padding:"4px 9px",background:activePantry?"linear-gradient(135deg,#DCFCE7,#BBF7D0)":"linear-gradient(135deg,#F3E8FF,#EDE9FE)",color:activePantry?"#15803D":"#6D28D9",border:`1px solid ${activePantry?"#86EFAC":"#DDD6FE"}`,textTransform:"uppercase",letterSpacing:"0.05em"}}>{activePantry?(pantryCompared?"Comparado":"Lista ativa"):"Opcional"}</span>
            {activePantry&&(
              <div style={{marginLeft:"auto",position:"relative",display:"flex",alignItems:"center",gap:6}}>
                <button
                  onClick={shareActivePantry}
                  style={{border:"1px solid #A7F3D0",background:"linear-gradient(135deg,#ECFDF5,#D1FAE5)",color:"#047857",borderRadius:999,padding:"6px 11px",fontSize:11,fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",boxShadow:"0 4px 10px rgba(4,120,87,0.15)",WebkitTapHighlightColor:"transparent"}}
                >
                  Enviar lista
                </button>
                <button
                  onClick={()=>setPantryMenuOpen(v=>!v)}
                  style={{border:"1px solid #E5E7EB",background:"#FFFFFF",color:"#4B5563",borderRadius:999,width:30,height:30,fontSize:16,fontWeight:900,cursor:"pointer",fontFamily:"inherit",lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent"}}
                  aria-label="Mais opções dos Itens em Casa"
                >
                  ⋯
                </button>
                {pantryMenuOpen&&(
                  <div style={{position:"absolute",right:0,top:38,zIndex:450,minWidth:180,background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:16,boxShadow:"0 22px 50px rgba(17,24,39,0.18)",overflow:"hidden",animation:"tnl-create-pop .18s ease both"}}>
                    <button
                      onClick={closeAndRemovePantry}
                      style={{width:"100%",border:"none",background:"#FFFFFF",color:"#B91C1C",padding:"12px 14px",fontSize:13,fontWeight:900,textAlign:"left",cursor:"pointer",fontFamily:"inherit",WebkitTapHighlightColor:"transparent"}}
                    >
                      🗑 Excluir
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{fontSize:12,color:"#6B7280",fontWeight:600,marginTop:5,lineHeight:1.4}}>
            {activePantry ? `Criada em ${formatPantryDate(activePantry.createdAt)} · ${activePantry.itemCount || countCategoryItems(activePantry.categories)} itens` : "Cadastre os itens que você já possui antes ou depois de criar a lista de compras."}
          </div>
          {activePantry && pantryShareStatus && (
            <div style={{fontSize:11,color:"#047857",fontWeight:900,marginTop:6,background:"#ECFDF5",border:"1px solid #A7F3D0",borderRadius:999,padding:"3px 9px",display:"inline-block"}}>
              {pantryShareStatus}
            </div>
          )}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:activePantry?"1fr 1fr":"1fr",gap:10,marginTop:14}}>
        {activePantry&&(<button onClick={openPantryViewer} style={{...createSecondaryBtn,background:"#FFFFFF",borderColor:"#BBF7D0",color:"#15803D"}}>Ver lista</button>)}
        <button data-tour-step={isTourStep("create_pantry_action") ? "create_pantry_action" : undefined} onClick={activePantry?openPantryEditor:openPantryCreator} style={{...createSecondaryBtn,background:activePantry?"#FFFFFF":"linear-gradient(135deg,#FFFFFF,#FAF9FF)",borderColor:"#DDD6FE",color:"#5B21B6",...tourHighlightStyle(isTourStep("create_pantry_action"))}}>{activePantry?"Editar lista":"Criar lista"}</button>
      </div>
    </div>

    {/* ORÇAMENTO */}
    <div data-tour-step={isTourStep("create_budget") ? "create_budget" : undefined} style={{...createCard,...tourHighlightStyle(isTourStep("create_budget"))}}>
      <label style={lbl}>💰 Orçamento</label>
      <div>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontWeight:900,color:budgetText?"#6D28D9":"#9CA3AF",fontSize:15,pointerEvents:"none",transition:"color .25s ease",fontVariantNumeric:"tabular-nums"}}>R$</span>
          <input value={budgetText} onChange={e=>{setBudgetText(maskBRLInput(e.target.value)); if(!budgetConfirmed)setBudgetConfirmed(true); triggerBudgetSavedPulse();}}
            placeholder="0,00" inputMode="numeric"
            style={inp({paddingLeft:44,width:"100%",height:58,borderColor:budgetText?"#6D28D9":"#E5E7EB",boxShadow:budgetSavedPulse?"0 0 0 4px rgba(109,40,217,0.18)":"none",fontWeight:budgetText?900:500,color:budgetText?"#6D28D9":"#111827",fontVariantNumeric:"tabular-nums"})}
            onFocus={e=>e.target.style.borderColor="#6D28D9"} onBlur={e=>e.target.style.borderColor=budgetText?"#6D28D9":"#E5E7EB"}/>
        </div>
        <div style={{fontSize:12,color:budgetText?"#6D28D9":"#9CA3AF",marginTop:8,fontWeight:budgetText?900:600,transition:"color .25s ease, font-weight .25s ease",display:"flex",alignItems:"center",gap:6}}>
          {budgetText ? "✓ Orçamento salvo automaticamente" : "Deixe em branco para não definir limite"}
        </div>
      </div>
    </div>

    {/* NOME DA LISTA */}
    <div data-tour-step={isTourStep("create_name") ? "create_name" : undefined} style={{...createCard,...tourHighlightStyle(isTourStep("create_name"))}}>
      <label style={lbl}>📝 Nome da lista</label>
      <input value={listName} onChange={e=>{setListName(e.target.value); if(!listNameConfirmed)setListNameConfirmed(true); triggerListNameSavedPulse();}}
        placeholder="Ex: Compras da semana..."
        style={inp({width:"100%",height:58,borderColor:listName?"#6D28D9":"#E5E7EB",boxShadow:listNameSavedPulse?"0 0 0 4px rgba(109,40,217,0.18)":"none",fontWeight:listName?900:500,color:listName?"#6D28D9":"#111827"})}
        onFocus={e=>e.target.style.borderColor="#6D28D9"} onBlur={e=>e.target.style.borderColor=listName?"#6D28D9":"#E5E7EB"}/>
      <div style={{fontSize:12,color:listName?"#6D28D9":"#9CA3AF",marginTop:8,fontWeight:listName?900:600,transition:"color .25s ease, font-weight .25s ease"}}>
        {listName ? "✓ Nome salvo automaticamente" : "Você pode alterar o nome quando quiser"}
      </div>
    </div>

    {/* TIPO DE LISTA */}
    <div data-tour-step={isTourStep("create_type") ? "create_type" : undefined} style={{...createCard,...tourHighlightStyle(isTourStep("create_type"))}}>
      <label style={lbl}>🏷 Tipo de lista</label>
      <div style={{position:"relative"}}>
        <select value={listType} onChange={e=>setListType(e.target.value)}
          style={{...inp({height:58,fontSize:16,paddingLeft:18}),appearance:"none",WebkitAppearance:"none",MozAppearance:"none",cursor:"pointer",paddingRight:46,fontWeight:700,color:"#111827"}}>
          {LIST_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <span style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:theme.color,fontSize:12,fontWeight:900,background:theme.soft,borderRadius:999,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${theme.softBorder}`}}>▼</span>
      </div>
    </div>

    <div data-tour-step={isTourStep("create_item_input") ? "create_item_input" : isTourStep("create_item_insert") ? "create_item_insert" : isTourStep("create_item_paste") ? "create_item_paste" : isTourStep("create_item_voice") ? "create_item_voice" : undefined} style={{...createCard,...tourHighlightStyle(isTourStep("create_item_input") || isTourStep("create_item_insert") || isTourStep("create_item_paste") || isTourStep("create_item_voice"))}}>
      <label style={lbl}>🛒 Adicionar itens</label>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <input data-tour-step={isTourStep("create_item_input") ? "create_item_input" : undefined} value={currentInput} onChange={e=>setCurrentInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleAddItem()}
          placeholder={theme.placeholder}
          style={{...inp({height:56}),...tourHighlightStyle(isTourStep("create_item_input"))}} onFocus={e=>e.target.style.borderColor="#6D28D9"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
        <button data-tour-step={isTourStep("create_item_insert") ? "create_item_insert" : undefined} onClick={handleAddItem}
          style={{padding:"0 18px",height:56,borderRadius:18,background:themeGradient,border:"none",color:"white",fontSize:15,fontWeight:900,cursor:"pointer",flexShrink:0,fontFamily:"inherit",whiteSpace:"nowrap",boxShadow:`0 12px 24px ${themeShadowRGBA(0.32)}, inset 0 1px 0 rgba(255,255,255,0.18)`,WebkitTapHighlightColor:"transparent",letterSpacing:"0.01em",...tourHighlightStyle(isTourStep("create_item_insert"))}}>Inserir</button>
      </div>
      <div style={{fontSize:12,color:"#9CA3AF",lineHeight:1.5,fontWeight:600}}>Digite, cole ou fale a lista. O sistema considera o tipo selecionado para organizar os itens.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
        <button data-tour-step={isTourStep("create_item_paste") ? "create_item_paste" : undefined} onClick={()=>{setPasteTarget("list");setShowPasteModal(true);}}
          style={{...createSecondaryBtn,borderColor:theme.softBorder,color:theme.dark,background:`linear-gradient(135deg,#FFFFFF,${theme.soft})`,...tourHighlightStyle(isTourStep("create_item_paste"))}}>
          📋 Colar lista
        </button>
        <VoiceInput
          target="list"
          voiceTargetRef={voiceTargetRef}
          setVoiceTarget={setVoiceTarget}
          startVoiceInput={startVoiceInput}
          voiceProcessing={voiceProcessing}
          voiceListening={voiceListening}
          baseStyle={createSecondaryBtn}
          extraStyle={tourHighlightStyle(isTourStep("create_item_voice"))}
        />
      </div>
    </div>

    {pendingItems.length>0&&(
      <div data-tour-step={isTourStep("create_items_preview") ? "create_items_preview" : undefined} style={{background:"linear-gradient(180deg,#FFFFFF,#FBFAFF)",borderRadius:22,overflow:"hidden",boxShadow:"0 12px 28px rgba(17,24,39,0.07)",border:"1px solid rgba(167,139,250,0.22)",animation:"tnl-create-pop .25s ease both",...tourHighlightStyle(isTourStep("create_items_preview"))}}>
        <div style={{padding:"12px 16px",background:"linear-gradient(135deg,#F5F3FF,#EDE9FE)",borderBottom:"1px solid rgba(167,139,250,0.25)",fontSize:12,fontWeight:900,color:"#4C1D95",display:"flex",justifyContent:"space-between",alignItems:"center",textTransform:"uppercase",letterSpacing:"0.05em"}}>
          <span>{pendingItems.length} {pendingItems.length===1?"item":"itens"} na pré-lista</span>
          <button onClick={()=>setPendingItems([])} style={{background:"#FFFFFF",border:"1px solid #FECACA",color:"#DC2626",fontSize:11,fontWeight:900,cursor:"pointer",fontFamily:"inherit",borderRadius:999,padding:"4px 10px",WebkitTapHighlightColor:"transparent"}}>Limpar tudo</button>
        </div>
        {pendingItems.map((item,i)=>{
          const emb=item.embalagem||"";
          return(
            <div key={i} style={{padding:"12px 14px",borderBottom:i<pendingItems.length-1?"1px solid #F3F0FA":"none",display:"flex",alignItems:"center",gap:10,background:i%2===0?"transparent":"rgba(245,243,255,0.35)"}}>
              <span style={{fontSize:16,width:30,height:30,borderRadius:10,background:"#F5F3FF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"1px solid #EDE9FE"}}>🛒</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {[formatQtyUnit(item.qty,item.unit),item.marca,item.tipo,item.name,emb].filter(Boolean).join(" · ")}
                </div>
              </div>
              <button onClick={()=>editPendingItem(i)}
                style={{background:"#F5F3FF",border:"1px solid #EDE9FE",borderRadius:10,padding:"5px 10px",color:"#6D28D9",cursor:"pointer",fontSize:14,marginRight:4,WebkitTapHighlightColor:"transparent"}}>✏️</button>
              <button onClick={()=>setConfirmDeleteConfig({
                  title:"Excluir item?",
                  message:`Deseja excluir "${item.name || "item"}" da pré-lista?`,
                  onConfirm:()=>setPendingItems(prev=>prev.filter((_,j)=>j!==i)),
                })}
                style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"5px 10px",color:"#DC2626",cursor:"pointer",fontSize:14,fontWeight:900,lineHeight:1,WebkitTapHighlightColor:"transparent"}}>×</button>
            </div>
          );
        })}
      </div>
    )}

    {activePantry && pendingItems.length>0 && !pantryCompared && !editingListId && (
      <div style={{background:"linear-gradient(135deg,#ECFDF5,#D1FAE5)",border:"1px solid #86EFAC",borderRadius:20,padding:14,color:"#166534",display:"flex",gap:10,alignItems:"flex-start",boxShadow:"0 10px 22px rgba(22,163,74,0.12)"}}>
        <div style={{fontSize:20,width:36,height:36,borderRadius:12,background:"#FFFFFF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 4px 10px rgba(22,163,74,0.18)"}}>✅</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:900,fontSize:14}}>Itens em Casa ativa detectada</div>
          <div style={{fontSize:12,fontWeight:600,lineHeight:1.45,marginTop:3,color:"#15803D"}}>Sua pré-lista pode ser comparada com a Itens em Casa antes de organizar.</div>
        </div>
      </div>
    )}

    {(activePantry && pendingItems.length>0 && !pantryCompared && !editingListId) ? (
      <button data-tour-step={isTourStep("create_ai") ? "create_ai" : undefined} onClick={compareWithActivePantry} disabled={loading||pendingItems.length===0}
        style={{...createPrimaryBtn,background:"linear-gradient(135deg,#15803D 0%,#16A34A 50%,#22C55E 100%)",boxShadow:(loading||pendingItems.length===0)?"none":"0 18px 38px rgba(22,163,74,0.32), inset 0 1px 0 rgba(255,255,255,0.18)",opacity:(loading||pendingItems.length===0)?0.5:1,cursor:(loading||pendingItems.length===0)?"not-allowed":"pointer",...tourHighlightStyle(isTourStep("create_ai"))}}>
        Comparar com Itens em Casa {pendingItems.length>0&&`(${pendingItems.length} ${pendingItems.length===1?"item":"itens"})`}
      </button>
    ) : (
      <>
        <button data-tour-step={isTourStep("create_ai") ? "create_ai" : undefined} onClick={organizeList} disabled={loading||pendingItems.length===0}
          style={{...createPrimaryBtn,background:themeGradient,boxShadow:`0 18px 38px ${themeShadowRGBA(0.34)}, inset 0 1px 0 rgba(255,255,255,0.18)`,opacity:(loading||pendingItems.length===0)?0.5:1,cursor:(loading||pendingItems.length===0)?"not-allowed":"pointer",...tourHighlightStyle(isTourStep("create_ai"))}}>
          {editingListId?"Salvar alterações":"✨ Organizar com IA"} {pendingItems.length>0&&`(${pendingItems.length} ${pendingItems.length===1?"item":"itens"})`}
        </button>
        {pendingItems.length>0&&(
          <button onClick={organizeListKeepOrder} disabled={loading}
            style={{...createSecondaryBtn,borderColor:theme.softBorder,color:theme.dark,background:`linear-gradient(135deg,#FFFFFF,${theme.soft})`}}>
            📝 Manter minha ordem
          </button>
        )}
      </>
    )}
  </div>
  <ConfirmDeleteModal
    open={Boolean(confirmDeleteConfig)}
    title={confirmDeleteConfig?.title || "Excluir?"}
    message={confirmDeleteConfig?.message || "Essa ação não pode ser desfeita."}
    onCancel={()=>setConfirmDeleteConfig(null)}
    onConfirm={()=>{
      const action=confirmDeleteConfig?.onConfirm;
      setConfirmDeleteConfig(null);
      if(typeof action==="function") action();
    }}
  />
</div>
  );
}
