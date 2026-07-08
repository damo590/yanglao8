const test = require("node:test");
const assert = require("node:assert/strict");

const policyQueryApi = require("../api/policy-query.js");
const { __test } = policyQueryApi;
const handler = policyQueryApi.default || policyQueryApi;

function createResponse() {
  return {
    headers: {},
    statusCode: 0,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = body;
    }
  };
}

test("policy query API compacts self-service filters and policy context", () => {
  const query = __test.compactPolicyQuery({
    region: " changsha ",
    category: " monthly_money ",
    keyword: " 高龄津贴 ",
    policies: [
      {
        userTitle: "长沙高龄津贴",
        benefit: "80-89岁每月100元",
        suitableFor: "80岁及以上老人",
        materialsRequired: ["身份证", "户口簿"],
        applicationSteps: ["到社区确认", "提交申请"],
        officialSourceUrl: "https://example.gov/policy"
      }
    ]
  });

  assert.equal(query.region, "changsha");
  assert.equal(query.category, "monthly_money");
  assert.equal(query.keyword, "高龄津贴");
  assert.equal(query.policies.length, 1);
  assert.equal(query.policies[0].title, "长沙高龄津贴");
  assert.deepEqual(query.policies[0].materials, ["身份证", "户口簿"]);
});

test("policy query API normalizes DeepSeek JSON into public advice fields", () => {
  const advice = __test.normalizePolicyAdvice({
    summary: " 可以先核对年龄和户籍条件。 ",
    likely_matches: ["长沙高龄津贴"],
    priority_actions: ["先问社区窗口", "准备身份证"],
    materials_to_prepare: ["身份证", "户口簿"],
    verification_questions: ["是否看户籍地？"],
    risk_notice: "以当地审核为准"
  });

  assert.equal(advice.summary, "可以先核对年龄和户籍条件。");
  assert.deepEqual(advice.likely_matches, ["长沙高龄津贴"]);
  assert.deepEqual(advice.priority_actions, ["先问社区窗口", "准备身份证"]);
  assert.deepEqual(advice.materials_to_prepare, ["身份证", "户口簿"]);
  assert.deepEqual(advice.verification_questions, ["是否看户籍地？"]);
  assert.equal(advice.risk_notice, "以当地审核为准");
});

test("policy query API returns service unavailable when DeepSeek key is missing", async () => {
  const oldKey = process.env.DEEPSEEK_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;

  try {
    const response = createResponse();
    await handler(
      {
        method: "POST",
        body: {
          region: "changsha",
          category: "monthly_money",
          keyword: "高龄津贴",
          policies: [{ userTitle: "长沙高龄津贴" }]
        }
      },
      response
    );
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 503);
    assert.equal(payload.ok, false);
    assert.equal(payload.error, "deepseek_not_configured");
  } finally {
    if (oldKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = oldKey;
  }
});

test("policy query API calls DeepSeek and returns normalized policy advice", async () => {
  const oldKey = process.env.DEEPSEEK_API_KEY;
  const oldFetch = global.fetch;
  process.env.DEEPSEEK_API_KEY = "sk-test-policy-query";
  let upstreamRequest;

  global.fetch = async (url, options) => {
    upstreamRequest = { url, options, body: JSON.parse(options.body) };
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: "优先看高龄津贴，先核对年龄、户籍和办理窗口。",
                  likely_matches: ["长沙高龄津贴"],
                  priority_actions: ["电话问社区", "带身份证和户口簿去确认"],
                  materials_to_prepare: ["身份证", "户口簿"],
                  verification_questions: ["是否必须长沙户籍？"],
                  risk_notice: "不代表最终审核结果。"
                })
              }
            }
          ]
        };
      }
    };
  };

  try {
    const response = createResponse();
    await handler(
      {
        method: "POST",
        body: {
          region: "changsha",
          category: "monthly_money",
          keyword: "高龄津贴",
          policies: [{ userTitle: "长沙高龄津贴", benefit: "80-89岁每月100元" }]
        }
      },
      response
    );
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.advice.summary, "优先看高龄津贴，先核对年龄、户籍和办理窗口。");
    assert.deepEqual(payload.advice.likely_matches, ["长沙高龄津贴"]);
    assert.equal(upstreamRequest.url, "https://api.deepseek.com/chat/completions");
    assert.equal(upstreamRequest.options.headers.Authorization, "Bearer sk-test-policy-query");
    assert.equal(upstreamRequest.body.model, "deepseek-v4-flash");
    assert.equal(upstreamRequest.body.response_format.type, "json_object");
    assert.match(upstreamRequest.body.messages[1].content, /高龄津贴/);
  } finally {
    if (oldKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = oldKey;
    global.fetch = oldFetch;
  }
});

test("policy query API still calls DeepSeek when local policy candidates are empty", async () => {
  const oldKey = process.env.DEEPSEEK_API_KEY;
  const oldFetch = global.fetch;
  process.env.DEEPSEEK_API_KEY = "sk-test-policy-query";
  let upstreamRequest;

  global.fetch = async (url, options) => {
    upstreamRequest = { url, options, body: JSON.parse(options.body) };
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: "本地政策库没有直接命中“养老金”，建议按养老保险待遇、退休金或社保待遇去人社渠道确认。",
                  likely_matches: [],
                  priority_actions: ["先确认参保地和退休办理地", "咨询当地人社或社保经办窗口"],
                  materials_to_prepare: ["身份证", "社保卡"],
                  verification_questions: ["这是养老保险待遇，还是民政养老补贴？"],
                  risk_notice: "本地政策库未命中具体政策项，不代表当地没有相关办理入口。"
                })
              }
            }
          ]
        };
      }
    };
  };

  try {
    const response = createResponse();
    await handler(
      {
        method: "POST",
        body: {
          region: "changsha",
          category: "all",
          keyword: "养老金",
          policies: []
        }
      },
      response
    );
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.equal(payload.ok, true);
    assert.match(payload.advice.summary, /养老金/);
    assert.equal(upstreamRequest.body.model, "deepseek-v4-flash");
    assert.match(upstreamRequest.body.messages[1].content, /\"policies\":\[\]/);
    assert.match(upstreamRequest.body.messages[1].content, /local_policy_status/);
    assert.match(upstreamRequest.body.messages[0].content, /不会联网搜索/);
    assert.match(upstreamRequest.body.messages[0].content, /keyword 可能是完整问题/);
    assert.doesNotMatch(upstreamRequest.body.messages[0].content, /只能给查询方向/);
  } finally {
    if (oldKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = oldKey;
    global.fetch = oldFetch;
  }
});
