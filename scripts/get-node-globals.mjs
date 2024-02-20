import {updateGlobals, getGlobalThisProperties, createGlobals} from './utilities.mjs';

const ignore = [
	/^__/,
];

const properties = getGlobalThisProperties();

const nodeBuiltinGlobals = await createGlobals(properties, {ignore});
await updateGlobals('nodeBuiltin', nodeBuiltinGlobals);
