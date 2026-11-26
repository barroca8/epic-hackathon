// POST { tags: ["tag:curious","tag:leader","tag:courage"] }  or  { person: "person:..." } (uses self tags)
// -> { head:{tag,color,pattern}, body:{...}, arms:{...}, tagline, source: "groq" | "cache" | "fallback" }
// head = personality, body = power, arms = character. Same tags always give the same avatar (cached in triples).
const COLORS = ["#753065", "#144B86", "#358EC0", "#3D9061", "#0A5AA9", "#E88F3D", "#A7CDF3", "#FFE5C7", "#DBF2E5", "#C87BCE", "#1C1E28"];
const PATTERNS = ["solid", "stripes", "dots", "zigzag", "grid", "waves", "checker", "triangles"];
const PART = { personality: "head", power: "body", character: "arms" } as Record<string, string>;
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Content-Type": "application/json" };
const URL_ = Deno.env.get("SUPABASE_URL")!, KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = (path: string, init: RequestInit = {}) =>
  fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(init.headers || {}) } });
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

let dims: Record<string, string> | null = null;
async function dimensions() {
  if (!dims) {
    const r = await (await db("triples?select=subject,object&predicate=eq.TAG_DIMENSION")).json();
    dims = Object.fromEntries(r.map((x: any) => [x.subject, x.object]));
  }
  return dims!;
}

function fallback(parts: Record<string, string>) {
  const out: any = { tagline: "Visto pelos olhos dos outros.", source: "fallback" };
  for (const [part, tag] of Object.entries(parts)) out[part] = { tag, color: COLORS[hash(tag) % 10], pattern: PATTERNS[hash(tag + "p") % PATTERNS.length] };
  return out;
}

async function groq(parts: Record<string, string>) {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) return null;
  const prompt = `You style a collectible figure from three words describing a person.
Words: head="${parts.head}", body="${parts.body}", arms="${parts.arms}" (strip the "tag:" prefix).
For each part pick ONE color from ${JSON.stringify(COLORS)} and ONE pattern from ${JSON.stringify(PATTERNS)} that fit the word's feeling. Use three different colors.
Also write "tagline": one sentence in European Portuguese, max 8 words, warm, first person, combining the three words.
Return only JSON: {"head":{"color":"","pattern":""},"body":{"color":"","pattern":""},"arms":{"color":"","pattern":""},"tagline":""}`;
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: Deno.env.get("GROQ_MODEL") || "openai/gpt-oss-120b", temperature: 0.4, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`groq ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = JSON.parse((await r.json()).choices[0].message.content);
  const out: any = { tagline: String(j.tagline || "").slice(0, 120), source: "groq" };
  for (const part of ["head", "body", "arms"]) {
    const c = j[part] || {};
    if (!COLORS.includes(c.color) || !PATTERNS.includes(c.pattern)) throw new Error("groq returned a value outside the lists");
    out[part] = { tag: parts[part], color: c.color, pattern: c.pattern };
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    let tags: string[] = body.tags || [];
    if (!tags.length && body.person) {
      const r = await (await db(`triples?select=object&predicate=eq.SELF_TAG&subject=eq.${encodeURIComponent(body.person)}`)).json();
      tags = r.map((x: any) => x.object);
    }
    const d = await dimensions();
    const parts: Record<string, string> = {};
    for (const t of tags) if (d[t]) parts[PART[d[t]]] = t;
    if (Object.keys(parts).length !== 3) return new Response(JSON.stringify({ error: "need 3 tags, one per dimension (personality, power, character)" }), { status: 400, headers: cors });
    const id = `avatar:${parts.head}|${parts.body}|${parts.arms}`;
    const hit = await (await db(`triples?select=object&predicate=eq.AVATAR&subject=eq.${encodeURIComponent(id)}&limit=1`)).json();
    if (hit.length) return new Response(JSON.stringify({ ...JSON.parse(hit[0].object), source: "cache" }), { headers: cors });
    let out = null, error;
    try { out = await groq(parts); } catch (e) { error = String(e); }
    if (out) await db("triples", { method: "POST", body: JSON.stringify({ subject: id, predicate: "AVATAR", object: JSON.stringify(out), source: "groq" }) });
    else out = { ...fallback(parts), ...(error ? { error } : {}) };
    return new Response(JSON.stringify(out), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
