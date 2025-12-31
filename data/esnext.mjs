// TODO[@fisker]: collect from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
import {mergeGlobals} from '../utilities.mjs';
import esBuiltinGlobals from './builtin.mjs';

export default mergeGlobals(esBuiltinGlobals, {
	Temporal: false,
});
