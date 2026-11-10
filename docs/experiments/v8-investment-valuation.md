# V8 conditional investment valuation, policy B

## Scope and baseline

A is commit `4a0d8a2d476eb6dde88ee9e35b2f75f89dd55c73`, preserved locally at `evidence/ab/kingdom-a` with SHA256 `d93c5d1b74873b9c51120ba79378b5634e51bb66af9df5f1d6e255685d83aaa0`. B changes evaluation only. Legal actions, physical transitions, initial states, protocol and replay rules remain identical. Neither policy's recorded actions are regenerated when comparing a replay. This is an experiment, not a strength improvement claim.

## Exact estimate

`investment_estimate` compares two fixed-board resource projections starting with the same current stocks. One includes currently operational discoveries; the other removes only their gold/food income and infantry discount. The shared `Economy` and supply maps are reused. Inactive knowledge has zero added estimate. No new towns, specialties, farms, captures or reconnections are assumed.

Each projection advances twelve own turns. Production is added and capped at 40 before upkeep, matching the actual ordering. Both projections buy the same prospective infantry reinforcements, only when both can afford them and fully pay upkeep. Each recruit deducts its actual hypothetical price and two food, then adds one upkeep to subsequent projection turns. This is a conservative upper bound on the extra upkeep of two infantry, not an application of new game rules. The forecast does not create future troop material scores.

For each turn, compute the difference between the two projections' changes in gold and food stocks, adding the difference in food actually consumed by upkeep. Extra rations that feed armies remain useful rather than disappearing from the estimate. Multiply by two on turns 1–6 and one on turns 7–12. These weights are the existing two-point resource scale times a full/half discount. Sum the twelve contributions.

Jointly projecting the bundle avoids adding separate overlapping technology valuations. Counterfactual purchases are identical, so extra production cannot manufacture demand or claim purchases the no-discovery economy cannot fund. Stock saturation can erase future receipts; when the comparison catches up, the corresponding reduction in marginal stock is included rather than counting the same gold repeatedly.

Charter's theoretical unsaturated return is 18 score points against its twelve-point purchase expense. The branches cost sixteen points. Three discounted Muster uses could earn at most six points and are not enough to justify its purchase. Even eight full-value uses merely break even. An operational discovery can have zero useful return; it receives no minimum asset or prerequisite-option bonus.

The estimate enters the existing economy component. Rotation's existing five-point food-net contribution is subtracted there, replaced by the measured forecast. When the frozen focus is food support, the root kingdom's additional three-point food-net contribution is also offset; the enemy always receives only the five-point correction because food focus is root-only. Immediate shortage penalties remain intact as a separate tactical risk. All other components and the eight-component decision report are unchanged. A capped Rotation may have a negative adjustment relative to A because its old uncapped food-net reward is removed.

## Finite recruitment-demand assumption

`investment_demand` never reads discoveries. It selects one existing supplied infantry recruiting site, with no cavalry/siege in its source army and room for an initial two-infantry recruit. It examines that site's own tile and adjacent supplied friendly tiles. Only holdings adjacent to actual opposing mobile troops count as frontier recipients. Neutral expansion is not assumed.

Demand is half of the smaller of (a) total vacancies in these frontier holdings and (b) nearby unique enemy mobile troops minus the local frontier mobile defenders, floored at zero and capped at twelve recruit orders. Enemy troops are counted once. The highest demand wins, with mirrored scan order breaking ties. This is not an automatic preference for an Arsenal, so Muster receives no discount value if another site is selected.

At most one recruit per projected turn reserves the second order for infantry distribution. The finite vacancy/threat budget is never refreshed by assumed battles. Gold, food and increasing upkeep further constrain throughput. No demand means no prospective discretionary expenditure. The actual legal half/all-but-one detachments and future enemy moves are **not** simulated: distribution is an explicitly conditional throughput estimate, not proof of a legal twelve-turn reinforcement plan. A threatened or captured recruiting site may never realize the projected benefit. Tactical search and existing capital/supply scores remain responsible for immediate choices.

