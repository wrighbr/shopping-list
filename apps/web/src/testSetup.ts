// Jest's bundled jsdom environment doesn't reliably implement
// `crypto.subtle` (SubtleCrypto) even though it provides `crypto.getRandomValues`,
// nor does it provide `TextEncoder`/`TextDecoder` as globals. `pkce.ts`
// (code_challenge generation) and `App.tsx` (`crypto.randomUUID`) rely on the
// full Web Crypto API, so polyfill both from Node's own implementations when
// needed.
import { webcrypto } from 'node:crypto';
import { TextDecoder, TextEncoder } from 'node:util';

if (!globalThis.crypto?.subtle) {
	Object.defineProperty(globalThis, 'crypto', {
		value: webcrypto,
		configurable: true,
	});
}

if (typeof globalThis.TextEncoder === 'undefined') {
	globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
	globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}
