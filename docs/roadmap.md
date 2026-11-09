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


## Authorized next campaign slice

The next isolated milestone introduces map-size round-review points and explicit continuation, then rivers with fixed bridge crossings and Fe-backed supply previews. Preserve current opponent policies while keeping them competent with the new rules; defer final difficulty calibration until the next mechanics batch settles.

Buildable/destroyable bridges and forests harvested for construction materials are candidate future mechanics from the user, not committed scope for the fixed-crossing slice. Such changes would affect both kingdoms' movement, supply and planning. Town specialties and distinct troop movement remain later candidates where they create useful decisions. Prefer small shared terrain/unit definitions when repeated rules justify them; do not introduce a generic game framework.

5. **Implemented and verified in v5:** map-size review points (60/120/180 full rounds), explicit twenty-round continuation or accepted draw, frozen v4 replay and larger bounded traces. See ADR 0009. Final difficulty calibration remains deferred. Next: fixed rivers/bridges and exact Fe-backed supply previews.

6. **Implemented and verified in v6:** fixed river crossings, bridge defense, exact route-aware planning, lightweight shared terrain/unit properties and Fe-backed connected/cut-off territory previews. See ADR 0010. Both policies meet directed bridge/supply tactics. This does not establish broad strategic strength or beginner difficulty. Next checkpoint: human/simulated-player playtests before adding specialties, different movement or mutable bridges.
