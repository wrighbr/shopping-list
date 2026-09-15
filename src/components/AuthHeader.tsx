import styles from './AuthHeader.module.css';

interface Props {
	email: string | null;
	onSignOut: () => void;
}

const AuthHeader = ({ email, onSignOut }: Props) => {
	return (
		<div className={styles.container}>
			<span className={styles.email}>{email ?? 'Signed in'}</span>
			<button className={styles.button} type="button" onClick={onSignOut}>
				Log out
			</button>
		</div>
	);
};

export default AuthHeader;
