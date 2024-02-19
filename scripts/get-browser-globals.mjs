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

const overrides = {
	AnimationEffectReadOnly: false,
	AnimationEffectTiming: false,
	AnimationEffectTimingReadOnly: false,
	applicationCache: false,
	ApplicationCache: false,
	ApplicationCacheErrorEvent: false,
	AudioWorkletGlobalScope: false,
	AudioWorkletProcessor: false,
	BatteryManager: false,
	BudgetService: false,
	Cache: false,
	caches: false,
	CacheStorage: false,
	ClipboardItem: false,
	createImageBitmap: false,
	Credential: false,
	CredentialsContainer: false,
	CryptoKey: false,
	defaultstatus: false,
	defaultStatus: false,
	DeviceMotionEvent: false,
	DeviceOrientationEvent: false,
	HTMLContentElement: false,
	HTMLShadowElement: false,
	KeyframeEffectReadOnly: false,
	location: true,
	MediaDeviceInfo: false,
	MediaDevices: false,
	MediaKeyMessageEvent: false,
	MediaKeySession: false,
	MediaKeyStatusMap: false,
	MediaKeySystemAccess: false,
	MediaSettingsRange: false,
	MediaStreamConstraints: false,
	MessagePort: false,
	MIDIAccess: false,
	MIDIConnectionEvent: false,
	MIDIInput: false,
	MIDIInputMap: false,
	MIDIMessageEvent: false,
	MIDIOutput: false,
	MIDIOutputMap: false,
	MIDIPort: false,
	NavigationPreloadManager: false,
	ondevicemotion: true,
	ondeviceorientation: true,
	ondeviceorientationabsolute: true,
	openDatabase: false,
	PaymentAddress: false,
	PaymentRequest: false,
	PaymentResponse: false,
	PhotoCapabilities: false,
	Presentation: false,
	PresentationAvailability: false,
	PresentationConnection: false,
	PresentationConnectionAvailableEvent: false,
	PresentationConnectionCloseEvent: false,
	PresentationConnectionList: false,
	PresentationReceiver: false,
	PresentationRequest: false,
	registerProcessor: false,
	RTCIceGatherer: false,
	RTCRtpContributingSource: false,
	ServiceWorker: false,
	ServiceWorkerContainer: false,
	ServiceWorkerRegistration: false,
	StorageManager: false,
	SubtleCrypto: false,
	SVGDiscardElement: false,

	XRAnchor: false,
	XRBoundedReferenceSpace: false,
	XRCPUDepthInformation: false,
	XRDepthInformation: false,
	XRFrame: false,
	XRInputSource: false,
	XRInputSourceArray: false,
	XRInputSourceEvent: false,
	XRInputSourcesChangeEvent: false,
	XRPose: false,
	XRReferenceSpace: false,
	XRReferenceSpaceEvent: false,
	XRRenderState: false,
	XRRigidTransform: false,
	XRSession: false,
	XRSessionEvent: false,
	XRSpace: false,
	XRSystem: false,
	XRView: false,
	XRViewerPose: false,
	XRViewport: false,
	XRWebGLBinding: false,
	XRWebGLDepthInformation: false,
	XRWebGLLayer: false,
};

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
		await page.goto('about:blank');

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
const globals = {
	...Object.fromEntries(
		properties
			.filter((name) => !shouldIgnore(name))
			.map((name) => [name, name.startsWith('on')]),
	),
	...overrides,
};

await updateGlobals('browser', globals);
