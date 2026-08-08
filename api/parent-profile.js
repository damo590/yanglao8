import crypto from "node:crypto";

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function requestId(request) {
  const headers = request && request.headers;
  if (!headers) return "";
  if (typeof headers.get === "function") return headers.get("x-vercel-id") || "";
  return headers["x-vercel-id"] || headers["X-Vercel-Id"] || "";
}

function logRequest(level, message, request, startedAt, extra = {}) {
  const entry = {
    level,
    message,
    route: "/api/parent-profile",
    method: request && request.method,
    requestId: requestId(request),
    duration_ms: Date.now() - startedAt,
    ...extra
  };
  const writer = level === "error" ? console.error : console.log;
  writer(JSON.stringify(entry));
}

function createProfileId() {
  return `yp_${crypto.randomBytes(7).toString("hex")}`;
}

function normalizeProfileId(value) {
  const id = String(value || "").trim().toLowerCase();
  return /^yp_[a-z0-9]{6,24}$/.test(id) ? id : "";
}

function normalizeJsonObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeJsonArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeProfilePayload(body) {
  return {
    profile_id: normalizeProfileId(body.profile_id) || createProfileId(),
    answers: normalizeJsonObject(body.answers),
    result: normalizeJsonObject(body.result),
    action_list: normalizeJsonArray(body.actionList || body.action_list),
    source: String(body.source || "yanglao8_demo").slice(0, 80)
  };
}

function cleanText(value, max = 120) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

function profilePayloadToCareNeed(payload, userId = null) {
  const result = normalizeJsonObject(payload.result);
  const answers = normalizeJsonObject(payload.answers);
  const priorities = normalizeJsonArray(result.topTags).length
    ? normalizeJsonArray(result.topTags)
    : normalizeJsonArray(result.priorities).slice(0, 6);

  return {
    user_id: userId || null,
    profile_id: payload.profile_id,
    care_city: cleanText(answers.city || answers.care_city || "unknown", 60),
    care_district: cleanText(answers.district || answers.care_district || "", 60) || null,
    service_types: normalizeJsonArray(result.recommendedDirections).slice(0, 8),
    self_care_level: "unknown",
    cognitive_status: "unknown",
    priorities,
    note: cleanText(result.type || payload.source || "", 300) || null,
    status: "submitted",
    answers,
    result,
    action_list: payload.action_list,
    source: payload.source
  };
}

function careNeedToProfile(row) {
  return {
    profile_id: row.profile_id,
    answers: row.answers || {},
    result: row.result || {},
    action_list: Array.isArray(row.action_list) ? row.action_list : [],
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

async function supabaseFetch(path, options = {}) {
  const config = supabaseConfig();
  if (!config) {
    const error = new Error("supabase_not_configured");
    error.status = 503;
    throw error;
  }
  let response;
  try {
    response = await fetch(`${config.url}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  } catch (cause) {
    const error = new Error("supabase_unreachable");
    error.status = 503;
    error.cause = cause;
    throw error;
  }
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = new Error("supabase_request_failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function requestUserId(request) {
  const authHeader = request.headers && (request.headers.authorization || request.headers.Authorization);
  const token = String(authHeader || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const config = supabaseConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data && data.id ? data.id : null;
}

async function readBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  if (typeof request.body === "string") return JSON.parse(request.body || "{}");
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; });
    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

async function handler(request, response) {
  const startedAt = Date.now();
  logRequest("info", "request_started", request, startedAt);
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method === "GET") {
    try {
      const url = new URL(request.url, "http://localhost");
      const profileId = normalizeProfileId(url.searchParams.get("id"));
      if (!profileId) {
        json(response, 400, { ok: false, error: "invalid_profile_id" });
        return;
      }
      const rows = await supabaseFetch(
        `care_needs?select=profile_id,answers,result,action_list,created_at,updated_at&profile_id=eq.${encodeURIComponent(profileId)}&limit=1`
      );
      if (!Array.isArray(rows) || !rows.length) {
        logRequest("info", "request_completed", request, startedAt, { status: 404 });
        json(response, 404, { ok: false, error: "profile_not_found" });
        return;
      }
      logRequest("info", "request_completed", request, startedAt, { status: 200 });
      json(response, 200, { ok: true, profile: careNeedToProfile(rows[0]) });
    } catch (error) {
      logRequest("error", "request_failed", request, startedAt, { error: error.message || "profile_read_failed" });
      json(response, error.status || 500, { ok: false, error: error.message || "profile_read_failed" });
    }
    return;
  }

  if (request.method === "POST") {
    try {
      const payload = normalizeProfilePayload(await readBody(request));
      const userId = await requestUserId(request);
      const rows = await supabaseFetch("care_needs?on_conflict=profile_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(profilePayloadToCareNeed(payload, userId))
      });
      const saved = Array.isArray(rows) && rows[0] ? careNeedToProfile(rows[0]) : payload;
      logRequest("info", "request_completed", request, startedAt, { status: 200 });
      json(response, 200, { ok: true, profile_id: saved.profile_id, profile: saved });
    } catch (error) {
      logRequest("error", "request_failed", request, startedAt, { error: error.message || "profile_write_failed" });
      json(response, error.status || 500, { ok: false, error: error.message || "profile_write_failed" });
    }
    return;
  }

  json(response, 405, { ok: false, error: "method_not_allowed" });
}

export default handler;

export const __test = {
  createProfileId,
  normalizeProfileId,
  normalizeProfilePayload,
  profilePayloadToCareNeed,
  careNeedToProfile,
  requestUserId
};
