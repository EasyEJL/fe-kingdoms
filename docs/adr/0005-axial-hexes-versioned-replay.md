# ADR 0005: True axial hexes and versioned replay

Status: Accepted; implemented.
Recorded: 2026-11-09. Supersedes the orthogonal-topology part of ADR 0002.

## Context

The user requested hexes before further mechanics, because movement, supply and AI should respect the final topology. They also requested action choices grouped under owned territories, with only one group open at a time.

## Decision

Use axial coordinates q=column, r=row, six-neighbor distance one, and a centrally symmetric 5x3 parallelogram. Fe owns adjacency, movement, supply BFS and AI distance. The browser draws pointy hexes using the same coordinates, with row shifts and three-quarter-height row spacing. Territory cards are visible without a prior board selection; one expanded card synchronizes with selection.

Rules version 2 adds explicit scenario and map metadata. Freeze the original version-1 Fe source under legacy/v1 and compile a separate read-only replay engine. The host rejects attempts to continue v1 games. New checkpoints use a separate key and preserve old saves. No silent replay migration.

## Consequences and checks

The action buffer grows to 256 because hexes add move directions. Native tests check six central neighbors, symmetry, no row wrapping, diagonal movement and supply. Adapter/UI tests cover version routing, grouped previews and checkpoint isolation. Existing square-game outcomes are not a balance guarantee for hexes; all difficulty pairings are rerun.
