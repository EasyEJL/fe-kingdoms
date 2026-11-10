# A guided tour of the Fe engine

This guide describes the **unreleased version 7 frontier engine**. Start with the ideas below, then follow the named functions. You do not need to understand every Fe language feature before understanding the game. Read the decision records alongside this guide for why the rules evolved; this is a tour of the current implementation, not a claim that balance work is finished.

## 1. The useful mental model

The game takes a position and a legal order and returns the next position:

```text
next_state = apply(current_state, action)
```

That function is written in Fe. The computer explores possible futures by calling it. The browser's forecasts call it too. There is one implementation of combat, costs, supply consequences and victory, rather than separate human and computer rulebooks.

The Fe code compiles to a **native executable**. This game is not an EVM contract, does not require a blockchain and does not deploy anything on-chain.

## 2. Follow one click

1. `web/index.html` displays the position, legal orders and forecasts returned by Fe. Opening a territory card only changes selection; it spends no order.
2. A human order sends the accepted action sequence plus the new action to `/api/game`. Mode 1 means Red does not move automatically.
3. In `server.py`, `request_text` validates the request shape and serializes integers. `game` starts the native executable. Python does not decide legality or battle outcomes.
4. In `src/native.fe`, `run` creates `initial(scenario)`, checks each action with `is_legal`, and reconstructs the position with `apply`.
5. After both human orders, the position belongs to Red. **Run computer turn** sends mode 0. Fe calls `choose`, validates its action and applies it until Red finishes or the match ends.
6. Fe emits state, accepted actions, legal actions and forecasts. Python's `decode` turns the numeric records into JSON; the browser renders them.

Each request reconstructs state from orders. The HTTP process does not hold a hidden authoritative game session. Saves contain actions, not a state snapshot that the engine blindly trusts.

## 3. Read the data model

Start with `State`, `Action` and `Actions` in `src/engine.fe`.

- `State` holds tile ownership, total troops, cavalry, siege, forts and settlements; both kingdoms' gold/food; and scenario/turn information.
- Arrays have fixed capacities: 64 tile slots and 1,024 legal actions. `tile_count` selects the active cells; the largest current map uses 45.
- `Action` has `kind`, `from`, `to`, `amount`. Kinds 0..4 mean pass, move, recruit infantry, fortify and build/upgrade settlement. Kinds 5/6 recruit cavalry/siege; kinds 7/8 explicitly train one existing infantry into cavalry/siege. Kinds 9/10 are the global extend-campaign and accept-draw decisions.
- `Actions.len` marks how much of its fixed array is populated.

A few Fe features used here:

- `let` is immutable; `var` is mutable.
- `impl Copy for State {}` makes positions copyable. `apply` works on a local copy and returns it, making trial moves natural.
- A final expression can return a value. The trailing `s` in `apply` returns the position.
- `usize` is used for indexes; `i64` for game quantities and scores.
- Parameters such as `_ s: State` are called positionally: `apply(s, action)`.

Most functions receive their inputs explicitly. A few use Fe capabilities: `add` declares `uses (list: mut Actions)`, supplied by `with (Actions = result)`. `place_army` declares `uses (state: mut State)`: callers supply their local position with `with (State = s)`. It updates total troops and both specialist counts together. Search similarly receives its mutable `Search` counter. Native I/O declares reader/writer capabilities. These are explicit dependencies, not hidden global game state.

## 4. Real hex geometry

Read `map_width`, `map_height`, `hex_distance`, `neighbor`, `terrain` and `passable`.

Coordinates are axial: q is the column and r the row. `neighbor` enumerates six directions and returns the sentinel `MAX_TILES` outside the map. Callers check it before indexing. Mountains and rivers are impassable. Fixed bridges cross the central river, and the wider maps have a central widening that creates real land detours.

`hex_distance` measures unobstructed distance. `route_distances` uses exact breadth-first traversal of passable hexes; `travel_distance` is its point-to-point wrapper. `navigation` builds distance arrays from both capitals. `choose` supplies this Navigation capability once, and the cached evaluation/ranking/search functions reuse it for every trial state. Those distances ignore ownership and describe fixed terrain routes. Supply deliberately uses a separate ownership-sensitive traversal. V7 construction replaces this fixed-topology assumption with four cached route variants; each trial selects the variant for its own bridge mask. See the v7 section below.

