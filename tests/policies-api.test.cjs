const test = require("node:test");
const assert = require("node:assert/strict");

const policiesApi = require("../api/policies.js");
const { __test } = policiesApi;
const handler = policiesApi.default || policiesApi;

const sampleRows = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    city: "长沙",
    name: "高龄津贴",
    category: "高龄津贴",
    age_min: 80,
    age_max: null,
    care_levels: null,
    hukou_type: "不限",
    income_type: "不限",
    amount: "80-89岁：100元/月",
    amount_monthly: 100,
    eligibility: ["长沙市户籍", "年满80周岁"],
    materials: ["身份证", "户口本", "申请表"],
    apply_channel: "户籍所在地社区",
    apply_url: null,
    policy_year: 2023,
    confidence: "high",
    notes: "以社区确认为准"
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    city: "上海",
    name: "上海市长期护理保险",
    category: "长护险",
    age_min: 60,
    care_levels: ["重度失能"],
    amount: "居家护理个人自付10%",
    eligibility: ["上海市参保人员"],
    materials: ["身份证", "医保卡"],
    apply_channel: "社区事务受理服务中心",
    policy_year: 2024,
    confidence: "medium"
  }
];

test("policy API maps subsidy rows into policy card fields", () => {
  const policy = __test.normalizeSubsidyRow(sampleRows[0]);

  assert.equal(policy.id, "subsidy-11111111-1111-1111-1111-111111111111");
  assert.equal(policy.userTitle, "长沙高龄津贴");
  assert.equal(policy.category, "monthly_money");
  assert.equal(policy.region, "changsha");
  assert.equal(policy.regionLabel, "长沙");
  assert.equal(policy.status, "较高可信");
  assert.match(policy.benefit, /80-89岁：100元\/月/);
  assert.ok(policy.materialsRequired.includes("身份证"));
  assert.ok(policy.applicationSteps.length >= 4);
  assert.match(policy.riskNotice, /不代表政府部门最终审核结果/);
});

test("policy API filters rows by region, category, and search query", () => {
  const money = __test.filterRows(sampleRows, { region: "changsha", category: "monthly_money", query: "高龄" });
  assert.equal(money.length, 1);
  assert.equal(money[0].city, "长沙");

  const care = __test.filterRows(sampleRows, { region: "shanghai", category: "home_care", query: "长护" });
  assert.equal(care.length, 1);
  assert.equal(care[0].name, "上海市长期护理保险");

  const empty = __test.filterRows(sampleRows, { region: "beijing", category: "home_care", query: "" });
  assert.deepEqual(empty, []);
});

test("policy API handler returns normalized policy items", async () => {
  const request = { method: "GET", url: "/api/policies?region=changsha&category=monthly_money&query=" };
  const response = {
    headers: {},
    statusCode: 0,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = body;
    }
  };

  await handler(request, response);
  const payload = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(payload.ok, true);
  assert.ok(payload.total >= 1);
  assert.ok(payload.policies.some((policy) => policy.region === "changsha"));
});

test("policy API does not query Supabase unless the policy source is explicitly enabled", async () => {
  const oldUrl = process.env.SUPABASE_URL;
  const oldKey = process.env.SUPABASE_ANON_KEY;
  const oldEnabled = process.env.SUPABASE_POLICIES_ENABLED;
  const oldFetch = global.fetch;

  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_ANON_KEY = "public-anon-key";
  delete process.env.SUPABASE_POLICIES_ENABLED;
  global.fetch = async () => {
    throw new Error("Supabase should not be called without SUPABASE_POLICIES_ENABLED=true");
  };

  try {
    const request = { method: "GET", url: "/api/policies?region=beijing&category=monthly_money&query=%E9%AB%98%E9%BE%84" };
    const response = {
      headers: {},
      statusCode: 0,
      setHeader(name, value) {
        this.headers[name] = value;
      },
      end(body) {
        this.body = body;
      }
    };

    await handler(request, response);
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.source, "local_policy_items");
    assert.equal(payload.total, 1);
    assert.equal(payload.policies[0].userTitle, "北京市高龄老年人津贴");
  } finally {
    if (oldUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = oldKey;
    if (oldEnabled === undefined) delete process.env.SUPABASE_POLICIES_ENABLED;
    else process.env.SUPABASE_POLICIES_ENABLED = oldEnabled;
    global.fetch = oldFetch;
  }
});
