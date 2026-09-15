import {
	AUTHORIZE_URL,
	CLIENT_ID,
	LOGOUT_URL,
	REDIRECT_URI,
	SCOPE,
	TOKEN_URL,
} from './config';
import { generateCodeChallenge, generateRandomString } from './pkce';
import {
	clearPkceState,
	clearTokens,
	loadPkceState,
	loadTokens,
	type StoredTokens,
	savePkceState,
	saveTokens,
} from './tokenStorage';

interface TokenResponse {
	access_token: string;
	id_token: string;
	refresh_token?: string;
	expires_in: number;
}

export async function startLogin(): Promise<void> {
	const verifier = generateRandomString();
	const state = generateRandomString();
	const challenge = await generateCodeChallenge(verifier);

	savePkceState({ verifier, state });

	const params = new URLSearchParams({
		response_type: 'code',
		client_id: CLIENT_ID,
		redirect_uri: REDIRECT_URI,
		scope: SCOPE,
		state,
		code_challenge: challenge,
		code_challenge_method: 'S256',
	});

	window.location.assign(`${AUTHORIZE_URL}?${params.toString()}`);
}

export async function handleAuthCallback(): Promise<StoredTokens | null> {
	const params = new URLSearchParams(window.location.search);
	const code = params.get('code');
	const state = params.get('state');
	if (!code || !state) return null;

	const pkce = loadPkceState();
	clearPkceState();

	if (!pkce || pkce.state !== state) {
		window.history.replaceState(null, '', window.location.pathname);
		throw new Error('OAuth state mismatch');
	}

	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		redirect_uri: REDIRECT_URI,
		client_id: CLIENT_ID,
		code_verifier: pkce.verifier,
	});

	const response = await fetch(TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body,
	});

	window.history.replaceState(null, '', window.location.pathname);

	if (!response.ok) {
		throw new Error(
			`Token exchange failed (${response.status}): ${await response.text()}`
		);
	}

	const tokenResponse = (await response.json()) as TokenResponse;
	const tokens: StoredTokens = {
		accessToken: tokenResponse.access_token,
		idToken: tokenResponse.id_token,
		refreshToken: tokenResponse.refresh_token,
		expiresAt: Date.now() + tokenResponse.expires_in * 1000,
	};

	saveTokens(tokens);
	return tokens;
}

export function getValidTokens(): StoredTokens | null {
	const tokens = loadTokens();
	if (!tokens || tokens.expiresAt <= Date.now()) return null;
	return tokens;
}

export function logout(): void {
	const tokens = loadTokens();
	clearTokens();

	const params = new URLSearchParams({
		post_logout_redirect_uri: REDIRECT_URI,
	});
	if (tokens?.idToken) params.set('id_token_hint', tokens.idToken);

	window.location.assign(`${LOGOUT_URL}?${params.toString()}`);
}
