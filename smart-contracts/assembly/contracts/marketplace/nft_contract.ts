import {
  Args,
  bytesToU256,
  stringToBytes,
  u256ToBytes,
} from '@massalabs/as-types';
import {
  Address,
  Context,
  Storage,
  generateEvent,
  transferCoins,
} from '@massalabs/massa-as-sdk';

import { u256 } from 'as-bignum';
import {
  nameKey,
  symbolKey,
  totalSupplyKey,
  baseURIKey,
  ownerKey,
  counterKey,
  initCounter,
  ownerTokenKey,
  nft1_transferFrom,
} from '../NFT';
import {
  _currentSupply,
  _increment,
  _updateBalanceOf,
  _onlyOwner,
} from '../NFT/NFT-internals';

export const mintPriceKey = 'mintPrice';
export const mintHistoryKey = 'mintHistory_';

// Override to add mint price
export function constructor(binaryArgs: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  assert(Context.isDeployingContract());

  const args = new Args(binaryArgs);
  const name = args.nextString().expect('name argument is missing or invalid');
  const symbol = args
    .nextString()
    .expect('symbol argument is missing or invalid');
  const totalSupply = args
    .nextU256()
    .expect('totalSupply argument is missing or invalid');
  const baseURI = args
    .nextString()
    .expect('baseURI argument is missing or invalid');
  const mintPrice = args
    .nextU64()
    .expect('mintPrice argument is missing or invalid');

  Storage.set(nameKey, name);
  Storage.set(symbolKey, symbol);
  Storage.set(totalSupplyKey, u256ToBytes(totalSupply));
  Storage.set(baseURIKey, baseURI);
  Storage.set(ownerKey, Context.caller().toString());
  Storage.set(counterKey, u256ToBytes(initCounter));
  Storage.set(mintPriceKey, mintPrice.toString());
}

// Used to get the owner of the NFT from the Args instead of the caller
export function delegated_constructor(binaryArgs: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  assert(Context.isDeployingContract());

  const args = new Args(binaryArgs);
  const name = args.nextString().expect('name argument is missing or invalid');
  const symbol = args
    .nextString()
    .expect('symbol argument is missing or invalid');
  const totalSupply = args
    .nextU256()
    .expect('totalSupply argument is missing or invalid');
  const baseURI = args
    .nextString()
    .expect('baseURI argument is missing or invalid');
  const mintPrice = args
    .nextU64()
    .expect('mintPrice argument is missing or invalid');
  const owner = args
    .nextString()
    .expect('owner argument is missing or invalid');

  Storage.set(nameKey, name);
  Storage.set(symbolKey, symbol);
  Storage.set(totalSupplyKey, u256ToBytes(totalSupply));
  Storage.set(baseURIKey, baseURI);
  Storage.set(ownerKey, owner);
  Storage.set(counterKey, u256ToBytes(initCounter));
  Storage.set(mintPriceKey, mintPrice.toString());
}

// Override NFT tokenURI function to target BaseURI
export function nft1_tokenURI(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const tokenId = args
    .nextU256()
    .expect('token id argument is missing or invalid')
    .toString();
  return stringToBytes(Storage.get(baseURIKey));
}

// Override NFT mint function to add mint price
export function nft1_mint(_args: StaticArray<u8>): void {
  assert(
    bytesToU256(Storage.get(totalSupplyKey)) > _currentSupply(),
    'Max supply reached',
  );

  let price = U64.parseInt(Storage.get(mintPriceKey));
  assert(
    Context.transferredCoins() >= price,
    'Not enough sent coins to mint this NFT',
  );
  let owner = Storage.get(ownerKey);
  transferCoins(new Address(owner), price);

  const args = new Args(_args);

  const mintAddress = args
    .nextString()
    .expect('mintAddress argument is missing or invalid');

  // TODO:  Check Address validity
  _increment();

  const tokenToMint = _currentSupply().toString();

  const key = ownerTokenKey + tokenToMint;

  Storage.set(key, mintAddress);

  _updateBalanceOf(mintAddress, true);

  generateEvent('[ICO_QUEST] MINT: ' + Context.caller().toString());

  Storage.set(
    mintHistoryKey + tokenToMint,
    mintAddress +
      '_' +
      tokenToMint +
      '_' +
      price.toString() +
      '_' +
      Context.timestamp().toString(),
  );
}

export function nft1_mintPrice(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  return stringToBytes(Storage.get(mintPriceKey));
}

export function nft1_setMintPrice(binaryArgs: StaticArray<u8>): void {
  assert(_onlyOwner(), 'The caller is not the owner of the contract');

  const args = new Args(binaryArgs);
  const mintPrice = args
    .nextU64()
    .expect('mintPrice argument is missing or invalid');

  Storage.set(mintPriceKey, mintPrice.toString());
}

export function nft1_mintHistory(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  const currentToken: u256 = _currentSupply() - new u256(1);
  const global_history: string[] = [];
  for (let i: u256 = new u256(0); i < currentToken; i++) {
    let history = Storage.get(mintHistoryKey + i.toString());
    if (history != null) {
      continue;
    }
    global_history.push(history);
  }
  return new Args().add<Array<string>>(global_history).serialize();
}

export function multiMint(_args: StaticArray<u8>): void {
  const args = new Args(_args);
  const nbToMint = args
    .nextU256()
    .expect('nbToMint argument is missing or invalid');

  const mintAddress = args
    .nextString()
    .expect('mintAddress argument is missing or invalid');

  for (let i: u256 = new u256(0); i < nbToMint; i++) {
    let args = new Args();
    args.add(mintAddress);
    nft1_mint(args.serialize());
  }
}

export function multiTransfer(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const toAddress = args
    .nextString()
    .expect('toAddress argument is missing or invalid');
  const tokenIds = args
    .nextFixedSizeArray<u256>()
    .expect('tokenIds argument is missing or invalid');
  for (let i: i32 = 0; i < tokenIds.length; i++) {
    let args = new Args();
    args.add(toAddress);
    args.add(tokenIds[i]);
    nft1_transferFrom(args.serialize());
  }
}
