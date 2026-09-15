# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Linting & Formatting

This project uses [Biome](https://biomejs.dev) for linting and formatting, configured in `biome.json`. Available scripts:

- `yarn lint` – check for lint issues (`biome check src`)
- `yarn lint:fix` – check and automatically fix issues (`biome check --write src`)
- `yarn format` – format the source code (`biome format --write src`)

## Docker

A multi-stage `Dockerfile` builds the app with Vite and serves the static output
with nginx (`nginx.conf`, SPA-aware fallback to `index.html`).

```sh
docker compose up --build
```

This serves the app at http://localhost:5173, matching the redirect URI of the
`shopping-list-web` OAuth2 client used by the local Hydra stack in `auth/`
(see `auth/create-web-client.sh`). Override the Hydra-related build args in
`docker-compose.yml` (or pass `--build-arg`) if pointing at a different
deployment:

- `VITE_HYDRA_PUBLIC_URL`
- `VITE_HYDRA_CLIENT_ID`
- `VITE_HYDRA_SCOPE`
- `VITE_HYDRA_REDIRECT_URI`
