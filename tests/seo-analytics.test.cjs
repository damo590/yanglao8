const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const pages = [
  { file: "index.html", canonical: "https://yanglao8.com/" },
  { file: path.join("policy", "index.html"), canonical: "https://yanglao8.com/policy/" },
  { file: path.join("care", "index.html"), canonical: "https://yanglao8.com/care/" }
];

for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page.file), "utf8");
  assert.match(html, /<meta name="description" content="[^"]+" \/>/, `${page.file} should have a description`);
  assert.match(html, new RegExp(`<link rel="canonical" href="${page.canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" \\/>`));
  assert.match(html, /<meta property="og:title" content="[^"]+" \/>/, `${page.file} should have an Open Graph title`);
  assert.match(html, /src="\/_vercel\/insights\/script\.js"/, `${page.file} should load Vercel Web Analytics`);
  assert.match(html, /src="\/_vercel\/speed-insights\/script\.js"/, `${page.file} should load Vercel Speed Insights`);
  assert.match(html, /src="\/scripts\/analytics\.js"/, `${page.file} should load business event tracking`);
}

const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const analytics = fs.readFileSync(path.join(root, "scripts", "analytics.js"), "utf8");

assert.match(robots, /Sitemap: https:\/\/yanglao8\.com\/sitemap\.xml/);
for (const url of pages.map((page) => page.canonical)) {
  assert.match(sitemap, new RegExp(`<loc>${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<\/loc>`));
}
assert.match(analytics, /window\.va\("event"/);
assert.match(analytics, /data-analytics-event/);

console.log("SEO and analytics checks passed");
