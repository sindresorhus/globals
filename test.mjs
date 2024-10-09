import fs from 'node:fs/promises';
import test from 'ava';
import {DATA_DIRECTORY, readGlobals} from './utilities.mjs';
import globals from './index.js';

test('main', t => {
	t.is(typeof globals, 'object');
	t.true(Object.keys(globals).length > 10 && Object.keys(globals).length < 1000);
});

test('ensure alphabetical order', t => {
	for (const env of Object.keys(globals)) {
		const keys = Object.keys(globals[env]);
		t.deepEqual(
			[...keys], keys.sort((a, b) => a.localeCompare(b)),
			`The \`${env}\` keys don't have the correct alphabetical order`,
		);
	}
});

test('`node` is `nodeBuiltin` with CommonJS arguments', t => {
	// `globals.node` has `global`` which isn't a CommonJS argument and doesn't include
	// `__filename` and `__dirname` which are.
	const commonjsArguments = {
		__dirname: false,
		__filename: false,
		exports: true,
		module: false,
		require: false,
	};

	t.deepEqual({...globals.nodeBuiltin, ...commonjsArguments}, globals.node);

	// Ensure that there's no overlap between true globals and the CommonJS arguments above.
	for (const builtin of Object.keys(globals.nodeBuiltin)) {
		t.is(
			commonjsArguments[builtin],
			undefined,
			`The builtin ${builtin} is not a CommonJS argument`,
		);
	}
});

test('should not contain builtins', t => {
	const builtins = new Set(Object.keys(globals.builtin));

	for (const [env, envGlobals] of Object.entries(globals)) {
		if (env === 'builtin' || /^es\d+$/.test(env)) {
			continue;
		}

		const keys = Object.keys(envGlobals).filter(key => builtins.has(key));

		t.deepEqual(
			keys,
			[],
			`The \`${env}\` keys should not contain builtins.`,
		);
	}
});

test('es versions', t => {
	const builtins = new Map(Object.entries(globals.builtin));

	const esVersions = Object.keys(globals)
		.filter(key => /^es(?:3|5|\d{4})$/.test(key))
		.sort((versionA, versionB) => Number(versionA.slice(2)) - Number(versionB.slice(2)));

	let previousVersion;

	for (const esVersion of esVersions) {
		const data = globals[esVersion];
		for (const [key, value] of Object.entries(data)) {
			t.true(builtins.has(key), `The builtin '${key}' in '${esVersion}' is missing in 'builtin'.`);
			t.is(value, builtins.get(key), `Value of '${key}' should be the same as 'builtin'.`);
		}

		if (previousVersion) {
			t.deepEqual(
				previousVersion.globals.filter(key => !Object.hasOwn(data, key)),
				[],
				`The builtins in '${previousVersion.esVersion}' are missing in '${esVersion}'.`,
			);
		}

		previousVersion = {esVersion, globals: Object.keys(globals[esVersion])};
	}

	const latestVersion = esVersions.at(-1);
	t.deepEqual(globals[latestVersion], globals.builtin, `'${latestVersion}' should be the same as 'builtin'.`);
});

test('globals.json', async t => {
	const files = await fs.readdir(DATA_DIRECTORY);
	const environments = files.filter(filename => filename.endsWith('.mjs')).map(filename => filename.slice(0, -4));

	const jsData = Object.fromEntries(
		await Promise.all(environments.map(async environment => [environment, await readGlobals(environment)])),
	);

	t.deepEqual(
		jsData,
		globals,
	);
});
