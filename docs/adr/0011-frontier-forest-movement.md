# ADR 0011: Forest and composition-based order costs

Status: Accepted for unreleased rules v7; implementation and verification tracked separately.
Recorded: 2026-11-10.

## Context

The user authorized staged overnight terrain/unit interactions, settlement specialties, bounded buildable crossings and truthful opponent explanations. Keep Fe authoritative, HTML lean, existing matches safe and meaningful local history. Difficulty calibration follows the main mechanics.

## Decision

First add symmetric forest positions to the three existing maps. Forest grants one defense only when the defending army includes infantry. Cavalry retains its existing open-ground attack bonus and gains no forest bonus. Siege retains its existing fortified-target attack bonus.

An actual moving detachment containing siege costs two orders. Otherwise cavalry entering forest costs two; other moves cost one. Both legal generation and apply use the same Fe function. Proportional half moves may leave a specialist home, so source-stack type alone is insufficient. The two-order kingdom budget remains unchanged. Expensive movement is unavailable after spending one order.

Hard retains four action plies, not four order points. The new movement choices change the horizon without extra resources or hidden difficulty bonuses.

## Compatibility and presentation

Freeze v6 engine/native sources unchanged for exact read-only replay. One unreleased v7 spans the staged work; intermediate commits are not separate supported save versions. Reserve fixed native fields for tile defense, specialty, crossing-site/construction state and forecasts of order cost and target terrain. Fields for later mechanics remain zero until implemented.

Display Fe's costs and forecasts in existing action cards. Use a compact forest glyph, readable text and a valid two-order starting example. Do not reimplement movement/combat in the browser.

## Verification obligations

Cover pure/mixed detachments, costly moves with only one order, forest cover, cavalry open-ground bonuses, siege handoff, both policies, forecast/apply agreement, frozen replays and a complete current match. Run aggregate verification before committing. Mocked UI tests do not constitute browser or human playtesting. Later town/crossing/planning stages require their own decisions and tests.
