import { Args, stringToBytes } from '@massalabs/as-types';
import {
  createSC,
  generateEvent,
  fileToByteArray,
  call,
  Context,
} from '@massalabs/massa-as-sdk';
import { OWNER_KEY } from '../utils/ownership-internal';

const baseCostBytes = 4;
const StorageCostPerByte = 100_000;

/**
 * Creates a new smart contract with the websiteDeployer.wasm file content.
 *
 * @param _ - not used
 */
export function main(_: StaticArray<u8>): void {
  const bytes: StaticArray<u8> = fileToByteArray('./build/websiteStorer.wasm');

  const websiteAddr = createSC(bytes);

  const StorageKeyLen = stringToBytes(OWNER_KEY).length;
  const StorageValueLen = stringToBytes(Context.caller().toString()).length;

  // cost of storing owner key
  const coins =
    StorageCostPerByte * (baseCostBytes + StorageKeyLen + StorageValueLen);

  call(websiteAddr, 'constructor', new Args(), coins);

  generateEvent(`Contract deployed at address: ${websiteAddr.toString()}`);
}
