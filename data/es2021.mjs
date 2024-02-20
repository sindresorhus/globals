import {mergeGlobals} from '../utilities.mjs';
import es2020Globals from './es2020.mjs';

export default mergeGlobals(es2020Globals, {
	AggregateError: false,
	FinalizationRegistry: false,
	WeakRef: false,
});
