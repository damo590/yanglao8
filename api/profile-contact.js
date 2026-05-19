function json(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function normalizeProfileId(value) {
  const id = String(value || "").trim().toLowerCase();
  return /^yp_[a-z0-9]{6,24}$/.test(id) ? id : "";
}

function cleanText(value, max = 120) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

function normalizeContactPayload(body) {
  return {
    profile_id: normalizeProfileId(body.profile_id),
    name: cleanText(body.name, 40),
    phone_or_wechat: cleanText(body.phone_or_wechat, 80),
    city: cleanText(body.city, 60),
    note: cleanText(body.note, 300)
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

  if (request.method !== "POST") {
    json(response, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  try {
    const payload = normalizeContactPayload(await readBody(request));
    if (!payload.profile_id) {
      json(response, 400, { ok: false, error: "invalid_profile_id" });
      return;
    }
    if (!payload.name || !payload.phone_or_wechat || !payload.city) {
      json(response, 400, { ok: false, error: "missing_required_fields" });
      return;
    }
    const rows = await supabaseFetch("profile_contacts", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload)
    });
    json(response, 200, { ok: true, contact: Array.isArray(rows) ? rows[0] : payload });
  } catch (error) {
    json(response, error.status || 500, { ok: false, error: error.message || "contact_write_failed" });
  }
};

module.exports.__test = {
  normalizeProfileId,
  normalizeContactPayload
};
