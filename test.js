'use strict';
var assert = require('assert');
var globals = require('./');

it('should return an object of globals', function () {
	assert.strictEqual(typeof globals, 'object');
	var envNames = Object.keys(globals);
	assert(envNames.length > 10 && envNames.length < 1000);
	assert.ok(envNames.every(function (envName) {
		var env = globals[envName];
		var varNames = Object.keys(env);

		assert.ok(varNames.length > 0);

		return varNames.every(function (varName) {
			return typeof env[varName] === 'boolean';
		});
	}));
});
