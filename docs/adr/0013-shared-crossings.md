# ADR 0013: Bounded permanent shared crossings

Status: Accepted for unreleased v7; validation recorded per milestone.
Recorded: 2026-11-10.

## Context

The user authorized buildable crossings while keeping the existing resource system and lean native/browser split. Bridges change movement and capital-connected supply for both kingdoms, so the v6 fixed-topology search cache cannot remain unchanged.

## Decision

Each existing map has two designated construction sites: the river at the top and bottom of its central column. Existing fixed bridges remain. A supplied owned land bank adjacent to an unbuilt site may spend six gold, two food and one order to construct a permanent bridge. A bridge tile itself is not a construction bank.

Construction creates neutral empty passable terrain, not a free territory or army. Either kingdom can occupy it. An empty bridge has zero defense and causes no first-occupation casualties; once occupied, bridge terrain contributes its normal defense. Supply still requires connected ownership, so construction alone does not extend supply. No demolition, harvesting, timber currency or construction queue is introduced.

Two state bits represent the built sites. For each opponent decision, precompute the four possible pairs of capital distance fields. Every trial evaluation selects the pair matching that trial state's bridge mask. This replaces the static v6 route assumption without repeated BFS at every search node or navigation tables in every copied State. Supply continues its separate ownership-sensitive traversal.

## Protocol and presentation

Kind12 uses FROM as the bank, TO as the site and AMOUNT1. Tile crossingSite is a boolean that remains true after building; constructedBridge is true only for completed construction. Forecast target terrain/passability reflect actual apply results. Widths remain18/32. The browser displays sites, constructed bridges, resource costs and the shared-use warning through existing cards and small glyphs. Fe supplies every legal option and state consequence.

## Verification obligations

Check all three scenarios and all four construction masks against an independent route oracle, including hypothetical builds within one search. Cover affordability, adjacency, supply, repeat/invalid construction, bank restrictions, neutral zero-garrison defense, first occupation by either side, ownership-sensitive supply and exact replay. Exercise both policies and measure bounded search performance. Recheck the complete current HTTP match and frozen versions. Source/tests remain local and isolated from live matches.
