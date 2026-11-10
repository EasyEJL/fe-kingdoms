# V8 paired opponent evaluation, 2026-11-10

## Result

The bounded samples do **not demonstrate an improvement in investment decisions or overall strength** from evaluator B. Medium Hard produced exactly the same decisions and states under A and B. Large Easy diverged immediately, but A ended with more useful territorial/supply pressure in this particular adaptive game. All four games remain ongoing; none is a win or draw.

Neither Red policy selected research during either measured sample. This does not prove the investments are bad or unreachable, nor that B never researches. It limits what this experiment can establish. Research adoption alone would not demonstrate better play either.

## Controls and evidence

- A: source `4a0d8a2d476eb6dde88ee9e35b2f75f89dd55c73`, preserved binary SHA256 `d93c5d1b74873b9c51120ba79378b5634e51bb66af9df5f1d6e255685d83aaa0`.
- B: source `53d1819308a8127d2b9ca917a569142203f44ecb`, preserved binary SHA256 `fd979b0439a962031a49e1595ba7d392e295b81aaf78b971127a4a56d4ccea0c`.
- Same physical rules and initial checkpoint within each pair. Both prepared prefixes contain 18 scripted legal setup actions, not organic opponent play. Each measured branch adds 40 actions: 20 actual native Red decisions and 20 model-selected Blue decisions.
- Ten additional full rounds per branch: Red turn 10/two orders/completed rounds 4 through Red turn 30/two orders/completed rounds 14. Endpoint income has occurred; Red has not taken another order. Every branch stopped at that same phase, without extensions or resets.
- Red used actual native mode 0, Medium Hard and Large Easy. Astra selected Blue actions from real Fe legal lists/forecasts. Medium ran A first in each corresponding pair; Large ran B first. Blue intent was declared before play: preserve capital and supply, consolidate/replenish useful forces, take defensible expansion and exploit opportunities. Identical paired Blue states reused the same decision; divergent boards allowed recorded adaptation.
- Both initial checkpoints cross-loaded identically on the two pinned binaries. Every measured action was independently native-mode-1 checked for legality and immediate ordinary/development forecasts. Both final traces in each scenario cross-replayed identically on A and B. Medium additionally cross-replayed all 40 measured prefixes per branch and checked 34 forecast-derived resulting-state fields per action, with zero mismatches.
- All execution was headless via the existing pinned offline Docker image, source mounted read-only. No changing `out/kingdom`, source edits, builds, servers, browser/player saves or commits. Runtime limits were checked periodically, always 76% remaining. The ten measured rounds exclude checkpoint setup; the cap remained unchanged.

## Medium Hard: no policy divergence

Both A and B built a village at corridor 12 and recruited there instead of buying Charter. Against Blue's reinforced eastern village, both grew the frontline army, built/recruited on northern farm 5, and expanded south and east. The complete measured action traces are identical, not merely similar final scores. All 20 Blue choices were reused on identical paired states.

Blue established a supplied forward town with two forts, trained two siege units and built reserves. The planned siege breach was deferred because vacating the town exposed it to two enemy stacks. Blue then added a home Granary, Charter and a safe home-bank hill capture. Retained limitation/mistake: the siege investment never produced an actual siege attack during the sample; defensive setup and delayed flank plans gave Red time to expand. No tactical mistake was reset or repaired retroactively. There were no hostile attacks between kingdoms in the measured Medium traces; all combat casualties were from neutral captures.

Identical endpoint, both capitals surviving and supplied:

- Red: 10 connected holdings, 33 infantry, 23 troops above one-per-tile garrisons; 21 gold/29 food; income 7, production 9, upkeep 8. No research known.
- Blue: 8 connected holdings, 24 troops including 2 siege, 16 above-garrison troops; 10 gold/11 food; income 9, production 7, upkeep 6. Charter active. No cut-off holdings on either side.

Above-garrison counts are a simple force-size proxy, not legal reach or attack power. Larger stock or army alone is not a strength verdict.

