import vitest from '@vitest/eslint-plugin';

// https://github.com/vitest-dev/eslint-plugin-vitest/blob/main/src/index.ts#L269-L285
export default function getVitestGlobals() {
	return Object.fromEntries(Object.keys(vitest.environments.env.globals).map(name => [name, false]));
}
