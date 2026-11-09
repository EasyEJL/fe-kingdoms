# ADR 0002: Deterministic bounded rules and replay

Status: Accepted; implemented.
Recorded: 2026-11-09, retrospectively.

## Context

The first game must support a complete human-versus-computer match with enough strategic choices to test the engine, while staying small enough to finish and verify.

## Decision

Use two kingdoms on a full-information 5x3 orthogonal map, one currency, one troop type and forts. Give each side two orders total per turn. Supply follows owned territory to the capital. Capture the enemy capital to win; four consecutive pass actions or completion of 120 side turns draws the match.

Keep combat and AI deterministic. Easy uses one-ply greedy evaluation. Hard uses four-ply beam alpha-beta search. Both follow identical rules and resources, with no hidden bonuses.

Save accepted actions, not a trusted state snapshot. Fe reconstructs the initial state and validates every recorded action. Protocol version 1 accepts at most 240 actions and 16,384 input bytes. Recorded AI actions replay directly; future AI decisions use the selected difficulty. Rules changes must explicitly version replay semantics.

## Consequences

Matches are reproducible and bounded. The two-order limit creates tradeoffs but needs clear explanation. The current map and army model are a starting point, not a commitment to the eventual medieval-Risk design. A future hex map would change adjacency and require a deliberate rules/replay decision.

## Evidence

- `src/engine.fe`: `initial`, `legal`, `apply`, `choose`.
- `src/native.fe`: replay validation and mode handling.
- `src/tests.fe`, `scripts/test_matches.py`.
