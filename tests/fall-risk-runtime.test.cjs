const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

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

function loadRuntimeBank() {
  const source = fs.readFileSync(runtimePath, "utf8");
  const sandbox = {
    window: {},
    module: { exports: {} },
    exports: {}
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, { filename: runtimePath });
  return sandbox.module.exports;
}

test("runtime question bank exposes mode-filtered risk collection questions", () => {
  const bank = loadRuntimeBank();

  assert.ok(Array.isArray(bank.questions));
  assert.equal(bank.questions.length, 40);
  assert.equal(Object.keys(bank.categoryMeta).length, 8);
  assert.equal(bank.getQuestionsByMode("weekly").length, 5);
  assert.equal(bank.getQuestionsByMode("standard").length, 15);
  assert.equal(bank.getQuestionsByMode("full").length, 40);
  assert.equal(bank.getQuestionsByMode("custom").length, 40);
  assert.ok(bank.questions.every((question) => !("correctAnswer" in question)));
  assert.ok(
    bank.questions.every(
      (question) => Array.isArray(question.options) && question.options.length >= 4
    )
  );
});

test("homepage links to fall topic without exposing exam-style wording", () => {
  const html = fs.readFileSync(htmlPath, "utf8");
  const visibleHtml = html.replace(/<script[\s\S]*?<\/script>/g, "");

  assert.match(html, /href="\/fall\/"/, "homepage should link to the fall-prevention topic");
  assert.match(visibleHtml, /防摔专题/, "homepage should expose the fall-prevention topic");

  for (const forbidden of forbiddenTerms) {
    assert.doesNotMatch(
      visibleHtml,
      new RegExp(forbidden),
      `visible page should not contain ${forbidden}`
    );
  }
});
