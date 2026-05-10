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
  const diff =
    budgetDiff == null ? Number(budget || 0) - Number(fullTotal || 0) : Number(budgetDiff || 0);
  const isOver = hasBudget && diff < 0;
  const nearLimit = hasBudget && !isOver && safePct >= 85;

  const barFill = isOver
    ? 'linear-gradient(90deg, #FB7185, #F43F5E)'
    : nearLimit
    ? 'linear-gradient(90deg, #FCD34D, #FB923C)'
    : `linear-gradient(90deg, ${progressColor}, #A7F3D0)`;

  const diffColor = isOver ? '#FECACA' : '#BBF7D0';
  const diffGlow = isOver
    ? '0 0 18px rgba(244, 63, 94, 0.45)'
    : '0 0 16px rgba(52, 211, 153, 0.35)';

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.10))',
        border: '1px solid rgba(255,255,255,0.24)',
        borderRadius: 22,
        padding: '14px 16px 15px',
        backdropFilter: 'blur(14px) saturate(160%)',
        WebkitBackdropFilter: 'blur(14px) saturate(160%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 24px -12px rgba(15,23,42,0.35)',
        transition: 'background 220ms ease, border-color 220ms ease, transform 200ms ease',
        ...(highlighted
          ? {
              border: '3px solid rgba(255,255,255,0.98)',
              background: 'rgba(255,255,255,0.22)',
            }
          : {}),
        ...highlightStyle,
      }}
    >
      {/* decorative sheen */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 70% at 0% 0%, rgba(255,255,255,0.18), transparent 55%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative' }}>
        {/* Linha superior: total atual + orçamento */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.72)',
                marginBottom: 2,
              }}
            >
              Total atual
            </div>
            <div
              style={{
                fontWeight: 900,
                fontSize: 20,
                color: 'white',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                textShadow: '0 2px 10px rgba(0,0,0,0.18)',
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {fmtR(fullTotal)}
            </div>
          </div>

          {hasBudget && (
            <div style={{ textAlign: 'right', minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.62)',
                  marginBottom: 2,
                }}
              >
                Orçamento
              </div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.92)',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                }}
              >
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
          style={{
            position: 'relative',
            height: 12,
            background: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 999,
            overflow: 'hidden',
            marginBottom: 10,
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.18)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${safePct}%`,
              background: barFill,
              borderRadius: 999,
              transition:
                'width 0.7s cubic-bezier(0.22,1,0.36,1), background 0.6s ease',
              boxShadow:
                'inset 0 -1px 0 rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.45), 0 0 12px rgba(255,255,255,0.25)',
            }}
          />
          {/* highlight shine */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.28), transparent)',
              pointerEvents: 'none',
              borderRadius: '999px 999px 0 0',
            }}
          />
        </div>

        {/* Rodapé: saldo / status */}
        <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
          {hasBudget ? (
            <>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 999,
                  background: isOver
                    ? 'rgba(244, 63, 94, 0.22)'
                    : 'rgba(16, 185, 129, 0.22)',
                  border: `1px solid ${
                    isOver ? 'rgba(254,202,202,0.55)' : 'rgba(187,247,208,0.45)'
                  }`,
                  color: diffColor,
                  fontSize: 13.5,
                  fontWeight: 900,
                  letterSpacing: '-0.01em',
                  fontVariantNumeric: 'tabular-nums',
                  boxShadow: diffGlow,
                }}
              >
                <span aria-hidden style={{ fontSize: 14 }}>
                  {isOver ? '⚠️' : '✓'}
                </span>
                {isOver
                  ? `Ultrapassado: ${fmtR(Math.abs(diff))}`
                  : `Saldo: ${fmtR(diff)}`}
              </div>
              <div
                style={{
                  color: 'rgba(255,255,255,0.82)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  marginTop: 6,
                  letterSpacing: 0.2,
                }}
              >
                {budgetPctLabel}% do orçamento utilizado
              </div>
            </>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 12px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.20)',
                color: 'rgba(255,255,255,0.92)',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 0.2,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>
                {checkedItems}/{totalItems} itens
              </span>
              <span aria-hidden style={{ opacity: 0.5 }}>
                •
              </span>
              <span>{budgetPctLabel}% concluído</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
