import { describe, expect, it } from '@jest/globals';
import { generateCodeChallenge, generateRandomString } from './pkce';

describe('generateRandomString', () => {
	it('returns a base64url string of the expected length class', () => {
		const value = generateRandomString(32);
		// 32 random bytes -> 43 base64url characters (no padding).
		expect(value).toHaveLength(43);
	});

	it('only contains base64url-safe characters', () => {
		const value = generateRandomString(32);
		expect(value).toMatch(/^[A-Za-z0-9_-]+$/);
	});

	it('produces different values on each call', () => {
		const a = generateRandomString();
		const b = generateRandomString();
		expect(a).not.toBe(b);
	});
});

describe('generateCodeChallenge', () => {
	it('matches the RFC 7636 Appendix B known test vector', async () => {
		const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
		const challenge = await generateCodeChallenge(verifier);
		expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
	});
});