The browser receives coordinates and terrain from Fe. Its layout code does not decide adjacency.

## 5. Legal orders are the gate

Read `legal`, then `is_legal`.

`legal` checks ownership, supply, resources, settlement requirements, stack limits, passability and adjacency. It offers half-stack and all-but-one moves where allowed. `is_legal` requires a submitted order to exactly match that list.

Specialists require a supplied town (settlement level 2). Recruiting cavalry costs 4 gold and 2 food; siege costs 5 gold and 3 food. Recruitment adds one troop and needs room below the 12-troop cap. Training costs the same resources and an order but converts one existing infantry, preserving total headcount. It is available at the cap, but requires infantry to convert. Neither movement nor friendly merging silently changes troop types.

`apply` assumes prior validation, or an action selected directly from `legal`. It is not a public apply-any-integers function. Both the replay loop and AI respect this boundary. The browser can safely group buttons by territory because it filters an Fe-generated list instead of recreating legal-move rules.

## Army composition: read this before combat

`Army` is a small copyable value with infantry, cavalry and siege counts. `State.troops` remains the total; `army_at` derives infantry by subtracting the two specialist counts. `army_size` totals an `Army`, and `place_army` writes it back consistently. `combine_armies` and `subtract_armies` keep friendly merging and departures explicit.

`detachment` decides which troops move. First reserve one garrison, preferring infantry, then cavalry, then siege. From the remaining mobile pool, assign the requested number proportionally: integer division gives initial counts, then largest remainders receive the unassigned places. Ties prefer infantry, cavalry, siege in that order. Moving half a mixed army therefore preserves real unit types; it does not turn the moving troops into whichever role is convenient.

`attack_power` starts with the number of attackers. Cavalry adds strength on plains and farms. Siege adds strength against a fortified tile, settlement or capital. Defense combines defender count, fort level and hill/bridge protection, plus one forest cover when at least one defending infantry remains. A strictly stronger attack captures; a tie does not.

`capture_losses` converts defense into casualties proportional to attacking headcount and power, rounded up and capped to leave a survivor after a successful capture. `lose_troops` removes infantry first, then cavalry, then siege. The same casualty order serves combat, isolation and food shortages. A repelled detachment is lost; the defenders suffer damage but retain at least one troop.

A conceptual forecast to follow in code: send a mixed infantry/cavalry detachment onto a farm and inspect its cavalry bonus; compare a mixed infantry/siege attack on a fortified settlement and inspect its siege bonus. These are role examples, not a fabricated transcript of a played battle. In `src/native.fe`, each forecast includes the selected detachment, attack power and resulting source/target composition. The preview's survivors come from `apply`, so the UI does not independently simulate combat.

## 6. One order, then the economy

Read `apply` in order. It deducts the Fe-computed order cost and resources, performs the action, checks capital capture, and changes sides when orders run out. Passing forfeits the remaining orders. A terminal position returns before another turn begins.

Then follow:

- `supply`: breadth-first search through owned, passable hexes connected to the capital.
- `army_upkeep`: food cost, with lone garrisons free.
- `economy_with_supply`: production, upkeep, disconnected tiles and shortage using an existing supply map.
- `economy`: wrapper that computes supply first.
- `begin_turn`: income, resource caps, isolated attrition and shortage casualties.

The food sequence matters: production is added, the stockpile is capped at 40, and only then is upkeep deducted. A full store does not bypass upkeep. Gold income is also capped at 40. `begin_turn` is the source of truth for projected next-turn resources.

Shortage casualties are deterministic: largest connected armies lose mobile troops first, with mirrored tie ordering for the kingdoms. There is no dice roll or computer subsidy.

The native forecast loop calls `apply(s, action)` for every legal action and reports resulting costs, troops, ownership and terminal result. It does not maintain another combat formula. Adapter tests compare forecasts with actually submitting each action.

