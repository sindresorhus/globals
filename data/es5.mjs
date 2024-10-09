import {mergeGlobals} from '../utilities.mjs';
import es3Globals from './es3.mjs';

export default mergeGlobals(es3Globals, {
	JSON: false,
});
