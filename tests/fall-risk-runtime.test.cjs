const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const runtimePath = path.join(__dirname, "..", "src", "data", "fallRiskQuestions.runtime.js");
const htmlPath = path.join(__dirname, "..", "index.html");

const forbiddenTerms = [
  "答对",
  "答错",
  "正确率",
  "连击",
  "推进年龄",
  "标准答案",
  "正确答案",
  "已解锁",
  "Boss",
  "掉血",
  "复活"
];

const requiredTerms = [
  "总体风险等级",
  "信息缺口",
  "医疗红旗",
  "今日行动",
  "家庭防摔风险地图"
];

test("runtime question bank exposes mode-filtered risk collection questions", () => {
  const bank = require(runtimePath);

  assert.ok(Array.isArray(bank.questions));
  assert.equal(bank.questions.length, 40);
  assert.equal(Object.keys(bank.categoryMeta).length, 8);
  assert.equal(bank.getQuestionsByMode("weekly").length, 5);
  assert.equal(bank.getQuestionsByMode("standard").length, 30);
  assert.equal(bank.getQuestionsByMode("full").length, 40);
  assert.equal(bank.getQuestionsByMode("custom").length, 40);
  assert.ok(bank.questions.every((question) => !("correctAnswer" in question)));
  assert.ok(
    bank.questions.every(
      (question) => Array.isArray(question.options) && question.options.length >= 4
    )
  );
});

test("page uses runtime bank and avoids exam-style result wording", () => {
  const html = fs.readFileSync(htmlPath, "utf8");
  const visibleHtml = html.replace(/<script[\s\S]*?<\/script>/g, "");

  assert.match(html, /fallRiskQuestions\.runtime\.js/, "index should load the runtime bank");
  assert.match(html, /FallRiskQuestionBank/, "index should read the runtime bank from window");

  for (const forbidden of forbiddenTerms) {
    assert.doesNotMatch(
      visibleHtml,
      new RegExp(forbidden),
      `visible page should not contain ${forbidden}`
    );
  }

  for (const expected of requiredTerms) {
    assert.match(visibleHtml, new RegExp(expected), `page should contain ${expected}`);
  }
});
