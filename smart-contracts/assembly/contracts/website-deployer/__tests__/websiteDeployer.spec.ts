import { Args, i32ToBytes, unwrapStaticArray } from '@massalabs/as-types';
import {
  Storage,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import {
  FIRST_CREATION_DATE,
  LAST_UPDATE_TIMESTAMP,
  NB_CHUNKS,
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

  test('first creation date is set', () => {
    expect(FIRST_CREATION_DATE.mustValue());
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

      expect(NB_CHUNKS.mustValue()).toStrictEqual(chunkId + 1);
      expect(Storage.get(i32ToBytes(chunkId))).toStrictEqual(
        unwrapStaticArray(data),
      );
    }

    expect(NB_CHUNKS.mustValue()).toStrictEqual(nbChunks);
    LAST_UPDATE_TIMESTAMP.mustValue();
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
    LAST_UPDATE_TIMESTAMP.mustValue();
  });

  test('delete website', () => {
    deleteWebsite([]);
    expect(NB_CHUNKS.tryValue().isErr()).toBeTruthy();
    const nbChunks = 20;
    for (let chunkId: i32 = 0; chunkId < nbChunks; chunkId++) {
      expect(Storage.has(i32ToBytes(chunkId))).toBeFalsy();
    }
    expect(LAST_UPDATE_TIMESTAMP.tryValue().isErr()).toBeTruthy();
  });

  test('update website', () => {
    const nbChunks = 9;
    for (let chunkId: i32 = 0; chunkId < nbChunks; chunkId++) {
      const data = new Uint8Array(100);
      data.fill(chunkId & 0xf);
      const argsAppend = new Args().add(chunkId).add(data).serialize();
      appendBytesToWebsite(argsAppend);

      expect(NB_CHUNKS.mustValue()).toStrictEqual(chunkId + 1);
      expect(Storage.get(i32ToBytes(chunkId))).toStrictEqual(
        unwrapStaticArray(data),
      );
    }

    expect(NB_CHUNKS.mustValue()).toStrictEqual(nbChunks);
    LAST_UPDATE_TIMESTAMP.mustValue();
  });
});
