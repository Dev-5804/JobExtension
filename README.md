# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

# Local Job Tracker

A privacy-first browser extension for tracking job applications locally.
Application records stay in the browser and can be exported or imported by the user.

## Features

- Quick application entry from the extension popup
- Draft persistence when the popup closes
- Best-effort extraction from the active job page
- Dashboard search, filtering, sorting, editing, and deletion
- Status tracking and local statistics
- Duplicate URL and company/title warnings
- JSON backup and restore
- CSV export
- Explicit clear-all-data control

## Development

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Run the checks:

```bash
npm test
npm run build
npm run lint
```

## Load the extension locally

1. Run `npm run build`.
2. Open `chrome://extensions` in Chrome or Chromium.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select the generated `dist/` directory.
6. Reload the extension after source changes and rebuild.

## Architecture

- `src/App.tsx`: popup quick-entry experience
- `src/dashboard/`: full application dashboard
- `src/storage/repository.ts`: local storage abstraction
- `src/extraction/`: active-tab and page extraction logic
- `src/utils/data.ts`: URL normalization, duplicate detection, and backup validation
- `public/manifest.json`: Manifest V3 configuration

The popup and dashboard use `chrome.storage.local` in the extension. The development fallback uses `localStorage` so the UI and tests can run under Vite.

## Privacy

The extension has no backend, account system, analytics, advertising, cloud sync, or external API. The `activeTab` and `scripting` permissions are used only for user-initiated page extraction. Export and import happen only after an explicit user action.

## Current limitations

Page extraction depends on the DOM and metadata exposed by each job site. The manual form remains available when extraction is incomplete or unavailable.
