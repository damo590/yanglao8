const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const runtimePath = path.join(__dirname, "..", "src", "data", "parentProfile.runtime.js");
const htmlPath = path.join(__dirname, "..", "index.html");
const requiredTags = [
  "prevention",
  "fall_risk",
  "living_alone",
  "mobility",
  "medication",
  "medical",
  "emergency",
  "caregiver",
  "policy",
  "institution",
  "family_conflict",
  "action_list"
];

function freshProfileRuntime() {
  const code = fs.readFileSync(runtimePath, "utf8");
  const context = {};
  vm.runInNewContext(code, context, { filename: runtimePath });
  return context.ParentProfileRuntime;
}

test("parent profile runtime exposes a 15-question standard workflow and 3 enhanced questions", () => {
  const profile = freshProfileRuntime();

  assert.equal(profile.questions.length, 15);
  assert.equal(profile.enhancedQuestions.length, 3);
  assert.deepEqual(
    Array.from(profile.questions, (question) => question.title),
    [
      "居住状态",
      "子女距离",
      "行动和自理能力",
      "最近一年是否摔倒",
      "家里最担心的空间",
      "慢病和长期用药",
      "就医资料整理情况",
      "突发响应机制",
      "家庭照护分工",
      "政策和社区服务了解",
      "父母对外部帮助的接受度",
      "家里适老化准备程度",
      "费用和预算边界",
      "信息同步方式",
      "当前最焦虑的问题"
    ]
  );
  assert.ok(profile.questions.every((question) => Array.isArray(question.options) && question.options.length >= 3));
  assert.ok(profile.enhancedQuestions.every((question) => Array.isArray(question.options) && question.options.length >= 3));
});

test("standard and enhanced parent profile options expose title, desc, value, tags, and score", () => {
  const profile = freshProfileRuntime();
  const seenTags = new Set();

  for (const question of [...profile.questions, ...profile.enhancedQuestions]) {
    for (const option of question.options) {
      assert.equal(typeof option.title, "string", `${question.id}/${option.id} should have title`);
      assert.equal(typeof option.desc, "string", `${question.id}/${option.id} should have desc`);
      assert.equal(typeof option.value, "string", `${question.id}/${option.id} should have value`);
      assert.ok(Array.isArray(option.tags) && option.tags.length > 0, `${question.id}/${option.id} should have tags`);
      assert.equal(typeof option.score, "number", `${question.id}/${option.id} should have numeric score`);
      assert.ok(option.score >= 0, `${question.id}/${option.id} score should be non-negative`);
      for (const tag of option.tags) seenTags.add(tag);
    }
  }

  for (const tag of requiredTags) {
    assert.ok(seenTags.has(tag), `expected tag ${tag} to appear in the questionnaire`);
  }
});

test("parent profile result maps different tag clusters to different profile types", () => {
  const profile = freshProfileRuntime();

  const cases = [
    {
      expected: "提前准备型",
      answers: {
        living_status: "with_children",
        child_distance: "nearby",
        mobility: "steady",
        fall_history: "no_fall",
        home_space: "not_sure",
        chronic_meds: "few",
        medical_records: "ready",
        emergency_response: "clear",
        family_care: "clear",
        policy_service: "clear",
        help_acceptance: "open",
        age_friendly_home: "basic_ready",
        budget_boundary: "clear",
        info_sync: "weekly_sync",
        current_anxiety: "prevention"
      }
    },
    {
      expected: "防跌优先型",
      answers: {
        living_status: "couple",
        child_distance: "nearby",
        mobility: "needs_support",
        fall_history: "injured_or_repeated",
        home_space: "bathroom",
        chronic_meds: "one_two",
        medical_records: "scattered",
        emergency_response: "partial",
        family_care: "one_person",
        policy_service: "heard_unclear",
        help_acceptance: "needs_discussion",
        age_friendly_home: "not_ready",
        budget_boundary: "rough",
        info_sync: "scattered_chat",
        current_anxiety: "fall"
      }
    },
    {
      expected: "照护响应型",
      answers: {
        living_status: "alone_daytime",
        child_distance: "far",
        mobility: "slower",
        fall_history: "near_miss",
        home_space: "bedroom_night",
        chronic_meds: "unknown",
        medical_records: "missing",
        emergency_response: "none",
        family_care: "unclear",
        policy_service: "not_checked",
        help_acceptance: "resistant",
        age_friendly_home: "partial",
        budget_boundary: "unclear",
        info_sync: "only_emergency",
        current_anxiety: "alone"
      }
    },
    {
      expected: "就医用药协同型",
      answers: {
        living_status: "with_children",
        child_distance: "same_city_busy",
        mobility: "steady",
        fall_history: "no_fall",
        home_space: "not_sure",
        chronic_meds: "many_meds",
        medical_records: "missing",
        emergency_response: "clear",
        family_care: "clear",
        policy_service: "heard_unclear",
        help_acceptance: "open",
        age_friendly_home: "basic_ready",
        budget_boundary: "clear",
        info_sync: "scattered_chat",
        current_anxiety: "medical"
      }
    },
    {
      expected: "长期照护决策型",
      answers: {
        living_status: "with_children",
        child_distance: "same_city_busy",
        mobility: "needs_support",
        fall_history: "fell_once",
        home_space: "door_stairs",
        chronic_meds: "one_two",
        medical_records: "scattered",
        emergency_response: "partial",
        family_care: "conflict",
        policy_service: "not_checked",
        help_acceptance: "resistant",
        age_friendly_home: "not_ready",
        budget_boundary: "unclear",
        info_sync: "argue_after_event",
        current_anxiety: "institution"
      }
    }
  ];

  for (const item of cases) {
    const result = profile.buildParentProfileResult(item.answers);
    assert.equal(result.type, item.expected);
    assert.equal(result.priorities.length, 3);
    assert.equal(result.weekActions.length, 3);
    assert.ok(result.recommendedDirections.length >= 2);
    assert.ok(Array.isArray(result.topTags) && result.topTags.length >= 2);
  }
});

