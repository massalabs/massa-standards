import {
  Storage,
  Context,
  generateEvent,
  callerHasWriteAccess,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  bytesToU64,
  stringToBytes,
  u64ToBytes,
} from '@massalabs/as-types';

export const nameKey = 'name';
export const symbolKey = 'symbol';
export const totalSupplyKey = stringToBytes('totalSupply');
export const baseURIKey = 'baseURI';
export const ownerKey = 'Owner';
export const counterKey = stringToBytes('Counter');
export const ownerTokenKey = 'ownerOf_';
export const initCounter = 0;

/**
 * Initialize all the properties of the NFT (contract Owner, counter to 0...)
 *
 * @remarks
 * Storage specification:
 * - 'name' =\> (string) the token name
 * - 'symbol' =\> (string) the token symbol
 * - 'totalSupply' =\> (StaticArray<u8>) the total supply
 * - 'baseURI' =\> (string) the base URI (must ends with '/')
 * - 'Owner' =\> (string) the owner address
 * - 'Counter' =\> (StaticArray<u8>) the current counter
 * - 'ownerOf_[token id]' =\> (string) the owner of the specified token id
 *
 * @example
 * ```typescript
 * constructor(
 *   new Args()
 *     .add(NFTName)
 *     .add(NFTSymbol)
 *     .add(u64(NFTtotalSupply))
 *     .add(NFTBaseURI)
 *     .serialize(),
 *   );
 * ```
 *
 * @param binaryArgs - arguments serialized with `Args` containing the name, the symbol, the totalSupply as u64,
 * the baseURI
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  assert(callerHasWriteAccess());

  const args = new Args(binaryArgs);
  const name = args.nextString().expect('name argument is missing or invalid');
  const symbol = args
    .nextString()
    .expect('symbol argument is missing or invalid');
  const totalSupply = args
    .nextU64()
    .expect('totalSupply argument is missing or invalid');
  const baseURI = args
    .nextString()
    .expect('baseURI argument is missing or invalid');

  Storage.set(nameKey, name);
  Storage.set(symbolKey, symbol);
  Storage.set(totalSupplyKey, u64ToBytes(totalSupply));
  Storage.set(baseURIKey, baseURI);
  Storage.set(ownerKey, Context.caller().toByteString());
  Storage.set(counterKey, u64ToBytes(initCounter));

  generateEvent(
    `${name} with symbol ${symbol} and total supply of ${totalSupply.toString()} is well set`,
  );
}

/**
 * Change the base URI, can be only called by the contract Owner
 * @param binaryArgs - Serialized URI String with `Args`
 */
export function setURI(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const newBaseURI = args
    .nextString()
    .expect('BaseURI argument is missing or invalid');

  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  Storage.set(baseURIKey, newBaseURI);
  generateEvent(`new base URI ${newBaseURI} well set`);
}

// ======================================================== //
// ====                 TOKEN ATTRIBUTES               ==== //
// ======================================================== //

// Token attributes functions return a generateEvent when possible for more readability as we cannot return string

/**
 * Returns the NFT's name
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 */
export function name(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return stringToBytes(Storage.get(nameKey));
}

/**
 * Returns the NFT's symbol
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 */
export function symbol(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return stringToBytes(Storage.get(symbolKey));
}

/**
 * Returns the token URI (external link written in NFT where pictures or others are stored)
 * @param binaryArgs - U64 serialized tokenID with `Args`
 */
export function tokenURI(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const tokenId = args
    .nextU64()
    .expect('token id argument is missing or invalid');

  return stringToBytes(Storage.get(baseURIKey) + tokenId.toString());
}

/**
 * Returns the base URI
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 */
export function baseURI(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return stringToBytes(Storage.get(baseURIKey));
}

/**
 * Returns the max supply possible
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns the u64 max supply
 */
export function totalSupply(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return Storage.get(totalSupplyKey);
}

/**
 * Return the current supply.
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns the u64 current counter
 */
export function currentSupply(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return Storage.get(counterKey);
}

/**
 * Return the tokenId's owner
 * @param _args - tokenId serialized with `Args` as u64
 * @returns serialized Address as string
 */
export function ownerOf(_args: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_args);
  const tokenId = args
    .nextU64()
    .expect('tokenId argument is missing or invalid');

  const key = ownerTokenKey + tokenId.toString();

  assert(Storage.has(key), `token ${tokenId.toString()} not yet minted`);

  return stringToBytes(Storage.get(key));
}

// ==================================================== //
// ====                    MINT                    ==== //
// ==================================================== //

/**
 * The argument's address becomes the owner of the next token (if current tokenID = 10, will mint the 11 )
 * Check if max supply is not reached
 * @param _args - Address as string serialized with `Args`
 */
export function mint(_args: StaticArray<u8>): void {
  assert(
    bytesToU64(Storage.get(totalSupplyKey)) > _currentSupply(),
    'Max supply reached',
  );
  const args = new Args(_args);
  const mintAddress = args
    .nextString()
    .expect('mintAddress argument is missing or invalid');
  _increment();
  const tokenToMint = _currentSupply().toString();
  const key = ownerTokenKey + tokenToMint;
  Storage.set(key, mintAddress);
  generateEvent(`tokenId ${tokenToMint} minted to ${mintAddress} `);
}

/**
 * Increment the NFT counter
 */
function _increment(): void {
  const currentID = bytesToU64(Storage.get(counterKey));
  Storage.set(counterKey, u64ToBytes(currentID + 1));
}

/**
 * @returns true if the caller is the creator of the SC
 */
function _onlyOwner(): bool {
  return Context.caller().toByteString() == Storage.get(ownerKey);
}

/**
 * @param tokenId - the tokenID
 * @returns true if the caller is token's owner
 */
function _onlyTokenOwner(tokenId: u64): bool {
  // as we need to compare two byteArrays, we need to compare the pointers
  // we transform our byte array to their pointers and we compare them
  const left = ownerOf(u64ToBytes(tokenId));
  return (
    memory.compare(
      changetype<usize>(left),
      changetype<usize>(stringToBytes(Context.caller().toByteString())),
      left.length,
    ) == 0
  );
}

/**
 * Internal function returning the currentSupply
 * @returns u64
 */
function _currentSupply(): u64 {
  return bytesToU64(Storage.get(counterKey));
}

// ==================================================== //
// ====                 TRANSFER                   ==== //
// ==================================================== //

/**
 * Transfer a chosen token from the caller to the to Address.
 * First check that the token is minted and that the caller owns the token.
 * @param binaryArgs - arguments serialized with `Args` containing the following data in this order :
 * - the recipient's account (address)
 * - the tokenID (u64).
 */
export function transfer(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const toAddress = args
    .nextString()
    .expect('toAddress argument is missing or invalid');
  const tokenId = args
    .nextU64()
    .expect('tokenId argument is missing or invalid');

  assert(
    Storage.has(ownerTokenKey + tokenId.toString()),
    `Token ${tokenId.toString()} not yet minted`,
  );
  assert(
    _onlyTokenOwner(tokenId),
    `You are not the owner of ${tokenId.toString()}`,
  );

  Storage.set(ownerTokenKey + tokenId.toString(), toAddress);

  generateEvent(
    `token ${tokenId.toString()} sent from ${Context.caller().toByteString()} to ${toAddress}`,
  );
}
