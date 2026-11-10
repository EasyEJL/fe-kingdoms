# ADR 0017: Bounded kingdom development

Status: Accepted as an unreleased v8 experiment; prices and valuation require testing.
Recorded: 2026-11-10 (UTC).

## Context

The user explicitly requested continued meaningful Fe development, with room for early investment and limited medieval technology progression. Existing Large-map experiments already give substantial development time. Simply enlarging geography would confound an investment experiment and may lengthen campaigns without adding choices. The engaging two-order loop, full information and equal rules/resources remain essential.

## Decision

Add three permanent kingdom developments, all researched in Fe with one order and explicit resource costs:

- Town Charter: six gold at an owned supplied town. Grants one extra kingdom gold income per turn while any owned town is supplied. It is the prerequisite for both branches.
- Crop Rotation: six gold and two food at an owned supplied Granary town, after Charter. Adds one food per supplied farm, capped at two extra food per kingdom per turn, while a supplied Granary exists. Existing Granary production is unchanged.
- Organized Muster: six gold and two food at an owned supplied Arsenal town, after Charter. Infantry recruitment at supplied Arsenal towns costs two gold instead of three. Headcount, food, order and stack costs remain unchanged. Existing specialist prices are unchanged.

Both branches can eventually be learned. A town cannot have both specialties, so supporting both branches requires separate towns. Knowledge belongs to the kingdom and does not transfer with capture; losing supply or qualifying infrastructure suspends operational benefits rather than erasing knowledge. No research currency, timer, queue, random outcome, combat/movement bonus or new unit is added. Existing actions are not gated behind research.

Represent knowledge as fixed kingdom bitmasks and use explicit Fe helpers for this small graph. Generate each discovery once at the lowest-index qualifying supplied town rather than many equivalent actions. Reuse existing supply, economy and recruitment-price functions. Do not introduce a generic entity or technology framework. These are initial experimental prices, not a balance claim.

## Authority and compatibility

Fe generates all rules, legal research orders, costs, prerequisite/eligibility status, operational status, resulting forecasts and opponent choices. Python transports and decodes bounded native rows; HTML displays them. Static explanatory wording is presentation, not a second rule implementation. Preserve the two-order owned-territory action hierarchy.

Freeze exact v7 source/native and decoder behavior before changing semantics. Rules v8 gets separate checkpoint/snapshot keys. Existing v1–v7 games stay exact read-only replays; no silent migration. Any prepared v8 practice position derived from a v7 trace is explicitly labeled and revalidated, not treated as an unchanged v7 campaign. Work remains isolated from all running previews, with no publication.

## Evaluation experiment

First commit a rule-complete v8-A with the prior evaluator baseline. Then assess a bounded operational investment estimate as v8-B under identical rules and replay semantics. Keep all evaluation in Fe, preserve score-component sums and tactical win/defense priorities, and do not force research use merely to demonstrate a feature.

Measure productive infrastructure and resource headroom, not a large unconditional ownership bonus. Crop benefits can be wasted at the food cap; Muster needs useful recruitment opportunities; Charter has an order and delayed-payback cost. No future benefit from unbuilt infrastructure is guaranteed. The exact B heuristic will be documented with its tests and observed choices, rather than specified as a promised strategy here.

For later A/B play, pin both binaries/source commits, use identical checkpoints and Astra intent/information, and compare matched full-round phases. Record first decision divergence, resource flows and expenditure, supply, real attrition, productive bonus turns, useful discounts, mobile forces, capital safety and latency. Larger stock alone is not stronger play. Adaptive model choices and small samples remain limitations. Comparing v7 with v8 is not a policy-only A/B because rules differ.

## Required verification

Test exact costs, prerequisites and canonical research sites; duplicate/malformed/repeated research rejection; both sides and all knowledge combinations; one-order handoff and same-turn unlock; supply loss/reconnection and capture; capped farm production and real cap-before-upkeep; qualifying infantry discounts and stack/food bounds; terminal/decision states and action capacity. Reconstruct every effect from replay and compare forecasts to actual application.

Preserve frozen replay digests and complete-match checks. Expose prerequisites, suspended benefits and actual changed economy clearly. UI tests are not browser/human validation. Keep map expansion and broader troop/technology additions out of this bounded experiment until its choices and AI behavior are measured. No private Dragonstales code/data or third-party implementation is imported.
