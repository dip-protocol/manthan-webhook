const fs = require("fs");

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

// --- Save Decision ---
function saveDecision(record) {
  ensureFile();

  const line = JSON.stringify(record) + "\n";
  fs.appendFileSync(FILE, line);
}

// --- Read Decisions ---
function readDecisions(filters = {}) {
  try {
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
    console.error("❌ readDecisions error:", err);
    return [];
  }
}

module.exports = { saveDecision, readDecisions };