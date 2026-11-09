# Fe Kingdoms (Crownlines)

A complete, local, browser-playable two-kingdom conquest game. The native Fe 26.5 engine is authoritative for initialization, legal orders, combat, supply, economy, victory, evaluation, search and both difficulties. Python is a small standard-library HTTP/process adapter. HTML/CSS/JavaScript displays Fe state and submits Fe-generated orders. No LLM or external game engine participates.

See [docs/README.md](docs/README.md) for decisions, development workflow, validation and the proposed roadmap.

## Play

Docker Desktop must be running with the existing pinned Linux toolchain image. In PowerShell:

```powershell
Set-Location C:\Users\Eric\dev\fe-kingdoms
.\launch.ps1
```

Open **http://localhost:8765**. Blue is you; Red is the computer. Click a territory and a listed order. Select Easy or Hard before New game. Each side receives TWO orders TOTAL across its entire kingdom, not one per territory. Selecting a tile is free. Each order is shown immediately. After your second order, review the position and click Run computer turn; Red does not act until that explicit handoff. End my turn forfeits the remaining orders and also pauses before Red. The board shows ownership, troop count, forts and supply. Every available order includes a Fe-generated forecast, including costs and whether an attack captures the target or loses all attackers. Legal actions and forecasts are generated in Fe, never by browser rule code. The page contains complete command help.

The current verified server may already be running in container `fe-kingdoms`. `launch.ps1` recognizes it. To stop it, run `docker stop fe-kingdoms`; then launch again to rebuild. An ordinary foreground launch also stops with Ctrl+C. Nothing is deployed publicly. Docker publishes port 8765 only to 127.0.0.1. If another application occupies that port, stop it or choose another port consistently in the launch command and browser URL.

## Rules

- Full-information 5x3 map, two kingdoms, one currency (gold), one army type, and up to two fort levels. No random combat.
- Both start with 6 gold and symmetrical territory/armies. Blue moves first. The opening Blue turn uses that starting treasury; income is collected on subsequent turn changes.
- Move half a stack (rounded down) or all but one troop orthogonally. Friendly stacks combine, maximum 12. One troop remains behind.
- Recruit 2 troops for 3 gold or fortify by 1 for 2 gold. Both require ownership and a supply path through your territory to your capital. Fort cap: 2.
- Defense = defenders + fort + 1 on hills. Attackers must strictly exceed defense to conquer; survivors = attackers minus defense, and captured forts disappear. Otherwise all attackers are lost; defenders lose max(1, attackers minus fort minus hill bonus), with at least one surviving. The troop and fort caps are enforced by Fe's legal-action generation.
- At the start of the incoming side's turn: gain 2 gold plus 1 for each supplied farm/town, capped at 30. Each disconnected territory loses 1 troop, minimum 1.
- Capture the enemy capital for immediate victory. Four consecutive end-turn actions or completion of 120 side turns produces a draw. A non-pass action resets the consecutive-pass count.
- Easy uses greedy one-ply evaluation. Hard uses four-action-ply alpha-beta minimax, a 10-action root beam and 6-action interior beam. The shared evaluation values material, supply, economic territory, advancement and capital threats. Stable ordering makes every decision deterministic. Both levels have identical resources and rules.

## Save, load and replay

Save replay downloads versioned JSON containing difficulty and the full accepted order sequence, including computer actions. Load replay validates every action in Fe before replacing the board. A loaded replay can be continued; if it ends on Red's turn, use Run computer turn. The browser keeps the latest successful state as a local checkpoint. Export a replay to preserve multiple matches. The checkpoint is specific to browser and origin (localhost and 127.0.0.1 are separate).

Replay stores actions, not trusted state. It does not rerun AI decisions for recorded computer moves. Rules version 1 and this engine build reproduce the state exactly. Changes to game rules must introduce a new replay version rather than silently reinterpret old files. Difficulty controls future computer decisions only.

## Verify

```powershell
.\scripts\verify.ps1
```

The script uses local Node for UI unit tests and the existing offline Docker image for all Fe/Python tests. It does not install dependencies. It builds the engine, executes nine native Fe tests, four complete difficulty-pairing matches, exact replay and malformed-input checks, eight adapter tests, and a complete match through actual HTTP. See `evidence/verification.json`, `matches-summary.json`, `http-full-match.json`, and per-command logs.

Verified on this build:

- All 9 native Fe rule/search tests passed, including supply cuts, combat boundaries, resource/order bounds, terminal states, deterministic search and immediate capital capture.
- Four complete automated Fe-vs-Fe matches ended by capital capture. Easy/easy: Blue, 30 actions. Hard/easy: Blue, 46. Easy/hard: Red, 39. Hard/hard: Red, 52. Hard won both mixed pairings. This small deterministic sample is not a broad balance or strength claim.
- Every match replayed to the exact final board/state. Slowest individual action in the initial final run was approximately 0.153 seconds; timings vary by machine.
- A scripted human-side sequence plus genuine Fe computer responses completed a full match over the local HTTP API.
- UI unit tests cover checkpoint protection, canceled/failed loads, AI activity and successful replay. They use mocked DOM/transport and are not browser interaction tests.

