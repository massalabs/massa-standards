import { Args, stringToBytes } from '@massalabs/as-types';
import { callKey, main } from '../multicall';
import { Call, CallResult } from '../serializers/serializers';
import {
  setDeployContext,
  setOpData,
  mockScCall,
  resetStorage,
} from '@massalabs/massa-as-sdk';

describe('Multicall Contract Tests', () => {
  beforeAll(() => {
    setDeployContext();
  });

  beforeEach(() => {
    resetStorage();
  });

  test('should execute simple call', () => {
    // Create test calls
    const call = new Call(
      'contract1',
      'function1',
      100,
      stringToBytes('param1'),
    );
    // Serialize call and set it in storage
    setOpData(callKey(0), call.serialize());

    // Mock the call results
    const call1Result: StaticArray<u8> = [3, 3, 3];
    mockScCall(call1Result);

    // Execute multicall
    const res = main([]);

    const resArray = new Args(res)
      .nextSerializableObjectArray<CallResult>()
      .unwrap();
    expect(resArray.length).toBe(1);
    expect(resArray[0]).toStrictEqual(new CallResult(call1Result));
  });

  test('should execute multiple calls', () => {
    // Create test calls
    const calls: Call[] = [
      new Call('contract1', 'function1', 100, stringToBytes('param1')),
      new Call('contract2', 'function2', 200, stringToBytes('param2')),
    ];

    // Serialize calls and set them in storage
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      setOpData(callKey(i), call.serialize());
    }

    // Mock the call results
    const call1Result: StaticArray<u8> = [1, 2, 3];
    const call2Result: StaticArray<u8> = [4, 5, 6];
    mockScCall(call1Result);
    mockScCall(call2Result);

    // Execute multicall
    const res = main([]);

    const resArray = new Args(res)
      .nextSerializableObjectArray<CallResult>()
      .unwrap();
    expect(resArray.length).toBe(2);
    expect(resArray[0]).toStrictEqual(new CallResult(call1Result));
    expect(resArray[1]).toStrictEqual(new CallResult(call2Result));
  });

  test('should handle empty calls array', () => {
    const res = main(new StaticArray<u8>(0));
    expect(res).toStrictEqual([0, 0, 0, 0]);
  });
});
