import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

jest.unstable_mockModule('../hydraAdminClient.js', () => ({
	acceptLogoutRequest: jest.fn(),
}));

const { acceptLogoutRequest } = await import('../hydraAdminClient.js');
const { logoutRouter } = await import('./logout.js');

const acceptLogoutRequestMock = acceptLogoutRequest as jest.MockedFunction<
	typeof acceptLogoutRequest
>;

function buildApp() {
	const app = express();
	app.use(logoutRouter);
	return app;
}

describe('logoutRouter', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('GET /logout without logout_challenge returns 400', async () => {
		const app = buildApp();
		const response = await request(app).get('/logout');
		expect(response.status).toBe(400);
	});

	it('GET /logout accepts the logout request and redirects', async () => {
		acceptLogoutRequestMock.mockResolvedValue({
			redirect_to: 'http://hydra/logout-callback',
		});

		const app = buildApp();
		const response = await request(app).get('/logout?logout_challenge=c1');

		expect(acceptLogoutRequestMock).toHaveBeenCalledWith('c1');
		expect(response.status).toBe(302);
		expect(response.headers.location).toBe('http://hydra/logout-callback');
	});
});
