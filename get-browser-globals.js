'use strict';

const ignorePatterns = [
	/^webkit/i,
	'BeforeInstallPromptEvent',
	/^Bluetooth/,
	'CDATASection',
	'captureEvents',
	'InputDeviceCapabilities',
	'releaseEvents',
	'SyncManager',
	/^USB/,

	// DevTools globals
	'chrome',
	'$_',
	'$0',
	'$1',
	'$2',
	'$3',
	'$4',
	'$',
	'$$',
	'$x',
	'clear',
	'copy',
	'debug',
	'dir',
	'dirxml',
	'getEventListeners',
	'inspect',
	'keys',
	'monitor',
	'monitorEvents',
	'profile',
	'profileEnd',
	'queryObjects',
	'table',
	'undebug',
	'unmonitor',
	'unmonitorEvents',
	'values'
];

const globals = Object.getOwnPropertyNames(window)
	.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
	.filter(global => {
		for (const pattern of ignorePatterns) {
			if (typeof pattern === 'string') {
				if (global === pattern) {
					return false;
				}
			} else {
				if (pattern.test(global)) {
					return false;
				}
			}
		}

		return true;
	});

const ret = {};
for (const key of globals) {
	ret[key] = key.startsWith('on');
}

copy(JSON.stringify(ret, null, '\t'));

/*

Usage:
Open an Incognito window in Chrome Canary and paste the above into the console. You'll now have a new object in your clipboard for the `browser` field in `globals.json`. You still need to manually filter out items from the `builtin` list.

*/
