
import { useEffect, useMemo, useRef } from "react";

function buildScreenName({ screen, showPriceStatsScreen, showNotificationsScreen, showGuidedTour }) {
  if (showGuidedTour) return "guided_tour";
  if (showNotificationsScreen) return "notifications";
  if (showPriceStatsScreen) return "price_stats";
  return screen || "home";
}

export default function AnalyticsController({
  screen,
  currentList,
  showPriceStatsScreen = false,
  showNotificationsScreen = false,
  showGuidedTour = false,
  userName = "",
  registerEvent,
}) {
  const lastScreenRef = useRef("");

  const screenName = useMemo(
    () => buildScreenName({ screen, showPriceStatsScreen, showNotificationsScreen, showGuidedTour }),
    [screen, showPriceStatsScreen, showNotificationsScreen, showGuidedTour]
  );

  useEffect(() => {
    if (typeof registerEvent !== "function") return;
    if (!screenName || lastScreenRef.current === screenName) return;

    lastScreenRef.current = screenName;

    registerEvent("screen_view", {
      screen: screenName,
      user_name: userName || "",
      list_id: currentList?.id || "",
      list_name: currentList?.name || "",
      list_type: currentList?.type || "",
    });
  }, [screenName, currentList?.id, currentList?.name, currentList?.type, userName, registerEvent]);

  return null;
}
