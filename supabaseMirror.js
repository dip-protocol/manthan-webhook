function mirrorToSupabase(supabase, record) {
  try {
    const row = {
      id: record.id + "-" + Date.now(),
      repo: record.repo,
      pr: String(record.pr),
      sha: record.sha,
      event: record.event,
      decisions: record.decisions, // full JSON
      created_at: new Date().toISOString()
    };

    supabase
      .from("decisions")
      .insert([row])
      .then(() => {
        console.log("Supabase mirror success");
      })
      .catch((err) => {
        console.error("Supabase mirror error:", err.message);
      });

  } catch (err) {
    console.error("Supabase mirror crash:", err.message);
  }
}

module.exports = { mirrorToSupabase };