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

The root `docker-compose.yml` brings up the *entire* local dev stack in one
shot: the frontend, the login-consent app, and the Ory Hydra stack it
depends on (Postgres + Hydra migrate/serve). Copy the env template and fill
in real values first:

```sh
cp .env.example .env
# edit .env: POSTGRES_PASSWORD, SECRETS_SYSTEM, TEST_USER_EMAIL, TEST_USER_PASSWORD
yarn stack:up
```

`stack:up` runs `docker compose up -d --build` in the background; use
`yarn stack:logs` to tail logs and `yarn stack:down` to tear everything down.
Once it's up, register the OAuth2 clients against the running Hydra admin
API (one-off, only needed after a fresh Postgres volume):

```sh
./auth/create-web-client.sh
./auth/create-test-client.sh
```

This serves the frontend at http://localhost:5173, matching the redirect URI
of the `shopping-list-web` OAuth2 client, the login-consent app at
http://localhost:3001, and Hydra's public/admin APIs at
http://localhost:4444 / http://localhost:4445. Override the Hydra-related
build args in `docker-compose.yml` (or pass `--build-arg`) if pointing the
frontend at a different deployment:

- `VITE_HYDRA_PUBLIC_URL`
- `VITE_HYDRA_CLIENT_ID`
- `VITE_HYDRA_SCOPE`
- `VITE_HYDRA_REDIRECT_URI`

