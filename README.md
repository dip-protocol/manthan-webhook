# 🧠 Manthan — Decision Operating System

> **Every decision is traceable, auditable, and built for trust.**

Manthan is a **deterministic decision engine** that evaluates pull requests and **enforces outcomes via GitHub itself**.

It doesn’t suggest.
It doesn’t warn.
It **decides — and GitHub enforces**.

---

# 🚀 What Manthan Does

```txt
Pull Request → Decision → Status → GitHub blocks/allows merge
```

Manthan converts repository events into **enforceable decisions**.

---

# ⚡ Core Capabilities

### Deterministic

* Same input → same output
* No AI, no randomness

### Enforced

* Decisions are not advisory
* GitHub enforces via status checks

### Auditable

* Append-only decision log
* Queryable via API

### Safe

* Idempotent webhook handling
* No duplicate execution

---

# 🧭 System Flow

```txt
Developer → GitHub → Webhook → Manthan → Decision → Save → Status → GitHub Enforcement
```

---

# 🔐 Enforcement Model

```txt
Manthan = Merge Gate
```

| Action      | Controlled |
| ----------- | ---------- |
| PR merge    | ✅ Yes      |
| Direct push | ❌ No       |

---

# 🧱 Mental Model

```txt
Manthan = Decision Engine + Enforcement Adapter
```

---

# 📡 API

```http
GET /
GET /decisions
```

---

# ⚙️ Setup

```bash
npm install
npm start
```

---

# 🔒 Branch Protection

* Require status checks
* Select `manthan/decision`
* Do not allow bypassing

---

# 🗺️ Roadmap (Capability Evolution)

This roadmap is not just features — it shows how Manthan evolves from:

```txt
Event Processor → Decision Engine → System of Record → Governance System
```

---

## 🟢 Phase 1 — Reaction (v0.x)

### ✅ v0.1 — Decision Trigger

* Webhook ingestion
* Deterministic evaluation
* PR comment feedback

👉 Outcome:

```txt
System reacts to PR events
```

---

### ✅ v0.2 — Enforcement

* Commit status integration
* Branch protection compatibility

👉 Outcome:

```txt
System decisions block merges
```

---

### ✅ v0.3 — Decision Logging

* Append-only log
* Structured records

👉 Outcome:

```txt
Decisions become observable
```

---

### ✅ v0.3.1 — Query Layer

* `/decisions` API
* Filterable history

👉 Outcome:

```txt
Decisions become inspectable
```

---

## 🟡 Phase 2 — Memory (v0.4 → v0.8)

### 🔜 v0.4 — Durable Storage

* Replace ephemeral storage
* Persistent decision store

👉 Outcome:

```txt
Decisions survive system lifecycle
```

---

### 🔜 v0.5 — Replay Engine

* Re-evaluate past decisions
* Time-based queries

👉 Outcome:

```txt
Any decision can be explained retroactively
```

---

### 🔜 v0.6 — Contract Versioning

* Versioned rule sets
* Backward compatibility

👉 Outcome:

```txt
Decisions are reproducible across time
```

---

### 🔜 v0.7 — Multi-Contract Resolution

* Parallel contract evaluation
* Conflict resolution strategy

👉 Outcome:

```txt
System handles complex rule sets deterministically
```

---

### 🔜 v0.8 — Cross-Repository Memory

* Org-wide decision visibility
* Shared contract enforcement

👉 Outcome:

```txt
Decisions scale beyond a single repository
```

---

## 🔵 Phase 3 — Authority (v1.0 → v1.3)

### 🔜 v1.0 — Decision System of Record

* Persistent + queryable + replayable
* Versioned + enforceable

👉 Outcome:

```txt
Manthan becomes the source of truth for decisions
```

---

### 🔜 v1.1 — Decision Graph

* Link decisions across events
* Track dependencies

👉 Outcome:

```txt
Understand causal chains of decisions
```

---

### 🔜 v1.2 — Policy Layer

* Define high-level policies
* Compile policies → contracts

👉 Outcome:

```txt
Humans define intent, system enforces rules
```

---

### 🔜 v1.3 — Continuous Governance

* Evaluate repository state continuously
* Detect drift from policies
* Trigger decisions without events

👉 Outcome:

```txt
System shifts from reactive → governing
```

---

## 🟣 Phase 4 — Intelligence (v1.4+)

*(Future, optional, and controlled)*

### 🔜 v1.4 — Decision Insights

* Aggregate patterns
* Surface systemic issues

### 🔜 v1.5 — Recommendation Layer (Non-authoritative)

* Suggest improvements
* DOES NOT affect decisions

👉 Constraint:

```txt
Decision engine remains deterministic
```

---

# ⚠️ Current Limitations

* Storage is ephemeral (pre-v0.4)
* No replay
* Single-repo scope

---

# 🧠 Philosophy

Most systems:

```txt
Code → CI → Humans decide
```

Manthan:

```txt
Code → Decision → System enforces
```

---

# 🏁 Current Version

```txt
Manthan v0.3.1
Status: Stable, Deterministic, Enforced
```

---

# 📜 License

MIT
