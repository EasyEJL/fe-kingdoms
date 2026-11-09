# A guided tour of the Fe engine

This guide describes the **version 3 campaign engine**. Start with the ideas below, then follow the named functions. You do not need to understand every Fe language feature before understanding the game. If a later version adds troop roles, read its decision record alongside this guide.

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

- `State` holds tile ownership, troops, forts and settlements; both kingdoms' gold/food; and scenario/turn information.
- Arrays have fixed capacities: 64 tile slots and 1,024 legal actions. `tile_count` selects the active cells; the largest current map uses 45.
- `Action` has `kind`, `from`, `to`, `amount`. Kinds 0..4 mean pass, move, recruit, fortify and build/upgrade settlement.
- `Actions.len` marks how much of its fixed array is populated.

A few Fe features used here:

- `let` is immutable; `var` is mutable.
- `impl Copy for State {}` makes positions copyable. `apply` works on a local copy and returns it, making trial moves natural.
- A final expression can return a value. The trailing `s` in `apply` returns the position.
- `usize` is used for indexes; `i64` for game quantities and scores.
- Parameters such as `_ s: State` are called positionally: `apply(s, action)`.

Most functions receive their inputs explicitly. A few use Fe capabilities: `add` declares `uses (list: mut Actions)`, supplied by `with (Actions = result)`. Search similarly receives its mutable `Search` counter. Native I/O declares reader/writer capabilities. These are explicit dependencies, not hidden global game state.

## 4. Real hex geometry

Read `map_width`, `map_height`, `hex_distance`, `neighbor`, `terrain` and `passable`.

Coordinates are axial: q is the column and r the row. `neighbor` enumerates six directions and returns the sentinel `MAX_TILES` outside the map. Callers check it before indexing. Mountains are impassable; passes cross the central ridge.

`hex_distance` measures unobstructed distance. `travel_distance` accounts for this map family's passes, so evaluation does not reward marching through mountains. This shortcut is map-specific. The test `route_evaluation_respects_all_chokepoints` compares it against independent breadth-first search for every passable pair on all three maps. A different map generator would need new validation or a more general path routine.

The browser receives coordinates and terrain from Fe. Its layout code does not decide adjacency.

## 5. Legal orders are the gate

Read `legal`, then `is_legal`.

`legal` checks ownership, supply, resources, settlement requirements, stack limits, passability and adjacency. It offers half-stack and all-but-one moves where allowed. `is_legal` requires a submitted order to exactly match that list.

`apply` assumes prior validation, or an action selected directly from `legal`. It is not a public apply-any-integers function. Both the replay loop and AI respect this boundary. The browser can safely group buttons by territory because it filters an Fe-generated list instead of recreating legal-move rules.

## 6. One order, then the economy

Read `apply` in order. It deducts the order and costs, performs the action, checks capital capture, and changes sides when orders run out. Passing forfeits the remaining orders. A terminal position returns before another turn begins.

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

Read `evaluate`, `ranked`, `search`, then `choose`.

`evaluate` scores a position from one kingdom's perspective: victory first, then resources, territory, troops, forts, supply, settlements, farms, passes, advancement, threats and food shortages. These weights are strategy heuristics, not extra rules or resources.

`ranked` tries legal actions with `apply` and sorts their scores. Easy takes the top one-ply result. It is short-sighted but still takes an obvious win.

Hard examines up to ten root candidates and three further action plies, keeping up to six candidates inside the tree. Alpha-beta bounds skip branches that cannot improve the result. Because a kingdom gets two orders, a ply does not necessarily switch sides: `search` checks `s.side` to maximize or minimize appropriately.

Beam limits keep work bounded but do not guarantee optimal play. Stable ordering makes decisions repeatable. `Search.nodes` is the reported search counter, not a count of every heuristic evaluation during sorting.

## 8. Native boundaries and tests

The parser in `src/native.fe` rejects malformed numbers, overflow, extra fields, inputs over 16,384 bytes and traces over 240 actions. Version 3 has a scenario field. Browser modes are 1 (replay only) and 0 (computer response); headless modes 2 and 3 support full self-play and one Fe-selected action.

The host routes older versions to frozen read-only replay executables, so old actions are not silently given new movement or economy semantics.

`scripts/build.py` verifies the compiler hash, concatenates unchanged Fe source and calls `fe build --backend native`. It does not translate host-language game logic. `scripts/test_fe.py` combines the engine and `src/tests.fe` and runs native Fe tests. Broader verification adds transport, replay, full matches and UI units.

Read these tests first:

- `recruitment_costs_and_two_order_handoff`: a compact transition example.
- `supply_cut_stops_income_and_causes_attrition`: territory affects economy.
- `food_shortage_forecast_equals_actual_losses`: forecast versus transition.
- `both_difficulties_take_capital_wins`: a tactical AI obligation.

Native/HTTP tests and mocked UI tests do not establish visual browser correctness or enjoyment. Keep actual browser checks and human playtests separate.

## Three small exercises

Use the existing built v3 executable from the project directory. These fresh headless positions do not alter a browser match or its saves.

```powershell
$p = (Get-Location).Path
$image = 'sha256:32e644f1599ac63427a9e545d643ad75adee6f14328c4b7d1be01e3bf728391d'
```

### 1. Find the initial state

```powershell
'3 1 0 0 0' | docker run --rm -i --network none -v "${p}:/work:ro" -w /work $image ./out/kingdom
```

The header means version 3, replay-only, Easy, small scenario, zero actions. Find tag 1 for turn/resources, tag 6 for map metadata, tag 7 for economy and tag 3 for legal actions. Compare with `initial(0)` and `economy`.

### 2. Separate your orders from Red's response

```powershell
'3 1 0 0 2  2 5 5 2  1 5 6 2' | docker run --rm -i --network none -v "${p}:/work:ro" -w /work $image ./out/kingdom
```

Tile 5 is A2 on the small map. This recruits there, then sends two troops to B2, spending both orders. Tag 1 shows Red to move; the accepted trace still has exactly two actions. Change only the header's second field from 1 to 0 and rerun: Fe adds Red's response. Follow the relevant branches in `run` and `apply`.

### 3. Predict an assertion, then run it

Open `src/tests.fe` at `recruitment_costs_and_two_order_handoff`. Predict the asserted gold, food and order values before reading `apply` and `begin_turn`.

```powershell
docker run --rm --network none -v "${p}:/work" -w /work $image python3 scripts/test_fe.py
```

This runs the native rule suite and writes generated test/build artifacts only. It does not edit rules or saves. Use `scripts/verify.ps1` for all project checks.

When changing a rule, identify its authoritative Fe function, add a focused test and decide whether replay semantics require a new version. Then update the UI descriptions and relevant ADR.
