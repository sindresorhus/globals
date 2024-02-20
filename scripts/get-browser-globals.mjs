import process from 'node:process';
import http from 'node:http';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import getPort from 'get-port';
import {updateGlobals, getGlobalThisProperties, createGlobals} from './utilities.mjs';

const ignore = [
	/^__/,

	// Chrome only
	/^[wW]eb[kK]it[A-Z]/,
	/^onwebkit/,
	'chrome',

	// Non-standard https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
	'BeforeInstallPromptEvent',
	// Deprecated https://developer.mozilla.org/en-US/docs/Web/API/Window/captureEvents
	'captureEvents',
	// Deprecated https://developer.mozilla.org/en-US/docs/Web/API/Window/releaseEvents
	'releaseEvents',
];

const missingProperties = [
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

async function downloadBrowser() {
	const {downloadBrowser} = await import('puppeteer/internal/node/install.js');
	const {PUPPETEER_SKIP_DOWNLOAD} = process.env;
	try {
		process.env.PUPPETEER_SKIP_DOWNLOAD = JSON.stringify(false);
		await downloadBrowser();
	} finally {
		process.env.PUPPETEER_SKIP_DOWNLOAD = PUPPETEER_SKIP_DOWNLOAD;
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

async function runInBrowser(function_, {secureContext = false} = {}) {
	await downloadBrowser();

	const browser = await puppeteer.launch();
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

const properties = await runInBrowser(getGlobalThisProperties, {secureContext: true});
const globals = await createGlobals(
	[
		...properties,
		...missingProperties,
	],
	{
		ignore,
		writeable: name => name === 'location' || name.startsWith('on'),
	},
);

await updateGlobals('browser', globals);
