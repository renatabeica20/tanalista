import NotificationsScreen from "../pages/NotificationsScreen";

export default function NotificationsPanel({
  notifications = [],
  onBack,
  onMarkAllRead,
}) {
  return (
    <NotificationsScreen
      notifications={notifications}
      onBack={onBack}
      onMarkAllRead={onMarkAllRead}
    />
  );
}
