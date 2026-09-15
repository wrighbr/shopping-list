import styles from './SignIn.module.css';

interface Props {
	onSignIn: () => void;
}

const SignIn = ({ onSignIn }: Props) => {
	return (
		<div className={styles.container}>
			<p className={styles.message}>Sign in to view your shopping list.</p>
			<button className={styles.button} type="button" onClick={onSignIn}>
				Sign in
			</button>
		</div>
	);
};

export default SignIn;
