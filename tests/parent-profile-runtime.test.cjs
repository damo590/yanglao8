const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

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
  delete require.cache[require.resolve(runtimePath)];
  return require(runtimePath);
}

test("parent profile runtime exposes a 15-question standard workflow and 3 enhanced questions", () => {
  const profile = freshProfileRuntime();

  assert.equal(profile.questions.length, 15);
  assert.equal(profile.enhancedQuestions.length, 3);
  assert.deepEqual(
    profile.questions.map((question) => question.title),
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

test("homepage contains parent profile entry while preserving fall self-check", () => {
  const html = fs.readFileSync(htmlPath, "utf8");
  const visibleHtml = html.replace(/<script[\s\S]*?<\/script>/g, "");

  assert.match(html, /parentProfile\.runtime\.js/, "page should load parent profile runtime");
  assert.match(visibleHtml, /养老8/);
  assert.match(visibleHtml, /父母养老画像/);
  assert.match(visibleHtml, /防摔专题/);
  assert.match(visibleHtml, /开始生成我家的养老画像/);
  assert.match(visibleHtml, /15个问题/);
  assert.match(visibleHtml, /进入防摔专题/);
  assert.match(html, /data-concern-type="fall_risk"/);
  assert.match(html, /data-concern-type="living_alone"/);
  assert.match(html, /data-concern-type="caregiver"/);
  assert.match(html, /data-concern-type="policy"/);
  assert.match(html, /data-concern-type="institution"/);
  assert.match(visibleHtml, /这份画像只做养老行动优先级建议/);
  assert.match(visibleHtml, /当前最需要先处理的3个问题/);
  assert.match(visibleHtml, /本周先做3件事/);
  assert.match(visibleHtml, /推荐关注方向/);
  assert.doesNotMatch(visibleHtml, /MVP|Demo|demo|子站保留|开发中/);
});

test("parent result actions use in-page solution modals instead of development alerts", () => {
  const html = fs.readFileSync(htmlPath, "utf8");
  const visibleHtml = html.replace(/<script[\s\S]*?<\/script>/g, "");

  assert.doesNotMatch(html, /\balert\s*\(/, "page should not use browser alert dialogs");
  assert.doesNotMatch(visibleHtml, /MVP/, "development wording should not be visible to users");
  assert.match(visibleHtml, /id="parentSolutionModal"/, "result actions should render an in-page modal");
  assert.match(visibleHtml, /id="parentSolutionModalTitle"/, "modal should have a writable title");
  assert.match(html, /基于刚才的父母画像，我下一步该做什么？/, "modal copy should answer the user's next step");
  assert.match(html, /用品推荐解决方案/, "modal should include product recommendations");
  assert.match(html, /政策服务初筛方向/, "modal should include policy and service screening");
  assert.match(html, /本周行动清单/, "modal should include weekly action planning");
  assert.match(html, /showParentSolutionModal\("products"\)/, "products action should open the products modal");
  assert.match(html, /showParentSolutionModal\("policy"\)/, "policy action should open the policy modal");
  assert.match(html, /showParentSolutionModal\("next"\)/, "advisor action should open the next-step modal");
});

test("homepage intro animation is disabled for the simplified portal", () => {
  const html = fs.readFileSync(htmlPath, "utf8");

  assert.match(
    html,
    /\.intro-screen\s*\{[\s\S]*display:\s*none\s*!important/,
    "intro animation overlay should not appear on the homepage"
  );
  assert.match(
    html,
    /function playIntro\(\)\s*\{\s*return;\s*\}/,
    "playIntro should be a no-op"
  );
});

test("screen changes reset scroll position so risk map is visible immediately", () => {
  const html = fs.readFileSync(htmlPath, "utf8");

  assert.match(
    html,
    /function switchScreen\(name\)[\s\S]*scrollTo\(\{ top: 0, behavior: "auto" \}\)/,
    "switching screens should scroll the viewport back to the top"
  );
  assert.match(
    html,
    /function nextQuestion\(\)[\s\S]*game\.idx >= game\.order\.length - 1[\s\S]*finishGame\(\)/,
    "final risk-map CTA should finish directly instead of relying on an off-by-one transition"
  );
});
