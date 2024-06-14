/**
 * Website Storer Smart Contract.
 *
 * This smart contract is designed to manage the storage and retrieval of website chunks.
 * It provides functionalities to append new chunks, and delete the entire website data.
 * Only the owner of the contract can perform these operations.
 */

import {
  Storage,
  Context,
  generateEvent,
  isDeployingContract,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  bytesToI32,
  bytesToU64,
  i32ToBytes,
  stringToBytes,
  u64ToBytes,
} from '@massalabs/as-types';
import { onlyOwner } from '../utils';
import { _setOwner } from '../utils/ownership-internal';

export const NB_CHUNKS_KEY = stringToBytes('NB_CHUNKS');
export const NONCE_KEY = stringToBytes('NONCE');

/**
 * Constructor function that initializes the contract owner.
 *
 * @param _ - Unused parameter.
 *
 * @throws Will throw an error if the the context is not a SC deployment.
 */
export function constructor(_: StaticArray<u8>): void {
  assert(isDeployingContract());
  _setOwner(Context.caller().toString());
}

/**
 * Appends a new chunk to the website data.
 *
 * @param binaryArgs - Binary arguments containing the chunk number and chunk data.
 *
 * @throws Will throw an error if the caller is not the owner or if the arguments are invalid.
 *
 * Emits an event upon successful appending of the chunk.
 */
export function appendBytesToWebsite(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  const args = new Args(binaryArgs);
  const chunkNb = args.nextI32().expect('chunk number is missing or invalid');
  const chunkData = args.nextBytes().expect('chunkData is missing or invalid');

  Storage.set(i32ToBytes(chunkNb), chunkData);

  const totalChunks: i32 = Storage.has(NB_CHUNKS_KEY)
    ? bytesToI32(Storage.get(NB_CHUNKS_KEY))
    : 0;
  if (chunkNb >= totalChunks) {
    Storage.set(NB_CHUNKS_KEY, i32ToBytes(chunkNb + 1));
  }

  // if we are uploading a new website version, increment the nonce
  if (!totalChunks) {
    let nonce: u64 = Storage.has(NONCE_KEY)
      ? bytesToU64(Storage.get(NONCE_KEY)) + 1
      : 0;
    Storage.set(NONCE_KEY, u64ToBytes(nonce));
  }

  generateEvent(
    `Website chunk ${chunkNb} deployed to ${Context.callee().toString()}`,
  );
}

/**
 * Deletes all the chunks and metadata related to the website.
 *
 * @param _ - Unused parameter.
 *
 * @throws Will throw an error if the caller is not the owner or if the website has not been uploaded yet.
 *
 * Emits an event upon successful deletion of the website.
 */
export function deleteWebsite(_: StaticArray<u8>): void {
  onlyOwner();

  assert(Storage.has(NB_CHUNKS_KEY), 'Website not uploaded yet');
  const nbChunks = bytesToI32(Storage.get(NB_CHUNKS_KEY));

  for (let i: i32 = 0; i < nbChunks; i++) {
    const key = i32ToBytes(i);
    if (Storage.has(key)) {
      Storage.del(key);
    }
  }
  Storage.del(NB_CHUNKS_KEY);

  // increment nonce
  let nonce: u64 = bytesToU64(Storage.get(NONCE_KEY));
  Storage.set(NONCE_KEY, u64ToBytes(++nonce));

  generateEvent(`Website ${Context.callee().toString()} deleted successfully`);
}
