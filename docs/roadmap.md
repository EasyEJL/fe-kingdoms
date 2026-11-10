# Development direction and current scope

The user wants medieval Risk with meaningful resource management and little bookkeeping. Hexes were prioritized before later mechanics. All authoritative rules and opponent decisions remain in Fe.

## Implemented milestones

1. **Axial hexes and clarity:** real six-neighbor movement/supply, matching layout, one-open owned-territory action cards, explicit two-order turn handoff and Fe forecasts. Older square replays remain read-only. ADR 0005, commit bd40373.
2. **Campaign foundations:** three map sizes, terrain chokepoints, villages/towns, food and capital-connected supply. ADR 0006, commit ef898df. Early self-play exposed defensive stalls rather than proving balance.
3. **Troop roles:** explicit infantry/cavalry/siege composition, recruitment and paid town training, including training at the stack cap. No silent conversion or hidden bonuses. ADR 0007, commit 3b05525.
4. **Visual map:** terrain/unit vector illustrations, count badges, ownership, zoom/Fit, contextual unit tradeoffs and Fe-projected food meters. ADR 0008, commit 9cc4239. Presentation tests and human playtesting are recorded separately.
5. **Campaign continuation:** map-size review points at 60/120/180 full rounds; an explicit twenty-round extension or accepted draw instead of a forced time draw. Frozen v4 and larger bounded traces. ADR 0009, commit b1ae2ff.
6. **Fixed rivers and supply previews:** bridge crossings/defense, exact cached route planning, small shared terrain/unit properties and Fe-backed connected/cut-off counts. Frozen v5. ADR 0010, commit 03e5603.

Two complete source/docs-informed model-player games against native Fe Easy are documented with replays in [the v6 playtest report](playtests/2026-11-09-v6.md), committed as 5acddb4. These are not novice-human or browser validation. A new human v6 check remains useful.

## Current low-risk validation work

The separate validation worktree turns the documented games into permanent replay/forecast regressions and audits two-order capital defense using the existing Fe rules and policies. It also prepares a [local engine demonstration checklist](demo-readiness.md). This stage does not change live game files, mechanics or difficulty. Runtime test results and remaining limits belong in validation.md, not assumptions inferred from test names.

## Next design checkpoints

Human feedback should guide the next mechanics slice and eventual difficulty calibration. Keep the current challenging opponent available when considering a gentler option. Short bot tournaments and single model-player games do not establish enjoyment or broad balance.

Candidate later mechanics, not accepted implementations:

- Buildable/destroyable bridges and forests harvested for construction materials. These would change both kingdoms' movement/supply and invalidate the current fixed-route cache assumption.
- Town specialties and distinct unit movement when they create useful decisions without excessive bookkeeping.
- Roads or further economic systems only where playtesting supports them.

Prefer small shared terrain/unit definitions when repeated rules justify them. Do not build a generic game framework. Compare a different order budget or planning phase only if evidence supports that change; the current two-order rule remains.

## Boundaries

Keep this project separate from Dragonstales, the preserved transition prototype and any Unreal exploration. No remote Git, publishing, deployment, package registration or contest submission is authorized by these local milestones. Preserve live browser matches and versioned replays. Commit coherent local changes with their decisions and actual verification evidence. Stop and report if reliable agent allowance reaches 25% remaining or cannot be measured.
