import {mergeGlobals} from '../utilities.mjs';
import es2015Globals from './es2015.mjs';

export default mergeGlobals(es2015Globals, {
	Atomics: false,
	SharedArrayBuffer: false,
});
