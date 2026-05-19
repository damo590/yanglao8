const crypto = require("node:crypto");

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function createProfileId() {
  return `yp_${crypto.randomBytes(7).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14)}`;
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
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
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

module.exports = async function handler(request, response) {
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
        `parent_profiles?select=profile_id,answers,result,action_list,created_at,updated_at&profile_id=eq.${encodeURIComponent(profileId)}&limit=1`
      );
      if (!Array.isArray(rows) || !rows.length) {
        json(response, 404, { ok: false, error: "profile_not_found" });
        return;
      }
      json(response, 200, { ok: true, profile: rows[0] });
    } catch (error) {
      json(response, error.status || 500, { ok: false, error: error.message || "profile_read_failed" });
    }
    return;
  }

  if (request.method === "POST") {
    try {
      const payload = normalizeProfilePayload(await readBody(request));
      const rows = await supabaseFetch("parent_profiles?on_conflict=profile_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(payload)
      });
      const saved = Array.isArray(rows) && rows[0] ? rows[0] : payload;
      json(response, 200, { ok: true, profile_id: saved.profile_id, profile: saved });
    } catch (error) {
      json(response, error.status || 500, { ok: false, error: error.message || "profile_write_failed" });
    }
    return;
  }

  json(response, 405, { ok: false, error: "method_not_allowed" });
};

module.exports.__test = {
  createProfileId,
  normalizeProfileId,
  normalizeProfilePayload
};
