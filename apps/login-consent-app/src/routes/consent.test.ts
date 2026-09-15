import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

jest.unstable_mockModule('../hydraAdminClient.js', () => ({
	getConsentRequest: jest.fn(),
	acceptConsentRequest: jest.fn(),
}));

const { getConsentRequest, acceptConsentRequest } = await import(
	'../hydraAdminClient.js'
);
const { consentRouter } = await import('./consent.js');

const getConsentRequestMock = getConsentRequest as jest.MockedFunction<
	typeof getConsentRequest
>;
const acceptConsentRequestMock = acceptConsentRequest as jest.MockedFunction<
	typeof acceptConsentRequest
>;

function buildApp() {
	const app = express();
	app.use(express.urlencoded({ extended: false }));
	app.use(consentRouter);
	return app;
}

describe('consentRouter', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('GET /consent without consent_challenge returns 400', async () => {
		const app = buildApp();
		const response = await request(app).get('/consent');
		expect(response.status).toBe(400);
	});

	it('GET /consent redirects immediately when the consent request should be skipped', async () => {
		getConsentRequestMock.mockResolvedValue({
			challenge: 'c1',
			skip: true,
			subject: 'user@example.com',
			requested_scope: ['openid'],
			client: { client_id: 'shopping-list-web' },
		});
		acceptConsentRequestMock.mockResolvedValue({
			redirect_to: 'http://hydra/callback',
		});

		const app = buildApp();
		const response = await request(app).get('/consent?consent_challenge=c1');

		expect(acceptConsentRequestMock).toHaveBeenCalledWith(
			'c1',
			['openid'],
			'user@example.com'
		);
		expect(response.status).toBe(302);
		expect(response.headers.location).toBe('http://hydra/callback');
	});

	it('GET /consent renders the requested scopes when not skipped', async () => {
		getConsentRequestMock.mockResolvedValue({
			challenge: 'c1',
			skip: false,
			subject: 'user@example.com',
			requested_scope: ['openid', 'email'],
			client: { client_id: 'shopping-list-web' },
		});

		const app = buildApp();
		const response = await request(app).get('/consent?consent_challenge=c1');

		expect(response.status).toBe(200);
		expect(response.text).toContain('shopping-list-web');
		expect(response.text).toContain('openid, email');
	});

	it('POST /consent splits the scope field and accepts with the granted scopes', async () => {
		getConsentRequestMock.mockResolvedValue({
			challenge: 'c1',
			skip: false,
			subject: 'user@example.com',
			requested_scope: ['openid', 'email'],
			client: { client_id: 'shopping-list-web' },
		});
		acceptConsentRequestMock.mockResolvedValue({
			redirect_to: 'http://hydra/callback',
		});

		const app = buildApp();
		const response = await request(app)
			.post('/consent?consent_challenge=c1')
			.type('form')
			.send({ scope: 'openid email' });

		expect(acceptConsentRequestMock).toHaveBeenCalledWith(
			'c1',
			['openid', 'email'],
			'user@example.com'
		);
		expect(response.status).toBe(302);
		expect(response.headers.location).toBe('http://hydra/callback');
	});

	it('POST /consent with no scope grants an empty scope list', async () => {
		getConsentRequestMock.mockResolvedValue({
			challenge: 'c1',
			skip: false,
			subject: 'user@example.com',
			requested_scope: [],
			client: { client_id: 'shopping-list-web' },
		});
		acceptConsentRequestMock.mockResolvedValue({
			redirect_to: 'http://hydra/callback',
		});

		const app = buildApp();
		await request(app)
			.post('/consent?consent_challenge=c1')
			.type('form')
			.send({});

		expect(acceptConsentRequestMock).toHaveBeenCalledWith(
			'c1',
			[],
			'user@example.com'
		);
	});
});
