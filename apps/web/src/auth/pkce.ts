// PKCE (RFC 7636) helpers using Web Crypto - no external deps.

function base64UrlEncode(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary)
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

export function generateRandomString(length = 32): string {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	return base64UrlEncode(bytes);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
	const data = new TextEncoder().encode(verifier);
	const digest = await crypto.subtle.digest('SHA-256', data);
	return base64UrlEncode(new Uint8Array(digest));
}