## 7. How the computer thinks

Read `select_focus`, `breakdown_cached`, `ranked_focused`, `search_focused_cached`, then `decide` and the `choose` wrapper.

`breakdown_cached` produces additive components for a position and frozen decision focus; `evaluation_total` sums them. The baseline `evaluate`/`evaluate_cached` diagnostic wrappers use normal advancement, while production `decide` supplies the actual selected focus. Scoring includes: victory first, then resources, territory, troops, specialist value and nearby siege targets, forts, supply, settlements, farms, bridges, advancement, threats and food shortages. These weights are strategy heuristics, not extra rules or resources.

`ranked_focused` tries legal actions with `apply` and sorts their actual focused evaluation totals. Easy takes the top one-ply result. It is short-sighted but still takes an obvious win.

Hard examines up to ten root candidates and three further action plies, keeping up to six candidates inside the tree. Alpha-beta bounds skip branches that cannot improve the result. Because a kingdom gets two orders, a ply does not necessarily switch sides: `search_focused_cached` checks `s.side` to maximize or minimize appropriately.

Beam limits keep work bounded but do not guarantee optimal play. Stable ordering makes decisions repeatable. `Search.nodes` is the reported search counter, not a count of every heuristic evaluation during sorting.

## 8. Native boundaries and tests

The parser in `src/native.fe` rejects malformed numbers, overflow, extra fields, inputs over 131,072 bytes and traces over 2,048 actions. Version 6 retains campaign-decision state and limits, adding supply counts and changed fixed-river scenarios. Browser modes are 1 (replay only) and 0 (computer response); headless modes 2 and 3 support full self-play and one Fe-selected action.

The host routes versions 1 through 6 to frozen read-only replay executables, so old actions are not silently given new movement or economy semantics.

`scripts/build.py` verifies the compiler hash, concatenates unchanged Fe source and calls `fe build --backend native`. It does not translate host-language game logic. `scripts/test_fe.py` combines the engine and `src/tests.fe` and runs native Fe tests. Broader verification adds transport, replay, full matches and UI units.

Read these tests first:

- `recruitment_costs_and_two_order_handoff`: a compact transition example.
- `supply_cut_stops_income_and_causes_attrition`: territory affects economy.
- `food_shortage_forecast_equals_actual_losses`: forecast versus transition.
- `both_difficulties_take_capital_wins`: a tactical AI obligation.
- `every_bounded_composition_detaches_and_merges_exactly`: enumerates every infantry/cavalry/siege composition of total size 2 through 12 and every possible detachment size. It checks conservation, nonnegative counts, reserved garrisons and determinism, plus one exact proportional split.
- `specialist_recruitment_and_training_are_explicit_paid_orders`: town requirements, costs and training at the stack cap.
- `role_power_depends_on_target_and_infantry_combat_is_unchanged` and `mixed_capture_repel_merge_and_losses_preserve_roles`: target-dependent strength and composition after battle/merging.
- `attrition_and_hunger_use_the_same_casualty_priority`: loss ordering and isolated specialist garrisons.
- `full_frontline_can_train_and_breach_the_fortified_pass`: both policies select siege training at a full frontier town; after the fixture builds its siege force, both select the breaching assault. This is a focused tactical fixture, not an unattended campaign proving the AI plans the entire sequence.
- `both_policies_take_specialist_capital_wins`: both difficulties recognize a specialist-enabled finishing attack.

This is bounded invariant and tactical coverage, not exhaustive game-tree coverage or proof of campaign balance. Test results belong in the current verification report rather than being assumed from the existence of these tests.

Native/HTTP tests and mocked UI tests do not establish visual browser correctness or enjoyment. Keep actual browser checks and human playtests separate.

## Three small exercises

Use the current built v6 executable from the project directory. These fresh headless positions do not alter a browser match or its saves.

```powershell
$p = (Get-Location).Path
$image = 'sha256:32e644f1599ac63427a9e545d643ad75adee6f14328c4b7d1be01e3bf728391d'
```

### 1. Find the initial state

