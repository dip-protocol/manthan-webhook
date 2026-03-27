const { CONTRACTS } = require("./contractsIndex");

function runDecisionEngine(event, payload) {
  try {
console.log("EVENT RECEIVED:", event);

    // --- Non PR fallback ---
    if (event !== "pull_request") {
      const decision = [
        {
          contract: "NON_PR_EVENT",
          version: "v1.0.0",
          decision: "approve",
          reason: "Non-PR event ignored"
        }
      ];

      console.log("NON-PR DECISION:", decision);
      return decision;
    }

    console.log("Running contracts:", CONTRACTS.map(c => c.id));

    const results = CONTRACTS.map((contract) => {
      try {
        const result = contract.evaluate(payload);

        const decision = {
          contract: contract.id,
          version: contract.version,
          decision: result.decision,
          reason: result.reason || ""
        };

        console.log(`Contract ${contract.id}:`, decision);

        return decision;
      } catch (err) {
        console.error(`Contract failed: ${contract.id}`, err);

        return {
          contract: contract.id,
          version: contract.version,
          decision: "reject",
          reason: "Contract execution failed"
        };
      }
    });

    // --- Fallback ---
    if (!results || results.length === 0) {
      const fallback = [
        {
          contract: "SYSTEM_FALLBACK",
          version: "v1.0.0",
          decision: "reject",
          reason: "No contracts produced a decision"
        }
      ];

      console.warn("FALLBACK TRIGGERED:", fallback);
      return fallback;
    }

    console.log("FINAL DECISIONS:", results);

    return results;

  } catch (err) {
    console.error("Decision engine error:", err);

    return [
      {
        contract: "SYSTEM_ERROR",
        version: "v1.0.0",
        decision: "reject",
        reason: "Decision engine failure"
      }
    ];
  }
}

module.exports = { runDecisionEngine };