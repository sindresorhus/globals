import process from 'node:process';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const puppeteerBrowsers = ['chrome', 'chrome-headless-shell', 'firefox'];

async function _downloadBrowser({browser}) {
	const {downloadBrowsers} = await import('puppeteer/internal/node/install.js');
	const originalEnv = {...process.env};

	const envOverrides = {
		PUPPETEER_SKIP_DOWNLOAD: JSON.stringify(false),
		...Object.fromEntries(
			puppeteerBrowsers.map(name => [
				`PUPPETEER_${name.replaceAll('-', '_').toUpperCase()}_SKIP_DOWNLOAD`,
				JSON.stringify(name !== browser),
			]),
		),
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

const browserInstallPromises = new Map();
function downloadBrowser({browser}) {
	if (!browserInstallPromises.has(browser)) {
		browserInstallPromises.set(browser, _downloadBrowser({browser}));
	}

	return browserInstallPromises.get(browser);
}

async function _launchBrowser(options) {
	const browser = await puppeteer.launch({
		headless: true,
		enableExtensions: false,
		waitForInitialPage: false,
		...options,
	});

	try {
		const version = await browser.version();
		const browserName = options.browser;
		assert.ok(
			version.toLowerCase().startsWith(`${browserName}/`),
			`Unexpected browser version: '${version}', expected '${browserName}'.`,
		);
	} catch (error) {
		await browser.close();
		throw error;
	}

	return browser;
}

async function launchBrowser(options) {
	try {
		return await _launchBrowser(options);
	} catch {
		await downloadBrowser(options);
		return _launchBrowser(options);
	}
}

async function getDevtoolsPanelOutput(target) {
	const page = await target.page();
	return page.evaluate(async () => {
		globalThis.DevToolsAPI.showPanel('console');

		function waitFor(condition) {
			// eslint-disable-next-line no-use-extend-native/no-use-extend-native, n/no-unsupported-features/es-syntax
			const {promise, resolve} = Promise.withResolvers();
			const check = () => {
				const result = condition();
				if (result) {
					resolve(result);
				} else {
					setTimeout(check, 100);
				}
			};

			check();

			return promise;
		}

		const consolePanel = await waitFor(() => globalThis.UI?.panels?.console);
		const {element} = consolePanel;
		return Array.from(element.querySelectorAll('.console-message-text'), element => element.textContent);
	});
}

export {launchBrowser, getDevtoolsPanelOutput};
