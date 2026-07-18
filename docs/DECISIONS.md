# Decision Log

## Locked product decisions

| Decision | Choice | Rationale |
|---|---|---|
| Product name | Mission Control | Immediately communicates oversight, visibility, health, and coordinated action. |
| Tagline | Every mission deserves Mission Control. | Expresses the broader category while remaining memorable. |
| Proof of concept | Bible in 365 Days | A concrete, long-running mission with varied work, dependencies, tools, and human judgment. |
| Category | AI mission governance and continuity | Differentiates the product from chatbots, task managers, and agent frameworks. |
| Core differentiation | Mission health, capability-aware routing, explainable handoffs, and human control | Makes mission state and responsibility visible rather than merely automating tasks. |
| Centerpiece | Mission Control dashboard | Judges must understand the product in five seconds. |
| Executor model | AI, connected tools, and humans are first-class executors | The product does not claim total autonomous execution. |
| MVP proof | One complete handoff and continuation loop | A reliable vertical slice is stronger than broad but shallow automation. |
| Initial data source | `data/demo-mission.json` | Enables a deterministic, inspectable, low-risk demo. |
| Health calculation | Source-controlled task weights and risk deductions | Keeps the score explainable, reproducible, and independent of UI code. |
| Demo persistence | Revision-safe browser storage | Preserves progress across refreshes without adding a fragile backend. |
| Live integrations | Deferred | Avoids demo fragility and keeps effort on the signature experience. |

## Decision rule

Every proposed feature must answer: Does this make the mission’s health, ownership, blocker, or next move clearer? If not, move it to the post-hackathon backlog.

