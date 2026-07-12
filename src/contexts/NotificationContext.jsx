import { createContext, useContext, useState, useCallback, useRef } from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const idRef = useRef(0);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((type, message, timeout = 2000) => {
    const id = ++idRef.current;
    const notif = { id, type, message };
    setNotifications((prev) => {
      const next = [notif, ...prev];
      if (next.length > 3) next.length = 3;
      return next;
    });
    if (timeout > 0) {
      setTimeout(() => removeNotification(id), timeout);
    }
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
}
