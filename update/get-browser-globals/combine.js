'use strict';

const fs = require('fs');

const json = require('../../browser_vars.json');

const diff_array = function(oneObj, otherObj){
	const defaultKeys = Object.keys(oneObj);
	const yours = Object.keys(otherObj);

	return defaultKeys.filter(key => !yours.includes(key));
};

const browser = json['jshint'];
const my = json['my'];

const difference = diff_array(browser, my).reduce(name => `\n${name}: true,\n`, '');

fs.writeFileSync('./result_browser_vars.json', `{ "result": \n\t${JSON.stringify(difference, null, '\t\t')}`);

