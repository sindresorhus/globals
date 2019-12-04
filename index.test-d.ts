import {expectType, expectError} from 'tsd';
import {ReadonlyDeep} from 'type-fest';
import globals = require('.');

expectType<ReadonlyDeep<{[key: string]: {[key: string]: boolean}}>>(globals);
expectType<boolean>(globals.es5.Array);
expectError((globals.es5.Array = true));
