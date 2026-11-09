# ADR 0003: Explicit two-order turn handoff

Status: Accepted; implemented after first-play feedback.
Recorded: 2026-11-09.

## Context

The initial browser flow bundled the computer response into the human request when the human's order budget expired. The displayed turn count included both sides. Eric reported confusion about turns and a bad loss on Easy; he expected actions from A1, B1 and A2 before ending his turn.

## Decision

Keep the existing two-order rule. Explain that the budget is two orders TOTAL across the kingdom, selecting a tile is free, and a territory can act twice.

Submit each human order in replay-only mode so its result is visible separately. When Red becomes the side to move, pause for the explicit Run computer turn button. Show round and remaining-order information, a concrete first-turn example, recent action feedback and Fe-generated forecasts. Confirm forfeited orders and attacks that Fe predicts will lose all attackers.

Do not weaken Easy solely because one confused first playtest ended in defeat. Retest the clearer flow before changing difficulty or order count.

## Consequences

An extra handoff click makes the turn boundary visible. Rules, resources, AI algorithms and existing action replays remain unchanged. This is a pacing change, not a queued-orders planning phase. The revised flow still needs a human retest to establish whether it is clearer and more enjoyable.

## Evidence

- `web/index.html`: `perform`, `request`, `render`, `forecast`.
- `tests/test_ui.js`: pacing, confirmations, forecasts and checkpoint preservation.
- `tests/test_http.py`: first order leaves one human order; second leaves Red waiting.
- `scripts/test_http_match.py`: complete match with explicit handoffs.
