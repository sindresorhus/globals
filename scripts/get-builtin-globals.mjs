import fs from 'node:fs/promises';
import * as cheerio from 'cheerio';

// https://tc39.es/ecma262/
const SPECIFICATION_URLS = [
	'https://raw.githubusercontent.com/tc39/ecma262/HEAD/spec.html',
	'https://cdn.jsdelivr.net/gh/tc39/ecma262/spec.html',
];
const CACHE_FILE = new URL('../.cache/spec.html', import.meta.url);

const additionalGlobals = [
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects#internationalization
	// https://www.ecma-international.org/publications-and-standards/standards/ecma-402/
	'Intl',

	// Annex B
	// https://tc39.es/ecma262/#sec-additional-built-in-properties
	'escape',
	'unescape',
];

const getText = async url => {
	const response = await fetch(url);
	const text = await response.text();
	return text;
};

const getSpecification = async () => {
	let stat;

	try {
		stat = await fs.stat(CACHE_FILE);
	} catch {}

	if (stat) {
		if (Date.now() - stat.ctimeMs < /* 10 hours */ 10 * 60 * 60 * 1000) {
			return fs.readFile(CACHE_FILE, 'utf8');
		}

		await fs.rm(CACHE_FILE);
	}

	const text = await Promise.any(SPECIFICATION_URLS.map(url => getText(url)));

	await fs.mkdir(new URL('./', CACHE_FILE), {recursive: true});
	await fs.writeFile(CACHE_FILE, text);

	return text;
};

function * getGlobalObjects(specification) {
	const $ = cheerio.load(specification);

	for (const element of $('emu-clause#sec-global-object > emu-clause h1')) {
		const property = $(element).text().trim().split(/\s/)[0];
		if (Object.hasOwn(globalThis, property)) {
			yield property;
		}
	}
}

export default async function getBuiltinGlobals() {
	const specification = await getSpecification();

	return Object.fromEntries(
		[
			...getGlobalObjects(specification),
			...additionalGlobals,
		].map(name => [name, false]),
	);
}
