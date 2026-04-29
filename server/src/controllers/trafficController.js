const { trafficStore } = require("../db/datastores");

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date = new Date()) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const formatDayKey = (date) => date.toISOString().slice(0, 10);

const normalizePath = (value = "/") => {
  const path = String(value || "/").trim();
  return path.startsWith("/") ? path.slice(0, 180) : `/${path}`.slice(0, 180);
};

const trackVisit = async (req, res) => {
  try {
    const visitorId = String(req.body?.visitorId || "").trim().slice(0, 120);
    const path = normalizePath(req.body?.path);
    const role = String(req.body?.role || "guest").trim().slice(0, 30);

    if (!visitorId) {
      return res.status(400).json({
        message: "Visitor ID is required",
      });
    }

    await trafficStore.insert({
      visitorId,
      path,
      role,
      referrer: String(req.body?.referrer || "").slice(0, 240),
      userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
      ip: req.ip,
    });

    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Track traffic error:", error);
    return res.status(500).json({
      message: "Unable to track website traffic",
    });
  }
};

const buildTrafficSummary = async () => {
  const visits = await trafficStore.find({}).sort({ createdAt: -1 });
  const now = new Date();
  const todayStart = startOfDay(now);
  const sevenDaysAgo = new Date(todayStart.getTime() - 6 * DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

  const todayVisits = visits.filter((visit) => new Date(visit.createdAt) >= todayStart);
  const weekVisits = visits.filter((visit) => new Date(visit.createdAt) >= sevenDaysAgo);
  const monthVisits = visits.filter((visit) => new Date(visit.createdAt) >= thirtyDaysAgo);
  const uniqueVisitors = new Set(visits.map((visit) => visit.visitorId).filter(Boolean));
  const todayUniqueVisitors = new Set(todayVisits.map((visit) => visit.visitorId).filter(Boolean));

  const trend = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(sevenDaysAgo.getTime() + index * DAY_MS);
    const key = formatDayKey(date);
    return {
      date: key,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      visits: weekVisits.filter((visit) => formatDayKey(new Date(visit.createdAt)) === key).length,
    };
  });

  const pageCounts = visits.reduce((acc, visit) => {
    const key = visit.path || "/";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topPages = Object.entries(pageCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalVisits: visits.length,
    todayVisits: todayVisits.length,
    weekVisits: weekVisits.length,
    monthVisits: monthVisits.length,
    uniqueVisitors: uniqueVisitors.size,
    todayUniqueVisitors: todayUniqueVisitors.size,
    trend,
    topPages,
    latestVisits: visits.slice(0, 8).map((visit) => ({
      id: visit._id,
      path: visit.path,
      role: visit.role || "guest",
      visitorId: visit.visitorId,
      createdAt: visit.createdAt,
    })),
  };
};

module.exports = {
  buildTrafficSummary,
  trackVisit,
};
