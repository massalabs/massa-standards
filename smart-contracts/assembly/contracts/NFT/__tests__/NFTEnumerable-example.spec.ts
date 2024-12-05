import {
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';

import {
  Args,
  NoArg,
  byteToBool,
  bytesToString,
  bytesToU256,
  stringToBytes,
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
  constructor(NoArg.serialize());
});

describe('NFT Enumerable Contract', () => {
  describe('Initialization', () => {
    it('should return correct name and symbol', () => {
      expect(name()).toStrictEqual(stringToBytes(NFTName));
      expect(symbol()).toStrictEqual(stringToBytes(NFTSymbol));
    });
    it('should return correct contract owner', () => {
      expect(bytesToString(ownerAddress([]))).toBe(contractOwner);
    });
  });

  describe('Minting', () => {
    it('should mint a token to an address', () => {
      mint(new Args().add(to).add(tokenIds[0]).serialize());
      expect(
        bytesToString(ownerOf(new Args().add(tokenIds[0]).serialize())),
      ).toBe(to);
      expect(
        bytesToU256(balanceOf(new Args().add(to).serialize())),
      ).toStrictEqual(u256.One);
      expect(bytesToU256(totalSupply([]))).toStrictEqual(u256.One);
    });

    it('should mint multiple tokens to different addresses', () => {
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

    it('should not mint to an invalid address', () => {
      expect(() => {
        mint(new Args().add(zeroAddress).add(tokenIds[0]).serialize());
      }).toThrow('Unauthorized to');
    });

    it('should not mint an already existing tokenId', () => {
      mint(new Args().add(to).add(tokenIds[0]).serialize());
      expect(() => {
        mint(new Args().add(to).add(tokenIds[0]).serialize());
      }).toThrow('Token already minted');
    });

    it('should not allow non-owner to mint tokens', () => {
      switchUser(from);
      expect(() => {
        mint(new Args().add(to).add(tokenIds[0]).serialize());
      }).toThrow('Only owner can call this function');
    });
  });

  describe('Approval', () => {
    it('should approve a token for an address', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(from);
      approve(new Args().add(approved).add(tokenIds[0]).serialize());
      expect(
        bytesToString(getApproved(new Args().add(tokenIds[0]).serialize())),
      ).toBe(approved);
    });

    it('should set approval for all', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(from);
      setApprovalForAll(new Args().add(approved).add(true).serialize());
      expect(
        byteToBool(
          isApprovedForAll(new Args().add(from).add(approved).serialize()),
        ),
      ).toBe(true);
    });

    it('should revoke approval for all', () => {
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

    it('should not approve token not owned', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(approved);
      expect(() => {
        approve(new Args().add(approved).add(tokenIds[0]).serialize());
      }).toThrow('Unauthorized caller');
    });
  });

  describe('Transfers', () => {
    it('should transfer token from owner', () => {
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

    it('should transfer approved token', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(from);
      approve(new Args().add(approved).add(tokenIds[0]).serialize());
      switchUser(approved);
      transferFrom(new Args().add(from).add(to).add(tokenIds[0]).serialize());
      expect(
        bytesToString(ownerOf(new Args().add(tokenIds[0]).serialize())),
      ).toBe(to);
    });

    it('should transfer token using approval for all', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(from);
      setApprovalForAll(new Args().add(approved).add(true).serialize());
      switchUser(approved);
      transferFrom(new Args().add(from).add(to).add(tokenIds[0]).serialize());
      expect(
        bytesToString(ownerOf(new Args().add(tokenIds[0]).serialize())),
      ).toBe(to);
    });

    it('should not transfer token without approval', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(approved);
      expect(() => {
        transferFrom(new Args().add(from).add(to).add(tokenIds[0]).serialize());
      }).toThrow('Unauthorized caller');
    });
  });

  describe('Burning', () => {
    it('should burn a token', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(from);
      burn(new Args().add(tokenIds[0]).serialize());

      expect(ownerOf(new Args().add(tokenIds[0]).serialize())).toStrictEqual(
        [],
      );

      expect(bytesToU256(totalSupply([]))).toStrictEqual(u256.Zero);
    });

    it('should burn a token with approval', () => {
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

    it('should burn a token using approval for all', () => {
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

    it('should not burn token without approval', () => {
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      switchUser(to);
      expect(() => {
        burn(new Args().add(tokenIds[0]).serialize());
      }).toThrow('Unauthorized caller');
    });
  });

  describe('Enumeration', () => {
    it('should return correct total supply', () => {
      expect(bytesToU256(totalSupply([]))).toStrictEqual(u256.Zero);
      mint(new Args().add(from).add(tokenIds[0]).serialize());
      expect(bytesToU256(totalSupply([]))).toStrictEqual(u256.One);
      mint(new Args().add(to).add(tokenIds[1]).serialize());
      expect(bytesToU256(totalSupply([]))).toStrictEqual(u256.fromU32(2));
    });

    it('should return correct tokens owned by an address', () => {
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

    it('should update owned tokens after transfer', () => {
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

    it('should update owned tokens after burn', () => {
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
