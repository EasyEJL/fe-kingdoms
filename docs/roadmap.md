# Development direction and current scope

The user wants medieval Risk with meaningful resource management and little bookkeeping. Hexes were explicitly prioritized before further mechanics. All authoritative rules and opponent decisions remain in Fe.

## Milestones

1. **Implemented and committed:** true axial hex topology, matching layout, one-open owned-territory action cards, explicit turn handoff, Fe forecasts and preserved older replays. See ADR 0005 and commit bd40373.
2. **Implemented and tested, with defensive-stall limits:** strategic ridges/passes, villages/towns, food and capital-connected supply, and three map sizes. See ADR 0006. Integrated tests pass, but most self-play pairings draw. Keep the previous playable instance available while siege roles are tested.
3. **Design only:** distinct troop roles. Evaluate a small roster with clear terrain/fortification tradeoffs, explicit composition and Fe forecasts. Do not silently convert units when merging armies or add hidden computer bonuses.

## After implementation

Retest clarity and enjoyment with a human. Small deterministic bot tournaments catch regressions but do not establish a fun or well-balanced game. Compare order-budget or planning-phase alternatives only if playtest feedback supports them. Water, roads and further economic systems remain optional ideas, not a requirement to add everything at once.

The local game stays separate from any Unreal exploration. No remote Git, public publishing, deployment or package registration is authorized by this work. Commit coherent local milestones with their decisions and verification evidence. Stop and report if reliable agent allowance reaches 25% remaining.
