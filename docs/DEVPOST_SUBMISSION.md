# DevPost submission - Mission Control

## Project name and tagline

**Mission Control** - Every mission deserves Mission Control.

## One-line pitch

Mission Control turns one creator command into a governed, traceable workflow across specialized AI roles, tool adapters, and accountable human decisions.

## Inspiration

AI can generate individual pieces of work, but people still coordinate prompts, tools, failures, approvals, and handoffs themselves. The missing layer is not another chatbot. It is one place that knows the objective, owns the critical path, explains responsibility, remembers decisions, and keeps execution moving.

## What it does

The judged demo begins with `Create Day 32.` CEO Brain routes accepted outputs through Research, Script, Devotional, Voice, Visual, Thumbnail, SEO, QC, and Upload Package. Every stage exposes its executor, routing reason, state, and inspectable artifact contract.

After QC, Mission Control pauses at 86%. Upload Package is blocked, the dashboard says a human is needed, and the creator sees why. Only after **Approve & continue** does the system record the decision, clear the blocker, activate Upload Package, and reach 100% **Ready for YouTube**. It prepares a creator-controlled handoff; it does not publish externally.

## How we built it

- A source-controlled contract defines stages, executors, dependencies, progress weights, approval policy, and artifacts.
- A deterministic engine completes one eligible stage at a time, pauses after QC, and resumes only after approval.
- Mission health, confidence, blockers, human need, and the next action are recalculated from the same state.
- Browser persistence preserves the approved mission after refresh.
- The responsive dashboard renders engine state directly, without a separate fake progress model.

## What makes it different

Most agent demos emphasize autonomous action. Mission Control emphasizes governed continuity: visible health, capability-aware ownership, explainable routing, inspectable artifacts, durable decisions, and an explicit human-control boundary. The reusable product is the governance kernel, not the Bible-specific content.

## Accomplishments

- nine stages complete before a visible creator checkpoint
- the workflow pauses at 86% with Upload Package blocked
- approval is recorded in decisions and recent activity
- Upload Package completes only after approval
- the mission reaches 100% Ready for YouTube
- 11 deterministic tests pass
- browser verification passes with persistence, zero console errors, and no mobile overflow
- a three-minute demo and seven-slide system-design deck are complete

## How Codex was used

Codex helped recover and inspect the repository, implement and test the orchestration and approval transitions, verify the live browser path, repair the capture workflow, record the product demo, and produce the judge-facing system-design materials. Implementation task: `019f79dd-2eef-7551-92ee-1d9ac904481a`.

## What's next

Add the OpenAI provider behind the tested contract, then connect production voice, image, and YouTube adapters without changing the governance rules. Expand the mission schema so the same kernel can govern additional long-running workflows.

## Exact demo click path

1. Confirm `Create Day 32.` and select **Create Episode**.
2. Watch CEO through QC complete.
3. At 86%, show the human requirement, blocker, approval reason, and blocked Upload Package.
4. Select **Approve & continue**.
5. Show the recorded approval and resumed Upload Package.
6. Finish at 100% **Ready for YouTube** with `upload-package.json`.

## Repository

https://github.com/Bjay008/mission-control
