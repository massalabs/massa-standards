/**
 * Website deployer implementation by MassaLabs.
 *
 * This first very simple version of a website deployer.
 *
 * The idea is to initialize a smart contract address to store a website by chunk.
 *
 * The address datastore is used to persist all the information in the following way:
 * - the expected number of chunks
 * The key (total_chunks) and the value (u64) are both encoded using Args.
 * - the chunks themselves
 * The key ("massa_web_" concatenated with the chunk id) and the value (uint8array) are both encoded using Args.
 * - the website metadata
 * The key ("Meta") and the values (two timestamps - creation and last updated dates) are also encoded using Args.
 */
import { Storage, Context, generateEvent } from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';
import { triggerError } from '../utils';

const metadataKey = new Args().add('META');
const ownerKey = 'owner';

export const keyExpectedNbChunks = new Args().add('total_chunks');

// we do not create constructor function for now
// because it's Thyra that performs an ExecuteSC with the main-WebsiteDeployer wasm file.

/**
 * This function is doing the following:
 * 		- Set the the first chunk of a website
 * 		- Block Upload if not dnsName owner
 * 		- Save the creation timestamp
 *
 * @param binaryArgs - expected number of chunks as a u64 binary encoded using Args
 *
 */
export function initializeWebsite(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const expectedNbChunks = args
    .nextU64()
    .expect('expectedNbChunks is missing or invalid');
  const expectedNbChunksBytes = new Args().add(expectedNbChunks);

  // we set the ownership of the contract
  setOwnership();

  // we check the website's owner
  if (!checkOwnership()) {
    triggerError('Caller not the website Owner');
  }

  Storage.set(keyExpectedNbChunks, expectedNbChunksBytes);

  // add creation date to metadata
  if (!Storage.has(metadataKey)) {
    const timestamp = Context.timestamp();

    // metadata is composed of:
    // - a creation date
    // - a last update
    const metadataValue = new Args().add(timestamp).add(timestamp);
    Storage.set(metadataKey, metadataValue);
  }

  generateEvent(
    `Website initialized on ${Context.callee().toString()} with Total chunk ${expectedNbChunks}`,
  );
}

/**
 * This function is doing the following:
 *    - Add a chunk to the newly created key massa_web_\{chunkId\}. Chunk and chunkId are sent arguments
 * 		- Block Upload if not dnsName owner
 * 		- Update the update date timestamp
 *
 * @param binaryArgs - chunk id (u64), content (uint8Array)
 *
 */
export function appendBytesToWebsite(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const chunkId = args.nextU64().expect('chunkID is missing or invalid');
  const chunkIdSerialized = new Args().add(`massa_web_${chunkId.toString()}`);
  const chunkValue = new Args().add(
    args.nextUint8Array().expect('chunkValue is missing or invalid'),
  );

  if (!checkOwnership()) {
    triggerError('Caller is not the owner of this website');
  }
  if (!Storage.has(metadataKey)) {
    triggerError(
      'Web site not initialized. This action can be performed by calling ' +
        'the function initializeWebsite() of this smart contract.',
    );
  }

  setLastUpdate();

  Storage.set(chunkIdSerialized, chunkValue);
  generateEvent(
    `Website chunk deployed to ${Context.callee().toString()} on key ${chunkId}`,
  );
}

/**
 * Sets the owner of this website.
 * Does nothing if the owner already exists. No update possible for the moment.
 */
function setOwnership(): void {
  if (!Storage.has(ownerKey)) {
    Storage.set(ownerKey, Context.caller().toString());
  }
}

/**
 * Checks if the caller of the contract is the contract owner
 * @returns bool
 */
function checkOwnership(): bool {
  if (Storage.has(ownerKey)) {
    return Storage.get(ownerKey) == Context.caller().toString();
  }
  return false;
}

/**
 * Updates the date of the last update field of the website meta data.
 */
function setLastUpdate(): void {
  const old = Storage.get(metadataKey);
  const current = new Args()
    .add(old.nextU64().unwrap())
    .add(Context.timestamp());
  Storage.set(metadataKey, current);
}
