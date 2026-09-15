import { useState } from 'react';
import styles from './App.module.css';
import AddItemForm from './components/AddItemForm';
import ShoppingList from './components/ShoppingList';
import type { ShoppingItem } from './types';

const App = () => {
	const [items, setItems] = useState<ShoppingItem[]>([]);

	const addItem = (name: string) => {
		const newItem: ShoppingItem = {
			id: crypto.randomUUID(),
			name,
			completed: false,
		};
		setItems((prev) => [...prev, newItem]);
	};

	const toggleItem = (id: string) => {
		setItems((prev) =>
			prev.map((item) =>
				item.id === id ? { ...item, completed: !item.completed } : item
			)
		);
	};

	const removeItem = (id: string) => {
		setItems((prev) => prev.filter((item) => item.id !== id));
	};

	return (
		<div className={styles.container}>
			<h1 className={styles.title}>Shopping List</h1>
			<AddItemForm onAdd={addItem} />
			<ShoppingList items={items} onToggle={toggleItem} onRemove={removeItem} />
		</div>
	);
};

export default App;
