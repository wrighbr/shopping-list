import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ShoppingItem as ShoppingItemType } from '../types';
import ShoppingItem from './ShoppingItem';

const item: ShoppingItemType = { id: '1', name: 'Bread', completed: false };

describe('ShoppingItem', () => {
	it('renders the item name and an unchecked checkbox when not completed', () => {
		render(
			<ShoppingItem item={item} onToggle={jest.fn()} onRemove={jest.fn()} />
		);

		expect(screen.getByText('Bread')).toBeInTheDocument();
		expect(screen.getByLabelText('Mark "Bread" as complete')).not.toBeChecked();
	});

	it('renders a checked checkbox when completed', () => {
		render(
			<ShoppingItem
				item={{ ...item, completed: true }}
				onToggle={jest.fn()}
				onRemove={jest.fn()}
			/>
		);

		expect(screen.getByLabelText('Mark "Bread" as incomplete')).toBeChecked();
	});

	it('calls onToggle with the item id when the checkbox is clicked', async () => {
		const onToggle = jest.fn();
		const user = userEvent.setup();
		render(
			<ShoppingItem item={item} onToggle={onToggle} onRemove={jest.fn()} />
		);

		await user.click(screen.getByLabelText('Mark "Bread" as complete'));
		expect(onToggle).toHaveBeenCalledWith('1');
	});

	it('calls onRemove with the item id when the remove button is clicked', async () => {
		const onRemove = jest.fn();
		const user = userEvent.setup();
		render(
			<ShoppingItem item={item} onToggle={jest.fn()} onRemove={onRemove} />
		);

		await user.click(screen.getByLabelText('Remove "Bread"'));
		expect(onRemove).toHaveBeenCalledWith('1');
	});
});
