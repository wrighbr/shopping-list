import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { ShoppingItem } from '../types';
import ShoppingList from './ShoppingList';

const items: ShoppingItem[] = [
	{ id: '1', name: 'Bread', completed: false },
	{ id: '2', name: 'Milk', completed: true },
];

describe('ShoppingList', () => {
	it('shows an empty-state message when there are no items', () => {
		render(
			<ShoppingList items={[]} onToggle={jest.fn()} onRemove={jest.fn()} />
		);

		expect(
			screen.getByText('Your list is empty. Add some items above!')
		).toBeInTheDocument();
		expect(screen.queryByRole('list')).not.toBeInTheDocument();
	});

	it('renders one entry per item', () => {
		render(
			<ShoppingList items={items} onToggle={jest.fn()} onRemove={jest.fn()} />
		);

		expect(screen.getByText('Bread')).toBeInTheDocument();
		expect(screen.getByText('Milk')).toBeInTheDocument();
		expect(screen.getAllByRole('listitem')).toHaveLength(2);
	});
});
