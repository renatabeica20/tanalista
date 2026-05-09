import VoiceInput from "./VoiceInput";

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

export default function PantrySection({
  screen,
  setScreen,
  pantryPendingItems,
  setPantryPendingItems,
  resetPantryFlow,
  pantryInput,
  setPantryInput,
  handleAddPantryItem,
  inp,
  lbl,
  createCard,
  createSecondaryBtn,
  createPrimaryBtn,
  setPasteTarget,
  setShowPasteModal,
  voiceTargetRef,
  setVoiceTarget,
  startVoiceInput,
  voiceProcessing,
  voiceListening,
  tourHighlightStyle,
  isTourStep,
  formatQtyUnit,
  editPantryPendingItem,
  organizePantry,
  loading,
  leavePantryReview,
  pantryReviewReadOnly,
  pantryReviewCategories,
  getCatTheme,
  editPantryReviewItem,
  handleAddPantryReviewItem,
  removePantryReviewItem,
  savePantryFromReview,
  pantryEditingId,
  pantryComparison,
  pendingItems,
  showPantryComparisonDetails,
  setShowPantryComparisonDetails,
  proceedAfterPantryComparison,
}) {
  return (
    <>
{/* ════════════════════════════════════
    DESPENSA: CRIAR / EDITAR
════════════════════════════════════ */}
{screen==="pantry_create"&&(
  <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:"linear-gradient(180deg,#FBFAFF,#FFFFFF)"}}>
    <div style={{background:"#FFFFFF",padding:"16px 20px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #E5E7EB",position:"sticky",top:0,zIndex:100,boxShadow:"0 8px 24px rgba(17,24,39,0.06)"}}>
      {pantryPendingItems.length===0 ? (
        <button onClick={()=>{resetPantryFlow();setScreen("create");}} style={{width:40,height:40,borderRadius:"50%",background:"#EEF2FF",border:"1px solid #C7D2FE",cursor:"pointer",fontSize:20,color:"#4C1D95",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 18px rgba(76,29,149,0.12)"}}>←</button>
      ) : <div style={{width:40}} />}
      <div style={{flex:1,textAlign:"center"}}>
        <div style={{fontWeight:900,fontSize:18,color:"#111827",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>Itens em Casa <HelpIcon text="Adicione aqui os itens que você já tem em casa. Depois organize e salve para usar na comparação com sua lista de compras." /></div>
        <div style={{fontSize:12,color:"#6B7280",fontWeight:700}}>Itens que você já tem em casa</div>
      </div>
      <div style={{width:36}} />
    </div>
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:14,paddingBottom:42}}>
      <div style={createCard}>
        <label style={lbl}>Adicionar itens em casa</label>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input value={pantryInput} onChange={e=>setPantryInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddPantryItem()} placeholder="Digite um item que você já tem em casa" style={inp({height:56})}/>
          <button onClick={handleAddPantryItem} style={{padding:"0 18px",height:56,borderRadius:18,background:"linear-gradient(135deg,#6D28D9,#8B5CF6)",border:"none",color:"white",fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",boxShadow:"0 10px 22px rgba(109,40,217,0.22)",...tourHighlightStyle(isTourStep("create_item_insert"))}}>Inserir</button>
        </div>
        <div style={{fontSize:12,color:"#9CA3AF",lineHeight:1.5}}>Digite, cole ou fale os itens existentes em casa. Você poderá editar antes de salvar.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
          <button onClick={()=>{setPasteTarget("pantry");setShowPasteModal(true);}} style={{...createSecondaryBtn,borderColor:"#DDD6FE",color:"#5B21B6",background:"#FAF9FF"}}>Colar lista</button>
          <VoiceInput
            target="pantry"
            voiceTargetRef={voiceTargetRef}
            setVoiceTarget={setVoiceTarget}
            startVoiceInput={startVoiceInput}
            voiceProcessing={voiceProcessing}
            voiceListening={voiceListening}
            baseStyle={createSecondaryBtn}
          />
        </div>
      </div>
      {pantryPendingItems.length>0&&(
        <div style={{background:"#FFFFFF",borderRadius:20,overflow:"hidden",boxShadow:"0 8px 24px rgba(17,24,39,0.06)",...tourHighlightStyle(isTourStep("create_items_preview"))}}>
          <div style={{padding:"10px 14px",background:"#F9FAFB",borderBottom:"1px solid #E5E7EB",fontSize:12,fontWeight:800,color:"#6B7280",display:"flex",justifyContent:"space-between"}}>
            <span>{pantryPendingItems.length} {pantryPendingItems.length===1?"item inserido":"itens inseridos"}</span>
            <button onClick={()=>setPantryPendingItems([])} style={{background:"none",border:"none",color:"#FF4444",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Limpar tudo</button>
          </div>
          {pantryPendingItems.map((item,i)=>(
            <div key={i} style={{padding:"12px 14px",borderBottom:i<pantryPendingItems.length-1?"1px solid #F0F2F5":"none",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:16}}>🧺</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,fontSize:14,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{formatQtyUnit(item.qty,item.unit)} – {item.name}</div>
                {item.detail&&<div style={{fontSize:12,color:"#6B7280",fontWeight:700}}>{item.detail}</div>}
              </div>
              <button onClick={()=>editPantryPendingItem(i)} style={{background:"#F5F3FF",border:"none",borderRadius:6,padding:"4px 10px",color:"#6D28D9",cursor:"pointer",fontSize:14}}>✏️</button>
              <button onClick={()=>setPantryPendingItems(prev=>prev.filter((_,j)=>j!==i))} style={{background:"#FFE8E8",border:"none",borderRadius:6,padding:"4px 10px",color:"#FF4444",cursor:"pointer",fontSize:14}}>×</button>
            </div>
          ))}
        </div>
      )}
      <button onClick={organizePantry} disabled={loading||pantryPendingItems.length===0} style={{...createPrimaryBtn,opacity:(loading||pantryPendingItems.length===0)?0.5:1,cursor:(loading||pantryPendingItems.length===0)?"not-allowed":"pointer"}}>Organizar Lista {pantryPendingItems.length>0&&`(${pantryPendingItems.length})`}</button>
    </div>
  </div>
)}

{/* DESPENSA: CONFERÊNCIA */}
{screen==="pantry_review"&&(
  <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:"linear-gradient(180deg,#FBFAFF,#FFFFFF)"}}>
    <div style={{background:"#FFFFFF",padding:"16px 20px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #E5E7EB",position:"sticky",top:0,zIndex:100,boxShadow:"0 8px 24px rgba(17,24,39,0.06)"}}>
      <button onClick={leavePantryReview} style={{width:40,height:40,borderRadius:"50%",background:"#EEF2FF",border:"1px solid #C7D2FE",cursor:"pointer",fontSize:20,color:"#4C1D95",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 18px rgba(76,29,149,0.12)"}}>←</button>
      <div style={{flex:1,textAlign:"center"}}>
        <div style={{fontWeight:900,fontSize:18,color:"#111827",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>Itens em Casa <HelpIcon text={pantryReviewReadOnly ? "Visualização dos seus itens em casa. Esta tela não altera a lista." : "Edite, acrescente novos itens e salve antes de voltar."} /></div>
        <div style={{fontSize:12,color:"#6B7280",fontWeight:700}}>Lista organizada por seções, sem preços</div>
      </div>
      <div style={{width:36}} />
    </div>
    <div style={{padding:20,paddingBottom:42,display:"flex",flexDirection:"column",gap:14}}>
      {!pantryReviewReadOnly&&(
        <div style={createCard}>
          <label style={lbl}>Acrescentar novos itens</label>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <input
              value={pantryInput}
              onChange={e=>setPantryInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleAddPantryReviewItem()}
              placeholder="Digite um novo item para os Itens em Casa"
              style={inp({height:56})}
            />
            <button
              onClick={handleAddPantryReviewItem}
              disabled={!pantryInput.trim()}
              style={{
                padding:"0 18px",
                height:56,
                borderRadius:18,
                background:pantryInput.trim()?"linear-gradient(135deg,#6D28D9,#8B5CF6)":"#F0F2F5",
                border:"none",
                color:pantryInput.trim()?"white":"#6B7280",
                fontSize:15,
                fontWeight:900,
                cursor:pantryInput.trim()?"pointer":"not-allowed",
                fontFamily:"inherit",
                whiteSpace:"nowrap",
                boxShadow:pantryInput.trim()?"0 10px 22px rgba(109,40,217,0.22)":"none"
              }}
            >
              Inserir
            </button>
          </div>
          <div style={{fontSize:12,color:"#9CA3AF",lineHeight:1.5}}>Use este campo para acrescentar itens que foram esquecidos. Também é possível colar ou falar vários itens de uma vez.</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
            <button
              onClick={()=>{setPasteTarget("pantryReview");setShowPasteModal(true);}}
              style={{...createSecondaryBtn,borderColor:"#DDD6FE",color:"#5B21B6",background:"#FAF9FF"}}
            >
              Colar lista
            </button>
            <VoiceInput
              target="pantryReview"
              voiceTargetRef={voiceTargetRef}
              setVoiceTarget={setVoiceTarget}
              startVoiceInput={startVoiceInput}
              voiceProcessing={voiceProcessing}
              voiceListening={voiceListening}
              baseStyle={createSecondaryBtn}
            />
          </div>
        </div>
      )}

      {(pantryReviewCategories||[]).map((cat,ci)=>{const th=getCatTheme(cat.name);return(
        <div key={cat.name+ci} style={{border:`2px solid ${th.border}`,borderRadius:22,overflow:"hidden",background:"#FFFFFF",boxShadow:"0 12px 28px rgba(17,24,39,0.06)"}}>
          <div style={{background:th.bg,padding:"13px 16px",display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${th.border}33`}}>
            <span style={{fontSize:20}}>{th.icon}</span>
            <div style={{flex:1,fontWeight:900,color:th.header,fontSize:16}}>{cat.name}</div>
            <div style={{fontSize:12,fontWeight:900,color:th.header}}>{cat.items?.length||0} itens</div>
          </div>
          {(cat.items||[]).map((item,i)=>(
            <div key={i} style={{padding:"12px 16px",borderBottom:i<(cat.items||[]).length-1?"1px solid #F0F2F5":"none",display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:800,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                {item.detail&&<div style={{fontSize:12,color:"#6B7280",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.detail}</div>}
              </div>
              <div style={{fontSize:13,fontWeight:800,color:"#6B7280",whiteSpace:"nowrap"}}>{formatQtyUnit(item.qty,item.unit)}</div>
              {!pantryReviewReadOnly&&(<button onClick={()=>editPantryReviewItem(ci,i)} style={{background:"#F5F3FF",border:"none",borderRadius:8,padding:"5px 9px",color:"#6D28D9",cursor:"pointer",fontSize:13,fontWeight:900}}>✏️</button>)}
              {!pantryReviewReadOnly&&(<button onClick={()=>removePantryReviewItem(ci,i)} style={{background:"#FEF2F2",border:"none",borderRadius:8,padding:"5px 9px",color:"#DC2626",cursor:"pointer",fontSize:13,fontWeight:900}}>×</button>)}
            </div>
          ))}
        </div>
      );})}
      <div style={{background:"#F8FAFC",border:"1px solid #E5E7EB",borderRadius:18,padding:12,fontSize:12,color:"#6B7280",fontWeight:700,lineHeight:1.45}}>Os Itens em Casa servem como base de comparação para evitar compras desnecessárias. A lista fica ativa até ser excluída ou substituída.</div>
      {!pantryReviewReadOnly&&(<button onClick={savePantryFromReview} style={createPrimaryBtn}>{pantryEditingId ? "Salvar Lista" : "Salvar Itens"}</button>)}
    </div>
  </div>
)}

{/* ITENS EM CASA: RESULTADO DA COMPARAÇÃO */}
{screen==="pantry_compare_result"&&(
  <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:"linear-gradient(180deg,#FBFAFF,#FFFFFF)"}}>
    <div style={{background:"#FFFFFF",padding:"16px 20px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #E5E7EB",position:"sticky",top:0,zIndex:100,boxShadow:"0 8px 24px rgba(17,24,39,0.06)"}}>
      <button onClick={()=>setScreen("create")} style={{width:36,height:36,borderRadius:"50%",background:"#F9FAFB",border:"none",cursor:"pointer",fontSize:18,color:"#4A5568",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
      <div style={{flex:1,textAlign:"center"}}>
        <div style={{fontWeight:900,fontSize:18,color:"#111827"}}>Comparação concluída</div>
        <div style={{fontSize:12,color:"#6B7280",fontWeight:700}}>Sua pré-lista foi ajustada</div>
      </div>
      <div style={{width:36}} />
    </div>
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:14}}>
      <div style={{...createCard,textAlign:"center",borderColor:"#BBF7D0",background:"#F0FDF4"}}>
        <div style={{width:68,height:68,borderRadius:"50%",background:"#22C55E",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,fontWeight:900,margin:"0 auto 12px"}}>✓</div>
        <div style={{fontWeight:900,fontSize:18,color:"#166534",marginBottom:6}}>Itens em Casa comparados</div>
        <div style={{fontSize:13,color:"#166534",fontWeight:700,lineHeight:1.45}}>Mantivemos na pré-lista somente o que ainda precisa ser comprado ou complementado.</div>
      </div>
      <div style={createCard}>
        <label style={lbl}>Resumo da comparação</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
          <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:16,padding:10}}><div style={{fontWeight:900,color:"#B91C1C",fontSize:18}}>{pantryComparison?.removed?.length||0}</div><div style={{fontSize:11,color:"#7F1D1D",fontWeight:800}}>removidos</div></div>
          <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:16,padding:10}}><div style={{fontWeight:900,color:"#B45309",fontSize:18}}>{pantryComparison?.adjusted?.length||0}</div><div style={{fontSize:11,color:"#92400E",fontWeight:800}}>ajustados</div></div>
          <div style={{background:"#EEF2FF",border:"1px solid #C7D2FE",borderRadius:16,padding:10}}><div style={{fontWeight:900,color:"#4338CA",fontSize:18}}>{pantryComparison?.items?.length ?? pendingItems.length}</div><div style={{fontSize:11,color:"#3730A3",fontWeight:800}}>na nova pré-lista</div></div>
        </div>
      </div>
      <button onClick={()=>setShowPantryComparisonDetails(v=>!v)} style={{...createSecondaryBtn,borderColor:"#DDD6FE",color:"#5B21B6",background:"#FAF9FF"}}>
        {showPantryComparisonDetails?"Ocultar detalhes":"Ver o que foi feito"}
      </button>
      {showPantryComparisonDetails&&pantryComparison&&(<div style={createCard}>
        <label style={lbl}>Detalhes da comparação</label>
        {(pantryComparison.removed||[]).length>0&&(<div style={{marginBottom:12}}>
          <div style={{fontWeight:900,color:"#B91C1C",fontSize:13,marginBottom:6}}>Itens removidos porque já estavam na Itens em Casa</div>
          {pantryComparison.removed.map((r,i)=><div key={i} style={{fontSize:13,color:"#374151",fontWeight:700,padding:"7px 0",borderBottom:"1px solid #F3F4F6"}}>• {r.item?.name || r.name} — {r.reason || r.removedReason}</div>)}
        </div>)}
        {(pantryComparison.adjusted||[]).length>0&&(<div style={{marginBottom:12}}>
          <div style={{fontWeight:900,color:"#B45309",fontSize:13,marginBottom:6}}>Itens ajustados ou sinalizados</div>
          {pantryComparison.adjusted.map((r,i)=><div key={i} style={{fontSize:13,color:"#374151",fontWeight:700,padding:"7px 0",borderBottom:"1px solid #F3F4F6"}}>• {r.before?.name || r.name} — {r.after?.pantryNote || r.reason || "ajustado pelos Itens em Casa"}</div>)}
        </div>)}
        {(pantryComparison.kept||[]).length>0&&(<div>
          <div style={{fontWeight:900,color:"#166534",fontSize:13,marginBottom:6}}>Itens mantidos na lista</div>
          {pantryComparison.kept.map((r,i)=><div key={i} style={{fontSize:13,color:"#374151",fontWeight:700,padding:"7px 0",borderBottom:"1px solid #F3F4F6"}}>• {r.name} — não encontrado na Itens em Casa</div>)}
        </div>)}
        <div style={{marginTop:10,fontSize:12,color:"#6B7280",fontWeight:700}}>Visualização apenas informativa. Para alterar, volte à pré-lista.</div>
      </div>)}
      <button onClick={proceedAfterPantryComparison || (()=>setScreen("create"))} style={createPrimaryBtn}>Prosseguir para pré-lista</button>
    </div>
  </div>
)}

    </>
  );
}
