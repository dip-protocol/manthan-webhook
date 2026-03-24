import fetch from "node-fetch";
import jwt from "jsonwebtoken";

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

async function getInstallationToken() {
  const jwtToken = generateJWT(
    process.env.GITHUB_APP_ID,
    process.env.GITHUB_APP_PRIVATE_KEY
  );

  const res = await fetch(
    `https://api.github.com/app/installations/${process.env.GITHUB_INSTALLATION_ID}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  const data = await res.json();
  return data.token;
}

export async function enforcePR(decisions, payload) {
  if (!decisions || decisions.length === 0) return;

  const [owner, repo] = payload.repository.full_name.split("/");
  const issue_number = payload.pull_request.number;

  const token = await getInstallationToken();

  const body = decisions
    .map(d => `**${d.contract}** → ${d.decision}\n${d.reason}`)
    .join("\n\n");

  await fetch(
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
}