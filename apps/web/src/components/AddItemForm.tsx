import { type FormEvent, useState } from 'react';
import styles from './AddItemForm.module.css';

interface Props {
	onAdd: (name: string) => void;
}

const AddItemForm = ({ onAdd }: Props) => {
	const [value, setValue] = useState('');

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const trimmed = value.trim();
		if (!trimmed) return;
		onAdd(trimmed);
		setValue('');
	};

	return (
		<form className={styles.form} onSubmit={handleSubmit}>
			<input
				className={styles.input}
				type="text"
				placeholder="Add an item..."
				value={value}
				onChange={(e) => setValue(e.target.value)}
				aria-label="New item name"
			/>
			<button className={styles.button} type="submit">
				Add
			</button>
		</form>
	);
};

export default AddItemForm;
