const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const security = require("../api/_lib/profile-security.js");

test("profile access tokens are opaque and stored as hashes", () => {
  const token = security.createAccessToken();
  const hash = security.hashAccessToken(token);

  assert.match(token, /^[A-Za-z0-9_-]{24,80}$/);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.notEqual(hash, token);
  assert.equal(security.tokenMatches(token, hash), true);
  assert.equal(security.tokenMatches(`${token}x`, hash), false);
});

test("profile access accepts only the owner or a valid shared token", () => {
  const token = security.createAccessToken();
  const row = {
    user_id: "user-1",
    access_token_hash: security.hashAccessToken(token),
    is_shared: true
  };

  assert.equal(security.canAccessProfile(row, "user-1", ""), true);
  assert.equal(security.canAccessProfile(row, "user-2", ""), false);
  assert.equal(security.canAccessProfile(row, "", token), true);
  assert.equal(security.canWriteProfile(row, "", token), true);
  assert.equal(security.canWriteProfile(row, "", "wrong-token-value-123456789"), false);
});

test("security migration enables RLS and owner policies", () => {
  const migration = fs.readFileSync(
    path.join(__dirname, "..", "supabase", "migrations", "20260809_profile_security_and_history.sql"),
    "utf8"
  );

  assert.match(migration, /care_needs enable row level security/i);
  assert.match(migration, /contacts enable row level security/i);
  assert.match(migration, /user_id = auth\.uid\(\)/i);
  assert.match(migration, /access_token_hash/i);
});

test("homepage persists drafts and loads account history", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

  assert.match(html, /PARENT_PROFILE_DRAFT_KEY/);
  assert.match(html, /saveParentProfileDraft\(\)/);
  assert.match(html, /profile_draft_resumed/);
  assert.match(html, /\?mine=1/);
  assert.match(html, /authProfileHistory/);
  assert.match(html, /profile_token/);
});
