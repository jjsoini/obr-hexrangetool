# Bug: Custom range falsely reported as out of sync

## Symptom

The settings popover shows the warning _"[Range name] out of sync with saved range. Select a new range to update."_ for a custom range even though no changes have been made since it was last saved.

## Root cause

`Settings.tsx` compares the custom range from `localStorage` against the active range from OBR scene metadata using `JSON.stringify`:

```ts
const isEqual = JSON.stringify(customRange) === JSON.stringify(selectedRange);
```

`JSON.stringify` is sensitive to property insertion order. When a range object is written to scene metadata via `OBR.scene.setMetadata` and later read back via `OBR.scene.getMetadata`, OBR's backend serialization does not guarantee that object properties are returned in the same order they were written. The `localStorage` copy and the scene metadata copy therefore produce different `JSON.stringify` outputs even when the data is logically identical, causing `outdatedRange` to be `true` on every popover open.

## Fix

Replace the `JSON.stringify` comparison with an explicit field-by-field comparison that is insensitive to property order:

```ts
const isEqual =
  customRange.name === selectedRange.name &&
  customRange.type === selectedRange.type &&
  customRange.hideLabel === selectedRange.hideLabel &&
  customRange.hideSize === selectedRange.hideSize &&
  customRange.rings.length === selectedRange.rings.length &&
  customRange.rings.every(
    (ring, i) =>
      ring.id === selectedRange.rings[i].id &&
      ring.name === selectedRange.rings[i].name &&
      ring.radius === selectedRange.rings[i].radius
  );
```
