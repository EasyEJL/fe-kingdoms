# ADR 0016: Practice examples from validated replays

Status: Accepted for the isolated save-management milestone.
Recorded: 2026-11-10 (UTC).

## Context

A full campaign may be too long for an introductory demonstration. The user suggested reloadable positions several turns into play, with meaningful supply, crossing or mixed-army choices. Demonstration play must not overwrite an active campaign, and the thin frontend must not manufacture a separate rules model or arbitrary state.

## Decision

Embed a tiny catalog of two replay objects and presentation metadata in the existing HTML. These are exact 27-action and 24-action prefixes of the recorded Small/Easy Sol-versus-Fe match. Label them prepared examples selected from model play, not human-play evidence, hand-authored injected states or guaranteed-win puzzles. Use the normal Fe replay validator, legal actions, forecasts and opponent for every practice order.

The shared-crossing example asks who benefits from building a permanent neutral crossing. The mixed-siege example contrasts moving the siege-containing force for two orders with a smaller detachment that retains an order to fortify. The prompts explain the decision without declaring either choice optimal. No new engine version, endpoint, asset framework or game rule is introduced.

Practice has an explicit temporary session context. Enter, play, computer response, reset and return must leave campaign checkpoint and named-snapshot bytes unchanged. Preserve a return replay for later Fe revalidation, and block entry if current progress is not safely preserved. Commit the session-context transition only after a successful Fe response; failed or canceled navigation keeps the previous board and context. Disable named saving/replacement during practice, but allow portable replay export. Returning revalidates the protected campaign, after which ordinary campaign actions resume autosave.

## Consequences and verification

Practice progress is intentionally unsaved, clearly labeled and resettable. Reloading the page returns to the ordinary checkpoint flow. These are brief introductions, not substitutes for complete-match or difficulty testing. A model-selected recorded position can contain prior strategic mistakes; its provenance is retained.

Native tests must extract the actual embedded catalog, verify each replay equals the recorded prefix, reconstruct it deterministically, and check the stated legal alternatives and their Fe forecasts. UI tests must prove every campaign storage key remains byte-identical through practice, including failed transitions, repeated clicks, reset and return. Real-browser and human understanding remain separate checks. Keep the catalog bounded rather than building a scenario editor or tutorial framework.
