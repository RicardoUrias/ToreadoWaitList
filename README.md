# TacoQueue (Tacos el Toreado)

Lista de espera digital. El frontend es una app Vite + React desplegada como **Cloudflare Worker con assets estáticos**.

## Desarrollo local

1. `npm install`
2. Copia `.env.example` a `.env.local` si necesitas API o Gemini
3. `npm run dev` → [http://localhost:3000/](http://localhost:3000/)

Sin `VITE_API_URL`, la cola se guarda en `localStorage` (modo offline).

## Build / Cloudflare Workers

- **Build command:** `npm run build`
- **Output directory:** `dist` (configurado en `wrangler.toml` vía `[assets] directory`)
- **Deploy:** `npx wrangler deploy` (o automático vía Workers Builds al hacer push)
- Variables de build opcionales: `VITE_API_URL`, `VITE_GEMINI_API_KEY`

`not_found_handling = "single-page-application"` en `wrangler.toml` hace que las rutas de SPA caigan en `index.html` (el `public/_redirects` queda como respaldo, también soportado por Workers assets).
