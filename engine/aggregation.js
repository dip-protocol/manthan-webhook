export function aggregate(decisions) {
  if (!decisions || decisions.length === 0) {
    return {
      finalDecision: "reject",
      reason: "No decisions available"
    };
  }

  const hasReject = decisions.some(d => d.decision === "reject");

  return {
    finalDecision: hasReject ? "reject" : "approve",
    reason: hasReject
      ? "At least one contract failed"
      : "All contracts passed"
  };
}