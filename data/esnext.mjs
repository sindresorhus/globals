// TODO[@fisker]: collect from MDN
import {mergeGlobals} from '../utilities.mjs';
import esBuiltinGlobals from './builtin.mjs';

export default mergeGlobals(esBuiltinGlobals, {
	Temporal: false,
});