**Playtest status:** Eric tried the first version and found the turn structure confusing, losing badly on Easy. This revision addresses that feedback but has not yet received a second human playtest. Automated browser click-through remains unverified. Windows Computer Use stopped because it could not determine the current browser URL confidently. No browser policy workaround was attempted. The game is served locally, but do not describe this revised flow as human-retested or visually browser-verified. Opening the URL and playing a match is the next useful feedback step.

## Headless interface

Run `out/kingdom` inside the pinned Linux image, with whitespace-separated decimal input:

```text
1 MODE DIFFICULTY COUNT
KIND FROM TO AMOUNT
...COUNT records...
```

- Mode 0: replay then let Fe finish Red's turn. Mode 1: replay only. Mode 2: complete Fe-vs-Fe self-play using one difficulty. Mode 3: choose and apply exactly one Fe action for the side to move (automated tests). The HTTP adapter exposes only modes 0 and 1.
- Difficulty: 0 Easy, 1 Hard. At most 240 records and 16,384 input bytes. Tiles are 0..14, x + 5*y, A1=0 and E3=14.
- Kind 0 pass uses all zero remaining fields. Kind 1 moves FROM to TO by AMOUNT. Kind 2 recruits at FROM=TO with AMOUNT=2. Kind 3 fortifies at FROM=TO with AMOUNT=1. Legal actions must exactly match an Fe-generated action. No arbitrary snapshot import.
- Output tag 0: protocol version, difficulty, accepted trace length. Tag 1: side, orders, turn, result, Blue gold, Red gold, consecutive passes, last action's four fields, search nodes, configured depth. Tag 2: tile index, owner, troops, fort, supplied flag, terrain. Tag 3: legal action's four fields. Tag 4: index and accepted action's four fields.
- Result: 0 ongoing, 1 Blue victory, 2 Red victory, 3 draw. Terrain: 0 plain, 1 farm, 2 town, 3 hill, 4 capital. Owner: 0 neutral, 1 Blue, 2 Red.
- Exit 0: valid result. Exit 2: invalid input/replay. Exit 3: output failure. Invalid input emits no partial successful state.

Example:

```powershell
$p = (Get-Location).Path
$image = 'sha256:32e644f1599ac63427a9e545d643ad75adee6f14328c4b7d1be01e3bf728391d'
'1 0 1 1 0 0 0 0' | docker run --rm -i --network none -v "${p}:/work:ro" -w /work $image ./out/kingdom
```

This ends Blue's first turn and requests an actual hard Fe response. No terminal UI was built.

## Project boundaries and provenance

- `src/engine.fe`: all game rules, legal actions, evaluation and opponent search.
- `src/native.fe`: bounded Fe stdin parser, validated replay and output. Its small decimal parser was reused from the preserved synthetic transition prototype.
- `src/tests.fe`: native Fe rule/search tests.
- `server.py`: serialization, HTTP validation and subprocess invocation only.
- `web/index.html`: browser interface and save/load presentation only.
- `scripts/`: build/test orchestration. Generated Fe files concatenate unchanged source text, not transpile from a host language.
- `evidence/`: exact transcripts, final verification and earlier tuning observations. The initial easy self-play draw and interrupted unoptimized hard self-play predate final evaluation/search improvements; use `verification.json` and `matches-summary.json` for current results.

Uses the existing Fe 26.5.0 (3dab95f) compiler, native Cranelift backend, pinned compiler SHA-256 `3732fbe8a6e9d2ea3925d02d0e3a1478bc1e01d742c2be75d3ea7300c46c45f0`. Build verifies the compiler bytes. Image ID is pinned in the launch/test scripts. This project does not rebuild or download a toolchain.

`fe-transition-lab` and `dragonstales-fe-port` were left unchanged. No publishing, registration, deployment, licensing election, contract deployment or billing action was performed. This is a standalone contest candidate, not a new HTTP framework or serialization library.


## First-play revision and next steps

The two-order rule and both AI algorithms are unchanged. The usability change is explicit pacing: each human order is applied alone, then the human chooses when to let Red take its turn. The display counts rounds and highlights the kingdom-wide remaining order budget. Selecting a tile costs nothing. A concrete first-turn example recruits at A2, then captures B2 using the second order. Fe supplies exact immediate forecasts for legal actions, so failed attacks and their casualties are visible before confirmation.

Easy is short-sighted, not deliberately harmless: it uses a strong greedy evaluation and takes obvious capital wins. One confused first match is not enough evidence to choose a fair handicap. Retest the clearer flow before changing difficulty or increasing orders. No hidden resource or combat bonuses have been added. The unchanged rules preserve version-1 replay compatibility.

For a medieval Risk direction, keep the next step small: first check that a short match offers understandable choices and a satisfying conquest arc. Then test one strategic addition, such as food tied to farms and army supply, before a larger graphical hex map, the requested later-stage direction. Hex movement and adjacency would be a deliberate future rules revision, not just a visual change. Roads and distinct troop roles should each earn their place by creating clear tradeoffs. Avoid adding water, several resources and multiple troop types at once. None of those expansions is implemented in this revision.

Output tag 5 carries each legal action's exact Fe forecast in matching order: action index, outcome, gold cost, remaining source troops, remaining target troops, target owner, next side, next orders, result, pre-attack defense. Outcomes are 0 end turn, 1 friendly move, 2 capture, 3 repelled, 4 recruit, 5 fortify. The adapter only serializes these fields; the browser does not reproduce combat or resource rules.
