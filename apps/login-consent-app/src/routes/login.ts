import { Router } from 'express';
import { acceptLoginRequest, getLoginRequest } from '../hydraAdminClient.js';

// Dev-only: single hardcoded test user, no password hashing or persistence.
// Do not use this login flow outside local development.
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL ?? 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'password';

export const loginRouter = Router();

loginRouter.get('/login', async (req, res, next) => {
	try {
		const challenge = String(req.query.login_challenge ?? '');
		if (!challenge) {
			res.status(400).send('Missing login_challenge');
			return;
		}

		const loginRequest = await getLoginRequest(challenge);
		const activeSubject = loginRequest.subject || TEST_USER_EMAIL;

		if (loginRequest.skip || loginRequest.subject) {
			const { redirect_to } = await acceptLoginRequest(
				challenge,
				loginRequest.subject || TEST_USER_EMAIL
			);
			res.redirect(redirect_to);
			return;
		}

		res.type('html').send(`
			<!doctype html>
			<html>
				<body>
					<h1>Sign in</h1>
					<form method="post" action="/login?login_challenge=${challenge}">
						<label>Email <input type="email" name="email" value="${activeSubject}" /></label><br/>
						<label>Password <input type="password" name="password" /></label><br/>
						<button type="submit">Sign in</button>
					</form>
				</body>
			</html>
		`);
	} catch (error) {
		next(error);
	}
});

loginRouter.post('/login', async (req, res, next) => {
	try {
		const challenge = String(req.query.login_challenge ?? '');
		const { email, password } = req.body as {
			email?: string;
			password?: string;
		};

		if (email !== TEST_USER_EMAIL || password !== TEST_USER_PASSWORD) {
			res.status(401).send('Invalid credentials');
			return;
		}

		const { redirect_to } = await acceptLoginRequest(challenge, email);
		res.redirect(redirect_to);
	} catch (error) {
		next(error);
	}
});
