# Ambient Display

Offline-first ambient information displays for old tablets, iPads, Raspberry Pis, smart TVs, and browsers.

## Documentation

**Start here:** [Project Goals & Architecture](docs/GOALS.md) — vision, user side vs admin side, data flow, and design principles.

| App | Folder | Purpose |
|---|---|---|
| **Display** (kiosk) | [`ambient-display/`](ambient-display/) | Read-only viewer — runs 24/7 on wall-mounted devices |
| **Admin** (config) | [`ambient-admin/`](ambient-admin/) | Configure scenes, upload assets, publish updates |

## Quick start

```bash
python -m http.server 8080
```

| | URL |
|---|---|
| Display | http://localhost:8080/ambient-display/ |
| Admin | http://localhost:8080/ambient-admin/ |

## Repository layout

```
ambient-test/
├── docs/GOALS.md           Project vision and architecture
├── ambient-display/        Read-only kiosk client (ES5, offline-first)
└── ambient-admin/          Configuration and publish tool
```

## Core idea

```
Admin writes config  →  Static files  →  Display reads config  →  Beautiful ambient screen
```

The display never edits files. The admin never runs on the kiosk device.
