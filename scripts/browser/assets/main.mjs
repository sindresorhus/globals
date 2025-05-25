const EXECUTE_COMMAND_MARK = 'get-globals';

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

function getWebWorkerGlobals() {
	const worker = new Worker('./assets/web-worker.mjs', {type: 'module'});
	return new Promise(resolve => {
		worker.postMessage(EXECUTE_COMMAND_MARK);
		worker.onmessage = ({data}) => {
			resolve(data);
		};
	});
}

function initWebWorker() {
	globalThis.onmessage = ({data}) => {
		if (data !== EXECUTE_COMMAND_MARK) {
			return;
		}

		globalThis.postMessage(getGlobalThisProperties());
	};
}

async function getServiceWorkerGlobals() {
	const registration = await navigator.serviceWorker.register('./assets/service-worker.mjs', {type: 'module'});
	const serviceWorker = registration.active ?? registration.waiting ?? registration.installing;

	return new Promise(resolve => {
		navigator.serviceWorker.addEventListener('message', ({data}) => {
			resolve(data);
		});
		serviceWorker.postMessage(EXECUTE_COMMAND_MARK);
		navigator.serviceWorker.startMessages();
	});
}

async function initServiceWorker() {
	globalThis.onmessage = ({data, source}) => {
		if (data !== EXECUTE_COMMAND_MARK) {
			return;
		}

		source.postMessage(getGlobalThisProperties());
	};
}

async function getBrowserGlobals() {
	const globals = getGlobalThisProperties();
	const audioWorkletGlobals = await getAudioWorkletGlobals();
	return [...new Set([...globals, ...audioWorkletGlobals])];
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
				result.textContent = error.message;
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

async function getAudioWorkletGlobals() {
	const context = new AudioContext();
	await context.audioWorklet.addModule('./assets/audio-worklet.mjs');
	return new Promise(resolve => {
		const node = new AudioWorkletNode(context, 'execute-processor');
		node.port.onmessage = ({data}) => {
			resolve(data);
		};
	});
}

function initAudioWorklet() {
	registerProcessor('execute-processor', class extends AudioWorkletProcessor {
		constructor() {
			super();

			this.port.postMessage(getGlobalThisProperties({secureContext: false}));
		}

		process() {
			return true;
		}
	});
}

export {
	initPage,
	initWebWorker,
	initServiceWorker,
	initAudioWorklet,
};
