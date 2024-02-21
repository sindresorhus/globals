import module from 'node:module';

// https://github.com/jest-community/eslint-plugin-jest/blob/main/src/globals.json
export default function getJestGlobals() {
	const require = module.createRequire(import.meta.url);
	const globals = require('eslint-plugin-jest/lib/globals.json');
	return globals;
}
