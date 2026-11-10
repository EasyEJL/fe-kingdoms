# V6 capital-threat audit

Recorded 2026-11-10. This is a bounded native-engine test of two positions preserved from the Small/Medium simulated-player games, not a new game rule or a full campaign-strength assessment.

## Question

At the Red turn immediately before each documented two-order Blue capital capture, could Red prevent that immediate loss? Does the existing Hard policy find a defense that Easy misses?

The source positions are the first 66 actions of [Small](playtests/v6-sol-small.json) and first 46 actions of [Medium](playtests/v6-sol-medium.json). Both positions give Red its normal two orders. No fabricated resources or invalid board edits are used.

## Observations

- Small has 185 legal completed Red turns, 120 of which leave no Blue capital win within the following two orders. Easy recruits at tiles 13 and 9 and permits the recorded finishing attack. Hard attacks tile 8 from 9 with two troops, then recruits at 9. The invading army is weakened enough that no legal Blue two-order capital capture remains.
- Medium has 738 legal completed Red turns and nine immediate defenses. Easy's first recruitment at tile 20 commits to an immediate loss: no legal second order saves the capital within this horizon. Hard instead moves five troops from capital 34 to tile 27, then attacks tile 26 with seven. No legal Blue two-order capital capture remains afterward.

Hard reduces Blue's frontier force from five to three in Small and from eight to one in Medium. Its selected first actions have zero-based ranks six/seven in root ordering, within the ten-candidate beam; the observed winning Blue lines rank zero/one, within the six-candidate reply beam. Four plies cover both Red orders and both Blue orders in these positions.

Hard's attacks can be repelled while still accomplishing defensive attrition. A battle's attacker losses alone do not establish that the order was a blunder. This explains why examining whole turns and actual legal continuations is more useful than counting failed attacks.

These cases demonstrate a meaningful effect of deeper planning under identical rules/resources. They do not prove that Hard wins the eventual campaign, that either difficulty is well calibrated for beginners, or that Hard handles every capital threat.

## How the test works

`tests/tactics.fe` is a test-only harness compiled with the unchanged authoritative engine and its native parser/output helpers. It calls Fe's `legal`, `apply`, `choose_cached`, `ranked` and `search_cached`. Python orchestrates execution and compares results; it does not implement movement, combat or scoring.

The oracle enumerates all completed Red turns from each fixed puzzle, then all legal Blue winning sequences within its next turn, at most two orders. Every counted Red completion is asserted to reach an ordinary, nonterminal Blue turn with two orders. Draws and pending campaign decisions are excluded from this audit rather than silently counted as defenses. Production policy responses are checked against the ordinary native executable. The observed decisions and all emitted winning/defense witnesses are replay-validated. Enumeration output is repeated to check determinism.

The regression requirement is that Hard prevents an immediate Blue win. It does not require a particular defensive order, and does not require Easy to remain weak. The historical Blue finishing lines provide positive checks for the oracle, independent of how a future Easy policy responds. A future policy improvement is not a regression simply because its old diagnostic miss disappears.

Run `python3 scripts/test_tactics.py` inside the existing pinned offline image, or run `scripts/verify.ps1` for the complete project suite. Generated `evidence/v6-tactics.json` records counts, decisions, witness lines, timings and input/source hashes. Interpret an unfinished/failed run as such; the validation record states the actual final result.

## Next use

Keep these puzzles as capital-defense obligations while mechanics or evaluation evolve. Add more positions only when actual play or a concrete bug supplies a reason. Do not infer a broad difficulty rebalance from two favorable examples or build a general game-solving framework around them.
