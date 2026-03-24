export async function enforcePR(decisions, payload) {
  if (!decisions || decisions.length === 0) return;

  const repoFull = payload.repository.full_name;
  const [owner, repo] = repoFull.split("/");
  const issue_number = payload.pull_request.number;

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.log("No GITHUB_TOKEN set");
    return;
  }

  const body = decisions
    .map(d => `**${d.contract}** → ${d.decision}\n${d.reason}`)
    .join("\n\n");

  await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/comments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body })
  });
}