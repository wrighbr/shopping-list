import express from 'express';
import { consentRouter } from './routes/consent.js';
import { loginRouter } from './routes/login.js';
import { logoutRouter } from './routes/logout.js';

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(express.urlencoded({ extended: false }));

app.use(loginRouter);
app.use(consentRouter);
app.use(logoutRouter);

app.get('/health', (_req, res) => {
	res.status(200).send('ok');
});

app.listen(PORT, () => {
	console.log(`Login/consent app listening on port ${PORT}`);
});
