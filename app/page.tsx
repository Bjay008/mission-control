"use client";

import { useState } from "react";

const CANONICAL_LINE =
  "Mission control keeps long-running missions moving. by coordinating AI, tools and people, with clear, explainable decisions.";

const stages = [
  { name: "Research", detail: "Sources gathered", type: "AI + tools" },
  { name: "Planning", detail: "365-day structure", type: "AI" },
  { name: "Generation", detail: "Daily plan created", type: "AI" },
  { name: "Quality Control", detail: "Checks passed", type: "Tool" },
];

export default function Home() {
  const [approved, setApproved] = useState(false);

  return (
    <div className="site-shell">
      <aside className="rail" aria-label="Primary navigation">
        <a className="brand-mark" href="#top" aria-label="Mission Control home">
          MC
        </a>
        <nav className="rail-nav" aria-label="Page sections">
          <a className="rail-link is-active" href="#mission">
            <span>01</span>
            <span className="rail-label">Mission</span>
          </a>
          <a className="rail-link" href="#decision">
            <span>02</span>
            <span className="rail-label">Decision</span>
          </a>
          <a className="rail-link" href="#story">
            <span>03</span>
            <span className="rail-label">Story</span>
          </a>
        </nav>
        <div className="system-state">
          <span className="state-dot" />
          <span>System live</span>
        </div>
      </aside>

      <main id="top">
        <header className="topbar">
          <a className="wordmark" href="#top">
            Mission <span>Control</span>
          </a>
          <div className="topbar-meta">
            <span>Proof of concept</span>
            <span className="live-label"><i />All systems nominal</span>
          </div>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Orchestration for consequential work</p>
            <h1 id="hero-title">
              Every mission deserves <em>mission control.</em>
            </h1>
            <p className="canonical-line">{CANONICAL_LINE}</p>
            <a className="text-link" href="#mission">
              See the mission in motion <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="orbit" aria-label="Mission progress: day 174 of 365">
            <span className="orbit-node node-ai">AI</span>
            <span className="orbit-node node-tools">Tools</span>
            <span className="orbit-node node-human">Human</span>
            <div className="orbit-core">
              <strong>174</strong>
              <span>of 365 days</span>
              <small>in motion</small>
            </div>
          </div>
        </section>

        <section className="mission-section" id="mission" aria-labelledby="mission-heading">
          <div className="section-intro">
            <p className="eyebrow">Live demonstration</p>
            <h2 id="mission-heading">Bible in 365 days</h2>
            <p>The proof of concept is the mission. Mission Control is the product.</p>
          </div>

          <div className="mission-grid">
            <article className="panel workflow-panel">
              <div className="panel-header">
                <div>
                  <span className="micro-label">Active mission</span>
                  <h3>Bible in 365 days</h3>
                </div>
                <span className={`mission-status ${approved ? "is-running" : "is-paused"}`}>
                  <i />{approved ? "Running" : "Awaiting human"}
                </span>
              </div>

              <div className="progress-track" aria-label={approved ? "Mission resumed" : "Quality Control complete; human approval required"}>
                {[0, 1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={step < 4 || approved ? "progress-segment is-complete" : "progress-segment"}
                  />
                ))}
              </div>

              <div className="stage-list">
                {stages.map((stage, index) => (
                  <div className="stage-row" key={stage.name}>
                    <span className="stage-index">0{index + 1}</span>
                    <div className="stage-main">
                      <strong>{stage.name}</strong>
                      <span>{stage.detail}</span>
                    </div>
                    <span className="stage-owner">{stage.type}</span>
                    <span className="stage-state is-complete">Complete</span>
                  </div>
                ))}
                <div className={`stage-row is-next ${approved ? "is-active" : ""}`}>
                  <span className="stage-index">05</span>
                  <div className="stage-main">
                    <strong>Publish plan</strong>
                    <span>{approved ? "Execution resumed" : "Waiting for approval"}</span>
                  </div>
                  <span className="stage-owner">Mission Control</span>
                  <span className={`stage-state ${approved ? "is-running" : "is-waiting"}`}>
                    {approved ? "In progress" : "Next"}
                  </span>
                </div>
              </div>
            </article>

            <aside className={`panel decision-panel ${approved ? "is-approved" : ""}`} id="decision" aria-labelledby="decision-title">
              <div className="decision-signal">
                <span className="pause-symbol" aria-hidden="true">{approved ? "✓" : "Ⅱ"}</span>
                <span>{approved ? "Decision recorded" : "Human decision required"}</span>
              </div>
              <h3 id="decision-title">
                {approved ? "The mission is moving again." : "The mission is paused by design."}
              </h3>
              <p>
                {approved
                  ? "Approval and its reason are now part of the mission record. Execution has resumed with a clear next step."
                  : "After Quality Control, the mission pauses. Not because something failed, but because this decision belongs to a human."}
              </p>

              <dl className="decision-details">
                <div>
                  <dt>Owner</dt>
                  <dd>You</dd>
                </div>
                <div>
                  <dt>Reason</dt>
                  <dd>{approved ? "Plan approved for release" : "Human judgment required"}</dd>
                </div>
                <div>
                  <dt>Next step</dt>
                  <dd>{approved ? "Publish the reading plan" : "Review and approve continuation"}</dd>
                </div>
              </dl>

              <button
                className="approve-button"
                type="button"
                onClick={() => setApproved(true)}
                disabled={approved}
              >
                <span>{approved ? "Mission resumed" : "Approve & resume"}</span>
                <span aria-hidden="true">{approved ? "✓" : "→"}</span>
              </button>
              <p className="decision-footnote" aria-live="polite">
                {approved ? "Decision recorded. Mission resumed." : "Every handoff has a reason."}
              </p>
            </aside>
          </div>
        </section>

        <section className="principles" aria-label="Mission Control principles">
          <article>
            <span>01 / Ownership</span>
            <h3>Every task has an owner.</h3>
            <p>Responsibility stays visible across AI, tools, and people.</p>
          </article>
          <article>
            <span>02 / Reason</span>
            <h3>Every handoff has a reason.</h3>
            <p>Decisions remain explainable long after the work moves on.</p>
          </article>
          <article>
            <span>03 / Momentum</span>
            <h3>Every mission has a clear next step.</h3>
            <p>No lost context. No ambiguous state. No stalled momentum.</p>
          </article>
        </section>

        <section className="story-section" id="story" aria-labelledby="story-title">
          <div className="story-heading">
            <p className="eyebrow">One operating model</p>
            <h2 id="story-title">Built for work that outlives a single prompt.</h2>
          </div>
          <div className="story-grid">
            <article>
              <span className="story-number">01</span>
              <div>
                <p className="micro-label">The problem</p>
                <h3>Long-running work loses context.</h3>
                <p>Decisions become unclear, ownership fades, and teams lose momentum because no one knows what happens next.</p>
              </div>
            </article>
            <article className="signature-card">
              <span className="story-number">02</span>
              <div>
                <p className="micro-label">The signature moment</p>
                <h3>Not a failure. A human decision.</h3>
                <p>Mission Control knows when execution should stop, who owns the decision, and exactly what resumes after approval.</p>
              </div>
            </article>
            <article>
              <span className="story-number">03</span>
              <div>
                <p className="micro-label">The vision</p>
                <h3>Any complex mission can keep moving.</h3>
                <p>Today it is Bible in 365 days. Tomorrow it could be a product launch, a research project, or what comes next.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="closing" aria-labelledby="closing-title">
          <p className="eyebrow">Mission Control</p>
          <h2 id="closing-title">Every mission deserves mission control.</h2>
          <p className="canonical-line">{CANONICAL_LINE}</p>
          <a className="closing-link" href="#mission">Return to the mission <span aria-hidden="true">↑</span></a>
        </section>

        <footer>
          <span>Mission Control</span>
          <span>Clear owner. Clear reason. Clear next step.</span>
        </footer>
      </main>
    </div>
  );
}
