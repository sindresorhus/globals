import process from 'node:process';
import puppeteer from 'puppeteer';
import { readData, updateGlobals } from './utilities.mjs';

const ignorePatterns = [
	/^webkit/i,
	/^onwebkit/i,
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
	'values',
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
	'BatteryManager',
	'BudgetService',
	'Cache',
	'caches',
	'CacheStorage',
	'ClipboardItem',
	'createImageBitmap',
	'Credential',
	'CredentialsContainer',
	'CryptoKey',
	'defaultstatus',
	'defaultStatus',
	'DeviceMotionEvent',
	'DeviceOrientationEvent',
	'HTMLContentElement',
	'HTMLShadowElement',
	'KeyframeEffectReadOnly',
	'MediaDeviceInfo',
	'MediaDevices',
	'MediaKeyMessageEvent',
	'MediaKeySession',
	'MediaKeyStatusMap',
	'MediaKeySystemAccess',
	'MediaSettingsRange',
	'MediaStreamConstraints',
	'MessagePort',
	'MIDIAccess',
	'MIDIConnectionEvent',
	'MIDIInput',
	'MIDIInputMap',
	'MIDIMessageEvent',
	'MIDIOutput',
	'MIDIOutputMap',
	'MIDIPort',
	'NavigationPreloadManager',
	'ondevicemotion',
	'ondeviceorientation',
	'ondeviceorientationabsolute',
	'openDatabase',
	'PaymentAddress',
	'PaymentRequest',
	'PaymentResponse',
	'PhotoCapabilities',
	'Presentation',
	'PresentationAvailability',
	'PresentationConnection',
	'PresentationConnectionAvailableEvent',
	'PresentationConnectionCloseEvent',
	'PresentationConnectionList',
	'PresentationReceiver',
	'PresentationRequest',
	'registerProcessor',
	'RTCIceGatherer',
	'RTCRtpContributingSource',
	'ServiceWorker',
	'ServiceWorkerContainer',
	'ServiceWorkerRegistration',
	'StorageManager',
	'SubtleCrypto',
	'SVGDiscardElement',
	'XRAnchor',
	'XRBoundedReferenceSpace',
	'XRCPUDepthInformation',
	'XRDepthInformation',
	'XRFrame',
	'XRInputSource',
	'XRInputSourceArray',
	'XRInputSourceEvent',
	'XRInputSourcesChangeEvent',
	'XRPose',
	'XRReferenceSpace',
	'XRReferenceSpaceEvent',
	'XRRenderState',
	'XRRigidTransform',
	'XRSession',
	'XRSessionEvent',
	'XRSpace',
	'XRSystem',
	'XRView',
	'XRViewerPose',
	'XRViewport',
	'XRWebGLBinding',
	'XRWebGLDepthInformation',
	'XRWebGLLayer'
];

async function downloadBrowser() {
	const { downloadBrowser } = await import(
		'puppeteer/internal/node/install.js'
	);
	const PUPPETEER_SKIP_DOWNLOAD = process.env.PUPPETEER_SKIP_DOWNLOAD;
	try {
		process.env.PUPPETEER_SKIP_DOWNLOAD = JSON.stringify(false);
		await downloadBrowser();
	} finally {
		process.env.PUPPETEER_SKIP_DOWNLOAD = PUPPETEER_SKIP_DOWNLOAD;
	}
}

async function runInBrowser(function_) {
	await downloadBrowser();

	const browser = await puppeteer.launch();

	let result;

	try {
		const page = await browser.newPage();
		result = await page.evaluate(function_);
	} finally {
		await browser.close();
	}

	return result;
}

const properties = await runInBrowser(() => [
	...Object.getOwnPropertyNames(globalThis),
	...Object.getOwnPropertyNames(globalThis.EventTarget.prototype),
]);
const {builtin: builtinGlobals} = await readData();

const shouldIgnore = (name) =>
	Object.hasOwn(builtinGlobals, name) ||
	ignorePatterns.some((pattern) =>
		typeof pattern === 'string' ? pattern === name : pattern.test(name),
	);
const globals = Object.fromEntries(
	[...properties, ...missingProperties]
		.filter((name) => !shouldIgnore(name))
		.map((name) => [name, name === 'location' || name.startsWith('on')]),
);

await updateGlobals('browser', globals);
