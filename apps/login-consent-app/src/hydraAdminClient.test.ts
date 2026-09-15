import {
	afterAll,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';

const originalFetch = global.fetch;

describe('hydraAdminClient', () => {
	let fetchMock: ReturnType<typeof jest.fn>;

	beforeEach(async () => {
		jest.resetModules();
		fetchMock = jest.fn();
		global.fetch = fetchMock as unknown as typeof fetch;
	});

	afterAll(() => {
		global.fetch = originalFetch;
	});

	async function importClient() {
		return import('./hydraAdminClient.js');
	}

	function okResponse(body: unknown) {
		return {
			ok: true,
			status: 200,
			json: () => Promise.resolve(body),
			text: () => Promise.resolve(JSON.stringify(body)),
		};
	}

	function errorResponse(status: number, text: string) {
		return {
			ok: false,
			status,
			text: () => Promise.resolve(text),
		};
	}

	it('getLoginRequest issues a GET with the challenge in the query string', async () => {
		const { getLoginRequest } = await importClient();
		const payload = { challenge: 'c1', skip: false, subject: '' };
		fetchMock.mockResolvedValueOnce(okResponse(payload));

		const result = await getLoginRequest('c1');

		expect(result).toEqual(payload);
		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:4445/admin/oauth2/auth/requests/login?challenge=c1',
			expect.objectContaining({
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
				}),
			})
		);
	});

	it('acceptLoginRequest PUTs the subject and remember flag', async () => {
		const { acceptLoginRequest } = await importClient();
		fetchMock.mockResolvedValueOnce(
			okResponse({ redirect_to: 'http://redirect' })
		);

		const result = await acceptLoginRequest('c1', 'user@example.com');

		expect(result).toEqual({ redirect_to: 'http://redirect' });
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe(
			'http://localhost:4445/admin/oauth2/auth/requests/login/accept?challenge=c1'
		);
		expect(init.method).toBe('PUT');
		expect(JSON.parse(init.body as string)).toEqual({
			subject: 'user@example.com',
			remember: false,
		});
	});

	it('getConsentRequest issues a GET with the challenge in the query string', async () => {
		const { getConsentRequest } = await importClient();
		const payload = {
			challenge: 'c2',
			skip: false,
			subject: 'user@example.com',
			requested_scope: ['openid'],
			client: { client_id: 'shopping-list-web' },
		};
		fetchMock.mockResolvedValueOnce(okResponse(payload));

		const result = await getConsentRequest('c2');

		expect(result).toEqual(payload);
		expect(fetchMock).toHaveBeenCalledWith(
			'http://localhost:4445/admin/oauth2/auth/requests/consent?challenge=c2',
			expect.anything()
		);
	});

	it('acceptConsentRequest PUTs the grant scope and id_token session claims', async () => {
		const { acceptConsentRequest } = await importClient();
		fetchMock.mockResolvedValueOnce(
			okResponse({ redirect_to: 'http://redirect' })
		);

		const result = await acceptConsentRequest(
			'c2',
			['openid', 'email'],
			'user@example.com'
		);

		expect(result).toEqual({ redirect_to: 'http://redirect' });
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe(
			'http://localhost:4445/admin/oauth2/auth/requests/consent/accept?challenge=c2'
		);
		expect(init.method).toBe('PUT');
		expect(JSON.parse(init.body as string)).toEqual({
			grant_scope: ['openid', 'email'],
			grant_access_token_audience: [],
			session: { id_token: { email: 'user@example.com' } },
			remember: false,
		});
	});

	it('acceptLogoutRequest PUTs with no body', async () => {
		const { acceptLogoutRequest } = await importClient();
		fetchMock.mockResolvedValueOnce(
			okResponse({ redirect_to: 'http://redirect' })
		);

		const result = await acceptLogoutRequest('c3');

		expect(result).toEqual({ redirect_to: 'http://redirect' });
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe(
			'http://localhost:4445/admin/oauth2/auth/requests/logout/accept?challenge=c3'
		);
		expect(init.method).toBe('PUT');
		expect(init.body).toBeUndefined();
	});

	it('throws with the response status and body when the admin API errors', async () => {
		const { getLoginRequest } = await importClient();
		fetchMock.mockResolvedValueOnce(errorResponse(404, 'not found'));

		await expect(getLoginRequest('missing')).rejects.toThrow(
			'Hydra admin API error (404): not found'
		);
	});
});
