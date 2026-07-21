# Approval-to-notification pilot

## Decision question

Does a structured decision packet plus owner-specific notification reduce ambiguous follow-up at human decision boundaries?

## Hypothesis

When a mission pauses with a named owner, a concise reason, verified evidence, and one review action, decision cycles will complete more reliably and with less delay than an unstructured handoff.

## Primary KPI

**Decision cycle completion rate**

```
resolved decisions / decisions created
```

A decision is resolved only when it has a terminal human action and the mission receives a next state.

## Driver metrics

- **Decision latency:** median time from decision creation to terminal human action.
- **Evidence completeness:** decisions containing owner, reason, evidence summary, and action URL / all decisions.
- **Notification delivery success:** delivered decision notifications / notifications attempted.

## Guardrails

- **Reopen or reversal rate:** resolved decisions reopened or reversed / resolved decisions.
- **Notification failure rate:** failed or suppressed notifications / notifications attempted.
- **Unowned decision rate:** decisions without an accountable owner / decisions created.
- **Unauthorized action count:** irreversible actions taken without the recorded human decision; target is always zero.

## Instrumentation contract

Record `decision.created`, `decision.notification.requested`, `decision.notification.delivered`, `decision.resolved`, and `mission.resumed` with one shared decision ID. Store timestamps in UTC and report the user-facing timezone separately.

## Analysis plan

Start with an instrumentation-only pilot. Do not set a numeric improvement target until a baseline exists. Report cohort size, missing events, delivery failures, median latency, completion rate, and reversal rate. A functional demo proves state transitions; it does not prove real-world adoption or causal impact.

## Decision rule

Proceed from pilot to a broader rollout only when event coverage is complete enough to trust the metrics, no unauthorized actions occur, and delivery failures are understood. Otherwise iterate on the control loop and measurement before scaling.
