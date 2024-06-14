import { Args, stringToBytes, u256ToBytes } from '@massalabs/as-types';
import { Context, Storage } from '@massalabs/massa-as-sdk';
import { u256 } from 'as-bignum';
import {
  nameKey,
  symbolKey,
  totalSupplyKey,
  baseURIKey,
  ownerKey,
  counterKey,
  initCounter,
  nft1_mint,
} from '../NFT';

export * from '../NFT/NFT';

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

  // GIVE 2 NFT TO THE CONTRACT's OWNER
  let nbToMint = new u256(2);
  let mintAddress = Context.caller().toString();
  for (let i: u256 = new u256(0); i < nbToMint; i++) {
    let args = new Args();
    args.add(mintAddress);
    nft1_mint(args.serialize());
  }
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
