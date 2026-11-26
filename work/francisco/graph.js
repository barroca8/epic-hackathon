// MighT graph API over the Supabase `triples` table. Import in the app:
//   import * as graph from "./graph.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const UNLOCK_AT = 3;
export const db = createClient(
  "https://pkabsodqwruyccphfkud.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrYWJzb2Rxd3J1eWNjcGhma3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2OTk2NjksImV4cCI6MjExMTI3NTY2OX0.bWNWAAkvEKvFO_ljnnOojdNjGOCZiu89z8Z3sabFwhk"
);

const rows = async (q) => {
  const { data, error } = await q;
  if (error) throw error;
  return data;
};
const add = (list) => rows(db.from("triples").insert(list));
const slug = (s) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

let dims; // tag id -> personality | power | character
async function dimensions() {
  if (!dims) {
    const r = await rows(db.from("triples").select("subject,object").eq("predicate", "TAG_DIMENSION"));
    dims = Object.fromEntries(r.map((x) => [x.subject, x.object]));
  }
  return dims;
}

// Step 1. selfTags = 3 tag ids, one per dimension. Returns the new person id.
export async function createPerson(name, selfTags) {
  const id = `person:${slug(name)}-${Math.random().toString(36).slice(2, 6)}`;
  await add([
    { subject: id, predicate: "NAME", object: name, source: "self" },
    ...selfTags.map((t) => ({ subject: id, predicate: "SELF_TAG", object: t, source: "self" })),
  ]);
  return id;
}

// [{id, name}] for everyone, seed and new.
export async function listPeople() {
  const r = await rows(db.from("triples").select("subject,object").eq("predicate", "NAME").order("id").limit(5000));
  return r.map((x) => ({ id: x.subject, name: x.object }));
}

// Step 2. One MighT: who, to whom, in which circle, 3 tag ids. Pending until the receiver answers.
export const sendMight = (from, to, circle, tags) =>
  add([
    { subject: from, predicate: "GAVE_MIGHT", object: to, circle, source: "might" },
    ...tags.map((t) => ({ subject: to, predicate: "RECEIVED_TAG", object: t, circle, source: from })),
  ]);

// Step 3. The receiver accepts or refuses a MighT from `from`.
export const answerMight = (person, from, accept) =>
  add([{ subject: person, predicate: accept ? "ACCEPTED_MIGHT" : "REFUSED_MIGHT", object: from, source: "might" }]);

// Everything about one person. `circle` filters the All MighT (null = all circles).
// Returns { id, name, self: [tag ids], pending: [{from, circle, tags}], received, unlocked,
//           circles: [names], allMight: { personality: {tag: weight}, power: {...}, character: {...} } }
// weight = count / total in that dimension (0..1), sorted high to low.
export async function getProfile(id, circle = null) {
  const [d, r] = [await dimensions(), await rows(db.from("triples").select("*").eq("subject", id).limit(5000))];
  const of = (p) => r.filter((x) => x.predicate === p);
  const accepted = new Set(of("ACCEPTED_MIGHT").map((x) => x.object));
  const refused = new Set(of("REFUSED_MIGHT").map((x) => x.object));
  const byGiver = {};
  for (const x of of("RECEIVED_TAG")) (byGiver[x.source] ??= { from: x.source, circle: x.circle, tags: [] }).tags.push(x.object);
  const mights = Object.values(byGiver);
  const ok = mights.filter((m) => accepted.has(m.from));
  const allMight = { personality: {}, power: {}, character: {} };
  for (const m of ok) if (!circle || m.circle === circle) for (const t of m.tags) allMight[d[t]][t] = (allMight[d[t]][t] || 0) + 1;
  for (const k in allMight) {
    const total = Object.values(allMight[k]).reduce((a, b) => a + b, 0);
    allMight[k] = Object.fromEntries(
      Object.entries(allMight[k]).sort((a, b) => b[1] - a[1]).map(([t, n]) => [t, Math.round((n / total) * 1000) / 1000])
    );
  }
  return {
    id,
    name: of("NAME")[0]?.object,
    self: of("SELF_TAG").map((x) => x.object),
    pending: mights.filter((m) => !accepted.has(m.from) && !refused.has(m.from)),
    received: ok.length,
    unlocked: ok.length >= UNLOCK_AT,
    circles: [...new Set(ok.map((m) => m.circle))],
    allMight,
  };
}

// Call `cb(row)` on every new triple (live updates for the profile or the graph view).
export const onChange = (cb) =>
  db.channel("triples").on("postgres_changes", { event: "INSERT", schema: "public", table: "triples" }, (p) => cb(p.new)).subscribe();
