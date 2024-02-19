import fs from 'node:fs/promises';
import {outdent} from 'outdent';

const DATA_FILE = new URL('../globals.json', import.meta.url);

const sortObject = object =>
	Object.fromEntries(
		Object.entries(object).sort(([propertyA], [propertyB]) =>
			propertyA.localeCompare(propertyB),
		),
	);

const readData = async () => JSON.parse(await fs.readFile(DATA_FILE));

const writeData = async data => {
	await fs.writeFile(DATA_FILE, JSON.stringify(data, undefined, '\t') + '\n');
};

async function updateGlobals(property, updated) {
	const data = await readData();

	const original = data[property] ?? {};

	await writeData({...data, [property]: sortObject(updated)});

	const added = Object.keys(updated).filter(property => !Object.hasOwn(original, property));
	const removed = Object.keys(original).filter(property => !Object.hasOwn(updated, property));

	console.log(
		outdent`
			✅ ${property} globals updated.

			Added(${added.length}):
			${added.map(property => ` - ${property}`).join('\n') || 'None'}

			Removed(${removed.length}):
			${removed.map(property => ` - ${property}`).join('\n') || 'None'}
		`,
	);
}

/** This function runs in browser too, please keep it pure */
function getGlobalThisProperties() {
	const keys = [];

	for (let object = globalThis; object; object = Object.getPrototypeOf(object)) {
		keys.push(...Object.getOwnPropertyNames(object));
	}

	return keys;
}

function unique(array) {
	return [...new Set(array)];
}

async function createGlobals(globals, {
	ignore = [],
	writeable,
	ignoreBuiltins = true,
}) {
	if (ignoreBuiltins) {
		const {builtin: builtinGlobals} = await readData();
		ignore = [...ignore, ...Object.keys(builtinGlobals)];
	}

	globals = unique(globals);
	globals = globals.filter(name => !ignore.some(pattern => typeof pattern === 'string' ? pattern === name : pattern.test(name)));

	return Object.fromEntries(globals.map(name => [name, writeable?.(name) ?? false]));
}

export {
	readData, updateGlobals, getGlobalThisProperties, createGlobals,
};
