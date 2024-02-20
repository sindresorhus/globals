import {mergeGlobals} from '../utilities.mjs';
import es5Globals from './es5.mjs';

export default mergeGlobals(es5Globals, {
	ArrayBuffer: false,
	DataView: false,
	Float32Array: false,
	Float64Array: false,
	Int16Array: false,
	Int32Array: false,
	Int8Array: false,
	Intl: false,
	Map: false,
	Promise: false,
	Proxy: false,
	Reflect: false,
	Set: false,
	Symbol: false,
	Uint16Array: false,
	Uint32Array: false,
	Uint8Array: false,
	Uint8ClampedArray: false,
	WeakMap: false,
	WeakSet: false,
});
