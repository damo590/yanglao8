const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-v4-flash";

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function cleanText(value, max = 500) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function compactPolicy(policy) {
  const item = normalizeObject(policy);
  return {
    title: cleanText(item.userTitle || item.title || item.officialTitle, 120),
    benefit: cleanText(item.benefit, 220),
    suitable_for: cleanText(item.suitableFor || item.suitable_for, 220),
    status: cleanText(item.status, 80),
    region: cleanText(item.regionLabel || item.region, 80),
    materials: normalizeArray(item.materialsRequired || item.materials || item.materials_required)
      .slice(0, 8)
      .map((value) => cleanText(value, 80)),
    steps: normalizeArray(item.applicationSteps || item.steps || item.application_steps)
      .slice(0, 8)
      .map((value) => cleanText(value, 100)),
    official_source: cleanText(item.officialSourceUrl || item.official_source_url, 240)
  };
}

function compactPolicyQuery(body) {
  const payload = normalizeObject(body);
  return {
    region: cleanText(payload.region, 60),
    category: cleanText(payload.category, 60),
    keyword: cleanText(payload.keyword || payload.query, 220),
    policies: normalizeArray(payload.policies)
      .slice(0, 6)
      .map(compactPolicy)
      .filter((policy) => policy.title || policy.benefit)
  };
}

function withPolicyMatchStatus(query) {
  return {
    ...query,
    local_policy_status: query.policies.length ? "matched_candidates" : "no_local_match"
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

function normalizePolicyAdvice(value) {
  const advice = normalizeObject(value);
  return {
    summary: cleanText(advice.summary, 220),
    likely_matches: normalizeArray(advice.likely_matches).slice(0, 5).map((item) => cleanText(item, 120)),
    priority_actions: normalizeArray(advice.priority_actions).slice(0, 5).map((item) => cleanText(item, 120)),
    materials_to_prepare: normalizeArray(advice.materials_to_prepare).slice(0, 8).map((item) => cleanText(item, 80)),
    verification_questions: normalizeArray(advice.verification_questions).slice(0, 5).map((item) => cleanText(item, 120)),
    risk_notice: cleanText(advice.risk_notice, 180) || "仅作政策信息整理和初步匹配，不代表政府部门最终审核结果，请以当地主管部门最新规定为准。"
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
    const query = compactPolicyQuery(await readBody(request));
    if (!query.region && !query.keyword && !query.policies.length) {
      json(response, 400, { ok: false, error: "missing_policy_query" });
      return;
    }
    const queryForModel = withPolicyMatchStatus(query);

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
        temperature: 0.2,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content: [
              "你是养老8的养老政策查询助手。",
              "你不会联网搜索，也不要声称已经查询实时网页；直接基于模型已知的养老政策常识、用户问题、地区、类型和传入的候选政策作答。",
              "用户输入的 keyword 可能是完整问题，不只是关键词；优先直接回答用户真正想问的问题。",
              "如果 local_policy_status 是 matched_candidates，请结合候选政策回答，并说明哪些信息来自候选政策。",
              "如果 local_policy_status 是 no_local_match，也要直接给出可理解的通用解答、可能相关方向、下一步行动和材料建议；不要只回复“去查询”。",
              "涉及金额、资格、地区差异或办理时效时，用“通常/可能/需以当地窗口确认为准”表达，不要把不确定信息说成确定结论。",
              "不承诺用户一定符合条件，不替代政府部门审核。",
              "输出必须是 JSON，不要 Markdown，不要多余解释。",
              "字段：summary, likely_matches, priority_actions, materials_to_prepare, verification_questions, risk_notice。",
              "likely_matches/priority_actions/materials_to_prepare/verification_questions 都是字符串数组。"
            ].join("")
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "直接回答用户的养老政策问题，并生成用户能看懂的查询结果、可能相关政策方向、优先行动、材料清单和需要向社区或主管部门确认的问题。",
              query: queryForModel
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
    const advice = normalizePolicyAdvice(parseJsonContent(content));
    json(response, 200, { ok: true, advice, model: DEEPSEEK_MODEL });
  } catch (error) {
    json(response, 500, { ok: false, error: "policy_query_failed" });
  }
}

export default handler;

export const __test = {
  compactPolicyQuery,
  withPolicyMatchStatus,
  normalizePolicyAdvice,
  parseJsonContent
};
