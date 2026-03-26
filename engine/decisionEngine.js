import { CONTRACTS } from "./contractsIndex.js";

export function runDecisionEngine(event, payload) {
  try {
    // Only process PR events
    if (event !== "pull_request") {
      return [];
    }

    const results = CONTRACTS.map((contract) => {
      try {
        const result = contract.evaluate(payload);

        return {
          contract: contract.id,
          version: contract.version,
          decision: result.decision,
          reason: result.reason || ""
        };
      } catch (err) {
        return {
          contract: contract.id,
          version: contract.version,
          decision: "reject",
          reason: "Contract execution failed"
        };
      }
    });

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