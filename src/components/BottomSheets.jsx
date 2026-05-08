import ModalSheet from "./ModalSheet";

/**
 * Agrupador visual para futuras folhas inferiores do app.
 *
 * Esta primeira versão é intencionalmente conservadora: mantém a API simples
 * e evita alterar regras de negócio sensíveis no App.jsx. Nas próximas etapas,
 * os modais específicos podem ser movidos para cá gradualmente.
 */
export default function BottomSheets({ children }) {
  return <>{children}</>;
}

export function AppBottomSheet({ open, title, onClose, children, maxHeight = "86vh" }) {
  if (!open) return null;

  return (
    <ModalSheet title={title} onClose={onClose} maxHeight={maxHeight}>
      {children}
    </ModalSheet>
  );
}
