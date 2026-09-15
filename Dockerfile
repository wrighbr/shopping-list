# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Use the Yarn version pinned in package.json's "packageManager" field
RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src

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

RUN yarn build

# --- Runtime stage ---
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
