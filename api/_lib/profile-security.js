import crypto from "node:crypto";

export function createAccessToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export function normalizeAccessToken(value) {
  const token = String(value || "").trim();
  return /^[A-Za-z0-9_-]{24,80}$/.test(token) ? token : "";
}

export function hashAccessToken(value) {
  const token = normalizeAccessToken(value);
  return token ? crypto.createHash("sha256").update(token).digest("hex") : "";
}

export function tokenMatches(value, expectedHash) {
  const actual = hashAccessToken(value);
  const expected = String(expectedHash || "").trim().toLowerCase();
  if (!actual || !/^[a-f0-9]{64}$/.test(expected)) return false;
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

export function canAccessProfile(row, userId, accessToken) {
  if (!row) return false;
  if (userId && row.user_id && row.user_id === userId) return true;
  return Boolean(row.is_shared && tokenMatches(accessToken, row.access_token_hash));
}

export function canWriteProfile(row, userId, accessToken) {
  if (!row) return true;
  if (userId && row.user_id && row.user_id === userId) return true;
  return tokenMatches(accessToken, row.access_token_hash);
}
