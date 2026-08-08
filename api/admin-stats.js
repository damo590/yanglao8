import crypto from "node:crypto";

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function safeEqual(value, expected) {
  const left = Buffer.from(String(value || ""));
  const right = Buffer.from(String(expected || ""));
  return left.length > 0 && left.length === right.length && crypto.timingSafeEqual(left, right);
}

function config() {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminToken = process.env.ADMIN_DASHBOARD_TOKEN;
  return url && key && adminToken ? { url, key, adminToken } : null;
}

async function countRows(settings, table, filter = "") {
  const response = await fetch(`${settings.url}/rest/v1/${table}?select=id${filter}`, {
    method: "HEAD",
    headers: {
      apikey: settings.key,
      Authorization: `Bearer ${settings.key}`,
      Prefer: "count=exact"
    }
  });
  if (!response.ok) throw new Error("supabase_count_failed");
  const range = response.headers.get("content-range") || "0/0";
  const total = Number(range.split("/").pop());
  return Number.isFinite(total) ? total : 0;
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    json(response, 405, { ok: false, error: "method_not_allowed" });
    return;
  }
  const settings = config();
  if (!settings) {
    json(response, 503, { ok: false, error: "admin_stats_not_configured" });
    return;
  }
  const supplied = request.headers && (request.headers["x-admin-token"] || request.headers["X-Admin-Token"]);
  if (!safeEqual(supplied, settings.adminToken)) {
    json(response, 401, { ok: false, error: "admin_auth_required" });
    return;
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const [profiles, leads, profiles24h, profiles7d, leads7d] = await Promise.all([
      countRows(settings, "care_needs"),
      countRows(settings, "contacts"),
      countRows(settings, "care_needs", `&created_at=gte.${encodeURIComponent(since24h)}`),
      countRows(settings, "care_needs", `&created_at=gte.${encodeURIComponent(since7d)}`),
      countRows(settings, "contacts", `&created_at=gte.${encodeURIComponent(since7d)}`)
    ]);
    json(response, 200, {
      ok: true,
      generated_at: new Date().toISOString(),
      totals: { profiles, leads },
      recent: { profiles_24h: profiles24h, profiles_7d: profiles7d, leads_7d: leads7d },
      conversion: { lead_per_profile: profiles ? Number((leads / profiles).toFixed(4)) : 0 }
    });
  } catch (error) {
    json(response, 503, { ok: false, error: "admin_stats_unavailable" });
  }
}

export const __test = { safeEqual };
