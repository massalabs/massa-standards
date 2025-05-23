import { Args, i32ToBytes, stringToBytes } from '@massalabs/as-types';
import { getOpData, hasOpKey, env } from '@massalabs/massa-as-sdk';
import { Call, CallResult } from './serializers/serializers';

export function main(_: StaticArray<u8>): StaticArray<u8> {
  const calls = deserializeCalls();
  const results: CallResult[] = [];
  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];
    const res = env.env.call(
      call.contract,
      call.targetFunc,
      call.params,
      call.coins,
    );
    results.push(new CallResult(res));
  }
  return new Args().addSerializableObjectArray(results).serialize();
}

const CALL_PREFIX = stringToBytes('C_');

export function callKey(index: i32): StaticArray<u8> {
  return CALL_PREFIX.concat(i32ToBytes(index));
}

function deserializeCalls(): Call[] {
  const calls: Call[] = [];

  let i: i32 = 0;
  while (true) {
    const key = callKey(i);
    if (!hasOpKey(key)) {
      return calls;
    }
    const call = new Call();
    call.deserialize(getOpData(key));
    calls.push(call);
    ++i;
  }
}
