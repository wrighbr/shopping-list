import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthHeader from './AuthHeader';

describe('AuthHeader', () => {
	it('shows the email when provided', () => {
		render(<AuthHeader email="user@example.com" onSignOut={jest.fn()} />);
		expect(screen.getByText('user@example.com')).toBeInTheDocument();
	});

	it('falls back to "Signed in" when email is null', () => {
		render(<AuthHeader email={null} onSignOut={jest.fn()} />);
		expect(screen.getByText('Signed in')).toBeInTheDocument();
	});

	it('calls onSignOut when the logout button is clicked', async () => {
		const onSignOut = jest.fn();
		const user = userEvent.setup();
		render(<AuthHeader email={null} onSignOut={onSignOut} />);

		await user.click(screen.getByRole('button', { name: 'Log out' }));
		expect(onSignOut).toHaveBeenCalledTimes(1);
	});
});
