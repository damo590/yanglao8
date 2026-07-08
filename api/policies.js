import { readFile } from "node:fs/promises";

const SELECT_FIELDS = [
  "id",
  "city",
  "name",
  "category",
  "age_min",
  "age_max",
  "care_levels",
  "hukou_type",
  "income_type",
  "amount",
  "amount_monthly",
  "eligibility",
  "materials",
  "apply_channel",
  "apply_url",
  "policy_year",
  "confidence",
  "notes",
  "is_published"
].join(",");

const REGION_TO_CITY = {
  changsha: "长沙",
  beijing: "北京",
  shanghai: "上海",
  xiangyin: "长沙",
  yueyang: "长沙",
  hunan: "长沙"
};

const CITY_TO_REGION = {
  长沙: "changsha",
  北京: "beijing",
  上海: "shanghai"
};

const DB_CATEGORY_TO_UI = {
  高龄津贴: "monthly_money",
  低保相关: "monthly_money",
  残疾人补贴: "monthly_money",
  长护险: "home_care",
  失能补贴: "home_care",
  养老服务补贴: "home_care",
  其他: "community"
};

function json(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
  response.end(JSON.stringify(body));
}

function cleanText(value, max = 300) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
}

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).map((item) => cleanText(item, 160)) : [];
}

function normalizeRegion(value) {
  const region = cleanText(value, 40).toLowerCase();
  return REGION_TO_CITY[region] || cleanText(value, 40);
}

function cityToRegion(city) {
  return CITY_TO_REGION[city] || cleanText(city, 40).toLowerCase() || "all";
}

function stablePolicyId(row) {
  if (row.id) return `subsidy-${String(row.id).replace(/[^a-zA-Z0-9-]/g, "")}`;
  return `subsidy-${Buffer.from(`${row.city || ""}-${row.name || ""}`).toString("base64url").slice(0, 18)}`;
}

function verificationLevel(confidence) {
  if (confidence === "high") return "较高可信";
  if (confidence === "medium") return "需社区确认";
  return "待补充核实";
}

function statusLabel(confidence) {
  if (confidence === "high") return "较高可信";
  if (confidence === "medium") return "待核实";
  return "待补充";
}

function categoryToUiCategory(category) {
  return DB_CATEGORY_TO_UI[category] || "community";
}

function shouldUseSupabasePolicies() {
  return ["1", "true", "yes", "supabase"].includes(
    String(process.env.SUPABASE_POLICIES_ENABLED || "").trim().toLowerCase()
  );
}

function buildSuitableFor(row) {
  const parts = [];
  if (row.age_min) parts.push(`${row.age_min} 岁及以上`);
  if (row.age_max) parts.push(`${row.age_max} 岁及以下`);
  const careLevels = asArray(row.care_levels);
  if (careLevels.length) parts.push(`照护情况：${careLevels.join("、")}`);
  if (row.income_type && row.income_type !== "不限") parts.push(`收入身份：${row.income_type}`);
  if (row.hukou_type && row.hukou_type !== "不限") parts.push(`户籍：${row.hukou_type}`);
  return parts.length ? `${parts.join("，")}的老人或家庭优先确认。` : "符合当地政策条件的老人或家庭可以先向社区确认。";
}

