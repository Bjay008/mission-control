# DevPost Submission Draft

## Project name

Mission Control

## Tagline

Every mission deserves Mission Control.

## One-line pitch

Mission Control turns one creator command into a governed, traceable production workflow across specialized AI agents, tool adapters, and creator-controlled external actions.

## Inspiration

AI can generate individual pieces of work, but creators still coordinate prompts, tools, decisions, failures, approvals, and handoffs themselves. The missing layer is not another chatbot. It is mission control: one place that knows the objective, owns the critical path, explains responsibility, and keeps execution moving.

## What it does

The judged demo begins with one command:

> Create Day 32.

CEO Brain organizes a ten-stage episode company and routes accepted outputs through Research, Script, Devotional, Voice, Visual, Thumbnail, SEO, QC, and Upload Package. The audience watches each specialist activate, complete its contract, and hand its artifact to the next owner. Mission health, progress, decisions, and activity update from the same deterministic state.

The workflow finishes at **Ready for YouTube**. Mission Control deliberately stops before the creator-controlled external upload.

## How we built it

- A source-controlled mission contract defines stages, executors, dependencies, weights, and output artifacts.
- A deterministic orchestration engine validates the command, starts CEO Brain, completes one eligible stage at a time, creates inspectable artifacts, and routes the next owner.
- The original governance engine independently recalculates health and progress and validates saved state.
- A responsive browser interface renders engine state live; it never maintains a separate fake progress model.
- Demo-mode media stages produce honest adapter manifests until external providers and the OpenAI API key are configured.

## What makes it different

Most agent demos emphasize autonomous action. Mission Control emphasizes governed continuity:

- clear mission health
- explicit ownership
- explainable routing
- inspectable artifacts
- durable decisions and activity
- an honest boundary between demo adapters and real external actions

## Challenges

The hardest design decision was resisting the promise that AI can do everything. We separated orchestration from execution providers. That made the demo reliable today while preserving clean adapters for OpenAI, voice, image, and publishing services later.

## Accomplishments

- one command runs the complete frozen critical path
- ten stages produce ten inspectable artifact contracts
- the original approval and governance loop remains tested
- the Day 32 run reaches 100% and persists across refresh
- reset, mobile responsiveness, and browser error checks are automated
- external publishing remains creator-controlled

## What we learned

Trust comes from making invisible coordination visible. Users need to know what is happening, why a specific executor owns it, whether the mission is healthy, and what happens next.

## What's next

Add the OpenAI provider behind the tested orchestration contract, then connect production voice, image, and YouTube adapters without changing the frozen mission-governance rules.

## Demo

1. Open Mission Control.
2. Show the command `Create Day 32.`
3. Select **Create Episode** once.
4. Watch the ten-stage company execute.
5. Finish on **Ready for YouTube** and the `upload-package.json` artifact.

## Repository

https://github.com/Bjay008/mission-control

