import fetch from "node-fetch";
import jwt from "jsonwebtoken";

// --- Generate JWT for GitHub App ---
function generateJWT(appId, privateKey) {
  return jwt.sign(
    {
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 600,
      iss: appId,
    },
    privateKey,
    {
      algorithm: "RS256",
    }
  );
}

// --- Get Installation Token ---
async function getInstallationToken() {
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_INSTALLATION_ID;
  const rawKeyBase64 = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !installationId || !rawKeyBase64) {
    console.error("Missing GitHub App environment variables");
    return null;
  }

  // ✅ FINAL FIX: decode base64 → original PEM
  const privateKey = Buffer.from(rawKeyBase64, "base64").toString("utf-8");

  const jwtToken = generateJWT(appId, privateKey);

  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  const data = await res.json();

  if (!data.token) {
    console.error("Failed to get installation token:", data);
    return null;
  }

  return data.token;
}

// --- Commit Status (for blocking PRs) ---
async function setCommitStatus(token, owner, repo, sha, state, description) {
  await fetch(
    `https://api.github.com/repos/${owner}/${repo}/statuses/${sha}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state, // success | failure
        description,
        context: "manthan/decision",
      }),
    }
  );
}

// --- Enforce PR Decision ---
export async function enforcePR(decisions, payload) {
  if (!decisions || decisions.length === 0) return;
  if (!payload.pull_request) return;

  const [owner, repo] = payload.repository.full_name.split("/");
  const issue_number = payload.pull_request.number;
  const sha = payload.pull_request.head.sha;

  const token = await getInstallationToken();

  if (!token) {
    console.error("No installation token available");
    return;
  }

  // --- Build Comment ---
  const body = decisions
    .map(d => `**${d.contract}** -> ${d.decision}\n${d.reason}`)
    .join("\n\n");

  console.log("Posting comment as Manthan-OS");

  // --- Post Comment ---
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body }),
    }
  );

  const response = await res.json();
  console.log("GitHub response:", response);

  // --- Set Commit Status ---
  const failed = decisions.some(d => d.decision === "reject");

  const state = failed ? "failure" : "success";
  const description = failed
    ? "Manthan rejected PR"
    : "Manthan approved PR";

  await setCommitStatus(token, owner, repo, sha, state, description);
}