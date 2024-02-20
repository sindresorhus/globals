import process from 'node:process';
import http from 'node:http';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import getPort from 'get-port';
import {getGlobalThisProperties, createGlobals} from './utilities.mjs';

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

const additionalGlobals = [
	'AnimationEffectReadOnly',
	'AnimationEffectTiming',
	'AnimationEffectTimingReadOnly',
	'applicationCache',
	'ApplicationCache',
	'ApplicationCacheErrorEvent',
	'AudioWorkletGlobalScope',
	'AudioWorkletProcessor',
	'BudgetService',
	'defaultstatus',
	'defaultStatus',
	'HTMLContentElement',
	'HTMLShadowElement',
	'KeyframeEffectReadOnly',
	'MediaSettingsRange',
	'MediaStreamConstraints',
	'openDatabase',
	'PhotoCapabilities',
	'registerProcessor',
	'RTCIceGatherer',
	'RTCRtpContributingSource',
	'SVGDiscardElement',
];

async function downloadBrowser({product} = {}) {
	const {downloadBrowser} = await import('puppeteer/internal/node/install.js');
	const {PUPPETEER_SKIP_DOWNLOAD, PUPPETEER_PRODUCT} = process.env;
	try {
		process.env.PUPPETEER_SKIP_DOWNLOAD = JSON.stringify(false);
		if (product) {
			process.env.PUPPETEER_PRODUCT = product;
		}

		await downloadBrowser();
	} finally {
		process.env.PUPPETEER_SKIP_DOWNLOAD = PUPPETEER_SKIP_DOWNLOAD;
		process.env.PUPPETEER_PRODUCT = PUPPETEER_PRODUCT;
	}
}

async function navigateToSecureContext(page) {
	const port = await getPort();
	const server = http.createServer((request, response) => {
		response.statusCode = 200;
		response.setHeader('Content-Type', 'text/plain');
		response.end('Hello World\n');
	});

	// https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts
	const hostname = '127.0.0.1';
	server.listen(port, hostname);

	const url = `http://${hostname}:${port}`;
	await page.goto(url);
	const isSecureContext = await page.evaluate(() => globalThis.isSecureContext);

	const close = () => new Promise(resolve => {
		server.close(resolve);
	});

	return {
		close,
		isSecureContext,
	};
}

async function runInBrowser(function_, {product, secureContext = false} = {}) {
	await downloadBrowser({product});

	const browser = await puppeteer.launch({product});
	const page = await browser.newPage();

	let server;
	try {
		if (secureContext) {
			server = await navigateToSecureContext(page);
			assert.ok(
				server.isSecureContext,
				'Expected a secure server.',
			);
		}

		return await page.evaluate(function_);
	} finally {
		await browser.close();
		await server?.close();
	}
}

export default async function getBrowserGlobals() {
	const chromeGlobals = await runInBrowser(getGlobalThisProperties, {secureContext: true});
	const firefoxGlobals = await runInBrowser(getGlobalThisProperties, {product: 'firefox', secureContext: true});

	return createGlobals(
		[
			...chromeGlobals,
			...firefoxGlobals,
			...additionalGlobals,
		],
		{
			shouldExclude,
			isWritable,
			excludeBuiltins: true,
		},
	);
}

