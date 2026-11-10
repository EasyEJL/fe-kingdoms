# ADR 0014: Truthful bounded opponent priorities and feedback

Status: Accepted for unreleased v7; validation recorded per milestone.
Recorded: 2026-11-10 (UTC).

## Context

The user authorized opponent plans/explanations while preserving the simple, engaging two-order game and Fe authority. Feedback must describe actual computation, not invent a story about a move. Final difficulty calibration remains later work.

## Decision

Fe selects a small observable-state priority for each decision: defend the capital, reconnect a valuable cut-off holding, support food, or advance. It freezes that priority and target while evaluating candidates for this decision. A bounded priority score is part of the actual evaluation. Default advance retains ordinary positional scoring without an added bonus. This is a decision focus, not a promised multi-turn plan or general planner.

Expose the evaluator's additive material, resources, supply, economy, position, pressure, focus and terminal components. Terminal states use only the terminal component, preserving victory/loss dominance. The selected action report includes its actual search value, configured action-ply limit, per-decision node counter and immediate before/after scores under the same root focus.

The largest positive immediate component change is an evaluation highlight; zero means none increased. Immediate changes are not a complete explanation of deeper search. Negative immediate total changes can still accompany a move selected for its future value. Never label a component highlight as a guaranteed outcome or full causal account of Hard's decision.

## Bounded protocol and presentation

Native tag9 retains only the last two actual automatic decisions from the current invocation. Replay-only mode emits none; one-step mode emits one; a normal computer turn emits up to two; full self-play retains its final two. Each record identifies its accepted trace index and action. These reports are not stored in action replays, and loading a replay does not invent or recover a search explanation.

Only v7 responses gain the decision-report key. Frozen versions retain exact response shapes and digests. The browser reuses its existing recent/search area, clears stale reports on later responses, and displays concise priority/evaluation text with optional detail. No browser-side scoring or external language model participates in game decisions.

## Verification obligations

Prove component sums, terminal dominance, active priority effects, actual selected search value, per-decision counters, highlight selection, record/trace identity, bounded buffering and replay absence. Preserve Easy one-ply and Hard four-action-ply beam budgets. Exercise defense, supply and food priorities plus immediate capital wins. Test one-order capture followed by fortifying, and contrast siege/cavalry-forest assaults that consume both orders. Revalidate real full HTTP matches, immutable old replays and UI staleness behavior. Model, browser and human playtesting remain separate evidence categories.
