# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start dev server (served at localhost:5173, CORS allowed from owlbear.rodeo)
pnpm build      # Type-check with tsc then build with Vite
pnpm preview    # Preview the production build
```

No test runner is configured in this project.

## Architecture

This is an **Owlbear Rodeo extension** — a browser extension/plugin for the Owlbear Rodeo virtual tabletop. It provides a circular/square range-measuring tool integrated into OBR's measure tool.

### Multi-entry Vite build

Vite is configured with three separate HTML entry points, each a distinct extension surface:

| Entry | File | Purpose |
|---|---|---|
| `background` | `background.html` → `src/background/main.ts` | Runs persistently; registers the tool, actions, and syncs settings |
| `settings` | `settings.html` → `src/settings/main.tsx` | Popover UI (React + MUI) for GM to configure ranges |
| `theme` | `theme.html` → `src/theme/main.tsx` | Popover UI (React + MUI) for selecting color themes |

### Background entry (`src/background/`)

The background script initializes after `OBR.onReady()` and sets up three things:

- **`createRangeTool`** — Registers a custom mode on OBR's built-in measure tool (shortcut: `O`). On pointer down it renders range rings (shapes + labels) and SKSL shader effects on the `POPOVER`/`POINTER` layers using `OBR.interaction.startItemInteraction`. Rings are ephemeral — cleaned up on drag end or tool deactivation.
- **`createSettingsAction`** — Registers a toolbar action (GM-only) that opens the settings popover.
- **`createThemeAction`** — Registers a toolbar action that opens the theme selector popover.
- **`syncSettings`** — On scene ready (GM only), writes the last-used range preset into scene metadata so all players share the same range configuration.

### Data model (`src/ranges/`)

- **`Range`**: `{ name, id, type: "circle"|"square", rings: Ring[], hideLabel?, hideSize? }`
- **`Ring`**: `{ radius, name, id }` — radius in grid units
- Three built-in presets in `src/ranges/templates/`: `dagger`, `steel`, `dragons`
- Custom ranges are stored in `localStorage` under key `"ranges"`
- The active range for a scene is stored in OBR scene metadata under key `jjsoini.pulpscape.blastrange/range`

### Theme system (`src/theme/`)

Four color themes (Base, Deuteranopia, Tritanopia, Protanopia), each with 6 RGB colors that cycle across rings. Theme selection is stored in `localStorage` under key `"theme"`. The background reads theme from localStorage directly via `getStoredTheme()` — themes are not synced via scene metadata.

### Shader rendering

The range tool renders two SKSL (Skia Shading Language) shader effects via `buildEffect()`:
1. A darkening effect on the `POINTER` layer (MULTIPLY blend) to dim the background
2. A ring-coloring effect (`src/background/ring.frag`) on the `POINTER` layer (COLOR blend) that draws colored halos around ring positions

The shader supports up to 10 rings (5 `mat3` uniforms, each encoding 2 rings). Exceeding 10 rings requires updating the shader.

### Plugin ID namespace

All OBR metadata keys, tool/action IDs use the reverse-domain prefix `jjsoini.pulpscape.blastrange/` via `getPluginId()` in `src/util/getPluginId.ts`.

### Settings UI

The settings popover (`src/settings/`) uses React + MUI. `OBRContext.tsx` provides OBR SDK access. The GM can select from built-in presets or create/edit custom ranges. Changes are written to OBR scene metadata immediately so all players see updates in real time.
