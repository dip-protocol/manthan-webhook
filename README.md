\# Manthan Webhook



Minimal, deterministic GitHub webhook ingestion service.
hki


\## Purpose



This service acts as the \*\*ingress layer\*\* for Manthan — a decision operating system.



It receives GitHub events (currently Pull Requests), validates them, normalizes them, and prepares them for deterministic decision processing.



\## Architecture



GitHub → Webhook → Normalize → (Decision Engine - next)



No decisions are made here.

No mutations happen here.

This layer is strictly responsible for \*\*trusted event intake\*\*.



\## Features



\* GitHub webhook endpoint (`/webhook`)

\* Signature verification (HMAC SHA256)

\* Deterministic event normalization

\* Lightweight, stateless service

\* Deployable on Fly.io



\## Endpoint



```

POST /webhook

```



Receives GitHub webhook payloads.



\## Example Normalized Event



```

{

&#x20; "event": "pull\_request",

&#x20; "repo": "dip-protocol/manthan-webhook",

&#x20; "action": "opened",

&#x20; "pr": 1,

&#x20; "timestamp": "2026-03-24T10:00:00Z"

}

```



\## Environment Variables



```

GITHUB\_SECRET=your\_webhook\_secret

PORT=8080

```



\## Run Locally



```

npm install

npm start

```



\## Deploy (Fly.io)



```

flyctl deploy

```



\## Design Principles



\* Deterministic behavior

\* No runtime mutation

\* Contract-driven evolution

\* Clear separation of concerns



\## Status



\* \[x] Webhook ingestion

\* \[x] Deployment (Fly.io)

\* \[ ] Decision engine

\* \[ ] Contract system

\* \[ ] PR enforcement



\## Next Step



Add decision engine:



\* Define contracts

\* Evaluate PR events

\* Produce deterministic decisions



\---



\*\*Manthan begins where decisions begin.\*\*



