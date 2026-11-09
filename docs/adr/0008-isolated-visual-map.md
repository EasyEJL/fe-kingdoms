# ADR 0008: Readable visual map in an isolated preview

Status: Accepted; implemented on feature/visual-map, not switched into the active game.
Recorded: 2026-11-09.

## Context

After playing v4, Eric found the game promising enough to improve its graphics. He requested readable terrain imagery, troops with number badges, clear ownership and zoom for larger maps. Earlier feedback showed cavalry/siege tradeoffs were buried in the rules. The active match must not be disrupted.

## Decision

Keep rules and replay version 4 unchanged. Add small inline vector terrain/unit illustrations, role-count badges, explicit BLUE/RED/N labels, accessible hex descriptions and keyboard-focus restoration. Hex coordinates, ownership, composition, legal orders and forecasts remain Fe output. Artwork is functional local code, with no external assets or dependency framework.

Scale the map as presentation only, with zoom buttons, reset, scroll and Fit. Fit supports a large map in a 320px viewport; an overview may have tiny labels, so zoom in to inspect details. It does not change movement or map size.

Keep actual orders near the top of the expanded territory. Show concise role benefits beside relevant recruitment/training choices. Put the fuller comparison after orders in a collapsed section. Do not imply cavalry moves faster or siege moves slower: neither is true in these rules.

Show stored food and Fe's exact projected next-upkeep stock as meters out of forty. Production and usage remain adjacent numeric text. Do not turn production-minus-upkeep into a new forecast, because storage caps can waste production.

Develop in the separate fe-kingdoms-visual Git worktree and branch; serve preview on localhost:8766. Keep the original checkout and localhost:8765 untouched. Separate ports have separate browser checkpoints. Copy a match only through Save replay / Load replay. scripts/preview.ps1 never stops the original server. A live switch is a later explicit step after readiness is reported.

## Review and evidence

Initial real-browser inspection found clean small-map terrain, ownership and badges, readable selection, and correct first recruitment with Red still waiting. It also exposed an oversized pre-order comparison; that was replaced with contextual help. Source review found a minimum zoom that prevented narrow large-map fitting; the minimum and regression were corrected.

The final full suite passes, and current-file hashes match its evidence. Native and legacy Fe sources and server.py remain unchanged from commit 3b05525. Final source-only review found no blocking defect. Browser QA stopped during a losing-attack confirmation when the tool could not verify the page URL; no confirmation was accepted. Large-map zoom, cutoff spacing and final layout changes still need a human preview check. Do not describe the full visual UI as browser-verified.
