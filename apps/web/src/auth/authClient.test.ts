import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('./config', () => jest.requireActual('./config.mock'));

import {
	getValidTokens,
	handleAuthCallback,
	logout,
	startLogin,
} from './authClient';
import { loadPkceState, type StoredTokens, saveTokens } from './tokenStorage';

function mockFetchResponse(ok: boolean, status: number, body: unknown) {
	return {
		ok,
		status,
		json: () => Promise.resolve(body),
		text: () => Promise.resolve(JSON.stringify(body)),
	} as Response;
}

// jsdom's `Location.prototype.assign` is a non-writable, spec "unforgeable"
// method, so `jest.spyOn(window.location, 'assign')` throws. Instead, replace
// the whole (configurable) `window.location` property with a Proxy that
// forwards every read (origin, search, pathname, etc.) to the real location
// but substitutes a mock for `assign`.
function mockLocationAssign() {
	const realLocation = window.location;
	const assignMock = jest.fn();
	// Proxy over a plain (fully configurable) target object rather than the
	// real Location - proxying the real object directly trips the Proxy "get"
	// invariant, since `assign` is a non-configurable/non-writable property on
	// the real Location and the trap can't lie about its value in that case.
	const proxy = new Proxy(
		{},
		{
			get(_target, prop) {
				if (prop === 'assign') return assignMock;
				const value = Reflect.get(realLocation, prop, realLocation);
				return typeof value === 'function' ? value.bind(realLocation) : value;
			},
		}
	);
	Object.defineProperty(window, 'location', {
		value: proxy,
		configurable: true,
	});
	return assignMock;
}

describe('authClient', () => {
	let assignSpy: ReturnType<typeof jest.fn>;
	let fetchMock: jest.MockedFunction<typeof fetch>;

	beforeEach(() => {
		sessionStorage.clear();
		assignSpy = mockLocationAssign();
		fetchMock = jest.fn();
		global.fetch = fetchMock;
		window.history.replaceState(null, '', '/');
	});

	describe('startLogin', () => {
		it('saves PKCE state and navigates to the authorize URL with expected params', async () => {
			await startLogin();

			const pkce = loadPkceState();
			expect(pkce).not.toBeNull();

			expect(assignSpy).toHaveBeenCalledTimes(1);
			const [calledUrl] = assignSpy.mock.calls[0] as [string];
			const url = new URL(calledUrl);

			expect(url.origin + url.pathname).toBe(
				'http://localhost:4444/oauth2/auth'
			);
			expect(url.searchParams.get('response_type')).toBe('code');
			expect(url.searchParams.get('client_id')).toBe('shopping-list-web');
			expect(url.searchParams.get('scope')).toBe(
				'openid offline profile email'
			);
			expect(url.searchParams.get('code_challenge_method')).toBe('S256');
			expect(url.searchParams.get('state')).toBe(pkce?.state);
			expect(url.searchParams.get('code_challenge')).toBeTruthy();
		});
	});

	describe('handleAuthCallback', () => {
		it('returns null when there is no code/state in the URL', async () => {
			window.history.replaceState(null, '', '/?foo=bar');
			await expect(handleAuthCallback()).resolves.toBeNull();
		});

		it('throws on state mismatch and clears stored PKCE state', async () => {
			sessionStorage.setItem(
				'shopping-list.auth.pkce',
				JSON.stringify({ verifier: 'v', state: 'expected-state' })
			);
			window.history.replaceState(null, '', '/?code=abc&state=wrong-state');

			await expect(handleAuthCallback()).rejects.toThrow(
				'OAuth state mismatch'
			);
			expect(sessionStorage.getItem('shopping-list.auth.pkce')).toBeNull();
		});

		it('exchanges the code for tokens and saves them on success', async () => {
			sessionStorage.setItem(
				'shopping-list.auth.pkce',
				JSON.stringify({ verifier: 'the-verifier', state: 'the-state' })
			);
			window.history.replaceState(null, '', '/?code=auth-code&state=the-state');

			const tokenResponse = {
				access_token: 'access-token',
				id_token: 'id-token',
				refresh_token: 'refresh-token',
				expires_in: 3600,
			};
			fetchMock.mockResolvedValue(mockFetchResponse(true, 200, tokenResponse));

			const result = await handleAuthCallback();

			expect(fetchMock).toHaveBeenCalledWith(
				'http://localhost:4444/oauth2/token',
				expect.objectContaining({ method: 'POST' })
			);
			const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
			const body = new URLSearchParams(init.body as string);
			expect(body.get('grant_type')).toBe('authorization_code');
			expect(body.get('code')).toBe('auth-code');
			expect(body.get('code_verifier')).toBe('the-verifier');

			expect(result).toMatchObject({
				accessToken: 'access-token',
				idToken: 'id-token',
				refreshToken: 'refresh-token',
			});
		});

		it('throws when the token exchange response is not ok', async () => {
			sessionStorage.setItem(
				'shopping-list.auth.pkce',
				JSON.stringify({ verifier: 'v', state: 'the-state' })
			);
			window.history.replaceState(null, '', '/?code=auth-code&state=the-state');
			fetchMock.mockResolvedValue(mockFetchResponse(false, 400, 'bad request'));

			await expect(handleAuthCallback()).rejects.toThrow(
				'Token exchange failed (400)'
			);
		});
	});

	describe('getValidTokens', () => {
		it('returns null when no tokens are stored', () => {
			expect(getValidTokens()).toBeNull();
		});

		it('returns null when the stored tokens are expired', () => {
			saveTokens({
				accessToken: 'a',
				idToken: 'i',
				expiresAt: Date.now() - 1000,
			});
			expect(getValidTokens()).toBeNull();
		});

		it('returns the stored tokens when still valid', () => {
			const tokens: StoredTokens = {
				accessToken: 'a',
				idToken: 'i',
				expiresAt: Date.now() + 60_000,
			};
			saveTokens(tokens);
			expect(getValidTokens()).toEqual(tokens);
		});
	});

	describe('logout', () => {
		it('clears tokens and navigates to the logout URL with the id_token_hint', () => {
			saveTokens({
				accessToken: 'a',
				idToken: 'the-id-token',
				expiresAt: Date.now() + 60_000,
			});

			logout();

			expect(getValidTokens()).toBeNull();
			expect(assignSpy).toHaveBeenCalledTimes(1);
			const [calledUrl] = assignSpy.mock.calls[0] as [string];
			const url = new URL(calledUrl);
			expect(url.origin + url.pathname).toBe(
				'http://localhost:4444/oauth2/sessions/logout'
			);
			expect(url.searchParams.get('id_token_hint')).toBe('the-id-token');
		});

		it('navigates without id_token_hint when there are no stored tokens', () => {
			logout();

			expect(assignSpy).toHaveBeenCalledTimes(1);
			const [calledUrl] = assignSpy.mock.calls[0] as [string];
			const url = new URL(calledUrl);
			expect(url.searchParams.has('id_token_hint')).toBe(false);
		});
	});
});
