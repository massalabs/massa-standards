import {
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import {
  name,
  symbol,
  constructor,
  mint,
  ownerOf,
  balanceOf,
  approve,
  getApproved,
  setApprovalForAll,
  isApprovedForAll,
  transferFrom,
  burn,
  ownerAddress,
} from '../NFT-example';
import {
  Args,
  byteToBool,
  bytesToString,
  bytesToU256,
} from '@massalabs/as-types';
import { u256 } from 'as-bignum/assembly';

const NFTName = 'MASSA_NFT';
const NFTSymbol = 'NFT';
const contractOwner = 'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';
const tokenAddress = 'AS12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';
const from = 'AU12CzoKEASaeBHnxGLnHDG2u73dLzWWfgvW6bc4L1UfMA5Uc5Fg7';
const to = 'AU178qZCfaNXkz9tQiXJcVfAEnYGJ27UoNtFFJh3BiT8jTfY8P2D';
const approved = 'AU1sF3HSa7fcBoE12bE1Eq2ohKqcRPBHuNRmdqAMfw8WEkHCU3aF';
const newOwner = 'AU12F7y3PWpw72XcwhSksJztRiTSqAvLxaLacP2qDYhNUEfEXuG4T';
const zeroAddress = '';
const tokenId = u256.One;

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + tokenAddress);
}

beforeEach(() => {
  resetStorage();
  setDeployContext(contractOwner);
  constructor(new Args().add(NFTName).add(NFTSymbol).serialize());
  switchUser(contractOwner);
});

describe('Initialization', () => {
  test('get name', () => {
    expect(name()).toBe(NFTName);
  });
  test('get symbol', () => {
    expect(symbol()).toBe(NFTSymbol);
  });
  test('get owner', () => {
    expect(bytesToString(ownerAddress([]))).toBe(contractOwner);
  });
});

describe('Minting', () => {
  test('Mint token to an address', () => {
    switchUser(contractOwner);
    mint(new Args().add(to).add(tokenId).serialize());
    expect(bytesToString(ownerOf(new Args().add(tokenId).serialize()))).toBe(
      to,
    );
    expect(
      bytesToU256(balanceOf(new Args().add(to).serialize())),
    ).toStrictEqual(u256.One);
  });
  throws('Minting from not owner should fail', () => {
    switchUser(from);
    mint(new Args().add(to).add(tokenId).serialize());
  });
  throws('Minting to zero address should fail', () => {
    mint(new Args().add(zeroAddress).add(tokenId).serialize());
  });
  throws('Minting an already existing tokenId should fail', () => {
    mint(new Args().add(to).add(tokenId).serialize());
    mint(new Args().add(to).add(tokenId).serialize());
  });
  test('Mint multiple tokens to an address', () => {
    mint(new Args().add(to).add(tokenId).serialize());
    mint(new Args().add(to).add(new u256(2)).serialize());
    expect(
      bytesToU256(balanceOf(new Args().add(to).serialize())),
    ).toStrictEqual(new u256(2));
  });
  test('Mint multiple tokens to different addresses', () => {
    mint(new Args().add(to).add(tokenId).serialize());
    mint(new Args().add(from).add(new u256(2)).serialize());
    expect(
      bytesToU256(balanceOf(new Args().add(to).serialize())),
    ).toStrictEqual(u256.One);
    expect(
      bytesToString(ownerOf(new Args().add(new u256(2)).serialize())),
    ).toBe(from);
    expect(
      bytesToU256(balanceOf(new Args().add(from).serialize())),
    ).toStrictEqual(u256.One);
    expect(bytesToString(ownerOf(new Args().add(tokenId).serialize()))).toBe(
      to,
    );
  });
});

describe('Approval', () => {
  test('Approve token for an address', () => {
    mint(new Args().add(from).add(tokenId).serialize());
    switchUser(from);
    approve(new Args().add(approved).add(tokenId).serialize());
    expect(
      bytesToString(getApproved(new Args().add(tokenId).serialize())),
    ).toBe(approved);
  });
  test('ApproveForAll for operator and owner', () => {
    mint(new Args().add(from).add(tokenId).serialize());
    switchUser(from);
    setApprovalForAll(new Args().add(approved).add(true).serialize());
    expect(
      byteToBool(
        isApprovedForAll(new Args().add(from).add(approved).serialize()),
      ),
    ).toBe(true);
  });
  throws('Approve token of not owned token should fail', () => {
    mint(new Args().add(from).add(tokenId).serialize());
    switchUser(approved);
    approve(new Args().add(approved).add(tokenId).serialize());
  });
});

describe('Transfers', () => {
  test('Transfer token from owner', () => {
    mint(new Args().add(from).add(tokenId).serialize());
    switchUser(from);
    transferFrom(new Args().add(from).add(to).add(tokenId).serialize());
  });
  throws('Transfer not owned or approved token should fail', () => {
    mint(new Args().add(from).add(tokenId).serialize());
    switchUser(from);
    transferFrom(new Args().add(to).add(newOwner).add(tokenId).serialize());
  });
  test('Transfer approved token', () => {
    mint(new Args().add(from).add(tokenId).serialize());
    switchUser(from);
    approve(new Args().add(approved).add(tokenId).serialize());
    switchUser(approved);
    transferFrom(new Args().add(from).add(to).add(tokenId).serialize());
    expect(bytesToString(ownerOf(new Args().add(tokenId).serialize()))).toBe(
      to,
    );
  });
  test('Transfer approvedForAll token', () => {
    mint(new Args().add(from).add(tokenId).serialize());
    switchUser(from);
    setApprovalForAll(new Args().add(approved).add(true).serialize());
    switchUser(approved);
    transferFrom(new Args().add(from).add(to).add(tokenId).serialize());
    expect(bytesToString(ownerOf(new Args().add(tokenId).serialize()))).toBe(
      to,
    );
  });
});

describe('burn', () => {
  test('burn token', () => {
    mint(new Args().add(from).add(tokenId).serialize());
    switchUser(from);
    burn(new Args().add(tokenId).serialize());
    expect(bytesToString(ownerOf(new Args().add(tokenId).serialize()))).toBe(
      '',
    );
  });
  test('burn token with approval', () => {
    mint(new Args().add(from).add(tokenId).serialize());
    switchUser(from);
    approve(new Args().add(approved).add(tokenId).serialize());
    switchUser(approved);
    burn(new Args().add(tokenId).serialize());
    expect(bytesToString(ownerOf(new Args().add(tokenId).serialize()))).toBe(
      '',
    );
  });
  test('burn token with approvalForAll', () => {
    mint(new Args().add(from).add(tokenId).serialize());
    switchUser(from);
    setApprovalForAll(new Args().add(approved).add(true).serialize());
    switchUser(approved);
    burn(new Args().add(tokenId).serialize());
    expect(bytesToString(ownerOf(new Args().add(tokenId).serialize()))).toBe(
      '',
    );
  });
  throws('burn not owned or approved token should fail', () => {
    mint(new Args().add(from).add(tokenId).serialize());
    switchUser(to);
    burn(new Args().add(tokenId).serialize());
  });
});
