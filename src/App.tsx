import { useState } from 'react';
import styles from './App.module.css';
import { useAuth } from './auth/AuthContext';
import AddItemForm from './components/AddItemForm';
import AuthHeader from './components/AuthHeader';
import ShoppingList from './components/ShoppingList';
import SignIn from './components/SignIn';
import type { ShoppingItem } from './types';

const App = () => {
	const { status, email, login, logout } = useAuth();
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

	if (status === 'loading') {
		return (
			<div className={styles.container}>
				<h1 className={styles.title}>Shopping List</h1>
			</div>
		);
	}

	if (status === 'unauthenticated') {
		return (
			<div className={styles.container}>
				<h1 className={styles.title}>Shopping List</h1>
				<SignIn onSignIn={login} />
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<AuthHeader email={email} onSignOut={logout} />
			<h1 className={styles.title}>Shopping List</h1>
			<AddItemForm onAdd={addItem} />
			<ShoppingList items={items} onToggle={toggleItem} onRemove={removeItem} />
		</div>
	);
};

export default App;
