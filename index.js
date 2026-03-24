import express from "express";
import crypto from "crypto";
import { runDecisionEngine } from "./engine/decisionEngine.js";
import { enforcePR } from "./engine/enforce.js";

const app = express();
app.use(express.json());

const SECRET = process.env.GITHUB_SECRET;

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

app.post("/webhook", async (req, res) => {
  try {
    if (!verifySignature(req)) {
      console.log("Invalid signature");
      return res.sendStatus(401);
    }

    const event = req.headers["x-github-event"];

    const normalized = {
      event,
      repo: req.body.repository?.full_name || null,
      action: req.body.action || null,
      pr: req.body.pull_request?.number || null,
      timestamp: new Date().toISOString(),
    };

    console.log("EVENT:", JSON.stringify(normalized, null, 2));

    const decisions = runDecisionEngine(event, req.body);

    if (decisions) {
      console.log("DECISIONS:", JSON.stringify(decisions, null, 2));
      await enforcePR(decisions, req.body);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

app.get("/", (_, res) => {
  res.send("Manthan Webhook Running");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});