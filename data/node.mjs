import {sortObject} from '../utilities.mjs';
import commonjsGlobals from './commonjs.mjs';
import nodeBuiltinGlobals from './nodeBuiltin.mjs';

export default sortObject({
	...nodeBuiltinGlobals,
	...commonjsGlobals,
	__dirname: false,
	__filename: false,
});

