const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const runtimePath = path.join(__dirname, "..", "src", "data", "policyService.runtime.js");

function freshRuntime() {
  delete require.cache[require.resolve(runtimePath)];
  const loaded = require(runtimePath);
  return Object.keys(loaded).length ? loaded : globalThis.PolicyServiceRuntime;
}

test("policy runtime exposes lookup data without assessment flow", () => {
  const runtime = freshRuntime();

  assert.equal(runtime.questions, undefined);
  assert.equal(runtime.buildPolicyServiceResult, undefined);
  assert.ok(Array.isArray(runtime.categories) && runtime.categories.length === 6);
  assert.ok(Array.isArray(runtime.policies) && runtime.policies.length >= 8);

  for (const policy of runtime.policies) {
    assert.equal(typeof policy.id, "string");
    assert.equal(typeof policy.userTitle, "string");
    assert.equal(typeof policy.officialTitle, "string");
    assert.equal(typeof policy.regionLabel, "string");
    assert.equal(typeof policy.lastVerifiedAt, "string");
    assert.equal(typeof policy.officialSourceUrl, "string");
    assert.ok(Array.isArray(policy.materialsRequired));
    assert.ok(Array.isArray(policy.applicationSteps));
    assert.ok(Array.isArray(policy.conditions));
    assert.ok(Array.isArray(policy.missingInfoHints));
  }
});

test("policy filters support category, region, and oral search terms", () => {
  const runtime = freshRuntime();

  const money = runtime.filterPolicies({ category: "monthly_money", region: "xiangyin", query: "高龄补贴" });
  assert.ok(money.some((policy) => policy.userTitle.includes("高龄")));

  const care = runtime.filterPolicies({ category: "home_care", region: "hunan", query: "长护险" });
  assert.ok(care.some((policy) => policy.userTitle.includes("长期护理") || policy.synonyms.includes("长护险")));

  const noResult = runtime.filterPolicies({ category: "medical", region: "xiangyin", query: "完全不存在的词" });
  assert.deepEqual(noResult, []);
});

test("policy details expose checklist-ready materials and official source boundary", () => {
  const runtime = freshRuntime();
  const policy = runtime.getPolicyById("xiangyin-advanced-age-allowance");

  assert.equal(policy.userTitle, "湘阴县高龄老人津贴申请方向");
  assert.ok(policy.materialsRequired.includes("老人身份证"));
  assert.ok(policy.applicationSteps.length >= 4);
  assert.match(policy.riskNotice, /不代表政府部门最终审核结果/);
  assert.match(policy.verificationLevel, /已核实|部分核实|待核实/);
});

test("policy copy avoids certainty claims", () => {
  const runtime = freshRuntime();
  const text = JSON.stringify(runtime.policies);

  assert.doesNotMatch(text, /确定符合|保证申请成功|一定可以领取|官方指定平台/);
});
