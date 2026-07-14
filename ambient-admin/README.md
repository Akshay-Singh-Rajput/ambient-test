# Ambient Display Admin

Separate configuration app for the read-only `ambient-display/` kiosk client.

## Quick start

Serve the repo root so both apps are reachable over HTTP:

```bash
cd ambient-test
python -m http.server 8080
```

Open:

- **Admin:** http://localhost:8080/ambient-admin/
- **Display:** http://localhost:8080/ambient-display/

## Features

- Edit scene schedule (morning / day / evening / night)
- Configure theme, layout, and clock widget per scene
- Upload images and videos (staged in IndexedDB)
- Validate config against display contract
- Publish `config.json`, `cache-manifest.json`, and assets

## Publish options

### 1. Write to display folder (Chrome / Edge)

1. Open **Publish** panel
2. Click **Write to display folder**
3. Select the `ambient-display/` directory
4. Reload the display

### 2. Download + Node script

1. Download `config.json` and place it in `ambient-admin/export/config.json`
2. Copy uploaded assets to `ambient-admin/export/assets/`
3. Run:

```bash
node ambient-admin/scripts/publish.js
```

### 3. Download only

Use **Download config.json** and **Download cache-manifest.json**, then copy manually.

## Architecture

```
ambient-admin/   → writes config + assets
ambient-display/ → read-only kiosk (never modified by display itself)
```

Draft edits auto-save to `localStorage`. The display never calls the admin.
