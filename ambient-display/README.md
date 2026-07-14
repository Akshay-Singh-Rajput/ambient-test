# Ambient Display

Always-on, read-only ambient information display for wall-mounted tablets, iPads, and browsers.

## Quick start

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## Architecture

```
config.json
    ↓
Content Providers (data + business rules)
    ↓
Presentation Engine (collect + sort)
    ↓
Presentation Rules (assign regions)
    ↓
Display Renderer (render DOM)
```

Permanent shell (greeting, clock, date) lives outside providers.

## Providers

| Provider | Refresh |
|---|---|
| Clock | 1s (shell renders) |
| Agenda | 5 min |
| Calendar | 5 min |
| Notes | 5 min |
| Personal Message | 5 min |
| Weather | 3 hr |
| Photo | configurable |
| Quote | 24 hr |

## Config sections

`user`, `shell`, `settings`, `theme`, `weather`, `agenda`, `photos`, `quotes`, `notes`, `calendar`, `personalMessages`

## Target device

**iPad mini A1455** — 1024 × 768 landscape (4:3)

The UI is locked to this resolution via `css/ipad-mini.css`. Config section:

```json
"display": {
  "target": "ipad-mini-a1455",
  "width": 1024,
  "height": 768,
  "orientation": "landscape"
}
```

Add to Home Screen on the iPad for full-screen kiosk use. Keep the device in landscape — a portrait notice appears if rotated.

## Browser support

ES5 JavaScript — no build step, no frameworks. Compatible with older Safari / iOS WebKit.
