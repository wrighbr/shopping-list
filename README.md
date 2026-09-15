# React + TypeScript + Vite

This is a Yarn workspaces monorepo with two apps:

- `apps/web` – the React/Vite shopping list frontend
- `apps/login-consent-app` – a dev-only Express login/consent server used by
  the local Ory Hydra stack in `auth/`

Currently, two official Vite React plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Workspace scripts

Run these from the repo root - they delegate to the `web` workspace (and, for
`build`, `login-consent-app` too):

- `yarn dev` – start the Vite dev server (`apps/web`)
- `yarn build` – build both apps
- `yarn lint` / `yarn lint:fix` / `yarn format` – Biome, scoped to
  `apps/web/src` and `apps/login-consent-app/src`

To target a single workspace directly, use `yarn workspace <name> <script>`,
e.g. `yarn workspace login-consent-app build`.

## Linting & Formatting

This project uses [Biome](https://biomejs.dev) for linting and formatting,
configured once in the root `biome.json` and applied across both apps.

## Docker

Each app has its own multi-stage `Dockerfile` (`apps/web/Dockerfile`,
`apps/login-consent-app/Dockerfile`). Both build with a repo-root context so
Yarn can resolve the workspace lockfile. `apps/web` serves its build output
with nginx (`apps/web/nginx.conf`, SPA-aware fallback to `index.html`).

```sh
docker compose up --build
```

This serves the frontend at http://localhost:5173, matching the redirect URI
of the `shopping-list-web` OAuth2 client used by the local Hydra stack in
`auth/` (see `auth/create-web-client.sh`). Override the Hydra-related build
args in `docker-compose.yml` (or pass `--build-arg`) if pointing at a
different deployment:

- `VITE_HYDRA_PUBLIC_URL`
- `VITE_HYDRA_CLIENT_ID`
- `VITE_HYDRA_SCOPE`
- `VITE_HYDRA_REDIRECT_URI`

The `login-consent-app` image is built via `auth/docker-compose.yml` (see
that file's `login-consent` service).
