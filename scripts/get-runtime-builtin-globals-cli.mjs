import {getGlobalThisProperties, createGlobals} from './utilities.mjs';

// eslint-disable-next-line n/prefer-global/process
const argv = process.argv.slice(2);

if (argv[0] !== '--runtime') {
	throw new Error('Unexpected arguments');
}

const runtime = argv[1];

switch (runtime) {
	case 'node.js': {
		if (globalThis.Bun || globalThis.Deno) {
			throw new Error('Unexpected error');
		}

		break;
	}

	case 'bun': {
		if (!globalThis.Bun) {
			throw new Error('Unexpected error');
		}

		break;
	}

	case 'deno': {
		if (!globalThis.Deno) {
			throw new Error('Unexpected error');
		}

		break;
	}

	default: {
		throw new Error('Unexpected runtime argument.');
	}
}

function getRuntimeBuiltinGlobals() {
	return createGlobals(
		getGlobalThisProperties(),
		{
			shouldExclude: name => name.startsWith('__'),
		},
	);
}

console.log(JSON.stringify(await getRuntimeBuiltinGlobals()));
