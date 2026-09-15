import { beforeEach, describe, expect, it } from '@jest/globals';
import {
	clearPkceState,
	clearTokens,
	loadPkceState,
	loadTokens,
	type StoredTokens,
	savePkceState,
	saveTokens,
} from './tokenStorage';

describe('tokenStorage', () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	it('round-trips tokens through save/load/clear', () => {
		const tokens: StoredTokens = {
			accessToken: 'access',
			idToken: 'id',
			refreshToken: 'refresh',
			expiresAt: 12345,
		};

		expect(loadTokens()).toBeNull();

		saveTokens(tokens);
		expect(loadTokens()).toEqual(tokens);

		clearTokens();
		expect(loadTokens()).toBeNull();
	});

	it('returns null for corrupted token JSON', () => {
		sessionStorage.setItem('shopping-list.auth.tokens', 'not-json');
		expect(loadTokens()).toBeNull();
	});

	it('round-trips PKCE state through save/load/clear', () => {
		const pkce = { verifier: 'verifier-value', state: 'state-value' };

		expect(loadPkceState()).toBeNull();

		savePkceState(pkce);
		expect(loadPkceState()).toEqual(pkce);

		clearPkceState();
		expect(loadPkceState()).toBeNull();
	});

	it('returns null for corrupted PKCE JSON', () => {
		sessionStorage.setItem('shopping-list.auth.pkce', 'not-json');
		expect(loadPkceState()).toBeNull();
	});
});
