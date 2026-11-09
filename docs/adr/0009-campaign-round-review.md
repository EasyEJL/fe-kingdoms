# ADR 0009: Map-size campaign review and explicit continuation

Status: Accepted; implemented in rules v5 on the isolated campaign branch.
Recorded: 2026-11-09.

## Context

A large-map human playtest ended at the old sixty-round limit during active fighting. The user requested limits based on map size and authorized the next bounded mechanics slice. Preserve the current challenging opponent while deferring final difficulty calibration.

## Decision

Small, medium and large campaigns reach a review point after sixty, one hundred twenty and one hundred eighty completed full rounds. Completing Red's turn at the limit pauses with result ongoing, side Red and zero orders. Blue's next income and attrition have not run yet.

Fe offers exactly two recorded legal actions: kind 9 extends twenty rounds; kind 10 accepts a draw. Both have zero source, destination and amount. Extension raises the current limit and starts Blue's deferred turn once, with the normal two orders and economy. It does not spend a combat order. Accepting a draw leaves the final boundary position frozen. Capital capture and four consecutive passes take precedence over the review point.

Automatic native modes stop at the decision rather than choosing for the human. Search treats the boundary as a leaf. Existing difficulty algorithms and evaluation remain unchanged. The UI displays Fe's completed-round count and current limit; it does not decide termination or award resources.

## Bounds and compatibility

Expand trace capacity to 2,048 actions, native input to 131,072 bytes and HTTP/replay files to 262,144 bytes. At trace capacity return the valid state with a capacity flag and no legal orders/forecasts, preserving the actual game result. Capacity is an unfinished technical pause, not a draw. Export preserves the record but does not remove the ceiling.

Freeze v4 sources and fixtures for exact read-only replay; old time-limit draws remain draws in that version. Current and legacy checkpoints stay separate. The accepted action sequence records extensions and draw decisions, so replay needs no hidden session state.

Bound automated self-play independently. Exhausting a test budget means unfinished; only Fe terminal results count as wins or draws. Retain a complete capital-capture HTTP regression as well as explicit boundary, long replay and capacity tests.

## Consequences

A campaign can continue without an arbitrary time adjudication while remaining memory-bounded. Extension has a small explicit UI/replay cost. The new transport metadata describes completed rounds, current/base limits, pending decisions and capacity; host code remains shape validation and serialization.
