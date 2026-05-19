const { list, put } = require("@vercel/blob");

const BLOB_PATH = "leaderboards/global.json";
const MAX_ENTRIES = 50;
const TIMEZONE = "Asia/Shanghai";

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function getTzParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.filter((item) => item.type !== "literal").map((item) => [item.type, item.value]));
  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day)
  };
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function dayKey(date = new Date()) {
  const { year, month, day } = getTzParts(date);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function monthKey(date = new Date()) {
  const { year, month } = getTzParts(date);
  return `${year}-${pad2(month)}`;
}

function weekKey(date = new Date()) {
  const { year, month, day } = getTzParts(date);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${pad2(weekNo)}`;
}

function normalizeName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  return (name || "玩家").slice(0, 12);
}

function normalizeEntry(entry) {
  return {
    name: normalizeName(entry.name),
    score: Math.max(0, Number(entry.score || 0)),
    acc: Math.max(0, Math.min(100, Number(entry.acc || 0))),
    cost: Math.max(1, Number(entry.cost || 1)),
    ts: Number(entry.ts || Date.now())
  };
}

function defaultState() {
  return {
    version: 1,
    updatedAt: Date.now(),
    day: { key: dayKey(), total: 0, entries: [] },
    week: { key: weekKey(), total: 0, entries: [] },
    month: { key: monthKey(), total: 0, entries: [] }
  };
}

function normalizeState(state) {
  const fresh = defaultState();
  const next = state && typeof state === "object" ? state : {};
  return {
    version: 1,
    updatedAt: Number(next.updatedAt || Date.now()),
    day: {
      key: typeof next.day?.key === "string" ? next.day.key : fresh.day.key,
      total: Math.max(0, Number(next.day?.total ?? (Array.isArray(next.day?.entries) ? next.day.entries.length : 0))),
      entries: Array.isArray(next.day?.entries) ? next.day.entries.map(normalizeEntry) : []
    },
    week: {
      key: typeof next.week?.key === "string" ? next.week.key : fresh.week.key,
      total: Math.max(0, Number(next.week?.total ?? (Array.isArray(next.week?.entries) ? next.week.entries.length : 0))),
      entries: Array.isArray(next.week?.entries) ? next.week.entries.map(normalizeEntry) : []
    },
    month: {
      key: typeof next.month?.key === "string" ? next.month.key : fresh.month.key,
      total: Math.max(0, Number(next.month?.total ?? (Array.isArray(next.month?.entries) ? next.month.entries.length : 0))),
      entries: Array.isArray(next.month?.entries) ? next.month.entries.map(normalizeEntry) : []
    }
  };
}

async function loadState() {
  const { blobs } = await list({ prefix: BLOB_PATH, limit: 10 });
  const match = (blobs || []).find((item) => item.pathname === BLOB_PATH) || (blobs || [])[0];
  if (!match) return defaultState();
  const response = await fetch(match.url, { cache: "no-store" });
  if (!response.ok) return defaultState();
  return normalizeState(await response.json());
}

function upsertScope(scopeState, key, entry) {
  const currentEntries = scopeState.key === key ? scopeState.entries : [];
  const nextTotal = scopeState.key === key ? Math.max(0, Number(scopeState.total || 0)) + 1 : 1;
  const merged = [...currentEntries, entry]
    .map(normalizeEntry)
    .sort((a, b) => b.score - a.score || a.cost - b.cost || a.ts - b.ts)
    .slice(0, MAX_ENTRIES);
  return { key, total: nextTotal, entries: merged };
}

async function saveState(state) {
  await put(BLOB_PATH, JSON.stringify(state), {
    access: "public",
    allowOverwrite: true,
    contentType: "application/json"
  });
}

module.exports = async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method === "GET") {
    try {
      const state = await loadState();
      json(response, 200, { ok: true, leaderboard: state });
    } catch (error) {
      json(response, 500, { ok: false, error: "leaderboard_read_failed" });
    }
    return;
  }

  if (request.method === "POST") {
    try {
      const body = typeof request.body === "string" ? JSON.parse(request.body || "{}") : (request.body || {});
      const entry = normalizeEntry(body);
      const current = normalizeState(await loadState());
      const next = {
        version: 1,
        updatedAt: Date.now(),
        day: upsertScope(current.day, dayKey(), entry),
        week: upsertScope(current.week, weekKey(), entry),
        month: upsertScope(current.month, monthKey(), entry)
      };
      await saveState(next);
      json(response, 200, { ok: true, leaderboard: next });
    } catch (error) {
      json(response, 500, { ok: false, error: "leaderboard_write_failed" });
    }
    return;
  }

  json(response, 405, { ok: false, error: "method_not_allowed" });
};

module.exports.__test = {
  defaultState,
  normalizeState,
  upsertScope
};
