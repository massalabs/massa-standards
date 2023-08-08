import {
  Storage,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  bytesToString,
  bytesToU256,
  bytesToU64,
  stringToBytes,
  u256ToBytes,
  u64ToBytes,
} from '@massalabs/as-types';
import {
  constructor,
  nft1_name,
  nft1_symbol,
  nft1_tokenURI,
  nft1_baseURI,
  nft1_totalSupply,
  nft1_mint,
  nft1_currentSupply,
  nft1_setURI,
  nft1_ownerOf,
  counterKey,
  initCounter,
  nft1_getApproved,
  nft1_approve,
  nft1_transferFrom,
} from '../NFT';
import { u256 } from 'as-bignum/assembly';

const callerAddress = 'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';

const userAddress = 'A12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1e8';

const NFTName = 'MASSA_NFT';
const NFTSymbol = 'NFT';
const NFTBaseURI = 'my.massa/';
const NFTtotalSupply: u256 = new u256(5);

describe('NFT contract', () => {
  beforeAll(() => {
    resetStorage();
    setDeployContext(callerAddress);
    constructor(
      new Args()
        .add(NFTName)
        .add(NFTSymbol)
        .add(NFTtotalSupply)
        .add(NFTBaseURI)
        .serialize(),
    );
  });

  test('initialized', () => {
    expect(bytesToU256(Storage.get(counterKey))).toBe(initCounter);
  });

  test('get name', () => {
    expect(bytesToString(nft1_name())).toBe(NFTName);
  });
  test('get symbol', () => {
    expect(bytesToString(nft1_symbol())).toBe(NFTSymbol);
  });
  test('totalSupply call', () => {
    expect(bytesToU256(nft1_totalSupply())).toBe(NFTtotalSupply);
  });
  test('get baseURI', () => {
    expect(bytesToString(nft1_baseURI())).toBe(NFTBaseURI);
  });

  test('get current supply', () => {
    expect(bytesToU256(nft1_currentSupply())).toBe(new u256(0));
  });

  test('get tokenURI', () => {
    const tokenID = new u256(1);
    expect(
      bytesToString(nft1_tokenURI(new Args().add<u256>(tokenID).serialize())),
    ).toBe('my.massa/1');
  });

  test('set URI', () => {
    const newURI = 'my.newMassaURI/';
    const tokenID = new u256(1);
    nft1_setURI(new Args().add(newURI).serialize());
    expect(
      bytesToString(nft1_tokenURI(new Args().add<u256>(tokenID).serialize())),
    ).toBe('my.newMassaURI/1');
  });

  test('mint call, ownerOf and currentSupply call', () => {
    expect(bytesToU256(nft1_currentSupply())).toBe(u256.Zero);
    for (let i: u64 = 0; i < NFTtotalSupply.toU64(); i++) {
      nft1_mint(new Args().add(callerAddress).serialize());
    }
    expect(Storage.get(counterKey)).toStrictEqual(u256ToBytes(NFTtotalSupply));
    expect(bytesToU256(nft1_currentSupply())).toBe(NFTtotalSupply);
    expect(
      nft1_ownerOf(new Args().add<u256>(u256.fromU64(2)).serialize()),
    ).toStrictEqual(stringToBytes(callerAddress));
  });

  throws('we have reach max supply', () => {
    nft1_mint(new Args().add(callerAddress).serialize());
  });

  test('current supply call', () => {
    expect(bytesToU256(nft1_currentSupply())).toBe(NFTtotalSupply);
  });

  test('approval', () => {
    const tokenId = new u256(1);

    let address = '2x';
    approveAddress(tokenId, address);
    let approvedAddress = getAllowedAddress(tokenId);
    expect(approvedAddress).toStrictEqual(address);

    address = '3x';
    approveAddress(tokenId, address);
    approvedAddress = getAllowedAddress(tokenId);
    expect(approvedAddress).toStrictEqual(address);
  });

  test('transferFrom', () => {
    const tokenId = new u256(3);
    let address = '2x';
    let recipient = '3x';

    approveAddress(tokenId, address);
    expect(getAllowedAddress(tokenId)).toStrictEqual(address);
    let approvedAddress = getAllowedAddress(tokenId);

    expect(approvedAddress).toStrictEqual(address);

    nft1_transferFrom(
      new Args().add(callerAddress).add(recipient).add(tokenId).serialize(),
    );
    expect(isAllowanceCleared(tokenId)).toBeTruthy();
    expect(nft1_ownerOf(u256ToBytes(tokenId))).toStrictEqual(
      stringToBytes(recipient),
    );
  });

  throws('transferFrom fail if not allowed', () => {
    const tokenId = new u256(4);
    expect(getAllowedAddress(tokenId)).toStrictEqual('');
    expect(nft1_ownerOf(u256ToBytes(tokenId))).toStrictEqual(
      stringToBytes(callerAddress),
    );

    nft1_transferFrom(
      new Args().add('2x').add('3x').add(new u256(4)).serialize(),
    );
  });
});

function isAllowanceCleared(tokenId: u256): boolean {
  return getAllowedAddress(tokenId).length === 0;
}

function getAllowedAddress(tokenId: u256): string {
  const allowedAddress = bytesToString(
    nft1_getApproved(new Args().add(tokenId).serialize()),
  );

  return allowedAddress;
}

function approveAddress(tokenId: u256, address: string): void {
  const args = new Args().add(tokenId).add(address).serialize();
  nft1_approve(args);
}
