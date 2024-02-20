import {mergeGlobals} from '../utilities.mjs';
import es2017Globals from './es2017.mjs';

export default mergeGlobals(es2017Globals, {
	BigInt: false,
	BigInt64Array: false,
	BigUint64Array: false,
	globalThis: false,
});
