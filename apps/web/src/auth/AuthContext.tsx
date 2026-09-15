import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';
import {
	getValidTokens,
	handleAuthCallback,
	logout as logoutRequest,
	startLogin,
} from './authClient';
import { decodeIdTokenClaims } from './jwt';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
	status: AuthStatus;
	email: string | null;
	login: () => void;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [status, setStatus] = useState<AuthStatus>('loading');
	const [email, setEmail] = useState<string | null>(null);
	// Guards against React StrictMode's dev-only double-invocation of effects,
	// which would otherwise attempt the one-time OAuth code exchange twice.
	const hasInitialized = useRef(false);

	useEffect(() => {
		if (hasInitialized.current) return;
		hasInitialized.current = true;

		const applyTokens = (idToken: string) => {
			const claims = decodeIdTokenClaims(idToken);
			setEmail(claims?.email ?? claims?.sub ?? null);
			setStatus('authenticated');
		};

		const init = async () => {
			if (new URLSearchParams(window.location.search).has('code')) {
				try {
					const tokens = await handleAuthCallback();
					if (tokens) {
						applyTokens(tokens.idToken);
						return;
					}
				} catch (error) {
					console.error('OAuth callback failed:', error);
				}
				setStatus('unauthenticated');
				return;
			}

			const tokens = getValidTokens();
			if (tokens) {
				applyTokens(tokens.idToken);
			} else {
				setStatus('unauthenticated');
			}
		};

		init();
	}, []);

	const login = useCallback(() => {
		startLogin();
	}, []);

	const logout = useCallback(() => {
		logoutRequest();
	}, []);

	return (
		<AuthContext.Provider value={{ status, email, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = (): AuthContextValue => {
	const context = useContext(AuthContext);
	if (!context) throw new Error('useAuth must be used within an AuthProvider');
	return context;
};
