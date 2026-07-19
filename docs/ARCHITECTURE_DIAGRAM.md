# Architecture Diagram

```mermaid
flowchart TB
    U["Creator: Create Day 32"] --> UI["Mission Control UI"]
    UI --> CEO["CEO Brain"]
    CEO --> O["Deterministic Orchestrator"]
    O --> R["Research Agent"]
    R --> S["Script Agent"]
    S --> D["Devotional Agent"]
    D --> V["Voice Adapter"]
    V --> VD["Visual Director"]
    VD --> T["Thumbnail Adapter"]
    T --> SEO["SEO Agent"]
    SEO --> QC["QC Agent"]
    QC --> P["Upload Packager"]
    P --> Y["Ready for YouTube"]

    O <--> M["Mission Memory"]
    O --> H["Mission Health Engine"]
    H --> UI
    M --> UI

    OA["OpenAI provider — deferred"] -. future adapter .-> O
    EXT["Voice, image, YouTube — deferred"] -. future adapters .-> V
    EXT -. future adapters .-> T
    EXT -. creator-controlled action .-> Y
```

## Boundary

The deterministic orchestrator owns state, routing, dependencies, artifacts, and completion. Provider adapters execute specialized work later. The UI only renders validated engine state. External publishing never occurs inside the current demo.

