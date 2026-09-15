import type { ShoppingItem as ShoppingItemType } from '../types';
import ShoppingItem from './ShoppingItem';
import styles from './ShoppingList.module.css';

interface Props {
	items: ShoppingItemType[];
	onToggle: (id: string) => void;
	onRemove: (id: string) => void;
}

const ShoppingList = ({ items, onToggle, onRemove }: Props) => {
	if (items.length === 0) {
		return (
			<p className={styles.empty}>Your list is empty. Add some items above!</p>
		);
	}

	return (
		<ul className={styles.list}>
			{items.map((item) => (
				<ShoppingItem
					key={item.id}
					item={item}
					onToggle={onToggle}
					onRemove={onRemove}
				/>
			))}
		</ul>
	);
};

export default ShoppingList;
