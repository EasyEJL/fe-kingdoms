# Local Fe demonstration and submission-readiness checklist

Status: local preparation only. No contest entry, publication, remote repository, deployment or licensing election is authorized by this document. The applicable contest rules have not been reviewed here, so it is not an eligibility or compliance claim.

## What the project demonstrates

A human issues orders in a lightweight browser. A thin Python standard-library adapter launches a native Fe executable. Fe reconstructs the accepted replay, generates legal actions, applies rules, produces forecasts and chooses the computer's responses. The game uses no blockchain, contract deployment, external game engine or runtime LLM opponent.

The authoritative path is short enough to explain directly:

1. `src/engine.fe`: `State` and `Action` represent a position and order.
2. `legal`/`is_legal` decide which orders exist; `apply` owns their effects, supply/economy, turn changes and results.
3. `decide`/`choose`, `ranked_focused`, `breakdown_cached` and `search_focused_cached` select the computer action. Easy and Hard have different planning effort, with identical rules/resources.
4. `src/native.fe`: bounded input parsing, deterministic replay and Fe-generated state/action/forecast records.
5. `server.py`: validates request shape, transports numeric input and decodes output. `web/index.html` renders it and submits selected orders.

See [the guided engine tour](engine-guide.md), [protocol](protocol.md) and [ADRs](README.md) for details and tradeoffs.

## A reproducible local demonstration

This frozen-v6 example intentionally retains the earlier opening; it is not a v7 tutorial. For current v7, use the README opening and inspect the emitted order costs. Use the existing pinned Docker image recorded in `toolchain.lock.json` and local Node. No toolchain download is required. Compiler identity is Fe 26.5.0, commit 3dab95f; build checks its SHA-256 before compiling with the native backend.

From the chosen isolated checkout:

```powershell
.\scripts\verify.ps1
```

Require `evidence/verification.json` to say `passed`. Check source hashes and logs; an earlier successful run does not validate later changes. Do not present bounded self-play budget stops as completed matches or draws.

The following frozen-v6 native interaction does not access browser checkpoints or any running server:

```powershell
$p = (Get-Location).Path
$image = (Get-Content toolchain.lock.json | ConvertFrom-Json).measured_image_id
'6 1 0 0 2  2 5 5 2  1 5 6 2' | docker run --rm -i --pull never --network none -v "${p}:/work:ro" -w /work $image ./out/kingdom-v6
'6 0 0 0 2  2 5 5 2  1 5 6 2' | docker run --rm -i --pull never --network none -v "${p}:/work:ro" -w /work $image ./out/kingdom-v6
```

Both inputs recruit at A2 and move two infantry to B2 on Small. Replay-only mode 1 returns exactly the two human orders, side Red, two Red orders available, turn 2. Mode 0 returns genuine Fe Red actions `[1,13,8,2]` and `[2,8,8,2]`, then side Blue with two orders on turn 3. Read tag 1 for state, tag 3 for legal actions, tag 4 for accepted actions, tag 5 for forecasts and tag 8 for supply. These exact results were checked against unchanged v6 in the isolated validation worktree.

For a browser demonstration, use the separately prepared v6 campaign preview at localhost:8767 on the desktop. Save/export any active game before replacing its checkpoint. Do not restart, overwrite or silently switch a running game to demonstrate new work. Existing 8765/8766 versions remain separate. The validation worktree is for tests, not a replacement live server.

A short browser sequence to verify manually: inspect A2, recruit, inspect the exact moving composition/forecast, move to B2, then click Run computer turn. Show the two-order budget, a bridge's defense, a food projection and a supply-changing forecast. Finally load a completed replay and show that Fe verifies the action history. This is a proposed demonstration script, not a claim of new browser QA.

## Evidence to retain

- Commit IDs and clean Git status for the demonstrated checkout.
- `toolchain.lock.json` and generated compiler/source hashes.
- Full verification results, with test commands and actual outcomes.
- Compact complete replays, including [the Small and Medium model playtests](playtests/2026-11-09-v6.md).
- Separate records for native rule tests, HTTP tests, mocked UI tests, model-simulated play and actual human/browser checks.
- Known limitations: bounded beam search, incomplete difficulty calibration and remaining human presentation checks. Frozen earlier replay engines and their exact compatibility tests are part of the design, not silently migrated games.

Generated binaries, caches and bulky logs stay ignored. Review any eventual delivery bundle for secrets, unrelated files and generated artifacts before sharing it. Local Git history preserves development milestones; it does not invent pre-Git chronology.

## Questions that require the actual contest rules

Before choosing a submission route, verify the named contest, deadline/time zone, accepted Fe version/backend, eligibility, required deliverables, licensing/public-source terms, AI-assistance disclosure requirements and any asset restrictions. This project has not made those decisions. Native backend use alone does not prove eligibility. Publishing, registering, uploading or accepting terms remains a separate authorized step.
