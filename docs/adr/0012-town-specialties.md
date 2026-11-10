# ADR 0012: Permanent town specialties using existing resources

Status: Accepted for unreleased v7; validation recorded per milestone.
Recorded: 2026-11-10.

## Context

The user wants more strategic settlement choices with little bookkeeping, Fe authority and lean HTML. The overnight work explicitly includes settlement specialties. Additional currencies or a general building framework are unnecessary for this slice.

## Decision

A supplied town may choose one permanent specialty for six gold, two food and one order. Granary increases its supplied food production by two each turn. Arsenal reduces the gold cost of cavalry/siege recruitment and paid infantry conversion by one; food cost, composition, stack cap and other prerequisites remain unchanged. Both use the existing town/resource/supply rules.

Specialty belongs to the tile, survives capture and cannot be exchanged. Losing capital-connected supply suspends its benefits. Recapture or reconnection restores them. Neither side receives a hidden bonus.

Fe owns legal choices, price lookup, application, production, evaluation and native forecasts. The browser displays the permanent choice, existing food forecast and Fe costs in its existing territory/action cards. Do not calculate eligibility or discounted prices in JavaScript.

## Protocol and verification

Kind11 uses FROM=TO and AMOUNT1 for Granary or2 for Arsenal. Existing v7 tile specialty and forecast targetSpecialty fields become active; widths remain18/32. This remains unreleased v7, with exact frozen-v6 replays unchanged.

Test permanence, supply gating, capture, costs, cap behavior, recruitment and training, production projection versus real upkeep, AI evaluation and forecast/application agreement. Revalidate the current complete HTTP game if the policy changes. Automated and model tests are not a human balance conclusion.
