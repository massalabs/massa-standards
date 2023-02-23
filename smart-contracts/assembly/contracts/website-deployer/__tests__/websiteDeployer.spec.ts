import { Args } from '@massalabs/as-types';
import { Storage } from '@massalabs/massa-as-sdk';
import {
  appendBytesToWebsite,
  initializeWebsite,
  keyExpectedNbChunks,
} from '../websiteDeployer';

describe('website deployer tests', () => {
  test('initializeWebsite', () => {
    // execute
    const value: u64 = 52;

    initializeWebsite(new Args().add(value).serialize());
    // assert
    expect(Storage.get(keyExpectedNbChunks).nextU64().unwrap()).toBe(value);
  });

  test('append to website', () => {
    const chunkId = u64(5);
    const want = new Uint8Array(2);
    want.set([0, 1]);
    const MASSA_WEB_CHUNKS = `massa_web_${chunkId}`;
    const MASSA_WEB_CHUNKS_ARR = new Args().add(MASSA_WEB_CHUNKS).serialize();
    const argsAppend = new Args().add(chunkId).add(want).serialize();
    appendBytesToWebsite(argsAppend);
    const got = new Args(Storage.get(MASSA_WEB_CHUNKS_ARR)).nextUint8Array();
    expect(got.unwrap()).toStrictEqual(want);
  });
});
