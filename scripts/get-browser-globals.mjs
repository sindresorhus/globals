import process from 'node:process';
import puppeteer from 'puppeteer';
import {createGlobals} from './utilities.mjs';
import {startServer} from './browser/server.mjs';

const ignoredGlobals = new Set([
	// Chrome only
	'chrome',

	// Firefox only
	'netscape',
	'CSSMozDocumentRule',
	'mozInnerScreenX',
	'mozInnerScreenY',

	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
	'BeforeInstallPromptEvent',
	// Can't find documentation
	'CSS2Properties',
	// Deprecated https://developer.mozilla.org/en-US/docs/Web/API/Window/captureEvents
	'captureEvents',
	// Can't find documentation
	'Directory',
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/Window/dump
	'dump',
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/Window/fullScreen
	'fullScreen',
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/window/getDefaultComputedStyle
	'getDefaultComputedStyle',
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/InternalError
	'InternalError',
	// Can't find documentation
	'KeyEvent',
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/MouseScrollEvent
	'MouseScrollEvent',
	// Can't find documentation
	'PaintRequest',
	// Can't find documentation
	'PaintRequestList',
	// Can't find documentation
	'PopupBlockedEvent',
	// Deprecated https://developer.mozilla.org/en-US/docs/Web/API/Window/releaseEvents
	'releaseEvents',
	// Can't find documentation
	'ScrollAreaEvent',
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollByLines
	'scrollByLines',
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollByLines
	'scrollByLines',
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollByPages
	'scrollByPages',
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollMaxX
	'scrollMaxX',
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollMaxY
	'scrollMaxY',
	// Can't find documentation
	'setResizable',
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/Window/updateCommands
	'updateCommands',
]);

const shouldExclude = name =>
	name.startsWith('__')
	// Chrome only
	|| /^(?:webkit|WebKit)[A-Z]/.test(name)
	|| name.startsWith('onwebkit')
	// Firefox only
	|| name.startsWith('onmoz')
	|| ignoredGlobals.has(name);

const isWritable = name =>
	name === 'location'
	|| name.startsWith('on');

const puppeteerBrowsers = [
	'chrome',
	'chrome-headless-shell',
	'firefox',
];

async function downloadBrowser({product} = {}) {
	const {downloadBrowsers} = await import('puppeteer/internal/node/install.js');
	const originalEnv = {...process.env};

	const envOverrides = {
		PUPPETEER_SKIP_DOWNLOAD: JSON.stringify(false),
		...Object.fromEntries(puppeteerBrowsers.map(browser => [
			`PUPPETEER_${browser.replaceAll('-', '_').toUpperCase()}_SKIP_DOWNLOAD`,
			JSON.stringify(browser !== product),
		])),
	};

	Object.assign(process.env, envOverrides);

	try {
		await downloadBrowsers();
	} finally {
		for (const env of Object.keys(envOverrides)) {
			if (Object.hasOwn(originalEnv)) {
				process.env[env] = originalEnv[env];
			} else {
				delete process.env[env];
			}
		}
	}
}

async function getGlobalsInBrowser(environment, product = 'chrome') {
	await downloadBrowser({product});

	const browser = await puppeteer.launch({product});
	const page = await browser.newPage();

	let server;
	try {
		server = await startServer({silent: true});
		await page.goto(server.url);
		return await page.evaluate(`globalThis.__getGlobals(${JSON.stringify(environment)})`);
	} finally {
		await browser.close();
		await server?.close();
	}
}

async function getBrowserGlobals() {
	const chromeGlobals = await getGlobalsInBrowser('browser')
	const firefoxGlobals = await getGlobalsInBrowser('browser', 'firefox')

	return createGlobals(
		[
			...chromeGlobals,
			...firefoxGlobals,
		],
		{
			shouldExclude,
			isWritable,
		},
	);
}

async function getWebWorkerGlobals() {
	const properties = await getGlobalsInBrowser('worker');

	return createGlobals(
		properties,
		{
			shouldExclude: name => name.startsWith('__'),
			isWritable: name => name.startsWith('on'),
		},
	);
}

async function getServiceWorkerGlobals() {
	const properties = await getGlobalsInBrowser('serviceworker');

	return createGlobals(
		[
			// Only safari supported https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/pushsubscriptionchange_event#browser_compatibility
			'onpushsubscriptionchange',
			...properties,
		],
		{
			shouldExclude: name => name.startsWith('__'),
			isWritable: name => name.startsWith('on'),
		},
	);
}

export {getBrowserGlobals, getWebWorkerGlobals, getServiceWorkerGlobals};
