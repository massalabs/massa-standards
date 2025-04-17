import {
  generateEvent,
  createSC,
  getOpData,
  call,
  functionExists,
  hasOpKey,
  generateRawEvent,
  Address,
} from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';

const CONSTRUCTOR = 'constructor';

/**
 * This function deploys and calls the constructor function of the deployed smart contract.
 *
 * The data structure of the operation datastore must be like describe in
 * packages/sc-deployer/src/index.ts
 *
 * @param _ - not used
 */
export function main(_: StaticArray<u8>): void {
  let nbSC = getNbSC();

  const deployedSC: Address[] = [];

  for (let i: u64 = 0; i < nbSC; i++) {
    const contractAddr = createSC(getScByteCode(i));

    if (functionExists(contractAddr, CONSTRUCTOR)) {
      call(contractAddr, CONSTRUCTOR, getConstructorArgs(i), getCoins(i));
    }

    generateEvent(`Contract deployed at address: ${contractAddr.toString()}`);
    deployedSC.push(contractAddr);
  }

  generateRawEvent(
    new Args().addSerializableObjectArray(deployedSC).serialize(),
  );
}

/**
 * Get the number of smart contract to deploy.
 * @returns The number of smart contract to deploy.
 * @throws if the number of smart contract is not defined.
 */
function getNbSC(): u64 {
  const key: StaticArray<u8> = [0];

  assert(
    hasOpKey(key),
    'The number of smart contracts to deploy is undefined.',
  );
  const raw = getOpData(key);
  return new Args(raw).mustNext<u64>('nbSC');
}

/**
 * Get the bytecode of the smart contract to deploy.
 * @param i - The index of the smart contract.
 * @returns The bytecode of the smart contract.
 * @throws if the bytecode of the smart contract is not defined.
 */
function getScByteCode(i: u64): StaticArray<u8> {
  const key = new Args().add(i + 1).serialize();
  assert(hasOpKey(key), `No bytecode found for contract number: ${i + 1}`);
  return getOpData(key);
}

/**
 * Get the arguments key of the constructor function of the smart contract to deploy.
 * @param i - The index of the smart contract.
 * @returns The arguments key of the constructor function.
 */
function argsKey(i: u64): StaticArray<u8> {
  const argsSubKey: StaticArray<u8> = [0];
  return new Args()
    .add(i + 1)
    .add(argsSubKey)
    .serialize();
}

/**
 * Get the arguments of the constructor function of the smart contract to deploy.
 * @param i - The index of the smart contract.
 * @returns The arguments of the constructor function.
 */
function getConstructorArgs(i: u64): Args {
  const keyArgs = argsKey(i);
  return hasOpKey(keyArgs) ? new Args(getOpData(argsKey(i))) : new Args();
}

/**
 * Get the coins key of the constructor function of the smart contract to deploy.
 * @param i - The index of the smart contract.
 * @returns The coins key of the constructor function.
 */
function coinsKey(i: u64): StaticArray<u8> {
  let coinsSubKey: StaticArray<u8> = [1];

  return new Args()
    .add(i + 1)
    .add(coinsSubKey)
    .serialize();
}

/**
 * Get the coins of the constructor function of the smart contract to deploy.
 * @param i - The index of the smart contract.
 * @returns The coins of the constructor function.
 */
function getCoins(i: u64): u64 {
  let keyCoins = coinsKey(i);

  return hasOpKey(keyCoins)
    ? new Args(getOpData(keyCoins)).next<u64>().unwrapOrDefault()
    : 0;
}
