import {expectType, expectError} from 'tsd';
import {ReadonlyDeep} from 'type-fest';
import globals = require('.');

expectType<ReadonlyDeep<{[key: string]: {[key: string]: boolean}}>>(globals);
expectType<boolean>(globals.builtin.Array);
expectError((globals.builtin.Array = true));
