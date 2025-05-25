const EXECUTE_COMMAND_SIGNAL = 'get-globals';

const environments = [
	{environment: 'browser', getGlobals: getBrowserGlobals},
	{environment: 'worker', getGlobals: getWebWorkerGlobals},
	{environment: 'serviceworker', getGlobals: getServiceWorkerGlobals},
];

function getGlobalThisProperties({secureContext = true} = {}) {
	if (secureContext && !globalThis.isSecureContext) {
		throw new Error('Expected a secure server.');
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
	port,
	receivePort = port,
	sendPort = receivePort,
	getGlobals = getGlobalThisProperties,
}) {
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
	sendResult({port: globalThis});
}

const SERVICE_WORK_URL = './assets/service-worker.mjs';
let serviceWorker;
async function getServiceWorkerGlobals() {
	const serviceWorkerContainer = navigator.serviceWorker;
	if (!serviceWorker) {
		let registration = await serviceWorkerContainer.getRegistration(SERVICE_WORK_URL);
		await registration?.unregister();
		registration = await serviceWorkerContainer.register(SERVICE_WORK_URL, {type: 'module'});
		serviceWorker = registration.active ?? registration.waiting ?? registration.installing;
		serviceWorkerContainer.startMessages();
	}

	return receiveResult({receivePort: serviceWorkerContainer, sendPort: serviceWorker});
}

async function initServiceWorker() {
	sendResult({
		receivePort: globalThis,
		sendPort: message => message.source,
	});
}

async function getBrowserGlobals() {
	const globals = getGlobalThisProperties();
	const audioWorkletGlobals = await getAudioWorkletGlobals();
	return [...new Set([...globals, ...audioWorkletGlobals])];
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
				getGlobals: () => getGlobalThisProperties({secureContext: false}),
			});
		}

		process() {
			return true;
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
	initAudioWorklet,
};
