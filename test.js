import test from 'ava';
import globals from '.';

test('main', t => {
	t.is(typeof globals, 'object');
	t.true(Object.keys(globals).length > 10 && Object.keys(globals).length < 1000);
});

test('ensure alphabetical order', t => {
	for (const env of Object.keys(globals)) {
		const keys = Object.keys(globals[env]);
		t.deepEqual(
			keys.slice(), keys.sort((a, b) => a.localeCompare(b)),
			`The \`${env}\` keys don't have the correct alphabetical order`
		);
	}
});

test('`node` is `nodeBuiltin` with CommonJS arguments', t => {
	// `globals.node` has `global`` which isn't a CommonJS argument and doesn't include
	// `__filename` and `__dirname` which are.
	const commonjsArgs = {
		__dirname: false,
		__filename: false,
		exports: true,
		module: false,
		require: false
	};

	t.deepEqual({...globals.nodeBuiltin, ...commonjsArgs}, globals.node);

	// Ensure that there's no overlap between true globals and the CommonJS arguments above.
	for (const builtin of Object.keys(globals.nodeBuiltin)) {
		t.is(
			commonjsArgs[builtin],
			undefined,
			`The builtin ${builtin} is not a CommonJS argument`
		);
	}
});
