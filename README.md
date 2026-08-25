# TacoQueue (Tacos el Toreado)

Lista de espera digital. El frontend es una app Vite + React pensada para **Cloudflare Pages**.

## Desarrollo local

1. `npm install`
2. Copia `.env.example` a `.env.local` si necesitas API o Gemini
3. `npm run dev` → [http://localhost:3000/](http://localhost:3000/)

Sin `VITE_API_URL`, la cola se guarda en `localStorage` (modo offline).

## Build / Cloudflare Pages

- **Build command:** `npm run build`
- **Output directory:** `dist`
- Variables de build opcionales: `VITE_API_URL`, `VITE_GEMINI_API_KEY`

El archivo `public/_redirects` hace que las rutas de SPA caigan en `index.html`.
