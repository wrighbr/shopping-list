// sessionStorage wrappers for OAuth tokens and transient PKCE/state values.
// Dev-only: sessionStorage is used for simplicity, not hardened against XSS.

export interface StoredTokens {
	accessToken: string;
	idToken: string;
	refreshToken?: string;
	expiresAt: number;
}

const TOKENS_KEY = 'shopping-list.auth.tokens';
const PKCE_KEY = 'shopping-list.auth.pkce';

export function saveTokens(tokens: StoredTokens): void {
	sessionStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export function loadTokens(): StoredTokens | null {
	const raw = sessionStorage.getItem(TOKENS_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as StoredTokens;
	} catch {
		return null;
	}
}

export function clearTokens(): void {
	sessionStorage.removeItem(TOKENS_KEY);
}

export interface PkceState {
	verifier: string;
	state: string;
}

export function savePkceState(pkce: PkceState): void {
	sessionStorage.setItem(PKCE_KEY, JSON.stringify(pkce));
}

export function loadPkceState(): PkceState | null {
	const raw = sessionStorage.getItem(PKCE_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as PkceState;
	} catch {
		return null;
	}
}

export function clearPkceState(): void {
	sessionStorage.removeItem(PKCE_KEY);
}
