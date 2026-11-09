# Development direction and current scope

The user wants medieval Risk with meaningful resource management and little bookkeeping. Hexes were explicitly prioritized before further mechanics. All authoritative rules and opponent decisions remain in Fe.

## Milestones

1. **Implemented and committed:** true axial hex topology, matching layout, one-open owned-territory action cards, explicit turn handoff, Fe forecasts and preserved older replays. See ADR 0005 and commit bd40373.
2. **Implemented and tested, with defensive-stall limits:** strategic ridges/passes, villages/towns, food and capital-connected supply, and three map sizes. See ADR 0006 and commit ef898df. Most self-play pairings still draw; this is a balance limitation, not a rule failure.
3. **Implemented and verified:** infantry/cavalry/siege roles, explicit composition, paid town training and Fe forecasts. See ADR 0007. No silent conversion or hidden bonuses. The complete regression suite passes. Hard self-play uses specialists; Easy does not reliably develop them. Human feedback must determine how well the roster plays.

4. **Isolated visual preview ready:** terrain/unit vector illustrations, role-count badges, clear ownership, zoom/Fit, contextual unit tradeoffs and Fe-projected food meters. See ADR 0008. Separate branch/port preserves the current match; final visual behavior still needs human checking before a live switch.

## After implementation

Retest clarity and enjoyment with a human. Small deterministic bot tournaments catch regressions but do not establish a fun or well-balanced game. Compare order-budget or planning-phase alternatives only if playtest feedback supports them. Water, roads and further economic systems remain optional ideas, not a requirement to add everything at once.

The local game stays separate from any Unreal exploration. No remote Git, public publishing, deployment or package registration is authorized by this work. Commit coherent local milestones with their decisions and verification evidence. Stop and report if reliable agent allowance reaches 25% remaining.
