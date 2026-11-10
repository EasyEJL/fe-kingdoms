# V8 Large Easy paired policy observation

Date: 2026-11-10 UTC. Prepared benchmark, not an initial-position match or human/browser test.

## Controls and bounds

- Same prepared scripted prefix: `evidence/ab/checkpoints-large-prefix.json`, 18 accepted actions, Red turn10/orders2/completedRounds4. Prefix already contains both Town Charters and Arsenal towns. It is not evidence that either automatic policy chose those investments.
- Both branches finish at Red turn30/orders2/completedRounds14: precisely ten additional Red turns and ten Blue turns, 40 added accepted actions per branch, 58 total. Both result0 (ongoing). No extensions, resets, discarded mistakes, or post-boundary play.
- v8-A source `4a0d8a2d476eb6dde88ee9e35b2f75f89dd55c73`; binary SHA256 `d93c5d1b74873b9c51120ba79378b5634e51bb66af9df5f1d6e255685d83aaa0`.
- v8-B source `53d1819308a8127d2b9ca917a569142203f44ecb`; binary SHA256 `fd979b0439a962031a49e1595ba7d392e295b81aaf78b971127a4a56d4ccea0c`.
- Pinned image `sha256:32e644f1599ac63427a9e545d643ad75adee6f14328c4b7d1be01e3bf728391d`, network none, repository mounted read-only. Only the pinned evidence binaries ran. Existing server decoder was imported with bytecode disabled as transport only. No source/build/server/browser/save changes or commits.
- Red is actual native mode0, difficulty0; Blue decisions are model-selected from Fe legal actions and forecasts, not a scripted host policy or native Blue mode. B ran before A in corresponding turn/action pairs.
- Predeclared Blue intent: safe expansion to crossing, useful troop consolidation/replenishment, protect capital/supply, exploit opportunities without knowingly losing armies unless explicit compensation.
- Initial authoritative state, legal actions, ordinary forecasts, and development forecasts match exactly across binaries, ignoring ephemeral policy diagnostics. Every measured Blue and Red action was independently checked using mode1 before and after application, including tag11 masks, incomes, production, upkeep and stocks. Both complete final traces replay identically on both binaries. JSON deliverables retain version8; no save reclassification.

## Actual divergence and Blue adaptation

First actual Red divergence is index18, the first measured decision on an identical board. A moves `[1,33,24,3]` then recruits at33; B recruits `[2,33,33,2]` then moves five to24. End-of-turn stocks and territory match, but B has4 troops at24/1 at33 versus A2/3. Native decision records are retained in the audit, not represented as a causal proof.

Blue used the same first eleven choices, building and replenishing a corridor through forest12, bridge13, and mainland14. The first Blue action divergence is index41 (turn21): B's ten troops at33 made a small advance to15 vulnerable, so Blue expanded through6 toward farm7; A's smaller reserve and neutral15 allowed a central foothold. This is an adaptive paired test after genuine state divergence, not a fixed Blue action tape.

Later A's growing central army prompted Blue to move toward farm7, open an alternate corridor through6, and finally withdraw to a fortified bridge. Retained mistakes/limitations: Blue spent many orders on sequential village staging; its supposedly alternate farm route still depended on14. A's last Red turn captured15 then14, cut off6 and7, and caused one observed disconnected-attrition loss at6. Blue retained exposed single garrisons as explicit compensation for farm/territory gains and preserving movable troops, rather than resetting. These choices confound claims about general policy strength.

B instead spread south through31/30 and41. On the last Blue turn, Blue captured15 and consolidated seven infantry there. Both capitals remained unchanged, supplied, and unassaulted throughout the measured traces (Blue3 troops/defense5; Red3/defense4).

## Measured outcome at the same phase

