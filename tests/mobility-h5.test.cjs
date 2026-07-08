const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const htmlPath = path.join(__dirname, "..", "mobility-h5.html");
const html = fs.readFileSync(htmlPath, "utf8");

assert.match(html, /爸妈行动力基线记录/, "baseline positioning should be present");
assert.match(html, /行动力记录与用品路径分诊/, "homepage should make the new product shape visible");
assert.match(html, /先看样例结果/, "demo should expose a one-tap sample result");
assert.match(html, /入口路径预览/, "homepage should preview product and service routing");
assert.match(html, /runDemoScenario/, "sample result should be generated without completing the full flow");
assert.match(html, /安全条件已确认/, "safety confirmation gate should be present");
assert.match(html, /5 次坐站记录/, "sit-to-stand baseline record should be present");
assert.match(html, /保存本次记录/, "record save CTA should be present");
assert.match(html, /7 天复测/, "retest loop should be present");
assert.match(html, /复测对比/, "comparison output should be present");
assert.match(html, /本周任务完成打卡/, "weekly action completion loop should be present");
assert.match(html, /下一步用品与服务路径/, "result should route users to product and service paths");
assert.match(html, /用品不是第一步，场景才是第一步/, "commerce boundary should prioritize scenarios over products");
assert.match(html, /今晚能做/, "low-friction tonight path should be present");
assert.match(html, /先量尺寸再买/, "measured purchase path should be present");
assert.match(html, /先咨询再决定/, "professional consultation path should be present");
assert.match(html, /社区或改造路径/, "community or home modification path should be present");
assert.match(html, /buildPathRecommendations/, "path recommendations should be generated from record signals");
assert.match(html, /家庭群分享卡/, "family share card should be present");
assert.match(html, /本工具只做家庭观察记录，不构成医疗诊断/, "medical boundary should be explicit");
assert.match(html, /downloadCard/, "share image generation should be wired");
assert.match(html, /yanglao8_mobility_baselines_v2/, "records should be stored locally for retest comparison");
assert.doesNotMatch(html, /alert\s*\(/, "H5 should not use alert dialogs");
assert.doesNotMatch(html, /生成家庭报告/, "core CTA should not frame the flow as a one-off report");
assert.doesNotMatch(html, /开始自测/, "core CTA should not frame the flow as a generic self-test");

const sectionIds = [...html.matchAll(/<section id="([^"]+)"/g)].map((match) => match[1]);
for (const id of ["why", "safety", "profile", "guide", "test", "report"]) {
  assert.ok(sectionIds.includes(id), `section ${id} should exist`);
}

console.log("mobility-h5 static checks passed");
