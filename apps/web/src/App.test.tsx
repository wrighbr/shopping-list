import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import * as AuthContextModule from './auth/AuthContext';

jest.mock('./auth/AuthContext', () => ({
	useAuth: jest.fn(),
}));

const useAuthMock = AuthContextModule.useAuth as jest.MockedFunction<
	typeof AuthContextModule.useAuth
>;

describe('App', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders only the title while loading', () => {
		useAuthMock.mockReturnValue({
			status: 'loading',
			email: null,
			login: jest.fn(),
			logout: jest.fn(),
		});

		render(<App />);

		expect(screen.getByText('Shopping List')).toBeInTheDocument();
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});

	it('renders SignIn and delegates to login() when unauthenticated', async () => {
		const login = jest.fn();
		useAuthMock.mockReturnValue({
			status: 'unauthenticated',
			email: null,
			login,
			logout: jest.fn(),
		});
		const user = userEvent.setup();

		render(<App />);

		await user.click(screen.getByRole('button', { name: 'Sign in' }));
		expect(login).toHaveBeenCalledTimes(1);
	});

	it('renders the shopping list and supports add/toggle/remove when authenticated', async () => {
		const logout = jest.fn();
		useAuthMock.mockReturnValue({
			status: 'authenticated',
			email: 'user@example.com',
			login: jest.fn(),
			logout,
		});
		const user = userEvent.setup();

		render(<App />);

		expect(screen.getByText('user@example.com')).toBeInTheDocument();
		expect(
			screen.getByText('Your list is empty. Add some items above!')
		).toBeInTheDocument();

		await user.type(screen.getByLabelText('New item name'), 'Eggs');
		await user.click(screen.getByRole('button', { name: 'Add' }));

		expect(screen.getByText('Eggs')).toBeInTheDocument();

		const checkbox = screen.getByLabelText('Mark "Eggs" as complete');
		await user.click(checkbox);
		expect(screen.getByLabelText('Mark "Eggs" as incomplete')).toBeChecked();

		await user.click(screen.getByLabelText('Remove "Eggs"'));
		expect(screen.queryByText('Eggs')).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Log out' }));
		expect(logout).toHaveBeenCalledTimes(1);
	});
});
