import {mergeGlobals} from '../utilities.mjs';
import es2019Globals from './es2019.mjs';

export default mergeGlobals(es2019Globals, {
	BigInt: false,
	BigInt64Array: false,
	BigUint64Array: false,
	globalThis: false,
});
