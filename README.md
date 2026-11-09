# Fe Kingdoms

A local, browser-playable kingdom-conquest game with authoritative native Fe rules and computer play. The current source milestone is **rules version 3: hex campaigns**. The browser and Python adapter only display and transport Fe results.

## Play and verify

From PowerShell, with Docker Desktop running and the existing pinned toolchain image available:

```powershell
Set-Location C:\Users\Eric\dev\fe-kingdoms
.\launch.ps1
```

Open http://localhost:8765. The launcher recognizes a running `fe-kingdoms` container; stop it with `docker stop fe-kingdoms` before rebuilding. During development, the already-running instance may deliberately remain on the previous reviewed milestone while new rules are tested.

Run all automated checks with `scripts/verify.ps1`. It uses local Node for UI unit tests and the pinned offline Fe/Python Docker image. Results and exact replays are regenerated under ignored `evidence/`; a test result must say `passed`, not `running` or `failed`.

## First turn

You are Blue. You get **two orders TOTAL across your kingdom**, not per territory. Selecting a hex is free. Owned territories are listed as expandable action cards, with only one open at a time.

Each human order is shown separately. After both orders, click **Run computer turn** to let Red act. End my turn forfeits unused orders and asks for confirmation. Fe forecasts show costs, survivors, captures and losing attacks before you commit.

On the small map, try selecting A2, recruiting two troops, then moving two from A2 to the neutral village B2. Those are the two orders. Capture Red's capital to win while keeping your own safe.

## Campaign rules

- Three deterministic axial hex maps: 5x3, 7x5 and 9x5. Movement follows up to six shared edges. Mountain ridges are impassable; passes provide chokepoints and a defense bonus.
- Move half a stack or all but one troop. Friendly stacks combine, up to twelve. One troop remains behind.
- Both sides start with eight gold and twelve food, capped at forty each. Recruit two troops for three gold and two food at a supplied capital or settlement.
- Build a village for six gold; upgrade to a town for eight. Both use one order. Supplied villages/towns produce one/two gold each turn. Fortifying costs two gold, with a maximum of two levels.
- Supply follows connected owned hexes to the capital. At the incoming turn, gain base two gold plus connected settlement levels, and base three food plus two per connected farm. Each connected army pays ceil((troops minus one)/3) food; lone garrisons are free. Storage is capped before upkeep.
- Disconnected stacks lose one mobile troop and do not pay global food upkeep. Food shortages remove mobile troops from the largest armies deterministically, never eliminating lone garrisons. The display uses Fe's exact projected stock and shortage forecast for an unchanged board.
- Defense is troops plus fort, plus one on hills/passes. An attack must strictly exceed defense to capture. Otherwise the attack is repelled. Exact losses are shown in Fe's forecast.
- Capture the enemy capital for immediate victory. Four consecutive pass actions or completion of 120 side turns draws the match.
- Easy uses one-ply greedy evaluation; Hard uses bounded four-ply beam alpha-beta search. Their rules and resources are identical, without hidden bonuses.

## Saves and compatibility

Save replay exports the accepted action sequence, version, scenario and difficulty. Fe validates every recorded action when loading. Version-1 square saves and version-2 basic-hex saves load through frozen engines **read-only**. They are never silently migrated. Each rules version has a separate browser checkpoint. Export replays to keep multiple games.

## Current verification and balance limits

The campaign milestone has directed Fe tests for maps, routes, economy, supply, settlements, bounds and opponent determinism, plus adapter/UI/replay/full-match checks. See `docs/validation.md` and the latest generated evidence for actual results.

Self-play exposed defensive stalls: a fortified pass can have defense fifteen while an infantry attack sends at most eleven. Most v3 regression pairings draw, although one small Hard-versus-Easy pairing captures a capital. Specialist siege roles are the next separate milestone; this version is not presented as broadly balanced.

Eric playtested the original square game. The subsequent UI/campaign changes need a new human playtest. Mocked UI tests and HTTP tests do not establish visual browser correctness or enjoyment. Automated Windows browser interaction remains unverified.

## Learn the implementation

- [Documentation index and ADRs](docs/README.md)
- [Development workflow](docs/development.md)
- [Native protocol](docs/protocol.md)
- [Guided Fe walkthrough](docs/engine-guide.md)
- `src/engine.fe`: map, state, legal orders, transitions, economy and search.
- `src/native.fe`: bounded parsing, replay and Fe-generated output/forecasts.
- `server.py` and `web/index.html`: thin transport and presentation.
- `legacy/`: frozen engines for older read-only replays.

Uses native Fe 26.5.0 (3dab95f), with compiler bytes verified by `scripts/build.py`. The pinned image and compiler hash are recorded in `toolchain.lock.json`. No toolchain download, external engine, LLM opponent, contract deployment or terminal UI is involved. Prior transition-lab and Dragonstales projects remain separate. No remote, push, public deployment, registration or licensing election has been performed.
