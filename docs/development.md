# Development workflow

## Local Git

The repository starts on `main` with an initial snapshot of the existing game and its documentation. Earlier work was not committed here. Use small, descriptive commits for new changes and update relevant ADRs when a decision changes.

```powershell
git status
git switch -c feature/short-description
# Make and verify the change.
git diff --check
git diff
git add <reviewed-paths>
git diff --cached
git commit -m "Describe the change"
```

No remote is configured. Local branches, diffs, reviews, commits and merges work normally. A hosted pull-request workflow requires a remote/hosting service and separate authorization; it has not been set up.

## Launch and verify

From C:\Users\Eric\dev\fe-kingdoms-charters, with Docker Desktop running:

```powershell
.\launch.ps1
.\scripts\verify.ps1
```

This checkout's `launch.ps1` delegates to its isolated preview launcher on http://localhost:8770, using the `fe-kingdoms-charters` container. Older previews on ports 8765 through 8769 are left unchanged. Do not stop or replace an existing preview during a player match; announce readiness and preserve/export the game before a deliberate switch. Browser checkpoints and downloaded replays are independent of the stateless server.

Verification needs local Node and the existing pinned Fe Docker image. It runs UI unit tests, native Fe tests, bounded self-play samples, replay/parser tests and a complete real-HTTP match. A self-play budget stop is unfinished, not a draw. Check `evidence/verification.json` for `status: passed`; failed or running evidence is not success. Review the generated logs when a test fails.

## Files and boundaries

- `src/`: authoritative engine, native adapter and Fe tests.
- `server.py`, `web/`: thin transport and browser presentation.
- `tests/`, `scripts/`: tests and build orchestration.
- `docs/`: decisions, process, validation and future direction.
- `generated/`, `out/`, `evidence/` and caches: local generated artifacts, ignored by Git.

Do not add credentials, private keys, local environment files, binaries or unrelated project files. Ignore patterns are a guardrail, not a substitute for reviewing staged contents. Line endings are specified in `.gitattributes`. Do not change the separate transition-lab or Dragonstales projects as a side effect of game work.

## Isolated mechanics development

The campaign-expansion branch uses a separate worktree at C:\Users\Eric\dev\fe-kingdoms-campaign and scripts/preview.ps1 on port 8767. Keep the original game (8765) and visual preview (8766) running unchanged during development. Each origin has separate browser storage. Do not replace an active preview underneath a human match; announce readiness and let the player choose a fresh game or export the current replay first. Old-version saves remain read-only on newer rules.

Overnight frontier work uses feature/frontier-expansion in C:\Users\Eric\dev\fe-kingdoms-frontiers. Its separate preview launcher reserves port 8768 and container fe-kingdoms-frontiers, leaving all three prior previews unchanged. V7 is unreleased across staged feature commits; preserve frozen v6 but do not promise compatibility for intermediate v7 development saves. Do not run launch.ps1 to replace a live game.

Named-snapshot work uses feature/campaign-saves in C:\Users\Eric\dev\fe-kingdoms-saves. Its preview reserves port 8769 and container fe-kingdoms-saves. The v7 engine and wire format are unchanged from implementation commit 0517958; this branch must not edit the engine or replace a running preview to ship presentation changes. Export a replay to copy a campaign between origins, since browser storage is scoped by port.

The kingdom-development experiment uses feature/kingdom-charters in C:\Users\Eric\dev\fe-kingdoms-charters, reserving port 8770 and container fe-kingdoms-charters. Exact v7 source/native copies were frozen before any rules changes. Stage A introduces rules and transport with the previous evaluator baseline; a later stage may change investment valuation for a same-rules A/B. Existing previews remain unchanged. Do not present v7 versus v8 as a policy-only experiment.
