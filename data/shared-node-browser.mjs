import {getIntersectionGlobals} from '../utilities.mjs';
import browserGlobals from './browser.mjs';
import nodeBuiltinGlobals from './nodeBuiltin.mjs';

export default getIntersectionGlobals(browserGlobals, nodeBuiltinGlobals);
