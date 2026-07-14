# Ambient Display

Offline-first ambient information displays for old tablets, iPads, Raspberry Pis, smart TVs, and browsers.

## Quick start

Serve the folder over HTTP (required for loading `config/config.json`):

```bash
# Python 3
python -m http.server 8080

# Node (npx, optional)
npx serve .
```

Open `http://localhost:8080` in the browser, or deploy the folder to **GitHub Pages**.

> Opening `index.html` directly via `file://` will fail to load the config due to browser security restrictions.

## Project structure

```
ambient-display/
  index.html          Entry HTML — loads CSS and JS in dependency order
  css/app.css         Global layout and theme styles
  js/
    app.js            Bootstrap entry point
    config-loader.js  Loads and validates config/config.json
    renderer.js       DOM renderer — exposes render()
    scheduler.js      Future widget refresh scheduler (stub)
    storage.js        localStorage wrapper with in-memory fallback
  widgets/            Widget implementations (future)
  config/config.json  Runtime configuration
  assets/             Static assets (future)
```

## Browser support

- Vanilla JavaScript (ES5)
- No build step, no npm packages
- Compatible with older Safari / iOS WebKit

## Configuration

Edit `config/config.json`:

```json
{
  "version": "1.0.0",
  "theme": { "name": "dark" },
  "widgets": []
}
```

Supported themes: `dark`, `light`.
