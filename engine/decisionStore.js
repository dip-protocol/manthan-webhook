const fs = require("fs");
const { supabase } = require("../supabaseClient");

const DIR = "./data";
const FILE = "./data/decisions.log";

// Ensure directory exists
function ensureDir() {
  if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR, { recursive: true });
  }
}

// Ensure file exists
function ensureFile() {
  ensureDir();
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, "");
  }
}

// --- Save Decision (UNCHANGED) ---
function saveDecision(record) {
  ensureFile();

  const line = JSON.stringify(record) + "\n";
  fs.appendFileSync(FILE, line);
}

// --- Read Decisions (UPGRADED) ---
async function readDecisions(filters = {}) {
  try {
    // 🔥 PRIMARY: Supabase
    let query = supabase.from("decisions").select("*");

    if (filters.repo) query = query.eq("repo", filters.repo);
    if (filters.pr) query = query.eq("pr", String(filters.pr));
    if (filters.sha) query = query.eq("sha", filters.sha);

    const { data, error } = await query.limit(100);

    if (!error && data && data.length > 0) {
      console.log("Reading from Supabase");
      return data;
    }

    console.warn("Supabase failed/empty → fallback to file");

    // 🔁 FALLBACK: File
    ensureFile();

    const raw = fs.readFileSync(FILE, "utf-8");

    if (!raw || raw.trim() === "") return [];

    const lines = raw
      .split("\n")
      .filter(Boolean);

    const records = lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return records.filter(r => {
      if (filters.repo && String(r.repo).trim() !== String(filters.repo).trim()) return false;
      if (filters.pr && String(r.pr) !== String(filters.pr)) return false;
      if (filters.sha && String(r.sha).trim() !== String(filters.sha).trim()) return false;
      return true;
    });

  } catch (err) {
    console.error("readDecisions error:", err);
    return [];
  }
}

module.exports = { saveDecision, readDecisions };