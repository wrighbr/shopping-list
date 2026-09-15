import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignIn from './SignIn';

describe('SignIn', () => {
	it('calls onSignIn when the sign in button is clicked', async () => {
		const onSignIn = jest.fn();
		const user = userEvent.setup();
		render(<SignIn onSignIn={onSignIn} />);

		await user.click(screen.getByRole('button', { name: 'Sign in' }));
		expect(onSignIn).toHaveBeenCalledTimes(1);
	});
});
