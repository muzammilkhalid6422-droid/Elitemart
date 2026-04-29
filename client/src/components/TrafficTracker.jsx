import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";

const getVisitorId = () => {
  const existing = localStorage.getItem("visitorId");
  if (existing) return existing;

  const visitorId =
    window.crypto?.randomUUID?.() ||
    `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem("visitorId", visitorId);
  return visitorId;
};

const getUserRole = () => {
  try {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    return user?.role || "guest";
  } catch {
    return "guest";
  }
};

const TrafficTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;

    const timeoutId = window.setTimeout(() => {
      api.post("/traffic/track", {
        visitorId: getVisitorId(),
        path: `${location.pathname}${location.search}`,
        role: getUserRole(),
        referrer: document.referrer,
      }).catch(() => {});
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, location.search]);

  return null;
};

export default TrafficTracker;
