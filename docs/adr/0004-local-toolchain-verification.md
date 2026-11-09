# ADR 0004: Pinned local toolchain and verification

Status: Accepted; implemented.
Recorded: 2026-11-09, retrospectively.

## Context

A working isolated Fe 26.5 toolchain already existed. Rebuilding tooling, publishing packages or changing the separate prototype projects would distract from the playable game and exceed the current scope.

## Decision

Reuse the existing immutable Docker image recorded in `toolchain.lock.json`. Verify compiler bytes before native compilation. Assemble unchanged Fe source files into a standalone build input. Run builds and automated engine tests without network access. Serve the browser adapter only on the user's localhost through a loopback-bound Docker port.

Keep source, tests, scripts, toolchain metadata and documentation in local Git. Exclude generated binaries, assembled source, caches and regenerated test evidence; retain those files locally. No Git remote, push, public deployment or package publication is part of this setup.

## Consequences

The current machine launches without installing another toolchain. A fresh machine still needs the pinned image; the project does not claim a verified automatic rebuild of it. Generated evidence can be recreated by the verification script. Automated HTTP and mocked UI tests do not establish actual browser interaction or human enjoyment.

## Evidence

- `toolchain.lock.json`, `launch.ps1`, `scripts/build.py`, `scripts/verify.ps1`.
- `.gitignore`, `.gitattributes` and the local Git configuration.
- `docs/validation.md` records the current verification boundary.
