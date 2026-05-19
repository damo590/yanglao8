const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const visibleHtml = html.replace(/<script[\s\S]*?<\/script>/g, "");

const forbiddenTerms = [
  "答对",
  "答错",
  "正确率",
  "连击",
  "已解锁",
  "推进年龄",
  "标准答案",
  "正确答案"
];

assert.match(
  html,
  /\.hidden\s*\{\s*display:\s*none\s*!important;\s*\}/,
  "global .hidden should still hide collapsed UI"
);
assert.match(
  html,
  /fallRiskQuestions\.runtime\.js/,
  "page should load the browser-safe runtime question bank"
);
assert.match(
  html,
  /type="text\/plain" id="legacyGameScript"/,
  "legacy redirect script should stay disabled in the static preview"
);
assert.match(
  html,
  /type="text\/plain" id="legacyQuizScript"/,
  "legacy inline quiz script should be disabled"
);
assert.match(visibleHtml, /开始 3 分钟家庭防摔自测/, "homepage primary CTA should stay in place");
assert.match(visibleHtml, /稳住榜/, "leaderboard layout should remain on the homepage");
assert.match(visibleHtml, /总体风险等级/, "result page should show the risk-level card");
assert.match(visibleHtml, /已识别风险场景/, "result page should show identified risk scenes");
assert.match(visibleHtml, /信息缺口/, "result page should show the information-gap card");
assert.match(visibleHtml, /医疗红旗项/, "result page should show the red-flag card");
assert.match(visibleHtml, /今日行动建议/, "result page should show the action-count card");
assert.match(visibleHtml, /家庭防摔风险地图/, "result panel should be reframed as a risk map");
assert.match(
  visibleHtml,
  /本工具仅用于家庭防摔风险排查和科普提醒，不构成医疗诊断/,
  "disclaimer should be visible on the result page"
);

for (const forbidden of forbiddenTerms) {
  assert.doesNotMatch(visibleHtml, new RegExp(forbidden), `visible page should avoid ${forbidden}`);
}

console.log("fall-guardian-html checks passed");
