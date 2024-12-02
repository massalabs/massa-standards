import {
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';

import {
  Args,
  byteToBool,
  bytesToString,
  bytesToU256,
} from '@massalabs/as-types';
import { u256 } from 'as-bignum/assembly';
import {
  approve,
  balanceOf,
  burn,
  constructor,
  getApproved,
  isApprovedForAll,
  mint,
  name,
  ownerAddress,
  ownerOf,
  setApprovalForAll,
  symbol,
  totalSupply,
  transferFrom,
} from '../NFTEnumerable-example';

import { getOwnedTokens } from './helpers';

const NFTName = 'MASSA_NFT';
const NFTSymbol = 'NFT';
const contractOwner = 'A12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';
const tokenAddress = 'AS12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';
const from = 'AU12CzoKEASaeBHnxGLnHDG2u73dLzWWfgvW6bc4L1UfMA5Uc5Fg7';
const to = 'AU178qZCfaNXkz9tQiXJcVfAEnYGJ27UoNtFFJh3BiT8jTfY8P2D';
const approved = 'AU1sF3HSa7fcBoE12bE1Eq2ohKqcRPBHuNRmdqAMfw8WEkHCU3aF';
const zeroAddress = '';
const tokenIds = [
  u256.One,
  u256.fromU32(2),
  u256.fromU32(3),
  u256.fromU32(4),
  u256.fromU32(5),
];

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + tokenAddress);
}

beforeEach(() => {
  resetStorage();
  switchUser(contractOwner);
  setDeployContext(contractOwner);
  constructor(new Args().add(NFTName).add(NFTSymbol).serialize());
});

