import fetch from "node-fetch";
import jwt from "jsonwebtoken";

// --- Generate JWT ---
function generateJWT(appId, privateKey) {
  return jwt.sign(
    {
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 600,
      iss: appId,
    },
    privateKey,
    { algorithm: "RS256" }
  );
}

// --- Get Installation Token ---
async function getInstallationToken() {
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_INSTALLATION_ID;
  const rawKeyBase64 = process.env.GITHUB_APP_PRIVATE_KEY_BASE64;

  if (!appId || !installationId || !rawKeyBase64) {
    console.error("Missing GitHub App environment variables");
    return null;
  }

  try {
    const privateKey = Buffer
      .from(rawKeyBase64, "base64")
      .toString("utf-8");

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

  } catch (err) {
    console.error("Error generating installation token:", err);
    return null;
  }
}

// --- Set Commit Status ---
async function setCommitStatus(token, owner, repo, sha, state, description) {
  console.log("🚀 Setting status:", state, sha);

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/statuses/${sha}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state,
        context: "manthan/decision",
        description,
      }),
    }
  );

  const data = await res.json();
  console.log("📊 Status response:", data);

  if (!res.ok) {
    console.error("❌ Failed to set commit status");
  }
}

// --- Enforce PR Decision ---
export async function enforcePR(decisions, payload) {

  // ✅ Safety fallback
  if (!Array.isArray(decisions) || decisions.length === 0) {
    console.log("❌ NO DECISIONS");

    decisions = [
      {
        contract: "SYSTEM_FALLBACK",
        decision: "reject",
        reason: "No decisions generated"
      }
    ];
  } else {
    console.log("✅ USING REAL DECISIONS");
  }

  const [owner, repo] = payload.repository.full_name.split("/");
  const issue_number = payload.pull_request.number;
  const sha = payload.pull_request.head.sha;

  const token = await getInstallationToken();

  if (!token) {
    console.error("❌ No installation token");
    return;
  }

  const hasReject = decisions.some(d => d.decision === "reject");

  // --- Post Comment ---
  await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: JSON.stringify(decisions, null, 2)
      }),
    }
  );

  console.log("💬 Comment posted");

  // --- Set Commit Status ---
  await setCommitStatus(
    token,
    owner,
    repo,
    sha,
    hasReject ? "failure" : "success",
    hasReject ? "Manthan rejected PR" : "Manthan approved PR"
  );
}