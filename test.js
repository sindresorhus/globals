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
