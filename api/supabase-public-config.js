function json(response, status, body) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
  response.end(JSON.stringify(body));
}

export default function handler(request, response) {
  if (request.method !== "GET") {
    json(response, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    json(response, 503, { ok: false, error: "supabase_public_config_missing" });
    return;
  }

  json(response, 200, {
    ok: true,
    url: url.replace(/\/$/, ""),
    publishableKey
  });
}
