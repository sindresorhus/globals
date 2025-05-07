import {mergeGlobals} from '../utilities.mjs';
import es2024Globals from './es2024.mjs';

export default mergeGlobals(es2024Globals, {
	Float16Array: false,
	Iterator: false,
});
