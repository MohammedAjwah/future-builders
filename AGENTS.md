# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

This is a static HTML/CSS/JS website with **no build system, no package manager, and no backend**. It contains two Arabic-language (RTL) front-end prototypes:

1. **"انطلق" (Intaliq)** — E-commerce membership platform (`index.html`, `login.html`, `dashboard.html`, `plans.html`, `advisors.html`, `podcast.html`, `thankyou.html`, `style.css`, `app.js`). Uses `localStorage` for user data; no real backend.
2. **"Future Builders Platform"** — Student knowledge-sharing ecosystem (`MVP.html`, `PLATFORM.html`). Self-contained single-page HTML files with inline Tailwind CSS and JS.

### Running the application

Serve with any static HTTP server from the repo root:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html` in a browser.

### Key caveats

- External CDN dependencies (Chart.js, Tailwind CSS, Google Fonts, Font Awesome) are loaded at runtime. Internet connectivity is required for full rendering.
- The `dashboard.html` page requires a user to be registered first (data stored in `localStorage`). If you navigate directly without registering, you will be redirected to `login.html`.
- There are no lint, test, or build commands — the project has no `package.json`, `Makefile`, or any tooling configuration.
