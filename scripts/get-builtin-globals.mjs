import fs from 'node:fs/promises';
import * as cheerio from 'cheerio';
import {updateGlobals} from './utilities.mjs';

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

const any = async asyncFunctions => {
	const errors = [];
	for (const function_ of asyncFunctions) {
		try {
			// eslint-disable-next-line no-await-in-loop
			return await function_();
		} catch (error) {
			errors.push(error);
		}
	}

	throw new AggregateError(errors, 'All failed.');
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

	const text = await any(SPECIFICATION_URLS.map(url => () => getText(url)));

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

function * getObjectProperties(specification) {
	const $ = cheerio.load(specification);

	for (const element of $('emu-clause#sec-properties-of-the-object-prototype-object > emu-clause > h1')) {
		const text = $(element).text().trim();
		if (!text.startsWith('Object.prototype.')) {
			continue;
		}

		const property = text.split(/\s/)[0].slice('Object.prototype.'.length);
		// `Object.prototype.{__proto__, ..}`
		if (property.startsWith('_')) {
			continue;
		}

		if (Object.hasOwn(Object.prototype, property)) {
			yield property;
		}
	}
}

const specification = await getSpecification();
const builtinGlobals = Object.fromEntries(
	[
		...getGlobalObjects(specification),
		// `globalThis` is an object
		...getObjectProperties(specification),
		...additionalGlobals,
	]
		.map(property => [property, false]),
);

await updateGlobals('builtin', builtinGlobals);
