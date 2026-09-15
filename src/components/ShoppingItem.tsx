import type { ShoppingItem as ShoppingItemType } from '../types';
import styles from './ShoppingItem.module.css';

interface Props {
	item: ShoppingItemType;
	onToggle: (id: string) => void;
	onRemove: (id: string) => void;
}

const ShoppingItem = ({ item, onToggle, onRemove }: Props) => {
	return (
		<li className={`${styles.item} ${item.completed ? styles.completed : ''}`}>
			<label className={styles.label}>
				<input
					type="checkbox"
					className={styles.checkbox}
					checked={item.completed}
					onChange={() => onToggle(item.id)}
					aria-label={`Mark "${item.name}" as ${item.completed ? 'incomplete' : 'complete'}`}
				/>
				<span className={styles.name}>{item.name}</span>
			</label>
			<button
				type="button"
				className={styles.removeButton}
				onClick={() => onRemove(item.id)}
				aria-label={`Remove "${item.name}"`}
				title="Remove item"
			>
				✕
			</button>
		</li>
	);
};

export default ShoppingItem;
