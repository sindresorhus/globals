'use strict';

const process = require('node:process');
const path = require('node:path');

const IS_CI = Boolean(process.env.CI);

// Will download when execute
module.exports = {
	skipDownload: true,
	cacheDirectory: IS_CI ? path.join(__dirname, '.cache/puppeteer/') : undefined,
};
