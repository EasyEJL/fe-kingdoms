# Validation baseline

Recorded for the first local Git snapshot on 2026-11-09.

The reproducible command is `scripts/verify.ps1`. It checks:

- Nine native Fe rule/search tests, including supply cuts, combat boundaries, resource/order limits, terminal outcomes and deterministic search.
- Eight adapter tests, including exact Fe forecasts and the explicit two-order handoff.
- UI unit tests using a mocked DOM/transport, including opening guidance, pacing, confirmations and save/load preservation.
- Four complete Fe-versus-Fe matches, exact replay equality and nine malformed-input cases.
- A complete 46-action match over 36 real HTTP requests with explicit computer handoffs.

The deterministic match baseline is: Easy/Easy Blue wins in 30 actions; Hard/Easy Blue in 46; Easy/Hard Red in 39; Hard/Hard Red in 52. Hard wins both mixed pairings. These four matches are useful regression evidence, not a broad balance study or a claim that Easy suits every beginner.

Eric played the initial browser version and reported unclear turns and a poor first experience on Easy. The revised turn flow has not yet received a human retest. Automated browser interaction was not verified because Windows Computer Use could not determine the browser URL confidently. The existing HTTP checks and mocked UI tests do not replace that missing check.

Generated logs, traces, timings and source hashes live under ignored `evidence/`. Run verification to regenerate them; check the current result rather than assuming this recorded baseline still applies after edits.

## Campaign v3 milestone

Full verification passed after the richer campaign rules: 16 Fe tests, 11 adapter tests, expanded UI unit tests, six complete matches, ten malformed native inputs, exact replay, both old replay versions and a 69-action capital capture over 53 HTTP requests. Small Hard-versus-Easy ended in Blue victory; the other five tested pairings/scenarios drew. Slowest individual action in this regression run was about 0.26 seconds. These draws are a documented defensive-balance limitation, not a passing claim about fun.


## Mixed-army v4 milestone

The final `scripts/verify.ps1` run passed on 2026-11-09: 23 native Fe tests, 12 adapter tests, the expanded mocked UI tests, six complete matches, ten malformed-input cases, exact replay and a 69-action Blue capital capture over 53 real HTTP requests. Older v1/v2/v3 winning replays remain read-only. Infantry-only v4 positions match the frozen v3 engine at sampled prefixes and the terminal position. Actual mixed-army legal-action previews also match subsequent native results, including specialist recruitment and paid training.

The small-map regression outcomes were Easy/Easy draw (240 actions), Hard/Easy Blue victory (69), Easy/Hard draw (239), Hard/Hard draw (238). Medium and large Easy/Easy drew in 239 and 238 actions. Hard/Hard used 60 specialist orders; the other five traces used none. The slowest individual native request in the final matrix took approximately 0.57 seconds. Separate Hard opening replies on medium/large took about 0.25/0.27 seconds and replayed exactly; these opening checks are not complete Hard matches on the larger maps.

Directed tests show both policies training siege at a capped frontline town and attacking once three siege can breach defense fifteen. Composition tests exhaust bounded detachments and merges. Independent code review found no concrete correctness defect. These results establish regression coverage and tactical capability, not strong long-term planning or beginner-friendly balance. No draw trigger was changed: four consecutive passes or 120 completed side turns still end a game.

Generated v4 evidence includes `verification.json`, `matches-summary.json`, `http-full-match.json` and `large-map-hard-opening.json` under ignored `evidence/`. The source and tests, not generated binaries/logs, are committed. An initial adapter-test attempt failed because a new test fixture tried to spend five gold when only four were available; the fixture was corrected using Fe's legal list and the entire suite was rerun successfully. No game rule was changed to satisfy that fixture.

## Next human playtest

- Start a small Easy game. Open A2's territory card, recruit two infantry, then send two troops to B2. Confirm that the two orders are kingdom-wide and Red has not moved until **Run computer turn** is clicked.
- Check whether legal choices, combat forecasts, food projection and disconnected-territory warnings are understandable without reading source.
- Try a town and explicit specialist recruitment/training. Check that the difference between adding and converting a unit is clear.
- Play to a result and save the replay if a loss, stalemate or computer decision seems surprising. This is the useful next input before adding water, roads or more troop types.

The current v4 browser has not been independently exercised by automated browser clicks or a new human playtest. Mocked DOM tests, native tests and genuine HTTP requests remain distinct from those missing checks.


## Isolated visual-map milestone

`node tests/test_ui.js` passes after the final visual edits. `scripts/verify.ps1` also completed successfully: 23 Fe tests, 12 adapter tests, six full deterministic matches/replays, parser checks and the 53-request/69-action HTTP match. Current source hashes match the generated verification record. Native Fe, frozen replay engines and HTTP adapter are unchanged from 3b05525.

