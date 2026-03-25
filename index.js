import express from "express";
import crypto from "crypto";
import { runDecisionEngine } from "./engine/decisionEngine.js";
import { enforcePR } from "./engine/enforce.js";

const app = express();
app.use(express.json());

const SECRET = process.env.GITHUB_SECRET;

// 🔥 Deduplication store with TTL (memory-safe)
const processedEvents = new Map();
const EVENT_TTL = 10 * 60 * 1000; // 10 minutes

// --- Verify GitHub Webhook Signature ---
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

// --- Webhook Handler ---
app.post("/webhook", async (req, res) => {
  try {
    // ✅ Signature verification
    if (!verifySignature(req)) {
      console.log("Invalid signature");
      return res.sendStatus(401);
    }

    const deliveryId = req.headers["x-github-delivery"];
    const event = req.headers["x-github-event"];
    const now = Date.now();

    // 🔥 Cleanup old events (prevent memory leak)
    for (const [id, timestamp] of processedEvents.entries()) {
      if (now - timestamp > EVENT_TTL) {
        processedEvents.delete(id);
      }
    }

    // 🔥 Deduplication check
    if (processedEvents.has(deliveryId)) {
      console.log("Duplicate event ignored:", deliveryId);
      return res.sendStatus(200);
    }

    // store event
    processedEvents.set(deliveryId, now);

    const normalized = {
      event,
      repo: req.body.repository?.full_name || null,
      action: req.body.action || null,
      pr: req.body.pull_request?.number || null,
      timestamp: new Date().toISOString(),
    };

    // ✅ Clean logs
    console.log(
      `EVENT: ${event} | ${normalized.repo} | PR #${normalized.pr}`
    );

    // --- Decision Engine ---
    const decisions = runDecisionEngine(event, req.body);

    if (decisions && decisions.length > 0) {
      console.log(
        `DECISION: ${decisions.map(d => d.decision).join(", ")}`
      );

      // --- Enforcement ---
      await enforcePR(decisions, req.body);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

// --- Health Check ---
app.get("/", (_, res) => {
  res.send("Manthan Webhook Running");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Manthan running on port ${PORT}`);
});