# ADR 0001: Fe authority and a thin browser adapter

Status: Accepted; implemented.
Recorded: 2026-11-09, retrospectively from the current code and project requirements.

## Context

The primary deliverable is a browser-playable strategy game demonstrating a native Fe engine. The user prioritized Fe over visual polish and explicitly rejected spending the first phase on a terminal interface, HTTP framework or serialization library.

## Decision

Keep initialization, legal actions, combat, economy, supply, terminal outcomes, evaluation, search and difficulty behavior in Fe. The native adapter also computes action forecasts by applying the same Fe transition to a copied state.

Use Python's standard-library HTTP server for bounded input validation, serialization and native-process invocation. Use a small HTML/CSS/JavaScript page for display, selection, save/load and turn pacing. Browser text may describe Fe results; it must not independently calculate combat, resources or legal actions.

## Consequences

The browser and headless tests exercise the same engine. No LLM or external game engine chooses moves. The host remains easy to replace later. Fe's numeric protocol requires explicit encoding/decoding tests, but avoids building a general serialization system.

## Evidence

- `src/engine.fe`, `src/native.fe`, `server.py`, `web/index.html`.
- `tests/test_http.py`, including forecast-to-actual-result comparisons.
- The preserved transition prototype supplied the small bounded decimal parser; its broader investigation and Dragonstales remain separate.
