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
