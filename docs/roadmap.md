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

- Bridge destruction and forests harvested for construction materials. Bounded permanent construction is authorized for the v7 development stages below, but destruction and harvesting are not yet chosen.
- Further town or troop systems only after the authorized bounded v7 specialties/movement slice is evaluated.
- Roads or further economic systems only where playtesting supports them.

Prefer small shared terrain/unit definitions when repeated rules justify them. Do not build a generic game framework. Compare a different order budget or planning phase only if evidence supports that change; the current two-order rule remains.

## Boundaries

Keep this project separate from Dragonstales, the preserved transition prototype and any Unreal exploration. No remote Git, publishing, deployment, package registration or contest submission is authorized by these local milestones. Preserve live browser matches and versioned replays. Commit coherent local changes with their decisions and actual verification evidence. Stop and report if reliable agent allowance reaches 25% remaining or cannot be measured.

## Authorized frontier development (unreleased v7)

Forest and actual-detachment movement costs are the first implementation stage. Town specialties (granary/arsenal), bounded permanent shared crossing construction and truthful Fe opponent evaluation/strategy feedback are authorized next stages, not completed features yet. Use existing gold/food and small factual profiles, not a generic framework. Destructible bridges, forest harvesting, roads and an Expert tier remain future candidates. Expert might use measured iterative deepening, tactical extensions and caching after mechanics settle; no guaranteed wins are implied.

V7 stage2 now implements Granary/Arsenal as the permanent bounded town choice described in ADR0012; bridge construction and opponent feedback remain the next stages.

Later map direction from playtesting: consider larger maps with room for economic development before major battles. This is a candidate, not an implemented or scheduled map. Evaluate two-order pacing, travel times, resource/storage caps, action/trace bounds, search cost and browser readability together. The current largest map has45 hexes within a64-tile engine capacity; increasing those bounds requires explicit tests rather than changing dimensions alone.

V7 stage3 now implements permanent shared crossings and four-topology route caching (ADR0013). Destruction/harvesting remain candidates; opponent feedback is the next implementation stage.

The user subsequently authorized selective work beyond the initial list when it adds play value. After the promised v7 slice is verified, assess early-economy versus rush pacing and a bounded larger-map experiment. Preserve existing maps and live matches; use observed play/test evidence before choosing more resource systems. This authorization does not itself mark a new map as implemented.

Further candidate: limited medieval technology progression, potentially a small prerequisite graph with meaningful economic/military tradeoffs. The user is interested in Civilization-like development, not an unbounded full4X. Finish v7 and assess map/economic pacing first; review provenance and licenses of any public reference material before reuse. Keep Dragonstales private data and code separate, and do not imply permission to publish or copy it. No tech tree is implemented by this note.

Fantasy candidates discussed later: archers/knights, wizards, trolls or other monsters, and special recruiting locations. These are ideas, not a commitment to add the entire roster now. Each new role should create a meaningful decision, have readable costs/tradeoffs and receive Fe legal/combat/search tests. If a fourth role makes the current three named Army fields repetitive, consider a small fixed role/profile representation then, not a speculative full entity framework. Keep current playtesting and differentiated behavior ahead of roster size.

All four authorized v7 implementation stages now exist in local commits: forest/movement, town specialties, shared crossings and actual opponent focus/feedback. Fresh model and browser checks follow the passing automated suite before declaring the new preview ready. Final difficulty calibration, broader pacing experiments and candidate mechanics remain separate.
