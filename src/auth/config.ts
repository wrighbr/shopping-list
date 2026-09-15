// Dev-only Hydra/OAuth2 config for the SPA. Defaults match the local docker
// compose stack in auth/ - override via VITE_ env vars if needed.

const env = import.meta.env;

export const HYDRA_PUBLIC_URL =
	env.VITE_HYDRA_PUBLIC_URL ?? 'http://localhost:4444';
export const CLIENT_ID = env.VITE_HYDRA_CLIENT_ID ?? 'shopping-list-web';
export const SCOPE = env.VITE_HYDRA_SCOPE ?? 'openid offline profile email';
export const REDIRECT_URI =
	env.VITE_HYDRA_REDIRECT_URI ?? `${window.location.origin}/`;

export const AUTHORIZE_URL = `${HYDRA_PUBLIC_URL}/oauth2/auth`;
export const TOKEN_URL = `${HYDRA_PUBLIC_URL}/oauth2/token`;
export const LOGOUT_URL = `${HYDRA_PUBLIC_URL}/oauth2/sessions/logout`;
