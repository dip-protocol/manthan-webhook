import fs from "fs";

const DIR = "./data";
const FILE = "./data/decisions.log";

// 🔥 Ensure directory exists
function ensureDir() {
  if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR);
  }
}

// --- Save Decision (append-only) ---
export function saveDecision(record) {
  ensureDir();

  const line = JSON.stringify(record) + "\n";
  fs.appendFileSync(FILE, line);
}

// --- Read Decisions (with filters) ---
export function readDecisions(filters = {}) {
  if (!fs.existsSync(FILE)) return [];

  const lines = fs.readFileSync(FILE, "utf-8")
    .trim()
    .split("\n")
    .filter(Boolean);

  const records = lines.map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);

  // --- Apply filters ---
  return records.filter(r => {
   if (filters.repo && String(r.repo).trim() !== String(filters.repo).trim()) return false;
if (filters.pr && String(r.pr) !== String(filters.pr)) return false;
if (filters.sha && String(r.sha).trim() !== String(filters.sha).trim()) return false;
    return true;
  });
}