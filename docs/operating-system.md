# Mission Control operating system

Mission Control is a human decision layer for long-running, AI-assisted work. It keeps the product, evidence, people, and publication channels synchronized around one mission state.

## Control loop

1. **Observe** — ingest mission status, blockers, evidence, and owner.
2. **Classify** — separate routine execution from work that requires judgment.
3. **Pause intentionally** — create a decision packet when automation reaches a human boundary.
4. **Notify** — publish a decision-required event to Resend.
5. **Decide** — approve, request revision, reject, or delegate.
6. **Resume** — update the shared mission state and exact next action.
7. **Record** — persist the outcome in Airtable and the product audit trail.
8. **Learn** — evaluate decision latency, completeness, reversals, and delivery failures.

## System of record

The Airtable control plane has four deliberately small tables:

- **Missions** — status, human-needed state, owner, next action, progress, and source.
- **Decisions** — decision state, mission, owner, reason, action URL, and notification readiness.
- **Experiments** — hypothesis, KPI, guardrail, evidence, and decision.
- **Releases** — publication channel, URL, status, and verification notes.

The app remains the interactive mission experience. Airtable is the operational ledger across channels.

## Resend boundary

Mission Control emits `mission.decision.required` only when a mission is paused for a human. The event maps to the published **Mission Control — Decision Required** template.

Required payload:

```json
{
  "MISSION_NAME": "string",
  "DECISION_TITLE": "string",
  "WHY_NOW": "string",
  "OWNER": "string",
  "EVIDENCE_SUMMARY": "string",
  "ACTION_URL": "https://...",
  "DECISION_ID": "string"
}
```

No marketing broadcast is implied. The notification is transactional, owner-specific, and traceable to a decision record. The automation should remain disabled until a real recipient/contact contract and end-to-end delivery test are approved.

## OpenAI provider boundary

The public judging path stays credential-free and deterministic. A future OpenAI-backed reasoning provider should be additive:

- accept a bounded mission snapshot and evidence references;
- return a typed recommendation, confidence label, rationale, and missing-evidence list;
- never execute an irreversible action;
- always hand final judgment to the existing decision controls;
- log the model output as evidence, not as authority.

This preserves the product's defining principle: AI can prepare the decision; a person owns the decision.

## Release closure

A release is complete only when the canonical public video URL is verified in YouTube, DevPost, GitHub, Airtable, and the relevant Resend content. Until then, the release ledger must remain blocked rather than claiming completion.
