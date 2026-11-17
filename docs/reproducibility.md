# Rebuilding and verifying Fe Kingdoms

## Environment

Use Docker with Linux x86-64 containers, a browser, and Node.js for the UI unit tests. The official Fe 26.5.0 Linux x86-64 compiler and Rust 1.94.0 are used. An x86-64 Docker host is the directly tested target; other hosts require suitable Docker emulation and have not been tested.

## One-time setup

From the project root:

```sh
docker build --platform linux/amd64 -f Dockerfile.toolchain -t fe-kingdoms-toolchain:26.5.0 .
```

This downloads the digest-pinned Rust base, Debian packages, Rust 1.94.0, and the [official Fe 26.5.0 release](https://github.com/argotorg/fe/releases/tag/v26.5.0). It verifies the Fe binary SHA-256 before use. Initial setup requires network access. Package repositories are not snapshot-pinned, so the image is not guaranteed byte-identical to the historical image; the checks establish the expected Fe bytes and active Rust version, while the test suite establishes the observed project behavior.

The local historical image remains selectable by its ID in `toolchain.lock.json`. It is not necessary on another machine once the new image has been built.

## Build, test, and play

On Windows PowerShell:

```powershell
.\scripts\verify.ps1 -Image fe-kingdoms-toolchain:26.5.0
.\scripts\preview.ps1 -Image fe-kingdoms-toolchain:26.5.0
```

On a POSIX host with Docker and Node:

```sh
sh scripts/verify.sh
sh scripts/preview.sh
```

The verification script checks the image's Fe hash, Fe version, active Rust version, architecture, Python and GCC, then runs the Node mocked UI tests and the Fe, replay, bounded self-play and HTTP checks. Compilation and tests use `--network none` and `--pull never`. See `evidence/verification.json` for `status: passed`; a run interrupted before completion is not a pass. These checks are separate from a real-browser test and human playtesting.

Windows preview uses localhost port 8770 and refuses to replace a named preview from another checkout. POSIX preview defaults to port 8771; `PORT=8772 sh scripts/preview.sh` chooses another port. Servers bind Docker's published port to localhost and can be stopped with Ctrl+C. Browser storage is tied to its origin; save an exported replay before switching ports.

## Manifest and build

`fe.toml` is the Fe ingot manifest, with project name `kingdom` and project version `0.8.0`; that version is distinct from the v8 replay/rules version. `scripts/build.py` copies this manifest into `generated/kingdom-ingot/`, concatenates unchanged `src/engine.fe` and `src/native.fe` into its `src/lib.fe`, and builds that generated ingot with Fe's native backend. It builds the seven frozen replay versions separately as standalone files. The script also checks the compiler hash. Use the provided scripts rather than running `fe build .`: the source fragments must first be assembled.

The manifest has been parsed and used by the actual Fe 26.5.0 native build. The contest's automated acceptance of this generated-ingot layout is not yet confirmed. The root manifest is present, but it should not be represented as a directly buildable unassembled ingot.

## Verification boundary

The new image was rebuilt on the existing Windows/Docker machine from the recorded base and verified Fe download. A separate clean directory was used for the rebuilt-image test. This is not yet a test on an independent clean machine, nor a real browser or human playtest. No public image or release has been uploaded.

## Local build comparison — 2026-11-15

The rebuilt toolchain was built from `Dockerfile.toolchain` on the existing Windows/Docker host; the Fe download passed the recorded SHA-256 check. The full offline `scripts/verify.ps1` suite passed with both the original image and the rebuilt image, the latter in a fresh copy without prior generated outputs. All Fe source files, frozen legacy sources and the browser file were byte-identical to the inspected original checkout. Direct offline comparisons of the original and manifest-built binaries produced identical protocol output for initial states of v1-v8 and six v8 fixture prefixes (including the completed match). A separately named, localhost-only container using the rebuilt image served the page and returned a 15-tile v8 initial state, then was stopped. These are bounded checks, not an exhaustive equivalence proof. No interactive browser or new human test was performed, and the recipe has not been tested on a separate clean machine.
