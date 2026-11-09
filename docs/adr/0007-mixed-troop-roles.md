# ADR 0007: Mixed troop roles with explicit composition

Status: Accepted; implemented, with independent and integrated verification recorded alongside the milestone.
Recorded: 2026-11-09. Extends the campaign rules in ADR 0006.

## Context

The campaign milestone's ridges and forts created real chokepoints, but also defensive stalls: a fortified pass can defend with fifteen while a maximum infantry attack sends eleven. The user authorized troop roles as a subsequent priority. The goal is a small tactical roster, not per-unit orders or a new pathfinding system.

## Decision

Rules version 4 keeps one-hex movement and the twelve-unit stack cap, adding mixed infantry, cavalry and siege counts. Infantry remains the baseline. Cavalry adds one attack power per cavalry on plains/farms. Siege adds two attack power per siege against a fort, settlement or capital. All units defend as one.

Infantry recruitment remains two units for three gold/two food. Supplied towns recruit one cavalry for four gold/two food or one siege for five gold/three food. Normal upkeep remains based on total mobile troops. The computer obeys the same costs and gates.

Half/all-but-one moves keep one garrison, preferring infantry, then cavalry, then siege. Fe selects the moving detachment proportionally using largest remainders and a fixed tie order. Friendly merges preserve exact counts. Fe reports the moving composition and attack power before the player commits.

An attack still needs strictly greater power than defense. Capturing losses are min(n-1, ceil(defense*n/attackPower)); infantry-only combat reproduces v3. Repelled attacks lose the whole detachment and use attack power in the prior defender-loss calculation. Casualties remove infantry first, then cavalry, then siege. These choices are deterministic and visible, not random hidden outcomes.

A capped infantry-frontline test confirmed that specialist recruitment alone cannot fill the role. Add explicit paid retraining: kind 7 converts one infantry to cavalry for four gold/two food; kind 8 converts one infantry to siege for five gold/three food. Both require a supplied town, consume an order and keep the total count unchanged. No conversion occurs implicitly during movement or merging.

## Compatibility and evidence

Freeze v3 for read-only replay, use a separate v4 checkpoint and retain four-field actions. Tile/forecast output gains explicit role counts and attack power. Required checks include exhaustive bounded composition conservation, recruitment gates, terrain bonuses, siege tactics, exact previews, infantry-only comparison against the frozen v3 executable, full matches and latency. Record actual results and any remaining balance issues before marking the milestone complete.

## Tactical evidence and limits

Both Easy and Hard select siege training in the tested capped frontline town and select the winning assault once three siege units can overcome defense fifteen. Exhaustive bounded compositions preserve detachments, garrisons and merges. Independent host tests compare infantry-only v4 replay states to the frozen v3 executable. A Hard/Hard small self-play probe used sixty specialist orders but still drew; Easy probes did not develop specialists. These are useful diagnostic facts, not claims of solved balance. Keep the four-pass and 120-side-turn draw rules unchanged as requested, and prioritize human-versus-computer playtesting.
