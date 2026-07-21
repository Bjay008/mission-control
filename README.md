# Mission Control

**Set the mission. Build momentum. Keep control.**

Mission Control keeps long-running missions moving by coordinating AI, tools, and people through clear, explainable decisions.

## Live experience

- [Launch the interactive Mission Control demo](https://mission-control-long-running.trees-net902.chatgpt.site)
- [View the OpenAI Build Week submission](https://devpost.com/software/mission-control-opjt7a)
- [Explore the public source repository](https://github.com/Bjay008/mission-control)

It brings three views of the same mission state together:

- **Momentum** gives participants a focused daily action, meaningful streaks, milestones, and recovery.
- **Mission** keeps purpose, outcomes, owners, risks, and the next step clear.
- **Control** makes AI activity, tool checks, evidence, handoffs, and human approvals explainable.

Momentum is what people feel. Mission Control is what keeps it real.

## Judge walkthrough (90 seconds)

1. Open the [live demo](https://mission-control-long-running.trees-net902.chatgpt.site) and choose **Enter cockpit**.
2. Use **Reset demo**, then open **Decisions** to inspect the owner, verified evidence, AI recommendation, consequences, and exact resume action.
3. Select **Approve & resume**. Mission Control updates the workflow, mission status, audit record, achievement, and next action from one shared state.
4. Switch between **Participant** and **Operator** to see the same mission expressed as human momentum and operational control.

## Proof of concept

Bible in 365 Days demonstrates the operating model. The mission moves through research, planning, generation, and Quality Control. Then it pauses intentionally—not because something failed, but because the next decision belongs to a human.

The live demo supports the complete journey: switch between participant and operator views, inspect shared mission state, review evidence, approve the pending decision, and watch the workflow, audit state, and next action update together.

## Built with Codex and GPT-5.6

Codex with GPT-5.6 acted as an implementation partner across product synthesis, interface engineering, quality assurance, and launch. It reconciled four working sessions into one canonical product model, refactored the experience around a typed shared mission state, implemented the role-aware cockpit and persistent decision flow, generated tests and submission documentation, and helped validate and deploy the public build.

The human product decisions stayed explicit: Mission Control is the product; Bible in 365 Days is the proof of concept; the defining interaction is a deliberate human approval after Quality Control; and the visual language connects warm violet momentum with precise green operational control.

Primary Codex build references:

- `019f84d8-beb9-7522-89a3-398ed035dd5a`
- `019f838b-9b05-7ff1-acdf-d53600284e8d`
- `019f83d8-3269-77e3-961c-79555d6cb5c4`
- `019f80f3-150b-75c1-bd9c-06716df78322`

## Technical implementation

- Next.js-compatible TypeScript interface deployed with OpenAI Sites.
- One typed mission model drives eight role-aware views.
- Browser-persistent demo state makes the human decision flow testable without credentials.
- Automated tests cover the shared state, approval transition, and critical copy.
- No API keys or test account are required for the public judging path.

## Operating system

Mission Control now defines a complete approval-to-notification control loop:

- Airtable records missions, decisions, experiments, and release-channel verification.
- Resend owns the transactional `mission.decision.required` notification boundary.
- The app remains the interactive source of shared mission state.
- A future OpenAI reasoning provider is bounded to recommendations and evidence; it cannot own irreversible decisions.
- Measurement starts with instrumentation and a baseline, not invented impact claims.

See the [operating-system contract](docs/operating-system.md) and [approval-to-notification pilot](docs/approval-notification-pilot.md).

## Product principles

- Every task has an owner.
- Every handoff has a reason.
- Every mission has a clear next step.

## Run locally

```bash
npm install
npm run dev
```

Validation:

```bash
npm test
npm run lint
```

## Product references

- [Canonical narration](docs/narration-script.md)
- [Product voice](docs/product-voice.md)
- [Dashboard copy](docs/dashboard-copy.md)
- [DevPost copy](docs/devpost.md)
- [Operating system](docs/operating-system.md)
- [Approval-to-notification pilot](docs/approval-notification-pilot.md)

## License

MIT — see [LICENSE](LICENSE).

Every mission deserves mission control.
