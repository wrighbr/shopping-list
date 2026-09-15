import { describe, expect, it } from '@jest/globals';
import { decodeIdTokenClaims } from './jwt';

function base64UrlEncode(json: unknown): string {
	const base64 = Buffer.from(JSON.stringify(json), 'utf-8').toString('base64');
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('decodeIdTokenClaims', () => {
	it('decodes the payload segment of a well-formed JWT', () => {
		const payload = { sub: 'user-1', email: 'user@example.com' };
		const token = `header.${base64UrlEncode(payload)}.signature`;

		expect(decodeIdTokenClaims(token)).toEqual(payload);
	});

	it('returns null when the token does not have exactly 3 segments', () => {
		expect(decodeIdTokenClaims('not-a-jwt')).toBeNull();
		expect(decodeIdTokenClaims('a.b')).toBeNull();
		expect(decodeIdTokenClaims('a.b.c.d')).toBeNull();
	});

	it('returns null when the payload segment is not valid base64/JSON', () => {
		const token = 'header.not-valid-json!!!.signature';
		expect(decodeIdTokenClaims(token)).toBeNull();
	});
});
