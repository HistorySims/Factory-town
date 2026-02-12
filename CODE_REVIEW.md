# Code Review Notes

Reviewed areas: startup flow and player controls/building interactions.

## Findings

### 1) Missing phase guards allow early access to late-game actions (High)
- `btn-canal` and `btn-dump-waste` are hidden until MID/LATE, but the underlying actions are still callable at any time.
- Keyboard shortcuts `3` and `4` directly invoke canal mode and waste dumping without checking the current phase.
- Recommendation: add explicit phase checks inside `_toggleBuildMode('canal')`, `_toggleWasteDumping()`, and/or `_tryBuildCanal()` so the rule is enforced in logic, not just UI visibility.

Relevant code:
- `src/ui/Controls.js` (`_setupPhaseUnlocks`, `update`, `_toggleBuildMode`, `_toggleWasteDumping`, `_tryBuildCanal`)

### 2) Canal placement does not check tile occupancy by buildings (Medium)
- Housing placement validates `getBuildingId(...) === 0` for all occupied tiles, but canal placement only checks `isWalkable(col, row)`.
- If a tile can remain walkable while logically occupied (e.g., road-adjacent content or future entities), canal placement can overwrite terrain without guarding against existing occupancy state.
- Recommendation: mirror housing checks and reject canal placement when `getBuildingId(col, row) !== 0`.

Relevant code:
- `src/ui/Controls.js` (`_tryBuildHousing`, `_tryBuildCanal`)

### 3) `Game.start()` can schedule multiple game loops if called repeatedly (Medium)
- `start()` unconditionally sets `running = true` and calls `_loop(...)`.
- If `start()` is called again (e.g., future UI changes, accidental double-binding), a second animation loop gets scheduled.
- Recommendation: early-return when already running:
  - `if (this.running) return;`

Relevant code:
- `main.js` (`game.start()` call sites)
- `src/core/Game.js` (`start`, `_loop`)

## Positive notes
- Fixed-timestep update with capped catch-up steps is a good stability choice in `Game._loop()`.
- HUD/button visibility progression is cleanly event-driven via `phase:changed`.
