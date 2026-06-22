'use strict';

const process = require('node:process');
const path = require('node:path');

const IS_CI = Boolean(process.env.CI);

// Will download when execute
module.exports = {
	// Workaround for https://github.com/puppeteer/puppeteer/pull/15130
	// Use `skipDownload: true`
	skipDownload: !IS_CI,
	cacheDirectory: IS_CI ? path.join(__dirname, '.cache/puppeteer/') : undefined,
};
