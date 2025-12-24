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

async function _launchBrowser({browser: browserName}) {
	const browser = await puppeteer.launch({
		browser: browserName,
		enableExtensions: false,
		waitForInitialPage: false,
	});

	try {
		const version = await browser.version();
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

async function launchBrowser({browser}) {
	try {
		return await _launchBrowser({browser});
	} catch {
		await downloadBrowser({browser});
		return _launchBrowser({browser});
	}
}

export {launchBrowser};
