'use strict';

// Will download when execute
module.exports = {
	skipDownload: true,
	chrome: {
		// Bug? `latest` version can't be launched
		// version: 'latest',
		skipDownload: false,
	},
	'chrome-headless-shell': {
		// version: 'latest',
		skipDownload: false,
	},
	firefox: {
		// version: 'latest',
		skipDownload: false,
	},
};
