# Build context is the repo root (see docker-compose.yml) so Yarn can
# resolve the workspace lockfile across all apps.

FROM node:20-alpine AS build
WORKDIR /app
# Workspace deps hoist to the root node_modules - make their bins resolvable
# from any nested workspace's package.json scripts (e.g. tsc).
ENV PATH="/app/node_modules/.bin:$PATH"
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/login-consent-app/package.json apps/login-consent-app/package.json
RUN yarn install --immutable
COPY apps/login-consent-app/tsconfig.json apps/login-consent-app/tsconfig.json
COPY apps/login-consent-app/src apps/login-consent-app/src
RUN yarn workspace login-consent-app build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/login-consent-app/package.json ./apps/login-consent-app/package.json
COPY --from=build /app/apps/login-consent-app/dist ./apps/login-consent-app/dist
EXPOSE 3001
CMD ["node", "apps/login-consent-app/dist/index.js"]
