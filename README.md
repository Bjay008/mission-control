# Mission Control

**Every mission deserves Mission Control.**

Mission Control helps people turn long-running missions into completed outcomes by coordinating AI agents, connected tools, and human decisions in one continuous workflow.

## The problem

AI can generate plans and content, but people still have to coordinate tools, remember decisions, identify blockers, manage approvals, and decide what happens next.

## The solution

Mission Control provides:

- mission health
- task ownership
- capability-aware routing
- visible blockers
- human approval gates
- decision history
- persistent mission context
- a clear next action

## Proof of concept

Bible in 365 Days demonstrates the system through a real content-production mission involving research, scripting, devotional writing, voiceover preparation, visual planning, thumbnails, SEO, quality control, and publishing.

## Core principle

**The right work goes to the right executor at the right time.**

## Foundation

- [Vision and MVP](docs/VISION_AND_MVP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Three-minute demo](docs/DEMO_SCRIPT.md)
- [Hackathon sprint](docs/HACKATHON_SPRINT.md)
- [Locked decisions](docs/DECISIONS.md)
- [Demo mission data](data/demo-mission.json)
- [Autonomous episode pipeline](data/episode-pipeline.json)

## Run the dashboard

The dashboard has no external runtime dependencies. From PowerShell in the repository root, run:

```powershell
.\start-dashboard.ps1
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

The page reads `data/episode-pipeline.json` directly. Select **Create Episode** once to run the frozen CEO → Research → Script → Devotional → Voice → Visual → Thumbnail → SEO → QC → Upload Package workflow. Use **Reset demo** to restore the original source state.

The current runtime is deliberately deterministic. Voice, thumbnail, and upload stages produce inspectable adapter contracts; they do not claim external media rendering or publishing. The OpenAI adapter and API key are deferred until after the hackathon-critical flow is stable.

### Dashboard behavior

- summarizes mission health, confidence, progress, stage, schedule, and momentum
- makes the blocker and recommended next action immediately visible
- explains task ownership across AI agents, connected tools, and humans
- starts the complete ten-stage production workflow from one command
- routes one accepted artifact into the next executor automatically
- recalculates mission health from deterministic task progress and risk signals
- preserves orchestration decisions and stage completion in mission memory
- stops at a creator-controlled upload package instead of publishing externally
- restores compatible saved progress after a browser refresh
- supports desktop and mobile layouts

Run the deterministic engine and data-contract tests with:

```powershell
npm.cmd test
```

With the dashboard server running, execute the real-browser smoke test with:

```powershell
npm.cmd run verify:browser
```

## Next engineering priority

Add the OpenAI adapter and secure API key behind the tested orchestration contract; do not change the frozen UI or deterministic governance rules.

