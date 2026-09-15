// Jest-only stand-in for `./config.ts`. The real module reads
// `import.meta.env`, which is a Vite build-time construct and does not exist
// under plain Node/Jest. This mirrors the same defaults/derivation using
// `process.env` instead. Wired into `authClient.test.ts` via
// `jest.mock('./config', () => jest.requireActual('./config.mock'))` so only
// tests that exercise the real `authClient.ts` need it - it's not applied
// globally (a global mapping would also hijack unrelated `./config` requires
// inside node_modules, e.g. `@testing-library/dom`'s own internal config
// module).
export const HYDRA_PUBLIC_URL =
	process.env.VITE_HYDRA_PUBLIC_URL ?? 'http://localhost:4444';
export const CLIENT_ID =
	process.env.VITE_HYDRA_CLIENT_ID ?? 'shopping-list-web';
export const SCOPE =
	process.env.VITE_HYDRA_SCOPE ?? 'openid offline profile email';
export const REDIRECT_URI =
	process.env.VITE_HYDRA_REDIRECT_URI ?? `${window.location.origin}/`;

export const AUTHORIZE_URL = `${HYDRA_PUBLIC_URL}/oauth2/auth`;
export const TOKEN_URL = `${HYDRA_PUBLIC_URL}/oauth2/token`;
export const LOGOUT_URL = `${HYDRA_PUBLIC_URL}/oauth2/sessions/logout`;
