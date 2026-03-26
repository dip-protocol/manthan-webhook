import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// --- Save Decision ---
export async function saveDecision(record) {
  const { error } = await supabase
    .from("decisions")
    .insert([
      {
        id: record.id,
        repo: record.repo,
        pr: String(record.pr),
        sha: record.sha,
        event: record.event,
        decisions: record.decisions,
      }
    ]);

  if (error) {
    console.error("❌ Supabase insert error:", error);
  } else {
    console.log("✅ Decision saved to DB");
  }
}

// --- Read Decisions ---
export async function readDecisions(filters = {}) {
  let query = supabase.from("decisions").select("*");

  if (filters.repo) query = query.eq("repo", filters.repo);
  if (filters.pr) query = query.eq("pr", String(filters.pr));
  if (filters.sha) query = query.eq("sha", filters.sha);

  const { data, error } = await query;

  if (error) {
    console.error("❌ Supabase read error:", error);
    return [];
  }

  return data || [];
}