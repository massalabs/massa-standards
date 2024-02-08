import {
  Address,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import {
  Args,
} from '@massalabs/as-types';

import { u256 } from 'as-bignum/assembly';
import * as NFT from '../NFT-internals';


const callerAddress = 'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';
const from = 'AU12CzoKEASaeBHnxGLnHDG2u73dLzWWfgvW6bc4L1UfMA5Uc5Fg7';
const to = 'AU178qZCfaNXkz9tQiXJcVfAEnYGJ27UoNtFFJh3BiT8jTfY8P2D';
const approvedAddress = 'AU1sF3HSa7fcBoE12bE1Eq2ohKqcRPBHuNRmdqAMfw8WEkHCU3aF';
const newOwner = 'AU12F7y3PWpw72XcwhSksJztRiTSqAvLxaLacP2qDYhNUEfEXuG4T';
const tokenId = u256.One;
const owner = new Address(callerAddress);
const operator = new Address(to);

const NFTName = 'MASSA_NFT';
const NFTSymbol = 'NFT';

beforeEach(() => {
  resetStorage();
  setDeployContext(callerAddress);
  NFT._constructor(new Args().add(NFTName).add(NFTSymbol).serialize());
});

describe('Initialization', () => {
  test('get name', () => {
    expect(NFT._name()).toBe(NFTName);
  });
  test('get symbol', () => {
    expect(NFT._symbol()).toBe(NFTSymbol);
  });
});

describe('update', () => {
  test('mint an nft', () => {
    NFT._update(new Address(to), tokenId, new Address());
    expect(NFT._balanceOf(new Address(to))).toBe(tokenId);
    expect(NFT._ownerOf(tokenId)).toBe(new Address(to));
  });
});

describe('Approval', () => {
  test('approve an address', () => {
    NFT._update(new Address(callerAddress), tokenId, new Address());
    NFT._approve(new Address(approvedAddress), tokenId);
    const approved = NFT._getApproved(tokenId);
    expect(approved).toBe(new Address(approvedAddress));
  });

  test('check if address is approved', () => {
    NFT._update(new Address(callerAddress), tokenId, new Address());
    NFT._approve(new Address(approvedAddress), tokenId);
    const isApproved = NFT._isApproved(new Address(approvedAddress), tokenId);
    expect(isApproved).toBe(true);
  });
});

describe('Operator Approval', () => {
  test('set approval for all', () => {
    NFT._setApprovalForAll(operator, true);
    const isApprovedForAll = NFT._isApprovedForAll(owner, operator);
    expect(isApprovedForAll).toBe(true);
  });

  test('revoke approval for all', () => {
    NFT._setApprovalForAll(operator, false);
    const isApprovedForAll = NFT._isApprovedForAll(owner, operator);
    expect(isApprovedForAll).toBe(false);
  });
});

describe('Transferring NFTs', () => {
  test('safeTransferFrom without approval fails', () => {
    expect(() => {
      NFT._safeTransferFrom(new Address(from), new Address(newOwner), tokenId);
    }).toThrow('Unauthorized');
  });

  test('safeTransferFrom with approval succeeds', () => {
    NFT._update(new Address(callerAddress), tokenId, new Address());
    NFT._approve(new Address(from), tokenId);
    NFT._safeTransferFrom(new Address(from), new Address(newOwner), tokenId);
    
    const ownerOfToken = NFT._ownerOf(tokenId);
    expect(ownerOfToken.toString()).toBe(newOwner);
    
    const balanceOfNewOwner = NFT._balanceOf(new Address(newOwner));
    expect(balanceOfNewOwner).toBe(u256.One);
    
    const balanceOfOldOwner = NFT._balanceOf(new Address(from));
    expect(balanceOfOldOwner).toBe(u256.Zero);
  });
});
