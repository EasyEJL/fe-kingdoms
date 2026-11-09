# Project documentation

These documents explain the current project and the reasons behind it. They were first recorded on 2026-11-09, after the playable prototype and first playtest revision existed. They are not a complete contemporaneous history of that earlier work.

- [Development workflow](development.md): local Git, launch, tests, files and review boundaries.
- [Validation baseline](validation.md): what was checked and what still needs playtesting.
- [Development history](history.md): a short reconstructed pre-Git summary.
- [Future direction](roadmap.md): medieval Risk and a later hex map, clearly separated from implemented work.
- [ADR 0001: Fe authority and a thin browser adapter](adr/0001-fe-authority.md).
- [ADR 0002: Deterministic bounded rules and replay](adr/0002-deterministic-rules-replay.md).
- [ADR 0003: Explicit two-order turn handoff](adr/0003-explicit-turn-handoff.md).
- [ADR 0004: Pinned local toolchain and verification](adr/0004-local-toolchain-verification.md).

- [ADR 0005: True axial hexes and versioned replay](adr/0005-axial-hexes-versioned-replay.md).

- [ADR 0006: Campaign maps, settlements and food](adr/0006-campaign-economy.md).

- [Guided Fe walkthrough](engine-guide.md).
- [Native protocol](protocol.md).

## Maintaining decisions

Add an ADR for a meaningful architectural or rules decision, not every implementation edit. State its status, context, decision, consequences and supporting code or tests. Mark proposals as proposed until chosen. If a later decision replaces an accepted one, keep the old record and link the replacement. Update development and validation notes when the commands or evidence change.
