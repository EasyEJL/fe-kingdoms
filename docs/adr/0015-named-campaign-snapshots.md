# ADR 0015: Explicit named campaign snapshots

Status: Accepted for the isolated save-management milestone.
Recorded: 2026-11-10 (UTC).

## Context

The player wants to pause a larger campaign, play a shorter game and return later. A single current-version autosave is insufficient because creating or loading another campaign replaces it. Exported replays remain the portable backup and older versions remain read-only. Saving must not introduce host-side game rules or a second authoritative state representation.

## Decision

Keep at most six explicitly named current-version replay snapshots in a versioned browser-local collection. A snapshot stores the same version, scenario, difficulty and accepted actions as an export, with presentation-only name, ID and time metadata. Fe validates its replay on load. The current campaign continues to autosave separately; named snapshots change only through an explicit save or replace operation. State this distinction in the controls.

Use a compact, collapsed save area rather than a file-management application. Require deliberate confirmation for replacing or deleting a named snapshot. Replacing the active campaign must preserve an unsaved game in a named snapshot or require explicit discard, including terminal games and the current campaign retained while viewing a legacy replay. Storage failures and corrupt or unknown-format collections must remain visible and must not silently erase existing bytes. Imported files and other asynchronous switches must retain busy protection until validation and application finish.

Keep all existing version-specific checkpoint keys and replay formats. Do not migrate old games, add a backend, introduce a database or sync service, or send campaign names into the engine. Browser data remains local to its origin, so exports are needed to copy games between preview ports or browsers. No new engine version is needed because rules and wire semantics are unchanged.

## Consequences and verification

Snapshots are manual restore points, not six independently autosaving campaigns. The UI must make that clear and keep portable export available. Browser storage can fail or be cleared, so a successful in-memory game does not imply a durable backup.

Cover large-save/small-game/restore, exact replay and legacy preservation, capacity, duplicate/invalid names, deliberate replacement/deletion, corrupt data and unknown schema, storage denial/quota, failed Fe validation, stale/double actions and delayed file reads. Mocked DOM/storage tests do not prove visual browser usability. Record the separate full-suite and browser-validation outcomes in the validation notes. Development remains isolated from existing preview servers and player saves.
