const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");
const visibleHtml = html.replace(/<script[\s\S]*?<\/script>/g, "");

assert.match(html, /<html lang="zh-CN">/);
assert.match(html, /<title>养老8 — 让父母晚年生活更安心<\/title>/);
assert.match(
  html,
  /<meta name="baidu-site-verification" content="codeva-Cfk9pYhdT0" \/>/,
  "homepage should include Baidu site verification meta"
);
assert.match(html, /href="style\.css"/, "homepage should load the shared stylesheet");
assert.match(css, /--accent:\s*#07C160/, "shared stylesheet should keep the brand accent color");

assert.match(visibleHtml, /养老8/);
assert.match(visibleHtml, /让父母晚年生活更安心/);
assert.match(visibleHtml, /爸妈养老问题/);
assert.match(visibleHtml, /开始生成我家的养老画像/);
assert.match(visibleHtml, /3分钟建立父母养老画像/);
assert.match(visibleHtml, /家庭风险清单/);
assert.match(visibleHtml, /本周行动建议/);
assert.match(visibleHtml, /后续方向建议/);

for (const href of ["/profile/", "/care/", "/fall/", "/policy/", "/knowledge/"]) {
  assert.match(html, new RegExp(`href="${href.replace(/\//g, "\\/")}"`), `homepage should link to ${href}`);
}

assert.match(visibleHtml, /防摔专题/);
assert.match(visibleHtml, /本地政策服务/);
assert.match(visibleHtml, /居家照护清单/);
assert.match(visibleHtml, /用药管理/);
assert.match(visibleHtml, /就医陪诊/);
assert.match(visibleHtml, /机构选择/);

assert.doesNotMatch(visibleHtml, /MVP|Demo|demo|开发中|子站保留/, "homepage should avoid development wording");
assert.doesNotMatch(visibleHtml, /答对|答错|正确率|连击|标准答案/, "homepage should avoid game-like assessment wording");
assert.doesNotMatch(html, /alert\s*\(/, "homepage should not use alert dialogs");

console.log("fall-guardian-html checks passed");