```powershell
'7 1 0 0 0' | docker run --rm -i --network none -v "${p}:/work:ro" -w /work $image ./out/kingdom
```

The header means version 7, replay-only, Easy, small scenario, zero actions. Find tag 1 for turn/resources, tag 6 for map metadata, tag 7 for economy, tag 8 for supply counts and tag 3 for legal actions. Compare with `initial(0)` and `economy`.

### 2. Separate your orders from Red's response

```powershell
'7 1 0 0 2  1 0 1 5  1 1 6 7' | docker run --rm -i --network none -v "${p}:/work:ro" -w /work $image ./out/kingdom
```

Tiles 0, 1 and 6 are A1, B1 and B2 on the small map. This joins five capital troops into B1, then sends seven infantry into the forest village B2, spending both orders. Tag 1 shows Red to move; the accepted trace still has exactly two actions. Change only the header's second field from 1 to 0 and rerun: Fe adds Red's response. Follow the relevant branches in `run` and `apply`.

### 3. Predict an assertion, then run it

Open `src/tests.fe` at `recruitment_costs_and_two_order_handoff`. Predict the asserted gold, food and order values before reading `apply` and `begin_turn`.

```powershell
docker run --rm --network none -v "${p}:/work" -w /work $image python3 scripts/test_fe.py
```

This runs the native rule suite and writes generated test/build artifacts only. It does not edit rules or saves. Use `scripts/verify.ps1` for all project checks.

When changing a rule, identify its authoritative Fe function, add a focused test and decide whether replay semantics require a new version. Then update the UI descriptions and relevant ADR.


## V5 campaign boundary

Read `base_round_limit`, `legal`, `apply` and the native `run` loop together. Fe tracks completed full rounds and the current limit. Red finishing the threshold round pauses before Blue's economy, with the match still ongoing. Only the two campaign decisions are legal then. Extension records an action, increases the limit by twenty and begins Blue's deferred turn; accepting the draw records the terminal decision. Search and automatic modes stop at this boundary.

The native trace is bounded to 2,048 actions. Reaching capacity suppresses legal output but does not turn an unfinished match into a draw. The Python harness also has its own test budget, separate from Fe outcomes. Frozen v4 remains available for exact older replays.

## V6: small abstractions, visible supply consequences

`TerrainProfile` contains only walkability, defense bonus and whether the ground is open. `UnitProfile` contains current recruitment costs/count and the two existing attack bonuses. Legality, defense and attack power read these shared facts. The three named Army fields, proportional detachments and casualty priority remain explicit. Adding a profile does not imply every type has unique movement or a generic rule framework.

`SupplyCount` and `supply_count` count owned passable holdings connected to the capital or cut off. Native output emits current counts in tag 8, then calls the same function on each actual `apply` result for tag-5 previews. The browser labels the counts and differences. It does not infer graph connectivity, predict an attack itself or mistake every ownership increase for reconnection.
For focused v6 examples, read `fixed_rivers_bridges_and_cached_capital_routes_match_oracle`, `both_policies_capture_bridge_and_cut_enemy_supply`, `supply_counts_distinguish_capture_cut_and_reconnection` and `navigation_cache_is_scoped_to_one_decision`. These are constructed tactical/invariant fixtures, not human playtests. The HTTP suite separately compares every preview along a real complete winning replay with the resulting state.
## V7 stage 1: meaningful movement costs

Read move_order_cost and order_cost after detachment. The actual moving composition determines cost: any siege spends both orders, otherwise cavalry entering forest spends both, otherwise one. This means a half move that leaves the specialist home can remain cheap. legal filters unaffordable order costs; apply deducts exactly the same value. Native forecasts expose orderCost and total tile defense rather than asking JavaScript to reproduce the rule.

Hard still searches four action plies, not four order points. Expensive moves change which turns fit inside that horizon. Tests and playtesting must evaluate that behavior rather than treating the depth number as unchanged strength.

## V7 stage 2: one town choice, shared prices

