# ADR 0006: Bounded campaign maps, settlements and food supply

Status: Accepted; implemented. Integrated verification is recorded with this milestone.
Recorded: 2026-11-09. Extends ADR 0005 and supersedes the v2 economy/map-size portions of ADR 0002.

## Context

The user authorized continued work through clarity, strategic terrain/chokepoints, settlements, supply, map sizes and troop roles, after true hexes. The game should move toward medieval Risk without becoming an accounting interface. Each milestone must remain playable and preserve Fe authority and earlier replays.

## Decision

Version 3 provides three deterministic, rotationally symmetric axial maps: 5x3, 7x5 and 9x5. Impassable mountain ridges leave one or two defensible passes. Map definitions, movement, supply connectivity and AI path considerations remain in Fe. Two orders per side and the 120-side-turn limit stay unchanged.

Settlements become an explicit layer. Villages and towns produce one or two gold when supplied. Recruit at supplied capitals or settlements. Building a village costs six gold; upgrading it to a town costs eight, each using an order. Starting flank villages provide an accessible opening.

Food is the second resource. Both kingdoms start with eight gold and twelve food, capped at forty each. At the incoming turn, the connected economy produces base two gold plus settlement levels, and base three food plus two per connected farm. A connected army's upkeep is ceil((troops minus one)/3); lone garrisons are free. Recruiting two troops costs three gold and two food. Disconnected armies lose one mobile troop, pay no global food upkeep and cannot recruit. Food shortage removes mobile troops deterministically from the largest armies without eliminating lone garrisons.

Fe emits income, production, upkeep, shortage warnings and exact action forecasts. The browser displays these values; it does not recalculate the rules. Difficulty changes planning, not these resources or constraints.

Freeze the committed v2 engine for read-only replay and give v3 its own checkpoint. Do not reinterpret older actions under the new economy. Troop roles remain a separate subsequent decision so their combat and movement rules can be tested independently.

## Consequences

Terrain makes supply cuts and passes meaningful; settlement investment trades against immediate recruitment. Food limits unsupported mass armies with visible warnings. There is more to explain, so the small map remains the default and full-map/hunger forecasts need strong tests. Fixed arrays and bounded search must be measured on the larger maps before calling the milestone complete.

## Verification planned

Check map symmetry/connectivity, mountain restrictions, pass defense, settlement costs/income, recruiting restrictions, exact food/attrition transitions, every preview against its actual transition, all map sizes, current and legacy replay, full matches and bounded AI timings. Record actual results rather than treating this plan as a test pass.

## Observed balance limitation

Mechanics tests pass, but self-play exposed defensive stalls: a fully fortified pass has defense fifteen, while a maximum infantry attack sends eleven. Easy can cycle recruiting and retaking the pass; deeper search can prefer defending indefinitely. This is not a topology error. Keep the prior committed hex instance playable while a separate specialist/siege milestone is tested. One small-map Hard-versus-Easy test captured a capital; most campaign regression pairings drew. Do not claim this milestone is broadly balanced.
