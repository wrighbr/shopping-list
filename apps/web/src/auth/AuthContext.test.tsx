import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import * as authClient from './authClient';

jest.mock('./authClient', () => ({
	getValidTokens: jest.fn(),
	handleAuthCallback: jest.fn(),
	startLogin: jest.fn(),
	logout: jest.fn(),
}));

const getValidTokensMock = authClient.getValidTokens as jest.MockedFunction<
	typeof authClient.getValidTokens
>;
const handleAuthCallbackMock =
	authClient.handleAuthCallback as jest.MockedFunction<
		typeof authClient.handleAuthCallback
	>;
const startLoginMock = authClient.startLogin as jest.MockedFunction<
	typeof authClient.startLogin
>;
const logoutMock = authClient.logout as jest.MockedFunction<
	typeof authClient.logout
>;

function base64UrlEncode(json: unknown): string {
	const base64 = Buffer.from(JSON.stringify(json), 'utf-8').toString('base64');
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function TestConsumer() {
	const { status, email, login, logout: signOut } = useAuth();
	return (
		<div>
			<span data-testid="status">{status}</span>
			<span data-testid="email">{email ?? ''}</span>
			<button type="button" onClick={login}>
				login
			</button>
			<button type="button" onClick={signOut}>
				logout
			</button>
		</div>
	);
}

describe('AuthProvider / useAuth', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		window.history.replaceState(null, '', '/');
	});

	it('resolves to unauthenticated when there are no valid tokens', async () => {
		getValidTokensMock.mockReturnValue(null);

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);

		await waitFor(() =>
			expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
		);
	});

	it('resolves to authenticated with the email from the id token when valid tokens exist', async () => {
		const idToken = `h.${base64UrlEncode({ sub: 'user-1', email: 'user@example.com' })}.s`;
		getValidTokensMock.mockReturnValue({
			accessToken: 'a',
			idToken,
			expiresAt: Date.now() + 60_000,
		});

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);

		await waitFor(() =>
			expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
		);
		expect(screen.getByTestId('email')).toHaveTextContent('user@example.com');
	});

	it('handles the OAuth callback when a code is present in the URL', async () => {
		window.history.replaceState(null, '', '/?code=abc&state=xyz');
		const idToken = `h.${base64UrlEncode({ sub: 'user-2' })}.s`;
		handleAuthCallbackMock.mockResolvedValue({
			accessToken: 'a',
			idToken,
			expiresAt: Date.now() + 60_000,
		});

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);

		await waitFor(() => expect(handleAuthCallbackMock).toHaveBeenCalled());
		await waitFor(() =>
			expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
		);
		expect(screen.getByTestId('email')).toHaveTextContent('user-2');
	});

	it('falls back to unauthenticated when the callback exchange fails', async () => {
		window.history.replaceState(null, '', '/?code=abc&state=xyz');
		handleAuthCallbackMock.mockRejectedValue(new Error('state mismatch'));
		jest.spyOn(console, 'error').mockImplementation(() => {});

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);

		await waitFor(() =>
			expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
		);
	});

	it('login() delegates to authClient.startLogin', async () => {
		getValidTokensMock.mockReturnValue(null);
		const user = userEvent.setup();

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);
		await waitFor(() =>
			expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
		);

		await user.click(screen.getByText('login'));
		expect(startLoginMock).toHaveBeenCalledTimes(1);
	});

	it('logout() delegates to authClient.logout', async () => {
		getValidTokensMock.mockReturnValue(null);
		const user = userEvent.setup();

		render(
			<AuthProvider>
				<TestConsumer />
			</AuthProvider>
		);
		await waitFor(() =>
			expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
		);

		await user.click(screen.getByText('logout'));
		expect(logoutMock).toHaveBeenCalledTimes(1);
	});
});
