import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddItemForm from './AddItemForm';

describe('AddItemForm', () => {
	it('calls onAdd with the trimmed value and clears the input on submit', async () => {
		const onAdd = jest.fn();
		const user = userEvent.setup();
		render(<AddItemForm onAdd={onAdd} />);

		const input = screen.getByLabelText('New item name');
		await user.type(input, '  Milk  ');
		await user.click(screen.getByRole('button', { name: 'Add' }));

		expect(onAdd).toHaveBeenCalledWith('Milk');
		expect(input).toHaveValue('');
	});

	it('does not call onAdd when the input is empty or whitespace only', async () => {
		const onAdd = jest.fn();
		const user = userEvent.setup();
		render(<AddItemForm onAdd={onAdd} />);

		await user.click(screen.getByRole('button', { name: 'Add' }));
		expect(onAdd).not.toHaveBeenCalled();

		await user.type(screen.getByLabelText('New item name'), '   ');
		await user.click(screen.getByRole('button', { name: 'Add' }));
		expect(onAdd).not.toHaveBeenCalled();
	});
});
