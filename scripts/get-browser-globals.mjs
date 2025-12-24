import {launchBrowser} from './browser.mjs';
import {createGlobals} from './utilities.mjs';
import {startServer} from './browser/server.mjs';

const firefoxNonStandardGlobals = new Set([
	// Can't find documentation
	'Directory',
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/Window/dump
	'dump',
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/InternalError
	'InternalError',
	// https://bugzilla.mozilla.org/show_bug.cgi?id=1754441
	'InstallTrigger',
	// Can't find documentation
	'AnimationTrigger',
]);

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
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/Window/fullScreen
	'fullScreen',
	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/window/getDefaultComputedStyle
	'getDefaultComputedStyle',
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
	...firefoxNonStandardGlobals,
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

async function _getGlobalsInBrowser(environment, browserName) {
	const browser = await launchBrowser({browser: browserName});

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

async function getGlobalsInBrowser(environment) {
	const results = await Promise.all(
		['chrome', 'firefox'].map(browser => _getGlobalsInBrowser(environment, browser)),
	);
	return results.flat();
}

async function getBrowserGlobals() {
	const properties = await getGlobalsInBrowser('browser');

	return createGlobals(
		properties,
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
			shouldExclude: name => name.startsWith('__') || firefoxNonStandardGlobals.has(name),
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
			shouldExclude: name => name.startsWith('__') || firefoxNonStandardGlobals.has(name),
			isWritable: name => name.startsWith('on'),
		},
	);
}

async function getAudioWorkletGlobals() {
	const properties = await getGlobalsInBrowser('audioWorklet');
	return createGlobals(properties);
}

export {
	getBrowserGlobals,
	getWebWorkerGlobals,
	getServiceWorkerGlobals,
	getAudioWorkletGlobals,
};
