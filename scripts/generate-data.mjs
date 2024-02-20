import * as fs from 'node:fs/promises';
import {readGlobals} from '../utilities.mjs';

const DATA_FILE = new URL('../globals.json', import.meta.url);

// List this to make sure we won't break `globals.json`
// use `fs.readdir` later
const environments = [
	'builtin',
	'es5',
	'es2015',
	'es2017',
	'es2020',
	'es2021',
	'browser',
	'worker',
	'node',
	'nodeBuiltin',
	'commonjs',
	'amd',
	'mocha',
	'jasmine',
	'jest',
	'qunit',
	'phantomjs',
	'couch',
	'rhino',
	'nashorn',
	'wsh',
	'jquery',
	'yui',
	'shelljs',
	'prototypejs',
	'meteor',
	'mongo',
	'applescript',
	'serviceworker',
	'atomtest',
	'embertest',
	'protractor',
	'shared-node-browser',
	'webextensions',
	'greasemonkey',
	'devtools',
];

async function getData() {
	const data = await Promise.all(
		environments.map(async environment => ({environment, globals: await readGlobals(environment)})),
	);

	return Object.fromEntries(data.map(({environment, globals}) => [environment, globals]));
}

const data = await getData();
await fs.writeFile(DATA_FILE, JSON.stringify(data, undefined, '\t') + '\n');