New mocked UI coverage includes badge counts/ownership, contextual role help, generic legacy troop display, keyboard-focus hooks, pure view-only zoom, zoom bounds and a 9x5 map fitted into a 320px viewport (284px rendered width after padding). Food-meter values are checked against deliberately distinct Fe projections so presentation cannot silently substitute its own arithmetic. Preview-launcher syntax and existing-preview detection also pass.

Actual Chrome inspection in a separate localhost:8766 window verified fresh small-map illustrations, ownership/count badges, selection and the first recruitment (A2: 1 to 3 troops; food 12 to 10; orders 2 to 1; Red unchanged). Browser inspection then stopped during a losing-attack confirmation because the tool could not verify the browser URL. No confirmation was accepted; the preview window may retain that dialog. No live-game tab, checkpoint or server was changed.

Final contextual-help and narrow-Fit fixes received source review and unit tests, not another browser pass. Still check visually: large-map zoom/panning, narrow layouts, cutoff/selection label spacing, keyboard behavior, second order/Red handoff and save/load. The existing complete HTTP and mocked UI checks are not substitutes for these visual checks. Preview is at localhost:8766; the active game remains localhost:8765.

## Campaign continuation v5 milestone

The full `scripts/verify.ps1` run passed on 2026-11-09: 28 native Fe tests, 12 adapter tests, three campaign transport suites, mocked UI tests, ten malformed inputs, exact replay checks and a complete 69-action Blue capital capture over 53 HTTP requests. Boundary tests cover all three map limits, explicit extension/draw choices, deferred income exactly once, terminal precedence, automatic modes stopping, and the 2,048-action capacity including a larger HTTP request. Frozen v4 winning and timeout fixtures replay exactly.

The self-play regression is deliberately bounded to 24 actions in each of six size/difficulty samples. All six were unfinished at the harness budget, with exact replay; these are not six complete matches or evidence of balance. The slowest sampled native request was approximately 0.414 seconds. UI tests cover boundary and capacity presentation, confirmation/click handling, failed requests and legacy checkpoints. Independent source review found no blocking defect; the reviewer's separate native rerun was blocked before execution at the Docker pipe, while the main aggregate run passed.

No new browser interaction or human playtest was performed for v5. Eric's large-map v4 visual-preview playtest reported active fighting cut short by the sixty-round draw and Easy feeling challenging. V5 addresses the forced cutoff, not final difficulty calibration. Existing preview/live ports remain untouched; this milestone is isolated in the campaign worktree.

## Fixed rivers and supply previews v6 milestone

Full `scripts/verify.ps1` passed on 2026-11-09: 32 Fe tests, 14 adapter tests, four campaign/legacy suites, expanded mocked UI tests, ten malformed-input rejections and exact replay. A new genuine v6 winning trace completes a Blue capital capture in 62 actions over 48 HTTP requests, preserving the explicit human-order/computer handoff. The six self-play regression samples stop at a 24-action harness budget with result ongoing; they are not complete campaigns. Slowest sampled action in the aggregate was about 0.302 seconds.

Native coverage includes symmetric reachable maps, impassable water, bridge defense and absence of cavalry open-ground bonus, every passable-pair route versus an independent BFS, cached capital routes and unreachable sentinels, alternating scenarios, supply cuts/restoration and extension/capital-win counts. Both policies take a safe bridge supply cut; Hard first removes a strong counterattack threat in a separate fixture variant. The original cut fixture wrongly required an immediate bridge attack even when a stronger enemy army could retake it. The test was corrected to distinguish those positions; the policy was not weakened to satisfy it.

Frozen v5 winning, pending and extended replays match retained full expected snapshots. Frozen v5 also handles the full 2,048-action replay and rejects overflow or interactive continuation. V1-v4 compatibility remains covered. Current preview supply counts match subsequent Fe results along the complete winning trace, including bridge capture and final capital capture, as well as campaign decisions.

Five-run timing medians including process startup: v6 initial Hard Small/Medium/Large approximately 95/101/106 ms, versus v5 87/102/106 ms (590 reported search nodes for all). The congested fortified-frontline Hard fixture was about 148 ms/840 nodes in v6 versus 201 ms/1,140 nodes in v5; both chose siege training. Changed topology changes workload, so this is not a pure cache speedup measurement. These are small local samples, not a performance guarantee.

Independent source review found no remaining blocking defects and independently passed the Node suite plus three nonnative Python transport checks. Two legacy read-only wording issues found in review were corrected and retested. The final aggregate executed all native checks separately. No new browser automation or human playtest was performed for v6. Still inspect river/bridge readability, supply feedback, zoom and complete turn flow in the new isolated preview before treating its presentation or difficulty as validated.

## V6 simulated-player follow-up

