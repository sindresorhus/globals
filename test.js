import test from 'ava';
import m from '.';

test(t => {
	t.is(typeof m, 'object');
	t.true(Object.keys(m).length > 10 && Object.keys(m).length < 1000);
});
