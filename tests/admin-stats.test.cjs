const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const adminStats = require("../api/admin-stats.js");

test("admin token comparison rejects missing and mismatched values", () => {
  assert.equal(adminStats.__test.safeEqual("correct-token", "correct-token"), true);
  assert.equal(adminStats.__test.safeEqual("wrong-token", "correct-token"), false);
  assert.equal(adminStats.__test.safeEqual("", "correct-token"), false);
});

test("admin page is noindex and does not persist its token", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "admin", "index.html"), "utf8");
  assert.match(html, /noindex,nofollow/);
  assert.match(html, /X-Admin-Token/);
  assert.doesNotMatch(html, /localStorage|sessionStorage/);
  assert.doesNotMatch(html, /phone|wechat|手机号|微信号/);
});
