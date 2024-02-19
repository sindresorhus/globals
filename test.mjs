import test from 'ava';
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

	const esVersions = ['es5', 'es2015', 'es2017', 'es2020', 'es2021'];
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
});