describe('NFT Enumerable Contract', () => {
  describe('Initialization', () => {
    test('should return correct name and symbol', () => {
      expect(name()).toBe(NFTName);
      expect(symbol()).toBe(NFTSymbol);
    });
    test('should return correct contract owner', () => {
      expect(bytesToString(ownerAddress([]))).toBe(contractOwner);
    });
  });

  describe('Minting', () => {
    test('should mint a token to an address', () => {
      mint(new Args().add(to).add(tokenIds[0]).serialize());
      expect(
        bytesToString(ownerOf(new Args().add(tokenIds[0]).serialize())),
      ).toBe(to);
      expect(
        bytesToU256(balanceOf(new Args().add(to).serialize())),
      ).toStrictEqual(u256.One);
      expect(bytesToU256(totalSupply([]))).toStrictEqual(u256.One);
    });

    test('should mint multiple tokens to different addresses', () => {
      mint(new Args().add(to).add(tokenIds[0]).serialize());
      mint(new Args().add(from).add(tokenIds[1]).serialize());
      expect(
        bytesToU256(balanceOf(new Args().add(to).serialize())),
      ).toStrictEqual(u256.One);
      expect(
        bytesToU256(balanceOf(new Args().add(from).serialize())),
      ).toStrictEqual(u256.One);
      expect(bytesToU256(totalSupply([]))).toStrictEqual(u256.fromU32(2));
    });

    test('should not mint to zero address', () => {
      expect(() => {
        mint(new Args().add(zeroAddress).add(tokenIds[0]).serialize());
      }).toThrow('Unauthorized to');
    });

    test('should not mint an already existing tokenId', () => {
      mint(new Args().add(to).add(tokenIds[0]).serialize());
      expect(() => {
        mint(new Args().add(to).add(tokenIds[0]).serialize());
      }).toThrow('Token already minted');
    });

    test('should not allow non-owner to mint tokens', () => {
      switchUser(from);
      expect(() => {
        mint(new Args().add(to).add(tokenIds[0]).serialize());
      }).toThrow('Only owner can call this function');
    });
  });

  describe('Approval', () => {
    test('should approve a token for an address', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(from);
      approve(new Args().add(approved).add(tokenIds[0]).serialize());
      expect(
        bytesToString(getApproved(new Args().add(tokenIds[0]).serialize())),
      ).toBe(approved);
    });

    test('should set approval for all', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(from);
      setApprovalForAll(new Args().add(approved).add(true).serialize());
      expect(
        byteToBool(
          isApprovedForAll(new Args().add(from).add(approved).serialize()),
        ),
      ).toBe(true);
    });

    test('should revoke approval for all', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(from);
      setApprovalForAll(new Args().add(approved).add(true).serialize());
      setApprovalForAll(new Args().add(approved).add(false).serialize());
      expect(
        byteToBool(
          isApprovedForAll(new Args().add(from).add(approved).serialize()),
        ),
      ).toBe(false);
    });

    test('should not approve token not owned', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(approved);
      expect(() => {
        approve(new Args().add(approved).add(tokenIds[0]).serialize());
      }).toThrow('Unauthorized caller');
    });
  });

  describe('Transfers', () => {
    test('should transfer token from owner', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(from);
      transferFrom(new Args().add(from).add(to).add(tokenIds[0]).serialize());
      expect(
        bytesToString(ownerOf(new Args().add(tokenIds[0]).serialize())),
      ).toBe(to);
      expect(
        bytesToU256(balanceOf(new Args().add(to).serialize())),
      ).toStrictEqual(u256.One);
      expect(
        bytesToU256(balanceOf(new Args().add(from).serialize())),
      ).toStrictEqual(u256.Zero);
    });

    test('should transfer approved token', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(from);
      approve(new Args().add(approved).add(tokenIds[0]).serialize());
      switchUser(approved);
      transferFrom(new Args().add(from).add(to).add(tokenIds[0]).serialize());
      expect(
        bytesToString(ownerOf(new Args().add(tokenIds[0]).serialize())),
      ).toBe(to);
    });

    test('should transfer token using approval for all', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(from);
      setApprovalForAll(new Args().add(approved).add(true).serialize());
      switchUser(approved);
      transferFrom(new Args().add(from).add(to).add(tokenIds[0]).serialize());
      expect(
        bytesToString(ownerOf(new Args().add(tokenIds[0]).serialize())),
      ).toBe(to);
    });

    test('should not transfer token without approval', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(approved);
      expect(() => {
        transferFrom(new Args().add(from).add(to).add(tokenIds[0]).serialize());
      }).toThrow('Unauthorized caller');
    });
  });

  describe('Burning', () => {
    test('should burn a token', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(from);
      burn(new Args().add(tokenIds[0]).serialize());

      expect(ownerOf(new Args().add(tokenIds[0]).serialize())).toStrictEqual(
        [],
      );

      expect(bytesToU256(totalSupply([]))).toStrictEqual(u256.Zero);
    });

    test('should burn a token with approval', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(from);
      approve(new Args().add(approved).add(tokenIds[0]).serialize());
      switchUser(approved);
      burn(new Args().add(tokenIds[0]).serialize());
      expect(ownerOf(new Args().add(tokenIds[0]).serialize())).toStrictEqual(
        [],
      );
      expect(bytesToU256(totalSupply([]))).toStrictEqual(u256.Zero);
    });

    test('should burn a token using approval for all', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(from);
      setApprovalForAll(new Args().add(approved).add(true).serialize());
      switchUser(approved);
      burn(new Args().add(tokenIds[0]).serialize());
      expect(ownerOf(new Args().add(tokenIds[0]).serialize())).toStrictEqual(
        [],
      );
      expect(bytesToU256(totalSupply([]))).toStrictEqual(u256.Zero);
    });

    test('should not burn token without approval', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(to);
      expect(() => {
        burn(new Args().add(tokenIds[0]).serialize());
      }).toThrow('Unauthorized caller');
    });
  });

  describe('Enumeration', () => {
    test('should return correct total supply', () => {
      expect(bytesToU256(totalSupply([]))).toStrictEqual(u256.Zero);
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      expect(bytesToU256(totalSupply([]))).toStrictEqual(u256.One);
      mint(new Args().add(to).add(tokenIds[1]).serialize());
      expect(bytesToU256(totalSupply([]))).toStrictEqual(u256.fromU32(2));
    });

    test('should return correct tokens owned by an address', () => {
      // Assuming we have an exported function to get owned tokens
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      mint(new Args().add(from).add(tokenIds[1]).serialize());
      mint(new Args().add(to).add(tokenIds[2]).serialize());

      // Get tokens owned by 'from' address
      const fromTokens = getOwnedTokens(from);
      expect(fromTokens.length).toBe(2);
      expect(fromTokens).toContainEqual(tokenIds[0]);
      expect(fromTokens).toContainEqual(tokenIds[1]);

      // Get tokens owned by 'to' address
      const toTokens = getOwnedTokens(to);
      expect(toTokens.length).toBe(1);
      expect(toTokens).toContainEqual(tokenIds[2]);
    });

    test('should update owned tokens after transfer', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      mint(new Args().add(from).add(tokenIds[1]).serialize());
      switchUser(from);
      transferFrom(new Args().add(from).add(to).add(tokenIds[0]).serialize());

      // Get tokens owned by 'from' address
      const fromTokens = getOwnedTokens(from);
      expect(fromTokens.length).toBe(1);
      expect(fromTokens).toContainEqual(tokenIds[1]);

      // Get tokens owned by 'to' address
      const toTokens = getOwnedTokens(to);
      expect(toTokens.length).toBe(1);
      expect(toTokens).toContainEqual(tokenIds[0]);
    });

    test('should update owned tokens after burn', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      mint(new Args().add(from).add(tokenIds[1]).serialize());
      switchUser(from);
      burn(new Args().add(tokenIds[0]).serialize());

      // Get tokens owned by 'from' address
      const fromTokens = getOwnedTokens(from);
      expect(fromTokens.length).toBe(1);
      expect(fromTokens).toContainEqual(tokenIds[1]);

      // Total supply should be updated
      expect(bytesToU256(totalSupply([]))).toStrictEqual(u256.One);
    });
  });
});
