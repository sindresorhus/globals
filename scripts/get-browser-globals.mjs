import process from 'node:process';
import http from 'node:http';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import getPort from 'get-port';
import {outdent} from 'outdent';
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

async function downloadBrowser({product} = {}) {
	const {downloadBrowser} = await import('puppeteer/internal/node/install.js');
	const originalEnv = {...process.env};
	try {
		process.env.PUPPETEER_SKIP_DOWNLOAD = JSON.stringify(false);
		if (product) {
			process.env.PUPPETEER_PRODUCT = product;
		}

		await downloadBrowser();
	} finally {
		for (const env of ['PUPPETEER_SKIP_DOWNLOAD', 'PUPPETEER_PRODUCT']) {
			if (Object.hasOwn(originalEnv)) {
				process.env[env] = originalEnv[env];
			} else {
				delete process.env[env];
			}
		}
	}
}

async function navigateToSecureContext(page, responses) {
	const port = await getPort();
	const server = http.createServer((request, response) => {
		const {url} = request;
		if (responses?.[url]) {
			const {contentType, content} = responses[url];
			response.statusCode = 200;
			response.setHeader('Content-Type', contentType);
			response.end(content);
			return;
		}

		if (url === '/') {
			response.statusCode = 200;
			response.setHeader('Content-Type', 'text/html');
			response.end('');
		}

		response.statusCode = 404;
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

async function runInBrowser(function_, {
	product,
	secureContext = false,
	arguments: arguments_ = [],
} = {}) {
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

		return await page.evaluate(function_, arguments_);
	} finally {
		await browser.close();
		await server?.close();
	}
}

async function runInAudioWorklet(function_) {
	const workletCode = outdent`
		registerProcessor('execute-processor', class extends AudioWorkletProcessor {
			constructor() {
				super();

				this.port.postMessage(${function_}());
			}
			process() {
				return true;
			}
		});
	`;

	return runInBrowser(async workletCode => {
		// eslint-disable-next-line no-undef -- execute in browser
		const context = new AudioContext();
		const workletUrl = URL.createObjectURL(new Blob([workletCode], {type: 'application/javascript'}));
		await context.audioWorklet.addModule(workletUrl);
		URL.revokeObjectURL(workletUrl);
		return new Promise(resolve => {
			// eslint-disable-next-line no-undef -- execute in browser
			const node = new AudioWorkletNode(context, 'execute-processor');
			// eslint-disable-next-line unicorn/prefer-add-event-listener -- not working
			node.port.onmessage = ({data}) => {
				resolve(data);
			};
		});
	}, {
		secureContext: true,
		arguments: [workletCode],
	});
}

async function runInWebWorker(function_) {
	await downloadBrowser();

	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	let server;
	let worker;
	try {
		server = await navigateToSecureContext(page);
		assert.ok(
			server.isSecureContext,
			'Expected a secure server.',
		);

		worker = await new Promise(resolve => {
			page.on('workercreated', worker => {
				resolve(worker);
			});
			// eslint-disable-next-line no-undef -- execute in browser
			page.evaluate(() => new Worker('data:application/javascript,;'));
		});

		assert.ok(
			await worker.evaluate(() => globalThis.isSecureContext),
			'Expected a secure worker.',
		);

		return await worker.evaluate(function_);
	} finally {
		await worker?.close();
		await browser.close();
		await server?.close();
	}
}

async function getBrowserGlobals() {
	const chromeGlobals = await runInBrowser(getGlobalThisProperties, {secureContext: true});
	const firefoxGlobals = await runInBrowser(getGlobalThisProperties, {product: 'firefox', secureContext: true});
	const audioWorkletGlobals = await runInAudioWorklet(getGlobalThisProperties);

	return createGlobals(
		[
			...chromeGlobals,
			...firefoxGlobals,
			...audioWorkletGlobals,
		],
		{
			shouldExclude,
			isWritable,
			excludeBuiltins: true,
		},
	);
}

async function getWebWorkerGlobals() {
	const properties = await runInWebWorker(getGlobalThisProperties);

	return createGlobals(
		properties,
		{
			shouldExclude: name => name.startsWith('__'),
			isWritable: name => name.startsWith('on'),
			excludeBuiltins: true,
		},
	);
}

export {getBrowserGlobals, getWebWorkerGlobals};
