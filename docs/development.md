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

From the project directory, with Docker Desktop running:

```powershell
.\launch.ps1
.\scripts\verify.ps1
```

Open http://localhost:8765. The launcher recognizes an existing `fe-kingdoms` container. To rebuild a running instance, stop that container first with `docker stop fe-kingdoms`, then launch again. Browser checkpoints and downloaded replays are independent of the stateless server.

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

Overnight frontier work uses feature/frontier-expansion in C:\Users\Eric\dev\fe-kingdoms-frontiers. Its separate preview launcher reserves port8768 and container fe-kingdoms-frontiers, leaving all three prior previews unchanged. V7 is unreleased across staged feature commits; preserve frozen v6 but do not promise compatibility for intermediate v7 development saves. Do not run launch.ps1 to replace a live game.
