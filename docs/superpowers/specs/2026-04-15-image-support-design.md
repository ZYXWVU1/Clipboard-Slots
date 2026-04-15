# Image Support Design

## Summary

Clipboard Slots will support saving and reusing image clipboard entries in addition to text entries.
Image slots will store only the image itself, render a thumbnail preview in the main history window and chord picker, and paste the saved image back through the clipboard using the same slot workflows that exist today.

## Goals

- Capture copied images as ordered history slots.
- Preserve current text capture and paste behavior.
- Show thumbnail previews for image slots in the history list and slot picker.
- Support `Copy Again` and `Paste Now` for image slots.
- Respect existing settings for persistence, max history, pinning, and clipboard restore.
- Clean up image files when slots are removed.

## Non-Goals

- Preserving mixed clipboard payloads such as image plus HTML or text.
- Editing image content inside the app.
- Adding image format conversion options or compression settings.
- Introducing drag-and-drop, manual image import, or export UI.

## Current Constraints

- The app currently models every history item as text.
- Clipboard polling only watches `clipboard.readText()`.
- History persistence uses a single `history.json` file.
- The renderer assumes every item has editable text content and a character count.

## Proposed Approach

The app will continue to store history metadata in `history.json`, but image bytes will be saved as separate PNG files inside the app storage directory.
Each image history item will reference its PNG asset and carry lightweight metadata needed for rendering and clipboard operations.

This keeps the persisted history file small, avoids large base64 payloads in JSON, and makes file cleanup straightforward when image entries are deleted or trimmed.

## Data Model

### Clipboard History Item

Extend `ClipboardHistoryItem` to support two content types:

- `text`
- `image`

For text items, the existing `content` field remains the plain text value.

For image items:

- `content` will hold a short display label such as `Image`
- `imageRelativePath` will point to the saved PNG asset under the storage directory
- `imageWidth` and `imageHeight` will record pixel size

This preserves the current shape enough for shared lists while making image-specific behavior explicit.

### Persistence Layout

Under the existing storage directory:

- `settings.json`
- `history.json`
- `images/<id>.png`

`history.json` will contain metadata for both text and image items.
Image files will be written only when history persistence is enabled or while the app is running in memory-only mode for active session use.
When persistence is disabled, the app will still create temporary image files in the storage area and remove them on history clear, deletion, trim, and app restart.

## Capture Flow

### Clipboard Detection

The clipboard watcher will poll for both text and image changes:

- Read text with `clipboard.readText()`
- Read image with `clipboard.readImage()`

The watcher will detect an image copy when the native image is non-empty.
To avoid duplicate captures, it will track the last observed image using a stable fingerprint derived from the PNG bytes.
Text and image suppression will be handled separately so app-driven copy and paste actions do not re-add slots.

### History Insertion

When a new image is detected:

1. Convert the Electron `NativeImage` to PNG bytes.
2. Generate a stable history item id.
3. Save the PNG to the storage `images` directory.
4. Add an `image` history item with metadata and slot number.

Consecutive deduplication will also apply to images by comparing the latest image fingerprint to the new one.
Pinned-item behavior and max-history trimming stay unchanged.

## Paste And Clipboard Restore

### Copy Again

Selecting `Copy Again` on an image slot will write the saved PNG back to the clipboard as an image.
Selecting it on a text slot will keep the current text behavior.

### Paste Slot

Pasting an image slot will:

1. Save the previous clipboard state when `restoreClipboardAfterPaste` is enabled.
2. Write the slot image to the clipboard.
3. Trigger the existing simulated `Ctrl+V` paste flow.
4. Restore the previous clipboard content after the configured delay.

Clipboard restoration will preserve whichever single payload type was present before the paste:

- text if the clipboard previously contained text
- image if the clipboard previously contained an image
- nothing if the clipboard was effectively empty

Because the chosen product behavior is image-only storage, the restore path will restore only one payload type rather than reconstructing mixed clipboard formats.

## History Store Changes

The history store will gain image-aware operations:

- add image items
- sanitize and load persisted image metadata
- remove image asset files when items are deleted
- remove orphaned image assets when history is cleared or trimmed

Existing persisted text-only history remains valid and will continue loading without migration errors.
Invalid or missing image metadata will cause that specific item to be skipped during sanitize/load rather than failing the whole history file.

## Renderer Changes

### Main History Window

Text items keep the current card behavior.

Image items will render:

- a thumbnail preview
- content type badge `Image`
- timestamp
- pinned state
- pixel dimensions

Image items will not show:

- text editor
- character count

Available actions remain:

- `Copy Again`
- `Paste Now`
- `Pin` or `Unpin`
- `Delete`

### Slot Picker

The picker will show the same thumbnail preview for image items and continue to allow click-to-paste or number entry.
Text items will keep their current truncated text preview.

## IPC And Preload Surface

The existing IPC action surface can remain mostly unchanged because actions are slot-based or item-id-based.
No new renderer command is required for basic copy or paste behavior.

The renderer will need access to a safe image source for thumbnail display.
The preferred approach is to expose persisted image files through `file://`-style URLs generated in the main process and passed as item metadata, or another Electron-safe equivalent already used by the project.

## Error Handling

- If an image file cannot be written during capture, the slot will not be added.
- If an image file is missing during copy or paste, the action will fail with the same unavailable-item style message used for missing text entries.
- If thumbnail loading fails in the renderer, the card will fall back to an `Image unavailable` style placeholder without crashing the view.
- If history metadata references malformed image entries, those entries will be ignored during load.

## Testing Strategy

### Automated Tests

Add tests for:

- history item sanitization for text and image entries
- image file lifecycle on add, delete, trim, and clear
- clipboard watcher image detection and deduplication
- paste engine copy/paste behavior for image items
- clipboard restore logic for previous text, previous image, and empty clipboard
- renderer rendering differences between text and image cards

### Manual Verification

Verify these flows on Windows:

1. Copy text and confirm existing behavior is unchanged.
2. Copy an image and confirm a new image slot appears with a thumbnail.
3. Use `Copy Again` on an image slot and paste into another app.
4. Use direct hotkeys and chord mode to paste an image slot.
5. Confirm clipboard restore works after image paste for both previous text and previous image clipboard content.
6. Delete image slots, clear history, and reduce max history to confirm asset cleanup.
7. Restart the app with persistence on and confirm image slots reload correctly.

## Open Implementation Notes

- Prefer PNG as the normalized on-disk format regardless of the original copied image format.
- Keep image asset paths relative to the storage directory to avoid persisting machine-specific absolute paths.
- Reuse the current history ordering, slot numbering, and pinning rules exactly as they work for text entries.
- Keep text editing limited to text items to avoid ambiguous image-edit UX.
