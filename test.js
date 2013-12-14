'use strict';
var assert = require('assert');
var globals = require('./globals');

it('should return an object of globals', function () {
	assert.strictEqual(typeof globals, 'object');
	assert(Object.keys(globals).length > 10 && Object.keys(globals).length < 1000);
});
