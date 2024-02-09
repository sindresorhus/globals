import {expectType, expectError, expectAssignable} from 'tsd';
import {ReadonlyDeep} from 'type-fest';
import globals from '.';

expectAssignable<ReadonlyDeep<Record<string, Record<string, boolean>>>>(globals);
expectType<false>(globals.builtin.Array);
expectError((globals.builtin.Array = true));
