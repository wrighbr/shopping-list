# Build context is the repo root (see docker-compose.yml) so Yarn can
# resolve the workspace lockfile across all apps.

# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
# Workspace deps hoist to the root node_modules - make their bins resolvable
# from any nested workspace's package.json scripts (e.g. tsc, vite).
ENV PATH="/app/node_modules/.bin:$PATH"

# Use the Yarn version pinned in package.json's "packageManager" field
RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/login-consent-app/package.json apps/login-consent-app/package.json
RUN yarn install --immutable

COPY apps/web/tsconfig.json apps/web/tsconfig.app.json apps/web/tsconfig.node.json apps/web/vite.config.ts apps/web/index.html apps/web/
COPY apps/web/public apps/web/public
COPY apps/web/src apps/web/src

# Vite inlines VITE_* vars at build time - override at build to point at a
# non-default Hydra deployment (see auth/ for the local dev stack).
ARG VITE_HYDRA_PUBLIC_URL
ARG VITE_HYDRA_CLIENT_ID
ARG VITE_HYDRA_SCOPE
ARG VITE_HYDRA_REDIRECT_URI
ENV VITE_HYDRA_PUBLIC_URL=$VITE_HYDRA_PUBLIC_URL \
    VITE_HYDRA_CLIENT_ID=$VITE_HYDRA_CLIENT_ID \
    VITE_HYDRA_SCOPE=$VITE_HYDRA_SCOPE \
    VITE_HYDRA_REDIRECT_URI=$VITE_HYDRA_REDIRECT_URI

RUN yarn workspace web build

# --- Runtime stage ---
FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
