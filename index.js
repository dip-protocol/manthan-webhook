const express = require("express");
const path = require("path");
const crypto = require("crypto");

const { runDecisionEngine } = require("./engine/decisionEngine");
const { enforcePR } = require("./engine/enforce");
const { saveDecision, readDecisions } = require("./engine/decisionStore");
const { aggregateDecisions } = require("./engine/aggregation");
const { diffDecisions } = require("./engine/diff");

const { supabase } = require("./supabaseClient");
const { mirrorToSupabase } = require("./supabaseMirror");

const app = express();
app.use("/", express.static(path.join(__dirname, "ui")));
app.use(express.json());

const SECRET = process.env.GITHUB_SECRET;

// Deduplication store with TTL
const processedEvents = new Map();
const EVENT_TTL = 10 * 60 * 1000;

// --- Verify Signature ---
function verifySignature(req) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature || !SECRET) return true;

  const hmac = crypto.createHmac("sha256", SECRET);
  const digest =
    "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch {
    return false;
  }
}

// --- Webhook ---
app.post("/webhook", async (req, res) => {
  try {
    if (!verifySignature(req)) {
      console.log("Invalid signature");
      return res.sendStatus(401);
    }

    const deliveryId = req.headers["x-github-delivery"];
    const event = req.headers["x-github-event"];
    const now = Date.now();

    // Cleanup TTL
    for (const [id, timestamp] of processedEvents.entries()) {
      if (now - timestamp > EVENT_TTL) {
        processedEvents.delete(id);
      }
    }

    if (processedEvents.has(deliveryId)) {
      console.log("Duplicate event ignored:", deliveryId);
      return res.sendStatus(200);
    }

    processedEvents.set(deliveryId, now);

    const normalized = {
      event,
      repo: req.body.repository?.full_name || null,
      action: req.body.action || null,
      pr: req.body.pull_request?.number || null,
      timestamp: new Date().toISOString(),
    };

    console.log(`EVENT: ${event} | ${normalized.repo} | PR #${normalized.pr}`);

    // --- Decision Engine ---
    let decisions = [];

    if (event === "pull_request") {
      const action = req.body.action;

      if (
        action === "opened" ||
        action === "edited" ||
        action === "synchronize" ||
        action === "reopened"
      ) {
        decisions = runDecisionEngine(event, req.body);
      } else {
        console.log("Ignoring PR action:", action);
        return res.sendStatus(200);
      }
    } else {
      decisions = runDecisionEngine(event, req.body);
    }

    console.log("DECISIONS:", decisions);

    // --- Load Previous Decisions ---
    const history = await readDecisions({
  repo: normalized.repo,
  pr: normalized.pr
});

    const previousDecision =
      history.length > 0 ? history[history.length - 1] : null;

    // --- Compute Diff ---
    const diff = diffDecisions(previousDecision, {
      decisions
    });

    // --- Save Decision ---
    const record = {
      id: deliveryId,
      event,
      repo: normalized.repo,
      pr: normalized.pr,
      sha: req.body.pull_request?.head?.sha || req.body.after,
      decisions,
      timestamp: new Date().toISOString()
    };

   console.log("SAVING DECISION:", record.id);
await saveDecision(record);

// NON-BLOCKING MIRROR (v0.4)
mirrorToSupabase(supabase, record);

    // --- Enforcement ---
    if (event === "pull_request") {
      if (!decisions || decisions.length === 0) {
        console.log("No decision → forcing failure");

        decisions = [
          {
            contract: "SYSTEM_GUARD",
            decision: "reject",
            reason: "No decision produced by engine"
          }
        ];
      }

      await enforcePR(decisions, req.body, diff);
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

// --- Health ---


// --- Query API ---
app.get("/decisions", async (req, res) => {
  try {
    const { repo, pr, sha, latest } = req.query;

    let results = await readDecisions({ repo, pr, sha });

    if (!results || results.length === 0) {
      return res.json({
        count: 0,
        summary: null,
        diff: null,
        results: []
      });
    }

    // Sort latest first
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (latest === "true") {
      results = [results[0]];
    }

    const latestDecision = results[0] || null;
const previousDecision = results[1] || null;

const summary = latestDecision?.decisions
  ? aggregateDecisions(latestDecision.decisions)
  : null;

const diff = latestDecision
  ? diffDecisions(previousDecision, latestDecision)
  : null;
    res.json({
      count: results.length,
      summary,
      diff,
      results
    });

  } catch (err) {
    console.error("Query error:", err);
    res.sendStatus(500);
  }
});

// --- Server Start ---
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Manthan running on port ${PORT}`);
});