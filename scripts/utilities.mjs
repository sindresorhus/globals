import fs from 'node:fs/promises';
import {outdent} from 'outdent'

const DATA_FILE = new URL('../globals.json', import.meta.url);

const sortObject = (object) =>
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
	let data = await readData();

	const original = data[property] ?? {};

	await writeData({ ...data, [property]: sortObject(updated) })

	const added = Object.keys(updated).filter((property) => !Object.hasOwn(original, property))
	const removed = Object.keys(original).filter((property) => !Object.hasOwn(updated, property));

	console.log(
		outdent`
			✅ ${property} globals updated.

			Added(${added.length}):
			${added.map((property) => ` - ${property}`).join('\n') || 'None'}

			Removed(${removed.length}):
			${removed.map((property) => ` - ${property}`).join('\n') || 'None'}
		`,
	);
}

export { readData, updateGlobals };
