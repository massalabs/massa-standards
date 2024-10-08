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
  KeyIncrementer,
  ConstantManager,
  transferCoins,
  balanceOf,
  setBytecode,
} from '@massalabs/massa-as-sdk';
import { Args, i32ToBytes } from '@massalabs/as-types';
import { onlyOwner } from '../utils';
import { _setOwner } from '../utils/ownership-internal';

const KEYER = new KeyIncrementer();

export const FIRST_CREATION_DATE = new ConstantManager<u64>(KEYER);
export const LAST_UPDATE_TIMESTAMP = new ConstantManager<u64>(KEYER);
export const NB_CHUNKS = new ConstantManager<i32>(KEYER);
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
  FIRST_CREATION_DATE.set(Context.timestamp());
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

  const result = NB_CHUNKS.tryValue();

  const totalChunks = result.isOk() ? result.unwrap() : 0;
  if (chunkNb >= totalChunks) {
    NB_CHUNKS.set(chunkNb + 1);
  }

  generateEvent(
    `Website chunk ${chunkNb} deployed to ${Context.callee().toString()}`,
  );
  LAST_UPDATE_TIMESTAMP.set(Context.timestamp());
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

  const nbChunks = NB_CHUNKS.mustValue();

  for (let i: i32 = 0; i < nbChunks; i++) {
    const key = i32ToBytes(i);
    if (Storage.has(key)) {
      Storage.del(key);
    }
  }
  Storage.del(NB_CHUNKS.key);
  Storage.del(LAST_UPDATE_TIMESTAMP.key);

  transferCoins(Context.caller(), balanceOf(Context.callee().toString()));
  generateEvent(`Website ${Context.callee().toString()} deleted successfully`);
}

/**
 * Upgrade the smart contract bytecode
 * @param args - new bytecode
 * @returns void
 */
export function upgradeSC(args: StaticArray<u8>): void {
  onlyOwner();
  setBytecode(args);
}
