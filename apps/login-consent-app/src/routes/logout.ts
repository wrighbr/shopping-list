import { Router } from 'express';
import { acceptLogoutRequest } from '../hydraAdminClient.js';

export const logoutRouter = Router();

logoutRouter.get('/logout', async (req, res, next) => {
	try {
		const challenge = String(req.query.logout_challenge ?? '');
		if (!challenge) {
			res.status(400).send('Missing logout_challenge');
			return;
		}

		const { redirect_to } = await acceptLogoutRequest(challenge);
		res.redirect(redirect_to);
	} catch (error) {
		next(error);
	}
});
