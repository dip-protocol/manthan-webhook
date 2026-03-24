import { prDescriptionContract } from "../contracts/prDescription.js";

const contracts = [prDescriptionContract];

export function runDecisionEngine(event, payload) {
  if (event !== "pull_request") {
    return null;
  }

  const results = [];

  for (const contract of contracts) {
    const result = contract.evaluate(payload);

    results.push({
      contract: contract.id,
      ...result
    });
  }

  return results;
}