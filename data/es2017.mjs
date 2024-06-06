import {mergeGlobals} from '../utilities.mjs';
import es2016Globals from './es2016.mjs';

export default mergeGlobals(es2016Globals, {
	Atomics: false,
	SharedArrayBuffer: false,
});
