# Development opening and larger-map assessment

## Result

Do not implement a larger map as a presumed pacing fix yet. The existing Large map already delays substantial fighting under ordinary native policies, but that time does not produce towns or specialties. A forced home-town investment is survivable in these bounded tests, and on Large it actually brings the first hostile attack forward. Extra nearby farms are not justified by an early food shortage here.

This is a scripted opening experiment, not human play, a rush-optimality test, or a complete strategy comparison. A provisional 63-hex scenario is described below; no new map or production behavior was implemented.

## Method and reproducibility

Tested current v7 at commit `0517958decec2496963682c48645323a8de2ce2c`. Eight sequential probes: Medium/Large, Hard as Blue/Red with Easy opposite, ordinary native opening or one forced first legal supplied-home-village upgrade to town for Hard. After that single legal action every decision, including the second order, comes from native Fe. No artificial pass. Each probe stops at a result or 100 actions.

Pinned image `sha256:32e644f1599ac63427a9e545d643ad75adee6f14328c4b7d1be01e3bf728391d`, network disabled, one CPU, source mount read-only, ignored evidence directory writable. No server restart or browser access. Evidence script: `evidence/development_map_probe.py`; full results: `evidence/development-map-results.json`; each named run has an action replay and `-detail.json` action/timing log. These ignored files are local reproducibility artifacts, not committed fixtures.

All eight final replays matched tiles, economy, supply and game state excluding transient search nodes/depth. All four requested town upgrades executed. Round means completed rounds plus one at the action; snapshots are immediately after five/ten full rounds, when Blue's next income has run and Red's has not. This phase difference matters when comparing seats.

First hostile attack means movement onto a tile previously owned by the other kingdom. Substantial engagement means such an attack with at least four actual moving troops, successful or repelled. Neutral capture is separate. Every run first captured neutral territory in round 1; this event can belong to the Easy kingdom, so it is not a per-Hard expansion metric.

## Contact and completion

| Map | Hard seat | Opening | First hostile | First >=4 attackers | Stop |
|---|---|---|---:|---:|---|
| Medium | Blue | Native | 10 | 10 | 25 rounds, ongoing |
| Medium | Blue | Town | 12 | 12 | 25 rounds, ongoing |
| Medium | Red | Native | 9 | 9 | Red capital victory in round 18 |
| Medium | Red | Town | 12 | 12 | 25 rounds, ongoing |
| Large | Blue | Native | 15 | 18 | 25 rounds, ongoing |
| Large | Blue | Town | 10 | 13 | 25 rounds, ongoing |
| Large | Red | Native | 14 | 16 | 25 rounds, ongoing |
| Large | Red | Town | 10 | 18 | 25 rounds, ongoing |

Seven budget stops are unfinished games, not draws or evidence of inevitable stalemate. A changed opening changes both policies' subsequent choices, so contact differences are not a clean causal measure of travel distance.

## Hard kingdom development at round 5 / round 10

V/T/F are supplied villages/towns/farms. D counts settlement construction/upgrades and specialties, including the forced action. Food is stock/net production-minus-upkeep; G is gold income. All snapshots have zero specialties and no predicted next-turn shortage for Hard.

| Map, seat, opening | R5 V/T/F; D; food; G | R10 V/T/F; D; food; G |
|---|---|---|
| Medium Blue native | 3/0/2; 1; 21/+5; 5 | 3/0/2; 1; 19/+2; 5 |
| Medium Blue town | 2/1/1; 2; 16/+3; 6 | 2/1/2; 2; 18/+3; 6 |
| Medium Red native | 3/0/2; 1; 18/+5; 5 | 4/0/2; 2; 25/+2; 6 |
| Medium Red town | 2/1/1; 2; 15/+3; 6 | 2/1/2; 2; 17/+3; 6 |
| Large Blue native | 2/0/1; 0; 22/+4; 4 | 3/0/2; 1; 31/+3; 5 |
| Large Blue town | 1/1/1; 1; 25/+4; 5 | 2/1/1; 2; 35/+4; 6 |
| Large Red native | 2/0/1; 0; 20/+4; 4 | 3/0/2; 1; 30/+3; 5 |
| Large Red town | 1/1/1; 1; 23/+4; 5 | 2/1/1; 2; 33/+4; 6 |

The forced towns survived to the budget endpoint. Medium town investment delayed the second farm until after round 5, increased income, and did not cause an early defeat against Easy. However, the native Hard Red victory did not repeat within the budget after forcing the upgrade. Large town openings retained only one farm at round 10 but had more stored food, not less. A nearby farm might offer a positional choice, but these results do not establish a food need. They do not measure stockpile waste or establish town investment's long-run value.

## Cost and capacity

Medium maximum observed legal lists: 59-70; Large: 84-98. Maximum observed single native invocation was 1.84 seconds on Medium and 2.91 seconds on Large, including replay reconstruction and complete output forecasts. Concurrent independent QA and the one-CPU cap make these indicative, not isolated benchmarks. Hard's fixed beam does not bound all ranking cost: every legal move is evaluated and insertion-sorted. Node count alone understates work.

## Provisional small map experiment

Only if further play supports more space, add optional scenario 3: 9x7 axial hexes, capitals A1/I7, fixed bridges E3/E5, construction sites E1/E7, widening D4/F4. Preserve initial owned holdings and armies, home villages A2/I6 and neutral villages C2/G6. Keep two orders, 12-stack/40-storage limits, 180-round review and 20-round extension. Do not add tech or resources.

A mirrored neutral farm pair B3/H5 is a separate provisional layout choice, not an evidence-backed requirement; omit it initially or explicitly compare it after an otherwise-identical map baseline. Avoid changing geometry and economy opportunity together without recording that confound.

Capital geometric distance increases only 12 to 14 steps versus current Large: one additional uninterrupted infantry travel turn. Actual conquests take longer because of neutral combat/garrisons and replenishment. Inheriting bridge rows 1/3 on seven rows breaks rotational symmetry; scenario-specific rows are required. A dimension stretch alone mostly adds plain neutral garrisons. Extra width/height within 63 tiles cannot be promised to create a long economic phase.

Required implementation checks: explicit scenario validation in engine/native/adapter; version-gated scenario acceptance; preserve scenarios 0-2 bit-for-bit; extend explicit dimension tuples instead of the current width-by-scenario formula; all four route-cache variants against graph oracle; mirrored terrain/settlements/resources, connectivity, action-list crowding near the 1024 capacity, forecast/replay equivalence, campaign boundary/extension and trace capacity. Adapter already accepts 63 tiles; 64-slot arrays/sentinel need no increase. Preserve new scenario replay semantics once traces exist.

UI needs the optional choice, save/load preservation, seven-row Fit/scroll/I7 selection and real readability checks. Existing Fit scales by width only, and axial row offsets add horizontal extent. Unit tests do not validate readable small badges.

Before any map implementation, a human/model development opening on the current Large map is more informative than expanding capacity. Then, if justified, compare the same scripted openings against the optional map with first-contact and round5/10 metrics above, plus both kingdoms' per-side neutral expansion and actual specialist/specialty use. Require additional useful development choices rather than simply later combat or longer stalled campaigns. Preserve classic maps and do not tune AI concurrently with the map comparison.
