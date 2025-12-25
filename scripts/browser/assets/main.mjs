const EXECUTE_COMMAND_SIGNAL = 'get-globals';

const environments = [
	{environment: 'browser', getGlobals: getGlobalThisProperties},
	{environment: 'worker', getGlobals: getWebWorkerGlobals},
	{environment: 'serviceworker', getGlobals: getServiceWorkerGlobals},
	{environment: 'sharedWorker', getGlobals: getSharedWorkerGlobals},
	{environment: 'audioWorklet', getGlobals: getAudioWorkletGlobals},
	{environment: 'paintWorklet', getGlobals: getPaintWorkletGlobals},
];

function getGlobalThisProperties({expectSecureContext = true} = {}) {
	if (expectSecureContext && !globalThis.isSecureContext) {
		throw new Error('Expected a secure context.');
	}

	const keys = [];

	for (
		let object = globalThis;
		object && object !== Object.prototype;
		object = Object.getPrototypeOf(object)
	) {
		keys.push(...Object.getOwnPropertyNames(object));
	}

	return keys.filter(key => key !== 'constructor');
}

function sendResult({
	port = globalThis,
	receivePort = port,
	sendPort = receivePort,
	getGlobals = getGlobalThisProperties,
} = {}) {
	receivePort.onmessage = receivedMessage => {
		if (receivedMessage.data !== EXECUTE_COMMAND_SIGNAL) {
			return;
		}

		const message = {};
		try {
			message.result = getGlobals();
		} catch (error) {
			message.error = error;
			throw error;
		} finally {
			const port = typeof	sendPort === 'function' ? sendPort(receivedMessage) : sendPort;
			port.postMessage(message);
		}
	};
}

function receiveResult({
	port,
	receivePort = port,
	sendPort = receivePort,
}) {
	return new Promise((resolve, reject) => {
		receivePort.onmessage = ({data: {result, error}}) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		};

		sendPort.postMessage(EXECUTE_COMMAND_SIGNAL);
	});
}

let webWorker;
function getWebWorkerGlobals() {
	webWorker ??= new Worker('./assets/web-worker.mjs', {type: 'module'});
	return receiveResult({port: webWorker});
}

function initWebWorker() {
	sendResult();
}

const SERVICE_WORK_URL = './assets/service-worker.mjs';
let serviceWorker;
async function getServiceWorkerGlobals() {
	const serviceWorkerContainer = navigator.serviceWorker;
	if (!serviceWorker) {
		let registration = await serviceWorkerContainer.getRegistration(SERVICE_WORK_URL);
		if (registration) {
			await registration.update();
		} else {
			registration = await serviceWorkerContainer.register(SERVICE_WORK_URL, {type: 'module'});
		}

		serviceWorker = registration.active ?? registration.waiting ?? registration.installing;
		serviceWorkerContainer.startMessages();
	}

	return receiveResult({receivePort: serviceWorkerContainer, sendPort: serviceWorker});
}

function initServiceWorker() {
	sendResult({
		sendPort: message => message.source,
	});
}

let sharedWorker;
function getSharedWorkerGlobals() {
	sharedWorker ??= new SharedWorker('./assets/shared-worker.mjs', {type: 'module'});
	return receiveResult({port: sharedWorker.port});
}

function initSharedWorker() {
	globalThis.onconnect = ({ports: [port]}) => {
		sendResult({port});
	};
}

const AUDIO_WORKLET_PROCESSOR_NAME = `${EXECUTE_COMMAND_SIGNAL}-processor`;
let audioWorkletNode;
async function getAudioWorkletGlobals() {
	if (!audioWorkletNode) {
		const context = new AudioContext();
		await context.audioWorklet.addModule('./assets/audio-worklet.mjs');
		audioWorkletNode = new AudioWorkletNode(context, AUDIO_WORKLET_PROCESSOR_NAME);
	}

	return receiveResult({port: audioWorkletNode.port});
}

function initAudioWorklet() {
	registerProcessor(AUDIO_WORKLET_PROCESSOR_NAME, class AudioWorkletGetGlobalsProcessor extends AudioWorkletProcessor {
		constructor() {
			super();

			sendResult({
				port: this.port,
				getGlobals: () => getGlobalThisProperties({expectSecureContext: false}),
			});
		}

		process() {
			return true;
		}
	});
}

const PAINT_WORKLET_PAINT_NAME = `${EXECUTE_COMMAND_SIGNAL}-paint`;
function getPaintWorkletGlobals() {
	CSS.paintWorklet.addModule('./assets/paint-worklet.mjs');
	Object.assign(document.body.style, {
		backgroundImage: `paint(${PAINT_WORKLET_PAINT_NAME})`,
	});
	alert('Open console to see the collected globals.')
}

function initPaintWorklet() {
	registerPaint(PAINT_WORKLET_PAINT_NAME, class PaintWorkletGetGlobalsPaint {
		paint(context, geom, properties) {
			console.log({
				paintWorkletGlobals: getGlobalThisProperties({expectSecureContext: false}),
			});
		}
	});
}

function initPage() {
	// Exposed for Node.js to call
	Object.defineProperty(globalThis, '__getGlobals', {
		enumerable: false,
		value(environment) {
			return environments.find(({environment: name}) => name === environment).getGlobals();
		},
	});

	const mainContainer = document.body;

	for (const {environment, getGlobals} of environments) {
		const container = document.createElement('details');
		const summary = Object.assign(document.createElement('summary'), {
			textContent: environment,
		});
		const button = Object.assign(document.createElement('button'), {
			type: 'button',
			textContent: `Get '${environment}' globals`,
		});
		const result = document.createElement('pre');
		button.addEventListener('click', async () => {
			container.open = true;
			button.disabled = true;
			result.textContent = `Loading '${environment}' globals ...`;
			try {
				const globals = await getGlobals();
				result.textContent = JSON.stringify(globals, undefined, 2);
			} catch (error) {
				result.textContent = error;
			} finally {
				button.disabled = false;
			}
		});

		container.append(summary);
		container.append(button);
		container.append(result);
		mainContainer.append(container);
	}
}

export {
	initPage,
	initWebWorker,
	initServiceWorker,
	initSharedWorker,
	initAudioWorklet,
	initPaintWorklet,
};
