# Hackathon Sprint

## Submission outcome

Ship one polished, reliable demonstration of mission governance using Bible in 365 Days as the proof of concept.

## Priority order

1. One polished Mission Control dashboard.
2. One reliable Bible 365 demo mission.
3. One visible human handoff.
4. One continuation after approval.
5. One clear mission-health calculation.
6. One rehearsed three-minute demo.
7. Submission materials and a backup recording.

## Current status

- [x] Dashboard shell and responsive presentation
- [x] Bible 365 source mission and capability-aware routing
- [x] Data-driven approval and request-changes transitions
- [x] Explainable mission-health calculation
- [x] Revision-safe local persistence and reset
- [x] Automated engine and data-contract tests
- [x] Final browser smoke test after the Codex runtime update
- [ ] Rehearsed demo, backup recording, and submission package

## Build sequence

### Checkpoint 1 â€” Dashboard shell

- Load `data/demo-mission.json`.
- Render mission identity, health, confidence, progress, stage, blockers, and next action.
- Render tasks with executor, status, reason, and next action.
- Render recent activity and decisions.

**Exit criterion:** A new viewer can answer â€œAre we on track, what is blocked, and what happens next?â€ within five seconds.

### Checkpoint 2 â€” Governance loop

- Add the human approval panel.
- Implement approve and request-changes actions.
- Update task states, health, confidence, activity, and next action after approval.
- Add a deterministic reset action.

**Exit criterion:** The full handoff-and-continuation loop works repeatedly without network access.

### Checkpoint 3 â€” Product polish

- Clarify information hierarchy and responsive layout.
- Add useful empty, loading, and error states.
- Make executor types and risk immediately distinguishable.
- Ensure keyboard access and readable contrast.

**Exit criterion:** The centerpiece screen feels coherent and presentation-ready.

### Checkpoint 4 â€” Submission

- Rehearse until the demo is consistently under three minutes.
- Record a clean backup demo.
- Capture screenshots and write the submission description.
- Run a final smoke test from a clean start.

**Exit criterion:** Live demo, backup video, and submission copy are ready.

## Post-hackathon backlog

The following are explicitly deferred:

- live YouTube publishing
- production image-generation integration
- generalized agent marketplace
- multi-mission portfolio views
- user accounts, organizations, and billing
- complex permissions and enterprise administration
- autonomous background execution
- native mobile applications
- Weekend Planner features
- unrelated Bible 365 production enhancements

## Scope rule

If a feature does not make mission health, capability-aware routing, human control, or continuation clearer in the three-minute demo, it waits.

