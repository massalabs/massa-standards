import {
  Args,
  i32ToBytes,
  u64ToBytes,
  unwrapStaticArray,
} from '@massalabs/as-types';
import {
  Storage,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import {
  NB_CHUNKS_KEY,
  NONCE_KEY,
  appendBytesToWebsite,
  constructor,
  deleteWebsite,
} from '../websiteStorer';
import { isOwner } from '../../utils';

const user = 'AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';

describe('website deployer tests', () => {
  beforeAll(() => {
    resetStorage();
    setDeployContext(user);

    constructor([]);
  });

  test('owner is set', () => {
    expect(isOwner(new Args().add(user).serialize())).toBeTruthy();
  });

  throws('delete fails if website not created', () => {
    const chunkId = i32(0);
    const data = new Uint8Array(100);
    data.fill(0xf);
    deleteWebsite(new Args().add(chunkId).add(data).serialize());
  });

  test('upload a website', () => {
    const nbChunks = 20;

    for (let chunkId: i32 = 0; chunkId < nbChunks; chunkId++) {
      const data = new Uint8Array(100);
      data.fill(chunkId & 0xf);
      const argsAppend = new Args().add(chunkId).add(data).serialize();
      appendBytesToWebsite(argsAppend);

      expect(Storage.get(NB_CHUNKS_KEY)).toStrictEqual(i32ToBytes(chunkId + 1));
      expect(Storage.get(i32ToBytes(chunkId))).toStrictEqual(
        unwrapStaticArray(data),
      );
    }

    expect(Storage.get(NB_CHUNKS_KEY)).toStrictEqual(i32ToBytes(nbChunks));
    expect(Storage.get(NONCE_KEY)).toStrictEqual(u64ToBytes(0));
  });

  test('edit a website (upload missed chunks)', () => {
    const nbChunks = 15;
    for (let chunkId: i32 = 0; chunkId < nbChunks; chunkId++) {
      const data = new Uint8Array(100);
      data.fill(chunkId & 0xf);
      const argsAppend = new Args().add(chunkId).add(data).serialize();
      appendBytesToWebsite(argsAppend);

      expect(Storage.get(i32ToBytes(chunkId))).toStrictEqual(
        unwrapStaticArray(data),
      );
    }

    expect(Storage.get(NONCE_KEY)).toStrictEqual(u64ToBytes(0));
  });

  test('delete website', () => {
    deleteWebsite([]);
    expect(Storage.has(NB_CHUNKS_KEY)).toBeFalsy();
    const nbChunks = 20;
    for (let chunkId: i32 = 0; chunkId < nbChunks; chunkId++) {
      expect(Storage.has(i32ToBytes(chunkId))).toBeFalsy();
    }

    expect(Storage.get(NONCE_KEY)).toStrictEqual(u64ToBytes(1));
  });

  test('update website', () => {
    const nbChunks = 9;
    for (let chunkId: i32 = 0; chunkId < nbChunks; chunkId++) {
      const data = new Uint8Array(100);
      data.fill(chunkId & 0xf);
      const argsAppend = new Args().add(chunkId).add(data).serialize();
      appendBytesToWebsite(argsAppend);

      expect(Storage.get(NB_CHUNKS_KEY)).toStrictEqual(i32ToBytes(chunkId + 1));
      expect(Storage.get(i32ToBytes(chunkId))).toStrictEqual(
        unwrapStaticArray(data),
      );
    }

    expect(Storage.get(NB_CHUNKS_KEY)).toStrictEqual(i32ToBytes(nbChunks));
    expect(Storage.get(NONCE_KEY)).toStrictEqual(u64ToBytes(2));
  });
});
