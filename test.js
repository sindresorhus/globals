import test from 'ava';
import m from '.';

test('main', t => {
	t.is(typeof m, 'object');
	t.true(Object.keys(m).length > 10 && Object.keys(m).length < 1000);
});

test('ensure alphabetical order', t => {
	for (const env of Object.keys(m)) {
		const keys = Object.keys(m[env]);
		t.deepEqual(keys.slice(), keys.sort((a, b) => a.localeCompare(b)), `The \`${env}\` keys don't have the correct alphabetical order`);
	}
});

test('node is nodeBuiltin with commonjs arguments', t => {
	// M.commonjs has global which isn't a commonjs argument and doesn't include
	// __filename and __dirname which are.
	const commonjsArgs = {
		__dirname: false,
		__filename: false,
		exports: true,
		module: false,
		require: false
	};

	t.deepEqual({...m.nodeBuiltin, ...commonjsArgs}, m.node);

	// Ensure that there's no overlap between true globals and the CommonJS arguments above.
	for (const builtin of Object.keys(m.nodeBuiltin)) {
		t.true(
			commonjsArgs[builtin] === undefined,
			`The builtin ${builtin} is not a CommonJS argument`
		);
	}
});