## Cost and validation

No additional BFS, legal-action enumeration or search is called from evaluation. Inactive discovery states exit early. Operational states inspect bounded source neighborhoods (at most seven holdings and six neighbors each per candidate source), then run twelve scalar projection steps per kingdom. Existing search breadth/depth stays unchanged. Native wall-clock timings and actual choices, not just node counters, must accompany the comparison.

Focused Fe coverage includes low-stock versus capped/no-demand states; discovery-independent demand; food-limited throughput; supply loss; absent prerequisite infrastructure; removing Rotation double-counting under normal and food focus; additive decision sums; pure evaluation with unchanged transitions; and preservation of capital wins, necessary defense and supply-cut tactics. The original A purchase-score assertion is explicitly replaced with `before - 12 + measured estimate`, preserving the actual liquid-resource expense rather than weakening payment tests.

Final focused B run: **69 Fe tests passed**, including the regression for enemy Rotation under root food focus and a mirrored-state check across all eight discovery masks and four bridge masks. The latter checks both seats and equal-demand recruitment-site tie handling. An initial cancellation error applied the root-only extra three points to the enemy too; code review identified it, it was corrected, and both tests and native measurements were rerun. Unit fixtures do not establish campaign strength or human enjoyment.

## Measured native checks

Final B binary SHA256: `fd979b0439a962031a49e1595ba7d392e295b81aaf78b971127a4a56d4ccea0c`. Reproduction script and results are ignored local artifacts `evidence/ab/b-focused-checks.py` and `evidence/ab/b-focused-checks.json`; the latter records source hashes too. Run the script inside the pinned one-CPU, network-disabled Fe container from the worktree root, after building the current executable. The unchanged `scripts/test_fe.py` runs the focused Fe suite.

All **97 prefixes** across the 18-action legal research chain, the 58-action native v8 victory fixture and the prepared 18-action Large checkpoint produced byte-for-byte identical mode-1 output on A and B. This covers accepted traces, physical state, legal actions and every forecast record, rather than merely comparing final resources. It is a bounded cross-state check, not exhaustive equivalence proof. Native source changes are limited to evaluation and its tests. The same milestone also shortens frontend forecast wording without changing game semantics.

Four checkpoints at both difficulties were measured three times per binary. Every repeated complete output was deterministic. Native subprocess wall times include replay and output, but not Docker startup, HTTP or browser rendering. A was measured before B, so cache/order and host activity can affect timings.

Hard median seconds, A to B:
- Initial Large: 0.111 to 0.113.
- Small Charter-ready: 0.140 to 0.140.
- Small Muster-known: 0.158 to 0.189.
- Prepared Large checkpoint: 0.253 to 0.294.

Maximum observed B call was 0.299 seconds. No timeout or replay failure occurred. These are small sample timings, not a guaranteed latency bound.

Two of eight first decisions diverged. At the Muster-known checkpoint Hard B moved capital infantry into the home town rather than the farm. At the Large checkpoint Easy B recruited at tile 33 instead of moving from 33 to 24. Neither divergence was research. At the Charter-ready checkpoint both policies still preferred immediate siege recruitment on Easy and expansion preparation on Hard. The estimate can change decisions without demonstrating stronger play or inducing technology purchases. No weights were increased to force purchases. Longer matched A/B play against the same model-player procedure remains separate work.

## Independent compatibility check

A separate adapter check compared 259 valid replay requests: 221 development-integration prefixes plus all 19 prefixes of each prepared Medium/Large checkpoint. Every native mode-1 output matched byte-for-byte. Three invalid development requests were rejected identically, making 262 comparisons in that separate dataset. These counts are not added to the 97 above as if all were unique. The paths included 83 states with learned developments and one with temporarily inactive retained knowledge. The existing complete HTTP fixture also passed unchanged under B: 58 actions, 45 requests, Blue victory and no research orders. No fixture was regenerated to hide a policy divergence.
