import { Router } from 'express';
import {
	acceptConsentRequest,
	getConsentRequest,
} from '../hydraAdminClient.js';

export const consentRouter = Router();

consentRouter.get('/consent', async (req, res, next) => {
	try {
		const challenge = String(req.query.consent_challenge ?? '');
		if (!challenge) {
			res.status(400).send('Missing consent_challenge');
			return;
		}

		const consentRequest = await getConsentRequest(challenge);

		if (consentRequest.skip) {
			const { redirect_to } = await acceptConsentRequest(
				challenge,
				consentRequest.requested_scope,
				consentRequest.subject
			);
			res.redirect(redirect_to);
			return;
		}

		res.type('html').send(`
			<!doctype html>
			<html>
				<body>
					<h1>Grant access to ${consentRequest.client.client_id}</h1>
					<form method="post" action="/consent?consent_challenge=${challenge}">
						<p>Requested scopes: ${consentRequest.requested_scope.join(', ')}</p>
						<input type="hidden" name="scope" value="${consentRequest.requested_scope.join(' ')}" />
						<button type="submit">Allow</button>
					</form>
				</body>
			</html>
		`);
	} catch (error) {
		next(error);
	}
});

consentRouter.post('/consent', async (req, res, next) => {
	try {
		const challenge = String(req.query.consent_challenge ?? '');
		const consentRequest = await getConsentRequest(challenge);
		const { scope } = req.body as { scope?: string };
		const grantScope = scope ? scope.split(' ') : [];

		const { redirect_to } = await acceptConsentRequest(
			challenge,
			grantScope,
			consentRequest.subject
		);
		res.redirect(redirect_to);
	} catch (error) {
		next(error);
	}
});
