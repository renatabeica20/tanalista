import { useState } from "react";
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
  ...extra,
});

const lbl = {
  fontWeight: 800,
  fontSize: 12,
  color: "#374151",
  marginBottom: 9,
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const createCard = {
  background: "rgba(255,255,255,0.98)",
  borderRadius: 24,
  padding: 18,
  border: "1px solid #E5E7EB",
  boxShadow: "0 14px 30px rgba(17,24,39,0.07)",
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
  boxShadow: "0 8px 20px rgba(17,24,39,0.06)",
};

const createPrimaryBtn = {
  width: "100%",
  minHeight: 58,
  padding: "16px 18px",
  borderRadius: 22,
  background: "linear-gradient(135deg,#6D28D9,#8B5CF6)",
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
  boxShadow: "0 16px 34px rgba(109,40,217,0.30)",
};

function HelpIcon({ text = "" }) {
  const [pantryMenuOpen, setPantryMenuOpen] = useState(false);

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
        background: "#EEF2FF",
        color: "#5B21B6",
        fontSize: 12,
        fontWeight: 900,
        cursor: "pointer",
        border: "1px solid #C7D2FE",
        flexShrink: 0,
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
  loading,
  isTourStep,
  tourHighlightStyle,
}) {
  return (
<div style={{display:"flex",flexDirection:"column",minHeight:"100vh"}}>
  <div style={{background:"#FFFFFF",padding:"16px 20px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #E5E7EB",position:"sticky",top:0,zIndex:100,boxShadow:"0 8px 24px rgba(17,24,39,0.06)"}}>
    <button onClick={()=>{archiveFinishedListsBeforeHome();setPendingItems([]);setCurrentInput("");setEditingListId(null);setPantryCompared(false);setPantryComparison(null);}}
      style={{width:36,height:36,borderRadius:"50%",background:"#F9FAFB",border:"none",cursor:"pointer",fontSize:18,color:"#4A5568",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><AppLogo size={26} radius={8} shadow={false}/><div style={{fontWeight:800,fontSize:18,color:"#111827",textAlign:"center"}}>{listName?listName:"Nova lista"}</div></div>
    </div>
    <button onClick={()=>startGuidedTour("create")} style={{border:"1px solid #DDD6FE",background:"#F5F3FF",color:"#5B21B6",borderRadius:999,padding:"8px 10px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>✨ Como usar</button>
  </div>
  <div style={{padding:20,flex:1,display:"flex",flexDirection:"column",gap:14,overflowY:"auto",paddingBottom:40}}>
    {/* ITENS EM CASA */}
    <div style={{...createCard,borderColor:activePantry?"#86EFAC":"#DDD6FE",background:activePantry?"#F0FDF4":"#FAF9FF",...tourHighlightStyle(isTourStep("create_pantry"))}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:48,height:48,borderRadius:18,background:activePantry?"linear-gradient(135deg,#16A34A,#22C55E)":"linear-gradient(135deg,#6D28D9,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"0 12px 24px rgba(109,40,217,0.18)"}}>🏠</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{fontWeight:900,fontSize:15,color:"#111827"}}>Itens em Casa</div>
            <HelpIcon text="Registre os itens que você já tem em casa. Enquanto a lista de compras estiver aberta, você pode comparar/recomparar para evitar compras desnecessárias." />
            <span style={{fontSize:11,fontWeight:900,borderRadius:999,padding:"4px 9px",background:activePantry?"#DCFCE7":"#F3E8FF",color:activePantry?"#15803D":"#6D28D9",border:`1px solid ${activePantry?"#86EFAC":"#DDD6FE"}`}}>{activePantry?(pantryCompared?"Comparado com esta lista":(pantryShareStatus||"Lista ativa")):"Opcional"}</span>
            {activePantry&&(
              <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,position:"relative"}}>
                <button onClick={shareActivePantry} style={{border:"1px solid #BBF7D0",background:"#DCFCE7",color:"#15803D",borderRadius:999,padding:"4px 9px",fontSize:11,fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Enviar lista</button>
                <button onClick={()=>setPantryMenuOpen(v=>!v)} title="Mais opções" style={{width:30,height:30,borderRadius:"50%",border:"1px solid #E5E7EB",background:"#FFFFFF",color:"#374151",fontSize:18,fontWeight:900,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>⋯</button>
                {pantryMenuOpen&&(
                  <div style={{position:"absolute",right:0,top:34,minWidth:156,background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:14,boxShadow:"0 18px 36px rgba(17,24,39,0.16)",padding:6,zIndex:20}}>
                    <button onClick={()=>{setPantryMenuOpen(false);removeActivePantry?.();}} style={{width:"100%",border:"none",background:"#FEF2F2",color:"#B91C1C",borderRadius:10,padding:"10px 12px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>🗑️ Excluir lista</button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{fontSize:12,color:"#6B7280",fontWeight:700,marginTop:4,lineHeight:1.35}}>
            {activePantry ? `Criada em ${formatPantryDate(activePantry.createdAt)} · ${activePantry.itemCount || countCategoryItems(activePantry.categories)} itens` : "Cadastre os itens que você já possui antes ou depois de criar a lista de compras."}
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:activePantry?"1fr 1fr":"1fr",gap:10,marginTop:12}}>
        {activePantry&&(<button onClick={openPantryViewer} style={{...createSecondaryBtn,background:"#FFFFFF",borderColor:"#BBF7D0",color:"#15803D"}}>Ver lista</button>)}
        <button onClick={activePantry?openPantryEditor:openPantryCreator} style={{...createSecondaryBtn,background:"#FFFFFF",borderColor:"#DDD6FE",color:"#5B21B6",...tourHighlightStyle(isTourStep("create_pantry_action"))}}>{activePantry?"Editar lista":"Criar lista"}</button>
      </div>
    </div>
    {/* ORÇAMENTO */}
    <div style={{...createCard,...tourHighlightStyle(isTourStep("create_budget"))}}>
      <label style={lbl}>Orçamento</label>
      <div>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontWeight:900,color:budgetText?"#6D28D9":"#6B7280",fontSize:15,pointerEvents:"none",transition:"color .25s ease, font-weight .25s ease"}}>R$</span>
          <input value={budgetText} onChange={e=>{setBudgetText(maskBRLInput(e.target.value)); if(!budgetConfirmed)setBudgetConfirmed(true); triggerBudgetSavedPulse();}}
            placeholder="0,00" inputMode="numeric"
            style={inp({paddingLeft:44,width:"100%",height:58,borderColor:budgetText?"#6D28D9":"#E5E7EB",boxShadow:budgetSavedPulse?"0 0 0 4px rgba(109,40,217,0.14)":"none",fontWeight:budgetText?900:500,color:budgetText?"#6D28D9":"#111827",transition:"border-color .25s ease, box-shadow .25s ease, color .25s ease, font-weight .25s ease"})}
            onFocus={e=>e.target.style.borderColor="#6D28D9"} onBlur={e=>e.target.style.borderColor=budgetText?"#6D28D9":"#E5E7EB"}/>
        </div>
        <div style={{fontSize:12,color:budgetText?"#6D28D9":"#9CA3AF",marginTop:7,fontWeight:budgetText?900:500,transition:"color .25s ease, font-weight .25s ease"}}>
          {budgetText ? "Orçamento salvo automaticamente" : "Deixe em branco para não definir limite"}
        </div>
      </div>
    </div>
    {/* NOME DA LISTA */}
    <div style={{...createCard,...tourHighlightStyle(isTourStep("create_name"))}}>
      <label style={lbl}>Nome da lista</label>
      <input value={listName} onChange={e=>{setListName(e.target.value); if(!listNameConfirmed)setListNameConfirmed(true); triggerListNameSavedPulse();}}
        placeholder="Ex: Compras da semana..."
        style={inp({width:"100%",height:58,borderColor:listName?"#6D28D9":"#E5E7EB",boxShadow:listNameSavedPulse?"0 0 0 4px rgba(109,40,217,0.14)":"none",fontWeight:listName?900:500,color:listName?"#6D28D9":"#111827",transition:"border-color .25s ease, box-shadow .25s ease, font-weight .25s ease, color .25s ease"})}
        onFocus={e=>e.target.style.borderColor="#6D28D9"} onBlur={e=>e.target.style.borderColor=listName?"#6D28D9":"#E5E7EB"}/>
      <div style={{fontSize:12,color:listName?"#6D28D9":"#9CA3AF",marginTop:7,fontWeight:listName?900:500,transition:"color .25s ease, font-weight .25s ease"}}>
        {listName ? "Nome salvo automaticamente" : "Você pode alterar o nome quando quiser"}
      </div>
    </div>
    {/* TIPO DE LISTA */}
    <div style={{...createCard,...tourHighlightStyle(isTourStep("create_type"))}}>
      <label style={lbl}>Tipo de lista</label>
      <div style={{position:"relative"}}>
        <select value={listType} onChange={e=>setListType(e.target.value)}
          style={{...inp({height:58,fontSize:16,paddingLeft:18}),appearance:"none",cursor:"pointer",paddingRight:42}}>
          {LIST_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <span style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"#6B7280",fontSize:14}}>▼</span>
      </div>
    </div>
    <div style={{...createCard,...tourHighlightStyle(isTourStep("create_item_input") || isTourStep("create_item_insert") || isTourStep("create_item_paste") || isTourStep("create_item_voice"))}}>
      <label style={lbl}>Adicionar itens</label>
      <div style={{display:"flex",gap:8,marginBottom:8}}>
        <input value={currentInput} onChange={e=>setCurrentInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleAddItem()}
          placeholder="Digite um item da lista"
          style={{...inp({height:56}),...tourHighlightStyle(isTourStep("create_item_input"))}} onFocus={e=>e.target.style.borderColor="#6D28D9"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
        <button onClick={handleAddItem}
          style={{padding:"0 18px",height:56,borderRadius:18,background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",border:"none",color:"white",fontSize:15,fontWeight:900,cursor:"pointer",flexShrink:0,fontFamily:"inherit",whiteSpace:"nowrap",boxShadow:"0 10px 22px rgba(109,40,217,0.22)",...tourHighlightStyle(isTourStep("create_item_insert"))}}>Inserir</button>
      </div>
      <div style={{fontSize:12,color:"#9CA3AF",lineHeight:1.5}}>Digite, cole ou fale a lista. O sistema considera o tipo selecionado para organizar os itens.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
        <button onClick={()=>{setPasteTarget("list");setShowPasteModal(true);}}
          style={{...createSecondaryBtn,borderColor:"#DDD6FE",color:"#5B21B6",background:"#FAF9FF",...tourHighlightStyle(isTourStep("create_item_paste"))}}>
          Colar lista
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
      <div style={{background:"#FFFFFF",borderRadius:20,overflow:"hidden",boxShadow:"0 8px 24px rgba(17,24,39,0.06)",...tourHighlightStyle(isTourStep("create_items_preview"))}}>
        <div style={{padding:"10px 14px",background:"#F9FAFB",borderBottom:"1px solid #E5E7EB",fontSize:12,fontWeight:700,color:"#6B7280",display:"flex",justifyContent:"space-between"}}>
          <span>{pendingItems.length} {pendingItems.length===1?"item":"itens"}</span>
          <button onClick={()=>setPendingItems([])} style={{background:"none",border:"none",color:"#FF4444",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Limpar tudo</button>
        </div>
        {pendingItems.map((item,i)=>{
          const emb=item.embalagem||"";
          return(
            <div key={i} style={{padding:"11px 14px",borderBottom:i<pendingItems.length-1?"1px solid #F0F2F5":"none",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:16}}>🛒</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:14,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {[formatQtyUnit(item.qty,item.unit),item.marca,item.tipo,item.name,emb].filter(Boolean).join(" · ")}
                </div>
              </div>
              <button onClick={()=>editPendingItem(i)}
                style={{background:"#F5F3FF",border:"none",borderRadius:6,padding:"4px 10px",color:"#6D28D9",cursor:"pointer",fontSize:14,marginRight:4}}>✏️</button>
              <button onClick={()=>setPendingItems(prev=>prev.filter((_,j)=>j!==i))}
                style={{background:"#FFE8E8",border:"none",borderRadius:6,padding:"4px 10px",color:"#FF4444",cursor:"pointer",fontSize:14}}>×</button>
            </div>
          );
        })}
      </div>
    )}
    {activePantry && pendingItems.length>0 && !pantryCompared && !editingListId && (
      <div style={{background:"#ECFDF5",border:"1px solid #86EFAC",borderRadius:20,padding:14,color:"#166534",display:"flex",gap:10,alignItems:"flex-start"}}>
        <div style={{fontSize:18}}>✅</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:900,fontSize:14}}>Itens em Casa ativa detectada</div>
          <div style={{fontSize:12,fontWeight:700,lineHeight:1.4,marginTop:3}}>Sua pré-lista pode ser comparada com a Itens em Casa antes de organizar.</div>
        </div>
      </div>
    )}
    <button onClick={(activePantry && pendingItems.length>0 && !pantryCompared)?compareWithActivePantry:organizeList} disabled={loading||pendingItems.length===0}
      style={{...createPrimaryBtn,background:(activePantry && pendingItems.length>0 && !pantryCompared)?"linear-gradient(135deg,#16A34A,#22C55E)":"linear-gradient(135deg,#6D28D9,#8B5CF6)",boxShadow:(loading||pendingItems.length===0)?"none":"0 16px 34px rgba(109,40,217,0.30)",opacity:(loading||pendingItems.length===0)?0.5:1,cursor:(loading||pendingItems.length===0)?"not-allowed":"pointer",...tourHighlightStyle(isTourStep("create_ai"))}}>
      {(activePantry && pendingItems.length>0 && !pantryCompared)?"Comparar com Itens em Casa":(editingListId?"Salvar alterações":"Organizar lista")} {pendingItems.length>0&&`(${pendingItems.length} ${pendingItems.length===1?"item":"itens"})`}
    </button>
  </div>
</div>
  );
}
