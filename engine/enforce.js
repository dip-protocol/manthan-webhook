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
        state,
        description,
        context: "manthan/decision",
      }),
    }
  );
}

// --- Enforce PR Decision ---
export async function enforcePR(decisions, payload) {
  if (!decisions || decisions.length === 0) return;

  const isPR = !!payload.pull_request;

  // Allow push events
  if (!isPR && !payload.after) return;

  const [owner, repo] = payload.repository.full_name.split("/");
  const issue_number = payload.pull_request?.number;
  const sha = payload.pull_request?.head?.sha || payload.after;

  const token = await getInstallationToken();

  if (!token) {
    console.error("No installation token available");
    return;
  }

  // --- Build Comment ---
  const failedCount = decisions.filter(d => d.decision === "reject").length;
  const passedCount = decisions.length - failedCount;

  const body = `
## 🤖 Manthan OS — Decision Report

### ${failedCount > 0 ? "❌ REJECTED" : "✅ APPROVED"}

${failedCount > 0 
  ? "Some checks failed. Please review the details below."
  : "All checks passed. This PR meets the required contracts."
}

---

### 📊 Summary
- Total checks: ${decisions.length}
- Failed: ${failedCount}
- Passed: ${passedCount}

---

<details>
<summary><strong>🔍 View detailed decision breakdown</strong></summary>

${decisions.map(d => {
  const isReject = d.decision === "reject";

  return `
### ${isReject ? "❌ REJECTED" : "✅ APPROVED"} — ${d.contract}

**Reason:**  
${d.reason}

${isReject ? `**Action Required:**  
- Fix the issue above and update the PR` : ""}
`;
}).join("\n")}

</details>

---

_Manthan enforces deterministic PR decisions using predefined contracts._
`;

  console.log("🚀 Posting comment as Manthan-OS");

  // --- Post Comment (PR only) ---
  if (issue_number) {
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
    console.log("💬 GitHub comment response:", response);
  }

  // --- Set Commit Status ---
  const failed = decisions.some(d => d.decision === "reject");

  const state = failed ? "failure" : "success";
  const description = failed
    ? "Manthan rejected PR"
    : "Manthan approved PR";

  await setCommitStatus(token, owner, repo, sha, state, description);
}