// Thin wrapper around the Ory Hydra Admin API used by the dev-only
// login/consent app. Not intended for production use.

const HYDRA_ADMIN_URL = process.env.HYDRA_ADMIN_URL ?? 'http://localhost:4445';

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${HYDRA_ADMIN_URL}${path}`, {
		...init,
		headers: {
			'Content-Type': 'application/json',
			...init?.headers,
		},
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Hydra admin API error (${response.status}): ${body}`);
	}

	return response.json() as Promise<T>;
}

export interface LoginRequest {
	challenge: string;
	skip: boolean;
	subject: string;
}

export interface ConsentRequest {
	challenge: string;
	skip: boolean;
	subject: string;
	requested_scope: string[];
	client: { client_id: string };
}

export interface RedirectResponse {
	redirect_to: string;
}

// Note: the browser-facing redirects from Hydra use `login_challenge` /
// `consent_challenge` / `logout_challenge` as the query param name, but the
// Admin API itself expects a generic `challenge` param for all three.

export function getLoginRequest(challenge: string): Promise<LoginRequest> {
	return adminFetch<LoginRequest>(
		`/admin/oauth2/auth/requests/login?challenge=${encodeURIComponent(challenge)}`
	);
}

export function acceptLoginRequest(
	challenge: string,
	subject: string
): Promise<RedirectResponse> {
	return adminFetch<RedirectResponse>(
		`/admin/oauth2/auth/requests/login/accept?challenge=${encodeURIComponent(challenge)}`,
		{
			method: 'PUT',
			body: JSON.stringify({ subject, remember: false }),
		}
	);
}

export function getConsentRequest(challenge: string): Promise<ConsentRequest> {
	return adminFetch<ConsentRequest>(
		`/admin/oauth2/auth/requests/consent?challenge=${encodeURIComponent(challenge)}`
	);
}

export function acceptConsentRequest(
	challenge: string,
	grantScope: string[],
	subject: string
): Promise<RedirectResponse> {
	return adminFetch<RedirectResponse>(
		`/admin/oauth2/auth/requests/consent/accept?challenge=${encodeURIComponent(challenge)}`,
		{
			method: 'PUT',
			body: JSON.stringify({
				grant_scope: grantScope,
				grant_access_token_audience: [],
				session: {
					id_token: { email: subject },
				},
				remember: false,
			}),
		}
	);
}

export function acceptLogoutRequest(
	challenge: string
): Promise<RedirectResponse> {
	return adminFetch<RedirectResponse>(
		`/admin/oauth2/auth/requests/logout/accept?challenge=${encodeURIComponent(challenge)}`,
		{ method: 'PUT' }
	);
}