After commit 03e5603, a source/docs-informed Sol 6.1 player completed fresh Small and Medium matches against actual native Fe Easy over HTTP. Both ended in Blue capital victories: 70 actions/17 completed rounds and 50 actions/12 completed rounds. The final full responses replayed exactly, and every selected Blue forecast matched 19 resulting fields (62 orders, zero mismatches). Both replay comparisons were independently repeated. See [the playtest report and compact replays](playtests/2026-11-09-v6.md).

This is separate from native self-play and automated HTTP regression. It is not novice-human/browser testing or a broad balance conclusion. Learning from Small confounds the shorter Medium win. No production files, existing browser checkpoints or servers were changed during these tests. Repelled Red attacks dealt damage and had possible attrition/economy reasons; the report does not assert they are proven AI defects.

## Isolated v6 validation milestone, 2026-11-10

The full `scripts/verify.ps1` run passed in C:\Users\Eric\dev\fe-kingdoms-validation. Production engine/native, server, UI and the two documented replay inputs remain byte-identical to 5acddb4; no live server or browser checkpoint was changed.

New coverage: six playtest-replay tests check 122 prefixes, all 120 recorded Blue/Red order forecasts against 21 applied fields, exact terminal-response digests, final composition, supply cuts/recapture/attrition, repeat determinism and five corrupted histories. The final aggregate ran this suite in 3.237 seconds. Both fixture JSON hashes are now included in aggregate provenance.

Two native capital-defense puzzles enumerate 185/738 full Red turns and all immediate Blue finishes, finding 120/nine defenses. Hard leaves zero Blue winning continuations in both; Easy's one/two misses are diagnostic rather than required failures. Historical positive controls prove the oracle can find the recorded winning lines independently of current policy choices. The repeated bounded audits took about 4.675/30.213 seconds. This is a next-turn survival check, not proof of eventual victory. See [the tactical review](tactical-review-v6.md).

The aggregate also passed the existing 32 Fe unit tests, 14 adapter tests, four campaign/legacy suites, mocked UI checks, six bounded 24-action self-play samples, ten malformed native inputs and the complete 62-action/48-request HTTP win. The samples remain unfinished budget stops, not draws. No new human or real-browser playtest was performed.

Independent review found and resolved a possible false pass in the tactical oracle: a broken always-zero win result could previously satisfy its negative assertions. The added historical positive controls close that gap without forcing Easy to remain weak. Source and nonnative checks found no remaining blocking issue; the full native aggregate was then executed successfully. A reproducible [local Fe demo checklist](demo-readiness.md) was added without claiming contest eligibility or selecting publication/license terms.

## V7 stage 1: forest and order costs, 2026-11-10

In the isolated frontier worktree, scripts/verify.ps1 passed: 37 native Fe tests, 16 adapter tests, four campaign suites, six preserved-v6 replay tests, mocked UI tests, malformed-input checks and six bounded 24-action self-play samples. Those samples are unfinished, not draws. A genuine current-v7 Hard-Blue/Easy-Red game ended in Blue victory after 58 actions and replays exactly through 45 HTTP requests. The full match validates transport/turn flow, not specialist use or broad balance. The two capital-defense audits remain explicitly frozen-v6 compatibility tests, not proof of v7 strength.

Focused new coverage exhausts bounded detachment compositions and verifies one/two-order legality, forest infantry cover, cavalry open-ground behavior, exact expensive-move side handoff, a valid revised opening and Fe forecast/apply agreement. Independent source review found a siege test fixture accidentally training cavalry and a stale version label; both were corrected before the successful aggregate. Frozen v6 source bytes match the preserved campaign checkout. No live server/checkpoint changed and no new real-browser or human playtest occurred. V7 remains unreleased for subsequent staged features.

## V7 stage 2: town specialties, 2026-11-10

The full aggregate passed with42 Fe tests and18 adapter tests, plus the existing frozen replay/campaign/tactical, mocked UI, parser and bounded self-play checks. The same58-action current-v7 win still matches the real Red policy through45 HTTP requests; no trace was relabeled or regenerated. Directed native tests cover permanence, affordability, all four discounted Arsenal orders, capped training/recruitment, capture, disconnection/reconnection and Granary production through real upkeep. Adapter traces verify both captured specialties and their exact previews.

A constructed Granary policy test originally competed with a worthwhile attack that reduced threat and upkeep. Both policies rationally preferred that attack. The fixture was revised to test a one-order sustainable-food investment rather than increasing policy weights to force the desired answer. Granary's2-food purchase offsets its first extra harvest; the test proves equal first-harvest losses and two fewer losses at the next harvest. This is sustained support, not instant starvation relief.

Independent source/test review found no blocking defect; an omitted protocol outcome label was corrected. No real-browser or human playtest occurred, and existing previews remain unchanged. Difficulty/balance conclusions still require broader playtesting.
