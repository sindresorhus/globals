import * as fs from 'node:fs/promises';
import path from 'node:path';
import {readGlobals} from '../utilities.mjs';

const DATA_FILE = new URL('../globals.json', import.meta.url);
const DATA_DIRECTORY = new URL('../data/', import.meta.url);

async function getData() {
	const files = await fs.readdir(DATA_DIRECTORY);
	const environments = files.map(file => path.basename(file, '.mjs'))
		.sort((a, b) => a.localeCompare(b));
	const data = await Promise.all(
		environments.map(async environment => ({environment, globals: await readGlobals(environment)})),
	);

	return Object.fromEntries(data.map(({environment, globals}) => [environment, globals]));
}

const data = await getData();
await fs.writeFile(DATA_FILE, JSON.stringify(data, undefined, '\t') + '\n');
