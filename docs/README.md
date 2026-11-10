# Project documentation

These documents explain the current project and the reasons behind it. They were first recorded on 2026-11-09, after the playable prototype and first playtest revision existed. They are not a complete contemporaneous history of that earlier work.

- [Development workflow](development.md): local Git, launch, tests, files and review boundaries.
- [Validation baseline](validation.md): what was checked and what still needs playtesting.
- [Development history](history.md): a short reconstructed pre-Git summary.
- [Future direction](roadmap.md): implemented hex campaigns and optional future ideas, clearly separated.
- [ADR 0001: Fe authority and a thin browser adapter](adr/0001-fe-authority.md).
- [ADR 0002: Deterministic bounded rules and replay](adr/0002-deterministic-rules-replay.md).
- [ADR 0003: Explicit two-order turn handoff](adr/0003-explicit-turn-handoff.md).
- [ADR 0004: Pinned local toolchain and verification](adr/0004-local-toolchain-verification.md).

- [ADR 0005: True axial hexes and versioned replay](adr/0005-axial-hexes-versioned-replay.md).

- [ADR 0006: Campaign maps, settlements and food](adr/0006-campaign-economy.md).

- [Guided Fe walkthrough](engine-guide.md).
- [Native protocol](protocol.md).

- [ADR 0007: Mixed troop roles](adr/0007-mixed-troop-roles.md).

- [ADR 0008: Isolated visual map](adr/0008-isolated-visual-map.md).

- [ADR 0009: Campaign round review](adr/0009-campaign-round-review.md).

## Maintaining decisions

Add an ADR for a meaningful architectural or rules decision, not every implementation edit. State its status, context, decision, consequences and supporting code or tests. Mark proposals as proposed until chosen. If a later decision replaces an accepted one, keep the old record and link the replacement. Update development and validation notes when the commands or evidence change.

- [ADR 0010: Fixed rivers and supply forecasts](adr/0010-fixed-rivers-supply-previews.md).

- [V6 simulated-player playtest and replays](playtests/2026-11-09-v6.md): two complete model-versus-Fe matches, with limits distinguished from human/browser validation.

- [Local Fe demonstration and readiness checklist](demo-readiness.md): a reproducible engine demonstration, evidence boundaries and unresolved contest requirements.

- [V6 capital-threat audit](tactical-review-v6.md): bounded native evidence for two-order defense, with Easy/Hard differences and limits.

- [ADR 0011: Forest and composition-based order costs](adr/0011-frontier-forest-movement.md).
- [ADR 0012: Permanent town specialties](adr/0012-town-specialties.md).
- [ADR 0013: Bounded permanent shared crossings](adr/0013-shared-crossings.md).
