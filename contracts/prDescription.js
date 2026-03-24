export const prDescriptionContract = {
  id: "PR_DESCRIPTION_REQUIRED",

  intent: "PR must have a description",

  evaluate: (payload) => {
    const body = payload.pull_request?.body;

    if (!body || body.trim() === "") {
      return {
        decision: "reject",
        reason: "PR must have a description"
      };
    }

    return {
      decision: "approve",
      reason: "Valid PR"
    };
  }
};