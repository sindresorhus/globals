import {updateGlobals, getGlobalThisProperties, createGlobals} from './utilities.mjs';

const ignore = [
	/^__/,
];

const commonjsGlobals = {
	exports: true,
	global: false,
	module: false,
	require: false,
};

const properties = getGlobalThisProperties();

const nodeBuiltinGlobals = await createGlobals(properties, {ignore});
await updateGlobals('nodeBuiltin', nodeBuiltinGlobals);