test("parent profile result is tag-driven and avoids diagnosis language", () => {
  const profile = freshProfileRuntime();
  const result = profile.buildParentProfileResult({
    living_status: "alone_daytime",
    child_distance: "far",
    mobility: "needs_support",
    fall_history: "injured_or_repeated",
    home_space: "bathroom",
    chronic_meds: "many_meds",
    medical_records: "scattered",
    emergency_response: "none",
    family_care: "one_person",
    policy_service: "not_checked",
    help_acceptance: "needs_discussion",
    age_friendly_home: "not_ready",
    budget_boundary: "rough",
    info_sync: "only_emergency",
    current_anxiety: "fall"
  });
  const text = [...result.priorities, ...result.weekActions, ...result.recommendedDirections].join("\n");

  assert.equal(result.type, "防跌优先型");
  assert.ok(result.priorities.some((item) => item.includes("防跌") || item.includes("跌倒")));
  assert.ok(result.weekActions.some((item) => item.includes("浴室") || item.includes("夜间")));
  assert.ok(result.recommendedDirections.some((item) => item.includes("防摔专题")));
  assert.doesNotMatch(text, /诊断|治疗|处方|确诊/);
});

test("homepage contains parent profile entry while preserving topic navigation", () => {
  const html = fs.readFileSync(htmlPath, "utf8");
  const visibleHtml = html.replace(/<script[\s\S]*?<\/script>/g, "");

  assert.match(visibleHtml, /养老8/);
  assert.match(visibleHtml, /父母养老画像/);
  assert.match(visibleHtml, /防摔专题/);
  assert.match(visibleHtml, /开始生成我家的养老画像/);
  assert.match(visibleHtml, /15 个问题/);
  assert.match(html, /href="\/profile\/"/);
  assert.match(html, /href="\/fall\/"/);
  assert.match(html, /href="\/care\/"/);
  assert.match(html, /href="\/policy\/"/);
  assert.match(html, /href="\/knowledge\/"/);
  assert.doesNotMatch(visibleHtml, /MVP|Demo|demo|子站保留|开发中/);
});

test("homepage avoids development alerts and preserves action-oriented copy", () => {
  const html = fs.readFileSync(htmlPath, "utf8");
  const visibleHtml = html.replace(/<script[\s\S]*?<\/script>/g, "");

  assert.doesNotMatch(html, /\balert\s*\(/, "page should not use browser alert dialogs");
  assert.doesNotMatch(visibleHtml, /MVP/, "development wording should not be visible to users");
  assert.match(visibleHtml, /家庭风险清单/);
  assert.match(visibleHtml, /本周行动建议/);
  assert.match(visibleHtml, /后续方向建议/);
});

test("homepage is a static portal instead of the old animated quiz shell", () => {
  const html = fs.readFileSync(htmlPath, "utf8");

  assert.doesNotMatch(html, /class="intro-screen"/, "intro animation overlay should not appear on the homepage");
  assert.doesNotMatch(html, /function playIntro\(/, "homepage should not keep the old intro animation runtime");
});

test("homepage no longer embeds the old quiz screen controller", () => {
  const html = fs.readFileSync(htmlPath, "utf8");

  assert.doesNotMatch(html, /function switchScreen\(name\)/, "homepage should not embed old quiz screen switching");
  assert.doesNotMatch(html, /function nextQuestion\(\)/, "homepage should not embed old quiz question navigation");
});
