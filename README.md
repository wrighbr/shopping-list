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

## Testing

Both apps have Jest test suites:

- `yarn test` – run both workspaces' suites sequentially
- `yarn workspace web test` / `yarn workspace login-consent-app test` – run
  a single workspace's suite

## Docker

Each app has its own multi-stage `Dockerfile` (`apps/web/Dockerfile`,
`apps/login-consent-app/Dockerfile`). Both build with a repo-root context so
Yarn can resolve the workspace lockfile. `apps/web` serves its build output
with nginx (`apps/web/nginx.conf`, SPA-aware fallback to `index.html`).

The root `docker-compose.yml` brings up the *entire* local dev stack in one
shot: the frontend, the login-consent app, and the Ory Hydra stack it
depends on (Postgres + Hydra migrate/serve). The single command to bring the
stack up is:

```sh
yarn stack:up
```

`stack:up` runs `docker compose up -d --build`, then automatically registers
both OAuth2 clients against the running Hydra admin API via
`auth/register-clients.sh` - no manual client setup needed. Use
`yarn stack:logs` to tail logs and `yarn stack:down` to tear everything down.

If you ever need to re-register or rotate a single client by hand, the
underlying scripts still work standalone:

```sh
./auth/create-web-client.sh
./auth/create-test-client.sh
```

You can also sanity-check the full OAuth2 flow end-to-end with
`./auth/verify-e2e.sh` once the stack is up.

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