- A Red: 13 connected tiles, 0 cut off; 22 infantry; 9 troops above one-per-tile garrisons; stacks14=4,15=5,44=3. Gold36, food9. Income7, production5, upkeep4. Blue:7 connected plus2 cut off,15 infantry,6 above-garrison troops, strongest bridge13=5; gold32/food34.
- B Red:12 connected tiles,0 cut off;21 infantry;9 above-garrison troops; stacks25=2,30=2,33=3,41=4,44=3. Gold32,food1. Income6,production5,upkeep5. Blue:11 connected,0 cut off,19 infantry,8 above-garrison troops, strongest15=7; gold33/food30.
- Above-garrison totals are only a transparent mobility proxy, not Fe-generated legal reach or actual attack power. Every troop was infantry; no cavalry/siege was acquired.
- A Red gained a supplied village and created a supply break. B Red ended with less food and dispersed forces. Neither game ended, and these facts do not establish an overall stronger policy.

## Resources and development

Measured flows are reconstructed from accepted Fe states/forecasts at the ten actual incoming turn transitions per side. Expenditure is separate from income. Setup expenditure is excluded. Full per-transition stocks, production/upkeep and paid action costs are retained in `evidence/ab/v8-large-summary.json` and branch audits.

- A Red: gross/received gold61; paid33 gold/22 food over20 orders. Food production50, upkeep40, net turn-start food+10; starts8 gold/21 food and ends36/9. Eleven infantry recruitments, nine moves.
- B Red: gross/received gold60; paid36 gold/24 food over20 orders. Food production50, upkeep46, net turn-start food+4; starts8/21 and ends32/1. Twelve infantry recruitments, eight moves.
- A Blue: received79 gold; paid50 gold/16 food over20 orders. Production54, upkeep23, net food+31; starts3/19 and ends32/34. Eight recruitments, seven moves, four villages, one fortification.
- B Blue: received81 gold; paid51 gold/18 food over20 orders. Production56, upkeep27, net food+29; starts3/19 and ends33/30. Nine recruitments, seven moves, four villages.
- Verified resource-cap waste is zero gold and zero food for all four side/branch combinations. This uses actual incoming stock deltas reconciled with native production/upkeep, and the source's cap-before-upkeep sequence. High final stocks alone are not classified as waste.
- No research was selected by either side during the measured window. Both preexisting Charters stayed active for all ten income receipts per side: ten realized bonus gold each, with no gold-cap loss. Crop Rotation/Muster remained unknown. There were zero actual discounted recruitments. Arsenal infrastructure alone did not demonstrate useful Muster investment.
Interpretation check against every recorded before/after state: all 11 Red A and 12 Red B infantry recruitments were at tile 33, which remained a supplied village (settlement 1, specialty 0), each costing three gold. The prepared Arsenal was town 35, not tile 33. Even if Muster had already been learned, it would not discount these exact purchases without upgrading tile 33 to a town and selecting Arsenal there, or changing the recruitment location. Thus this sample is a poor test of Muster adoption: the lack of research is not evidence that either policy ignored an immediately useful discount on its chosen recruitment stream.

- No starvation losses occurred. B Red reached food1, but current native projection still shows zero shortage losses. Only A Blue suffered disconnected attrition: one troop at6 on the final incoming Blue turn;2 tiles remain cut off at the endpoint. No speculative future attrition is counted.

## Timing and evidence

Ten actual Red mode0 calls per branch: A median0.383s/max0.396s; B median0.376s/max0.794s. Decision nodes total878 A versus1001 B across20 decisions each. These are Docker subprocess wall times including startup/replay/output/decode, not isolated evaluator latency. Calls were single samples, B-first; no speed conclusion is warranted. Full audit invocation totals:124 recorded calls per branch including shared initial checks and final cross-replays; A46.116s, B47.285s. Usage remained76% at periodic checks, above the25% stop threshold.

Deliverables: `docs/playtests/v8-ab-large-a.json`, `docs/playtests/v8-ab-large-b.json`. Detailed authoritative before/after states, legal lists, previews, tag11 values, accepted choices/reasons, native decisions and timings: `evidence/ab/v8-large-a-audit.json`, `evidence/ab/v8-large-b-audit.json`. Summary: `evidence/ab/v8-large-summary.json`. Transport/audit scripts: `evidence/ab/v8-large-play.py`, `evidence/ab/v8-large-finalize.py`.

This is one prepared Large position, Easy depth1, both policies in the Red seat only, with adaptive model Blue decisions and a short bounded horizon. It supports observations about this trace, not general win rate, investment quality, or strength. It does not test whether research becomes valuable over longer campaigns or harder search.
