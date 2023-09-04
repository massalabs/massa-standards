import { Args, stringToBytes } from '@massalabs/as-types';
import {
  createSC,
  generateEvent,
  fileToByteArray,
  call,
  Context,
} from '@massalabs/massa-as-sdk';

/**
 * Creates a new smart contract with the websiteDeployer.wasm file content.
 *
 * @param _ - not used
 */
export function main(_: StaticArray<u8>): void {
  const bytes: StaticArray<u8> = fileToByteArray('./build/websiteStorer.wasm');

  const websiteAddr = createSC(bytes);

  const StorageCostPerByte = 1_000_000;
  const StorageKeyCreation = 10 * StorageCostPerByte;
  // this will be updated when charging storage key for actual size
  // const StorageKeyCreation = stringToBytes(OWNER_KEY).length * StorageCostPerByte;

  // cost of storing owner key
  const coins =
    StorageKeyCreation +
    StorageCostPerByte * stringToBytes(Context.caller().toString()).length;

  call(websiteAddr, 'constructor', new Args(), coins);

  generateEvent(`Contract deployed at address: ${websiteAddr.toString()}`);
}
