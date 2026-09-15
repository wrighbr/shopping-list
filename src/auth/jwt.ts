// Decodes an id_token's payload claims for display purposes only.
// Not signature-verified - do not use for authorization decisions.

export interface IdTokenClaims {
	sub: string;
	email?: string;
	[key: string]: unknown;
}

export function decodeIdTokenClaims(idToken: string): IdTokenClaims | null {
	const parts = idToken.split('.');
	if (parts.length !== 3) return null;

	try {
		const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const padded = payload.padEnd(
			payload.length + ((4 - (payload.length % 4)) % 4),
			'='
		);
		return JSON.parse(atob(padded)) as IdTokenClaims;
	} catch {
		return null;
	}
}
