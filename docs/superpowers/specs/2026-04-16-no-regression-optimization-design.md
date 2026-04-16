# No-Regression Optimization Pass Design

Date: 2026-04-16
Project: Clipboard Slots

## Goal

Refactor the project as a no-regression optimization pass. The app must remain functionally equivalent. No feature, behavior, UI outcome, API behavior, routing outcome, state flow, side effect, persistence behavior, or integration behavior should change except where required to remove waste or improve efficiency without changing outputs.

## Scope

This pass focuses on safe cleanup and simplification inside the existing architecture:

- Remove source files and code paths that are provably unused by the live app.
- Remove duplicate logic where the implementation is already behaviorally identical.
- Simplify active implementations where the produced values, side effects, and user-visible output remain the same.
- Reduce bundle inputs so only active renderer entrypoints and assets are built or copied.

This pass does not redesign the application. It preserves the current Electron main/preload/renderer split, IPC contract, window model, persistence model, and UI behavior.

## Confirmed Active App Structure

The current runtime structure is:

- `src/main/` for Electron main-process logic
- `src/preload/` for the safe IPC bridge
- `src/renderer/history.html` + `src/renderer/history.ts` for the main window, including the embedded settings view
- `src/renderer/slot-picker.html` + `src/renderer/slot-picker.ts` for the slot picker window

The current runtime does not open `src/renderer/settings.html`. `WindowManager` only loads `history.html` and `slot-picker.html`.

## Planned Optimizations

### 1. Remove Dead Standalone Settings Renderer

Remove:

- `src/renderer/settings.html`
- `src/renderer/settings.ts`

Rationale:

- The active app does not load the standalone settings window.
- `history.html` already contains the settings UI that the live app uses.
- Keeping the standalone settings renderer increases maintenance cost and renderer bundle size without affecting runtime behavior.

### 2. Tighten Build Inputs

Update `scripts/build.mjs` so it only:

- bundles the active renderer entrypoints
- copies the active renderer HTML files
- copies shared assets still used by those entrypoints

This keeps the build output structure the same while removing unnecessary work for unused renderer files.

### 3. Consolidate Small Shared Renderer Helpers

Where helpers are already identical between renderer entrypoints, extract small shared utilities instead of maintaining duplicate implementations.

Candidates include:

- static translation application for `[data-i18n]` and `[data-i18n-placeholder]`
- short string truncation or preview rendering helpers, if extraction remains small and explicit

Constraints:

- Keep page-specific rendering logic local to each renderer entrypoint.
- Do not introduce a large abstraction layer.
- Preserve the exact DOM output and event wiring.

### 4. Simplify Active Source Internals

Apply mechanical simplifications in active source only when they preserve observable behavior:

- reduce repeated object cloning boilerplate
- collapse redundant wrappers and repeated settings/history response construction
- simplify small control-flow branches that do not change side effects

High-risk modules such as clipboard capture, paste simulation, history persistence, and image storage should only receive mechanical simplifications if equivalence is straightforward to prove.

## Non-Goals

This pass will not:

- change any feature or user-visible behavior
- alter IPC channel names or payload shapes
- change storage file names, locations, or persistence semantics
- change hotkey registration behavior
- change tray behavior, startup behavior, or window lifecycle behavior
- change error messages, recovery behavior, or operational timing unless the result is provably identical
- remove generated directories such as `dist/`, `release/`, or `node_modules/`

## Safety Rules

Before removing anything:

- verify usage with repository search and runtime entrypoint inspection
- prefer removal only when the code is clearly unreachable or unused by the live application

While refactoring:

- prefer incremental changes over broad rewrites
- keep code readable and local
- preserve existing fallback and recovery behavior for corrupted files, missing images, invalid edits, hotkey registration failures, and paste failures

If a potential cleanup touches behavior that cannot be proven equivalent with high confidence, leave it in place and report it as suspected but not removed.

## Verification Plan

Verification should include:

- repository usage checks before deleting files
- `npm run typecheck`
- `npm run build`
- available tests, if any

Post-change review should confirm:

- the app still builds successfully
- the active renderer entrypoints and copied assets match runtime usage
- removed files were not part of the live application path

## Expected Improvements

Expected wins from this pass:

- smaller renderer build surface
- lower maintenance overhead from removing stale standalone UI code
- less duplicate renderer logic
- slightly reduced bundle size and build work
- clearer source boundaries between active runtime code and stale code

## Risks and Guardrails

Primary risk areas:

- recently added image support
- clipboard watcher behavior
- paste sequencing and clipboard restoration
- settings and history persistence

Guardrail:

- avoid functional changes in those areas unless the edit is purely mechanical and verification is sufficient

## Implementation Direction

Recommended implementation order:

1. Remove the dead standalone settings renderer and its build references.
2. Extract only the smallest safe shared renderer helpers.
3. Apply low-risk internal simplifications in active modules.
4. Run verification and report any suspicious but retained code paths.
