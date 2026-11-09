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
