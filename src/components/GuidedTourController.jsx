import GuidedTourOverlay from "./GuidedTourOverlay";

export default function GuidedTourController({
  show,
  step,
  userNameModal,
  index,
  total,
  onNext,
  onPrev,
  onClose,
  onSkip,
  screen,
}) {
  if (!show || !step || userNameModal) return null;

  return (
    <GuidedTourOverlay
      step={step}
      index={index}
      total={total}
      onNext={onNext}
      onPrev={onPrev}
      onClose={onClose}
      onSkip={onSkip}
      showPrev={screen !== "home"}
      showSkip={screen !== "home" && total > 1}
    />
  );
}
