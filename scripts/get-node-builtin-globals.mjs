import {getGlobalThisProperties, createGlobals} from './utilities.mjs';

export default function getNodeBuiltinGlobals() {
	return createGlobals(
		getGlobalThisProperties(),
		{
			shouldExclude: name => name.startsWith('__'),
			excludeBuiltins: true,
		},
	);
}
