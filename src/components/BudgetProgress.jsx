export default function BudgetProgress({
  checkedItems = 0,
  totalItems = 0,
  fullTotal = 0,
  budget = 0,
  budgetDiff = null,
  budgetPctLabel = 0,
  progressColor = '#34D399',
  pct = 0,
  fmtR = (value) => String(value ?? ''),
  highlighted = false,
  highlightStyle = {},
  listThemeColor = null, // cor principal do tipo de lista (ex: "#EA580C" para Eventos)
}) {
  const safePct = Number.isFinite(Number(pct)) ? Math.max(0, Math.min(100, Number(pct))) : 0;
  const hasBudget = Number(budget || 0) > 0;
  const diff =
    budgetDiff == null ? Number(budget || 0) - Number(fullTotal || 0) : Number(budgetDiff || 0);
  const isOver = hasBudget && diff < 0;
  const nearLimit = hasBudget && !isOver && safePct >= 85;

  // Barra: vermelho se estourou, laranja se perto do limite, ou cor do tema da lista
  const barFill = isOver
    ? 'linear-gradient(90deg, #FB7185, #F43F5E)'
    : nearLimit
    ? 'linear-gradient(90deg, #FCD34D, #FB923C)'
    : listThemeColor
    ? `linear-gradient(90deg, ${listThemeColor}CC, ${listThemeColor}66)`
    : `linear-gradient(90deg, ${progressColor}, #A7F3D0)`;

  const diffColor = isOver ? '#FECACA' : '#BBF7D0';
  const diffGlow = isOver
    ? '0 0 18px rgba(244,63,94,0.45)'
    : '0 0 16px rgba(52,211,153,0.35)';

  return (
    <div
      data-tour-step={highlighted ? "list_progress" : undefined}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background:
          'linear-gradient(165deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.14) 45%, rgba(255,255,255,0.08) 100%)',
        border: '1px solid rgba(255,255,255,0.28)',
        borderRadius: 24,
        padding: '16px 18px 17px',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -1px 0 rgba(0,0,0,0.10), 0 18px 36px -16px rgba(15,23,42,0.50), 0 4px 10px -4px rgba(15,23,42,0.25)',
        transition: 'background 220ms ease, border-color 220ms ease, transform 200ms ease, box-shadow 220ms ease',
        ...(highlighted ? { border:'3px solid rgba(255,255,255,0.98)', background:'rgba(255,255,255,0.22)' } : {}),
        ...highlightStyle,
      }}
    >
      {/* decorative sheens */}
      <div aria-hidden style={{ position:'absolute', inset:0, background:'radial-gradient(120% 70% at 0% 0%, rgba(255,255,255,0.22), transparent 55%), radial-gradient(80% 50% at 100% 100%, rgba(255,255,255,0.08), transparent 60%)', pointerEvents:'none' }}/>
      <div aria-hidden style={{ position:'absolute', left:18, right:18, top:0, height:1, background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)', pointerEvents:'none' }}/>

      <div style={{ position:'relative' }}>
        {/* Linha superior: total atual + orçamento */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:10, marginBottom:12 }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:9.5, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(255,255,255,0.74)', marginBottom:3 }}>
              Total atual
            </div>
            <div style={{ fontWeight:900, fontSize:22, color:'white', letterSpacing:'-0.025em', fontVariantNumeric:'tabular-nums', textShadow:'0 2px 12px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.18)', lineHeight:1.05, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {fmtR(fullTotal)}
            </div>
          </div>
          {hasBudget && (
            <div style={{ textAlign:'right', minWidth:0 }}>
              <div style={{ fontSize:9.5, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(255,255,255,0.62)', marginBottom:3 }}>
                Orçamento
              </div>
              <div style={{ fontWeight:800, fontSize:15.5, color:'rgba(255,255,255,0.94)', fontVariantNumeric:'tabular-nums', lineHeight:1.05, whiteSpace:'nowrap', textShadow:'0 1px 6px rgba(0,0,0,0.18)' }}>
                {fmtR(budget)}
              </div>
            </div>
          )}
        </div>

        {/* Barra de progresso */}
        <div
          role="progressbar"
          aria-valuenow={safePct}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ position:'relative', height:14, background:'rgba(255,255,255,0.16)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:999, overflow:'hidden', marginBottom:12, boxShadow:'inset 0 2px 4px rgba(0,0,0,0.28), inset 0 -1px 0 rgba(255,255,255,0.10)' }}
        >
          <div style={{ position:'relative', height:'100%', width:`${safePct}%`, background:barFill, borderRadius:999, transition:'width 0.7s cubic-bezier(0.22,1,0.36,1), background 0.6s ease', boxShadow:'inset 0 -2px 2px rgba(0,0,0,0.18), inset 0 1.5px 0 rgba(255,255,255,0.55), 0 0 14px rgba(255,255,255,0.30)' }}>
            <div aria-hidden style={{ position:'absolute', inset:0, borderRadius:999, background:'linear-gradient(180deg, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.10) 45%, transparent 100%)', pointerEvents:'none' }}/>
          </div>
          {/* barra pisca quando perto do limite */}
          {nearLimit && !isOver && (
            <div aria-hidden style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, transparent 55%, rgba(255,255,255,0.28) 80%, transparent)', animation:'tnlBarShine 1.8s ease-in-out infinite', pointerEvents:'none' }}/>
          )}
          {/* highlight shine */}
          <div aria-hidden style={{ position:'absolute', top:0, left:0, right:0, height:'55%', background:'linear-gradient(180deg, rgba(255,255,255,0.32), transparent)', pointerEvents:'none', borderRadius:'999px 999px 0 0' }}/>
        </div>

        {/* Alertas graduais por faixa de orçamento */}
        {hasBudget && nearLimit && !isOver && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, padding:'8px 12px', borderRadius:14, background:'linear-gradient(180deg, rgba(251,146,60,0.24), rgba(251,146,60,0.14))', border:'1px solid rgba(251,146,60,0.42)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 14px -6px rgba(234,88,12,0.45)' }}>
            <span style={{ fontSize:14, filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}>⚠️</span>
            <span style={{ fontSize:11, fontWeight:800, color:'#FED7AA', letterSpacing:0.25, textShadow:'0 1px 2px rgba(0,0,0,0.20)' }}>
              {safePct >= 95 ? 'Orçamento quase esgotado!' : 'Atenção: mais de 85% do orçamento utilizado'}
            </span>
          </div>
        )}

        {/* Rodapé: saldo / status */}
        <div style={{ textAlign:'center', lineHeight:1.3 }}>
          {hasBudget ? (
            <>
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'6px 14px', borderRadius:999, background:isOver?'linear-gradient(180deg, rgba(244,63,94,0.30), rgba(244,63,94,0.18))':'linear-gradient(180deg, rgba(16,185,129,0.30), rgba(16,185,129,0.18))', border:`1px solid ${isOver?'rgba(254,202,202,0.65)':'rgba(187,247,208,0.55)'}`, color:diffColor, fontSize:13.5, fontWeight:900, letterSpacing:'-0.01em', fontVariantNumeric:'tabular-nums', boxShadow:`${diffGlow}, inset 0 1px 0 rgba(255,255,255,0.25)`, backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)' }}>
                <span aria-hidden style={{ fontSize:14, filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.25))' }}>{isOver?'⚠️':'✓'}</span>
                {isOver ? `Ultrapassado: ${fmtR(Math.abs(diff))}` : `Saldo: ${fmtR(diff)}`}
              </div>
              <div style={{ color:'rgba(255,255,255,0.84)', fontSize:11, fontWeight:700, marginTop:7, letterSpacing:'0.06em', textTransform:'uppercase', fontVariantNumeric:'tabular-nums' }}>
                {budgetPctLabel}% do orçamento utilizado
              </div>
            </>
          ) : (
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:999, background:'linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.10))', border:'1px solid rgba(255,255,255,0.26)', color:'rgba(255,255,255,0.95)', fontSize:12, fontWeight:800, letterSpacing:0.3, fontVariantNumeric:'tabular-nums', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.24), 0 4px 10px -4px rgba(0,0,0,0.25)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)' }}>
              <span>{checkedItems}/{totalItems} itens</span>
              <span aria-hidden style={{ opacity:0.5 }}>•</span>
              <span>{budgetPctLabel}% concluído</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes tnlBarShine {
          0% { opacity:0.35; transform: translateX(-30%); }
          50% { opacity:1; transform: translateX(0%); }
          100% { opacity:0.35; transform: translateX(30%); }
        }
      `}</style>
    </div>
  );
}
