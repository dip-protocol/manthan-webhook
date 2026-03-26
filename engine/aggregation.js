export function aggregateDecisions(decisions = []) {
  if (!decisions || decisions.length === 0) {
    return {
      finalDecision: "reject",
      reasons: ["No decisions produced"],
      total: 0
    };
  }

  const rejects = decisions.filter(d => d.decision === "reject");

  return {
    finalDecision: rejects.length > 0 ? "reject" : "approve",
    reasons: rejects.map(d => d.reason),
    total: decisions.length
  };
}