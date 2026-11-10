# ADR 0018: Retain the baseline opponent after exploratory A/B

Status: Accepted for the v8 local preview.
Recorded: 2026-11-10 (UTC).

## Context and evidence

V8 introduces three kingdom developments. An evaluation-only experiment B added conditional resource projections, with exact physical/replay equivalence to baseline A. The full B suite passed and the experiment remains reproducible; correctness alone does not establish strategic improvement.

Four matched model-player continuations covered two prepared positions, ten rounds per branch. Medium Hard remained action/state-identical. Large Easy diverged but A had better observed territory/supply pressure at the endpoint. Adaptive Blue play, short horizons and one seat prevent a general strength ranking. Neither Red policy researched. These were weak adoption tests: Medium already had abundant food, and Large recruited at village 33 rather than its Arsenal at 35, so Muster would not discount those actual purchases without more infrastructure.

## Decision

Keep the rule-complete A evaluator as the default. Preserve B, its tests, exact binary hashes, prepared checkpoints, full traces and reports on local branch `experiment/v8-investment` and in Git history. Do not present the experiment as a stronger opponent or promote extra policy complexity without demonstrated value.

The three research mechanics, Fe-generated eligibility/forecasts, named snapshots, practice examples and concise UI remain. Restoring A changes only evaluation and its policy-specific tests; it does not remove v8 research or invalidate any A/B replay. The native engine source matches commit `4a0d8a2` exactly. Future physical rule or price changes require a new replay version, not reinterpretation of existing v8 actions.

## Next evidence needed

A future policy test should use genuinely scarce resources or a supplied frontline Arsenal with useful repeated recruitment opportunities, plus tactical counterexamples and reversed seats. Preserve all outcomes, do not select only favorable results, and do not inflate scores merely to force research. Longer campaign value and human enjoyment remain open. A baseline that favors immediate armies/territory is a known limitation, not evidence that the new investments are useless.

The default is chosen conservatively because improvement is unproven, not because two samples prove B is universally worse. Read the paired report and the experimental formula together before revisiting the decision.
