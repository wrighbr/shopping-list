/** @type {import('jest').Config} */
export default {
	testEnvironment: 'jest-environment-jsdom',
	setupFiles: ['<rootDir>/src/testSetup.ts'],
	setupFilesAfterEnv: ['<rootDir>/src/testSetupAfterEnv.ts'],
	moduleNameMapper: {
		'\\.module\\.css$': 'identity-obj-proxy',
		'\\.css$': 'identity-obj-proxy',
	},
};
