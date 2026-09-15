import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

jest.unstable_mockModule('../hydraAdminClient.js', () => ({
	getLoginRequest: jest.fn(),
	acceptLoginRequest: jest.fn(),
}));

const { getLoginRequest, acceptLoginRequest } = await import(
	'../hydraAdminClient.js'
);
const { loginRouter } = await import('./login.js');

const getLoginRequestMock = getLoginRequest as jest.MockedFunction<
	typeof getLoginRequest
>;
const acceptLoginRequestMock = acceptLoginRequest as jest.MockedFunction<
	typeof acceptLoginRequest
>;

function buildApp() {
	const app = express();
	app.use(express.urlencoded({ extended: false }));
	app.use(loginRouter);
	return app;
}

describe('loginRouter', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('GET /login without login_challenge returns 400', async () => {
		const app = buildApp();
		const response = await request(app).get('/login');
		expect(response.status).toBe(400);
	});

	it('GET /login redirects immediately when the login request should be skipped', async () => {
		getLoginRequestMock.mockResolvedValue({
			challenge: 'c1',
			skip: true,
			subject: 'test@example.com',
		});
		acceptLoginRequestMock.mockResolvedValue({
			redirect_to: 'http://hydra/callback',
		});

		const app = buildApp();
		const response = await request(app).get('/login?login_challenge=c1');

		expect(acceptLoginRequestMock).toHaveBeenCalledWith(
			'c1',
			'test@example.com'
		);
		expect(response.status).toBe(302);
		expect(response.headers.location).toBe('http://hydra/callback');
	});

	it('GET /login renders a sign-in form when not skipped', async () => {
		getLoginRequestMock.mockResolvedValue({
			challenge: 'c1',
			skip: false,
			subject: '',
		});

		const app = buildApp();
		const response = await request(app).get('/login?login_challenge=c1');

		expect(response.status).toBe(200);
		expect(response.text).toContain('Sign in');
		expect(response.text).toContain('test@example.com');
	});

	it('POST /login with wrong credentials returns 401', async () => {
		const app = buildApp();
		const response = await request(app)
			.post('/login?login_challenge=c1')
			.type('form')
			.send({ email: 'wrong@example.com', password: 'wrong' });

		expect(response.status).toBe(401);
		expect(acceptLoginRequestMock).not.toHaveBeenCalled();
	});

	it('POST /login with correct credentials accepts and redirects', async () => {
		acceptLoginRequestMock.mockResolvedValue({
			redirect_to: 'http://hydra/callback',
		});

		const app = buildApp();
		const response = await request(app)
			.post('/login?login_challenge=c1')
			.type('form')
			.send({ email: 'test@example.com', password: 'password' });

		expect(acceptLoginRequestMock).toHaveBeenCalledWith(
			'c1',
			'test@example.com'
		);
		expect(response.status).toBe(302);
		expect(response.headers.location).toBe('http://hydra/callback');
	});
});
