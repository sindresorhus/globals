import fs from 'node:fs/promises';
import {outdent} from 'outdent';
import {
	DATA_DIRECTORY, unique, sortObject, readGlobals,
} from '../utilities.mjs';

const writeGlobals = async (environment, globals) => {
	const file = new URL(`${environment}.mjs`, DATA_DIRECTORY);

	const code = outdent`
		// This file is autogenerated by scripts
		// Do NOT modify this file manually

		export default ${JSON.stringify(sortObject(globals), undefined, '\t')};
	`;
	await fs.writeFile(file, code + '\n');
};

async function updateGlobals({environment, getGlobals, dry}) {
	const updated = await getGlobals();
	const original = await readGlobals(environment, {ignoreNonExits: true});

	if (!dry) {
		await writeGlobals(environment, updated);
	}

	const added = Object.keys(updated).filter(property => !Object.hasOwn(original, property));
	const removed = Object.keys(original).filter(property => !Object.hasOwn(updated, property));

	return {
		added,
		removed,
	};
}

/** This function runs in browser too, please keep it pure */
function getGlobalThisProperties() {
	const keys = [];

	for (let object = globalThis; object; object = Object.getPrototypeOf(object)) {
		keys.push(...Object.getOwnPropertyNames(object));
	}

	return keys;
}

async function createGlobals(names, {
	shouldExclude,
	isWritable = () => false,
	excludeBuiltins,
}) {
	names = unique(names);

	if (shouldExclude) {
		names = names.filter(name => !shouldExclude(name));
	}

	if (excludeBuiltins) {
		const builtinGlobals = new Set(Object.keys(await readGlobals('builtin')));

		names = names.filter(name => !builtinGlobals.has(name));
	}

	return Object.fromEntries(names.map(name => [name, isWritable(name) ?? false]));
}

export {

	updateGlobals,
	getGlobalThisProperties,
	createGlobals,
};
export {readGlobals} from '../utilities.mjs';
