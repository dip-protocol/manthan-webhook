export function diffDecisions(previous = null, current = null) {
  if (!previous || !current) {
    return {
      changed: false,
      message: "No previous decision to compare"
    };
  }

  const prevSummary = summarize(previous.decisions);
  const currSummary = summarize(current.decisions);

  // 🔥 No change
  if (prevSummary.finalDecision === currSummary.finalDecision) {
    return {
      changed: false,
      message: `No change (${currSummary.finalDecision})`
    };
  }

  // 🔥 Change detected
  return {
    changed: true,
    from: prevSummary.finalDecision,
    to: currSummary.finalDecision,
    reasons: currSummary.reasons,
    message: `Decision changed: ${prevSummary.finalDecision} → ${currSummary.finalDecision}`
  };
}

// --- helper ---
function summarize(decisions = []) {
  const rejects = decisions.filter(d => d.decision === "reject");

  return {
    finalDecision: rejects.length > 0 ? "reject" : "approve",
    reasons: rejects.map(d => d.reason)
  };
}