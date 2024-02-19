import process from 'node:process';
import puppeteer from 'puppeteer';
import {updateGlobals, getGlobalThisProperties, createGlobals} from './utilities.mjs';

const ignore = [
	/^__/,
];

const commonjsGlobals = {
	"exports": true,
	"global": false,
	"module": false,
	"require": false
};

const properties = getGlobalThisProperties();

const nodeBuiltinGlobals = await createGlobals(properties, {ignore});
await updateGlobals('nodeBuiltin', nodeBuiltinGlobals);

const nodejsGlobals = {
	...nodeBuiltinGlobals,
	...commonjsGlobals,
	'__dirname': false,
	'__filename': false,
};
await updateGlobals('node', nodejsGlobals);
