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
assert.match(
  html,
  /STATIC_PREVIEW_PORTS = new Set\(\["4173", "5173", "5500", "8000", "8080", "8765"\]\)/,
  "local static preview ports should include the verification server port"
);
assert.match(visibleHtml, /开始生成我家的养老画像/, "homepage primary CTA should lead to the parent profile");
assert.match(visibleHtml, /3分钟生成养老画像[\s\S]*和本周行动清单/, "homepage should position the product around the parent profile and weekly action list");
assert.match(visibleHtml, /先看低成本防摔自查/, "homepage should keep fall prevention as a secondary path");
assert.match(visibleHtml, /开始 3 分钟家庭防摔自测/, "fall self-check entry should stay in place");
assert.match(visibleHtml, /稳住榜/, "leaderboard layout should remain on the homepage");
assert.match(visibleHtml, /总体风险等级/, "result page should show the risk-level card");
assert.match(visibleHtml, /已识别风险场景/, "result page should show identified risk scenes");
assert.match(visibleHtml, /信息缺口/, "result page should show the information-gap card");
assert.match(visibleHtml, /医疗红旗项/, "result page should show the red-flag card");
assert.match(visibleHtml, /今日行动建议/, "result page should show the action-count card");
assert.match(visibleHtml, /家庭防摔风险地图/, "result panel should be reframed as a risk map");
assert.match(visibleHtml, /先做这 3 个低成本防摔动作/, "result page should lead with immediate low-cost actions");
assert.match(visibleHtml, /100 元以内可以怎么做/, "result page should include the 100 yuan action tier");
assert.match(visibleHtml, /哪些情况需要进入 1000 元方案/, "result page should include the 1000 yuan escalation tier");
assert.match(visibleHtml, /获取完整低成本防摔方案/, "result page should include the paid plan entry");
assert.match(visibleHtml, /199 元/, "paid plan entry should expose the 199 yuan consultation package");
assert.match(visibleHtml, /必做 \/ 可选 \/ 暂不建议/, "result page should separate required, optional, and not-recommended actions");
assert.match(visibleHtml, /防滑拖鞋/, "product recommendation copy should include non-slip slippers");
assert.match(visibleHtml, /防滑垫/, "product recommendation copy should include non-slip mats");
assert.match(visibleHtml, /浴凳/, "product recommendation copy should include shower stools");
assert.match(visibleHtml, /养老政策自助查询/, "homepage should expose the policy self-service entry");
assert.match(html, /href="\/policy\/#selfServiceQuery"/, "homepage policy CTA should link to the self-service policy page");
assert.doesNotMatch(visibleHtml, /未来可接入接口/, "policy copy should not describe the API as future work");
assert.doesNotMatch(visibleHtml, /先建立画像，再看本地政策服务/, "homepage policy CTA should not hide self-service behind assessment");
assert.doesNotMatch(visibleHtml, /袋鼠没爬起来|立即再来一次|查看本轮总结/, "public failure copy should avoid gamey stale wording");
assert.match(
  visibleHtml,
  /本工具仅用于家庭防摔风险排查和科普提醒，不构成医疗诊断/,
  "disclaimer should be visible on the result page"
);

for (const forbidden of forbiddenTerms) {
  assert.doesNotMatch(visibleHtml, new RegExp(forbidden), `visible page should avoid ${forbidden}`);
}

console.log("fall-guardian-html checks passed");
