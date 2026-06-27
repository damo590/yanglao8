const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const homeHtml = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
assert.match(homeHtml, /href="\/care\/"/, "homepage should link to the care subpage");
assert.match(homeHtml, /居家照护学习清单/, "homepage should expose the care-list entry copy");

const carePath = path.join(__dirname, "..", "care", "index.html");
assert.ok(fs.existsSync(carePath), "care subpage should exist at /care/index.html");

const html = fs.readFileSync(carePath, "utf8");

assert.match(html, /居家照护学习清单/, "care page should expose the product name");
assert.match(html, /不会照顾老人，很正常。先从今天这一件事开始。/, "care page should use customer-facing hero copy");
assert.match(html, /老人洗澡困难/, "bath scene should be available");
assert.match(html, /老人卧床/, "bedridden scene should be available");
assert.match(html, /老人刚出院/, "discharge scene should be available");
assert.match(html, /今天先做 3 件事/, "care page should lead with immediate actions");
assert.match(html, /这些不要自己硬做/, "care page should include safety boundary guidance");
assert.match(html, /先看这 3 个教学视频/, "care page should include a learning video section");

const bilibiliEmbeds = [...html.matchAll(/https:\/\/player\.bilibili\.com\/player\.html\?bvid=([^"&]+)/g)].map((match) => match[1]);
assert.deepEqual(
  bilibiliEmbeds,
  ["BV1ij411s7rG", "BV1LZ421B7hJ", "BV1Fm41167U6"],
  "care page should embed the selected Bilibili learning videos"
);

for (const bvid of bilibiliEmbeds) {
  assert.match(html, new RegExp(`https://www\\.bilibili\\.com/video/${bvid}/`), `original Bilibili link should be present for ${bvid}`);
}

assert.match(html, /不替代医生、护士或急救判断/, "medical boundary should be explicit");
assert.doesNotMatch(html, /alert\s*\(/, "care page should not use alert dialogs");

console.log("care page static checks passed");
