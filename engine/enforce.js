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

  let privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  // 🔥 CRITICAL FIX (handles Fly + PEM formatting)
  privateKey = privateKey
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "");

  if (!appId || !privateKey || !installationId) {
    console.error("Missing GitHub App environment variables");
    return null;
  }

  if (!privateKey.includes("BEGIN RSA PRIVATE KEY")) {
    console.error("Invalid private key format");
    return null;
  }

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

// --- Enforce PR Decision ---
export async function enforcePR(decisions, payload) {
  if (!decisions || decisions.length === 0) return;
  if (!payload.pull_request) return;

  const [owner, repo] = payload.repository.full_name.split("/");
  const issue_number = payload.pull_request.number;

  const token = await getInstallationToken();

  if (!token) {
    console.error("No installation token available");
    return;
  }

  const body = decisions
    .map(d => `**${d.contract}** -> ${d.decision}\n${d.reason}`)
    .join("\n\n");

  console.log("Posting comment as Manthan-OS");

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
}