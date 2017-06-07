'use strict';
const assert = require('assert');
const globals = require('.');

it('should return an object of globals', () => {
	assert.strictEqual(typeof globals, 'object');
	assert(Object.keys(globals).length > 10 && Object.keys(globals).length < 1000);
});