For each Medium branch, measured flows reconcile exactly with stocks over ten income transitions per side:

- Red received 65 gold, spent 57 gold/30 food, produced 90 food and paid 56 upkeep. Five food was verifiably discarded at the cap; no gold cap waste. Stock reconciliation: initial food 30 + production 90 - upkeep 56 - paid food 30 - cap waste 5 = final food 29.
- Blue received 75 gold, spent 66 gold/24 food, produced 56 food and paid 40 upkeep. No cap waste. It researched Charter at trace index 52 and received one realized bonus gold before the endpoint. The new Granary contributed during the final three Blue income receipts. Neither branch used Crop Rotation or Muster discounts.
- Blue lost 3 troops and Red 5 in neutral conquests; no isolated attrition or starvation. No speculative future loss is counted.

Ten actual Hard Red response calls per branch: A median 1.512 seconds/max 1.756; B median 1.408/max 1.931. These are Docker subprocess wall times including startup/reconstruction/output, under concurrent work, not evaluator microbenchmarks or evidence of a speed improvement.

## Large Easy: genuine divergence, no investment benefit demonstrated

At trace index 18, B recruited before advancing, placing four troops forward; A advanced then recruited, placing two forward and retaining more behind. Subsequent boards diverged. Blue's first eleven choices stayed the same; its first action difference at index 41 responded to the actual opposing concentration. See [Large analysis](v8-ab-large.md) for the retained supply-route mistake, all flows and detailed timing.

- A Red ended with 13 connected holdings, 22 infantry, 36 gold/9 food. It captured Blue's corridor, leaving two Blue holdings cut off and causing one actual attrition loss. Blue had 7 connected plus 2 cut off and 15 infantry.
- B Red ended with 12 connected holdings, 21 infantry, 32 gold/1 food. Blue had 11 connected holdings, none cut off, and 19 infantry. B had no current projected starvation loss despite its low food stock.
- A Red paid 33 gold/22 food versus B's 36/24; food production was 50 in each, upkeep 40 versus 46. No cap waste or starvation in either branch. Preexisting Charters supplied ten bonus gold per side in both branches; those setup investments were not automatic policy choices. No measured research or actual infantry discounts occurred.

Interpretation check against every recorded before/after state: all 11 Red A and 12 Red B infantry recruitments were at tile 33, which remained a supplied village (settlement 1, specialty 0), each costing three gold. The prepared Arsenal was town 35, not tile 33. Even if Muster had already been learned, it would not discount these exact purchases without upgrading tile 33 to a town and selecting Arsenal there, or changing the recruitment location. Thus this sample is a poor test of Muster adoption: the lack of research is not evidence that either policy ignored an immediately useful discount on its chosen recruitment stream.

A's better observed endpoint is not a general ranking: this is one prepared Large position, one seat, Easy search and adaptive Blue play with different mistakes/opportunities after divergence.

## Deliverables and limits

Minimal native replays:

- [Medium A](v8-ab-medium-a.json), [Medium B](v8-ab-medium-b.json). These are intentionally identical action traces from separately executed opponent calls.
- [Large A](v8-ab-large-a.json), [Large B](v8-ab-large-b.json).

Local detailed evidence is under ignored `evidence/ab/v8-medium-*` and `evidence/ab/v8-large-*`, including authoritative before/after states, legal lists, all chosen reasons, native decisions, forecast checks, resource reconciliation and timings. Setup manifests/prefixes are `evidence/ab/checkpoints-*`.

Two prepared positions, both policies in the Red seat, ten rounds each and adaptive model Blue are insufficient for win rates, general strength, investment payback or optimality. Medium and Large also use different difficulties; compare A versus B within a scenario, not across scenarios. There was no browser or human validation. Further testing should use additional positions with genuine resource scarcity and useful repeated recruitment opportunities, including reversed seats, rather than tuning to force research in these two samples.