A specialty is tile state, not ownership state. Capture changes ownership without erasing the choice. Granary production reads the same connected-supply map as the rest of economy. Arsenal pricing is shared by legal, apply and forecasts, so paid training and recruitment agree. Look for kind11 and the specialty price helper; the adapter only exposes Fe's chosen state and costs. A town cannot switch its specialty later.

## V7 stage 3: mutation without stale routes

Construction records two bits in State, so replay reconstructs it from kind12 just like other actions. A designated site remains identifiable after building. The new bridge is neutral and empty; ownership changes only when an army occupies it. Supply and military movement remain different questions.

Navigation prepares all four topology variants once per decision. Read the route-selection helper inside evaluation: it must index using the candidate State, not just the original root. Tests compare every variant with an independent graph oracle and evaluate a built position using a cache prepared before construction. This is a bounded domain-specific cache, not a general mutable-map framework.

## V7 stage 4: priorities and honest feedback

The small priority selector reads the current board, then freezes a focus/target for one decision. Defending a directly threatened capital comes before reconnecting a valuable holding, food support and normal advancement. The focus is actually used in evaluation. It is not an invented description added after the move, and can change on the next order.

Read the named evaluation components and their total together. The same total ranks actions and scores the search leaves. The automatic decision record reports the actual chosen search value and the immediate component changes from applying that action. These are different quantities: Hard may accept a short-term loss for a better searched continuation. The UI therefore calls the component result an immediate evaluation change, not the complete rationale.

Only the last two actual automated decisions are returned, sufficient for an ordinary Red turn. The action replay remains minimal and authoritative; a replay-only load has no saved search explanation. Follow the native trace index when matching a report to an action. Per-decision nodes and configured action-ply depth describe effort, not guaranteed strength or exhaustive search.

### Verified current-v7 browser/Fe boundary example

At implementation commit `0517958`, replay-only loading the Small opening A1 → B1 with 5 and B1 → B2 with 7 returns exactly two actions, Red to move with 2 orders on side-turn 2. Requesting an automatic response adds two actual Easy Red recruitment orders at E2 (tile 9), then returns Blue with 2 orders on turn 3. The two new reports identify trace indexes 2 and 3, normal-advancement focus targeting Blue's capital, configured depth 1 and 19/25 reported nodes. This was verified through the isolated local HTTP adapter, not by a browser click test. Different future policies may legitimately choose other orders; preserve the implementation/replay version when teaching this exact trace.

## V8 experiment: follow one research order through Fe

The kingdom-development slice is a small example of adding a rule without moving authority into the browser. Read ADR0017 for its experimental prices and compatibility boundary.

1. `State.developments` holds one fixed bitmask per kingdom. This is kingdom knowledge, not a property of a captured town. `development_bit` and `has_development` interpret the three finite IDs.
2. `development_town` searches owned, supplied towns and returns the lowest eligible infrastructure index. `can_research` combines that result with the turn, prerequisite, ownership of knowledge and actual resource stocks. `legal` emits action kind 13 only when the order is genuinely possible.
3. `apply` pays the Fe-defined gold/food costs and adds the discovery bit. Normal one-order accounting still controls the handoff. A first-order Charter can unlock a branch as the second order if the town specialty and remaining resources qualify.
4. `economy_with_supply` computes Charter income and capped farm support from the current board. Losing a required supplied town suspends the benefit. `recruitment_gold` is shared by infantry legality and payment, so Muster cannot make the UI price disagree with the actual purchase.
5. `native.fe` exports six bounded development rows and one resulting-development projection per legal action. Those projections come from actual `apply`, not a second forecast formula. Python checks the versioned record structure and serializes it; HTML shows prerequisites, eligibility, prices and afterstates.
6. Replay stores only the ordinary action sequence. Rebuilding it reproduces knowledge and economy. Frozen v7 follows its own engine; a version number is not a safe migration operation.

Stage A deliberately retains the prior evaluator. New legal research does not imply that the old short-horizon opponent will invest well. The planned next experiment changes Fe investment valuation under identical v8 rules, preserving a pinned Stage A baseline for comparison. The observed policy behavior, not just successful compilation, determines whether that change is useful.
