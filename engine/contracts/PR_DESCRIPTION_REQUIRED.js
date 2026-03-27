const PR_DESCRIPTION_REQUIRED = {
  id: "PR_DESCRIPTION_REQUIRED",
  version: "v1.0.0",

  evaluate: (payload) => {
    const body = payload.pull_request?.body;

    if (!body || body.trim().length === 0) {
      return {
        contract: "PR_DESCRIPTION_REQUIRED",
        version: "v1.0.0",
        decision: "reject",
        reason: "PR must have a description"
      };
    }

    return {
      contract: "PR_DESCRIPTION_REQUIRED",
      version: "v1.0.0",
      decision: "approve",
      reason: "Description present"
    };
  }
};

module.exports = { PR_DESCRIPTION_REQUIRED };