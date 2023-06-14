import {
  Storage,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  bytesToString,
  bytesToU64,
  stringToBytes,
  u64ToBytes,
} from '@massalabs/as-types';
import {
  constructor,
  name,
  symbol,
  tokenURI,
  baseURI,
  totalSupply,
  mint,
  currentSupply,
  transfer,
  setURI,
  ownerOf,
  counterKey,
  initCounter,
  getApproved,
  approve,
  transferFrom,
} from '../NFT';

const callerAddress = 'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';

const userAddress = 'A12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1e8';

const NFTName = 'MASSA_NFT';
const NFTSymbol = 'NFT';
const NFTBaseURI = 'my.massa/';
const NFTtotalSupply: u64 = 5;

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
    expect(bytesToU64(Storage.get(counterKey))).toBe(initCounter);
  });

  test('get name', () => {
    expect(bytesToString(name())).toBe(NFTName);
  });
  test('get symbol', () => {
    expect(bytesToString(symbol())).toBe(NFTSymbol);
  });
  test('totalSupply call', () => {
    expect(bytesToU64(totalSupply())).toBe(NFTtotalSupply);
  });
  test('get baseURI', () => {
    expect(bytesToString(baseURI())).toBe(NFTBaseURI);
  });

  test('get current supply', () => {
    expect(bytesToU64(currentSupply())).toBe(0);
  });

  test('get tokenURI', () => {
    const tokenID = 1;
    expect(
      bytesToString(tokenURI(new Args().add<u64>(tokenID).serialize())),
    ).toBe('my.massa/1');
  });

  test('set URI', () => {
    const newURI = 'my.newMassaURI/';
    const tokenID = 1;
    setURI(new Args().add(newURI).serialize());
    expect(
      bytesToString(tokenURI(new Args().add<u64>(tokenID).serialize())),
    ).toBe('my.newMassaURI/1');
  });

  test('mint call, ownerOf and currentSupply call', () => {
    expect(bytesToU64(currentSupply())).toBe(0);
    for (let i: u64 = 0; i < NFTtotalSupply; i++) {
      mint(new Args().add(callerAddress).serialize());
    }
    expect(Storage.get(counterKey)).toStrictEqual(u64ToBytes(NFTtotalSupply));
    expect(bytesToU64(currentSupply())).toBe(NFTtotalSupply);
    expect(ownerOf(new Args().add<u64>(2).serialize())).toStrictEqual(
      stringToBytes(callerAddress),
    );
  });

  throws('we have reach max supply', () => {
    mint(new Args().add(callerAddress).serialize());
  });

  test('current supply call', () => {
    expect(bytesToU64(currentSupply())).toBe(NFTtotalSupply);
  });

  test('transfer call', () => {
    const tokenToSend: u64 = 2;

    transfer(new Args().add(userAddress).add(tokenToSend).serialize());

    expect(ownerOf(u64ToBytes(tokenToSend))).toStrictEqual(
      stringToBytes(userAddress),
    );
    expect(isAllowanceCleared(tokenToSend)).toBeTruthy();
  });

  test('approval', () => {
    const tokenId: u64 = 1;
    const addresses = ['2x', '3x'];

    addresses.forEach((address) => approveAddress(tokenId, address));
    const approvedAddressArray = getAllowedAddress(tokenId);

    expect(approvedAddressArray[0]).toStrictEqual(addresses[0]);
    expect(approvedAddressArray[1]).toStrictEqual(addresses[1]);
  });

  xtest('transferFrom', () => {
    const tokenId: u64 = 3;
    const addresses = ['2x', '3x'];

    addresses.forEach((address) => {
      approveAddress(tokenId, address);
    });

    expect(getAllowedAddress(tokenId)).toStrictEqual(addresses);

    const approvedAddressArray = getAllowedAddress(tokenId);

    expect(approvedAddressArray[0]).toStrictEqual(addresses[0]);
    expect(approvedAddressArray[1]).toStrictEqual(addresses[1]);

    transferFrom(
      new Args().add(addresses[0]).add(addresses[1]).add(tokenId).serialize(),
    );

    expect(isAllowanceCleared(tokenId)).toBeTruthy();
  });

  test('transferFrom fail if not allowed', () => {
    const tokenId: u64 = 4;

    expect(getAllowedAddress(tokenId)).toStrictEqual([]);
    expect(ownerOf(u64ToBytes(tokenId))).toStrictEqual(
      stringToBytes(callerAddress),
    );

    expect(() => {
      transferFrom(new Args().add('2x').add('3x').add(tokenId).serialize());
    }).toThrow();
  });
});

function isAllowanceCleared(tokenId: u64): boolean {
  return getAllowedAddress(tokenId).length === 0;
}

function getAllowedAddress(tokenId: u64): string[] {
  const allowedAddress = bytesToString(
    getApproved(new Args().add(tokenId).serialize()),
  );

  return allowedAddress === '' ? [] : allowedAddress.split(',');
}

function approveAddress(tokenId: u64, address: string): void {
  const args = new Args().add(tokenId).add(address).serialize();
  approve(args);
}
