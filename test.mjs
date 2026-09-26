import fs from 'node:fs/promises';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import isIdentifier from 'is-identifier';
import {DATA_DIRECTORY, readGlobals} from './utilities.mjs';
import globals from './index.js';

// Every environment is a table, so most assertions necessarily sit inside a loop.
// The per-item message names the offending environment, so the loops are kept.
/* eslint-disable node-test/no-conditional-assertion -- assertions are table-driven, one row per environment */

test('main', () => {
	assert.equal(typeof globals, 'object');

	const environmentCount = Object.keys(globals).length;
	assert.ok(environmentCount > 10);
	assert.ok(environmentCount < 1000);
});

test('ensure alphabetical order', () => {
	for (const [env, environmentGlobals] of Object.entries(globals)) {
		const keys = Object.keys(environmentGlobals);
		assert.deepEqual(
			keys,
			keys.toSorted((a, b) => a.localeCompare(b)),
			`The \`${env}\` keys don't have the correct alphabetical order`,
		);
	}
});

test('`node` is `nodeBuiltin` with CommonJS arguments', () => {
	// `globals.node` has `global`` which isn't a CommonJS argument and doesn't include
	// `__filename` and `__dirname` which are.
	const commonjsArguments = {
		__dirname: false,
		__filename: false,
		exports: true,
		module: false,
		require: false,
	};

	assert.deepEqual({...globals.nodeBuiltin, ...commonjsArguments}, globals.node);

	// Ensure that there's no overlap between true globals and the CommonJS arguments above.
	for (const builtin of Object.keys(globals.nodeBuiltin)) {
		assert.equal(
			commonjsArguments[builtin],
			undefined,
			`The builtin ${builtin} is not a CommonJS argument`,
		);
	}
});

test('should not contain builtins', () => {
	const builtins = new Set(Object.keys(globals.builtin));

	for (const [env, envGlobals] of Object.entries(globals)) {
		if (env === 'builtin' || /^es\d+$/v.test(env)) {
			continue;
		}

		const keys = Object.keys(envGlobals).filter(key => builtins.has(key));

		assert.deepEqual(
			keys,
			[],
			`The \`${env}\` keys should not contain builtins.`,
		);
	}
});

test('es versions', () => {
	const builtins = new Map(Object.entries(globals.builtin));

	const esVersions = Object.keys(globals)
		.filter(key => /^es(?:3|5|\d{4})$/v.test(key))
		.toSorted((versionA, versionB) => Number(versionA.slice(2)) - Number(versionB.slice(2)));

	let previousVersion;

	for (const esVersion of esVersions) {
		const data = globals[esVersion];
		for (const [key, value] of Object.entries(data)) {
			assert.ok(builtins.has(key), `The builtin '${key}' in '${esVersion}' is missing in 'builtin'.`);
			assert.equal(value, builtins.get(key), `Value of '${key}' should be the same as 'builtin'.`);
		}

		if (previousVersion) {
			assert.deepEqual(
				previousVersion.globals.filter(key => !Object.hasOwn(data, key)),
				[],
				`The builtins in '${previousVersion.esVersion}' are missing in '${esVersion}'.`,
			);
		}

		previousVersion = {esVersion, globals: Object.keys(globals[esVersion])};
	}

	const latestVersion = esVersions.at(-1);
	assert.deepEqual(globals[latestVersion], globals.builtin, `'${latestVersion}' should be the same as 'builtin'.`);
});

test('globals.json', async () => {
	const files = await fs.readdir(DATA_DIRECTORY);
	const environments = files.filter(filename => filename.endsWith('.mjs')).map(filename => filename.slice(0, -4));

	const jsData = Object.fromEntries(
		await Promise.all(environments.map(async environment => [environment, await readGlobals(environment)])),
	);

	assert.deepEqual(
		jsData,
		globals,
	);

	for (const [environment, data] of Object.entries(globals)) {
		assert.equal(environment.trim(), environment, `Unexpected space around environment key '${environment}'.`);

		for (const [name, value] of Object.entries(data)) {
			assert.equal(name.trim(), name, `Unexpected space around object name '${name}' in '${environment}'.`);
			assert.ok(
				isIdentifier(name) || isEsIdentifier(environment, name),
				`Object name '${name}' in '${environment}' is not a valid identifier.`,
			);
			assert.equal(typeof value, 'boolean', `Value of object '${name}' in '${environment}' should be a boolean.`);
		}
	}
});

function isEsIdentifier(environment, name) {
	return (
		(environment === 'builtin' || /^es(?:3|5|\d{4})$/v.test(environment))
		&& ['eval', 'globalThis', 'Infinity', 'NaN', 'undefined'].includes(name)
	);
}

/* eslint-enable node-test/no-conditional-assertion */
