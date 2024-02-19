import {expectType, expectError, expectAssignable} from 'tsd';
import {type ReadonlyDeep} from 'type-fest';
import globals from './index.js';

expectAssignable<ReadonlyDeep<Record<string, Record<string, boolean>>>>(globals);
expectType<false>(globals.builtin.Array);
expectError((globals.builtin.Array = true));
