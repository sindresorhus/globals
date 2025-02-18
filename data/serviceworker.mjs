import {mergeGlobals} from '../utilities.mjs';
import workerGlobals from './worker.mjs';

// https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope
export default mergeGlobals(workerGlobals, {
	applicationCache: false,
	Client: false,
	clients: false,
	Clients: false,
	ExtendableEvent: false,
	ExtendableMessageEvent: false,
	FetchEvent: false,
	InstallEvent: false,
	NotificationEvent: false,
	onactivate: true,
	onclose: true,
	onfetch: true,
	oninstall: true,
	onnotificationclick: true,
	onnotificationclose: true,
	onpush: true,
	onpushsubscriptionchange: true,
	onsync: true,
	PushEvent: true,
	registration: false,
	serviceWorker: false,
	ServiceWorker: false,
	ServiceWorkerContainer: false,
	ServiceWorkerGlobalScope: false,
	ServiceWorkerMessageEvent: false,
	skipWaiting: false,
	SyncEvent: true,
	WindowClient: false,

	// Missing from https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope
	// Ex: https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/offline_event
	onoffline: true,
	ononline: true,
	onsecuritypolicyviolation: true,
});
