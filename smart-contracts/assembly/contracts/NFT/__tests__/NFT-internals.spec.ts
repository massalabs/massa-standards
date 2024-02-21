import {
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';

import { u256 } from 'as-bignum/assembly';
import * as internals from '../NFT-internals';

const tokenAddress = 'AS12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';
const caller = 'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';
const from = 'AU12CzoKEASaeBHnxGLnHDG2u73dLzWWfgvW6bc4L1UfMA5Uc5Fg7';
const to = 'AU178qZCfaNXkz9tQiXJcVfAEnYGJ27UoNtFFJh3BiT8jTfY8P2D';
const approved = 'AU1sF3HSa7fcBoE12bE1Eq2ohKqcRPBHuNRmdqAMfw8WEkHCU3aF';
const newOwner = 'AU12F7y3PWpw72XcwhSksJztRiTSqAvLxaLacP2qDYhNUEfEXuG4T';
const zeroAddress = '';
const tokenId = u256.One;

const NFTName = 'MASSA_NFT';
const NFTSymbol = 'NFT';

beforeEach(() => {
  resetStorage();
  setDeployContext(caller);
  internals._constructor(NFTName, NFTSymbol);
});

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + tokenAddress);
}

describe('Initialization', () => {
  test('get name', () => {
    expect(internals._name()).toBe(NFTName);
  });
  test('get symbol', () => {
    expect(internals._symbol()).toBe(NFTSymbol);
  });
});

describe('update', () => {
  test('mint an nft', () => {
    internals._update(to, tokenId, zeroAddress);
    expect(internals._balanceOf(to)).toBe(tokenId);
    expect(internals._ownerOf(tokenId)).toBe(to);
  });
  throws('Minting to zero address should fail', () => {
    internals._update(zeroAddress, tokenId, zeroAddress);
  });
  throws('Minting an already existing tokenId should fail', () => {
    internals._update(to, tokenId, zeroAddress);
    internals._update(to, tokenId, zeroAddress);
  });
});

describe('Approval', () => {
  test('approve an address', () => {
    internals._update(caller, tokenId, zeroAddress);
    internals._approve(approved, tokenId);
    const _approved = internals._getApproved(tokenId);
    expect(_approved).toBe(approved);
  });

  test('check if address is approved', () => {
    internals._update(caller, tokenId, zeroAddress);
    internals._approve(approved, tokenId);
    const isApproved = internals._isApproved(approved, tokenId);
    expect(isApproved).toBe(true);
  });

  throws('Approving zero address should fail', () => {
    internals._update(caller, tokenId, zeroAddress);
    internals._approve(zeroAddress, tokenId);
  });

  throws('Approving a token one does not own should fail', () => {
    internals._update(to, tokenId, zeroAddress);
    switchUser(from);
    internals._approve(approved, tokenId);
  });
});

describe('Operator Approval', () => {
  test('should not be approved for all', () => {
    const isApprovedForAll = internals._isApprovedForAll(caller, to);
    expect(isApprovedForAll).toBe(false);
  });
  test('set approval for all', () => {
    internals._setApprovalForAll(to, true);
    const isApprovedForAll = internals._isApprovedForAll(caller, to);
    expect(isApprovedForAll).toBe(true);
  });

  test('revoke approval for all', () => {
    internals._setApprovalForAll(to, true);
    internals._setApprovalForAll(to, false);
    const isApprovedForAll = internals._isApprovedForAll(caller, to);
    expect(isApprovedForAll).toBe(false);
  });
});

describe('Transferring NFTs', () => {
  test('safeTransferFrom with approval succeeds', () => {
    internals._update(caller, tokenId, zeroAddress);
    internals._approve(from, tokenId);
    switchUser(from);
    internals._safeTransferFrom(caller, newOwner, tokenId);

    const ownerOfToken = internals._ownerOf(tokenId);
    expect(ownerOfToken).toBe(newOwner);

    const balanceOfNewOwner = internals._balanceOf(newOwner);
    expect(balanceOfNewOwner).toBe(u256.One);

    const balanceOfOldOwner = internals._balanceOf(from);
    expect(balanceOfOldOwner).toBe(u256.Zero);
  });
  throws('Transferring a non-existent token should fail', () => {
    internals._safeTransferFrom(from, to, tokenId);
  });

  throws('Transferring from incorrect owner should fail', () => {
    internals._update(to, tokenId, zeroAddress);
    internals._safeTransferFrom(from, newOwner, tokenId);
  });

  throws('Transferring without approval should fail', () => {
    internals._update(caller, tokenId, zeroAddress);
    switchUser(from);
    internals._safeTransferFrom(caller, newOwner, tokenId);
  });
});
