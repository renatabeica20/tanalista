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
}) {
  const safePct = Number.isFinite(Number(pct)) ? Math.max(0, Math.min(100, Number(pct))) : 0;
  const hasBudget = Number(budget || 0) > 0;
  const diff = budgetDiff == null ? Number(budget || 0) - Number(fullTotal || 0) : Number(budgetDiff || 0);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.16)',
        border: '1px solid rgba(255,255,255,0.22)',
        borderRadius: 22,
        padding: '13px 14px',
        backdropFilter: 'blur(10px)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
        ...(highlighted
          ? { border: '3px solid rgba(255,255,255,0.98)', background: 'rgba(255,255,255,0.18)' }
          : {}),
        ...highlightStyle,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: 'white' }}>{fmtR(fullTotal)}</span>
        {hasBudget && (
          <span style={{ fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>{fmtR(budget)}</span>
        )}
      </div>

      <div style={{ height: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
        <div
          style={{
            height: '100%',
            background: progressColor,
            borderRadius: 5,
            width: `${safePct}%`,
            transition: 'width 0.45s ease, background 0.6s',
          }}
        />
      </div>

      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 900, lineHeight: 1.35 }}>
        {hasBudget ? (
          <>
            <div style={{ color: diff < 0 ? '#FECACA' : '#BBF7D0', fontSize: 15 }}>
              {diff < 0 ? `⚠️ Ultrapassado: ${fmtR(Math.abs(diff))}` : `Saldo disponível: ${fmtR(diff)}`}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 2 }}>
              {budgetPctLabel}% do orçamento utilizado
            </div>
          </>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
            {checkedItems}/{totalItems} itens · {budgetPctLabel}% concluído
          </span>
        )}
      </div>
    </div>
  );
}
