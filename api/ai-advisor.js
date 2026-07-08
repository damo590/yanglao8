const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-v4-flash";

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value, max = 500) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

function compactProfile(body) {
  const result = normalizeObject(body.result);
  const answers = normalizeObject(body.answers);
  return {
    profile_id: cleanText(body.profile_id || result.profile_id, 80),
    type: cleanText(result.type, 120),
    priorities: normalizeArray(result.priorities || result.topTags).slice(0, 8).map((item) => cleanText(item, 80)),
    week_actions: normalizeArray(result.weekActions || body.actionList || body.action_list).slice(0, 8).map((item) => cleanText(item, 120)),
    recommended_directions: normalizeArray(result.recommendedDirections).slice(0, 8).map((item) => cleanText(item, 120)),
    city: cleanText(answers.city || answers.care_city || body.city, 80),
    district: cleanText(answers.district || answers.care_district || body.district, 80),
    concern_type: cleanText(body.concern_type || answers.concern_type, 80),
    answers
  };
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

function parseJsonContent(content) {
  const text = String(content || "").trim();
  try {
    return JSON.parse(text);
  } catch (error) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw error;
  }
}

function normalizeAdvisor(value) {
  const advisor = normalizeObject(value);
  return {
    summary: cleanText(advisor.summary, 180),
    week_actions: normalizeArray(advisor.week_actions).slice(0, 5).map((item) => cleanText(item, 120)),
    product_directions: normalizeArray(advisor.product_directions).slice(0, 5).map((item) => cleanText(item, 120)),
    policy_directions: normalizeArray(advisor.policy_directions).slice(0, 5).map((item) => cleanText(item, 120)),
    next_step: cleanText(advisor.next_step, 180),
    family_message: cleanText(advisor.family_message, 240),
    disclaimer: cleanText(advisor.disclaimer, 180) || "仅作养老行动优先级参考，不构成医疗诊断或政策承诺。"
  };
}

async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "POST") {
    json(response, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    json(response, 503, { ok: false, error: "deepseek_not_configured" });
    return;
  }
  if (!apiKey.startsWith("sk-")) {
    json(response, 401, { ok: false, error: "deepseek_key_invalid_format" });
    return;
  }

  try {
    const profile = compactProfile(await readBody(request));
    if (!profile.type && !profile.priorities.length && !Object.keys(profile.answers).length) {
      json(response, 400, { ok: false, error: "missing_profile" });
      return;
    }

    const upstream = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content: [
              "你是养老8的家庭养老行动顾问。",
              "你只给行动优先级建议，不做医疗诊断，不承诺政策资格，不夸大风险。",
              "输出必须是 JSON，不要 Markdown，不要多余解释。",
              "字段：summary, week_actions, product_directions, policy_directions, next_step, family_message, disclaimer。",
              "week_actions/product_directions/policy_directions 都是字符串数组，每组 3 条以内。"
            ].join("")
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "根据父母养老画像，生成本周行动清单、用品方向、政策服务方向和给家人的转发摘要。",
              profile
            })
          }
        ]
      })
    });

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      const upstreamMessage = data && (data.error && (data.error.message || data.error) || data.message);
      const error = upstream.status === 401 ? "deepseek_auth_failed" : "deepseek_request_failed";
      json(response, upstream.status, { ok: false, error, message: cleanText(upstreamMessage, 160) });
      return;
    }

    const content = data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "";
    const advisor = normalizeAdvisor(parseJsonContent(content));
    json(response, 200, { ok: true, advisor, model: DEEPSEEK_MODEL });
  } catch (error) {
    json(response, 500, { ok: false, error: "ai_advisor_failed" });
  }
}

export default handler;

export const __test = {
  compactProfile,
  normalizeAdvisor,
  parseJsonContent
};
