import {
  changeCallStack,
  resetStorage,
  setDeployContext,
  Storage,
} from '@massalabs/massa-as-sdk';
import { boolToByte, stringToBytes, u256ToBytes } from '@massalabs/as-types';

import { u256 } from 'as-bignum/assembly';
import {
  _approve,
  _balanceOf,
  _constructor,
  _getApproved,
  _isApproved,
  _isApprovedForAll,
  _isAuthorized,
  _name,
  _ownerOf,
  _setApprovalForAll,
  _symbol,
  _transferFrom,
  _update,
  ALLOWANCE_KEY_PREFIX,
  OPERATOR_ALLOWANCE_KEY_PREFIX,
  balanceKey,
} from '../MRC721-internals';

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
  test('mint clears an allowance stored before the token exists', () => {
    const key = ALLOWANCE_KEY_PREFIX.concat(u256ToBytes(tokenId));
    Storage.set(key, stringToBytes(approved));
    _update(to, tokenId, zeroAddress);
    expect(_ownerOf(tokenId)).toBe(to);
    expect(_getApproved(tokenId)).toBe('');
  });
  test('deletes the balance entry when it reaches zero', () => {
    // mint to `caller` so the caller is authorized to transfer it away
    _update(caller, tokenId, zeroAddress);
    expect(Storage.has(balanceKey(caller))).toBe(true);
    // transfer the only token away: `caller` balance goes 1 -> 0
    _update(to, tokenId, zeroAddress);
    expect(_balanceOf(caller)).toBe(u256.Zero);
    // the zero-balance entry must be reclaimed, not left dangling
    expect(Storage.has(balanceKey(caller))).toBe(false);
    expect(_balanceOf(to)).toBe(u256.One);
  });
  test('keeps the balance entry when it stays above zero', () => {
    const tokenId2 = u256.fromU32(2);
    _update(caller, tokenId, zeroAddress);
    _update(caller, tokenId2, zeroAddress);
    // transfer one of two tokens: `caller` balance goes 2 -> 1
    _update(to, tokenId, zeroAddress);
    expect(_balanceOf(caller)).toBe(u256.One);
    expect(Storage.has(balanceKey(caller))).toBe(true);
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

  throws('Approving a token that does not exist should fail', () => {
    _approve(approved, tokenId);
  });

  test('a missing token is not authorized', () => {
    expect(_isAuthorized(caller, tokenId)).toBe(false);
  });

  // A grant stored by `setApprovalForAll('')` before the fix shares its key
  // with "the empty owner approved the caller for all".
  test('a legacy empty-operator grant does not authorize a missing token', () => {
    Storage.set(
      OPERATOR_ALLOWANCE_KEY_PREFIX.concat(stringToBytes(caller)),
      boolToByte(true),
    );
    expect(_isApprovedForAll(zeroAddress, caller)).toBe(true);
    expect(_isAuthorized(caller, tokenId)).toBe(false);
  });

  throws('a legacy empty-operator grant cannot approve a missing token', () => {
    Storage.set(
      OPERATOR_ALLOWANCE_KEY_PREFIX.concat(stringToBytes(caller)),
      boolToByte(true),
    );
    _approve(caller, tokenId);
  });

  throws('an allowance stored before mint cannot transfer the token', () => {
    Storage.set(
      ALLOWANCE_KEY_PREFIX.concat(u256ToBytes(tokenId)),
      stringToBytes(approved),
    );
    _update(to, tokenId, zeroAddress);
    switchUser(approved);
    _transferFrom(to, approved, tokenId);
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

  throws('setting an empty operator should fail', () => {
    _setApprovalForAll(zeroAddress, true);
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
