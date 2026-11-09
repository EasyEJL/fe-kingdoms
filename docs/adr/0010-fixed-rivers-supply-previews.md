# ADR 0010: Fixed rivers, route-aware planning and supply forecasts

Status: Accepted; implemented and verified in rules v6 on the isolated campaign branch.
Recorded: 2026-11-09.

## Context

The user authorized a larger mechanics slice after a large-map playtest, including rivers/bridges and supply previews. Terrain and troop abstraction should be introduced only where it makes actual rules clearer. Final difficulty calibration follows the main mechanics, while the opponent must remain competent throughout.

## Decision

Use fixed river and bridge terrain on the existing three axial maps. River tiles are impassable. Bridges use normal one-order movement and add one defense, like the earlier passes. The maps remain rotationally symmetric. Small has one central crossing; medium/large have two, with a widened central water obstacle that makes land routes meaningful. The topology field stays one for axial hexes. Rules version six identifies the changed scenarios.

Replace the old map-family distance shortcut with exact breadth-first paths. Movement distance depends on terrain, not ownership. Compute distance fields from both capitals once per opponent decision and reuse them through search; do not copy navigation tables into each trial State. Ownership-sensitive capital supply remains a separate calculation.

Use small terrain and unit profiles for repeated factual properties, keeping the rules readable. This is not a general entity/component framework. Existing unit prices, composition, movement, casualty priority and attack bonuses remain unchanged. Easy and Hard retain their existing planning budgets and the same rules/resources.

Fe emits connected/cut-off owned-territory counts for both kingdoms and after every legal action's real apply result. The browser shows the before/after change rather than implementing connectivity. A rise in connected count is not automatically a reconnection: capturing another connected tile also increases it. An enemy territory removed by capture is not a surviving territory newly cut off.

## Compatibility and boundaries

Freeze v5 native sources for exact read-only replay. Continue the earlier versioned checkpoint separation. V6 preserves campaign review/continuation actions and bounded traces. No legacy action sequence is silently interpreted on the new maps.

Buildable or destructible bridges and forests harvested for construction materials are future candidates, not part of this slice. They would require explicit mutable terrain, new replay semantics and ownership-sensitive tactical evaluation. Town specialties and different unit movement remain separate potential milestones.

## Verification obligations

Verify symmetry, reachability, river exclusion, bridge combat/defense, exact paths against an independent oracle, supply cuts/restoration, both policies' immediate tactics, forecast-versus-apply agreement, and unchanged campaign decisions. Retain exact v5 boundary/extension replays and a current v6 complete HTTP capital capture. Measure search performance and distinguish bounded bot samples from complete matches. Browser and human playtests remain separate from these checks.
