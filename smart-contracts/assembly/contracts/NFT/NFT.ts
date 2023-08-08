import {
  Storage,
  Context,
  generateEvent,
  callerHasWriteAccess,
  Address,
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
export const approvedTokenKey = 'approved_';
export const approvedForAllTokenKey = 'approvedForAll_';
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
  Storage.set(ownerKey, Context.caller().toString());
  Storage.set(counterKey, u64ToBytes(initCounter));
}

/**
 * Change the base URI, can be only called by the contract Owner
 * @param binaryArgs - Serialized URI String with `Args`
 */
export function nft1_setURI(binaryArgs: StaticArray<u8>): void {
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
export function nft1_name(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return stringToBytes(Storage.get(nameKey));
}

/**
 * Returns the NFT's symbol
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 */
export function nft1_symbol(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return stringToBytes(Storage.get(symbolKey));
}

/**
 * Returns the token URI (external link written in NFT where pictures or others are stored)
 * @param binaryArgs - U64 serialized tokenID with `Args`
 */
export function nft1_tokenURI(binaryArgs: StaticArray<u8>): StaticArray<u8> {
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
export function nft1_baseURI(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return stringToBytes(Storage.get(baseURIKey));
}

/**
 * Returns the max supply possible
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns the u64 max supply
 */
export function nft1_totalSupply(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return Storage.get(totalSupplyKey);
}

/**
 * Return the current supply.
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns the u64 current counter
 */
export function nft1_currentSupply(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return Storage.get(counterKey);
}

/**
 * Return the tokenId's owner
 * @param _args - tokenId serialized with `Args` as u64
 * @returns serialized Address as string
 */
export function nft1_ownerOf(_args: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_args);
  const tokenId = args
    .nextU64()
    .expect('tokenId argument is missing or invalid');

  const key = ownerTokenKey + tokenId.toString();

  assertIsMinted(tokenId.toString());

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
export function nft1_mint(_args: StaticArray<u8>): void {
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
  return Context.caller().toString() == Storage.get(ownerKey);
}

/**
 * @param tokenId - the tokenID
 * @returns true if the caller is token's owner
 */
function _isTokenOwner(address: string, tokenId: u64): bool {
  // as we need to compare two byteArrays, we need to compare the pointers
  // we transform our byte array to their pointers and we compare them
  const left = nft1_ownerOf(u64ToBytes(tokenId));
  return (
    memory.compare(
      changetype<usize>(left),
      changetype<usize>(stringToBytes(address)),
      left.length,
    ) == 0
  );
}

/**
 * @param tokenId - the tokenID
 * @returns true if the token is minted
 */
function _onlyMinted(tokenId: string): bool {
  return Storage.has(ownerTokenKey + tokenId);
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

function _transfer(
  caller: string,
  owner: string,
  recipient: string,
  tokenId: u64,
): void {
  assertIsMinted(tokenId.toString());
  assertIsOwner(owner, tokenId);
  assertNotSelfTransfer(owner, recipient);
  assertIsApproved(owner, caller, tokenId);

  _removeApproval(tokenId);

  Storage.set(ownerTokenKey + tokenId.toString(), recipient);

  generateEvent(
    `token ${tokenId.toString()} sent from ${owner} to ${recipient}`,
  );
}

/**
 * Transfer a chosen token from the from Address to the to Address.
 * First check that the token is minted and that the caller is allowed to transfer the token.
 * @param binaryArgs - arguments serialized with `Args` containing the following data in this order :
 * - the owner's account (address)
 * - the recipient's account (address)
 * - the tokenID (u64).
 * @throws if the token is not minted or if the caller is not allowed to transfer the token
 */
export function nft1_transferFrom(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const caller = Context.caller().toString();
  const owner = args
    .nextString()
    .expect('fromAddress argument is missing or invalid');
  const recipient = args
    .nextString()
    .expect('toAddress argument is missing or invalid');
  const tokenId = args
    .nextU64()
    .expect('tokenId argument is missing or invalid');

  _transfer(caller, owner, recipient, tokenId);
}

/**
 * Approves another address to transfer the given token ID.
 * @param binaryArgs - arguments serialized with `Args` containing the following data in this order:
 * - the owner's - owner address
 * - the spenderAddress - spender address
 * - the tokenID (u64)
 */
export function nft1_approve(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const callerAddress = Context.caller().toString();

  const tokenId = args
    .nextU64()
    .expect('tokenId argument is missing or invalid');

  const toAddress = new Address(
    args.nextString().expect('toAddress argument is missing or invalid'),
  );

  _approve(tokenId, callerAddress, toAddress.toString());

  generateEvent(
    `token ${tokenId.toString()} approved by ${Context.caller().toString()} for ${toAddress}`,
  );
}

/**
 * Store the approved address for a token
 *
 * @param owner - owner address
 * @param spenderAddress - spender address
 * @param tokenId - The token ID to approve
 */
function _approve(tokenId: u64, owner: string, spenderAddress: string): void {
  const id = tokenId.toString();
  assertIsMinted(id);
  assertIsOwner(owner, tokenId);
  assert(!_isApproved(spenderAddress, tokenId), 'Already approved');

  const key = approvedTokenKey + id;
  Storage.set(key, spenderAddress);
}

/**
 * Removes the approval of the token
 * @param tokenId - the tokenID
 */
function _removeApproval(tokenId: u64): void {
  const key = approvedTokenKey + tokenId.toString();
  if (Storage.has(key)) {
    Storage.del(key);
  }
}

/**
 * Return if the address is approved to transfer the tokenId
 * @param binaryArgs - arguments serialized with `Args` containing the following data in this order :
 * - the address (string)
 * - the tokenID (u64)
 * @returns true if the address is approved to transfer the tokenId, false otherwise
 */
export function nft1_getApproved(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const address = args
    .nextString()
    .expect('address argument is missing or invalid');
  const tokenId = args
    .nextU64()
    .expect('tokenId argument is missing or invalid');

  return stringToBytes(_getApproved(tokenId));
}

function _getApproved(tokenId: u64): string {
  const key = approvedTokenKey + tokenId.toString();

  if (!Storage.has(key)) return '';

  return Storage.get(key);
}

function _isApproved(address: string, tokenId: u64): bool {
  if (address.length === 0) return false;
  const approvedAddress = _getApproved(tokenId);
  return approvedAddress === address;
}

export function nft1_approveForAll(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const ownerAddress = Context.caller();
  const operatorAddress = new Address(
    args.nextString().expect('operatorAddress argument is missing or invalid'),
  );
  const approved = args
    .nextBool()
    .expect('approved argument is missing or invalid');

  _setApprovalForAll(
    ownerAddress.toString(),
    operatorAddress.toString(),
    approved,
  );

  generateEvent(
    `operator ${operatorAddress.toString()} approved for all ${Context.caller().toString()}`,
  );
}

function _setApprovalForAll(
  owner: string,
  operator: string,
  approved: bool,
): void {
  assert(owner != operator, 'Not allowed to set approval for all for yourself');

  const key = approvedForAllTokenKey + owner + operator;

  Storage.set(key, approved.toString());
}

export function nft1_isApprovedForAll(binaryArgs: StaticArray<u8>): bool {
  const args = new Args(binaryArgs);

  const ownerAddress = args
    .nextString()
    .expect('ownerAddress argument is missing or invalid');
  const operatorAddress = args
    .nextString()
    .expect('operatorAddress argument is missing or invalid');

  return _isApprovedForAll(ownerAddress, operatorAddress);
}

function _isApprovedForAll(owner: string, operator: string): bool {
  const key = approvedForAllTokenKey + owner + operator;

  if (!Storage.has(key)) return false;

  const approved = Storage.get(key);

  return approved == 'true';
}

// ==================================================== //
// ====             General Assertions             ==== //
// ==================================================== //

function assertIsMinted(tokenId: string): void {
  assert(_onlyMinted(tokenId), `Token ${tokenId.toString()} is not minted`);
}

function assertIsOwner(address: string, tokenId: u64): void {
  assert(
    _isTokenOwner(address, tokenId),
    `The provided address is not the owner of ${tokenId.toString()}`,
  );
}

function assertIsApproved(owner: string, caller: string, tokenId: u64): void {
  assert(
    _isApproved(caller, tokenId) ||
      _isApprovedForAll(owner, caller) ||
      owner === caller,
    'This address is not allowed to transfer this token',
  );
}

function assertNotSelfTransfer(owner: string, recipient: string): void {
  assert(
    owner != recipient,
    'The owner and the recipient must be different addresses',
  );
}
