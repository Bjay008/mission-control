export type ViewId = "today" | "missions" | "momentum" | "control" | "decisions" | "evidence" | "team" | "insights";
export type DecisionState = "pending" | "approved" | "revision" | "rejected" | "delegated";
export const MISSION = { title: "Bible in 365 Days", purpose: "Turn a meaningful year-long objective into a safe, visible daily rhythm.", stages: [
  { name: "Research", owner: "AI + tools", pending: false }, { name: "Planning", owner: "AI", pending: false }, { name: "Generation", owner: "AI", pending: false }, { name: "Quality Control", owner: "Verification tool", pending: false }, { name: "Publish Plan", owner: "Mission Control", pending: true },
] } as const;
export const PRINCIPLES = ["Every task has an owner", "Every handoff has a reason", "Every mission has a clear next step"] as const;
export const EVIDENCE = [
  { title: "Source coverage report", source: "Research agent", step: "Research", status: "Verified" }, { title: "365-day sequence", source: "Planning agent", step: "Planning", status: "Verified" }, { title: "Completeness check", source: "Quality tool", step: "Quality Control", status: "Verified" }, { title: "Human approval record", source: "Mission owner", step: "Publish Plan", status: "Pending" },
] as const;
export const ACTORS = [
  { initials: "YO", kind: "Human", name: "Mission owner", role: "Accountable for publish decisions", status: "Decision ready" }, { initials: "RA", kind: "Agent", name: "Research agent", role: "Source discovery and synthesis", status: "Complete" }, { initials: "PA", kind: "Agent", name: "Planning agent", role: "Mission sequencing and dependencies", status: "Complete" }, { initials: "QC", kind: "Tool", name: "Quality control", role: "Coverage and integrity verification", status: "Healthy" },
] as const;
export const INSIGHT_METRICS = [
  { value: "1.4×", label: "Mission velocity", note: "Clear handoffs are reducing idle time.", fill: "78%" }, { value: "11m", label: "Decision turnaround", note: "Human checkpoints are concise and contextual.", fill: "64%" }, { value: "0", label: "Unresolved blockers", note: "The current pause is intentional, not blocked.", fill: "100%" }, { value: "100%", label: "Owner coverage", note: "Every active task has explicit accountability.", fill: "100%" },
] as const;
