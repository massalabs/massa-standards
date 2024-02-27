import {
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';

import { u256 } from 'as-bignum/assembly';
import {
  _approve,
  _balanceOf,
  _constructor,
  _getApproved,
  _isApproved,
  _isApprovedForAll,
  _name,
  _ownerOf,
  _setApprovalForAll,
  _symbol,
  _transferFrom,
  _update,
} from '../NFT-internals';

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
  _constructor(NFTName, NFTSymbol);
});

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + tokenAddress);
}

describe('Initialization', () => {
  test('get name', () => {
    expect(_name()).toBe(NFTName);
  });
  test('get symbol', () => {
    expect(_symbol()).toBe(NFTSymbol);
  });
});

describe('update', () => {
  test('mint an nft', () => {
    _update(to, tokenId, zeroAddress);
    expect(_balanceOf(to)).toBe(tokenId);
    expect(_ownerOf(tokenId)).toBe(to);
  });
  throws('Minting to zero address should fail', () => {
    _update(zeroAddress, tokenId, zeroAddress);
  });
  throws('Minting an already existing tokenId should fail', () => {
    _update(to, tokenId, zeroAddress);
    _update(to, tokenId, zeroAddress);
  });
});

describe('Approval', () => {
  test('approve an address', () => {
    _update(caller, tokenId, zeroAddress);
    _approve(approved, tokenId);
    const _approved = _getApproved(tokenId);
    expect(_approved).toBe(approved);
  });

  test('check if address is approved', () => {
    _update(caller, tokenId, zeroAddress);
    _approve(approved, tokenId);
    const isApproved = _isApproved(approved, tokenId);
    expect(isApproved).toBe(true);
  });

  test('Approving zero address should revoke approval', () => {
    _update(caller, tokenId, zeroAddress);
    _approve(zeroAddress, tokenId);
    const _approved = _getApproved(tokenId);
    expect(_approved).toBe('');
  });

  throws('Approving a token one does not own should fail', () => {
    _update(to, tokenId, zeroAddress);
    switchUser(from);
    _approve(approved, tokenId);
  });
});

describe('Operator Approval', () => {
  test('should not be approved for all', () => {
    const isApprovedForAll = _isApprovedForAll(caller, to);
    expect(isApprovedForAll).toBe(false);
  });
  test('set approval for all', () => {
    _setApprovalForAll(to, true);
    const isApprovedForAll = _isApprovedForAll(caller, to);
    expect(isApprovedForAll).toBe(true);
  });

  test('revoke approval for all', () => {
    _setApprovalForAll(to, true);
    _setApprovalForAll(to, false);
    const isApprovedForAll = _isApprovedForAll(caller, to);
    expect(isApprovedForAll).toBe(false);
  });
});

describe('Transferring NFTs', () => {
  test('transferFrom with approval succeeds', () => {
    _update(caller, tokenId, zeroAddress);
    _approve(from, tokenId);
    switchUser(from);
    _transferFrom(caller, newOwner, tokenId);

    const ownerOfToken = _ownerOf(tokenId);
    expect(ownerOfToken).toBe(newOwner);

    const balanceOfNewOwner = _balanceOf(newOwner);
    expect(balanceOfNewOwner).toBe(u256.One);

    const balanceOfOldOwner = _balanceOf(from);
    expect(balanceOfOldOwner).toBe(u256.Zero);
  });
  throws('Transferring a non-existent token should fail', () => {
    _transferFrom(from, to, tokenId);
  });

  throws('Transferring from incorrect owner should fail', () => {
    _update(to, tokenId, zeroAddress);
    _transferFrom(from, newOwner, tokenId);
  });

  throws('Transferring without approval should fail', () => {
    _update(caller, tokenId, zeroAddress);
    switchUser(from);
    _transferFrom(caller, newOwner, tokenId);
  });
});
