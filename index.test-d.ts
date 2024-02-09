import {expectType, expectError} from 'tsd';
import {ReadonlyDeep} from 'type-fest';
import globals from './index.js';

expectType<ReadonlyDeep<Record<string, Record<string, boolean>>>>(globals);
expectType<boolean>(globals.builtin.Array);
expectError((globals.builtin.Array = true));
