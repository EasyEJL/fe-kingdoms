# Development history

This is a reconstructed summary, first written on 2026-11-09 from the current code, test evidence and project conversation. It is not a complete pre-Git history and does not imply earlier commits existed.

1. The project pivoted from a differential-testing investigation to a standalone playable strategy game. The earlier transition prototype and Dragonstales work were preserved separately.
2. A native Fe engine, bounded headless protocol, thin Python adapter and simple browser board were implemented. The initial priority was a complete interaction and match, not terminal polish or framework work.
3. Automated self-play exposed passive play and expensive ordering work. Advancement evaluation and cached action ordering were improved. The retained test suite then produced decisive complete matches and exact replays.
4. Eric's first playtest found the turn structure confusing and Easy punishing. The browser was revised to show each human order, pause before Red, explain the kingdom-wide budget and display Fe-backed forecasts. The underlying two-order rule and AI algorithms were kept unchanged for the next playtest.
5. The user requested local Git and documentation. The initial commit captures the existing implementation and starts normal project history from this point. No remote or publication is configured.

Future entries should cite actual commits, tests and playtest findings. Do not reconstruct exact dates, authorship or intermediate changes without evidence.

After the initial local commit, the user authorized hexes first and staged mechanics work. The next milestone implements actual axial movement, supply and distance evaluation, grouped territory actions, and read-only compatibility for square-map saves. See ADR 0005 and Git history for the exact change.

The campaign milestone adds bounded map sizes, ridges/passes, settlements and food. Full integration tests pass, but self-play identifies a fortification/maximum-attack mismatch and defensive stalls. That finding motivates a separate siege/specialist decision instead of hiding balance problems or rewriting the earlier history.


The true-hex milestone was committed as bd40373; the campaign milestone as ef898df. The next local milestone adds mixed infantry/cavalry/siege, explicit paid town training, native composition forecasts and frozen v3 replay support (ADR 0007). The final full suite passes, including six completed matches and a complete HTTP capital capture. Hard/Hard develops specialists but still draws; no draw-rule change was made. A narrow optional town-evaluation experiment was tested and reverted before the final verification, so it is not part of the committed engine. The guided Fe tour was updated to follow the actual v4 functions and protocol. Human retesting remains the next design checkpoint.


Eric subsequently described v4 as fun enough to improve the visuals and requested zoom, terrain imagery and troop-count badges. The visual milestone is presentation-only, developed on feature/visual-map in a separate worktree and preview port so the active match is not replaced. Initial browser review verified basic small-map rendering and first recruitment, then stopped at a tool URL-verification barrier. Review findings led to compact contextual role help and genuine narrow-window Fit. Final source review, UI unit tests and the full native/HTTP regression suite pass. See ADR 0008 for the remaining visual checks and preservation boundary.

The v4 visual milestone was committed as 9cc4239. Eric then played a large Easy campaign and reported enjoyable, challenging fighting interrupted by the sixty-round cap. He authorized map-size limits and the next bounded mechanics slice. Rules v5 replaces that forced adjudication with explicit review/continuation, preserves frozen v4 replays and expands the bounded trace. Its full suite passes; self-play samples are explicitly unfinished harness runs, alongside a separate complete capital-capture regression. See ADR 0009 and the v5 validation entry. Rivers with fixed crossings and supply previews are the next milestone, not part of v5. No remote or live-server switch was made.

Campaign continuation was committed as b1ae2ff. The next v6 milestone replaces the ridge maps with fixed rivers/bridges, moves route evaluation to exact cached BFS, adds small shared terrain/unit properties and exposes Fe-derived supply counts before/after orders. Frozen v5 and exact replay snapshots preserve the previous rules. ADR 0010 records the boundary: no construction/destruction, forest materials, town specialties or movement-speed changes. The final full suite passes, including a new 62-action capital win; independent review found no remaining blocker. The guided Fe tour follows the new capabilities and forecast path. Live games remain isolated.

Fixed rivers/supply previews were committed as 03e5603 and served separately on localhost:8767. Authorized model-simulated Small/Medium playtests then completed two real capital victories against native Fe Easy, with exact replay and forecast checks. Their concise findings and compact replays are preserved under docs/playtests. Browser/human validation and final difficulty calibration remain separate. No mechanics were changed in response to these two tests.