function normalizeSubsidyRow(row) {
  const city = cleanText(row.city, 60);
  const name = cleanText(row.name, 120);
  const amount = cleanText(row.amount, 220);
  const category = cleanText(row.category, 40);
  const applyChannel = cleanText(row.apply_channel, 160);
  const year = Number(row.policy_year || 0);
  const notes = cleanText(row.notes, 260);
  const materials = asArray(row.materials);
  const eligibility = asArray(row.eligibility);

  return {
    id: stablePolicyId(row),
    userTitle: name.startsWith(city) ? name : `${city}${name}`,
    officialTitle: name,
    category: categoryToUiCategory(category),
    rawCategory: category,
    region: cityToRegion(city),
    regionLabel: city,
    status: statusLabel(row.confidence),
    benefit: amount ? `符合条件后，可能获得${name}：${amount}。` : `符合条件后，可能申请${name}。`,
    suitableFor: buildSuitableFor(row),
    conditions: eligibility.length ? eligibility : ["以当地社区、民政或医保窗口审核条件为准"],
    missingInfoHints: [
      "户籍地、居住地或参保地是否符合",
      "当前年度是否仍按该标准执行",
      applyChannel ? `是否需要到${applyChannel}办理` : "当地是否有线上或线下办理入口"
    ],
    materialsRequired: materials.length ? materials : ["老人身份证", "户口簿或居住材料", "经办窗口要求的申请表"],
    materialsOptional: ["代办人身份证", "银行卡或社保卡", "评估报告或低保证明等身份材料"],
    applicationSteps: [
      `先向${applyChannel || "户籍或居住地社区"}确认最新条件`,
      "按窗口要求准备身份证明、户籍或参保材料",
      "提交申请或登记信息",
      "等待审核，并确认发放方式或服务安排"
    ],
    officialSourceUrl: cleanText(row.apply_url, 260) || "https://yanglao8.com/policy/",
    lastVerifiedAt: year ? `${year} 年政策项` : "待补充年份",
    verificationLevel: verificationLevel(row.confidence),
    synonyms: [name, category, city, amount, notes].filter(Boolean),
    tags: [categoryToUiCategory(category), category, city].filter(Boolean),
    amountMonthly: row.amount_monthly == null ? null : Number(row.amount_monthly),
    riskNotice: "本页面提供政策信息整理和初步匹配，不代表政府部门最终审核结果。补贴标准、申请条件和办理流程可能因地区、时间和个人情况发生变化，请以当地主管部门最新规定为准。"
  };
}

function filterRows(rows, filters = {}) {
  const city = normalizeRegion(filters.region);
  const category = cleanText(filters.category, 40);
  const query = cleanText(filters.query, 80).toLowerCase();

  return rows.filter((row) => {
    if (city && !["all", "national", "全国通用"].includes(city) && cleanText(row.city, 60) !== city) return false;
    if (category && category !== "all" && categoryToUiCategory(row.category) !== category) return false;
    if (!query) return true;
    return [
      row.city,
      row.name,
      row.category,
      row.amount,
      row.notes,
      ...(Array.isArray(row.eligibility) ? row.eligibility : []),
      ...(Array.isArray(row.materials) ? row.materials : [])
    ].join(" ").toLowerCase().includes(query);
  });
}

function supabaseConfig() {
  if (!shouldUseSupabasePolicies()) return null;
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

async function readLocalRows() {
  const fileUrl = new URL("../scripts/output/subsidies-all.json", import.meta.url);
  const text = await readFile(fileUrl, "utf8");
  return JSON.parse(text);
}

async function loadRows() {
  if (supabaseConfig()) {
    try {
      const publishedRows = await supabaseFetch(`subsidies?select=${SELECT_FIELDS}&is_published=eq.true&order=city.asc,name.asc&limit=120`);
      if (Array.isArray(publishedRows) && publishedRows.length) {
        return { rows: publishedRows, source: "supabase" };
      }
    } catch (error) {
      // The public policy page should keep working if Supabase policy data is
      // not migrated, has no published rows yet, or is temporarily unavailable.
    }
  }

  const localRows = await readLocalRows();
  return { rows: localRows, source: "local_policy_items" };
}

async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.method !== "GET") {
    json(response, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  try {
    const url = new URL(request.url, "http://localhost");
    const filters = {
      region: url.searchParams.get("region") || "changsha",
      category: url.searchParams.get("category") || "all",
      query: url.searchParams.get("query") || ""
    };
    const { rows, source } = await loadRows();
    const policies = filterRows(rows, filters).map(normalizeSubsidyRow);
    json(response, 200, {
      ok: true,
      source,
      filters,
      total: policies.length,
      policies
    });
  } catch (error) {
    json(response, error.status || 500, { ok: false, error: error.message || "policies_read_failed" });
  }
}

export default handler;

export const __test = {
  categoryToUiCategory,
  filterRows,
  normalizeRegion,
  normalizeSubsidyRow,
  shouldUseSupabasePolicies
};
